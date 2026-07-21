"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { createDiscountAction, updateDiscountAction } from "@/app/actions/discounts";
import type { DiscountRow } from "@/data/discounts";
import type { FieldErrors } from "@/lib/result";

export interface AccountOption {
  id: string;
  name: string;
  accountNumber: string;
}

/** Date <-> yyyy-mm-dd for <input type="date">. */
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function DiscountFormModal({
  discount,
  accounts,
  onClose,
}: {
  /** Present = edit mode. */
  discount?: DiscountRow;
  accounts: AccountOption[];
  onClose: () => void;
}) {
  const isEdit = !!discount;
  const router = useRouter();
  const { toast } = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    code: discount?.code ?? "",
    description: discount?.description ?? "",
    type: (discount?.type ?? "PERCENT") as "PERCENT" | "FIXED",
    value: discount ? String(discount.value) : "",
    isActive: discount?.isActive ?? true,
    startsAt: toDateInput(discount?.startsAt ?? null),
    endsAt: toDateInput(discount?.endsAt ?? null),
    maxRedemptions: discount?.maxRedemptions != null ? String(discount.maxRedemptions) : "",
    maxPerAccount: discount?.maxPerAccount != null ? String(discount.maxPerAccount) : "",
    minOrderSubtotal: discount?.minOrderSubtotal != null ? String(discount.minOrderSubtotal) : "",
    accountIds: discount?.accountIds ?? ([] as string[]),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAccount(id: string) {
    setForm((prev) => ({
      ...prev,
      accountIds: prev.accountIds.includes(id)
        ? prev.accountIds.filter((a) => a !== id)
        : [...prev.accountIds, id],
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const payload = {
      code: form.code,
      description: form.description,
      type: form.type,
      value: form.value.trim() === "" ? NaN : Number(form.value),
      isActive: form.isActive,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      maxRedemptions: numOrNull(form.maxRedemptions),
      maxPerAccount: numOrNull(form.maxPerAccount),
      minOrderSubtotal: numOrNull(form.minOrderSubtotal),
      accountIds: form.accountIds,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateDiscountAction({ id: discount!.id, ...payload })
        : await createDiscountAction(payload);
      if (result.ok) {
        toast(isEdit ? "Discount updated." : `Created code ${form.code.toUpperCase()}.`);
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
        <h2>{isEdit ? "Edit discount" : "New discount"}</h2>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-2col">
            <FormField label="Code" htmlFor="code" error={errors.code} hint="Customers type this at checkout." required>
              <input
                id="code"
                className="field"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="SPRING10"
              />
            </FormField>
            <FormField label="Status" htmlFor="isActive" error={errors.isActive} required>
              <select id="isActive" className="field" value={form.isActive ? "active" : "inactive"} onChange={(e) => set("isActive", e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          <FormField label="Description" htmlFor="description" error={errors.description} hint="Internal note — customers don't see this.">
            <input id="description" className="field" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional" />
          </FormField>

          <div className="form-2col">
            <FormField label="Type" htmlFor="type" error={errors.type} required>
              <select id="type" className="field" value={form.type} onChange={(e) => set("type", e.target.value as "PERCENT" | "FIXED")}>
                <option value="PERCENT">Percentage off</option>
                <option value="FIXED">Fixed amount off</option>
              </select>
            </FormField>
            <FormField
              label={form.type === "PERCENT" ? "Percent off" : "Amount off ($)"}
              htmlFor="value"
              error={errors.value}
              required
            >
              <input
                id="value"
                type="number"
                min="0"
                step={form.type === "PERCENT" ? "1" : "0.01"}
                max={form.type === "PERCENT" ? "100" : undefined}
                className="field"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder={form.type === "PERCENT" ? "10" : "250.00"}
              />
            </FormField>
          </div>

          <div className="form-section-label">Limits (leave blank for no limit)</div>

          <div className="form-2col">
            <FormField label="Starts on" htmlFor="startsAt" error={errors.startsAt}>
              <input id="startsAt" type="date" className="field" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </FormField>
            <FormField label="Ends on" htmlFor="endsAt" error={errors.endsAt}>
              <input id="endsAt" type="date" className="field" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </FormField>
          </div>

          <div className="form-2col">
            <FormField label="Max total uses" htmlFor="maxRedemptions" error={errors.maxRedemptions}>
              <input id="maxRedemptions" type="number" min="1" step="1" className="field" value={form.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} placeholder="Unlimited" />
            </FormField>
            <FormField label="Max uses per customer" htmlFor="maxPerAccount" error={errors.maxPerAccount}>
              <input id="maxPerAccount" type="number" min="1" step="1" className="field" value={form.maxPerAccount} onChange={(e) => set("maxPerAccount", e.target.value)} placeholder="Unlimited" />
            </FormField>
          </div>

          <FormField label="Minimum order subtotal ($)" htmlFor="minOrderSubtotal" error={errors.minOrderSubtotal}>
            <input id="minOrderSubtotal" type="number" min="0" step="0.01" className="field" value={form.minOrderSubtotal} onChange={(e) => set("minOrderSubtotal", e.target.value)} placeholder="No minimum" />
          </FormField>

          <div className="form-section-label">Who can use it</div>
          <div className="field-hint" style={{ marginBottom: 8 }}>
            {form.accountIds.length === 0
              ? "Every customer can use this code."
              : `Restricted to ${form.accountIds.length} customer${form.accountIds.length === 1 ? "" : "s"}.`}
          </div>
          {accounts.length > 0 && (
            <div className="account-picker">
              {accounts.map((a) => (
                <label key={a.id} className="account-pick">
                  <input
                    type="checkbox"
                    checked={form.accountIds.includes(a.id)}
                    onChange={() => toggleAccount(a.id)}
                  />
                  <span>
                    {a.name} <span className="meta">{a.accountNumber}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="actions">
            <button type="button" className="btn ghost" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create discount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
