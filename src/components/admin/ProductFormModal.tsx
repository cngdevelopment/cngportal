"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { FormField } from "@/components/admin/FormField";
import { createProductAction, updateProductAction } from "@/app/actions/catalog";
import type { AdminProductRow, AdminColorRow } from "@/data/catalog-admin";
import type { FieldErrors } from "@/lib/result";

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function ProductFormModal({
  product,
  colors,
  onClose,
}: {
  /** Present = edit mode. */
  product?: AdminProductRow;
  colors: AdminColorRow[];
  onClose: () => void;
}) {
  const isEdit = !!product;
  const router = useRouter();
  const { toast } = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: (product?.category ?? "CABINETS") as "CABINETS" | "FLOORING",
    subcategory: product?.subcategory ?? "",
    unit: (product?.unit ?? "EACH") as "EACH" | "BOX",
    unitsPerBox: product?.unitsPerBox != null ? String(product.unitsPerBox) : "",
    price: product?.price != null ? String(product.price) : "",
    supportsAssembly: product?.supportsAssembly ?? false,
    imageUrl: product?.imageUrl ?? "",
    isActive: product?.isActive ?? true,
    sortOrder: String(product?.sortOrder ?? 0),
    maxQuantity: String(product?.maxQuantity ?? 999),
    colorIds: product?.colorIds ?? ([] as string[]),
    optionName: product?.optionName ?? "",
    optionValues: (product?.optionValues ?? []).join("\n"),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleColor(id: string) {
    setForm((prev) => ({
      ...prev,
      colorIds: prev.colorIds.includes(id)
        ? prev.colorIds.filter((c) => c !== id)
        : [...prev.colorIds, id],
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const payload = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      unit: form.unit,
      unitsPerBox: numOrNull(form.unitsPerBox),
      price: numOrNull(form.price),
      supportsAssembly: form.supportsAssembly,
      imageUrl: form.imageUrl,
      isActive: form.isActive,
      sortOrder: form.sortOrder.trim() === "" ? 0 : Number(form.sortOrder),
      maxQuantity: form.maxQuantity.trim() === "" ? 999 : Number(form.maxQuantity),
      colorIds: form.colorIds,
      optionName: form.optionName,
      optionValues: form.optionValues
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateProductAction({ id: product!.id, ...payload })
        : await createProductAction(payload);
      if (result.ok) {
        toast(isEdit ? "Product updated." : `Created ${payload.sku.toUpperCase()}.`);
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
      <div className="modal modal-lg modal-tall" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{isEdit ? `Edit ${product!.sku}` : "New product"}</h2>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-2col">
            <FormField label="SKU" htmlFor="sku" error={errors.sku} required>
              <input id="sku" className="field" value={form.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="B24" />
            </FormField>
            <FormField label="Status" htmlFor="isActive" error={errors.isActive} required>
              <select id="isActive" className="field" value={form.isActive ? "active" : "inactive"} onChange={(e) => set("isActive", e.target.value === "active")}>
                <option value="active">Active (shown in catalog)</option>
                <option value="inactive">Hidden</option>
              </select>
            </FormField>
          </div>

          <FormField label="Name" htmlFor="name" error={errors.name} required>
            <input id="name" className="field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="24&quot; Base Cabinet" />
          </FormField>

          <FormField label="Description" htmlFor="description" error={errors.description}>
            <textarea id="description" className="field" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional" />
          </FormField>

          <div className="form-2col">
            <FormField label="Category" htmlFor="category" error={errors.category} required>
              <select id="category" className="field" value={form.category} onChange={(e) => set("category", e.target.value as "CABINETS" | "FLOORING")}>
                <option value="CABINETS">Cabinets</option>
                <option value="FLOORING">Flooring</option>
              </select>
            </FormField>
            <FormField label="Subcategory" htmlFor="subcategory" error={errors.subcategory} hint="Base, Wall, Tall, Vanity, Plank…">
              <input id="subcategory" className="field" value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} placeholder="Optional" />
            </FormField>
          </div>

          <div className="form-2col">
            <FormField label="Sold by" htmlFor="unit" error={errors.unit} required>
              <select id="unit" className="field" value={form.unit} onChange={(e) => set("unit", e.target.value as "EACH" | "BOX")}>
                <option value="EACH">Each</option>
                <option value="BOX">Box</option>
              </select>
            </FormField>
            <FormField label="Units per box" htmlFor="unitsPerBox" error={errors.unitsPerBox} hint="Flooring: sq ft per carton.">
              <input id="unitsPerBox" type="number" min="0" step="0.01" className="field" value={form.unitsPerBox} onChange={(e) => set("unitsPerBox", e.target.value)} placeholder="Optional" />
            </FormField>
          </div>

          <div className="form-2col">
            <FormField label="Price ($)" htmlFor="price" error={errors.price} hint="Blank = no price shown.">
              <input id="price" type="number" min="0" step="0.01" className="field" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Optional" />
            </FormField>
            <FormField label="Max order quantity" htmlFor="maxQuantity" error={errors.maxQuantity} required>
              <input id="maxQuantity" type="number" min="1" step="1" className="field" value={form.maxQuantity} onChange={(e) => set("maxQuantity", e.target.value)} />
            </FormField>
          </div>

          <div className="form-2col">
            <FormField label="Sort order" htmlFor="sortOrder" error={errors.sortOrder} hint="Lower shows first.">
              <input id="sortOrder" type="number" min="0" step="1" className="field" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </FormField>
            <FormField label="Assembly" htmlFor="supportsAssembly" error={errors.supportsAssembly}>
              <select id="supportsAssembly" className="field" value={form.supportsAssembly ? "yes" : "no"} onChange={(e) => set("supportsAssembly", e.target.value === "yes")}>
                <option value="no">Not offered</option>
                <option value="yes">Can be assembled</option>
              </select>
            </FormField>
          </div>

          <FormField label="Image URL" htmlFor="imageUrl" error={errors.imageUrl} hint="Optional. Leave blank to use the default drawing.">
            <input id="imageUrl" className="field" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="/products/b24.png" />
          </FormField>

          <div className="form-section-label">Finishes offered</div>
          <div className="field-hint" style={{ marginBottom: 8 }}>
            {form.colorIds.length === 0
              ? "No finishes selected. Customers won't pick a color."
              : `${form.colorIds.length} finish${form.colorIds.length === 1 ? "" : "es"} selected.`}
          </div>
          {colors.length > 0 && (
            <div className="account-picker">
              {colors.map((c) => (
                <label key={c.id} className="account-pick">
                  <input type="checkbox" checked={form.colorIds.includes(c.id)} onChange={() => toggleColor(c.id)} />
                  <span>
                    {c.name} <span className="meta">{c.code}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="form-section-label">Options (e.g. Thickness)</div>
          <div className="form-2col">
            <FormField label="Option name" htmlFor="optionName" error={errors.optionName}>
              <input id="optionName" className="field" value={form.optionName} onChange={(e) => set("optionName", e.target.value)} placeholder="Thickness" />
            </FormField>
            <FormField label="Choices (one per line)" htmlFor="optionValues" error={errors.optionValues}>
              <textarea id="optionValues" className="field" rows={3} value={form.optionValues} onChange={(e) => set("optionValues", e.target.value)} placeholder={"4.5mm\n6.5mm"} />
            </FormField>
          </div>

          <div className="actions">
            <button type="button" className="btn ghost" disabled={pending} onClick={onClose}>
              Cancel
            </button>
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
