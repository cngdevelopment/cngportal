import "server-only";
import { COMPANY } from "@/config/company";
import { WAREHOUSE } from "@/config/warehouse";
import { FEATURES } from "@/config/features";
import { readOverrides, writeOverrides, type SettingsOverrides } from "./settings-store";
import type { UpdateSettingsInput } from "@/schemas/settings";

/**
 * Application settings — the values a business owner should be able to edit
 * without touching code. Today `getSettings()` returns defaults sourced
 * from src/config/*; when the Admin Portal + database land, this becomes
 * the single place that merges persisted overrides on top of the defaults.
 *
 * Read everywhere via `getSettings()` instead of importing raw config, so
 * that migration is transparent to callers.
 */

export interface AnnouncementSettings {
  enabled: boolean;
  message: string;
}

export interface AppSettings {
  companyName: string;
  portalName: string;
  supportEmail: string;
  supportPhone: string;
  warehouse: {
    address: string;
    hours: string;
    phone: string;
  };
  announcement: AnnouncementSettings;
  maintenanceMode: boolean;
  features: typeof FEATURES;
}

/** Baseline settings, derived from config. The DB layer overrides these. */
export const DEFAULT_SETTINGS: AppSettings = {
  companyName: COMPANY.name,
  portalName: COMPANY.portalName,
  supportEmail: COMPANY.supportEmail,
  supportPhone: COMPANY.phone,
  warehouse: {
    address: WAREHOUSE.address,
    hours: WAREHOUSE.hours,
    phone: WAREHOUSE.phone,
  },
  announcement: { enabled: false, message: "" },
  maintenanceMode: false,
  features: FEATURES,
};

/**
 * Resolve the effective settings: persisted overrides merged onto the
 * config-derived defaults. `features` is always taken from code (not
 * user-editable). Callers read settings only through this function.
 */
export async function getSettings(): Promise<AppSettings> {
  const overrides = readOverrides();
  return {
    ...DEFAULT_SETTINGS,
    ...overrides,
    warehouse: { ...DEFAULT_SETTINGS.warehouse, ...overrides.warehouse },
    announcement: { ...DEFAULT_SETTINGS.announcement, ...overrides.announcement },
    features: FEATURES,
  };
}

/**
 * Persist a settings change from the Admin Portal. Input is already
 * validated (schemas/settings.ts) at the action boundary; here we map the
 * flat form shape onto the structured overrides and store them.
 */
export async function updateSettings(input: UpdateSettingsInput): Promise<AppSettings> {
  const overrides: SettingsOverrides = {
    companyName: input.companyName,
    portalName: input.portalName,
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    warehouse: {
      address: input.warehouseAddress,
      hours: input.warehouseHours,
      phone: input.warehousePhone,
    },
    announcement: {
      enabled: input.announcementEnabled,
      message: input.announcementMessage,
    },
    maintenanceMode: input.maintenanceMode,
  };
  writeOverrides(overrides);
  return getSettings();
}
