import { z } from "zod";

/** Shared, reusable field validators. */
export const emailSchema = z.string().trim().email("Enter a valid email address.");

/**
 * Strong password policy - min 8 chars with upper, lower, number, and a
 * special character. Shared by employee create/edit and the reset flow.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Add at least one uppercase letter.")
  .regex(/[a-z]/, "Add at least one lowercase letter.")
  .regex(/[0-9]/, "Add at least one number.")
  .regex(/[^A-Za-z0-9]/, "Add at least one special character.");

/** Email + password sign-in (customers and staff alike). */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
export type SignInInput = z.infer<typeof signInSchema>;

/** "Forgot password" request - just an email; we send a reset link. */
export const passwordResetRequestSchema = z.object({ email: emailSchema });
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/** Setting a new password from the reset link (recovery session). */
export const passwordResetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
