import "server-only";
import { isDemoMode } from "@/lib/mode";
import { listProductsMock, listColorsMock } from "./mock/store";
import { findProduct } from "./mock/catalog-data";

/** Catalog is global (not tenant-scoped) and read-only for customers. */

export async function listProducts(category: "CABINETS" | "FLOORING") {
  if (isDemoMode()) return listProductsMock(category);
  const { prisma } = await import("./db");
  return prisma.product.findMany({
    where: { category, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      options: true,
      colors: { include: { color: true } },
    },
  });
}

export async function listColors() {
  if (isDemoMode()) return listColorsMock();
  const { prisma } = await import("./db");
  return prisma.color.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProductBySku(sku: string) {
  if (isDemoMode()) return findProduct(sku) ?? null;
  const { prisma } = await import("./db");
  return prisma.product.findUnique({
    where: { sku },
    include: { options: true, colors: { include: { color: true } } },
  });
}
