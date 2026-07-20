import { z } from "zod";

/** Email + password sign-in (customers and staff alike). */
export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type SignInInput = z.infer<typeof signInSchema>;

/** Customer self-signup — creates their company account + login. */
export const signUpSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  fullName: z.string().trim().min(1, "Your name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
export type SignUpInput = z.infer<typeof signUpSchema>;
