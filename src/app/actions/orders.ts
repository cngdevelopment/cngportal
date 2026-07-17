"use server";

import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/data/context";
import {
  createOrder,
  cancelOrder as cancelOrderData,
  reorderLines,
  addCustomerMessage,
} from "@/data/orders";
import { getProductBySku } from "@/data/catalog";
import { colorHex } from "@/lib/colorSwatches";
import type { CartLine } from "@/components/cart/CartProvider";

export interface SubmitOrderLine {
  sku: string;
  quantity: number;
  colorCode: string | null;
  assembly: "ASSEMBLED" | "UNASSEMBLED" | null;
  thickness: string | null;
  notes: string;
}

export interface SubmitOrderPayload {
  lines: SubmitOrderLine[];
  deliveryMethod: "SHIP" | "PICKUP";
  shipToAddressId: string | null;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  poNumber: string;
  requestedDate: string | null;
  customerNotes: string | null;
}

export async function submitOrderAction(payload: SubmitOrderPayload): Promise<{ orderId: string }> {
  const ctx = await requireCustomer();

  if (payload.lines.length === 0) throw new Error("Order is empty.");
  if (!payload.poNumber.trim()) throw new Error("PO number is required.");
  if (payload.deliveryMethod === "PICKUP" && (!payload.pickupContactName?.trim() || !payload.pickupContactPhone?.trim())) {
    throw new Error("Pickup contact name and phone are required.");
  }

  const order = await createOrder({
    accountId: ctx.accountId,
    userId: ctx.userId,
    lines: payload.lines.map((l) => ({
      sku: l.sku,
      quantity: l.quantity,
      colorCode: l.colorCode,
      assembly: l.assembly,
      thickness: l.thickness,
      notes: l.notes || null,
    })),
    deliveryMethod: payload.deliveryMethod,
    shipToAddressId: payload.shipToAddressId,
    pickupContactName: payload.pickupContactName,
    pickupContactPhone: payload.pickupContactPhone,
    poNumber: payload.poNumber.trim(),
    requestedDate: payload.requestedDate,
    customerNotes: payload.customerNotes,
  });

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { orderId: order.id };
}

export async function cancelOrderAction(orderId: string): Promise<{ ok: boolean }> {
  const ctx = await requireCustomer();
  const ok = await cancelOrderData(ctx.accountId, orderId, ctx.userId);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  return { ok };
}

export async function addCustomerMessageAction(orderId: string, body: string): Promise<{ ok: boolean }> {
  const ctx = await requireCustomer();
  const ok = await addCustomerMessage(ctx.accountId, orderId, ctx.userId, body);
  revalidatePath(`/orders/${orderId}`);
  return { ok };
}

export async function getReorderLinesAction(orderId: string): Promise<CartLine[]> {
  const ctx = await requireCustomer();
  const lines = await reorderLines(ctx.accountId, orderId);

  const resolved: CartLine[] = [];
  for (const l of lines) {
    const product = await getProductBySku(l.sku);
    if (!product) continue;
    const colorRef = l.colorCode
      ? product.colors.find((c) => c.color.code === l.colorCode)?.color ?? null
      : null;
    resolved.push({
      key: [l.sku, l.colorCode ?? "", l.thickness ?? "", l.assembly ?? ""].join("|"),
      sku: l.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: l.quantity,
      colorCode: l.colorCode ?? null,
      colorName: colorRef?.name ?? null,
      colorHex: colorRef ? colorHex(colorRef.code, (colorRef as { hex?: string }).hex) : null,
      assembly: l.assembly ?? null,
      thickness: l.thickness ?? null,
      unitsPerBox: product.unitsPerBox === null || product.unitsPerBox === undefined ? null : Number(product.unitsPerBox),
      unitPrice: (() => {
        const p = (product as { price?: unknown }).price;
        return p === null || p === undefined ? null : Number(p);
      })(),
      notes: l.notes ?? "",
    });
  }
  return resolved;
}
