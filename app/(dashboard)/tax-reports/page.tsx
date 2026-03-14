import { DataTable } from "@/components/dashboard/data-table";
import { GenerateReportForm } from "@/components/dashboard/generate-report-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { requireOrganizationAccess } from "@/lib/auth/guards";
import { getReportsPageData } from "@/lib/dashboard/live-data";

export default async function TaxReportsPage() {
  const [{ reports }, access] = await Promise.all([
    getReportsPageData(),
    requireOrganizationAccess(),
  ]);

  const canGenerate = access.role === "admin" || access.role === "tax_manager" || access.role === "accountant";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tax Reports"
        description="Generate jurisdiction-level liability summaries, filing-ready reports, and audit support packs from deterministic tax snapshots."
      />

      <SectionCard
        title="Generate report"
        subtitle="Create a new report record for the active organization and make it available in the reporting pipeline."
      >
        {canGenerate ? (
          <GenerateReportForm />
        ) : (
          <p className="text-sm text-slate-400">Your role can review reports but cannot generate new ones.</p>
        )}
      </SectionCard>

      <SectionCard
        title="Reporting pipeline"
        subtitle="Current report generation status by filing period and report type."
      >
        {reports.length > 0 ? (
          <DataTable columns={["name", "period", "type", "status"]} rows={reports} />
        ) : (
          <p className="text-sm text-slate-400">No reports have been generated for this organization yet.</p>
        )}
      </SectionCard>
    </div>
  );
}
