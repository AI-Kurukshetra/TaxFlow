# TaxFlow Pro Production Architecture

## 1. System Overview

TaxFlow Pro is a multi-tenant SaaS platform for indirect tax automation built on:

- **Frontend and BFF**: Next.js App Router on Vercel
- **Language**: TypeScript
- **UI**: TailwindCSS
- **Core data and auth**: Supabase Auth + PostgreSQL + Row Level Security
- **AI layer**: OpenAI Codex for transaction classification, compliance summarization, and operator assistance
- **Deployment**: Vercel for web and cron execution, Supabase for database and auth

The architecture should follow four production rules:

1. **Server-first security**: tax calculations, reporting, and AI orchestration run on the server.
2. **Tenant isolation by default**: all business data is scoped by `organization_id` and enforced with RLS.
3. **Deterministic core, AI-assisted edges**: tax amount calculation is rule-based; AI supports classification and review workflows, not final ledger authority without validation.
4. **Auditable workflows**: every calculation, rule version, AI suggestion, filing action, and user action is traceable.

---

## 2. Recommended Project Folder Structure

```text
taxflow-pro/
+- app/
¦  +- (marketing)/
¦  ¦  +- page.tsx
¦  ¦  +- pricing/page.tsx
¦  ¦  +- contact/page.tsx
¦  +- (auth)/
¦  ¦  +- login/page.tsx
¦  ¦  +- signup/page.tsx
¦  ¦  +- forgot-password/page.tsx
¦  ¦  +- callback/route.ts
¦  +- (dashboard)/
¦  ¦  +- layout.tsx
¦  ¦  +- page.tsx
¦  ¦  +- transactions/
¦  ¦  ¦  +- page.tsx
¦  ¦  ¦  +- [transactionId]/page.tsx
¦  ¦  ¦  +- import/page.tsx
¦  ¦  +- calculations/page.tsx
¦  ¦  +- reports/
¦  ¦  ¦  +- page.tsx
¦  ¦  ¦  +- [reportId]/page.tsx
¦  ¦  +- compliance/page.tsx
¦  ¦  +- filings/page.tsx
¦  ¦  +- integrations/page.tsx
¦  ¦  +- settings/
¦  ¦  ¦  +- organization/page.tsx
¦  ¦  ¦  +- users/page.tsx
¦  ¦  ¦  +- tax-rules/page.tsx
¦  ¦  ¦  +- exemptions/page.tsx
¦  ¦  +- api-keys/page.tsx
¦  +- api/
¦  ¦  +- webhooks/
¦  ¦  ¦  +- stripe/route.ts
¦  ¦  ¦  +- erp/route.ts
¦  ¦  +- transactions/
¦  ¦  ¦  +- ingest/route.ts
¦  ¦  ¦  +- classify/route.ts
¦  ¦  +- tax/
¦  ¦  ¦  +- calculate/route.ts
¦  ¦  ¦  +- rates/route.ts
¦  ¦  ¦  +- validate/route.ts
¦  ¦  +- reports/
¦  ¦  ¦  +- generate/route.ts
¦  ¦  ¦  +- export/route.ts
¦  ¦  +- compliance/
¦  ¦  ¦  +- monitor/route.ts
¦  ¦  ¦  +- alerts/route.ts
¦  ¦  +- ai/
¦  ¦     +- classify/route.ts
¦  ¦     +- summarize/route.ts
¦  ¦     +- explain/route.ts
¦  +- layout.tsx
¦  +- page.tsx
¦  +- globals.css
+- components/
¦  +- ui/
¦  +- dashboard/
¦  +- transactions/
¦  +- reports/
¦  +- compliance/
¦  +- ai/
+- lib/
¦  +- auth/
¦  ¦  +- roles.ts
¦  ¦  +- permissions.ts
¦  ¦  +- guards.ts
¦  +- supabase/
¦  ¦  +- client.ts
¦  ¦  +- server.ts
¦  ¦  +- middleware.ts
¦  ¦  +- admin.ts
¦  +- db/
¦  ¦  +- types.ts
¦  ¦  +- mappers.ts
¦  +- tax/
¦  ¦  +- engine.ts
¦  ¦  +- rate-resolver.ts
¦  ¦  +- nexus.ts
¦  ¦  +- exemptions.ts
¦  ¦  +- validator.ts
¦  ¦  +- calculators/
¦  ¦     +- sales-tax.ts
¦  ¦     +- vat.ts
¦  ¦     +- gst.ts
¦  +- reporting/
¦  ¦  +- report-builder.ts
¦  ¦  +- return-generator.ts
¦  ¦  +- export-formatters.ts
¦  +- compliance/
¦  ¦  +- monitor.ts
¦  ¦  +- risk-score.ts
¦  ¦  +- deadline-engine.ts
¦  ¦  +- alert-router.ts
¦  +- integrations/
¦  ¦  +- base/
¦  ¦  ¦  +- connector.ts
¦  ¦  ¦  +- mapper.ts
¦  ¦  +- netsuite/
¦  ¦  +- quickbooks/
¦  ¦  +- xero/
¦  ¦  +- sap/
¦  ¦  +- oracle/
¦  +- ai/
¦  ¦  +- client.ts
¦  ¦  +- prompts/
¦  ¦  ¦  +- classify.ts
¦  ¦  ¦  +- summarize.ts
¦  ¦  ¦  +- explain.ts
¦  ¦  +- orchestrator.ts
¦  ¦  +- schemas.ts
¦  ¦  +- guardrails.ts
¦  ¦  +- post-process.ts
¦  +- jobs/
¦  ¦  +- scheduler.ts
¦  ¦  +- transaction-jobs.ts
¦  ¦  +- report-jobs.ts
¦  ¦  +- compliance-jobs.ts
¦  +- audit/
¦  ¦  +- logger.ts
¦  ¦  +- events.ts
¦  +- billing/
¦  ¦  +- plans.ts
¦  +- env.ts
¦  +- constants.ts
¦  +- utils.ts
+- actions/
¦  +- transactions.ts
¦  +- reports.ts
¦  +- compliance.ts
¦  +- settings.ts
+- hooks/
¦  +- use-organization.ts
¦  +- use-transactions.ts
¦  +- use-compliance-alerts.ts
+- types/
¦  +- domain.ts
¦  +- api.ts
¦  +- ai.ts
+- supabase/
¦  +- migrations/
¦  +- seed.sql
¦  +- policies.sql
¦  +- functions/
¦     +- tax-rate-sync/
¦     +- filing-submission/
¦     +- regulation-sync/
+- tests/
¦  +- unit/
¦  +- integration/
¦  +- contract/
¦  +- e2e/
+- middleware.ts
+- tailwind.config.ts
+- next.config.ts
+- package.json
+- README.md
```

