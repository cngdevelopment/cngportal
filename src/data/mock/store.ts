import "server-only";
import {
  MOCK_PRODUCTS,
  MOCK_COLORS,
  MOCK_ACCOUNT,
  MOCK_SHIP_TO,
  MOCK_USERS,
  findProduct,
  findColor,
  type MockProduct,
} from "./catalog-data";
import { nextStatus, previousStep, type PipelineStatus } from "@/lib/pipeline/buildPipeline";
import type { OrderStatus } from "@/types/domain";
import { formatOrderNumber } from "@/config/business";

/**
 * In-memory demo backend. Stands in for Prisma/Postgres while no
 * DATABASE_URL is configured (src/lib/mode.ts). State lives for the life
 * of the dev server process — restarting `next dev` resets it back to
 * the seed below. Every function here mirrors the shape/behavior the
 * real src/data/*.ts + Prisma layer will have once real credentials are
 * added, so callers don't need to branch on mode themselves.
 */

export type { OrderStatus };

export interface MockOrderItem {
  id: string;
  productId: string;
  colorId: string | null;
  assembly: "ASSEMBLED" | "UNASSEMBLED" | null;
  selectedOptions: Record<string, string> | null;
  quantity: number;
  unit: "EACH" | "BOX";
  lineNotes: string | null;
  productNameSnapshot: string;
  colorNameSnapshot: string | null;
  skuSnapshot: string;
  assemblySnapshot: string | null;
}

export interface MockOrderEvent {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
  actorUserId: string | null;
  actorName: string | null;
  note: string | null;
  isCustomerVisible: boolean;
  createdAt: Date;
}

export interface MockOrderMessage {
  id: string;
  authorUserId: string;
  authorName: string;
  body: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  accountId: string;
  createdByUserId: string;
  poNumber: string | null;
  deliveryMethod: "SHIP" | "PICKUP" | null;
  shipToAddressId: string | null;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  requiresAssembly: boolean;
  requestedDate: Date | null;
  customerNotes: string | null;
  internalNotes: string | null;
  statusBeforeHold: OrderStatus | null;
  status: OrderStatus;
  submittedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: MockOrderItem[];
  events: MockOrderEvent[];
  messages: MockOrderMessage[];
}

const globalForMock = globalThis as unknown as {
  __cgMockOrders?: MockOrder[];
  __cgMockSeq?: number;
  // Persisted on globalThis (like the orders themselves) so ids stay
  // monotonic across dev hot-reloads — otherwise a module reset would
  // restart the counter and collide with already-persisted event/item ids.
  __cgMockIdSeq?: number;
};

function actorName(userId: string | null): string | null {
  if (!userId) return null;
  return MOCK_USERS.find((u) => u.id === userId)?.fullName ?? null;
}

function id(prefix: string): string {
  globalForMock.__cgMockIdSeq = (globalForMock.__cgMockIdSeq ?? 0) + 1;
  return `${prefix}-${globalForMock.__cgMockIdSeq}`;
}

function makeItem(
  sku: string,
  quantity: number,
  colorCode: string | null,
  assembly: "ASSEMBLED" | "UNASSEMBLED" | null,
  thickness: string | null,
  notes: string | null = null
): MockOrderItem {
  const product = findProduct(sku)!;
  const color = colorCode ? findColor(colorCode) ?? null : null;
  return {
    id: id("item"),
    productId: product.id,
    colorId: color?.id ?? null,
    assembly,
    selectedOptions: thickness ? { Thickness: thickness } : null,
    quantity,
    unit: product.unit,
    lineNotes: notes,
    productNameSnapshot: product.name,
    colorNameSnapshot: color?.name ?? null,
    skuSnapshot: product.sku,
    assemblySnapshot: assembly,
  };
}

function seedOrders(): MockOrder[] {
  // Starts empty — customer accounts begin with no orders.
  return [];
}

function getStore(): MockOrder[] {
  if (!globalForMock.__cgMockOrders) {
    globalForMock.__cgMockOrders = seedOrders();
    globalForMock.__cgMockSeq = 148;
  }
  return globalForMock.__cgMockOrders;
}

function nextOrderNumber(): string {
  globalForMock.__cgMockSeq = (globalForMock.__cgMockSeq ?? 148) + 1;
  return formatOrderNumber(globalForMock.__cgMockSeq);
}

// ── Catalog ──────────────────────────────────────────────────────────

