import { cookies } from "next/headers";

import { hasRequiredRole, type AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_ORG_COOKIE = "taxflow-active-org";

type ApiMembership = {
  organization_id: string;
  role: AppRole;
  is_default: boolean;
};

export class ApiAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

export async function requireApiRole(minimumRole: AppRole = "viewer") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiAuthError("Unauthorized", 401);
  }

  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;

  let query = supabase
    .from("organization_memberships")
    .select("organization_id, role, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .limit(1);

  if (activeOrgId) {
    query = query.eq("organization_id", activeOrgId);
  }

  let membershipResult = await query.maybeSingle();

  if (!membershipResult.data && !activeOrgId) {
    membershipResult = await supabase
      .from("organization_memberships")
      .select("organization_id, role, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();
  }

  if (membershipResult.error) {
    throw new ApiAuthError(membershipResult.error.message, 500);
  }

  const membership = membershipResult.data as ApiMembership | null;

  if (!membership) {
    throw new ApiAuthError("No organization membership found", 403);
  }

  if (!hasRequiredRole(membership.role, minimumRole)) {
    throw new ApiAuthError("Forbidden", 403);
  }

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
    role: membership.role,
  };
}
