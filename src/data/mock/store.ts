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

/**
 * In-memory demo backend. Stands in for Prisma/Postgres while no
 * DATABASE_URL is configured (src/lib/mode.ts). State lives for the life
 * of the dev server process — restarting `next dev` resets it back to
 * the seed below. Every function here mirrors the shape/behavior the
 * real src/data/*.ts + Prisma layer will have once real credentials are
 * added, so callers don't need to branch on mode themselves.
 */

export type OrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PROCESSING"
  | "ASSEMBLING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "ON_HOLD"
  | "CANCELLED";

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

const globalForMock = globalThis as unknown as { __cgMockOrders?: MockOrder[]; __cgMockSeq?: number };

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600 * 1000);
}

function actorName(userId: string | null): string | null {
  if (!userId) return null;
  return MOCK_USERS.find((u) => u.id === userId)?.fullName ?? null;
}

let idCounter = 1;
function id(prefix: string): string {
  return `${prefix}-${idCounter++}`;
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

function makeEvents(
  steps: Array<[OrderStatus, number]>, // [status, hoursAgo]
  actorUserId: string | null
): MockOrderEvent[] {
  let prev: OrderStatus | null = null;
  const events = steps.map(([status, h]): MockOrderEvent => {
    const ev: MockOrderEvent = {
      id: id("evt"),
      fromStatus: prev,
      toStatus: status,
      actorUserId,
      actorName: actorName(actorUserId),
      note: null,
      isCustomerVisible: true,
      createdAt: hoursAgo(h),
    };
    prev = status;
    return ev;
  });
  return events;
}

function seedOrders(): MockOrder[] {
  const buyer = "user-buyer";
  const staff = "user-staff";
  const acct = MOCK_ACCOUNT.id;
  const mainShip = MOCK_SHIP_TO[0].id;

  const o142: MockOrder = {
    id: "order-142",
    orderNumber: "CG-2026-0142",
    accountId: acct,
    createdByUserId: buyer,
    poNumber: "ELM-ST-KITCHEN",
    deliveryMethod: "SHIP",
    shipToAddressId: mainShip,
    pickupContactName: null,
    pickupContactPhone: null,
    requiresAssembly: true,
    requestedDate: null,
    customerNotes: null,
    internalNotes: null,
    statusBeforeHold: null,
    status: "OUT_FOR_DELIVERY",
    submittedAt: hoursAgo(144),
    completedAt: null,
    createdAt: hoursAgo(144),
    updatedAt: hoursAgo(6),
    items: [
      makeItem("B24", 4, "WS", "ASSEMBLED", null),
      makeItem("B36", 2, "WS", "ASSEMBLED", null),
      makeItem("W3030", 6, "WS", "ASSEMBLED", null),
      makeItem("PC248427", 1, "WS", "ASSEMBLED", null),
    ],
    events: makeEvents(
      [
        ["SUBMITTED", 144],
        ["PROCESSING", 130],
        ["ASSEMBLING", 96],
        ["READY", 24],
        ["OUT_FOR_DELIVERY", 6],
      ],
      staff
    ),
    messages: [],
  };

  const o145: MockOrder = {
    id: "order-145",
    orderNumber: "CG-2026-0145",
    accountId: acct,
    createdByUserId: buyer,
    poNumber: "OAKVIEW-UNIT-7",
    deliveryMethod: "PICKUP",
    shipToAddressId: null,
    pickupContactName: "Demo Buyer",
    pickupContactPhone: "618-401-4778",
    requiresAssembly: true,
    requestedDate: null,
    customerNotes: null,
    internalNotes: null,
    statusBeforeHold: null,
    status: "ASSEMBLING",
    submittedAt: hoursAgo(72),
    completedAt: null,
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(20),
    items: [
      makeItem("B12", 2, "NB", "ASSEMBLED", null),
      makeItem("B30", 3, "NB", "ASSEMBLED", null),
      makeItem("W1830", 4, "NB", "ASSEMBLED", null),
      makeItem("VSB36", 1, "NB", "ASSEMBLED", null),
    ],
    events: makeEvents(
      [
        ["SUBMITTED", 72],
        ["PROCESSING", 60],
        ["ASSEMBLING", 20],
      ],
      staff
    ),
    messages: [],
  };

  const o147: MockOrder = {
    id: "order-147",
    orderNumber: "CG-2026-0147",
    accountId: acct,
    createdByUserId: buyer,
    poNumber: "FLR-BID-0093",
    deliveryMethod: "SHIP",
    shipToAddressId: mainShip,
    pickupContactName: null,
    pickupContactPhone: null,
    requiresAssembly: false,
    requestedDate: null,
    customerNotes: null,
    internalNotes: null,
    statusBeforeHold: null,
    status: "PROCESSING",
    submittedAt: hoursAgo(30),
    completedAt: null,
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(8),
    items: [
      makeItem("JP1003", 18, null, null, "6.5mm"),
      makeItem("JP1012", 12, null, null, "6.0mm"),
    ],
    events: makeEvents(
      [
        ["SUBMITTED", 30],
        ["PROCESSING", 8],
      ],
      staff
    ),
    messages: [],
  };

  const o139: MockOrder = {
    id: "order-139",
    orderNumber: "CG-2026-0139",
    accountId: acct,
    createdByUserId: buyer,
    poNumber: "GRV-BSMT",
    deliveryMethod: "PICKUP",
    shipToAddressId: null,
    pickupContactName: "Demo Buyer",
    pickupContactPhone: "618-401-4778",
    requiresAssembly: false,
    requestedDate: null,
    customerNotes: null,
    internalNotes: null,
    statusBeforeHold: null,
    status: "COMPLETED",
    submittedAt: hoursAgo(264),
    completedAt: hoursAgo(192),
    createdAt: hoursAgo(264),
    updatedAt: hoursAgo(192),
    items: [
      makeItem("JP1008", 22, null, null, "8.5mm"),
      makeItem("VBD24", 1, "GS", "UNASSEMBLED", null),
    ],
    events: makeEvents(
      [
        ["SUBMITTED", 264],
        ["PROCESSING", 259],
        ["READY", 216],
        ["COMPLETED", 192],
      ],
      staff
    ),
    messages: [],
  };

  const o133: MockOrder = {
    id: "order-133",
    orderNumber: "CG-2026-0133",
    accountId: acct,
    createdByUserId: buyer,
    poNumber: "ELM-ST-FLOOR",
    deliveryMethod: "SHIP",
    shipToAddressId: mainShip,
    pickupContactName: null,
    pickupContactPhone: null,
    requiresAssembly: false,
    requestedDate: null,
    customerNotes: null,
    internalNotes: null,
    statusBeforeHold: null,
    status: "COMPLETED",
    submittedAt: hoursAgo(456),
    completedAt: hoursAgo(384),
    createdAt: hoursAgo(456),
    updatedAt: hoursAgo(384),
    items: [makeItem("JP1001", 30, null, null, "6.5mm")],
    events: makeEvents(
      [
        ["SUBMITTED", 456],
        ["PROCESSING", 450],
        ["READY", 400],
        ["OUT_FOR_DELIVERY", 388],
        ["COMPLETED", 384],
      ],
      staff
    ),
    messages: [],
  };

  return [o142, o145, o147, o139, o133];
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
  return `CG-2026-0${globalForMock.__cgMockSeq}`;
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
