import "server-only";
import { isDemoMode } from "@/lib/mode";

/**
 * Persistence for editable site content. Shares the `settings` table under its
 * own key, so no extra migration is needed. Durable for the same reason
 * settings are: serverless instances must not hold this in memory.
 */

const CONTENT_KEY = "content";

const globalForContent = globalThis as unknown as {
  __cgContent?: Record<string, unknown>;
};

export async function readContent(): Promise<Record<string, unknown>> {
  if (isDemoMode()) return globalForContent.__cgContent ?? {};
  const { prisma } = await import("./db");
  const row = await prisma.setting.findUnique({ where: { key: CONTENT_KEY } });
  return (row?.value as Record<string, unknown> | undefined) ?? {};
}

export async function writeContent(next: Record<string, unknown>): Promise<void> {
  if (isDemoMode()) {
    globalForContent.__cgContent = next;
    return;
  }
  const { prisma } = await import("./db");
  await prisma.setting.upsert({
    where: { key: CONTENT_KEY },
    create: { key: CONTENT_KEY, value: next as object },
    update: { value: next as object },
  });
}
