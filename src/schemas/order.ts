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

/**
 * A shipping address typed in at checkout. Saved to the account as a
 * ShipToAddress so the order can reference it and it's reusable next time.
 */
export const newShipToSchema = z.object({
  label: z.string().trim().max(80).optional().or(z.literal("")),
  line1: z.string().trim().min(1, "Street address is required.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(1, "City is required.").max(80),
  state: z.string().trim().min(1, "State is required.").max(40),
  zip: z.string().trim().min(1, "ZIP is required.").max(20),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
});
export type NewShipToInput = z.infer<typeof newShipToSchema>;

export const submitOrderSchema = z
  .object({
    lines: z.array(orderLineSchema).min(1, "Add at least one item to your order."),
    deliveryMethod: z.enum(["SHIP", "PICKUP"]),
    shipToAddressId: z.string().nullable(),
    /** Provided instead of shipToAddressId when the customer types a new address. */
    newShipTo: newShipToSchema.nullable().optional(),
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
    // Shipping needs either a saved address or a newly entered one.
    if (v.deliveryMethod === "SHIP" && !v.shipToAddressId && !v.newShipTo) {
      ctx.addIssue({ code: "custom", path: ["shipToAddressId"], message: "Enter or choose a shipping address." });
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
