"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { generateReport, type GenerateReportState } from "@/app/(dashboard)/tax-reports/actions";

const INITIAL_STATE: GenerateReportState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Generating..." : "Generate Report"}
    </button>
  );
}

export function GenerateReportForm() {
  const [state, formAction] = useActionState(generateReport, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-4 rounded-[24px] border border-white/10 bg-white/5 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
      <div className="space-y-2 lg:col-span-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="report-name">
          Report Name
        </label>
        <input
          id="report-name"
          name="name"
          type="text"
          placeholder="Optional custom name"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="report-type">
          Report Type
        </label>
        <select
          id="report-type"
          name="reportType"
          defaultValue="liability_summary"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        >
          <option value="liability_summary">Liability Summary</option>
          <option value="jurisdiction_breakdown">Jurisdiction Breakdown</option>
          <option value="filing_ready">Filing Ready</option>
          <option value="audit_support">Audit Support</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="period-start">
          Period Start
        </label>
        <input
          id="period-start"
          name="periodStart"
          type="date"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200" htmlFor="period-end">
          Period End
        </label>
        <input
          id="period-end"
          name="periodEnd"
          type="date"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        />
      </div>

      <div className="lg:justify-self-end">
        <SubmitButton />
      </div>

      {state.error ? (
        <p className="lg:col-span-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="lg:col-span-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
