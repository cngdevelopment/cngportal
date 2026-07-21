import Link from "next/link";
import { requireCustomer } from "@/data/context";
import { listOrders } from "@/data/orders";
import { StatusChip } from "@/components/StatusChip";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const ctx = await requireCustomer();
  const orders = await listOrders(ctx.accountId);

  return (
    <>
      <h1>Order History</h1>
      <p className="sub">Every order on your account.</p>
      {orders.length === 0 ? (
        <div className="empty">No orders yet.</div>
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
                  <Link href={`/orders/${o.id}`} className="onum">
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
                    : "-"}
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
