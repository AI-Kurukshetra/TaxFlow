"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireOrganizationRole } from "@/lib/auth/guards";
import { APP_ROLES, type AppRole } from "@/lib/auth/roles";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type InviteUserState = {
  error: string | null;
  success: string | null;
  credentials: {
    email: string;
    password: string;
  } | null;
};

const INITIAL_STATE: InviteUserState = {
  error: null,
  success: null,
  credentials: null,
};

function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

function generateTemporaryPassword() {
  return `TaxFlow-${randomBytes(6).toString("hex")}`;
}

export async function inviteUser(_prevState: InviteUserState, formData: FormData): Promise<InviteUserState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "viewer").trim();

  if (!email) {
    return {
      ...INITIAL_STATE,
      error: "Email is required.",
    };
  }

  if (!isAppRole(roleValue)) {
    return {
      ...INITIAL_STATE,
      error: "Select a valid organization role.",
    };
  }

  const { organizationId } = await requireOrganizationRole("admin");

  const existingProfileResult = await supabaseAdmin
    .from("users")
    .select("id, full_name")
    .eq("email", email)
    .maybeSingle();

  if (existingProfileResult.error) {
    return {
      ...INITIAL_STATE,
      error: existingProfileResult.error.message,
    };
  }

  let userId = existingProfileResult.data?.id ?? null;
  let temporaryPassword: string | null = null;

  if (!userId) {
    temporaryPassword = generateTemporaryPassword();

    const createUserResult = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: fullName ? { full_name: fullName } : undefined,
    });

    if (createUserResult.error || !createUserResult.data.user) {
      return {
        ...INITIAL_STATE,
        error: createUserResult.error?.message ?? "Unable to create the user account.",
      };
    }

    userId = createUserResult.data.user.id;
  }

  if (!userId) {
    return {
      ...INITIAL_STATE,
      error: "Unable to resolve the invited user.",
    };
  }

  const profileUpsertResult = await supabaseAdmin.from("users").upsert(
    {
      id: userId,
      email,
      full_name: fullName || existingProfileResult.data?.full_name || null,
      is_platform_admin: false,
    },
    { onConflict: "id" },
  );

  if (profileUpsertResult.error) {
    return {
      ...INITIAL_STATE,
      error: profileUpsertResult.error.message,
    };
  }

  const membershipResult = await supabaseAdmin
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipResult.error) {
    return {
      ...INITIAL_STATE,
      error: membershipResult.error.message,
    };
  }

  if (membershipResult.data) {
    return {
      ...INITIAL_STATE,
      error: `${email} already has access to this organization.`,
    };
  }

  const insertMembershipResult = await supabaseAdmin.from("organization_memberships").insert({
    organization_id: organizationId,
    user_id: userId,
    role: roleValue,
    is_default: false,
  });

  if (insertMembershipResult.error) {
    return {
      ...INITIAL_STATE,
      error: insertMembershipResult.error.message,
    };
  }

  revalidatePath("/settings");

  return {
    error: null,
    success: temporaryPassword
      ? `${email} was created and added to the organization as ${roleValue.replace("_", " ")}.`
      : `${email} was added to the organization as ${roleValue.replace("_", " ")}.`,
    credentials: temporaryPassword
      ? {
          email,
          password: temporaryPassword,
        }
      : null,
  };
}
