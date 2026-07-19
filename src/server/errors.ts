import "server-only";
import { ZodError } from "zod";
import { type ErrorCode, type FieldErrors, type Result, err } from "@/lib/result";

/**
 * Typed error hierarchy for the backend. Services and repositories throw
 * these; the action boundary (src/server/action.ts) catches them and maps
 * to the standard `Result` envelope. This keeps error handling consistent
 * across every future backend operation.
 */

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  readonly fields?: FieldErrors;

  constructor(message: string, fields?: FieldErrors) {
    super(message);
    this.name = new.target.name;
    this.fields = fields;
  }
}

/** Input failed validation (bad shape, missing required fields, etc.). */
export class ValidationError extends AppError {
  readonly code = "VALIDATION" as const;

  static fromZod(error: ZodError): ValidationError {
    const fields: FieldErrors = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".") || "_";
      if (!fields[path]) fields[path] = issue.message;
    }
    return new ValidationError("Please correct the highlighted fields.", fields);
  }
}

/** No valid session — the caller must sign in. */
export class AuthenticationError extends AppError {
  readonly code = "UNAUTHENTICATED" as const;
  constructor(message = "You must be signed in to do that.") {
    super(message);
  }
}

/** Authenticated, but not allowed to perform this action. */
export class AuthorizationError extends AppError {
  readonly code = "FORBIDDEN" as const;
  constructor(message = "You don't have permission to do that.") {
    super(message);
  }
}

/** Requested resource does not exist (or is not visible to the caller). */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND" as const;
  constructor(message = "Not found.") {
    super(message);
  }
}

/** A domain rule was violated (e.g. illegal order-status transition). */
export class BusinessRuleError extends AppError {
  readonly code = "BUSINESS_RULE" as const;
}

/** Optimistic-concurrency / duplicate conflict. */
export class ConflictError extends AppError {
  readonly code = "CONFLICT" as const;
}

/** Map any thrown value into the standard `Result` error envelope. */
export function toErrorResult(error: unknown): Result<never> {
  if (error instanceof ZodError) {
    return errFrom(ValidationError.fromZod(error));
  }
  if (error instanceof AppError) {
    return errFrom(error);
  }
  // Unknown/unexpected — never leak internals to the client.
  console.error("Unexpected error:", error);
  return err("INTERNAL", "Something went wrong. Please try again.");
}

function errFrom(error: AppError): Result<never> {
  return err(error.code, error.message, error.fields);
}
