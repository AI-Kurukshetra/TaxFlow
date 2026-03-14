import { DataTable } from "@/components/dashboard/data-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { getDashboardPageData } from "@/lib/dashboard/live-data";

export default async function DashboardPage() {
  const { metrics, recentTransactions, complianceAlerts, filingDeadlines } = await getDashboardPageData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="A live view of tax exposure, filing readiness, transaction throughput, and compliance signals across your organization."
      />

      <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Recent transactions"
          subtitle="Most recent cross-jurisdiction transactions in the pipeline."
        >
          {recentTransactions.length > 0 ? (
            <DataTable
              columns={["id", "customer", "jurisdiction", "amount", "tax", "status"]}
              rows={recentTransactions}
            />
          ) : (
            <p className="text-sm text-slate-400">No transactions are available for the active organization yet.</p>
          )}
        </SectionCard>

        <div className="grid gap-4">
          <SectionCard
            title="Compliance alerts"
            subtitle="Signals that need operator attention before the next filing cycle."
          >
            {complianceAlerts.length > 0 ? (
              <div className="space-y-3">
                {complianceAlerts.map((alert) => (
                  <div key={alert.title} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium text-white">{alert.title}</h3>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">{alert.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No active compliance alerts for the current organization.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Filing deadlines"
            subtitle="Upcoming returns and filing milestones by jurisdiction."
          >
            {filingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {filingDeadlines.map((deadline) => (
                  <div
                    key={`${deadline.jurisdiction}-${deadline.dueDate}`}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{deadline.jurisdiction}</p>
                      <p className="mt-1 text-sm text-slate-400">Due {deadline.dueDate}</p>
                    </div>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                      {deadline.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No filing deadlines are currently scheduled.</p>
            )}
          </SectionCard>
        </div>
      </section>
    </div>
  );
}
