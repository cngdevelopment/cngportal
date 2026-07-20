import "server-only";
import { isDemoMode } from "@/lib/mode";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ConflictError, BusinessRuleError, NotFoundError } from "@/server/errors";
import type { CreateCustomerInput, UpdateCustomerInput } from "@/schemas/customer";
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
  users: { id: string; email: string; fullName: string; role: string; isActive: boolean }[];
}

export interface CustomerCreated {
  accountName: string;
  accountNumber: string;
  buyerName: string;
  buyerEmail: string;
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
          isActive: true,
        })),
      },
    ];
  }
  const { prisma } = await import("./db");
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      users: { orderBy: { email: "asc" }, select: { id: true, email: true, fullName: true, role: true, isActive: true } },
    },
  });
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    accountNumber: a.accountNumber,
    users: a.users.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName, role: u.role, isActive: u.isActive })),
  }));
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
    password: input.password,
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

    return {
      accountName: input.companyName,
      accountNumber,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
    };
  } catch (e) {
    // Roll back so a failed write never orphans a login or account.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    if (accountId) await prisma.account.delete({ where: { id: accountId } }).catch(() => {});
    throw e;
  }
}

export async function updateCustomer(input: UpdateCustomerInput): Promise<{ id: string }> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to manage customer logins.");
  }
  const { prisma } = await import("./db");

  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user || !user.accountId) throw new NotFoundError("That customer no longer exists.");
  const accountId = user.accountId;

  // Account number: resolve + enforce uniqueness (only when changed/provided).
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new NotFoundError("That account no longer exists.");
  let accountNumber = input.accountNumber?.trim() || account.accountNumber;
  if (accountNumber !== account.accountNumber) {
    const clash = await prisma.account.findUnique({ where: { accountNumber } });
    if (clash) throw new ConflictError(`Account number "${accountNumber}" is already in use.`);
  }

  const admin = supabaseAdmin();
  const emailChanged = input.buyerEmail.toLowerCase() !== user.email.toLowerCase();

  // Sync the auth record first (email/password) so the two never diverge.
  if (emailChanged) {
    const dup = await prisma.user.findFirst({
      where: { email: input.buyerEmail, NOT: { id: input.userId } },
      select: { id: true },
    });
    if (dup) throw new ConflictError("That email already belongs to another user.");
    const { error } = await admin.auth.admin.updateUserById(input.userId, {
      email: input.buyerEmail,
      email_confirm: true,
    });
    if (error) {
      const already = error.message?.toLowerCase().includes("already");
      throw new ConflictError(already ? "That email already has a login." : error.message);
    }
  }
  if (input.password) {
    const { error } = await admin.auth.admin.updateUserById(input.userId, { password: input.password });
    if (error) throw new ConflictError(error.message);
  }

  await prisma.$transaction([
    prisma.account.update({ where: { id: accountId }, data: { name: input.companyName, accountNumber } }),
    prisma.user.update({
      where: { id: input.userId },
      data: {
        email: input.buyerEmail,
        fullName: input.buyerName,
        role: input.role,
        isActive: input.isActive,
      },
    }),
  ]);
  return { id: input.userId };
}