### Structure rationale

- `app/` owns routes, layouts, route handlers, and page-level composition.
- `lib/` owns business logic and external integrations.
- `actions/` contains server actions for authenticated dashboard mutations.
- `supabase/` stores database migrations, RLS policies, and optional Supabase Edge Functions.
- `tests/` is split by scope so the tax engine and RLS can be validated independently.

---

## 3. Core Services

### A. Identity and Tenant Service

Purpose:

- Handle authentication with Supabase Auth
- Map users to organizations
- Enforce role-based access

Key tables:

- `organizations`
- `profiles`
- `organization_memberships`
- `roles`
- `api_keys`

Production rules:

- Every authenticated user belongs to one or more organizations.
- Every dashboard request resolves an active organization context.
- Service-role Supabase access is only used in server-only code for jobs and system workflows.

### B. Tax Calculation Service

Purpose:

- Calculate indirect tax per transaction and line item
- Apply jurisdiction, product taxability, exemptions, nexus, and currency logic

Key tables:

- `transactions`
- `transaction_lines`
- `products`
- `customers`
- `jurisdictions`
- `tax_rates`
- `tax_rules`
- `exemption_certificates`
- `calculation_runs`

Design rule:

- Treat this service as deterministic. Inputs, rule version, and output must be reproducible.

Example service contract:

