import { z } from "zod";

/** Staff status transition that only needs the order id (advance / resume). */
export const orderIdSchema = z.object({
  orderId: z.string().min(1),
});
export type OrderIdInput = z.infer<typeof orderIdSchema>;

/**
 * Staff transitions that require a written reason (send-back, hold, cancel).
 * The reason is customer-visible, so it must be non-empty.
 */
export const orderReasonSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().trim().min(1, "A reason is required.").max(500),
});
export type OrderReasonInput = z.infer<typeof orderReasonSchema>;
