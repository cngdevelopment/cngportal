import { z } from "zod";

/**
 * Validation for the future Admin Portal settings form. Defined now so the
 * write path is production-ready the moment the UI + persistence exist.
 */
export const updateSettingsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required.").max(120),
  portalName: z.string().trim().min(1, "Portal name is required.").max(120),
  supportEmail: z.string().trim().email("Enter a valid email address."),
  supportPhone: z.string().trim().min(1, "Support phone is required.").max(40),
  warehouseAddress: z.string().trim().min(1, "Warehouse address is required.").max(200),
  warehouseHours: z.string().trim().min(1, "Pickup hours are required.").max(120),
  warehousePhone: z.string().trim().min(1, "Warehouse phone is required.").max(40),
  announcementEnabled: z.boolean(),
  announcementMessage: z.string().trim().max(280),
  maintenanceMode: z.boolean(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
