"use server";

import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/data/context";
import {
  createOrder,
  createShipToAddress,
  cancelOrder as cancelOrderData,
  reorderLines,
  addCustomerMessage,
} from "@/data/orders";
import { getProductBySku } from "@/data/catalog";
import { colorHex } from "@/lib/colorSwatches";
import type { CartLine } from "@/components/cart/CartProvider";
import { submitOrderSchema } from "@/schemas/order";
import { postMessageSchema } from "@/schemas/message";
import { ValidationError } from "@/server/errors";

export interface SubmitOrderLine {
  sku: string;
  quantity: number;
  colorCode: string | null;
  assembly: "ASSEMBLED" | "UNASSEMBLED" | null;
  thickness: string | null;
  notes: string;
}

export interface SubmitOrderNewShipTo {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  contactName?: string;
  contactPhone?: string;
}

export interface SubmitOrderPayload {
  lines: SubmitOrderLine[];
  deliveryMethod: "SHIP" | "PICKUP";
  shipToAddressId: string | null;
  /** Sent instead of shipToAddressId when the customer types a new address. */
  newShipTo?: SubmitOrderNewShipTo | null;
  pickupContactName: string | null;
  pickupContactPhone: string | null;
  poNumber: string;
  requestedDate: string | null;
  customerNotes: string | null;
}

export async function submitOrderAction(payload: SubmitOrderPayload): Promise<{ orderId: string }> {
  const ctx = await requireCustomer();

  // Never trust the client — re-validate at the trust boundary (spec §5.2).
  const parsed = submitOrderSchema.safeParse(payload);
  if (!parsed.success) throw ValidationError.fromZod(parsed.error);

  // A typed-in shipping address is saved to this account first, then the
  // order references it. accountId comes from the session, never the client.
  let shipToAddressId = parsed.data.shipToAddressId;
  if (parsed.data.deliveryMethod === "SHIP" && !shipToAddressId && parsed.data.newShipTo) {
    const created = await createShipToAddress(ctx.accountId, parsed.data.newShipTo);
    shipToAddressId = created.id;
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
    shipToAddressId,
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
  const parsed = postMessageSchema.safeParse({ orderId, body });
  if (!parsed.success) return { ok: false };
  const ok = await addCustomerMessage(ctx.accountId, parsed.data.orderId, ctx.userId, parsed.data.body);
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
