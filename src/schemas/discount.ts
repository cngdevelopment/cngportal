import { z } from "zod";

/**
 * Discount codes, managed in the Admin Portal and redeemed by customers at
 * checkout. Every constraint is optional — a code with none set is simply
 * "valid for everyone, forever, unlimited".
 */

const optionalDate = z.string().trim().optional().or(z.literal("")).nullable();
const optionalPositiveInt = z.number().int().min(1, "Must be at least 1.").nullable().optional();
const optionalAmount = z.number().min(0, "Can't be negative.").nullable().optional();

const baseDiscountFields = {
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes, or underscores only."),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive("Value must be greater than 0."),
  isActive: z.boolean(),
  startsAt: optionalDate,
  endsAt: optionalDate,
  maxRedemptions: optionalPositiveInt,
  maxPerAccount: optionalPositiveInt,
  minOrderSubtotal: optionalAmount,
  /** Empty = every account can use it. */
  accountIds: z.array(z.string().uuid()).default([]),
};

// Cross-field rules: percentages cap at 100, and an end date must follow start.
export const createDiscountSchema = z
  .object(baseDiscountFields)
  .refine((v) => v.type !== "PERCENT" || v.value <= 100, {
    message: "A percentage can't be more than 100.",
    path: ["value"],
  })
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.startsAt) <= new Date(v.endsAt), {
    message: "End date must be after the start date.",
    path: ["endsAt"],
  });
export type CreateDiscountInput = z.input<typeof createDiscountSchema>;

export const updateDiscountSchema = z
  .object({ id: z.string().uuid(), ...baseDiscountFields })
  .refine((v) => v.type !== "PERCENT" || v.value <= 100, {
    message: "A percentage can't be more than 100.",
    path: ["value"],
  })
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.startsAt) <= new Date(v.endsAt), {
    message: "End date must be after the start date.",
    path: ["endsAt"],
  });
export type UpdateDiscountInput = z.input<typeof updateDiscountSchema>;

/** Customer applying a code at checkout — validated against server-side prices. */
export const applyDiscountSchema = z.object({
  code: z.string().trim().min(1, "Enter a promo code."),
  lines: z
    .array(z.object({ sku: z.string().min(1), quantity: z.number().int().positive() }))
    .min(1, "Your cart is empty."),
});
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
