import { DataTable } from "@/components/dashboard/data-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { getIntegrationsPageData } from "@/lib/dashboard/live-data";

export default async function IntegrationsPage() {
  const { integrations } = await getIntegrationsPageData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Integrations"
        description="Monitor connector health, sync timing, and ingestion readiness for ERP, finance, and commerce systems."
      />

      <SectionCard
        title="Source activity"
        subtitle="Observed transaction sources and recent sync evidence for the active organization."
      >
        {integrations.length > 0 ? (
          <DataTable columns={["name", "sync", "lastRun", "activity"]} rows={integrations} statusKey="sync" />
        ) : (
          <p className="text-sm text-slate-400">
            No source-system activity has been detected yet. Integration records will appear after transactions or sync
            events are ingested.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
