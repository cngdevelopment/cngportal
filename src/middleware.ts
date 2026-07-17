import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode, DEMO_SESSION_COOKIE } from "@/lib/mode";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Gates the portal: unauthenticated requests are sent to /login. Auth
 * endpoints, static assets, and the login page itself are open.
 *
 * In demo mode (no Supabase configured — src/lib/mode.ts) this just
 * checks for the lightweight demo-session cookie set by /login instead
 * of talking to Supabase.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const open = path === "/login" || path.startsWith("/auth");

  if (isDemoMode()) {
    const hasSession = !!request.cookies.get(DEMO_SESSION_COOKIE)?.value;
    if (!hasSession && !open) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (hasSession && path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !open) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)",
  ],
};
