/**
 * Application route constants. Replaces scattered string literals so a
 * path is defined once and refactors are type-safe. Pure constants -
 * safe to import from Client Components.
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  noAccess: "/no-access",
  authConfirm: "/auth/confirm",
  resetPassword: "/reset-password",

  // Customer portal
  dashboard: "/dashboard",
  newOrder: "/new-order",
  cart: "/cart",
  history: "/history",
  help: "/help",
  order: (id: string) => `/orders/${id}`,

  // Staff console
  staff: {
    queue: "/staff/queue",
    order: (id: string) => `/staff/orders/${id}`,
  },

  // Admin portal
  admin: {
    overview: "/admin",
    settings: "/admin/settings",
    customers: "/admin/customers",
    stores: "/admin/stores",
    store: (id: string) => `/admin/stores/${id}`,
    employees: "/admin/employees",
    catalog: "/admin/catalog",
    discounts: "/admin/discounts",
    cms: "/admin/cms",
  },
} as const;
