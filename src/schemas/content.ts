import { z } from "zod";

/**
 * Site content staff can edit without touching code: the customer dashboard
 * welcome, the FAQ list, footer text, and public contact details.
 */

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const faqSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().min(1, "Question is required.").max(300),
  answer: z.string().trim().min(1, "Answer is required.").max(3000),
});
export type FaqInput = z.infer<typeof faqSchema>;

export const updateContentSchema = z.object({
  welcomeHeading: optionalText(160),
  welcomeBody: optionalText(1000),
  footerText: optionalText(500),
  contactEmail: z.string().trim().email("Enter a valid email address.").or(z.literal("")),
  contactPhone: optionalText(40),
  contactAddress: optionalText(300),
  contactHours: optionalText(160),
  faqs: z.array(faqSchema).max(50, "That's a lot of FAQs. Keep it under 50."),
});
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
