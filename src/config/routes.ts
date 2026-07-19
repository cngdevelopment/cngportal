/**
 * Application route constants. Replaces scattered string literals so a
 * path is defined once and refactors are type-safe. Pure constants —
 * safe to import from Client Components.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  noAccess: "/no-access",
  authConfirm: "/auth/confirm",

  // Customer portal
  dashboard: "/dashboard",
  newOrder: "/new-order",
  cart: "/cart",
  history: "/history",
  order: (id: string) => `/orders/${id}`,

  // Staff console
  staff: {
    queue: "/staff/queue",
    order: (id: string) => `/staff/orders/${id}`,
  },
} as const;
