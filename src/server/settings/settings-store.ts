import "server-only";
import type { AppSettings } from "./settings";

/**
 * Persistence for settings overrides.
 *
 * Demo backend: an in-memory store on globalThis (survives dev hot-reloads,
 * resets when the server process restarts) — same pattern as the demo order
 * store. This makes the Admin → Settings form genuinely functional now.
 *
 * SUPABASE INSERTION POINT: replace the two functions below with reads/writes
 * against a `settings` table (see prisma `Setting` model). The rest of the
 * app calls getSettings()/updateSettings() and never needs to change.
 */

/** Only the editable fields — never the derived `features` map. */
export type SettingsOverrides = Partial<Omit<AppSettings, "features">>;

const globalForSettings = globalThis as unknown as {
  __cgSettingsOverrides?: SettingsOverrides;
};

export function readOverrides(): SettingsOverrides {
  return globalForSettings.__cgSettingsOverrides ?? {};
}

export function writeOverrides(next: SettingsOverrides): void {
  globalForSettings.__cgSettingsOverrides = {
    ...readOverrides(),
    ...next,
  };
}
