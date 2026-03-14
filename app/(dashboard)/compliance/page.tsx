import { ComplianceRiskScanner } from "@/components/dashboard/compliance-risk-scanner";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { getComplianceScanTransactions } from "@/lib/dashboard/compliance-scan";
import { getCompliancePageData } from "@/lib/dashboard/live-data";

export default async function CompliancePage() {
  const [{ alerts }, transactions, access] = await Promise.all([
    getCompliancePageData(),
    getComplianceScanTransactions(),
    requireOrganizationAccess(),
  ]);

  const canRunRiskScan = access.role === "admin" || access.role === "tax_manager";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Compliance Dashboard"
        description="Track exception clusters, risk signals, and filing blockers before they impact statutory reporting."
      />

      <SectionCard
        title="AI compliance risk scan"
        subtitle="Run the existing compliance-risk model against recent organization transactions."
      >
        {canRunRiskScan ? (
          <ComplianceRiskScanner transactions={transactions} />
        ) : (
          <p className="text-sm text-slate-400">Your role can review alerts but cannot run AI compliance scans.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Active alerts"
        subtitle="AI-detected and rules-based compliance signals ordered by severity."
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
