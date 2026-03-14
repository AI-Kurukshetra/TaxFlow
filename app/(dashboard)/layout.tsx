import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { requireUser, getCurrentMembership } from "@/lib/auth/guards";

function formatRole(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ supabase, user }, membership] = await Promise.all([requireUser(), getCurrentMembership()]);

  const profileResult = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  const name = profileResult.data?.full_name || user.user_metadata?.full_name || user.email || "TaxFlow User";
  const email = profileResult.data?.email || user.email || "No email";

  return (
    <DashboardShell
      sidebar={<DashboardSidebar />}
      profile={{
        name,
        email,
        role: formatRole(membership.role),
      }}
    >
      {children}
    </DashboardShell>
  );
}
