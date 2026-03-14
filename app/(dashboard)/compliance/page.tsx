import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { getCompliancePageData } from "@/lib/dashboard/live-data";

export default async function CompliancePage() {
  const [{ alerts }, access] = await Promise.all([getCompliancePageData(), requireOrganizationAccess()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Compliance Dashboard"
        description="Track exception clusters, risk signals, and filing blockers before they impact statutory reporting."
      />

      <SectionCard
        title="Compliance monitoring"
        subtitle="Automated risk scanning is currently limited to the rules-based alerts shown below."
      >
        <p className="text-sm text-slate-400">
          {access.role === "admin" || access.role === "tax_manager"
            ? "Review the active alerts below to investigate filing blockers and exception clusters."
            : "Your role can review active compliance alerts but cannot manage monitoring configuration."}
        </p>
      </SectionCard>

      <SectionCard
        title="Active alerts"
        subtitle="Rules-based compliance signals ordered by severity."
      >
        {alerts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {alerts.map((alert) => (
              <article key={`${alert.title}-${alert.detail}`} className="rounded-[22px] border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{alert.title}</h3>
                  <StatusBadge value={alert.severity} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{alert.detail}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No active compliance alerts for the selected organization.</p>
        )}
      </SectionCard>
    </div>
  );
}
