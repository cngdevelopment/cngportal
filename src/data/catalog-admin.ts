import "server-only";
import { isDemoMode } from "@/lib/mode";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/server/errors";
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateColorInput,
  UpdateColorInput,
} from "@/schemas/catalog";

/**
 * Catalog administration (staff only). Separate from src/data/catalog.ts,
 * which serves the read-only customer catalog.
 *
 * Deletes are guarded: anything referenced by an existing order is
 * deactivated instead of removed, so order history never loses its product.
 */

export interface AdminProductRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: "CABINETS" | "FLOORING";
  subcategory: string | null;
  unit: "EACH" | "BOX";
  unitsPerBox: number | null;
  price: number | null;
  supportsAssembly: boolean;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  maxQuantity: number;
  colorIds: string[];
  optionName: string | null;
  optionValues: string[];
  orderCount: number;
}

export interface AdminColorRow {
  id: string;
  name: string;
  code: string;
  swatchUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  orderCount: number;
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const orNull = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : null;
};

function demoGuard() {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to manage the catalog.");
  }
}

// ── Products ─────────────────────────────────────────────────────────

export async function listAdminProducts(): Promise<AdminProductRow[]> {
  if (isDemoMode()) return [];
  const { prisma } = await import("./db");
  const rows = await prisma.product.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { sku: "asc" }],
    include: {
      colors: { select: { colorId: true } },
      options: { select: { name: true, values: true } },
      _count: { select: { orderItems: true } },
    },
  });
  return rows.map((p) => {
    const option = p.options[0];
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description,
      category: p.category,
      subcategory: p.subcategory,
      unit: p.unit,
      unitsPerBox: num(p.unitsPerBox),
      price: num(p.price),
      supportsAssembly: p.supportsAssembly,
      imageUrl: p.imageUrl,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      maxQuantity: p.maxQuantity,
      colorIds: p.colors.map((c) => c.colorId),
      optionName: option?.name ?? null,
      optionValues: Array.isArray(option?.values) ? (option.values as string[]) : [],
      orderCount: p._count.orderItems,
    };
  });
}

/** Shared write shape for create/update. */
function productData(input: CreateProductInput | UpdateProductInput) {
  return {
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    description: orNull(input.description),
    category: input.category,
    subcategory: orNull(input.subcategory),
    unit: input.unit,
    unitsPerBox: input.unitsPerBox ?? null,
    price: input.price ?? null,
    supportsAssembly: input.supportsAssembly,
    imageUrl: orNull(input.imageUrl),
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    maxQuantity: input.maxQuantity,
  };
}

export async function createProduct(input: CreateProductInput): Promise<{ id: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const data = productData(input);

  if (await prisma.product.findUnique({ where: { sku: data.sku } })) {
    throw new ConflictError(`SKU "${data.sku}" already exists.`);
  }

  const created = await prisma.product.create({
    data: {
      ...data,
      colors: { create: (input.colorIds ?? []).map((colorId) => ({ colorId })) },
      options:
        input.optionName?.trim() && (input.optionValues ?? []).length > 0
          ? { create: { name: input.optionName.trim(), values: input.optionValues ?? [] } }
          : undefined,
    },
    select: { id: true },
  });
  return created;
}

export async function updateProduct(input: UpdateProductInput): Promise<{ id: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const data = productData(input);

  const existing = await prisma.product.findUnique({ where: { id: input.id } });
  if (!existing) throw new NotFoundError("That product no longer exists.");
  if (data.sku !== existing.sku && (await prisma.product.findUnique({ where: { sku: data.sku } }))) {
    throw new ConflictError(`SKU "${data.sku}" already exists.`);
  }

  const optionName = input.optionName?.trim();
  const optionValues = input.optionValues ?? [];

  // Colors and options are replaced wholesale — simplest correct semantics.
  await prisma.$transaction([
    prisma.productColor.deleteMany({ where: { productId: input.id } }),
    prisma.productOption.deleteMany({ where: { productId: input.id } }),
    prisma.product.update({
      where: { id: input.id },
      data: {
        ...data,
        colors: { create: (input.colorIds ?? []).map((colorId) => ({ colorId })) },
        options:
          optionName && optionValues.length > 0
            ? { create: { name: optionName, values: optionValues } }
            : undefined,
      },
    }),
  ]);
  return { id: input.id };
}

/** Deletes when unused; deactivates when the product appears on orders. */
export async function removeProduct(id: string): Promise<{ deleted: boolean; name: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) throw new NotFoundError("That product no longer exists.");

  if (product._count.orderItems > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, name: product.name };
  }

  await prisma.$transaction([
    prisma.productColor.deleteMany({ where: { productId: id } }),
    prisma.productOption.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);
  return { deleted: true, name: product.name };
}

// ── Colors ───────────────────────────────────────────────────────────

export async function listAdminColors(): Promise<AdminColorRow[]> {
  if (isDemoMode()) return [];
  const { prisma } = await import("./db");
  const rows = await prisma.color.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, orderItems: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    swatchUrl: c.swatchUrl,
    isActive: c.isActive,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    orderCount: c._count.orderItems,
  }));
}

export async function createColor(input: CreateColorInput): Promise<{ id: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const code = input.code.trim().toUpperCase();
  if (await prisma.color.findUnique({ where: { code } })) {
    throw new ConflictError(`Color code "${code}" already exists.`);
  }
  return prisma.color.create({
    data: {
      code,
      name: input.name.trim(),
      swatchUrl: orNull(input.swatchUrl),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
    select: { id: true },
  });
}

export async function updateColor(input: UpdateColorInput): Promise<{ id: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const code = input.code.trim().toUpperCase();
  const existing = await prisma.color.findUnique({ where: { id: input.id } });
  if (!existing) throw new NotFoundError("That color no longer exists.");
  if (code !== existing.code && (await prisma.color.findUnique({ where: { code } }))) {
    throw new ConflictError(`Color code "${code}" already exists.`);
  }
  await prisma.color.update({
    where: { id: input.id },
    data: {
      code,
      name: input.name.trim(),
      swatchUrl: orNull(input.swatchUrl),
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
  return { id: input.id };
}

/** Deletes when unused; deactivates when the color appears on orders. */
export async function removeColor(id: string): Promise<{ deleted: boolean; name: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const color = await prisma.color.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!color) throw new NotFoundError("That color no longer exists.");

  if (color._count.orderItems > 0) {
    await prisma.color.update({ where: { id }, data: { isActive: false } });
    return { deleted: false, name: color.name };
  }

  await prisma.$transaction([
    prisma.productColor.deleteMany({ where: { colorId: id } }),
    prisma.color.delete({ where: { id } }),
  ]);
  return { deleted: true, name: color.name };
}