```ts
export interface CalculateTaxInput {
  organizationId: string;
  transactionId: string;
  jurisdictionCode: string;
  transactionDate: string;
  currency: string;
}

export interface CalculateTaxResult {
  subtotal: number;
  taxAmount: number;
  effectiveRate: number;
  jurisdictionBreakdown: Array<{
    jurisdictionId: string;
    taxType: "sales_tax" | "vat" | "gst";
    rate: number;
    amount: number;
  }>;
  ruleVersionId: string;
}
```

### C. Transaction Classification Service

Purpose:

- Normalize ERP transaction payloads
- Map SKUs, service types, exemption flags, and tax codes
- Use AI only when deterministic mapping is missing or confidence is low

Key tables:

- `classification_rules`
- `classification_predictions`
- `product_tax_codes`
- `transaction_ingestion_events`

Design rule:

- Prefer exact mapping and learned internal rules before invoking AI.

### D. Reporting and Filing Service

Purpose:

- Aggregate transactions into filing periods
- Generate tax reports and filing-ready return datasets
- Track submission status and audit evidence

Key tables:

- `reporting_periods`
- `tax_reports`
- `tax_report_lines`
- `tax_returns`
- `filing_submissions`
- `documents`

Design rule:

- Reports are generated from immutable calculation snapshots, not from mutable source rows at render time.

### E. Compliance Monitoring Service

Purpose:

- Detect filing deadlines
- Monitor missing registrations, mismatches, unusual tax variances, and missing evidence
- Route alerts to dashboards and email workflows

Key tables:

- `compliance_checks`
- `compliance_alerts`
- `deadlines`
- `nexus_obligations`
- `risk_scores`

### F. Integration Service

Purpose:

- Ingest transactions from ERP/accounting systems
- Export reports and filing artifacts
- Maintain connector health and mapping state

Key tables:

- `integrations`
- `integration_connections`
- `integration_sync_runs`
- `integration_sync_items`

Design rule:

- External schemas are mapped into an internal canonical transaction model before tax logic runs.

### G. Audit and Observability Service

Purpose:

- Record every critical action
- Support regulator review and internal troubleshooting

Key tables:

- `audit_logs`
- `event_outbox`
- `job_runs`

Every important event should capture:

- `organization_id`
- actor type (`user`, `system`, `ai`)
- action name
- entity type and ID
- before/after summary
- correlation ID
- timestamp

---

## 4. Suggested Data Model Baseline

Minimal production schema domains:

```text
Identity
- organizations
- profiles
- organization_memberships

Tax master data
- jurisdictions
- tax_rates
- tax_rules
- tax_rule_versions
- nexus_rules
- exemption_certificates

Operations
- customers
- products
- transactions
- transaction_lines
- calculation_runs
- classification_predictions

Reporting
- reporting_periods
- tax_reports
- tax_report_lines
- tax_returns
- filing_submissions

Compliance
- deadlines
- compliance_checks
- compliance_alerts
- risk_scores

Integrations
- integrations
- integration_connections
- integration_sync_runs
- integration_sync_items

Platform
- documents
- notifications
- audit_logs
- job_runs
```

Recommended table conventions:

- UUID primary keys
- `organization_id` on every tenant-owned row
- `created_at`, `updated_at`, `created_by`
- soft deletion only where legally safe
- append-only version tables for tax rules and rates

---

## 5. Data Flow Architecture

### A. Tax Calculation Flow

```text
ERP / UI Input
  -> Transaction Ingestion API
  -> Canonical Transaction Mapping
  -> Classification Engine
  -> Tax Rule Resolver
  -> Tax Calculation Engine
  -> Calculation Snapshot Stored
  -> Dashboard / API Response
```

Detailed flow:

1. An ERP connector or user uploads a transaction.
2. Next.js route handler validates payload with Zod.
3. Canonical transaction rows are stored in Supabase Postgres.
4. Classification service assigns product/service tax code.
5. Tax engine resolves rule version, jurisdiction, exemptions, and rates.
6. Calculation output is persisted in `calculation_runs`.
7. The UI reads the latest calculation snapshot through RLS-protected queries.

### B. Reporting Flow

```text
Approved Transactions
  -> Reporting Period Selection
  -> Snapshot Aggregation
  -> Report Builder
  -> Tax Report + Return Draft
  -> Review / Approval
  -> Filing Submission
```

Detailed flow:

