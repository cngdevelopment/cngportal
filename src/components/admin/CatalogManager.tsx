"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { ColorFormModal } from "@/components/admin/ColorFormModal";
import { removeProductAction, removeColorAction } from "@/app/actions/catalog";
import { formatPrice } from "@/lib/price";
import type { AdminProductRow, AdminColorRow } from "@/data/catalog-admin";

type Tab = "products" | "colors";

export function CatalogManager({
  products,
  colors,
}: {
  products: AdminProductRow[];
  colors: AdminColorRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"ALL" | "CABINETS" | "FLOORING">("ALL");

  const [productModal, setProductModal] = useState<{ open: boolean; product?: AdminProductRow }>({ open: false });
  const [colorModal, setColorModal] = useState<{ open: boolean; color?: AdminColorRow }>({ open: false });
  const [removingProduct, setRemovingProduct] = useState<AdminProductRow | null>(null);
  const [removingColor, setRemovingColor] = useState<AdminColorRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "ALL" && p.category !== category) return false;
      if (!q) return true;
      return [p.sku, p.name, p.subcategory, p.category, p.isActive ? "active" : "hidden"]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, category]);

  const filteredColors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter((c) =>
      [c.name, c.code, c.isActive ? "active" : "hidden"].join(" ").toLowerCase().includes(q)
    );
  }, [colors, query]);

  function confirmRemoveProduct() {
    if (!removingProduct) return;
    const target = removingProduct;
    startTransition(async () => {
      const result = await removeProductAction(target.id);
      setRemovingProduct(null);
      if (result.ok) {
        toast(
          result.data.deleted
            ? `Deleted ${result.data.name}.`
            : `${result.data.name} is on past orders, so it was hidden instead.`
        );
        router.refresh();
      } else toast(result.error.message, "error");
    });
  }

  function confirmRemoveColor() {
    if (!removingColor) return;
    const target = removingColor;
    startTransition(async () => {
      const result = await removeColorAction(target.id);
      setRemovingColor(null);
      if (result.ok) {
        toast(
          result.data.deleted
            ? `Deleted ${result.data.name}.`
            : `${result.data.name} is on past orders, so it was hidden instead.`
        );
        router.refresh();
      } else toast(result.error.message, "error");
    });
  }

  return (
    <>
      <div className="cat-tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={tab === "products" ? "on" : ""} onClick={() => { setTab("products"); setQuery(""); }}>
          Products ({products.length})
        </button>
        <button type="button" className={tab === "colors" ? "on" : ""} onClick={() => { setTab("colors"); setQuery(""); }}>
          Finishes ({colors.length})
        </button>
      </div>

      <div className="table-toolbar">
        <input
          className="field search"
          type="search"
          placeholder={tab === "products" ? "Search SKU, name, subcategory…" : "Search finishes…"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search catalog"
        />
        {tab === "products" && (
          <select
            className="field"
            style={{ width: "auto" }}
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            aria-label="Filter by category"
          >
            <option value="ALL">All categories</option>
            <option value="CABINETS">Cabinets</option>
            <option value="FLOORING">Flooring</option>
          </select>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => (tab === "products" ? setProductModal({ open: true }) : setColorModal({ open: true }))}
        >
          {tab === "products" ? "New product" : "New finish"}
        </button>
      </div>

      {tab === "products" ? (
        filteredProducts.length === 0 ? (
          <EmptyState title="No products" description="Nothing matches those filters." />
        ) : (
          <div className="table-scroll">
            <table className="list">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Finishes</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td><b>{p.sku}</b></td>
                    <td>
                      {p.name}
                      {p.optionName && p.optionValues.length > 0 ? (
                        <div className="meta">{p.optionName}: {p.optionValues.join(", ")}</div>
                      ) : null}
                    </td>
                    <td>
                      {p.category === "CABINETS" ? "Cabinets" : "Flooring"}
                      {p.subcategory ? <div className="meta">{p.subcategory}</div> : null}
                    </td>
                    <td>{p.price == null ? "—" : formatPrice(p.price)}</td>
                    <td>{p.colorIds.length || "—"}</td>
                    <td>
                      <span className={`chip ${p.isActive ? "green" : "neutral"}`}>
                        {p.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn ghost sm" onClick={() => setProductModal({ open: true, product: p })}>
                        Edit
                      </button>
                      <button type="button" className="rm" onClick={() => setRemovingProduct(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : filteredColors.length === 0 ? (
        <EmptyState title="No finishes" description="Create your first finish to offer color choices." />
      ) : (
        <div className="table-scroll">
          <table className="list">
            <thead>
              <tr>
                <th>Finish</th>
                <th>Code</th>
                <th>Products</th>
                <th>Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredColors.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.code}</td>
                  <td>{c.productCount}</td>
                  <td>{c.sortOrder}</td>
                  <td>
                    <span className={`chip ${c.isActive ? "green" : "neutral"}`}>
                      {c.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" className="btn ghost sm" onClick={() => setColorModal({ open: true, color: c })}>
                      Edit
                    </button>
                    <button type="button" className="rm" onClick={() => setRemovingColor(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productModal.open && (
        <ProductFormModal product={productModal.product} colors={colors} onClose={() => setProductModal({ open: false })} />
      )}
      {colorModal.open && (
        <ColorFormModal color={colorModal.color} onClose={() => setColorModal({ open: false })} />
      )}

      {removingProduct && (
        <ConfirmDialog
          title="Delete this product?"
          message={
            <>
              <b>{removingProduct.name}</b> ({removingProduct.sku}) will be removed. If it appears on
              past orders it&rsquo;s hidden from the catalog instead, so order history stays intact.
            </>
          }
          confirmLabel="Delete product"
          danger
          pending={pending}
          onConfirm={confirmRemoveProduct}
          onCancel={() => !pending && setRemovingProduct(null)}
        />
      )}
      {removingColor && (
        <ConfirmDialog
          title="Delete this finish?"
          message={
            <>
              <b>{removingColor.name}</b> will be removed from {removingColor.productCount} product
              {removingColor.productCount === 1 ? "" : "s"}. If it appears on past orders it&rsquo;s
              hidden instead.
            </>
          }
          confirmLabel="Delete finish"
          danger
          pending={pending}
          onConfirm={confirmRemoveColor}
          onCancel={() => !pending && setRemovingColor(null)}
        />
      )}
    </>
  );
}
