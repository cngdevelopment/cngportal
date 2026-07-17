"use client";

import { useMemo, useState } from "react";
import { ProductPanel } from "./ProductPanel";
import { FLOOR_TONES, colorHex } from "@/lib/colorSwatches";
import type { CatalogProduct, CatalogColor } from "./types";

const CABINET_TYPES = ["Base", "Wall", "Tall", "Vanity"];

export function CatalogBrowser({
  cabinets,
  flooring,
  colors,
}: {
  cabinets: CatalogProduct[];
  flooring: CatalogProduct[];
  colors: CatalogColor[];
}) {
  const [tab, setTab] = useState<"CABINETS" | "FLOORING">("CABINETS");
  const [query, setQuery] = useState("");
  const [subFilter, setSubFilter] = useState<Record<string, boolean>>({});
  const [thickFilter, setThickFilter] = useState<Record<string, boolean>>({});
  const [openSku, setOpenSku] = useState<string | null>(null);

  const products = tab === "CABINETS" ? cabinets : flooring;

  const allThicknesses = useMemo(() => {
    const seen = new Set<string>();
    flooring.forEach((p) =>
      (p.options.find((o) => o.name === "Thickness")?.values as string[] | undefined)?.forEach((t) =>
        seen.add(t)
      )
    );
    return Array.from(seen).sort();
  }, [flooring]);

  const items = useMemo(() => {
    let list = products;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    const subs = Object.keys(subFilter).filter((k) => subFilter[k]);
    const thicks = Object.keys(thickFilter).filter((k) => thickFilter[k]);
    if (tab === "CABINETS" && subs.length) {
      list = list.filter((p) => p.subcategory && subs.includes(p.subcategory));
    }
    if (tab === "FLOORING" && thicks.length) {
      list = list.filter((p) => {
        const values = (p.options.find((o) => o.name === "Thickness")?.values as string[] | undefined) ?? [];
        return values.some((t) => thicks.includes(t));
      });
    }
    return list;
  }, [products, query, subFilter, thickFilter, tab]);

  const openProduct = openSku ? products.find((p) => p.sku === openSku) ?? null : null;

  return (
    <>
      <div className="cat-tabs">
        <button className={tab === "CABINETS" ? "on" : ""} onClick={() => { setTab("CABINETS"); setQuery(""); }}>
          Cabinets
        </button>
        <button className={tab === "FLOORING" ? "on" : ""} onClick={() => { setTab("FLOORING"); setQuery(""); }}>
          Flooring
        </button>
      </div>

      <div className="browse">
        <aside className="rail">
          <div className="box">
            <input
              type="search"
              placeholder="Search name or SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {tab === "CABINETS" ? (
            <div className="box">
              <h3>Type</h3>
              {CABINET_TYPES.map((s) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={!!subFilter[s]}
                    onChange={() => setSubFilter((prev) => ({ ...prev, [s]: !prev[s] }))}
                  />
                  {s}
                </label>
              ))}
            </div>
          ) : (
            <div className="box">
              <h3>Thickness</h3>
              {allThicknesses.map((t) => (
                <label key={t}>
                  <input
                    type="checkbox"
                    checked={!!thickFilter[t]}
                    onChange={() => setThickFilter((prev) => ({ ...prev, [t]: !prev[t] }))}
                  />
                  {t}
                </label>
              ))}
            </div>
          )}
          {tab === "CABINETS" && (
            <div className="box">
              <h3>Finishes</h3>
              {colors.map((c) => (
                <label key={c.id} style={{ cursor: "default" }}>
                  <span className="mini-sw" style={{ background: colorHex(c.code, c.hex) }} />
                  {c.name}
                </label>
              ))}
              <div style={{ fontSize: ".72rem", color: "var(--ink-3)", marginTop: 6 }}>
                Every cabinet comes in all seven finishes.
              </div>
            </div>
          )}
        </aside>

        <div className="grid">
          {items.length === 0 ? (
            <div className="empty" style={{ gridColumn: "1/-1" }}>
              Nothing matches those filters.
            </div>
          ) : (
            items.map((p, i) => {
              const thicknessOpt = p.options.find((o) => o.name === "Thickness");
              const thicknessValues = (thicknessOpt?.values as string[] | undefined) ?? [];
              return (
                <button type="button" key={p.id} className="pcard" onClick={() => setOpenSku(p.sku)}>
                  <div className="thumb">
                    {p.category === "CABINETS" ? (
                      <div className={`door ${p.subcategory === "Tall" ? "tall" : ""}`} />
                    ) : (
                      <div className="planks">
                        <i style={{ background: FLOOR_TONES[i % FLOOR_TONES.length] }} />
                        <i style={{ background: FLOOR_TONES[i % FLOOR_TONES.length] + "d9" }} />
                        <i style={{ background: FLOOR_TONES[i % FLOOR_TONES.length] + "ef" }} />
                      </div>
                    )}
                  </div>
                  <div className="nm">{p.name}</div>
                  <div className="sk">
                    {p.sku} · {p.unit === "EACH" ? "each" : "per box"}
                    {thicknessValues.length > 0 ? <> · {thicknessValues.join(" / ")}</> : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {openProduct && <ProductPanel product={openProduct} onClose={() => setOpenSku(null)} />}
    </>
  );
}
