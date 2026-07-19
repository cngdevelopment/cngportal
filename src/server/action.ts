import "server-only";
import { type Result, ok } from "@/lib/result";
import { toErrorResult } from "./errors";

/**
 * Wraps a Server Action body so it always resolves to the standard
 * `Result<T>` envelope: the happy path returns `ok(data)`, and any thrown
 * `AppError`/`ZodError`/unexpected error is mapped to a typed error result.
 *
 * Future mutations should be written as:
 *   export const createSomethingAction = (input) =>
 *     runAction(() => somethingService.create(input));
 *
 * (Existing actions still use their legacy return shapes; they migrate to
 * this envelope in the action-standardization step.)
 */
export function runAction<T>(fn: () => Promise<T>): Promise<Result<T>> {
  return fn().then(ok).catch(toErrorResult);
}
