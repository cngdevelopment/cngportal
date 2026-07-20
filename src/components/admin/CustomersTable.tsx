"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { CustomerEditModal, type CustomerEditTarget } from "@/components/admin/CustomerEditModal";
import { deleteAccountAction } from "@/app/actions/customers";
import type { AccountRow } from "@/data/accounts";

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER_ADMIN: "Account admin",
  CUSTOMER_USER: "User",
};

interface FlatRow {
  key: string;
  accountId: string;
  accountName: string;
  accountNumber: string;
  user?: AccountRow["users"][number];
}

function flatten(accounts: AccountRow[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const a of accounts) {
    if (a.users.length === 0) {
      rows.push({ key: a.id, accountId: a.id, accountName: a.name, accountNumber: a.accountNumber });
    } else {
      for (const u of a.users) {
        rows.push({ key: u.id, accountId: a.id, accountName: a.name, accountNumber: a.accountNumber, user: u });
      }
    }
  }
  return rows;
}

export function CustomersTable({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CustomerEditTarget | null>(null);
  const [deleting, setDeleting] = useState<FlatRow | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => flatten(accounts), [accounts]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.accountName,
        r.accountNumber,
        r.user?.fullName,
        r.user?.email,
        r.user ? ROLE_LABEL[r.user.role] ?? r.user.role : "",
        r.user ? (r.user.isActive ? "active" : "inactive") : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query]);

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteAccountAction(target.accountId);
      setDeleting(null);
      if (result.ok) {
        toast(`Deleted ${target.accountName}.`);
        router.refresh();
      } else {
        toast(result.error.message, "error");
      }
    });
  }

  if (accounts.length === 0) {
    return <EmptyState title="No customers yet" description="Create your first customer login on the left." />;
  }

  return (
    <>
      <div className="table-toolbar">
        <input
          className="field search"
          type="search"
          placeholder="Search company, account #, buyer, email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search customers"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No matches" description="No customers match your search." />
      ) : (
        <div className="table-scroll">
          <table className="list">
            <thead>
              <tr>
                <th>Company</th>
                <th>Account #</th>
                <th>Buyer</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.key}>
                  <td><b>{r.accountName}</b></td>
                  <td>{r.accountNumber}</td>
                  <td>{r.user?.fullName ?? <span className="meta">—</span>}</td>
                  <td>{r.user?.email ?? <span className="meta">—</span>}</td>
                  <td>{r.user ? <span className="chip">{ROLE_LABEL[r.user.role] ?? r.user.role}</span> : "—"}</td>
                  <td>
                    {r.user ? (
                      <span className={`chip ${r.user.isActive ? "green" : "neutral"}`}>
                        {r.user.isActive ? "Active" : "Inactive"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="row-actions">
                    {r.user && (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() =>
                          setEditing({
                            userId: r.user!.id,
                            companyName: r.accountName,
                            accountNumber: r.accountNumber,
                            buyerName: r.user!.fullName,
                            buyerEmail: r.user!.email,
                            role: (r.user!.role as CustomerEditTarget["role"]) ?? "CUSTOMER_ADMIN",
                            isActive: r.user!.isActive,
                          })
                        }
                      >
                        Edit
                      </button>
                    )}
                    <button type="button" className="rm" onClick={() => setDeleting(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <CustomerEditModal target={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this customer?"
          message={
            <>
              This permanently removes <b>{deleting.accountName}</b> and all of its logins. This can&rsquo;t be undone.
            </>
          }
          confirmLabel="Delete customer"
          danger
          pending={pending}
          onConfirm={confirmDelete}
          onCancel={() => !pending && setDeleting(null)}
        />
      )}
    </>
  );
}
