import Link from "next/link";
import { requirePermission } from "@/server/auth/guards";
import { listAccounts } from "@/data/accounts";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EmptyState } from "@/components/admin/EmptyState";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  await requirePermission("accounts.manage");
  const accounts = await listAccounts();

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Stores" }]} />
      <PageHeader title="Stores" description="Every customer account. Open one to see its order history." />

      {accounts.length === 0 ? (
        <EmptyState title="No stores yet" description="Customer accounts will appear here once created." />
      ) : (
        <div className="store-chip-grid">
          {accounts.map((account) => (
            <Link key={account.id} href={ROUTES.admin.store(account.id)} className="store-chip">
              <span className="store-chip-name">{account.name}</span>
              <span className="store-chip-number">{account.accountNumber}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
