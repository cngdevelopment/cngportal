"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/StatusChip";

export interface StaffOrderRow {
  id: string;
  orderNumber: string;
  accountName: string;
  poNumber: string | null;
  status: string;
  requiresAssembly: boolean;
  deliveryMethod: "SHIP" | "PICKUP" | null;
  submittedAt: string | null;
  itemCount: number;
}

type FilterKey = "ALL" | "NEEDS_ASSEMBLY" | "ON_HOLD" | "READY" | "COMPLETED";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All active" },
  { key: "NEEDS_ASSEMBLY", label: "Assembled & not yet built" },
  { key: "ON_HOLD", label: "On hold" },
  { key: "READY", label: "Ready" },
  { key: "COMPLETED", label: "Completed" },
];

function matches(o: StaffOrderRow, f: FilterKey): boolean {
  switch (f) {
    case "ALL":
      return o.status !== "COMPLETED" && o.status !== "CANCELLED";
    case "NEEDS_ASSEMBLY":
      return o.requiresAssembly && (o.status === "PROCESSING" || o.status === "ASSEMBLING");
    case "ON_HOLD":
      return o.status === "ON_HOLD";
    case "READY":
      return o.status === "READY";
    case "COMPLETED":
      return o.status === "COMPLETED";
  }
}

export function StaffQueueTable({ orders }: { orders: StaffOrderRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, orders.filter((o) => matches(o, f.key)).length])),
    [orders]
  );

  const rows = orders.filter((o) => matches(o, filter));

  return (
    <>
      <div className="kpi-row">
        {FILTERS.map((f) => (
          <div className="kpi" key={f.key}>
            <b>{counts[f.key]}</b>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <div className="filter-row">
        {FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? "on" : ""} onClick={() => setFilter(f.key)}>
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="empty">No orders match this filter.</div>
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>Order</th>
              <th>Account</th>
              <th>PO</th>
              <th>Method</th>
              <th>Status</th>
              <th>Lines</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link href={`/staff/orders/${o.id}`} className="onum">
                    {o.orderNumber}
                  </Link>
                </td>
                <td>{o.accountName}</td>
                <td>{o.poNumber}</td>
                <td>{o.deliveryMethod === "PICKUP" ? "Pickup" : "Ship"}</td>
                <td>
                  <StatusChip
                    status={o.status}
                    requiresAssembly={o.requiresAssembly}
                    deliveryMethod={o.deliveryMethod ?? "SHIP"}
                  />
                </td>
                <td>{o.itemCount}</td>
                <td>{o.submittedAt ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
