"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/guards";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import { createCustomer, updateCustomer, deleteAccount, removeOrDeactivateAccount, type CustomerCreated } from "@/data/accounts";
import { createCustomerSchema, updateCustomerSchema, type CreateCustomerInput, type UpdateCustomerInput } from "@/schemas/customer";
import { ROUTES } from "@/config/routes";
import type { Result } from "@/lib/result";

/**
 * Staff creates a customer login. Returns the standard Result envelope so the
 * form can show field errors, a success toast, and the first-login link.
 */
export async function createCustomerAction(
  input: CreateCustomerInput
): Promise<Result<CustomerCreated>> {
  return runAction(async () => {
    await assertPermission("accounts.manage");
    const parsed = createCustomerSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const created = await createCustomer(parsed.data);
    revalidatePath(ROUTES.admin.customers);
    return created;
  });
}

export async function updateCustomerAction(input: UpdateCustomerInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("accounts.manage");
    const parsed = updateCustomerSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const updated = await updateCustomer(parsed.data);
    revalidatePath(ROUTES.admin.customers);
    return updated;
  });
}

/**
 * Remove a store from the Stores page. Deletes it when it has no orders,
 * otherwise deactivates it so order history survives.
 */
export async function removeStoreAction(
  accountId: string
): Promise<Result<{ deleted: boolean; name: string }>> {
  return runAction(async () => {
    await assertPermission("accounts.manage");
    if (!accountId) throw new ValidationError("Missing store.");
    const result = await removeOrDeactivateAccount(accountId);
    revalidatePath(ROUTES.admin.stores);
    revalidatePath(ROUTES.admin.customers);
    return result;
  });
}

export async function deleteAccountAction(accountId: string): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("accounts.manage");
    if (!accountId) throw new ValidationError("Missing account.");
    await deleteAccount(accountId);
    revalidatePath(ROUTES.admin.customers);
    return { id: accountId };
  });
}
