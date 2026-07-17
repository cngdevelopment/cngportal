/**
 * Swatch hex fallback, keyed by color code — used until real swatch
 * images are on `Color.swatchUrl`. Demo-mode colors already carry a hex
 * value; this covers the real-database path too.
 */
export const COLOR_HEX: Record<string, string> = {
  GS: "#a9adaf",
  NW: "#c49a62",
  NB: "#25395c",
  PG: "#ebe3d1",
  SB: "#2e2c2a",
  SW: "#fdfdfb",
  WS: "#f3f0e8",
};

export function colorHex(code: string, fallback?: string): string {
  return fallback ?? COLOR_HEX[code] ?? "#cccccc";
}

export const FLOOR_TONES = [
  "#b3906a", "#9c7a55", "#c4a179", "#8a6f52", "#ab8a62",
  "#77604a", "#bfa07d", "#93765a", "#a5876b", "#87684d",
];
