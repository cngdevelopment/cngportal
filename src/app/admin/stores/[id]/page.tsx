import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/auth/guards";
import { listAccounts } from "@/data/accounts";
import { listOrdersForAccount } from "@/data/staff";
import { PageHeader } from "@/components/admin/PageHeader";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusChip } from "@/components/StatusChip";
import { ROUTES } from "@/config/routes";

export const dynamic = "force-dynamic";

export default async function AdminStorePage({ params }: { params: { id: string } }) {
  await requirePermission("accounts.manage");
  const accounts = await listAccounts();
  const account = accounts.find((a) => a.id === params.id);
  if (!account) notFound();

  const orders = await listOrdersForAccount(account.id);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Admin", href: ROUTES.admin.overview },
          { label: "Stores", href: ROUTES.admin.stores },
          { label: account.name },
        ]}
      />
      <PageHeader title={account.name} description={`Account ${account.accountNumber} — every order placed.`} />

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="This account hasn't placed any orders." />
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>Order</th>
              <th>PO</th>
              <th>Submitted</th>
              <th>Lines</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={ROUTES.staff.order(o.id)} className="onum">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>{o.poNumber}</td>
                <td>
                  {o.submittedAt
                    ? o.submittedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td>{o._count.items}</td>
                <td>{o.deliveryMethod === "PICKUP" ? "Pickup" : "Ship"}</td>
                <td>
                  <StatusChip
                    status={o.status}
                    requiresAssembly={o.requiresAssembly}
                    deliveryMethod={o.deliveryMethod ?? "SHIP"}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
