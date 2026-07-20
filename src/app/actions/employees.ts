"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/guards";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import { createEmployee, updateEmployee, deleteEmployee } from "@/data/employees";
import { createEmployeeSchema, updateEmployeeSchema, type CreateEmployeeInput, type UpdateEmployeeInput } from "@/schemas/employee";
import { ROUTES } from "@/config/routes";
import type { Result } from "@/lib/result";

/**
 * Employee (staff) account management from the Admin Portal. Every action is
 * gated on `employees.manage` (STAFF_ADMIN only) in addition to the UI being
 * hidden, and returns the standard Result envelope for inline field errors.
 */

export async function createEmployeeAction(input: CreateEmployeeInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("employees.manage");
    const parsed = createEmployeeSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const created = await createEmployee(parsed.data);
    revalidatePath(ROUTES.admin.employees);
    return created;
  });
}

export async function updateEmployeeAction(input: UpdateEmployeeInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("employees.manage");
    const parsed = updateEmployeeSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const updated = await updateEmployee(parsed.data);
    revalidatePath(ROUTES.admin.employees);
    return updated;
  });
}

export async function deleteEmployeeAction(id: string): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    const ctx = await assertPermission("employees.manage");
    if (!id) throw new ValidationError("Missing employee.");
    if (id === ctx.userId) throw new ValidationError("You can't delete your own account.");
    await deleteEmployee(id);
    revalidatePath(ROUTES.admin.employees);
    return { id };
  });
}
