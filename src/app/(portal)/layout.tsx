import { requireCustomer } from "@/data/context";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
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

  return (
    <CartProvider>
      <header className="site-header">
        <Logo />
        <div className="wordmark">
          C&amp;G Wholesale
          <small>Ordering Portal</small>
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
          ]}
        />
      </nav>
      <main className="portal">{children}</main>
      <CartPill />
    </CartProvider>
  );
}
