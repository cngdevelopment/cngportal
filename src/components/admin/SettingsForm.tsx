"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { updateSettingsAction } from "@/app/actions/settings";
import type { UpdateSettingsInput } from "@/schemas/settings";
import type { AppSettings } from "@/server/settings/settings";
import type { FieldErrors } from "@/lib/result";

function toFormState(s: AppSettings): UpdateSettingsInput {
  return {
    companyName: s.companyName,
    portalName: s.portalName,
    supportEmail: s.supportEmail,
    supportPhone: s.supportPhone,
    warehouseAddress: s.warehouse.address,
    warehouseHours: s.warehouse.hours,
    warehousePhone: s.warehouse.phone,
    announcementEnabled: s.announcement.enabled,
    announcementMessage: s.announcement.message,
    maintenanceMode: s.maintenanceMode,
  };
}

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const { toast } = useToast();
  const [form, setForm] = useState<UpdateSettingsInput>(() => toFormState(settings));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  function set<K extends keyof UpdateSettingsInput>(key: K, value: UpdateSettingsInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startTransition(async () => {
      const result = await updateSettingsAction(form);
      if (result.ok) {
        setForm(toFormState(result.data));
        toast("Settings saved.");
      } else {
        setErrors(result.error.fields ?? {});
        toast(result.error.message, "error");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h2>Company</h2>
      <div className="form-grid">
        <FormField label="Company name" htmlFor="companyName" error={errors.companyName} required>
          <input id="companyName" className="field" value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </FormField>
        <FormField label="Portal name" htmlFor="portalName" error={errors.portalName} hint="Shown under the logo on the customer portal." required>
          <input id="portalName" className="field" value={form.portalName} onChange={(e) => set("portalName", e.target.value)} />
        </FormField>
        <FormField label="Support email" htmlFor="supportEmail" error={errors.supportEmail} required>
          <input id="supportEmail" type="email" className="field" value={form.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
        </FormField>
        <FormField label="Support phone" htmlFor="supportPhone" error={errors.supportPhone} required>
          <input id="supportPhone" className="field" value={form.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
        </FormField>
      </div>

      <h2>Warehouse &amp; Pickup</h2>
      <div className="form-grid">
        <FormField label="Warehouse address" htmlFor="warehouseAddress" error={errors.warehouseAddress} required>
          <input id="warehouseAddress" className="field" value={form.warehouseAddress} onChange={(e) => set("warehouseAddress", e.target.value)} />
        </FormField>
        <FormField label="Pickup hours" htmlFor="warehouseHours" error={errors.warehouseHours} required>
          <input id="warehouseHours" className="field" value={form.warehouseHours} onChange={(e) => set("warehouseHours", e.target.value)} />
        </FormField>
        <FormField label="Warehouse phone" htmlFor="warehousePhone" error={errors.warehousePhone} required>
          <input id="warehousePhone" className="field" value={form.warehousePhone} onChange={(e) => set("warehousePhone", e.target.value)} />
        </FormField>
      </div>

      <h2>Announcement Banner</h2>
      <label className="toggle-row">
        <input type="checkbox" checked={form.announcementEnabled} onChange={(e) => set("announcementEnabled", e.target.checked)} />
        Show an announcement banner to customers
      </label>
      <FormField label="Announcement message" htmlFor="announcementMessage" error={errors.announcementMessage}>
        <textarea id="announcementMessage" className="field" rows={2} value={form.announcementMessage} onChange={(e) => set("announcementMessage", e.target.value)} placeholder="e.g. Holiday hours: closed July 4th." />
      </FormField>

      <h2>Maintenance</h2>
      <label className="toggle-row">
        <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => set("maintenanceMode", e.target.checked)} />
        Maintenance mode (future: shows a maintenance notice to customers)
      </label>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
