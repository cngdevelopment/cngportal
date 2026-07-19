import { requirePermission } from "@/server/auth/guards";
import { getSettings } from "@/server/settings/settings";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { signOutAction } from "@/app/actions/auth";
import { ROUTES } from "@/config/routes";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Gate the entire admin portal on a single permission.
  const ctx = await requirePermission("admin.access");
  const settings = await getSettings();

  return (
    <>
      <header className="site-header">
        <Logo />
        <div className="wordmark">
          {settings.companyName}
          <small>Admin</small>
        </div>
        <div className="who">
          <b>{ctx.fullName}</b>
          {ctx.email}
        </div>
        <form action={signOutAction}>
          <button className="btn ghost signout" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <nav className="site-nav">
        <NavLinks
          links={[
            { href: ROUTES.admin.overview, label: "Overview" },
            { href: ROUTES.staff.queue, label: "Staff Queue" },
          ]}
        />
      </nav>
      <main className="portal">{children}</main>
    </>
  );
}
