import { DataTable } from "@/components/dashboard/data-table";
import { InviteUserForm } from "@/components/dashboard/invite-user-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { getSettingsPageData } from "@/lib/dashboard/live-data";

export default async function SettingsPage() {
  const [{ sections, members }, access] = await Promise.all([
    getSettingsPageData(),
    requireOrganizationAccess(),
  ]);

  const canInvite = access.role === "admin";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Configure organization defaults, user access, tax rules, and platform behavior without leaving the operations workspace."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <SectionCard key={section.title} title={section.title}>
            <p className="text-sm leading-6 text-slate-400">{section.description}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Invite user"
        subtitle="Admins can grant access to the active organization without leaving the workspace."
      >
        {canInvite ? (
          <InviteUserForm />
        ) : (
          <p className="text-sm text-slate-400">Only organization admins can invite or add members.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Organization members"
        subtitle="Current access assignments for the active organization."
      >
        {members.length > 0 ? (
          <DataTable columns={["name", "email", "role", "default"]} rows={members} />
        ) : (
          <p className="text-sm text-slate-400">No organization members are available for this workspace.</p>
        )}
      </SectionCard>
    </div>
  );
}
