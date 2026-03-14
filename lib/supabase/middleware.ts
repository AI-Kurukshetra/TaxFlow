import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login"];
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/tax-reports",
  "/compliance",
  "/integrations",
  "/settings",
  "/api/private",
];
const ACTIVE_ORG_COOKIE = "taxflow-active-org";

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user && !request.cookies.get(ACTIVE_ORG_COOKIE)?.value) {
    const { data: memberships } = await supabase
      .from("organization_memberships")
      .select("organization_id, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .limit(1);

    const defaultMembership = memberships?.[0];

    if (defaultMembership?.organization_id) {
      response.cookies.set(ACTIVE_ORG_COOKIE, defaultMembership.organization_id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
  }

  return response;
}
