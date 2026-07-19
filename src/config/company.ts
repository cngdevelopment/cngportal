/**
 * Company identity + contact info. Server-side config (reads env with
 * safe fallbacks); import from Server Components/Actions.
 */
export const COMPANY = {
  name: "C&G Wholesale",
  legalName: "C&G Wholesale LLC",
  portalName: "Ordering Portal",
  staffConsoleName: "Staff Console",
  phone: "314-838-8588",
  supportEmail: process.env.EMAIL_FROM ?? "orders@example.com",
} as const;
