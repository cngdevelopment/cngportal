import { z } from "zod";

/** Posting a message on an order (customer or staff). */
export const postMessageSchema = z.object({
  orderId: z.string().min(1),
  body: z.string().trim().min(1, "Message can't be empty.").max(4000),
  isInternal: z.boolean().default(false),
});

export type PostMessageInput = z.infer<typeof postMessageSchema>;
