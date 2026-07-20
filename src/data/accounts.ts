import "server-only";
import { isDemoMode } from "@/lib/mode";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ConflictError, BusinessRuleError } from "@/server/errors";
import type { CreateCustomerInput } from "@/schemas/customer";
import { MOCK_ACCOUNT, MOCK_USERS } from "./mock/catalog-data";

/**
 * Accounts + customer-login provisioning (staff-only, Admin Portal).
 * Creating a login touches Supabase Auth (service role) + the users table,
 * so it only works against the real database.
 */

export interface AccountRow {
  id: string;
  name: string;
  accountNumber: string;
  users: { id: string; email: string; fullName: string; role: string }[];
}

export interface CustomerCreated {
  accountName: string;
  accountNumber: string;
  buyerName: string;
  buyerEmail: string;
  /** First-login link staff can hand the customer (expires ~1 hour). */
  loginUrl: string;
}

export async function listAccounts(): Promise<AccountRow[]> {
  if (isDemoMode()) {
    return [
      {
        id: MOCK_ACCOUNT.id,
        name: MOCK_ACCOUNT.name,
        accountNumber: MOCK_ACCOUNT.accountNumber,
        users: MOCK_USERS.filter((u) => u.accountId).map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
        })),
      },
    ];
  }
  const { prisma } = await import("./db");
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      users: { orderBy: { email: "asc" }, select: { id: true, email: true, fullName: true, role: true } },
    },
  });
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    accountNumber: a.accountNumber,
    users: a.users.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role })),
  }));
}

export async function signUpCustomer(input: {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<void> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Sign-up requires the database (Supabase) to be connected.");
  }
  const { prisma } = await import("./db");

  // Auto-generate a unique account number.
  let n = (await prisma.account.count()) + 1;
  let accountNumber = "";
  do {
    accountNumber = `CG-${String(n).padStart(3, "0")}`;
    n++;
  } while (await prisma.account.findUnique({ where: { accountNumber } }));

  const admin = supabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    const already = error?.message?.toLowerCase().includes("already");
    throw new ConflictError(already ? "An account with that email already exists." : error?.message ?? "Could not create your account.");
  }

  let accountId: string | undefined;
  try {
    const account = await prisma.account.create({ data: { name: input.companyName, accountNumber } });
    accountId = account.id;
    await prisma.user.create({
      data: {
        id: created.user.id,
        email: input.email,
        fullName: input.fullName,
        role: "CUSTOMER_ADMIN",
        accountId: account.id,
        invitedAt: new Date(),
      },
    });
  } catch (e) {
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    if (accountId) await prisma.account.delete({ where: { id: accountId } }).catch(() => {});
    throw e;
  }
}

export async function deleteAccount(accountId: string): Promise<void> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to manage accounts.");
  }
  const { prisma } = await import("./db");

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { users: { select: { id: true } }, _count: { select: { orders: true } } },
  });
  if (!account) throw new ConflictError("That account no longer exists.");
  if (account._count.orders > 0) {
    throw new BusinessRuleError("This account has orders and can't be deleted. Deactivate it instead.");
  }

  // Remove the auth logins first (outside the DB transaction).
  const admin = supabaseAdmin();
  for (const u of account.users) {
    await admin.auth.admin.deleteUser(u.id).catch(() => {});
  }

  await prisma.$transaction([
    prisma.user.deleteMany({ where: { accountId } }),
    prisma.shipToAddress.deleteMany({ where: { accountId } }),
    prisma.account.delete({ where: { id: accountId } }),
  ]);
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerCreated> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to create customer logins.");
  }
  const { prisma } = await import("./db");

  // Resolve a unique account number (auto-generate when blank).
  let accountNumber = input.accountNumber?.trim() ?? "";
  if (accountNumber) {
    if (await prisma.account.findUnique({ where: { accountNumber } })) {
      throw new ConflictError(`Account number "${accountNumber}" is already in use.`);
    }
  } else {
    let n = (await prisma.account.count()) + 1;
    do {
      accountNumber = `CG-${String(n).padStart(3, "0")}`;
      n++;
    } while (await prisma.account.findUnique({ where: { accountNumber } }));
  }

  // Create the auth login first — fails clearly if the email already has one.
  const admin = supabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.buyerEmail,
    email_confirm: true,
  });
  if (error || !created?.user) {
    const already = error?.message?.toLowerCase().includes("already");
    throw new ConflictError(already ? "That email already has a login." : error?.message ?? "Could not create the login.");
  }

  let accountId: string | undefined;
  try {
    const account = await prisma.account.create({ data: { name: input.companyName, accountNumber } });
    accountId = account.id;
    await prisma.user.create({
      data: {
        id: created.user.id,
        email: input.buyerEmail,
        fullName: input.buyerName,
        role: input.role,
        accountId: account.id,
        invitedAt: new Date(),
      },
    });

    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: input.buyerEmail });
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const loginUrl = `${base}/auth/confirm?token_hash=${link?.properties?.hashed_token}&type=magiclink`;

    return {
      accountName: input.companyName,
      accountNumber,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      loginUrl,
    };
  } catch (e) {
    // Roll back so a failed write never orphans a login or account.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    if (accountId) await prisma.account.delete({ where: { id: accountId } }).catch(() => {});
    throw e;
  }
}
