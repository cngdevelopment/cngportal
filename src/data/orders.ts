import "server-only";
import { isDemoMode } from "@/lib/mode";
import {
  listOrdersMock,
  getOrderMock,
  listShipToMock,
  createOrderMock,
  cancelOrderMock,
  reorderLinesMock,
  addMessageMock,
  type CartLineInput,
  type CreateOrderInput,
} from "./mock/store";

/**
 * Order reads/writes, always scoped by accountId (resolved server-side in
 * src/data/context.ts — never from the client).
 * Missing/foreign rows read as "not found", never "forbidden" (spec §12.2).
 */

export async function listOrders(accountId: string) {
  if (isDemoMode()) return listOrdersMock(accountId);
  const { prisma } = await import("./db");
  return prisma.order.findMany({
    where: { accountId, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function getOrder(accountId: string, orderId: string) {
  if (isDemoMode()) return getOrderMock(accountId, orderId);
  const { prisma } = await import("./db");
  return prisma.order.findFirst({
    where: { id: orderId, accountId },
    include: {
      items: { orderBy: { id: "asc" } },
      shipTo: true,
      events: { orderBy: { createdAt: "asc" } },
      messages: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { author: true },
      },
    },
  });
}

export async function listShipToAddresses(accountId: string) {
  if (isDemoMode()) return listShipToMock(accountId);
  const { prisma } = await import("./db");
  return prisma.shipToAddress.findMany({
    where: { accountId, isActive: true },
    orderBy: { isDefault: "desc" },
  });
}

export async function createOrder(input: CreateOrderInput) {
  if (isDemoMode()) return createOrderMock(input);
  const { prisma } = await import("./db");
  const { findProduct, findColor } = await import("./mock/catalog-data");

  return prisma.$transaction(async (tx) => {
    const orderNumber = `CG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const requiresAssembly = input.lines.some((l) => l.assembly === "ASSEMBLED");
    const order = await tx.order.create({
      data: {
        orderNumber,
        accountId: input.accountId,
        createdByUserId: input.userId,
        poNumber: input.poNumber,
        deliveryMethod: input.deliveryMethod,
        shipToAddressId: input.deliveryMethod === "SHIP" ? input.shipToAddressId : null,
        pickupContactName: input.deliveryMethod === "PICKUP" ? input.pickupContactName : null,
        pickupContactPhone: input.deliveryMethod === "PICKUP" ? input.pickupContactPhone : null,
        requiresAssembly,
        requestedDate: input.requestedDate ? new Date(input.requestedDate) : null,
        customerNotes: input.customerNotes,
        status: "SUBMITTED",
        submittedAt: new Date(),
        items: {
          create: input.lines.map((l) => {
            const p = findProduct(l.sku);
            const c = l.colorCode ? findColor(l.colorCode) : null;
            return {
              productId: p!.id,
              colorId: c?.id ?? null,
              assembly: l.assembly ?? null,
              selectedOptions: l.thickness ? { Thickness: l.thickness } : undefined,
              quantity: l.quantity,
              unit: p!.unit as never,
              lineNotes: l.notes,
              productNameSnapshot: p!.name,
              colorNameSnapshot: c?.name ?? null,
              skuSnapshot: p!.sku,
              assemblySnapshot: l.assembly ?? null,
            };
          }),
        },
        events: {
          create: {
            fromStatus: null,
            toStatus: "SUBMITTED",
            actorUserId: input.userId,
            isCustomerVisible: true,
          },
        },
      },
      include: { items: true },
    });
    return order;
  });
}

export async function cancelOrder(accountId: string, orderId: string, actorUserId: string) {
  if (isDemoMode()) return cancelOrderMock(accountId, orderId, actorUserId);
  const { prisma } = await import("./db");
  const order = await prisma.order.findFirst({ where: { id: orderId, accountId } });
  if (!order || order.status !== "SUBMITTED") return false;
  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } }),
    prisma.orderEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: "CANCELLED",
        actorUserId,
        note: "Cancelled by customer",
        isCustomerVisible: true,
      },
    }),
  ]);
  return true;
}

export async function reorderLines(accountId: string, orderId: string): Promise<CartLineInput[]> {
  if (isDemoMode()) return reorderLinesMock(accountId, orderId);
  const { prisma } = await import("./db");
  const order = await prisma.order.findFirst({
    where: { id: orderId, accountId },
    include: { items: { include: { color: true } } },
  });
  if (!order) return [];
  return order.items.map((it) => ({
    sku: it.skuSnapshot,
    quantity: Number(it.quantity),
    colorCode: it.color?.code ?? null,
    assembly: it.assembly,
    thickness: (it.selectedOptions as Record<string, string> | null)?.Thickness ?? null,
    notes: it.lineNotes,
  }));
}

/** Customer-side message send — scoped by accountId before touching the order. */
export async function addCustomerMessage(accountId: string, orderId: string, userId: string, body: string) {
  const owned = await getOrder(accountId, orderId);
  if (!owned) return false;
  if (isDemoMode()) {
    const result = addMessageMock(orderId, userId, body, false);
    return !!result;
  }
  if (!body.trim()) return false;
  const { prisma } = await import("./db");
  await prisma.orderMessage.create({
    data: { orderId, authorUserId: userId, body: body.trim(), isInternal: false },
  });
  return true;
}

export type { CartLineInput, CreateOrderInput };
