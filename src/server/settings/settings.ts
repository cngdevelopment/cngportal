import "server-only";
import { COMPANY } from "@/config/company";
import { WAREHOUSE } from "@/config/warehouse";
import { FEATURES } from "@/config/features";

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
 * Resolve the effective settings. Insertion point for Supabase: fetch the
 * persisted overrides and deep-merge them onto DEFAULT_SETTINGS here.
 */
export async function getSettings(): Promise<AppSettings> {
  return DEFAULT_SETTINGS;
}
