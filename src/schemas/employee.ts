import { z } from "zod";
import { emailSchema, passwordSchema } from "./auth";

/**
 * Employee (staff) accounts, managed only from the Admin Portal. Staff have
 * no linked customer account — role is STAFF or STAFF_ADMIN. A password is
 * always required at creation (no more magic-link-only, no-password logins).
 */

const employeeRole = z.enum(["STAFF", "STAFF_ADMIN"]);

const baseEmployeeFields = {
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName: z.string().trim().min(1, "Last name is required.").max(80),
  email: emailSchema,
  role: employeeRole,
  department: z.string().trim().max(80).optional().or(z.literal("")),
  employeeId: z.string().trim().max(40).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  isActive: z.boolean(),
};

export const createEmployeeSchema = z.object({
  ...baseEmployeeFields,
  password: passwordSchema,
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/**
 * Editing an employee. Password is optional — an empty New Password means
 * "leave it unchanged". When provided it must meet the policy and match the
 * confirmation field.
 */
export const updateEmployeeSchema = z
  .object({
    id: z.string().uuid(),
    ...baseEmployeeFields,
    password: passwordSchema.optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .refine((v) => !v.password || v.password === v.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
