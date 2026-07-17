import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireCustomer } from "@/data/context";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartPill } from "@/components/cart/CartPill";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireCustomer();

  async function signOut() {
    "use server";
    if (isDemoMode()) {
      cookies().delete(DEMO_SESSION_COOKIE);
    } else {
      const { supabaseServer } = await import("@/lib/supabase/server");
      const supabase = supabaseServer();
      await supabase.auth.signOut();
    }
    redirect("/login");
  }

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
        <form action={signOut}>
          <button className="btn ghost signout" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <nav className="site-nav">
        <NavLinks
          links={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/new-order", label: "New Order" },
            { href: "/history", label: "Order History" },
          ]}
        />
      </nav>
      <main className="portal">{children}</main>
      <CartPill />
    </CartProvider>
  );
}
