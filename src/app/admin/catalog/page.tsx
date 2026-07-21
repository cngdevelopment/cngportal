import { requirePermission } from "@/server/auth/guards";
import { listAdminProducts, listAdminColors } from "@/data/catalog-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { CatalogManager } from "@/components/admin/CatalogManager";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  await requirePermission("catalog.manage");
  const [products, colors] = await Promise.all([listAdminProducts(), listAdminColors()]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Catalog" }]} />
      <PageHeader
        title="Catalog"
        description="Everything customers can order — products, pricing, finishes, and options."
      />
      <div className="cust-panel">
        <CatalogManager products={products} colors={colors} />
      </div>
    </>
  );
}
