import "server-only";
import { isDemoMode } from "@/lib/mode";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ConflictError, BusinessRuleError, NotFoundError } from "@/server/errors";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/schemas/employee";
import { MOCK_USERS } from "./mock/catalog-data";

/**
 * Employee (staff) account management — Admin Portal only. Creating a login
 * touches Supabase Auth (service role) + the users table, so mutations only
 * work against the real database. Staff have no linked customer account
 * (accountId null) and role STAFF or STAFF_ADMIN.
 */

export interface EmployeeRow {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string;
  role: string;
  department: string | null;
  employeeId: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  orderCount: number;
}

/** Build the stored full name from first/last (kept in sync for legacy code). */
function composeFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/** Empty-string optional fields normalize to null for the DB. */
function orNull(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export async function listEmployees(): Promise<EmployeeRow[]> {
  if (isDemoMode()) {
    return MOCK_USERS.filter((u) => !u.accountId).map((u) => ({
      id: u.id,
      firstName: null,
      lastName: null,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      department: null,
      employeeId: null,
      phone: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      orderCount: 0,
    }));
  }
  const { prisma } = await import("./db");
  const rows = await prisma.user.findMany({
    where: { accountId: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      role: true,
      department: true,
      employeeId: true,
      phone: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { ordersCreated: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    fullName: r.fullName,
    email: r.email,
    role: r.role,
    department: r.department,
    employeeId: r.employeeId,
    phone: r.phone,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    lastLoginAt: r.lastLoginAt ? r.lastLoginAt.toISOString() : null,
    orderCount: r._count.ordersCreated,
  }));
}

export async function createEmployee(input: CreateEmployeeInput): Promise<{ id: string }> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to create employee logins.");
  }
  const { prisma } = await import("./db");

  const employeeId = orNull(input.employeeId ?? undefined);
  if (employeeId) {
    const clash = await prisma.user.findFirst({ where: { employeeId }, select: { id: true } });
    if (clash) throw new ConflictError(`Employee ID "${employeeId}" is already in use.`);
  }

  // Create the auth login first so a duplicate email fails clearly and early.
  const admin = supabaseAdmin();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    const already = error?.message?.toLowerCase().includes("already");
    throw new ConflictError(already ? "That email already has a login." : error?.message ?? "Could not create the login.");
  }

  try {
    await prisma.user.create({
      data: {
        id: created.user.id,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        fullName: composeFullName(input.firstName, input.lastName),
        department: orNull(input.department ?? undefined),
        employeeId,
        phone: orNull(input.phone ?? undefined),
        role: input.role,
        isActive: input.isActive,
        accountId: null,
        invitedAt: new Date(),
      },
    });
    return { id: created.user.id };
  } catch (e) {
    // Roll back so a failed DB write never orphans an auth login.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    throw e;
  }
}

export async function updateEmployee(input: UpdateEmployeeInput): Promise<{ id: string }> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to manage employees.");
  }
  const { prisma } = await import("./db");

  const existing = await prisma.user.findUnique({ where: { id: input.id } });
  if (!existing || existing.accountId) throw new NotFoundError("That employee no longer exists.");

  const employeeId = orNull(input.employeeId ?? undefined);
  if (employeeId && employeeId !== existing.employeeId) {
    const clash = await prisma.user.findFirst({
      where: { employeeId, NOT: { id: input.id } },
      select: { id: true },
    });
    if (clash) throw new ConflictError(`Employee ID "${employeeId}" is already in use.`);
  }

  const admin = supabaseAdmin();
  const emailChanged = input.email.toLowerCase() !== existing.email.toLowerCase();

  // Sync the auth record first (email/password). If this fails we haven't
  // touched the profile row yet, so the two stay consistent.
  if (emailChanged) {
    const dup = await prisma.user.findFirst({
      where: { email: input.email, NOT: { id: input.id } },
      select: { id: true },
    });
    if (dup) throw new ConflictError("That email already belongs to another user.");
    const { error } = await admin.auth.admin.updateUserById(input.id, {
      email: input.email,
      email_confirm: true,
    });
    if (error) {
      const already = error.message?.toLowerCase().includes("already");
      throw new ConflictError(already ? "That email already has a login." : error.message);
    }
  }
  if (input.password) {
    const { error } = await admin.auth.admin.updateUserById(input.id, { password: input.password });
    if (error) throw new ConflictError(error.message);
  }

  await prisma.user.update({
    where: { id: input.id },
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      fullName: composeFullName(input.firstName, input.lastName),
      department: orNull(input.department ?? undefined),
      employeeId,
      phone: orNull(input.phone ?? undefined),
      role: input.role,
      isActive: input.isActive,
    },
  });
  return { id: input.id };
}

export async function deleteEmployee(id: string): Promise<void> {
  if (isDemoMode()) {
    throw new BusinessRuleError("Connect the database (Supabase) to manage employees.");
  }
  const { prisma } = await import("./db");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { ordersCreated: true, events: true, messages: true, attachments: true } } },
  });
  if (!user || user.accountId) throw new NotFoundError("That employee no longer exists.");
  if (user._count.ordersCreated > 0 || user._count.events > 0 || user._count.messages > 0) {
    throw new BusinessRuleError(
      "This employee has order activity and can't be deleted. Set them to Inactive instead."
    );
  }

  // Remove the auth login first (outside the DB write).
  const admin = supabaseAdmin();
  await admin.auth.admin.deleteUser(id).catch(() => {});
  await prisma.user.delete({ where: { id } });
}
