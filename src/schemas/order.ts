import { z } from "zod";
import { BUSINESS } from "@/config/business";

/**
 * Input schemas for order mutations. The trust boundary: never trust the
 * client — every server mutation re-validates here, independent of any
 * client-side checks.
 */

export const orderLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z
    .number()
    .int()
    .min(BUSINESS.minLineQuantity)
    .max(BUSINESS.maxLineQuantity),
  colorCode: z.string().nullable(),
  assembly: z.enum(["ASSEMBLED", "UNASSEMBLED"]).nullable(),
  thickness: z.string().nullable(),
  notes: z.string(),
});

export const submitOrderSchema = z
  .object({
    lines: z.array(orderLineSchema).min(1, "Add at least one item to your order."),
    deliveryMethod: z.enum(["SHIP", "PICKUP"]),
    shipToAddressId: z.string().nullable(),
    pickupContactName: z.string().nullable(),
    pickupContactPhone: z.string().nullable(),
    poNumber: z.string().trim().min(1, "PO number is required."),
    requestedDate: z.string().nullable(),
    customerNotes: z.string().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod === "PICKUP") {
      if (!v.pickupContactName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["pickupContactName"], message: "Pickup contact name is required." });
      }
      if (!v.pickupContactPhone?.trim()) {
        ctx.addIssue({ code: "custom", path: ["pickupContactPhone"], message: "Pickup contact phone is required." });
      }
    }
    if (v.deliveryMethod === "SHIP" && !v.shipToAddressId) {
      ctx.addIssue({ code: "custom", path: ["shipToAddressId"], message: "Choose a shipping address." });
    }
  });

export type SubmitOrderInput = z.infer<typeof submitOrderSchema>;

/** Line quantity change (future inline cart persistence). */
export const updateQuantitySchema = z.object({
  orderId: z.string().min(1),
  lineId: z.string().min(1),
  quantity: z.number().int().min(BUSINESS.minLineQuantity).max(BUSINESS.maxLineQuantity),
});
export type UpdateQuantityInput = z.infer<typeof updateQuantitySchema>;
