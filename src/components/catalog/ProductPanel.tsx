"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { colorHex } from "@/lib/colorSwatches";
import type { CatalogProduct } from "./types";

export function ProductPanel({
  product,
  onClose,
}: {
  product: CatalogProduct;
  onClose: () => void;
}) {
  const { addLine } = useCart();
  const thicknessOpt = product.options.find((o) => o.name === "Thickness");
  const thicknesses = (thicknessOpt?.values as string[] | undefined) ?? [];
  const isCabinet = product.category === "CABINETS";

  const [colorCode, setColorCode] = useState<string | null>(null);
  const [assembly, setAssembly] = useState<"ASSEMBLED" | "UNASSEMBLED" | null>(null);
  const [thickness, setThickness] = useState<string | null>(thicknesses.length === 1 ? thicknesses[0] : null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [triedAdd, setTriedAdd] = useState(false);

  const valid = isCabinet ? !!(colorCode && assembly) : !!thickness;

  function commitQty(n: number) {
    setQty(Math.min(999, Math.max(1, n)));
  }

  function handleAdd() {
    setTriedAdd(true);
    if (!valid) return;
    const color = product.colors.find((c) => c.color.code === colorCode)?.color ?? null;
    addLine({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: qty,
      colorCode: color?.code ?? null,
      colorName: color?.name ?? null,
      colorHex: color ? colorHex(color.code, color.hex) : null,
      assembly,
      thickness,
      unitsPerBox: product.unitsPerBox,
      notes,
    });
    onClose();
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="panel">
        <button className="close" aria-label="Close" onClick={onClose}>
          &times;
        </button>
        <h2>{product.name}</h2>
        <div className="sk">
          {product.sku} · {product.unit === "EACH" ? "sold each" : "sold by the box"}
        </div>

        {isCabinet ? (
          <>
            <div className="fgroup">
              <label>
                Finish <span className="req">*</span>
              </label>
              <div className="swatches">
                {product.colors.map(({ color: c }) => (
                  <button
                    type="button"
                    key={c.id}
                    className={`sw ${colorCode === c.code ? "on" : ""}`}
                    onClick={() => setColorCode(c.code)}
                  >
                    <div className="c" style={{ background: colorHex(c.code, c.hex) }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="fgroup">
              <label>
                Assembly <span className="req">*</span>
              </label>
              <div className="seg">
                <button
                  type="button"
                  className={assembly === "ASSEMBLED" ? "on" : ""}
                  onClick={() => setAssembly("ASSEMBLED")}
                >
                  Assembled
                </button>
                <button
                  type="button"
                  className={assembly === "UNASSEMBLED" ? "on" : ""}
                  onClick={() => setAssembly("UNASSEMBLED")}
                >
                  Unassembled (RTA)
                </button>
              </div>
              <div className="seg-help">
                <span>We build it before it leaves</span>
                <span>Ships flat, you assemble</span>
              </div>
            </div>
          </>
        ) : thicknesses.length > 1 ? (
          <div className="fgroup">
            <label>
              Thickness <span className="req">*</span>
            </label>
            <div className="seg">
              {thicknesses.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={thickness === t ? "on" : ""}
                  onClick={() => setThickness(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="fgroup">
            <label>Thickness</label>
            <div style={{ fontSize: ".9rem" }}>{thicknesses[0]}</div>
          </div>
        )}

        <div className="fgroup">
          <label>Quantity</label>
          <div className="stepper">
            <button type="button" onClick={() => commitQty(qty - 1)} disabled={qty <= 1}>
              &minus;
            </button>
            <input
              value={qty}
              inputMode="numeric"
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) setQty(n);
              }}
              onBlur={() => commitQty(qty)}
            />
            <button type="button" onClick={() => commitQty(qty + 1)}>
              +
            </button>
          </div>
          {product.category === "FLOORING" && product.unitsPerBox && (
            <div className="boxmath">
              1 box = {product.unitsPerBox} sq ft &nbsp;·&nbsp; {qty} box{qty === 1 ? "" : "es"} ={" "}
              {(qty * product.unitsPerBox).toFixed(1)} sq ft
            </div>
          )}
        </div>

        <div className="fgroup">
          <label>Line notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. second-floor unit (optional)"
          />
        </div>

        <div style={{ marginTop: 22 }}>
          <button className="btn wide" disabled={!valid} onClick={handleAdd}>
            Add to Order
          </button>
          {triedAdd && !valid && (
            <div className="err">
              {isCabinet ? "Choose a finish and assembly first." : "Choose a thickness first."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
