"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { createCustomerAction } from "@/app/actions/customers";
import type { CreateCustomerInput } from "@/schemas/customer";
import type { FieldErrors } from "@/lib/result";

const PASSWORD_HINT = "At least 8 characters, with uppercase, lowercase, a number, and a special character.";

const EMPTY: CreateCustomerInput = {
  companyName: "",
  accountNumber: "",
  buyerName: "",
  buyerEmail: "",
  role: "CUSTOMER_ADMIN",
  password: "",
};

export function CustomerForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateCustomerInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof CreateCustomerInput>(key: K, value: CreateCustomerInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await createCustomerAction(form);
      if (result.ok) {
        toast(`Login created for ${result.data.buyerEmail}.`);
        setForm(EMPTY);
        router.refresh();
      } else {
        setErrors(result.error.fields ?? {});
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormField label="Company name" htmlFor="companyName" error={errors.companyName} required>
        <input id="companyName" className="field" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
      </FormField>
      <FormField label="Buyer name" htmlFor="buyerName" error={errors.buyerName} required>
        <input id="buyerName" className="field" value={form.buyerName} onChange={(e) => set("buyerName", e.target.value)} />
      </FormField>
      <FormField label="Buyer email" htmlFor="buyerEmail" error={errors.buyerEmail} required>
        <input id="buyerEmail" type="email" className="field" value={form.buyerEmail} onChange={(e) => set("buyerEmail", e.target.value)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password} hint={PASSWORD_HINT} required>
        <input id="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={(e) => set("password", e.target.value)} />
      </FormField>
      <FormField label="Role" htmlFor="role" error={errors.role}>
        <select id="role" className="field" value={form.role} onChange={(e) => set("role", e.target.value as CreateCustomerInput["role"])}>
          <option value="CUSTOMER_ADMIN">Account admin (can manage their account)</option>
          <option value="CUSTOMER_USER">Standard user</option>
        </select>
      </FormField>
      <FormField label="Account number" htmlFor="accountNumber" error={errors.accountNumber} hint="Leave blank to auto-generate (e.g. CG-002).">
        <input id="accountNumber" className="field" value={form.accountNumber ?? ""} onChange={(e) => set("accountNumber", e.target.value)} placeholder="Auto" />
      </FormField>

      <button className="btn wide" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create customer login"}
      </button>
    </form>
  );
}
