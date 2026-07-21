"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/guards";
import { requireCustomer } from "@/data/context";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import {
  createDiscount,
  updateDiscount,
  deleteDiscount,
  computeSubtotal,
  validateDiscount,
} from "@/data/discounts";
import {
  createDiscountSchema,
  updateDiscountSchema,
  applyDiscountSchema,
  type CreateDiscountInput,
  type UpdateDiscountInput,
  type ApplyDiscountInput,
} from "@/schemas/discount";
import { ROUTES } from "@/config/routes";
import type { Result } from "@/lib/result";

/** Admin CRUD — gated on discounts.manage (STAFF_ADMIN). */

export async function createDiscountAction(input: CreateDiscountInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("discounts.manage");
    const parsed = createDiscountSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const created = await createDiscount(parsed.data);
    revalidatePath(ROUTES.admin.discounts);
    return created;
  });
}

export async function updateDiscountAction(input: UpdateDiscountInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("discounts.manage");
    const parsed = updateDiscountSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const updated = await updateDiscount(parsed.data);
    revalidatePath(ROUTES.admin.discounts);
    return updated;
  });
}

export async function deleteDiscountAction(id: string): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("discounts.manage");
    if (!id) throw new ValidationError("Missing discount.");
    await deleteDiscount(id);
    revalidatePath(ROUTES.admin.discounts);
    return { id };
  });
}

/**
 * Customer previewing a promo code in the cart. The subtotal is recomputed
 * from catalog prices here — the client's number is never trusted.
 */
export async function applyDiscountAction(
  input: ApplyDiscountInput
): Promise<Result<{ code: string; amount: number; subtotal: number }>> {
  return runAction(async () => {
    const ctx = await requireCustomer();
    const parsed = applyDiscountSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);

    const subtotal = await computeSubtotal(parsed.data.lines);
    const applied = await validateDiscount({
      code: parsed.data.code,
      accountId: ctx.accountId,
      subtotal,
    });
    return { code: applied.code, amount: applied.amount, subtotal };
  });
}
