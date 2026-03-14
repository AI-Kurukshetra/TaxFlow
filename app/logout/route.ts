import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ACTIVE_ORG_COOKIE = "taxflow-active-org";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const redirectUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(redirectUrl, { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.signOut();
  response.cookies.delete(ACTIVE_ORG_COOKIE);

  return response;
}
