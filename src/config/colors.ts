/**
 * Canonical cabinet finish definitions. The demo catalog seed
 * (src/data/mock/catalog-data.ts) and the swatch-hex fallback
 * (src/lib/colorSwatches.ts) both derive from this list, so a color is
 * defined in exactly one place.
 *
 * Pure constants only (no env, no server imports) - safe to import from
 * Client Components.
 */

export interface ColorDef {
  code: string;
  name: string;
  hex: string;
  sortOrder: number;
}

export const CABINET_COLORS: readonly ColorDef[] = [
  { code: "GS", name: "Grey Shaker", hex: "#a9adaf", sortOrder: 0 },
  { code: "NW", name: "Natural Wood", hex: "#c49a62", sortOrder: 1 },
  { code: "NB", name: "Navy Blue", hex: "#25395c", sortOrder: 2 },
  { code: "PG", name: "Pearl Glazed", hex: "#ebe3d1", sortOrder: 3 },
  { code: "SB", name: "Smokey Black", hex: "#2e2c2a", sortOrder: 4 },
  { code: "SW", name: "Super White", hex: "#fdfdfb", sortOrder: 5 },
  { code: "WS", name: "White Shaker", hex: "#f3f0e8", sortOrder: 6 },
] as const;

/** Fallback hex per color code, until real swatch images exist on Color.swatchUrl. */
export const COLOR_HEX: Record<string, string> = Object.fromEntries(
  CABINET_COLORS.map((c) => [c.code, c.hex])
);

export const DEFAULT_SWATCH_HEX = "#cccccc";

/** Flooring plank swatch tones (no named colors - visual only). */
export const FLOOR_TONES = [
  "#b3906a", "#9c7a55", "#c4a179", "#8a6f52", "#ab8a62",
  "#77604a", "#bfa07d", "#93765a", "#a5876b", "#87684d",
] as const;
