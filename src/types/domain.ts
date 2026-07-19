/**
 * Canonical domain types — the single source of truth for the enums that
 * describe the business. Mirrors the Prisma enums (prisma/schema.prisma)
 * so the in-memory and database backends speak the same language.
 *
 * Previously these unions were redeclared in buildPipeline.ts, store.ts,
 * CartProvider.tsx, and context.ts; those now import from here.
 */

export type Role = "CUSTOMER_USER" | "CUSTOMER_ADMIN" | "STAFF" | "STAFF_ADMIN";

export type Category = "CABINETS" | "FLOORING";

export type Unit = "EACH" | "BOX";

export type DeliveryMethod = "SHIP" | "PICKUP";

export type Assembly = "ASSEMBLED" | "UNASSEMBLED";

/** Statuses that appear on the customer-facing progress pipeline. */
export type PipelineStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "ASSEMBLING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED";

/** Every status an order can hold, including off-pipeline states. */
export type OrderStatus = "DRAFT" | PipelineStatus | "ON_HOLD" | "CANCELLED";

export const STAFF_ROLES = ["STAFF", "STAFF_ADMIN"] as const;
export const CUSTOMER_ROLES = ["CUSTOMER_USER", "CUSTOMER_ADMIN"] as const;

export function isStaffRole(role: Role): boolean {
  return role === "STAFF" || role === "STAFF_ADMIN";
}

export function isCustomerRole(role: Role): boolean {
  return role === "CUSTOMER_USER" || role === "CUSTOMER_ADMIN";
}
