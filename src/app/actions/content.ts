"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/guards";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import { updateContent, type SiteContent } from "@/server/content/content";
import { updateContentSchema, type UpdateContentInput } from "@/schemas/content";
import type { Result } from "@/lib/result";

/**
 * Save Admin → Content. Revalidates the whole layout because the footer and
 * dashboard welcome render from this on every customer page.
 */
export async function updateContentAction(
  input: UpdateContentInput
): Promise<Result<SiteContent>> {
  return runAction(async () => {
    await assertPermission("cms.manage");
    const parsed = updateContentSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);
    const content = await updateContent(parsed.data);
    revalidatePath("/", "layout");
    return content;
  });
}
