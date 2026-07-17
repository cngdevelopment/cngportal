/**
 * Create a login (staff use only — there is no self-registration, spec §4).
 *
 *   npm run user:create -- <email> "<Full Name>" <ACCOUNT_NUMBER|staff> [role]
 *
 * Examples:
 *   npm run user:create -- ben@example.com "Ben Hampton" staff STAFF_ADMIN
 *   npm run user:create -- buyer@client.com "Pat Buyer" DEMO-001 CUSTOMER_ADMIN
 *
 * Creates the Supabase auth user (email pre-confirmed — they log in via
 * magic link) and the matching row in our users table.
 */
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, fullName, accountArg, roleArg] = process.argv.slice(2);
  if (!email || !fullName || !accountArg) {
    console.error('Usage: npm run user:create -- <email> "<Full Name>" <ACCOUNT_NUMBER|staff> [role]');
    process.exit(1);
  }

  const isStaff = accountArg.toLowerCase() === "staff";
  const role: Role = (roleArg as Role) ?? (isStaff ? "STAFF" : "CUSTOMER_USER");

  let accountId: string | null = null;
  if (!isStaff) {
    const account = await prisma.account.findUnique({ where: { accountNumber: accountArg } });
    if (!account) {
      console.error(`No account with number "${accountArg}". Run db:seed or create it first.`);
      process.exit(1);
    }
    accountId = account.id;
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (error) {
    console.error("Supabase:", error.message);
    process.exit(1);
  }

  await prisma.user.create({
    data: {
      id: data.user.id,
      email,
      fullName,
      role,
      accountId,
      invitedAt: new Date(),
    },
  });

  console.log(`Created ${role} ${email}${accountId ? ` on account ${accountArg}` : " (staff)"}.`);
  console.log("They can now log in with a magic link at /login.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
