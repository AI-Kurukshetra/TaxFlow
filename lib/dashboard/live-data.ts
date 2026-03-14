import "server-only";

import { requireOrganizationAccess } from "@/lib/auth/guards";
import type { AppRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type MetricTone = "accent" | "danger" | "warning" | "neutral";

type Metric = {
  title: string;
  value: string;
  change: string;
  tone: MetricTone;
};

type TableRow = Record<string, string>;

type Alert = {
  title: string;
  severity: string;
  detail: string;
};

type SettingsSection = {
  title: string;
  description: string;
};

type DashboardData = {
  metrics: Metric[];
  recentTransactions: TableRow[];
  complianceAlerts: Alert[];
  filingDeadlines: Array<{
    jurisdiction: string;
    dueDate: string;
    status: string;
  }>;
};

type ReportsData = {
  reports: TableRow[];
};

type TransactionsData = {
  transactions: TableRow[];
};

type ComplianceData = {
  alerts: Alert[];
};

type IntegrationsData = {
  integrations: TableRow[];
};

type SettingsData = {
  sections: SettingsSection[];
  members: TableRow[];
};

type OrganizationContext = {
  organizationId: string;
  role: AppRole;
  baseCurrency: string;
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) {
    return "On demand";
  }

  if (!start || !end) {
    return start ?? end ?? "On demand";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

function formatStatus(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getRelationName(value: unknown, fallback = "Unassigned") {
  if (!value) {
    return fallback;
  }

  if (Array.isArray(value)) {
    return getRelationName(value[0], fallback);
  }

  if (typeof value === "object" && value !== null && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" && name.length > 0 ? name : fallback;
  }

  return fallback;
}

function getMetadataSource(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "manual";
  }

  const source = (value as { source?: unknown }).source;
  return typeof source === "string" && source.length > 0 ? source : "manual";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected Supabase error";
}

async function getOrganizationContext(): Promise<OrganizationContext> {
  const { organizationId, role } = await requireOrganizationAccess();
  const supabase = await createClient();

  const organizationResult = await supabase
    .from("organizations")
    .select("base_currency")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationResult.error) {
    throw new Error(`Unable to load organization settings: ${organizationResult.error.message}`);
  }

  return {
    organizationId,
    role,
    baseCurrency: organizationResult.data?.base_currency ?? "USD",
  };
}

export async function getDashboardPageData(): Promise<DashboardData> {
  const { organizationId, baseCurrency } = await getOrganizationContext();
  const supabase = await createClient();

  const [transactionsResult, notificationsResult, returnsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "transaction_number, transaction_date, status, subtotal_amount, tax_amount, currency, customer:customers(name), jurisdiction:tax_jurisdictions(name)",
      )
      .eq("organization_id", organizationId)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("notifications")
      .select("subject, message, status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("tax_returns")
      .select("status, due_date, tax_due_amount, jurisdiction:tax_jurisdictions(name)")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true }),
  ]);

  if (transactionsResult.error) {
    throw new Error(`Unable to load transactions: ${transactionsResult.error.message}`);
  }

  if (notificationsResult.error) {
    throw new Error(`Unable to load notifications: ${notificationsResult.error.message}`);
  }

  if (returnsResult.error) {
    throw new Error(`Unable to load tax returns: ${returnsResult.error.message}`);
  }

  const transactions = transactionsResult.data ?? [];
  const notifications = notificationsResult.data ?? [];
  const returns = returnsResult.data ?? [];
  const now = new Date();

  const taxLiability = returns.reduce((sum, item) => sum + Number(item.tax_due_amount ?? 0), 0);
  const calculatedTransactions = transactions.filter((item) => item.status === "calculated").length;
  const pendingTransactions = transactions.filter((item) => item.status === "pending").length;
  const overdueReturns = returns.filter((item) => item.due_date && new Date(item.due_date) < now).length;

  return {
    metrics: [
      {
        title: "Tax liability",
        value: formatCurrency(taxLiability, baseCurrency),
        change: `${pluralize(returns.length, "return")} in active filing history`,
        tone: taxLiability > 0 ? "accent" : "neutral",
      },
      {
        title: "Compliance alerts",
        value: String(notifications.length + overdueReturns),
        change: overdueReturns > 0 ? `${pluralize(overdueReturns, "return")} overdue` : "No overdue returns",
        tone: overdueReturns > 0 ? "danger" : notifications.length > 0 ? "warning" : "accent",
      },
      {
        title: "Recent transactions",
        value: String(transactions.length),
        change: `${pluralize(calculatedTransactions, "calculated transaction")}, ${pluralize(pendingTransactions, "pending item")}`,
        tone: pendingTransactions > 0 ? "warning" : "neutral",
      },
      {
        title: "Upcoming deadlines",
        value: String(returns.length),
        change:
          returns[0]?.due_date != null
            ? `Next due ${formatShortDate(returns[0].due_date)}`
            : "No filing deadlines available",
        tone: returns.length > 0 ? "warning" : "neutral",
      },
    ],
    recentTransactions: transactions.slice(0, 5).map((item) => ({
      id: item.transaction_number,
      customer: getRelationName(item.customer),
      jurisdiction: getRelationName(item.jurisdiction),
      amount: formatCurrency(Number(item.subtotal_amount ?? 0), item.currency ?? baseCurrency),
      tax: formatCurrency(Number(item.tax_amount ?? 0), item.currency ?? baseCurrency),
      status: formatStatus(item.status),
    })),
    complianceAlerts: notifications.map((item) => ({
      title: item.subject,
      severity: item.status === "queued" ? "Critical" : "Medium",
      detail: item.message,
    })),
    filingDeadlines: returns.slice(0, 4).map((item) => ({
      jurisdiction: getRelationName(item.jurisdiction, "Jurisdiction pending"),
      dueDate: formatShortDate(item.due_date),
      status: formatStatus(item.status),
    })),
  };
}

