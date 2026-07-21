import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth";

/**
 * Staff creating a customer login from the Admin Portal. Account number is
 * optional - auto-generated when blank. A password is required so the
 * customer can sign in with email + password (no magic-link-only logins).
 */
export const createCustomerSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  accountNumber: z.string().trim().max(40).optional().or(z.literal("")),
  buyerName: z.string().trim().min(1, "Buyer name is required.").max(120),
  buyerEmail: emailSchema,
  role: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_USER"]),
  password: passwordSchema,
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/**
 * Staff editing a customer. Company + account number apply to the account;
 * the rest apply to the buyer login. Password is optional - empty means
 * "leave it unchanged".
 */
export const updateCustomerSchema = z
  .object({
    userId: z.string().uuid(),
    companyName: z.string().trim().min(1, "Company name is required.").max(120),
    accountNumber: z.string().trim().max(40).optional().or(z.literal("")),
    buyerName: z.string().trim().min(1, "Buyer name is required.").max(120),
    buyerEmail: emailSchema,
    role: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_USER"]),
    isActive: z.boolean(),
    password: passwordSchema.optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine((v) => !v.password || v.password === v.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
