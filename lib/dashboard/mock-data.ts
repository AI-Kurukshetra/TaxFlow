export const dashboardMetrics = [
  {
    title: "Tax liability",
    value: "$482,190",
    change: "+12.4% vs last period",
    tone: "accent" as const,
  },
  {
    title: "Compliance alerts",
    value: "18",
    change: "5 critical, 7 medium, 6 low",
    tone: "danger" as const,
  },
  {
    title: "Recent transactions",
    value: "1,284",
    change: "94 awaiting review",
    tone: "neutral" as const,
  },
  {
    title: "Upcoming deadlines",
    value: "6",
    change: "Next filing due in 4 days",
    tone: "warning" as const,
  },
];

export const recentTransactions = [
  {
    id: "TXN-10428",
    customer: "Acme Distribution",
    jurisdiction: "California, US",
    amount: "$18,420.00",
    tax: "$1,519.65",
    status: "Calculated",
  },
  {
    id: "TXN-10427",
    customer: "Northwind Foods",
    jurisdiction: "Texas, US",
    amount: "$9,600.00",
    tax: "$792.00",
    status: "Pending review",
  },
  {
    id: "TXN-10426",
    customer: "Vertex Retail",
    jurisdiction: "Ontario, CA",
    amount: "$14,050.00",
    tax: "$1,826.50",
    status: "Filed",
  },
  {
    id: "TXN-10425",
    customer: "BlueRiver Health",
    jurisdiction: "Maharashtra, IN",
    amount: "$6,480.00",
    tax: "$0.00",
    status: "Exempt",
  },
];

export const complianceAlerts = [
  {
    title: "Unexpected sales tax drop in California",
    severity: "Critical",
    detail: "March liability is 21% below trailing 90-day average.",
  },
  {
    title: "GST exemption certificate nearing expiry",
    severity: "Medium",
    detail: "4 certificates expire within the next 14 days.",
  },
  {
    title: "VAT code mismatch on digital services",
    severity: "Low",
    detail: "7 line items use a fallback code that needs review.",
  },
];

export const filingDeadlines = [
  {
    jurisdiction: "California Sales Tax",
    dueDate: "Mar 18",
    status: "In review",
  },
  {
    jurisdiction: "Texas Franchise Filing",
    dueDate: "Mar 22",
    status: "Preparing",
  },
  {
    jurisdiction: "Ontario HST Return",
    dueDate: "Mar 29",
    status: "Queued",
  },
  {
    jurisdiction: "UK VAT Return",
    dueDate: "Apr 05",
    status: "Draft",
  },
];

export const reportSummary = [
  {
    name: "Q1 Tax Liability Summary",
    period: "Jan 01 - Mar 31",
    status: "Ready",
    total: "$482,190",
  },
  {
    name: "California Nexus Report",
    period: "Q1 2026",
    status: "Draft",
    total: "$138,420",
  },
  {
    name: "EU VAT Breakdown",
    period: "Q1 2026",
    status: "Scheduled",
    total: "$74,880",
  },
];

export const integrationStatus = [
  {
    name: "NetSuite",
    sync: "Healthy",
    lastRun: "12 minutes ago",
  },
  {
    name: "QuickBooks",
    sync: "Warning",
    lastRun: "2 hours ago",
  },
  {
    name: "Stripe",
    sync: "Healthy",
    lastRun: "6 minutes ago",
  },
  {
    name: "SAP",
    sync: "Disconnected",
    lastRun: "3 days ago",
  },
];

export const settingsSections = [
  {
    title: "Organization profile",
    description: "Base currency, timezone, registrations, and filing preferences.",
  },
  {
    title: "Access control",
    description: "Role assignments for admins, tax managers, accountants, and viewers.",
  },
  {
    title: "Tax configuration",
    description: "Jurisdictions, rule overrides, exemptions, and rate sync options.",
  },
];
