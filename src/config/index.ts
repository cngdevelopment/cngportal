/**
 * Barrel for the pure (env-free) config modules - safe to import from
 * anywhere, including Client Components.
 *
 * `company` and `warehouse` read process.env, so they are intentionally
 * NOT re-exported here; import them directly (`@/config/company`,
 * `@/config/warehouse`) from Server Components only.
 */
export * from "./business";
export * from "./colors";
export * from "./features";
export * from "./order";
export * from "./routes";
