"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/guards";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import {
  createProduct,
  updateProduct,
  removeProduct,
  createColor,
  updateColor,
  removeColor,
} from "@/data/catalog-admin";
import {
  createProductSchema,
  updateProductSchema,
  createColorSchema,
  updateColorSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateColorInput,
  type UpdateColorInput,
} from "@/schemas/catalog";
import { ROUTES } from "@/config/routes";
import type { Result } from "@/lib/result";

/**
 * Catalog administration. Every action is gated on catalog.manage and
 * revalidates both the admin screen and the customer-facing catalog.
 */

function revalidateCatalog() {
  revalidatePath(ROUTES.admin.catalog);
  revalidatePath(ROUTES.newOrder);
}

export async function createProductAction(input: CreateProductInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("catalog.manage");
    const parsed = createProductSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const created = await createProduct(parsed.data);
    revalidateCatalog();
    return created;
  });
}

export async function updateProductAction(input: UpdateProductInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("catalog.manage");
    const parsed = updateProductSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const updated = await updateProduct(parsed.data);
    revalidateCatalog();
    return updated;
  });
}

export async function removeProductAction(
  id: string
): Promise<Result<{ deleted: boolean; name: string }>> {
  return runAction(async () => {
    await assertPermission("catalog.manage");
    if (!id) throw new ValidationError("Missing product.");
    const result = await removeProduct(id);
    revalidateCatalog();
    return result;
  });
}

export async function createColorAction(input: CreateColorInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("catalog.manage");
    const parsed = createColorSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const created = await createColor(parsed.data);
    revalidateCatalog();
    return created;
  });
}

export async function updateColorAction(input: UpdateColorInput): Promise<Result<{ id: string }>> {
  return runAction(async () => {
    await assertPermission("catalog.manage");
    const parsed = updateColorSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const updated = await updateColor(parsed.data);
    revalidateCatalog();
    return updated;
  });
}

export async function removeColorAction(
  id: string
): Promise<Result<{ deleted: boolean; name: string }>> {
  return runAction(async () => {
    await assertPermission("catalog.manage");
    if (!id) throw new ValidationError("Missing color.");
    const result = await removeColor(id);
    revalidateCatalog();
    return result;
  });
}
