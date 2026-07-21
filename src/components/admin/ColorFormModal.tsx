"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { createColorAction, updateColorAction } from "@/app/actions/catalog";
import type { AdminColorRow } from "@/data/catalog-admin";
import type { FieldErrors } from "@/lib/result";

export function ColorFormModal({
  color,
  onClose,
}: {
  /** Present = edit mode. */
  color?: AdminColorRow;
  onClose: () => void;
}) {
  const isEdit = !!color;
  const router = useRouter();
  const { toast } = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: color?.name ?? "",
    code: color?.code ?? "",
    swatchUrl: color?.swatchUrl ?? "",
    isActive: color?.isActive ?? true,
    sortOrder: String(color?.sortOrder ?? 0),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const payload = {
      name: form.name,
      code: form.code,
      swatchUrl: form.swatchUrl,
      isActive: form.isActive,
      sortOrder: form.sortOrder.trim() === "" ? 0 : Number(form.sortOrder),
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateColorAction({ id: color!.id, ...payload })
        : await createColorAction(payload);
      if (result.ok) {
        toast(isEdit ? "Finish updated." : `Created ${payload.code.toUpperCase()}.`);
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
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{isEdit ? "Edit finish" : "New finish"}</h2>
        <form onSubmit={onSubmit} noValidate>
          <FormField label="Name" htmlFor="colorName" error={errors.name} required>
            <input id="colorName" className="field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Shaker White" />
          </FormField>
          <FormField label="Code" htmlFor="colorCode" error={errors.code} hint="Short identifier used on orders." required>
            <input id="colorCode" className="field" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SW" />
          </FormField>
          <FormField label="Swatch image URL" htmlFor="swatchUrl" error={errors.swatchUrl} hint="Optional — falls back to a built-in swatch color.">
            <input id="swatchUrl" className="field" value={form.swatchUrl} onChange={(e) => set("swatchUrl", e.target.value)} placeholder="Optional" />
          </FormField>
          <div className="form-2col">
            <FormField label="Status" htmlFor="colorActive" error={errors.isActive} required>
              <select id="colorActive" className="field" value={form.isActive ? "active" : "inactive"} onChange={(e) => set("isActive", e.target.value === "active")}>
                <option value="active">Active</option>
                <option value="inactive">Hidden</option>
              </select>
            </FormField>
            <FormField label="Sort order" htmlFor="colorSort" error={errors.sortOrder} hint="Lower shows first.">
              <input id="colorSort" type="number" min="0" step="1" className="field" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </FormField>
          </div>

          <div className="actions">
            <button type="button" className="btn ghost" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create finish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
