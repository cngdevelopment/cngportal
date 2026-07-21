"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { DiscountFormModal, type AccountOption } from "@/components/admin/DiscountFormModal";
import { deleteDiscountAction } from "@/app/actions/discounts";
import type { DiscountRow } from "@/data/discounts";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function valueLabel(d: DiscountRow) {
  return d.type === "PERCENT" ? `${d.value}% off` : `$${d.value.toFixed(2)} off`;
}

/** Human summary of every constraint on the code. */
function limitsLabel(d: DiscountRow): string {
  const parts: string[] = [];
  const start = fmtDate(d.startsAt);
  const end = fmtDate(d.endsAt);
  if (start && end) parts.push(`${start} – ${end}`);
  else if (start) parts.push(`from ${start}`);
  else if (end) parts.push(`until ${end}`);
  if (d.minOrderSubtotal != null) parts.push(`min $${d.minOrderSubtotal.toFixed(2)}`);
  if (d.maxRedemptions != null) parts.push(`${d.maxRedemptions} total`);
  if (d.maxPerAccount != null) parts.push(`${d.maxPerAccount} per customer`);
  if (d.accountIds.length > 0) parts.push(`${d.accountIds.length} customer${d.accountIds.length === 1 ? "" : "s"} only`);
  return parts.length ? parts.join(" · ") : "No limits";
}

/** A code can be active but still unusable (expired, fully redeemed). */
function statusOf(d: DiscountRow): { label: string; chip: string } {
  if (!d.isActive) return { label: "Inactive", chip: "neutral" };
  const now = Date.now();
  if (d.startsAt && now < new Date(d.startsAt).getTime()) return { label: "Scheduled", chip: "amber" };
  if (d.endsAt && now > new Date(d.endsAt).getTime()) return { label: "Expired", chip: "neutral" };
  if (d.maxRedemptions != null && d.timesRedeemed >= d.maxRedemptions) {
    return { label: "Used up", chip: "neutral" };
  }
  return { label: "Active", chip: "green" };
}

export function DiscountsTable({
  discounts,
  accounts,
}: {
  discounts: DiscountRow[];
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<DiscountRow | null>(null);
  const [deleting, setDeleting] = useState<DiscountRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return discounts;
    return discounts.filter((d) =>
      [d.code, d.description, valueLabel(d), statusOf(d).label]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [discounts, query]);

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteDiscountAction(target.id);
      setDeleting(null);
      if (result.ok) {
        toast(`Deleted ${target.code}.`);
        router.refresh();
      } else {
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <>
      <div className="table-toolbar">
        <input
          className="field search"
          type="search"
          placeholder="Search codes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search discounts"
        />
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          New discount
        </button>
      </div>

      {discounts.length === 0 ? (
        <EmptyState title="No discount codes yet" description="Create your first code to start offering promotions." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="No codes match your search." />
      ) : (
        <div className="table-scroll">
          <table className="list">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Limits</th>
                <th>Used</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const status = statusOf(d);
                return (
                  <tr key={d.id}>
                    <td>
                      <b>{d.code}</b>
                      {d.description ? <div className="meta">{d.description}</div> : null}
                    </td>
                    <td>{valueLabel(d)}</td>
                    <td className="meta">{limitsLabel(d)}</td>
                    <td>
                      {d.timesRedeemed}
                      {d.maxRedemptions != null ? ` / ${d.maxRedemptions}` : ""}
                    </td>
                    <td>
                      <span className={`chip ${status.chip}`}>{status.label}</span>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn ghost sm" onClick={() => setEditing(d)}>
                        Edit
                      </button>
                      <button type="button" className="rm" onClick={() => setDeleting(d)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {creating && <DiscountFormModal accounts={accounts} onClose={() => setCreating(false)} />}
      {editing && <DiscountFormModal discount={editing} accounts={accounts} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this discount?"
          message={
            <>
              Code <b>{deleting.code}</b> will stop working immediately. Past orders keep the discount
              they already received.
            </>
          }
          confirmLabel="Delete discount"
          danger
          pending={pending}
          onConfirm={confirmDelete}
          onCancel={() => !pending && setDeleting(null)}
        />
      )}
    </>
  );
}
