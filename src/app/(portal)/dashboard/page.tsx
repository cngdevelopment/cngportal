import Link from "next/link";
import { requireCustomer } from "@/data/context";
import { listOrders } from "@/data/orders";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/StatusChip";

export const dynamic = "force-dynamic";

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const ctx = await requireCustomer();
  const orders = await listOrders(ctx.accountId);

  const active = orders.filter(
    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"
  );
  const recent = orders.filter((o) => o.status === "COMPLETED").slice(0, 5);

  return (
    <>
      <h1>Orders</h1>
      <p className="sub">Everything your account has in the pipeline right now.</p>
      <Link href="/new-order" className="btn">
        New Order
      </Link>

      <h2>Active</h2>
      {active.length === 0 ? (
        <div className="empty">No active orders.</div>
      ) : (
        active.map((o) => (
          <div key={o.id} className="order-card">
            <div className="row1">
              <Link href={`/orders/${o.id}`} className="onum">
                {o.orderNumber}
              </Link>
              <StatusChip
                status={o.status}
                requiresAssembly={o.requiresAssembly}
                deliveryMethod={o.deliveryMethod ?? "SHIP"}
              />
              <span className="chip red">
                {o.deliveryMethod === "PICKUP" ? "Pickup" : "Ship"}
              </span>
              <span className="meta push">
                PO <b>{o.poNumber}</b> · {o._count.items} lines
                {o.submittedAt ? <> · submitted {fmt(o.submittedAt)}</> : null}
              </span>
            </div>
            <ProgressBar
              requiresAssembly={o.requiresAssembly}
              deliveryMethod={o.deliveryMethod ?? "SHIP"}
              status={o.status}
            />
          </div>
        ))
      )}

      {recent.length > 0 && (
        <>
          <h2>Recent — delivered / picked up</h2>
          {recent.map((o) => (
            <div key={o.id} className="order-card">
              <div className="row1">
                <Link href={`/orders/${o.id}`} className="onum">
                  {o.orderNumber}
                </Link>
                <StatusChip
                  status={o.status}
                  requiresAssembly={o.requiresAssembly}
                  deliveryMethod={o.deliveryMethod ?? "SHIP"}
                />
                <span className="meta push">
                  PO <b>{o.poNumber}</b> · {o._count.items} lines
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
