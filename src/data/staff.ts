import "server-only";
import { isDemoMode } from "@/lib/mode";
import { nextStatus, previousStep, type PipelineStatus } from "@/lib/pipeline/buildPipeline";
import {
  listAllOrdersMock,
  getOrderForStaffMock,
  advanceOrderMock,
  sendBackOrderMock,
  holdOrderMock,
  resumeOrderMock,
  cancelOrderStaffMock,
  addMessageMock,
} from "./mock/store";

/**
 * Staff data access — deliberately NOT accountId-scoped (staff can see
 * every account's orders). All status changes go through buildPipeline()
 * so the transition rules can never drift from the customer-facing
 * progress bar (spec §7).
 */

export async function listAllOrders() {
  if (isDemoMode()) return listAllOrdersMock();
  const { prisma } = await import("./db");
  const orders = await prisma.order.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } }, account: true },
  });
  return orders.map((o) => ({ ...o, accountName: o.account.name }));
}

export async function getOrderForStaff(orderId: string) {
  if (isDemoMode()) return getOrderForStaffMock(orderId);
  const { prisma } = await import("./db");
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { orderBy: { id: "asc" } },
      shipTo: true,
      account: true,
      events: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) return null;
  return { ...order, accountName: order.account.name };
}

async function prismaTransition(
  orderId: string,
  actorUserId: string,
  to: PipelineStatus | "ON_HOLD" | "CANCELLED",
  note: string | null
) {
  const { prisma } = await import("./db");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: to,
        completedAt: to === "COMPLETED" ? new Date() : order.completedAt,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: to,
        actorUserId,
        note,
        isCustomerVisible: true,
      },
    }),
  ]);
  return prisma.order.findUnique({ where: { id: orderId } });
}

export async function advanceOrder(orderId: string, actorUserId: string) {
  if (isDemoMode()) return advanceOrderMock(orderId, actorUserId);
  const { prisma } = await import("./db");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  const to = nextStatus(
    { requiresAssembly: order.requiresAssembly, deliveryMethod: order.deliveryMethod ?? "SHIP" },
    order.status as PipelineStatus
  );
  if (!to) return null;
  return prismaTransition(orderId, actorUserId, to, null);
}

export async function sendBackOrder(orderId: string, actorUserId: string, reason: string) {
  if (isDemoMode()) return sendBackOrderMock(orderId, actorUserId, reason);
  if (!reason.trim()) return null;
  const { prisma } = await import("./db");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return null;
  const to = previousStep(
    { requiresAssembly: order.requiresAssembly, deliveryMethod: order.deliveryMethod ?? "SHIP" },
    order.status as PipelineStatus
  );
  if (!to) return null;
  return prismaTransition(orderId, actorUserId, to, reason);
}

export async function holdOrder(orderId: string, actorUserId: string, reason: string) {
  if (isDemoMode()) return holdOrderMock(orderId, actorUserId, reason);
  if (!reason.trim()) return null;
  return prismaTransition(orderId, actorUserId, "ON_HOLD", reason);
}

export async function resumeOrder(orderId: string, actorUserId: string) {
  if (isDemoMode()) return resumeOrderMock(orderId, actorUserId);
  const { prisma } = await import("./db");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "ON_HOLD") return null;
  // Prod schema doesn't persist statusBeforeHold; PROCESSING is the safe default.
  return prismaTransition(orderId, actorUserId, "PROCESSING", "Resumed");
}

export async function cancelOrderStaff(orderId: string, actorUserId: string, reason: string) {
  if (isDemoMode()) return cancelOrderStaffMock(orderId, actorUserId, reason);
  if (!reason.trim()) return null;
  return prismaTransition(orderId, actorUserId, "CANCELLED", reason);
}

export async function addMessage(orderId: string, actorUserId: string, body: string, isInternal: boolean) {
  if (isDemoMode()) return addMessageMock(orderId, actorUserId, body, isInternal);
  if (!body.trim()) return null;
  const { prisma } = await import("./db");
  await prisma.orderMessage.create({
    data: { orderId, authorUserId: actorUserId, body: body.trim(), isInternal },
  });
  return prisma.order.findUnique({ where: { id: orderId } });
}
