"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/data/context";
import {
  advanceOrder,
  sendBackOrder,
  holdOrder,
  resumeOrder,
  cancelOrderStaff,
  addMessage,
} from "@/data/staff";

async function refresh(orderId: string) {
  revalidatePath(`/staff/orders/${orderId}`);
  revalidatePath("/staff/queue");
}

export async function advanceOrderAction(orderId: string) {
  const ctx = await requireStaff();
  const result = await advanceOrder(orderId, ctx.userId);
  await refresh(orderId);
  return { ok: !!result };
}

export async function sendBackOrderAction(orderId: string, reason: string) {
  const ctx = await requireStaff();
  const result = await sendBackOrder(orderId, ctx.userId, reason);
  await refresh(orderId);
  return { ok: !!result };
}

export async function holdOrderAction(orderId: string, reason: string) {
  const ctx = await requireStaff();
  const result = await holdOrder(orderId, ctx.userId, reason);
  await refresh(orderId);
  return { ok: !!result };
}

export async function resumeOrderAction(orderId: string) {
  const ctx = await requireStaff();
  const result = await resumeOrder(orderId, ctx.userId);
  await refresh(orderId);
  return { ok: !!result };
}

export async function cancelOrderStaffAction(orderId: string, reason: string) {
  const ctx = await requireStaff();
  const result = await cancelOrderStaff(orderId, ctx.userId, reason);
  await refresh(orderId);
  return { ok: !!result };
}

export async function addMessageAction(orderId: string, body: string, isInternal: boolean) {
  const ctx = await requireStaff();
  const result = await addMessage(orderId, ctx.userId, body, isInternal);
  await refresh(orderId);
  return { ok: !!result };
}
