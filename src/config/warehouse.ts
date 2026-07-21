import { COMPANY } from "./company";

/**
 * Pickup warehouse details, shown on the cart and order-detail pickup
 * panels. Reads env with fallbacks in ONE place (previously duplicated
 * across cart/page.tsx and orders/[id]/page.tsx, where the latter had no
 * fallback and rendered "undefined" in demo mode).
 *
 * Server-side config - import from Server Components only.
 */
export const WAREHOUSE = {
  address: process.env.WAREHOUSE_ADDRESS ?? "9150 Latty Ave, Berkeley, MO 63134",
  hours: process.env.WAREHOUSE_HOURS ?? "Mon-Fri 7:00 AM to 4:00 PM",
  phone: process.env.WAREHOUSE_PHONE ?? COMPANY.phone,
} as const;
