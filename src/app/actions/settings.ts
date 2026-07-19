"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/server/auth/guards";
import { runAction } from "@/server/action";
import { ValidationError } from "@/server/errors";
import { updateSettings } from "@/server/settings/settings";
import { updateSettingsSchema, type UpdateSettingsInput } from "@/schemas/settings";
import type { Result } from "@/lib/result";
import type { AppSettings } from "@/server/settings/settings";

/**
 * Save Admin → Settings. Returns the standard Result envelope so the form
 * can render field-level validation errors and a success toast.
 */
export async function updateSettingsAction(
  input: UpdateSettingsInput
): Promise<Result<AppSettings>> {
  return runAction(async () => {
    await assertPermission("settings.manage");
    const parsed = updateSettingsSchema.safeParse(input);
    if (!parsed.success) throw ValidationError.fromZod(parsed.error);

    const settings = await updateSettings(parsed.data);

    // Company name / warehouse show up in headers and the pickup panel.
    revalidatePath("/", "layout");
    return settings;
  });
}
