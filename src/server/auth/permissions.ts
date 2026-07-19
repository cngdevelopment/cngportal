import type { Role } from "@/types/domain";

/**
 * Role-based access control. Permissions are the unit protected features
 * check against (not raw roles), so adding a role or re-scoping a
 * capability is a one-line change here rather than a hunt across the app.
 *
 * Pure module (no server imports) — safe to use in Server Components for
 * conditional nav and in server guards alike.
 */

export type Permission =
  | "admin.access"
  | "settings.manage"
  | "catalog.manage"
  | "discounts.manage"
  | "cms.manage"
  | "orders.manage"
  | "accounts.manage"
  | "users.invite";

const ALL_PERMISSIONS: readonly Permission[] = [
  "admin.access",
  "settings.manage",
  "catalog.manage",
  "discounts.manage",
  "cms.manage",
  "orders.manage",
  "accounts.manage",
  "users.invite",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  STAFF_ADMIN: ALL_PERMISSIONS,
  STAFF: ["orders.manage"],
  CUSTOMER_ADMIN: [],
  CUSTOMER_USER: [],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