1. Reporting job selects calculation snapshots inside a filing period.
2. Report builder aggregates liability by jurisdiction and tax type.
3. Return draft is created with links to supporting evidence.
4. Reviewer approves through dashboard workflow.
5. Submission status is written back to `filing_submissions`.

### C. Compliance Monitoring Flow

```text
Scheduled Cron / Event Trigger
  -> Compliance Rule Evaluation
  -> Risk Scoring
  -> Alert Creation
  -> Dashboard Notifications / Email
```

Triggers:

- Vercel Cron for daily checks
- event-driven checks when transactions, filings, or registrations change

### D. AI Classification Flow

```text
Incoming Transaction
  -> Deterministic Rule Check
  -> Low Confidence? yes
  -> OpenAI Codex Classification Request
  -> Structured Response Validation
  -> Confidence Threshold Check
  -> Human Review or Auto-apply
  -> Audit Log + Feedback Capture
```

Production rule:

- AI should never directly overwrite final tax amounts. It suggests classification and reasoning; the tax engine still computes the amount.

---

## 6. Integration Between Next.js and Supabase

### Runtime split

- **Browser client**: only for authenticated UI reads/writes allowed by RLS
- **Server components and server actions**: primary path for secure business operations
- **Route handlers**: external API ingress, webhooks, background endpoints
- **Admin client**: server-only, used for system jobs and privileged workflows

### Supabase client setup

`lib/supabase/client.ts`

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

`lib/supabase/server.ts`

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}
```

`lib/supabase/admin.ts`

```ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
```

### Middleware responsibilities

`middleware.ts` should:

- refresh auth sessions
- redirect unauthenticated users away from protected routes
- attach organization context if needed through pathname or cookie

### Query pattern

Preferred access pattern:

1. Server Component loads current user and organization.
2. Server Action or Route Handler calls service functions in `lib/`.
3. Service functions use typed Supabase queries.
4. RLS enforces tenant boundaries.

Avoid:

- placing core tax logic in client components
- calling service-role keys from the browser
- allowing direct client writes to sensitive tables without a server boundary

### Example server action

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateTaxForTransaction } from "@/lib/tax/engine";

export async function recalculateTransaction(transactionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return calculateTaxForTransaction({
    transactionId,
    actorUserId: user.id,
  });
}
```

### RLS model

Core policy pattern:

```sql
create policy "members can read org transactions"
on public.transactions
for select
using (
  exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = transactions.organization_id
      and m.user_id = auth.uid()
  )
);
```

Recommended RLS practices:

- use helper SQL functions such as `is_org_member(org_id uuid)`
- keep policies explicit by table and action
- reserve bypass only for service-role jobs
- test every policy with integration tests

---

## 7. AI Service Architecture

### AI responsibilities

Use OpenAI Codex for:

- transaction classification suggestions
- explanation of why a classification was chosen
- compliance alert summarization
- operator copilot workflows inside the dashboard

Do not use AI as the source of truth for:

- final statutory tax amount
- filing submission without review
- direct mutation of tax rules without approval

### AI subsystem design

```text
UI / API Request
  -> AI Orchestrator
  -> Prompt Builder + Context Loader
  -> OpenAI Codex
  -> Structured Output Validation
  -> Guardrails / Confidence Scoring
  -> Human Review or Persisted Suggestion
  -> Audit Log
```

Key modules:

- `lib/ai/client.ts`: OpenAI SDK client and retry policy
- `lib/ai/prompts/*`: prompt templates with strict instructions
- `lib/ai/schemas.ts`: Zod schemas for structured outputs
- `lib/ai/guardrails.ts`: reject unsafe, low-confidence, or malformed responses
- `lib/ai/post-process.ts`: map accepted outputs into internal domain objects

### Example AI contract

```ts
export interface ClassificationPromptInput {
  transactionId: string;
  organizationId: string;
  description: string;
  lineItems: Array<{
    sku: string;
    description: string;
    amount: number;
  }>;
  customerCountry?: string;
  historicalMatches: Array<{
    taxCode: string;
    confidence: number;
  }>;
}

export interface ClassificationSuggestion {
  taxCode: string;
  confidence: number;
  rationale: string;
  requiresReview: boolean;
}
```

