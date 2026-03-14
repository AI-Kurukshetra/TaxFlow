import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { hasRequiredRole, type AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_ORG_COOKIE = "taxflow-active-org";

type MembershipRow = {
  organization_id: string;
  role: AppRole;
  is_default: boolean;
};

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

export async function getCurrentMembership() {
  const { supabase, user } = await requireUser();
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

  const membershipResult = await query.maybeSingle();

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  const membership = membershipResult.data as MembershipRow | null;

  if (membership) {
    return membership;
  }

  const fallbackResult = await supabase
    .from("organization_memberships")
    .select("organization_id, role, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  const fallbackMembership = fallbackResult.data as MembershipRow | null;

  if (!fallbackMembership) {
    redirect("/login?error=no-organization");
  }

  return fallbackMembership;
}

export async function requireOrganizationAccess() {
  const membership = await getCurrentMembership();

  return {
    organizationId: membership.organization_id,
    role: membership.role,
  };
}

export async function requireOrganizationRole(minimumRole: AppRole) {
  const membership = await getCurrentMembership();

  if (!hasRequiredRole(membership.role, minimumRole)) {
    redirect("/dashboard/unauthorized");
  }

  return {
    organizationId: membership.organization_id,
    role: membership.role,
  };
}
