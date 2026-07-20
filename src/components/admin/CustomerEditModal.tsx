"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { updateCustomerAction } from "@/app/actions/customers";
import type { FieldErrors } from "@/lib/result";

const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase, a number, and a special character.";

export interface CustomerEditTarget {
  userId: string;
  companyName: string;
  accountNumber: string;
  buyerName: string;
  buyerEmail: string;
  role: "CUSTOMER_ADMIN" | "CUSTOMER_USER";
  isActive: boolean;
}

export function CustomerEditModal({ target, onClose }: { target: CustomerEditTarget; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: target.companyName,
    accountNumber: target.accountNumber,
    buyerName: target.buyerName,
    buyerEmail: target.buyerEmail,
    role: target.role,
    isActive: target.isActive,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateCustomerAction({ userId: target.userId, ...form });
      if (result.ok) {
        toast("Customer updated.");
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
        <h2>Edit customer</h2>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-2col">
            <FormField label="Company name" htmlFor="companyName" error={errors.companyName} required>
              <input id="companyName" className="field" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
            </FormField>
            <FormField label="Account number" htmlFor="accountNumber" error={errors.accountNumber} required>
              <input id="accountNumber" className="field" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
            </FormField>
          </div>

          <FormField label="Buyer name" htmlFor="buyerName" error={errors.buyerName} required>
            <input id="buyerName" className="field" value={form.buyerName} onChange={(e) => set("buyerName", e.target.value)} />
          </FormField>
          <FormField label="Buyer email" htmlFor="buyerEmail" error={errors.buyerEmail} required>
            <input id="buyerEmail" type="email" className="field" value={form.buyerEmail} onChange={(e) => set("buyerEmail", e.target.value)} />
          </FormField>

          <div className="form-2col">
            <FormField label="Role" htmlFor="role" error={errors.role} required>
              <select id="role" className="field" value={form.role} onChange={(e) => set("role", e.target.value as CustomerEditTarget["role"])}>
                <option value="CUSTOMER_ADMIN">Account admin</option>
                <option value="CUSTOMER_USER">Standard user</option>
              </select>
            </FormField>
            <FormField label="Status" htmlFor="isActive" error={errors.isActive} required>
              <select id="isActive" className="field" value={form.isActive ? "active" : "inactive"} onChange={(e) => set("isActive", e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="form-section-label">Reset password (optional)</div>
          <FormField label="New password" htmlFor="password" error={errors.password} hint={PASSWORD_HINT}>
            <input id="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Leave blank to keep current" />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
            <input id="confirmPassword" type="password" autoComplete="new-password" className="field" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
          </FormField>

          <div className="actions">
            <button type="button" className="btn ghost" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
