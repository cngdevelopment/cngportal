"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  key: string;
  sku: string;
  name: string;
  category: "CABINETS" | "FLOORING";
  unit: "EACH" | "BOX";
  quantity: number;
  colorCode: string | null;
  colorName: string | null;
  colorHex: string | null;
  assembly: "ASSEMBLED" | "UNASSEMBLED" | null;
  thickness: string | null;
  unitsPerBox: number | null;
  notes: string;
}

function lineKey(l: Pick<CartLine, "sku" | "colorCode" | "thickness" | "assembly">) {
  return [l.sku, l.colorCode ?? "", l.thickness ?? "", l.assembly ?? ""].join("|");
}

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "key">) => void;
  updateQuantity: (key: string, quantity: number) => void;
  setLineAssembly: (key: string, assembly: "ASSEMBLED" | "UNASSEMBLED") => void;
  bulkSetAssembly: (assembly: "ASSEMBLED" | "UNASSEMBLED") => void;
  removeLine: (key: string) => void;
  clear: () => void;
  replaceAll: (lines: CartLine[]) => void;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "cg-cart-v1";

function merge(lines: CartLine[]): CartLine[] {
  const out: CartLine[] = [];
  for (const l of lines) {
    const key = lineKey(l);
    const existing = out.find((x) => x.key === key);
    if (existing) existing.quantity += l.quantity;
    else out.push({ ...l, key });
  }
  return out;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt local storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      addLine: (line) => setLines((prev) => merge([...prev, { ...line, key: lineKey(line) }])),
      updateQuantity: (key, quantity) =>
        setLines((prev) =>
          quantity < 1
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(999, quantity) } : l))
        ),
      setLineAssembly: (key, assembly) =>
        setLines((prev) => merge(prev.map((l) => (l.key === key ? { ...l, assembly } : l)))),
      bulkSetAssembly: (assembly) =>
        setLines((prev) =>
          merge(prev.map((l) => (l.category === "CABINETS" ? { ...l, assembly } : l)))
        ),
      removeLine: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
      replaceAll: (next) => setLines(merge(next)),
      count: lines.reduce((a, l) => a + l.quantity, 0),
    }),
    [lines]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