### AI request rules

- send only the minimum required tax context
- remove unnecessary PII before prompt construction
- require JSON output and validate with Zod
- store prompt version and model metadata for auditability
- log accepted vs rejected suggestions for offline improvement

### Confidence policy

Suggested thresholds:

- `>= 0.95`: auto-apply only if deterministic validation passes
- `0.75 - 0.94`: save as recommendation for human review
- `< 0.75`: reject and route to manual classification

### Feedback loop

1. AI suggests a tax code.
2. User accepts, edits, or rejects it.
3. Final decision is stored in `classification_predictions`.
4. Historical accepted mappings become deterministic rules.
5. AI usage cost drops over time because the rule base improves.

---

## 8. Job and Scheduling Architecture

To stay inside the requested stack, use:

- **Vercel Cron** for scheduled execution
- **Next.js route handlers** as job entrypoints
- **Supabase tables** for job state, retry state, and idempotency

Recommended scheduled jobs:

- tax rate synchronization
- deadline generation
- compliance checks
- stale integration sync retries
- report precomputation

Example job model:

```text
job_runs
- id
- job_name
- organization_id
- status
- started_at
- finished_at
- error_message
- correlation_id
```

Idempotency rules:

- every ingestion event has a unique external reference
- every report generation run keys on `organization_id + period`
- every filing submission stores external filing reference

---

## 9. API and Service Boundaries

Recommended boundary split:

- `app/api/transactions/*`: ingestion and transaction operations
- `app/api/tax/*`: synchronous calculation endpoints
- `app/api/reports/*`: report generation and exports
- `app/api/compliance/*`: monitoring and alert retrieval
- `app/api/ai/*`: AI-assisted endpoints only

Internal service rule:

- route handlers do validation and auth
- `lib/*` services do business logic
- database access stays close to the service layer

This keeps Next.js acting as both UI layer and backend-for-frontend without mixing UI concerns into tax logic.

---

## 10. Security and Production Controls

### Security

- enforce RLS on every tenant-owned table
- keep `SUPABASE_SERVICE_ROLE_KEY` server-only
- encrypt integration credentials at rest
- verify webhook signatures
- require approval workflows for filing submissions and tax rule changes

### Reliability

- use append-only rule versions for tax logic
- capture correlation IDs for every request and job
- retry transient failures with bounded retry count
- design all jobs for idempotency

### Performance

- index `organization_id`, date filters, jurisdiction fields, and status columns
- precompute reporting summaries for large tenants
- cache tax rate lookups per rule version where safe
- keep synchronous tax calculation paths under the PRD target of `< 500ms` for common cases

### Compliance and audit

- retain full calculation snapshot used for each return
- store who approved each filing and when
- record AI model, prompt version, and output for explainability

---

## 11. Suggested Initial Build Sequence

### Phase 1: Platform foundation

- Next.js App Router setup
- Supabase Auth integration
- organization and membership model
- RLS policies
- dashboard shell

### Phase 2: Tax operations MVP

- transaction ingestion
- deterministic tax calculation engine
- jurisdiction, rates, and rule versioning
- transaction list and calculation detail screens

### Phase 3: Reporting and compliance

- reporting periods
- report generation
- compliance alerts
- audit log viewer

### Phase 4: AI augmentation

- AI classification suggestions
- compliance summaries
- human review queue
- feedback-to-rule promotion workflow

### Phase 5: Integrations and scale

- ERP connectors
- cron-based sync jobs
- export APIs
- performance optimization and test hardening

---

## 12. Reference Architecture Summary

For TaxFlow Pro, the strongest production design is:

- **Next.js on Vercel** as UI, API, and orchestration layer
- **Supabase Postgres** as the system of record
- **Supabase Auth + RLS** for tenant-safe access control
- **deterministic tax engine** in server-side TypeScript services
- **OpenAI Codex** for classification and operator assistance, never as the final authority for tax computation
- **Vercel Cron + database-backed jobs** for reporting, monitoring, and sync workflows
- **append-only audit and rule versioning** for regulator-grade traceability

This gives a production-ready SaaS foundation that is secure, auditable, scalable, and aligned with the PRD for indirect tax compliance automation.
