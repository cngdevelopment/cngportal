/**
 * Standardized response envelope for Server Actions and future API routes.
 *
 * Every backend operation resolves to a `Result<T>`: either `ok` with data,
 * or a typed `error` the UI can branch on. This is the single response
 * contract the whole app agrees on (spec: "standardize every response
 * format" — success / validation / unauthorized / forbidden / not-found /
 * server error).
 *
 * Framework-free (no server-only imports) so it is safe to import from
 * Client Components that need to narrow an action's return value.
 */

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BUSINESS_RULE"
  | "CONFLICT"
  | "INTERNAL";

/** Field-level messages keyed by input path, for form validation display. */
export type FieldErrors = Record<string, string>;

export interface ResultError {
  code: ErrorCode;
  message: string;
  /** Present for VALIDATION errors: per-field messages. */
  fields?: FieldErrors;
}

export type Ok<T> = { ok: true; data: T };
export type Err = { ok: false; error: ResultError };
export type Result<T> = Ok<T> | Err;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function err(code: ErrorCode, message: string, fields?: FieldErrors): Err {
  return { ok: false, error: fields ? { code, message, fields } : { code, message } };
}

/** HTTP status for an error code — for future API route handlers. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BUSINESS_RULE: 409,
  CONFLICT: 409,
  INTERNAL: 500,
};
