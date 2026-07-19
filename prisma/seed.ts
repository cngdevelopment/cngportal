/**
 * Seed — spec §12.7 + Appendix A.
 * Colors use the FLYER names (Natural Wood, Pearl Glazed), which differ from
 * Appendix A's "Natural Shaker"/"Pearl Shaker". Confirm with Andrew; renaming
 * later is a data update, historical orders are safe via snapshots.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The 7 cabinet colors — from the C&G flyer
const COLORS = [
  { name: "Grey Shaker", code: "GS" },
  { name: "Natural Wood", code: "NW" },
  { name: "Navy Blue", code: "NB" },
  { name: "Pearl Glazed", code: "PG" },
  { name: "Smokey Black", code: "SB" },
  { name: "Super White", code: "SW" },
  { name: "White Shaker", code: "WS" },
];

// The 10 flooring SKUs — Appendix A. Thickness is the only option.
// JP1003 and JP1008 are the two dual-thickness regression-test SKUs.
const FLOORING: Array<{ sku: string; thicknesses: string[] }> = [
  { sku: "JP1001", thicknesses: ["6.5mm"] },
  { sku: "JP1003", thicknesses: ["4.5mm", "6.5mm"] },
  { sku: "JP1006", thicknesses: ["4.5mm"] },
  { sku: "JP1007", thicknesses: ["4.5mm"] },
  { sku: "JP1008", thicknesses: ["4.5mm", "8.5mm"] },
  { sku: "JP1010", thicknesses: ["6.5mm"] },
  { sku: "JP1011", thicknesses: ["5.5mm"] },
  { sku: "JP1012", thicknesses: ["6.0mm"] },
  { sku: "JP1013", thicknesses: ["6.0mm"] },
  { sku: "JP1014", thicknesses: ["6.0mm"] },
];

// Placeholder cabinets until Andrew's SKU sheet is imported (spec §16).
// Real list is a data import — schema does not change.
const CABINETS: Array<{ sku: string; name: string; subcategory: string }> = [
  // Base
  { sku: "B09", name: 'Base Cabinet 9"', subcategory: "Base" },
  { sku: "B12", name: 'Base Cabinet 12"', subcategory: "Base" },
  { sku: "B15", name: 'Base Cabinet 15"', subcategory: "Base" },
  { sku: "B18", name: 'Base Cabinet 18"', subcategory: "Base" },
  { sku: "B24", name: 'Base Cabinet 24"', subcategory: "Base" },
  { sku: "B30", name: 'Base Cabinet 30"', subcategory: "Base" },
  { sku: "B36", name: 'Base Cabinet 36"', subcategory: "Base" },
  // Wall
  { sku: "W1230", name: 'Wall Cabinet 12x30"', subcategory: "Wall" },
  { sku: "W1530", name: 'Wall Cabinet 15x30"', subcategory: "Wall" },
  { sku: "W1830", name: 'Wall Cabinet 18x30"', subcategory: "Wall" },
  { sku: "W2430", name: 'Wall Cabinet 24x30"', subcategory: "Wall" },
  { sku: "W3030", name: 'Wall Cabinet 30x30"', subcategory: "Wall" },
  { sku: "W3630", name: 'Wall Cabinet 36x30"', subcategory: "Wall" },
  // Tall
  { sku: "T1884", name: 'Tall Pantry 18x84"', subcategory: "Tall" },
  { sku: "T2484", name: 'Tall Pantry 24x84"', subcategory: "Tall" },
  { sku: "T3084", name: 'Tall Pantry 30x84"', subcategory: "Tall" },
  // Vanity
  { sku: "V24", name: 'Vanity 24"', subcategory: "Vanity" },
  { sku: "V30", name: 'Vanity 30"', subcategory: "Vanity" },
  { sku: "V36", name: 'Vanity 36"', subcategory: "Vanity" },
  { sku: "V48", name: 'Vanity 48"', subcategory: "Vanity" },
];

async function main() {
  // Colors
  const colorRows = [];
  for (const [i, c] of COLORS.entries()) {
    colorRows.push(
      await prisma.color.upsert({
        where: { code: c.code },
        update: { name: c.name, sortOrder: i },
        create: { ...c, sortOrder: i },
      })
    );
  }

  // Cabinets — every cabinet gets all 7 colors, supports assembly
  for (const [i, cab] of CABINETS.entries()) {
    const p = await prisma.product.upsert({
      where: { sku: cab.sku },
      update: {},
      create: {
        sku: cab.sku,
        name: cab.name,
        category: "CABINETS",
        subcategory: cab.subcategory,
        unit: "EACH",
        supportsAssembly: true,
        sortOrder: i,
      },
    });
    for (const color of colorRows) {
      await prisma.productColor.upsert({
        where: { productId_colorId: { productId: p.id, colorId: color.id } },
        update: {},
        create: { productId: p.id, colorId: color.id, skuSuffix: color.code },
      });
    }
  }

  // Flooring — no colors, no assembly; uniform Thickness option row even
  // for single-value SKUs (spec Appendix A)
  for (const [i, f] of FLOORING.entries()) {
    const p = await prisma.product.upsert({
      where: { sku: f.sku },
      update: {},
      create: {
        sku: f.sku,
        name: f.sku, // marketing names TBD (spec §16) — bare SKU is the fallback
        category: "FLOORING",
        subcategory: "Plank",
        unit: "BOX",
        unitsPerBox: 23.4, // fallback per §16 — display-only math
        supportsAssembly: false,
        sortOrder: i,
      },
    });
    const existing = await prisma.productOption.findFirst({
      where: { productId: p.id, name: "Thickness" },
    });
    if (!existing) {
      await prisma.productOption.create({
        data: {
          productId: p.id,
          name: "Thickness",
          values: f.thicknesses,
          isRequired: true,
        },
      });
    }
  }

  // Starter account for first-run setup (rename/replace once real accounts exist).
  const starter = await prisma.account.upsert({
    where: { accountNumber: "CG-001" },
    update: {},
    create: {
      name: "Meridian Builders LLC",
      accountNumber: "CG-001",
      addresses: {
        create: {
          label: "Main jobsite",
          line1: "123 Main St",
          city: "St. Louis",
          state: "MO",
          zip: "63101",
          isDefault: true,
        },
      },
    },
  });

  console.log(`Seeded ${COLORS.length} colors, ${CABINETS.length} cabinets, ${FLOORING.length} flooring SKUs, starter account ${starter.accountNumber}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
