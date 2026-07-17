import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/data/context";
import { getOrderForStaff } from "@/data/staff";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/StatusChip";
import { StaffOrderActions } from "@/components/staff/StaffOrderActions";
import { StaffMessages } from "@/components/staff/StaffMessages";
import { nextStatus, previousStep, type PipelineStatus } from "@/lib/pipeline/buildPipeline";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date) {
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

export default async function StaffOrderDetailPage({ params }: { params: { id: string } }) {
  await requireStaff();
  const order = await getOrderForStaff(params.id);
  if (!order) notFound();

  const dm = order.deliveryMethod ?? "SHIP";
  const pipelineInput = { requiresAssembly: order.requiresAssembly, deliveryMethod: dm };
  const canAdvance =
    order.status !== "ON_HOLD" && !!nextStatus(pipelineInput, order.status as PipelineStatus);
  const canSendBack =
    order.status !== "ON_HOLD" && !!previousStep(pipelineInput, order.status as PipelineStatus);

  type RawEvent = {
    id: string;
    fromStatus: string | null;
    toStatus: string | null;
    note: string | null;
    createdAt: Date;
    actorName?: string;
    actor?: { fullName: string } | null;
  };
  const rawEvents = ("events" in order ? (order as { events?: RawEvent[] }).events : undefined) ?? [];
  const events = [...rawEvents].reverse().map((e) => ({
    id: e.id,
    label: e.toStatus ? `${e.fromStatus ?? "—"} → ${e.toStatus}` : "—",
    note: e.note,
    actorName: e.actorName ?? e.actor?.fullName ?? "System",
    when: fmtDateTime(new Date(e.createdAt)),
  }));

  type RawMessage = {
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: Date;
    authorName?: string;
    author?: { fullName: string };
  };
  const rawMessages = ("messages" in order ? (order as { messages?: RawMessage[] }).messages : undefined) ?? [];
  const messages = rawMessages.map((m) => ({
    id: m.id,
    authorName: m.authorName ?? m.author?.fullName ?? "Unknown",
    body: m.body,
    isInternal: m.isInternal,
    createdAt: fmtDateTime(new Date(m.createdAt)),
  }));

  return (
    <>
      <Link href="/staff/queue" className="back">
        &larr; Order queue
      </Link>

      <div className="detail-head">
        <div className="row1">
          <span className="onum" style={{ fontSize: "1.1rem" }}>
            {order.orderNumber}
          </span>
          <StatusChip status={order.status} requiresAssembly={order.requiresAssembly} deliveryMethod={dm} />
          <span className="chip navy">{dm === "PICKUP" ? "Pickup" : "Ship"}</span>
          <span className="meta push">
            {order.accountName} · PO <b>{order.poNumber}</b>
          </span>
        </div>
        <ProgressBar requiresAssembly={order.requiresAssembly} deliveryMethod={dm} status={order.status} />
      </div>

      {dm === "PICKUP" ? (
        <div className="side-box">
          <span className="meta">Pickup contact</span>
          <br />
          <b style={{ fontSize: ".9rem" }}>
            {order.pickupContactName} · {order.pickupContactPhone}
          </b>
        </div>
      ) : (
        order.shipTo && (
          <div className="side-box">
            <span className="meta">Shipping to</span>
            <br />
            <b style={{ fontSize: ".9rem" }}>
              {order.shipTo.label} — {order.shipTo.line1}, {order.shipTo.city}, {order.shipTo.state}{" "}
              {order.shipTo.zip}
            </b>
          </div>
        )
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
                  {l.assembly === "ASSEMBLED" ? "Assembled" : l.assembly === "UNASSEMBLED" ? "RTA" : "—"}
                </td>
                <td>{Number(l.quantity)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h2>Status</h2>
      <StaffOrderActions
        orderId={order.id}
        status={order.status}
        canAdvance={canAdvance}
        canSendBack={canSendBack}
      />

      <h2>Event log</h2>
      <div className="side-box">
        {events.length === 0 ? (
          <span className="meta">No events yet.</span>
        ) : (
          events.map((e) => (
            <div key={e.id} className="event-row">
              <span className="when">{e.when}</span>
              <span>
                <b>{e.label}</b> — {e.actorName}
                {e.note ? <> · {e.note}</> : null}
              </span>
            </div>
          ))
        )}
      </div>

      <StaffMessages orderId={order.id} messages={messages} />
    </>
  );
}
