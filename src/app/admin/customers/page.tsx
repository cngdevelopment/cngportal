import { requirePermission } from "@/server/auth/guards";
import { listAccounts } from "@/data/accounts";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EmptyState } from "@/components/admin/EmptyState";
import { CustomerForm } from "@/components/admin/CustomerForm";
import { DeleteAccountButton } from "@/components/admin/DeleteAccountButton";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER_ADMIN: "Account admin",
  CUSTOMER_USER: "User",
};

export default async function AdminCustomersPage() {
  await requirePermission("accounts.manage");
  const accounts = await listAccounts();

  return (
    <>
      <Breadcrumbs items={[{ label: "Admin", href: ROUTES.admin.overview }, { label: "Customers" }]} />
      <PageHeader
        title="Customers"
        description="Create a login for a customer so they can sign in and place orders."
      />

      <div className="cust-cols">
        <div className="cust-panel">
          <h2>New customer</h2>
          <CustomerForm />
        </div>

        <div className="cust-panel">
          <h2>Existing customers</h2>
          {accounts.length === 0 ? (
            <EmptyState title="No customers yet" description="Create your first customer login on the left." />
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Account #</th>
                  <th>Logins</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td><b>{a.name}</b></td>
                    <td>{a.accountNumber}</td>
                    <td>
                      {a.users.length === 0 ? (
                        <span className="meta">—</span>
                      ) : (
                        a.users.map((u) => (
                          <div key={u.id} className="meta">
                            {u.fullName} · {u.email}{" "}
                            <span className="chip">{ROLE_LABEL[u.role] ?? u.role}</span>
                          </div>
                        ))
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <DeleteAccountButton accountId={a.id} name={a.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