export async function getTransactionsPageData(): Promise<TransactionsData> {
  const { organizationId, baseCurrency } = await getOrganizationContext();
  const supabase = await createClient();

  const result = await supabase
    .from("transactions")
    .select(
      "transaction_number, transaction_date, status, subtotal_amount, tax_amount, currency, customer:customers(name), jurisdiction:tax_jurisdictions(name)",
    )
    .eq("organization_id", organizationId)
    .order("transaction_date", { ascending: false });

  if (result.error) {
    throw new Error(`Unable to load transactions: ${result.error.message}`);
  }

  return {
    transactions: (result.data ?? []).map((item) => ({
      id: item.transaction_number,
      customer: getRelationName(item.customer),
      jurisdiction: getRelationName(item.jurisdiction),
      amount: formatCurrency(Number(item.subtotal_amount ?? 0), item.currency ?? baseCurrency),
      tax: formatCurrency(Number(item.tax_amount ?? 0), item.currency ?? baseCurrency),
      status: formatStatus(item.status),
    })),
  };
}

export async function getReportsPageData(): Promise<ReportsData> {
  const { organizationId } = await getOrganizationContext();
  const supabase = await createClient();

  const result = await supabase
    .from("reports")
    .select("name, report_type, report_period_start, report_period_end, storage_path, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw new Error(`Unable to load reports: ${result.error.message}`);
  }

  return {
    reports: (result.data ?? []).map((item) => ({
      name: item.name,
      period: formatDateRange(item.report_period_start, item.report_period_end),
      type: formatStatus(item.report_type),
      status: item.storage_path ? "Ready" : "Draft",
    })),
  };
}

export async function getCompliancePageData(): Promise<ComplianceData> {
  const { organizationId } = await getOrganizationContext();
  const supabase = await createClient();

  const [notificationsResult, returnsResult, certificatesResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("subject, message, status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tax_returns")
      .select("status, due_date, jurisdiction:tax_jurisdictions(name)")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true }),
    supabase
      .from("exemption_certificates")
      .select("certificate_number, expires_on, customer:customers(name)")
      .eq("organization_id", organizationId)
      .order("expires_on", { ascending: true }),
  ]);

  if (notificationsResult.error) {
    throw new Error(`Unable to load notifications: ${notificationsResult.error.message}`);
  }

  if (returnsResult.error) {
    throw new Error(`Unable to load tax returns: ${returnsResult.error.message}`);
  }

  if (certificatesResult.error) {
    throw new Error(`Unable to load exemption certificates: ${certificatesResult.error.message}`);
  }

  const alerts: Alert[] = [];
  const today = new Date();

  for (const item of returnsResult.data ?? []) {
    if (!item.due_date) {
      continue;
    }

    const dueDate = new Date(item.due_date);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

    alerts.push({
      title: `${getRelationName(item.jurisdiction, "Jurisdiction")} filing ${diffDays < 0 ? "overdue" : "upcoming"}`,
      severity: diffDays < 0 ? "Critical" : diffDays <= 14 ? "Medium" : "Low",
      detail: `Return is ${formatStatus(item.status)} with due date ${formatShortDate(item.due_date)}.`,
    });
  }

  for (const item of certificatesResult.data ?? []) {
    if (!item.expires_on) {
      continue;
    }

    const expiresOn = new Date(item.expires_on);
    const diffDays = Math.ceil((expiresOn.getTime() - today.getTime()) / 86400000);

    if (diffDays <= 60) {
      alerts.push({
        title: `Certificate ${item.certificate_number} nearing expiry`,
        severity: diffDays <= 30 ? "Medium" : "Low",
        detail: `${getRelationName(item.customer, "Customer")} certificate expires on ${formatShortDate(item.expires_on)}.`,
      });
    }
  }

  for (const item of notificationsResult.data ?? []) {
    alerts.push({
      title: item.subject,
      severity: item.status === "queued" ? "Critical" : "Medium",
      detail: item.message,
    });
  }

  return {
    alerts: alerts.slice(0, 6),
  };
}

