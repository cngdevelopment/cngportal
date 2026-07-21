import "server-only";
import { cache } from "react";
import { COMPANY } from "@/config/company";
import { WAREHOUSE } from "@/config/warehouse";
import { readContent, writeContent } from "@/data/content";
import type { UpdateContentInput, FaqInput } from "@/schemas/content";

/**
 * Editable site content. Same pattern as settings: config-derived defaults
 * with persisted overrides merged on top, read everywhere through
 * `getContent()` so callers never care where it came from.
 */

export interface SiteContent {
  welcomeHeading: string;
  welcomeBody: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  faqs: FaqInput[];
}

export const DEFAULT_CONTENT: SiteContent = {
  welcomeHeading: "",
  welcomeBody: "",
  footerText: `© ${COMPANY.name}. Wholesale ordering portal.`,
  contactEmail: COMPANY.supportEmail,
  contactPhone: COMPANY.phone,
  contactAddress: WAREHOUSE.address,
  contactHours: WAREHOUSE.hours,
  faqs: [],
};

export const getContent = cache(async function getContent(): Promise<SiteContent> {
  const overrides = (await readContent()) as Partial<SiteContent>;
  return {
    ...DEFAULT_CONTENT,
    ...overrides,
    faqs: Array.isArray(overrides.faqs) ? overrides.faqs : DEFAULT_CONTENT.faqs,
  };
});

export async function updateContent(input: UpdateContentInput): Promise<SiteContent> {
  const next: SiteContent = {
    welcomeHeading: input.welcomeHeading ?? "",
    welcomeBody: input.welcomeBody ?? "",
    footerText: input.footerText ?? "",
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone ?? "",
    contactAddress: input.contactAddress ?? "",
    contactHours: input.contactHours ?? "",
    faqs: input.faqs,
  };
  await writeContent(next as unknown as Record<string, unknown>);
  return { ...DEFAULT_CONTENT, ...next };
}
