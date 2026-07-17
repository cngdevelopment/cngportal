import { requireCustomer } from "@/data/context";
import { listProducts, listColors } from "@/data/catalog";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";

export const dynamic = "force-dynamic";

// Plain-JSON shape for the client boundary — Prisma's Decimal isn't
// serializable as-is, so unitsPerBox is coerced to a plain number here.
function toCatalogProduct(p: Awaited<ReturnType<typeof listProducts>>[number]) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    unit: p.unit,
    unitsPerBox: p.unitsPerBox === null || p.unitsPerBox === undefined ? null : Number(p.unitsPerBox),
    price: p.price === null || p.price === undefined ? null : Number(p.price),
    options: p.options.map((o) => ({ name: o.name, values: o.values })),
    colors: p.colors.map((c) => ({ color: c.color })),
  };
}

export default async function NewOrderPage() {
  await requireCustomer();
  const [cabinets, flooring, colors] = await Promise.all([
    listProducts("CABINETS"),
    listProducts("FLOORING"),
    listColors(),
  ]);

  return (
    <>
      <h1>New Order</h1>
      <p className="sub">
        Pick products, choose finish and assembly, then review your order.
      </p>
      <CatalogBrowser
        cabinets={cabinets.map(toCatalogProduct)}
        flooring={flooring.map(toCatalogProduct)}
        colors={colors}
      />
    </>
  );
}
