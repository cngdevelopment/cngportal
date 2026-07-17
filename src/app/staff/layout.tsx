import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireStaff } from "@/data/context";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireStaff();

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
    <>
      <header className="site-header">
        <Logo />
        <div className="wordmark">
          C&amp;G Wholesale
          <small>Staff Console</small>
        </div>
        <div className="who">
          <b>{ctx.fullName}</b>
          {ctx.email}
        </div>
        <form action={signOut}>
          <button className="btn ghost signout" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <nav className="site-nav">
        <NavLinks links={[{ href: "/staff/queue", label: "Order Queue" }]} />
      </nav>
      <main className="portal">{children}</main>
    </>
  );
}
