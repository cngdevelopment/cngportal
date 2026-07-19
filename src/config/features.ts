/**
 * Feature flags. Everything here is off until the corresponding backend
 * lands (Phase 3+). Guarding new capability behind a flag keeps
 * half-built features out of the running product.
 *
 * Pure constants — safe to import anywhere.
 */
export const FEATURES = {
  emailNotifications: false,
  attachments: false,
  analytics: false,
  accountAdmin: false,
  catalogAdmin: false,
  userInvites: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
