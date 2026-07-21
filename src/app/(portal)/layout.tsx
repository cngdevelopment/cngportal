import { requireCustomer } from "@/data/context";
import { getSettings } from "@/server/settings/settings";
import { getContent } from "@/server/content/content";
import { isStaffRole } from "@/types/domain";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartPill } from "@/components/cart/CartPill";
import { signOutAction } from "@/app/actions/auth";
import { ROUTES } from "@/config/routes";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCustomer();
  const [settings, content] = await Promise.all([getSettings(), getContent()]);

  // Maintenance mode closes the customer portal; staff keep working through it.
  if (settings.maintenanceMode && !isStaffRole(ctx.role)) {
    return <MaintenanceScreen companyName={settings.companyName} supportPhone={settings.supportPhone} />;
  }

  return (
    <CartProvider>
      <header className="site-header">
        <Logo />
        <div className="wordmark">
          {settings.companyName}
          <small>{settings.portalName}</small>
        </div>
        <div className="who">
          <b>{ctx.accountName}</b>
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
            { href: ROUTES.dashboard, label: "Dashboard" },
            { href: ROUTES.newOrder, label: "New Order" },
            { href: ROUTES.history, label: "Order History" },
            { href: ROUTES.help, label: "Help" },
          ]}
        />
      </nav>
      <AnnouncementBanner enabled={settings.announcement.enabled} message={settings.announcement.message} />
      <main className="portal">{children}</main>
      {content.footerText.trim() ? <footer className="site-footer">{content.footerText}</footer> : null}
      <CartPill />
    </CartProvider>
  );
}
