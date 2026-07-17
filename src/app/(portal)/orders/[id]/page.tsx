import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/data/context";
import { getOrder } from "@/data/orders";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/StatusChip";
import { OrderDetailActions } from "@/components/cart/OrderDetailActions";
import { CustomerMessages } from "@/components/cart/CustomerMessages";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date) {
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { justSubmitted?: string };
}) {
  const ctx = await requireCustomer();
  // Scoped fetch: a UUID from another account finds nothing → 404,
  // never 403 (spec §12.2 — don't confirm existence).
  const order = await getOrder(ctx.accountId, params.id);
  if (!order) notFound();

  const dm = order.deliveryMethod ?? "SHIP";
  const pastReady = ["READY", "OUT_FOR_DELIVERY"].includes(order.status);

  const stepTimes: Record<string, string> = {};
  const events = "events" in order ? (order as { events?: Array<{ toStatus: string | null; createdAt: Date }> }).events ?? [] : [];
  for (const ev of events) {
    if (ev.toStatus) stepTimes[ev.toStatus] = fmtDateTime(new Date(ev.createdAt));
  }

  type RawMessage = { id: string; body: string; createdAt: Date; authorName?: string; author?: { fullName: string } };
  const rawMessages = ("messages" in order ? (order as { messages?: RawMessage[] }).messages : undefined) ?? [];
  const messages = rawMessages.map((m) => ({
    id: m.id,
    authorName: m.authorName ?? m.author?.fullName ?? "Unknown",
    body: m.body,
    createdAt: fmtDateTime(new Date(m.createdAt)),
  }));

  return (
    <>
      <Link href="/dashboard" className="back">
        &larr; All orders
      </Link>

      {searchParams.justSubmitted && (
        <div className="pickup-panel" style={{ background: "var(--navy-wash)", borderColor: "#c6cfdf" }}>
          <b>Order received.</b> We&rsquo;ve emailed a confirmation and our team has been
          notified. You can watch progress on this page.
        </div>
      )}

      <div className="detail-head">
        <div className="row1">
          <span className="onum" style={{ fontSize: "1.1rem" }}>
            {order.orderNumber}
          </span>
          <StatusChip
            status={order.status}
            requiresAssembly={order.requiresAssembly}
            deliveryMethod={dm}
          />
          <span className="chip navy">{dm === "PICKUP" ? "Pickup" : "Ship"}</span>
          <span className="meta push">
            PO <b>{order.poNumber}</b>
            {order.submittedAt ? (
              <>
                {" "}
                · submitted{" "}
                {order.submittedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </>
            ) : null}
          </span>
        </div>
        <ProgressBar
          requiresAssembly={order.requiresAssembly}
          deliveryMethod={dm}
          status={order.status}
          stepTimes={stepTimes}
        />
      </div>

      {dm === "PICKUP" && pastReady && (
        <div className="pickup-panel">
          <b>Ready for pickup</b>
          {process.env.WAREHOUSE_ADDRESS} · {process.env.WAREHOUSE_HOURS}
          <br />
          Give the counter your order number: <b>{order.orderNumber}</b>
          {order.pickupContactName ? (
            <>
              {" "}
              · Contact on file: {order.pickupContactName},{" "}
              {order.pickupContactPhone}
            </>
          ) : null}
        </div>
      )}

      {dm === "SHIP" && order.shipTo && (
        <div className="side-box">
          <span className="meta">Shipping to</span>
          <br />
          <b style={{ fontSize: ".9rem" }}>
            {order.shipTo.label} — {order.shipTo.line1}, {order.shipTo.city},{" "}
            {order.shipTo.state} {order.shipTo.zip}
          </b>
        </div>
      )}

      <h2>Line items</h2>
      <table className="list">
        <thead>
          <tr>
            <th>Product</th>
            <th>Finish / thickness</th>
            <th>Assembly</th>
            <th>Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((l) => {
            const opts = (l.selectedOptions ?? {}) as Record<string, string>;
            return (
              <tr key={l.id}>
                <td>
                  <b>{l.productNameSnapshot}</b>
                  <br />
                  <span className="meta">
                    {l.skuSnapshot}
                    {l.lineNotes ? <> · {l.lineNotes}</> : null}
                  </span>
                </td>
                <td>{l.colorNameSnapshot ?? opts["Thickness"] ?? "—"}</td>
                <td>
                  {l.assembly === "ASSEMBLED"
                    ? "Assembled"
                    : l.assembly === "UNASSEMBLED"
                      ? "RTA"
                      : "—"}
                </td>
                <td>{Number(l.quantity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <OrderDetailActions orderId={order.id} status={order.status} />

      <CustomerMessages orderId={order.id} messages={messages} />
    </>
  );
}
