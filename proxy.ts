import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/tax-reports/:path*",
    "/compliance/:path*",
    "/integrations/:path*",
    "/settings/:path*",
    "/login",
    "/api/private/:path*",
  ],
};