export async function getIntegrationsPageData(): Promise<IntegrationsData> {
  const { organizationId } = await getOrganizationContext();
  const supabase = await createClient();

  const [transactionsResult, auditLogsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("metadata, transaction_date")
      .eq("organization_id", organizationId)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("action, occurred_at")
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false }),
  ]);

  if (transactionsResult.error) {
    throw new Error(`Unable to load transaction sources: ${transactionsResult.error.message}`);
  }

  if (auditLogsResult.error) {
    throw new Error(`Unable to load audit logs: ${auditLogsResult.error.message}`);
  }

  const integrations = new Map<string, { count: number; lastDate: string | null }>();

  for (const item of transactionsResult.data ?? []) {
    const source = getMetadataSource(item.metadata);
    const existing = integrations.get(source) ?? { count: 0, lastDate: null };

    integrations.set(source, {
      count: existing.count + 1,
      lastDate: existing.lastDate ?? item.transaction_date ?? null,
    });
  }

  const latestAudit = auditLogsResult.data?.[0];

  return {
    integrations: Array.from(integrations.entries()).map(([source, details]) => ({
      name: source.toUpperCase(),
      sync: details.count > 0 ? "Healthy" : "Pending",
      lastRun: details.lastDate ? formatShortDate(details.lastDate) : "No synced transactions",
      activity: latestAudit?.occurred_at
        ? `Latest audit event ${formatShortDate(latestAudit.occurred_at)}`
        : "No audit events yet",
    })),
  };
}

export async function getSettingsPageData(): Promise<SettingsData> {
  const { organizationId, role } = await getOrganizationContext();
  const supabase = await createClient();

  const [membershipsResult, productsResult, jurisdictionsResult, rulesResult] = await Promise.all([
    supabase
      .from("organization_memberships")
      .select("role, is_default, profile:users(email, full_name)")
      .eq("organization_id", organizationId)
      .order("is_default", { ascending: false }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("tax_jurisdictions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase.from("tax_rules").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
  ]);

  if (membershipsResult.error) {
    throw new Error(`Unable to load organization members: ${membershipsResult.error.message}`);
  }

  if (productsResult.error || jurisdictionsResult.error || rulesResult.error) {
    throw new Error(
      `Unable to load settings counts: ${getErrorMessage(productsResult.error ?? jurisdictionsResult.error ?? rulesResult.error)}`,
    );
  }

  return {
    sections: [
      {
        title: "Organization profile",
        description: `Active workspace is scoped to the selected organization for the ${formatStatus(role)} role.`,
      },
      {
        title: "Access control",
        description: `${pluralize(membershipsResult.data?.length ?? 0, "member")} currently mapped to this organization.`,
      },
      {
        title: "Tax configuration",
        description: `${productsResult.count ?? 0} products, ${jurisdictionsResult.count ?? 0} jurisdictions, and ${rulesResult.count ?? 0} active rule records are available.`,
      },
    ],
    members: (membershipsResult.data ?? []).map((item, index) => {
      const profile = item.profile as
        | { email?: string; full_name?: string }
        | Array<{ email?: string; full_name?: string }>
        | null;
      const resolvedProfile = Array.isArray(profile) ? profile[0] : profile;

      return {
        name: resolvedProfile?.full_name ?? `Member ${index + 1}`,
        email: resolvedProfile?.email ?? "No email",
        role: formatStatus(item.role),
        default: item.is_default ? "Default" : "Secondary",
      };
    }),
  };
}
