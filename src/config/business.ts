/**
 * Business rules and numeric constants. One home for the values that
 * define how the business operates, so tuning them never means hunting
 * through components or the data layer.
 */
export const BUSINESS = {
  /** Order number format: `${prefix}-${year}-${paddedSeq}` e.g. CG-2026-0142. */
  orderNumberPrefix: "CG",
  orderNumberYear: 2026,
  orderNumberPad: 4,

  /** Flooring fallback when a product has no explicit units_per_box (sq ft/carton). */
  defaultUnitsPerBox: 23.4,

  /** Per-line quantity ceiling in the stepper (spec §9). */
  maxLineQuantity: 999,
  minLineQuantity: 1,

  /** Default payment terms for new accounts. */
  defaultAccountTerms: "NET30",
} as const;

/** Format a sequential counter into a display order number (CG-2026-0142). */
export function formatOrderNumber(seq: number): string {
  const padded = String(seq).padStart(BUSINESS.orderNumberPad, "0");
  return `${BUSINESS.orderNumberPrefix}-${BUSINESS.orderNumberYear}-${padded}`;
}
