/**
 * Seed — loads the canonical catalog (colors, cabinets with prices, flooring
 * SKUs) straight from the app's single source of truth
 * (src/data/mock/catalog-data.ts), so the database matches exactly what the
 * app shows.
 *
 * Uses the DIRECT connection and batch inserts, so it runs in seconds
 * instead of thousands of pooled round-trips. Catalog tables are wiped and
 * rebuilt each run for a clean, deterministic result — safe because the
 * catalog is reference data (this is a first-run/setup tool). It intentionally
 * does NOT touch accounts, users, or orders.
 */
import { PrismaClient } from "@prisma/client";
import { MOCK_PRODUCTS, MOCK_COLORS } from "@/data/mock/catalog-data";

// Direct (non-pooled) connection for fast bulk writes; falls back to default.
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

async function main() {
  // Colors — upsert (keep ids stable for any existing references).
  const colorIdByCode = new Map<string, string>();
  for (const c of MOCK_COLORS) {
    const row = await prisma.color.upsert({
      where: { code: c.code },
      update: { name: c.name, sortOrder: c.sortOrder },
      create: { name: c.name, code: c.code, sortOrder: c.sortOrder },
    });
    colorIdByCode.set(c.code, row.id);
  }

  // Rebuild the catalog cleanly (removes any stale/placeholder products).
  await prisma.productColor.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.product.deleteMany();

  // Products — one batch insert.
  await prisma.product.createMany({
    data: MOCK_PRODUCTS.map((p) => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      unit: p.unit,
      unitsPerBox: p.unitsPerBox ?? null,
      price: p.price ?? null,
      supportsAssembly: p.supportsAssembly,
      sortOrder: p.sortOrder,
    })),
  });

  const productIdBySku = new Map(
    (await prisma.product.findMany({ select: { id: true, sku: true } })).map((p) => [p.sku, p.id])
  );

  // Product ↔ color links — one batch insert.
  const colorLinks = MOCK_PRODUCTS.flatMap((p) => {
    const productId = productIdBySku.get(p.sku);
    if (!productId) return [];
    return p.colors.flatMap((ref) => {
      const colorId = colorIdByCode.get(ref.color.code);
      return colorId ? [{ productId, colorId, skuSuffix: ref.color.code }] : [];
    });
  });
  await prisma.productColor.createMany({ data: colorLinks });

  // Product options (flooring thickness) — one batch insert.
  const options = MOCK_PRODUCTS.flatMap((p) => {
    const productId = productIdBySku.get(p.sku);
    if (!productId) return [];
    return p.options.map((o) => ({ productId, name: o.name, values: o.values, isRequired: o.isRequired }));
  });
  if (options.length) await prisma.productOption.createMany({ data: options });

  // Starter account (rename/replace once real accounts exist).
  const starter = await prisma.account.upsert({
    where: { accountNumber: "CG-001" },
    update: {},
    create: {
      name: "Meridian Builders LLC",
      accountNumber: "CG-001",
      addresses: {
        create: { label: "Main jobsite", line1: "123 Main St", city: "St. Louis", state: "MO", zip: "63101", isDefault: true },
      },
    },
  });

  const cabinets = MOCK_PRODUCTS.filter((p) => p.category === "CABINETS").length;
  const flooring = MOCK_PRODUCTS.filter((p) => p.category === "FLOORING").length;
  console.log(
    `Seeded ${MOCK_COLORS.length} colors, ${cabinets} cabinets, ${flooring} flooring SKUs, ${colorLinks.length} color links, starter account ${starter.accountNumber}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
