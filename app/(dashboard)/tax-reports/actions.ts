"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireOrganizationRole, requireUser } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/auth/roles";

const ALLOWED_ROLES: AppRole[] = ["admin", "tax_manager", "accountant"];
const ALLOWED_REPORT_TYPES = [
  "liability_summary",
  "jurisdiction_breakdown",
  "filing_ready",
  "audit_support",
  "custom",
] as const;

type ReportType = (typeof ALLOWED_REPORT_TYPES)[number];

export type GenerateReportState = {
  error: string | null;
  success: string | null;
};

const INITIAL_STATE: GenerateReportState = {
  error: null,
  success: null,
};

function isReportType(value: string): value is ReportType {
  return (ALLOWED_REPORT_TYPES as readonly string[]).includes(value);
}

function formatReportType(value: ReportType) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildDefaultName(reportType: ReportType, periodStart: string, periodEnd: string) {
  const label = formatReportType(reportType);
  if (periodStart && periodEnd) {
    return `${label} ${periodStart} to ${periodEnd}`;
  }

  return `${label} ${new Date().toISOString().slice(0, 10)}`;
}

export async function generateReport(
  _prevState: GenerateReportState,
  formData: FormData,
): Promise<GenerateReportState> {
  const reportTypeValue = String(formData.get("reportType") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const periodStart = String(formData.get("periodStart") ?? "").trim();
  const periodEnd = String(formData.get("periodEnd") ?? "").trim();

  if (!isReportType(reportTypeValue)) {
    return {
      ...INITIAL_STATE,
      error: "Select a valid report type.",
    };
  }

  if ((periodStart && !periodEnd) || (!periodStart && periodEnd)) {
    return {
      ...INITIAL_STATE,
      error: "Provide both a start and end date for the reporting period.",
    };
  }

  if (periodStart && periodEnd && periodStart > periodEnd) {
    return {
      ...INITIAL_STATE,
      error: "The report start date must be on or before the end date.",
    };
  }

  const { organizationId, role } = await requireOrganizationRole("accountant");
  const { supabase, user } = await requireUser();

  if (!ALLOWED_ROLES.includes(role)) {
    return {
      ...INITIAL_STATE,
      error: "Your role does not allow report generation.",
    };
  }

  const reportName = name || buildDefaultName(reportTypeValue, periodStart, periodEnd);
  const storagePath = `reports/generated/${organizationId}/${randomUUID()}.csv`;

  const insertResult = await supabase.from("reports").insert({
    organization_id: organizationId,
    report_type: reportTypeValue,
    name: reportName,
    report_period_start: periodStart || null,
    report_period_end: periodEnd || null,
    generated_by: user.id,
    storage_path: storagePath,
    filters: {
      generated_from: "tax_reports_ui",
      requested_by_role: role,
    },
  });

  if (insertResult.error) {
    return {
      ...INITIAL_STATE,
      error: insertResult.error.message,
    };
  }

  revalidatePath("/tax-reports");

  return {
    error: null,
    success: `${reportName} has been generated for the active organization.`,
  };
}
