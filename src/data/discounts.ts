import "server-only";
import { isDemoMode } from "@/lib/mode";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/server/errors";
import type { CreateDiscountInput, UpdateDiscountInput } from "@/schemas/discount";

/**
 * Discount codes: admin CRUD plus the checkout-time validator. All money math
 * happens here on server-side prices - a client-supplied subtotal is never
 * trusted.
 */

export interface DiscountRow {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptions: number | null;
  maxPerAccount: number | null;
  minOrderSubtotal: number | null;
  accountIds: string[];
  timesRedeemed: number;
  createdAt: string;
}

/** What a validated code is worth on a given subtotal. */
export interface AppliedDiscount {
  discountId: string;
  code: string;
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const toNum = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const toDate = (v: string | null | undefined) => (v ? new Date(v) : null);
const iso = (d: Date | null) => (d ? d.toISOString() : null);

function demoGuard() {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to manage discounts.");
  }
}

export async function listDiscounts(): Promise<DiscountRow[]> {
  if (isDemoMode()) return [];
  const { prisma } = await import("./db");
  const rows = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      accounts: { select: { accountId: true } },
      _count: { select: { redemptions: true } },
    },
  });
  return rows.map((d) => ({
    id: d.id,
    code: d.code,
    description: d.description,
    type: d.type,
    value: Number(d.value),
    isActive: d.isActive,
    startsAt: iso(d.startsAt),
    endsAt: iso(d.endsAt),
    maxRedemptions: d.maxRedemptions,
    maxPerAccount: d.maxPerAccount,
    minOrderSubtotal: toNum(d.minOrderSubtotal),
    accountIds: d.accounts.map((a) => a.accountId),
    timesRedeemed: d._count.redemptions,
    createdAt: d.createdAt.toISOString(),
  }));
}

function writeData(input: CreateDiscountInput | UpdateDiscountInput) {
  return {
    code: input.code.trim().toUpperCase(),
    description: input.description?.trim() || null,
    type: input.type,
    value: input.value,
    isActive: input.isActive,
    startsAt: toDate(input.startsAt),
    endsAt: toDate(input.endsAt),
    maxRedemptions: input.maxRedemptions ?? null,
    maxPerAccount: input.maxPerAccount ?? null,
    minOrderSubtotal: input.minOrderSubtotal ?? null,
  };
}

export async function createDiscount(input: CreateDiscountInput): Promise<{ id: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const data = writeData(input);

  if (await prisma.discount.findUnique({ where: { code: data.code } })) {
    throw new ConflictError(`Code "${data.code}" already exists.`);
  }

  const created = await prisma.discount.create({
    data: {
      ...data,
      accounts: { create: (input.accountIds ?? []).map((accountId) => ({ accountId })) },
    },
    select: { id: true },
  });
  return created;
}

export async function updateDiscount(input: UpdateDiscountInput): Promise<{ id: string }> {
  demoGuard();
  const { prisma } = await import("./db");
  const data = writeData(input);

  const existing = await prisma.discount.findUnique({ where: { id: input.id } });
  if (!existing) throw new NotFoundError("That discount no longer exists.");

  if (data.code !== existing.code) {
    const clash = await prisma.discount.findUnique({ where: { code: data.code } });
    if (clash) throw new ConflictError(`Code "${data.code}" already exists.`);
  }

  // Replace the account restriction set wholesale - simplest correct semantics.
  await prisma.$transaction([
    prisma.discountAccount.deleteMany({ where: { discountId: input.id } }),
    prisma.discount.update({
      data: {
        ...data,
        accounts: { create: (input.accountIds ?? []).map((accountId) => ({ accountId })) },
      },
      where: { id: input.id },
    }),
  ]);
  return { id: input.id };
}

export async function deleteDiscount(id: string): Promise<void> {
  demoGuard();
  const { prisma } = await import("./db");
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("That discount no longer exists.");
  // Orders keep their code/amount snapshot; the FK is set null on delete.
  await prisma.discount.delete({ where: { id } });
}

/** Subtotal from real catalog prices - never from anything the client sent. */
export async function computeSubtotal(
  lines: { sku: string; quantity: number }[]
): Promise<number> {
  if (isDemoMode()) return 0;
  const { prisma } = await import("./db");
  const skus = [...new Set(lines.map((l) => l.sku))];
  const products = await prisma.product.findMany({
    where: { sku: { in: skus } },
    select: { sku: true, price: true },
  });
  const priceBySku = new Map(products.map((p) => [p.sku, toNum(p.price) ?? 0]));
  return round2(
    lines.reduce((sum, l) => sum + (priceBySku.get(l.sku) ?? 0) * l.quantity, 0)
  );
}

/**
 * Validate a code for an account against a server-computed subtotal and return
 * what it's worth. Throws a friendly BusinessRuleError explaining any failure.
 */
export async function validateDiscount(args: {
  code: string;
  accountId: string;
  subtotal: number;
}): Promise<AppliedDiscount> {
  demoGuard();
  const { prisma } = await import("./db");
  const code = args.code.trim().toUpperCase();

  const discount = await prisma.discount.findUnique({
    where: { code },
    include: {
      accounts: { select: { accountId: true } },
      _count: { select: { redemptions: true } },
    },
  });
  if (!discount || !discount.isActive) throw new BusinessRuleError("That promo code isn't valid.");

  const now = new Date();
  if (discount.startsAt && now < discount.startsAt) {
    throw new BusinessRuleError("That promo code isn't active yet.");
  }
  if (discount.endsAt && now > discount.endsAt) {
    throw new BusinessRuleError("That promo code has expired.");
  }

  if (discount.accounts.length > 0 && !discount.accounts.some((a) => a.accountId === args.accountId)) {
    throw new BusinessRuleError("That promo code isn't available for your account.");
  }

  const min = toNum(discount.minOrderSubtotal);
  if (min !== null && args.subtotal < min) {
    throw new BusinessRuleError(`This code needs an order subtotal of at least $${min.toFixed(2)}.`);
  }

  if (discount.maxRedemptions !== null && discount._count.redemptions >= discount.maxRedemptions) {
    throw new BusinessRuleError("That promo code has been fully redeemed.");
  }

  if (discount.maxPerAccount !== null) {
    const used = await prisma.discountRedemption.count({
      where: { discountId: discount.id, accountId: args.accountId },
    });
    if (used >= discount.maxPerAccount) {
      throw new BusinessRuleError("You've already used this promo code the maximum number of times.");
    }
  }

  const raw =
    discount.type === "PERCENT"
      ? (args.subtotal * Number(discount.value)) / 100
      : Number(discount.value);
  // Never discount below zero.
  const amount = round2(Math.min(raw, args.subtotal));

  return { discountId: discount.id, code: discount.code, amount };
}
