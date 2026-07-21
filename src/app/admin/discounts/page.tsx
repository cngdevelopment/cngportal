import { requirePermission } from "@/server/auth/guards";
import { listDiscounts } from "@/data/discounts";
import { listAccounts } from "@/data/accounts";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { DiscountsTable } from "@/components/admin/DiscountsTable";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  await requirePermission("discounts.manage");
  const [discounts, accounts] = await Promise.all([listDiscounts(), listAccounts()]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Discounts" }]} />
      <PageHeader
        title="Discounts"
        description="Promo codes customers can enter at checkout. Set the amount, dates, usage limits, and who can use them."
      />
      <div className="cust-panel">
        <DiscountsTable
          discounts={discounts}
          accounts={accounts.map((a) => ({ id: a.id, name: a.name, accountNumber: a.accountNumber }))}
        />
      </div>
    </>
  );
}
