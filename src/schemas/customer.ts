import { z } from "zod";

/**
 * Staff creating a customer login from the Admin Portal. Account number is
 * optional — auto-generated when blank.
 */
export const createCustomerSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  accountNumber: z.string().trim().max(40).optional().or(z.literal("")),
  buyerName: z.string().trim().min(1, "Buyer name is required.").max(120),
  buyerEmail: z.string().trim().email("Enter a valid email address."),
  role: z.enum(["CUSTOMER_ADMIN", "CUSTOMER_USER"]),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
