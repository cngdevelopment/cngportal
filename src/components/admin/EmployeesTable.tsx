"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { EmployeeFormModal } from "@/components/admin/EmployeeFormModal";
import { deleteEmployeeAction } from "@/app/actions/employees";
import type { EmployeeRow } from "@/data/employees";

const ROLE_LABEL: Record<string, string> = {
  STAFF_ADMIN: "Admin",
  STAFF: "Staff",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function EmployeesTable({ employees }: { employees: EmployeeRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [deleting, setDeleting] = useState<EmployeeRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const haystack = [
        e.firstName,
        e.lastName,
        e.fullName,
        e.email,
        ROLE_LABEL[e.role] ?? e.role,
        e.department,
        e.phone,
        e.employeeId,
        e.isActive ? "active" : "inactive",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [employees, query]);

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      const result = await deleteEmployeeAction(target.id);
      setDeleting(null);
      if (result.ok) {
        toast(`Deleted ${target.fullName}.`);
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
          placeholder="Search name, email, role, department, phone, ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search employees"
        />
        <button type="button" className="btn" onClick={() => setCreating(true)}>
          New employee
        </button>
      </div>

      {employees.length === 0 ? (
        <EmptyState title="No employees yet" description="Create your first employee login above." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matches" description="No employees match your search." />
      ) : (
        <div className="table-scroll">
          <table className="list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last login</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <b>{e.fullName}</b>
                    {e.employeeId ? <div className="meta">ID: {e.employeeId}</div> : null}
                  </td>
                  <td>{e.email}</td>
                  <td><span className="chip">{ROLE_LABEL[e.role] ?? e.role}</span></td>
                  <td>{e.department ?? "—"}</td>
                  <td>
                    <span className={`chip ${e.isActive ? "green" : "neutral"}`}>
                      {e.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{fmtDate(e.createdAt)}</td>
                  <td>{fmtDate(e.lastLoginAt)}</td>
                  <td className="row-actions">
                    <button type="button" className="btn ghost sm" onClick={() => setEditing(e)}>
                      Edit
                    </button>
                    <button type="button" className="rm" onClick={() => setDeleting(e)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <EmployeeFormModal onClose={() => setCreating(false)} />}
      {editing && <EmployeeFormModal employee={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this employee?"
          message={
            <>
              This permanently deletes <b>{deleting.fullName}</b> and their login. This can&rsquo;t be undone.
            </>
          }
          confirmLabel="Delete employee"
          danger
          pending={pending}
          onConfirm={confirmDelete}
          onCancel={() => !pending && setDeleting(null)}
        />
      )}
    </>
  );
}
