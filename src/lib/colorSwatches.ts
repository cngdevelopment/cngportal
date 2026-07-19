/**
 * Swatch hex helpers. Color definitions are owned by src/config/colors.ts;
 * this module only adds the `colorHex()` resolution helper and re-exports
 * the shared constants so existing importers keep working.
 */
import { COLOR_HEX, FLOOR_TONES, DEFAULT_SWATCH_HEX } from "@/config/colors";

export { COLOR_HEX, FLOOR_TONES };

export function colorHex(code: string, fallback?: string): string {
  return fallback ?? COLOR_HEX[code] ?? DEFAULT_SWATCH_HEX;
}
