import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { signOutAction } from "@/app/actions/auth";
import { hasPermission } from "@/server/auth/permissions";
import { ROUTES } from "@/config/routes";
import { COMPANY } from "@/config/company";
import type { Role } from "@/types/domain";

/**
 * One shell for the whole staff/admin experience. Staff and Admin are the
 * same person on the same login — so both areas render identical chrome and
 * the same top-level nav (Order Queue / Admin). Admin is a tab, not a
 * separate app you get "switched" into.
 */
export function ConsoleShell({
  companyName,
  fullName,
  email,
  role,
  announcement,
  maintenanceMode = false,
  children,
}: {
  companyName: string;
  fullName: string;
  email: string;
  role: Role;
  announcement?: { enabled: boolean; message: string };
  maintenanceMode?: boolean;
  children: React.ReactNode;
}) {
  const links: { href: string; label: string }[] = [
    { href: ROUTES.staff.queue, label: "Order Queue" },
  ];
  if (hasPermission(role, "admin.access")) {
    links.push({ href: ROUTES.admin.overview, label: "Admin" });
  }

  return (
    <>
      <header className="site-header">
        <Logo />
        <div className="wordmark">
          {companyName}
          <small>{COMPANY.staffConsoleName}</small>
        </div>
        <div className="who">
          <b>{fullName}</b>
          {email}
        </div>
        <form action={signOutAction}>
          <button className="btn ghost signout" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <nav className="site-nav">
        <NavLinks links={links} />
      </nav>
      {maintenanceMode && (
        <div className="maintenance-flag" role="status">
          Maintenance mode is ON — customers can&rsquo;t place orders right now.
        </div>
      )}
      {announcement && (
        <AnnouncementBanner enabled={announcement.enabled} message={announcement.message} />
      )}
      <main className="portal">{children}</main>
    </>
  );
}
