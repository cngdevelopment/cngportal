"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { createEmployeeAction, updateEmployeeAction } from "@/app/actions/employees";
import type { EmployeeRow } from "@/data/employees";
import type { FieldErrors } from "@/lib/result";

const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase, a number, and a special character.";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  role: "STAFF" | "STAFF_ADMIN";
  department: string;
  employeeId: string;
  phone: string;
  isActive: boolean;
  password: string;
  confirmPassword: string;
}

function initialState(employee?: EmployeeRow): FormState {
  return {
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    role: (employee?.role as "STAFF" | "STAFF_ADMIN") ?? "STAFF",
    department: employee?.department ?? "",
    employeeId: employee?.employeeId ?? "",
    phone: employee?.phone ?? "",
    isActive: employee?.isActive ?? true,
    password: "",
    confirmPassword: "",
  };
}

export function EmployeeFormModal({
  employee,
  onClose,
}: {
  /** Present = edit mode; absent = create mode. */
  employee?: EmployeeRow;
  onClose: () => void;
}) {
  const isEdit = !!employee;
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => initialState(employee));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const common = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        role: form.role,
        department: form.department,
        employeeId: form.employeeId,
        phone: form.phone,
        isActive: form.isActive,
      };
      const result = isEdit
        ? await updateEmployeeAction({
            id: employee!.id,
            ...common,
            password: form.password,
            confirmPassword: form.confirmPassword,
          })
        : await createEmployeeAction({ ...common, password: form.password });

      if (result.ok) {
        toast(isEdit ? "Employee updated." : `Employee created for ${form.email}.`);
        router.refresh();
        onClose();
      } else {
        setErrors(result.error.fields ?? {});
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <div className="modal-wrap" onClick={() => !pending && onClose()}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{isEdit ? "Edit employee" : "New employee"}</h2>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-2col">
            <FormField label="First name" htmlFor="firstName" error={errors.firstName} required>
              <input id="firstName" className="field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </FormField>
            <FormField label="Last name" htmlFor="lastName" error={errors.lastName} required>
              <input id="lastName" className="field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </FormField>
          </div>

          <FormField label="Email" htmlFor="email" error={errors.email} required>
            <input id="email" type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </FormField>

          <div className="form-2col">
            <FormField label="Role" htmlFor="role" error={errors.role} required>
              <select id="role" className="field" value={form.role} onChange={(e) => set("role", e.target.value as FormState["role"])}>
                <option value="STAFF">Staff — order queue only</option>
                <option value="STAFF_ADMIN">Admin — full access</option>
              </select>
            </FormField>
            <FormField label="Status" htmlFor="isActive" error={errors.isActive} required>
              <select id="isActive" className="field" value={form.isActive ? "active" : "inactive"} onChange={(e) => set("isActive", e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="form-2col">
            <FormField label="Department" htmlFor="department" error={errors.department}>
              <input id="department" className="field" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Warehouse" />
            </FormField>
            <FormField label="Employee ID" htmlFor="employeeId" error={errors.employeeId} hint="Optional, must be unique.">
              <input id="employeeId" className="field" value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} placeholder="Optional" />
            </FormField>
          </div>

          <FormField label="Phone" htmlFor="phone" error={errors.phone}>
            <input id="phone" type="tel" className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" />
          </FormField>

          {isEdit ? (
            <>
              <div className="form-section-label">Reset password (optional)</div>
              <FormField label="New password" htmlFor="password" error={errors.password} hint={PASSWORD_HINT}>
                <input id="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Leave blank to keep current" />
              </FormField>
              <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
                <input id="confirmPassword" type="password" autoComplete="new-password" className="field" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
              </FormField>
            </>
          ) : (
            <FormField label="Password" htmlFor="password" error={errors.password} hint={PASSWORD_HINT} required>
              <input id="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={(e) => set("password", e.target.value)} />
            </FormField>
          )}

          <div className="actions">
            <button type="button" className="btn ghost" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
