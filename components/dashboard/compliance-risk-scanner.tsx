"use client";

import { useState } from "react";

import type { ComplianceRisk } from "@/lib/ai";
import type { ComplianceScanTransaction } from "@/lib/dashboard/compliance-scan";

type ComplianceRiskScannerProps = {
  transactions: ComplianceScanTransaction[];
};

function severityClasses(value: ComplianceRisk["severity"]) {
  if (value === "critical") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }

  if (value === "high") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }

  if (value === "medium") {
    return "border-yellow-400/30 bg-yellow-500/10 text-yellow-100";
  }

  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function formatSeverity(value: ComplianceRisk["severity"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ComplianceRiskScanner({ transactions }: ComplianceRiskScannerProps) {
  const [risks, setRisks] = useState<ComplianceRisk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runScan() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/private/ai/compliance-risk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      });

      const payload = (await response.json()) as { risks?: ComplianceRisk[]; error?: string };

      if (!response.ok) {
        setRisks([]);
        setError(payload.error ?? "Unable to detect compliance risks.");
        return;
      }

      setRisks(payload.risks ?? []);
      if ((payload.risks ?? []).length === 0) {
        setError(null);
      }
    } catch {
      setRisks([]);
      setError("Unable to reach the compliance risk service.");
    } finally {
      setLoading(false);
    }
  }

  if (transactions.length === 0) {
    return <p className="text-sm text-slate-400">Add transactions before running an AI compliance scan.</p>;
  }

  return (
    <div className="space-y-5 rounded-[24px] border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-300">AI scan input</p>
          <p className="mt-1 text-sm text-slate-400">
            Review the latest {transactions.length} transaction{transactions.length === 1 ? "" : "s"} for filing and coding risk.
          </p>
        </div>
        <button
          type="button"
          onClick={runScan}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Running risk scan..." : "Run Risk Scan"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>
      ) : null}

      {risks.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {risks.map((risk) => (
            <article key={`${risk.title}-${risk.transactionIds.join(",")}`} className="rounded-[22px] border border-white/10 bg-slate-950/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{risk.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{risk.summary}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${severityClasses(risk.severity)}`}>
                  {formatSeverity(risk.severity)}
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300">Recommendation: {risk.recommendation}</p>
              <p className="mt-3 text-xs text-slate-500">Transactions: {risk.transactionIds.join(", ")}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
