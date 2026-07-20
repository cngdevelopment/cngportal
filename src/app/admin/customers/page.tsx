import { requirePermission } from "@/server/auth/guards";
import { listAccounts } from "@/data/accounts";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { CustomerForm } from "@/components/admin/CustomerForm";
import { CustomersTable } from "@/components/admin/CustomersTable";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requirePermission("accounts.manage");
  const accounts = await listAccounts();

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Customers" }]} />
      <PageHeader
        title="Customers"
        description="Create a login for a customer so they can sign in with email and password to place orders."
      />

      <div className="cust-cols">
        <div className="cust-panel">
          <h2>New customer</h2>
          <CustomerForm />
        </div>

        <div className="cust-panel">
          <h2>Existing customers</h2>
          <CustomersTable accounts={accounts} />
        </div>
      </div>
    </>
  );
}