export function listProductsMock(category: "CABINETS" | "FLOORING"): MockProduct[] {
  return MOCK_PRODUCTS.filter((p) => p.category === category).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export function listColorsMock() {
  return [...MOCK_COLORS].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listShipToMock(accountId: string) {
  return MOCK_SHIP_TO.filter((s) => s.accountId === accountId);
}

/** Demo-mode counterpart of createShipToAddress — appends to the in-memory list. */
export function createShipToMock(
  accountId: string,
  data: {
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    zip: string;
    contactName: string | null;
    contactPhone: string | null;
  }
): { id: string } {
  const isFirst = MOCK_SHIP_TO.every((s) => s.accountId !== accountId);
  const row = { id: id("ship"), accountId, ...data, isDefault: isFirst };
  MOCK_SHIP_TO.push(row);
  return { id: row.id };
}

// ── Customer order reads ────────────────────────────────────────────

function withCount(o: MockOrder) {
  return { ...o, _count: { items: o.items.length } };
}

export function listOrdersMock(accountId: string) {
  return getStore()
    .filter((o) => o.accountId === accountId && o.status !== "DRAFT")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(withCount);
}

export function getOrderMock(accountId: string, orderId: string) {
  const order = getStore().find((o) => o.id === orderId && o.accountId === accountId);
  if (!order) return null;
  const shipTo = order.shipToAddressId
    ? MOCK_SHIP_TO.find((s) => s.id === order.shipToAddressId) ?? null
    : null;
  // Customer-facing read: internal notes must never leak here (spec §5.2).
  return { ...order, shipTo, messages: order.messages.filter((m) => !m.isInternal) };
}

// ── Cart line input ──────────────────────────────────────────────────

export interface CartLineInput {
  sku: string;
  quantity: number;
  colorCode?: string | null;
  assembly?: "ASSEMBLED" | "UNASSEMBLED" | null;
  thickness?: string | null;
  notes?: string | null;
}

export interface CreateOrderInput {
  accountId: string;
  userId: string;
  lines: CartLineInput[];
  deliveryMethod: "SHIP" | "PICKUP";
  shipToAddressId?: string | null;
  pickupContactName?: string | null;
  pickupContactPhone?: string | null;
  poNumber: string;
  requestedDate?: string | null;
  customerNotes?: string | null;
}

export function createOrderMock(input: CreateOrderInput): MockOrder {
  const items = input.lines.map((l) =>
    makeItem(l.sku, l.quantity, l.colorCode ?? null, l.assembly ?? null, l.thickness ?? null, l.notes ?? null)
  );
  const requiresAssembly = items.some((i) => i.assembly === "ASSEMBLED");
  const now = new Date();
  const order: MockOrder = {
    id: id("order"),
    orderNumber: nextOrderNumber(),
    accountId: input.accountId,
    createdByUserId: input.userId,
    poNumber: input.poNumber,
    deliveryMethod: input.deliveryMethod,
    shipToAddressId: input.deliveryMethod === "SHIP" ? input.shipToAddressId ?? null : null,
    pickupContactName: input.deliveryMethod === "PICKUP" ? input.pickupContactName ?? null : null,
    pickupContactPhone: input.deliveryMethod === "PICKUP" ? input.pickupContactPhone ?? null : null,
    requiresAssembly,
    requestedDate: input.requestedDate ? new Date(input.requestedDate) : null,
    customerNotes: input.customerNotes ?? null,
    internalNotes: null,
    statusBeforeHold: null,
    status: "SUBMITTED",
    submittedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    items,
    events: [
      {
        id: id("evt"),
        fromStatus: null,
        toStatus: "SUBMITTED",
        actorUserId: input.userId,
        actorName: actorName(input.userId),
        note: null,
        isCustomerVisible: true,
        createdAt: now,
      },
    ],
    messages: [],
  };
  getStore().unshift(order);
  return order;
}

export function cancelOrderMock(accountId: string, orderId: string, actorUserId: string): boolean {
  const order = getStore().find((o) => o.id === orderId && o.accountId === accountId);
  if (!order || order.status !== "SUBMITTED") return false;
  const from = order.status;
  order.status = "CANCELLED";
  order.updatedAt = new Date();
  order.events.push({
    id: id("evt"),
    fromStatus: from,
    toStatus: "CANCELLED",
    actorUserId,
    actorName: actorName(actorUserId),
    note: "Cancelled by customer",
    isCustomerVisible: true,
    createdAt: new Date(),
  });
  return true;
}

export function reorderLinesMock(accountId: string, orderId: string): CartLineInput[] {
  const order = getStore().find((o) => o.id === orderId && o.accountId === accountId);
  if (!order) return [];
  return order.items.map((it) => ({
    sku: it.skuSnapshot,
    quantity: it.quantity,
    colorCode: MOCK_COLORS.find((c) => c.id === it.colorId)?.code ?? null,
    assembly: it.assembly,
    thickness: (it.selectedOptions?.Thickness as string | undefined) ?? null,
    notes: it.lineNotes,
  }));
}

// ── Staff ────────────────────────────────────────────────────────────

export function listAllOrdersMock() {
  return getStore()
    .filter((o) => o.status !== "DRAFT")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((o) => ({ ...withCount(o), accountName: MOCK_ACCOUNT.name }));
}

export function getOrderForStaffMock(orderId: string) {
  const order = getStore().find((o) => o.id === orderId);
  if (!order) return null;
  const shipTo = order.shipToAddressId
    ? MOCK_SHIP_TO.find((s) => s.id === order.shipToAddressId) ?? null
    : null;
  return { ...order, shipTo, accountName: MOCK_ACCOUNT.name };
}

export function advanceOrderMock(orderId: string, actorUserId: string): MockOrder | null {
  const order = getStore().find((o) => o.id === orderId);
  if (!order) return null;
  const to = nextStatus(
    { requiresAssembly: order.requiresAssembly, deliveryMethod: order.deliveryMethod ?? "SHIP" },
    order.status as PipelineStatus
  );
  if (!to) return null;
  const from = order.status;
  order.status = to as OrderStatus;
  order.updatedAt = new Date();
  if (to === "COMPLETED") order.completedAt = new Date();
  order.events.push({
    id: id("evt"),
    fromStatus: from,
    toStatus: to as OrderStatus,
    actorUserId,
    actorName: actorName(actorUserId),
    note: null,
    isCustomerVisible: true,
    createdAt: new Date(),
  });
  return order;
}

export function sendBackOrderMock(orderId: string, actorUserId: string, reason: string): MockOrder | null {
  const order = getStore().find((o) => o.id === orderId);
  if (!order || !reason.trim()) return null;
  const to = previousStep(
    { requiresAssembly: order.requiresAssembly, deliveryMethod: order.deliveryMethod ?? "SHIP" },
    order.status as PipelineStatus
  );
  if (!to) return null;
  const from = order.status;
  order.status = to as OrderStatus;
  order.updatedAt = new Date();
  order.events.push({
    id: id("evt"),
    fromStatus: from,
    toStatus: to as OrderStatus,
    actorUserId,
    actorName: actorName(actorUserId),
    note: reason,
    isCustomerVisible: true,
    createdAt: new Date(),
  });
  return order;
}

export function holdOrderMock(orderId: string, actorUserId: string, reason: string): MockOrder | null {
  const order = getStore().find((o) => o.id === orderId);
  if (!order || !reason.trim() || order.status === "ON_HOLD" || order.status === "CANCELLED" || order.status === "COMPLETED") {
    return null;
  }
  order.statusBeforeHold = order.status;
  const from = order.status;
  order.status = "ON_HOLD";
  order.updatedAt = new Date();
  order.events.push({
    id: id("evt"),
    fromStatus: from,
    toStatus: "ON_HOLD",
    actorUserId,
    actorName: actorName(actorUserId),
    note: reason,
    isCustomerVisible: true,
    createdAt: new Date(),
  });
  return order;
}

export function resumeOrderMock(orderId: string, actorUserId: string): MockOrder | null {
  const order = getStore().find((o) => o.id === orderId);
  if (!order || order.status !== "ON_HOLD" || !order.statusBeforeHold) return null;
  const from = order.status;
  order.status = order.statusBeforeHold;
  order.statusBeforeHold = null;
  order.updatedAt = new Date();
  order.events.push({
    id: id("evt"),
    fromStatus: from,
    toStatus: order.status,
    actorUserId,
    actorName: actorName(actorUserId),
    note: "Resumed",
    isCustomerVisible: true,
    createdAt: new Date(),
  });
  return order;
}

export function cancelOrderStaffMock(orderId: string, actorUserId: string, reason: string): MockOrder | null {
  const order = getStore().find((o) => o.id === orderId);
  if (!order || !reason.trim() || order.status === "CANCELLED" || order.status === "COMPLETED") return null;
  const from = order.status;
  order.status = "CANCELLED";
  order.updatedAt = new Date();
  order.events.push({
    id: id("evt"),
    fromStatus: from,
    toStatus: "CANCELLED",
    actorUserId,
    actorName: actorName(actorUserId),
    note: reason,
    isCustomerVisible: true,
    createdAt: new Date(),
  });
  return order;
}

export function addMessageMock(
  orderId: string,
  actorUserId: string,
  body: string,
  isInternal: boolean
): MockOrder | null {
  const order = getStore().find((o) => o.id === orderId);
  if (!order || !body.trim()) return null;
  order.messages.push({
    id: id("msg"),
    authorUserId: actorUserId,
    authorName: actorName(actorUserId) ?? "Unknown",
    body: body.trim(),
    isInternal,
    createdAt: new Date(),
  });
  order.updatedAt = new Date();
  return order;
}
