import "server-only";
import { isDemoMode } from "@/lib/mode";

/**
 * Persistence for admin-editable settings.
 *
 * Stored as a single JSON row in the `settings` table (key = "app"). This has
 * to be durable: an in-memory store silently loses every change on serverless
 * cold starts, which is why announcements and maintenance mode appeared to
 * "not save". Demo mode (no database) still falls back to memory.
 */

/** Shape is owned by src/server/settings — kept structural to avoid a cycle. */
export type SettingsOverridesRecord = Record<string, unknown>;

const SETTINGS_KEY = "app";

const globalForSettings = globalThis as unknown as {
  __cgSettingsOverrides?: SettingsOverridesRecord;
};

export async function readSettingsOverrides(): Promise<SettingsOverridesRecord> {
  if (isDemoMode()) return globalForSettings.__cgSettingsOverrides ?? {};
  const { prisma } = await import("./db");
  const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
  return (row?.value as SettingsOverridesRecord | undefined) ?? {};
}

export async function writeSettingsOverrides(
  next: SettingsOverridesRecord
): Promise<void> {
  if (isDemoMode()) {
    globalForSettings.__cgSettingsOverrides = {
      ...(globalForSettings.__cgSettingsOverrides ?? {}),
      ...next,
    };
    return;
  }
  const { prisma } = await import("./db");
  const current = await readSettingsOverrides();
  const merged = { ...current, ...next };
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: merged as object },
    update: { value: merged as object },
  });
}
