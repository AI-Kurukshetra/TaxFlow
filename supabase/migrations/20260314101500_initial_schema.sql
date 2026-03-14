create extension if not exists pgcrypto;

create type public.membership_role as enum (
  'owner',
  'admin',
  'manager',
  'analyst',
  'viewer'
);

create type public.transaction_status as enum (
  'draft',
  'pending',
  'calculated',
  'filed',
  'voided'
);

create type public.tax_rule_type as enum (
  'sales_tax',
  'vat',
  'gst',
  'withholding',
  'custom'
);

create type public.tax_return_status as enum (
  'draft',
  'under_review',
  'approved',
  'submitted',
  'accepted',
  'rejected'
);

create type public.report_type as enum (
  'liability_summary',
  'jurisdiction_breakdown',
  'filing_ready',
  'audit_support',
  'custom'
);

create type public.notification_channel as enum (
  'in_app',
  'email',
  'webhook'
);

create type public.notification_status as enum (
  'queued',
  'sent',
  'failed',
  'read'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tax_registration_number text,
  base_currency char(3) not null default 'USD',
  timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  is_platform_admin boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.membership_role not null default 'viewer',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id)
);

create table public.tax_jurisdictions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  country_code char(2) not null,
  region_code text,
  city text,
  name text not null,
  jurisdiction_type text not null,
  filing_frequency text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  product_category text,
  default_tax_code text,
  taxability_profile jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, sku)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_customer_id text,
  name text not null,
  email text,
  tax_identifier text,
  customer_type text,
  country_code char(2),
  region_code text,
  city text,
  postal_code text,
  address_line1 text,
  address_line2 text,
  exemption_status boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, external_customer_id)
);

create table public.exemption_certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid,
  certificate_number text not null,
  jurisdiction_id uuid,
  status text not null default 'active',
  issued_on date,
  expires_on date,
  document_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  unique (organization_id, certificate_number),
  check (expires_on is null or issued_on is null or expires_on >= issued_on),
  constraint exemption_certificates_customer_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete cascade,
  constraint exemption_certificates_jurisdiction_fk
    foreign key (organization_id, jurisdiction_id)
    references public.tax_jurisdictions (organization_id, id)
    on delete set null
);

create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  jurisdiction_id uuid not null,
  tax_type public.tax_rule_type not null,
  rate numeric(7,4) not null,
  effective_from date not null,
  effective_to date,
  source text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  check (rate >= 0),
  check (effective_to is null or effective_to >= effective_from),
  constraint tax_rates_jurisdiction_fk
    foreign key (organization_id, jurisdiction_id)
    references public.tax_jurisdictions (organization_id, id)
    on delete cascade
);

create table public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  jurisdiction_id uuid,
  name text not null,
  rule_type public.tax_rule_type not null,
  condition_expression jsonb not null,
  result_expression jsonb not null,
  priority integer not null default 100,
  active boolean not null default true,
  valid_from date not null,
  valid_to date,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, id),
  check (valid_to is null or valid_to >= valid_from),
  constraint tax_rules_jurisdiction_fk
    foreign key (organization_id, jurisdiction_id)
    references public.tax_jurisdictions (organization_id, id)
    on delete set null
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  transaction_number text not null,
  external_transaction_id text,
  customer_id uuid,
  product_id uuid,
  jurisdiction_id uuid,
  exemption_certificate_id uuid,
  transaction_date date not null,
  status public.transaction_status not null default 'draft',
  currency char(3) not null,
  quantity numeric(18,4) not null default 1,
  subtotal_amount numeric(18,2) not null,
  taxable_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) generated always as (subtotal_amount + tax_amount) stored,
  classification_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, transaction_number),
  unique (organization_id, external_transaction_id),
  check (subtotal_amount >= 0),
  check (taxable_amount >= 0),
  check (tax_amount >= 0),
  check (quantity > 0),
  constraint transactions_customer_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete set null,
  constraint transactions_product_fk
    foreign key (organization_id, product_id)
    references public.products (organization_id, id)
    on delete set null,
  constraint transactions_jurisdiction_fk
    foreign key (organization_id, jurisdiction_id)
    references public.tax_jurisdictions (organization_id, id)
    on delete set null,
  constraint transactions_exemption_certificate_fk
    foreign key (organization_id, exemption_certificate_id)
    references public.exemption_certificates (organization_id, id)
    on delete set null
);

create table public.tax_returns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  jurisdiction_id uuid not null,
  filing_period_start date not null,
  filing_period_end date not null,
  status public.tax_return_status not null default 'draft',
  due_date date,
  filed_at timestamptz,
  currency char(3) not null,
  gross_sales_amount numeric(18,2) not null default 0,
  taxable_sales_amount numeric(18,2) not null default 0,
  tax_due_amount numeric(18,2) not null default 0,
  document_url text,
  submitted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (filing_period_end >= filing_period_start),
  constraint tax_returns_jurisdiction_fk
    foreign key (organization_id, jurisdiction_id)
    references public.tax_jurisdictions (organization_id, id)
    on delete restrict
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_type public.report_type not null,
  name text not null,
  report_period_start date,
  report_period_end date,
  generated_by uuid references public.users(id) on delete set null,
  storage_path text,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    report_period_start is null
    or report_period_end is null
    or report_period_end >= report_period_start
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  channel public.notification_channel not null,
  status public.notification_status not null default 'queued',
  subject text not null,
  message text not null,
  related_entity_type text,
  related_entity_id uuid,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index idx_tax_jurisdictions_natural_key
  on public.tax_jurisdictions (
    organization_id,
    country_code,
    coalesce(region_code, ''),
    coalesce(city, ''),
    name
  );

create index idx_memberships_user_id on public.organization_memberships (user_id);
create unique index idx_memberships_default_org on public.organization_memberships (user_id) where is_default;

create index idx_products_org_active on public.products (organization_id, active);
create index idx_products_org_tax_code on public.products (organization_id, default_tax_code);

create index idx_customers_org_name on public.customers (organization_id, name);
create index idx_customers_org_external_id on public.customers (organization_id, external_customer_id) where external_customer_id is not null;
create index idx_customers_org_location on public.customers (organization_id, country_code, region_code);

create index idx_jurisdictions_org_country_region on public.tax_jurisdictions (organization_id, country_code, region_code);
create index idx_jurisdictions_org_active on public.tax_jurisdictions (organization_id, active);

create index idx_exemption_certificates_org_customer on public.exemption_certificates (organization_id, customer_id);
create index idx_exemption_certificates_org_expires on public.exemption_certificates (organization_id, expires_on);

create index idx_tax_rates_org_jurisdiction_effective on public.tax_rates (organization_id, jurisdiction_id, effective_from desc);
create index idx_tax_rates_org_type_effective on public.tax_rates (organization_id, tax_type, effective_from desc);

create index idx_tax_rules_org_jurisdiction_active on public.tax_rules (organization_id, jurisdiction_id, active);
create index idx_tax_rules_org_type_priority on public.tax_rules (organization_id, rule_type, priority);

create index idx_transactions_org_date on public.transactions (organization_id, transaction_date desc);
create index idx_transactions_org_status on public.transactions (organization_id, status);
create index idx_transactions_org_customer on public.transactions (organization_id, customer_id);
create index idx_transactions_org_product on public.transactions (organization_id, product_id);
create index idx_transactions_org_jurisdiction on public.transactions (organization_id, jurisdiction_id);
create index idx_transactions_org_external_id on public.transactions (organization_id, external_transaction_id) where external_transaction_id is not null;
create index idx_transactions_metadata_gin on public.transactions using gin (metadata);

create index idx_tax_returns_org_period on public.tax_returns (organization_id, filing_period_start, filing_period_end);
create index idx_tax_returns_org_status on public.tax_returns (organization_id, status);
create index idx_tax_returns_org_due_date on public.tax_returns (organization_id, due_date);

create index idx_reports_org_type_created on public.reports (organization_id, report_type, created_at desc);
create index idx_notifications_org_user_status on public.notifications (organization_id, user_id, status);
create index idx_notifications_org_created on public.notifications (organization_id, created_at desc);
create index idx_audit_logs_org_entity on public.audit_logs (organization_id, entity_type, entity_id);
create index idx_audit_logs_org_occurred on public.audit_logs (organization_id, occurred_at desc);
create index idx_audit_logs_actor on public.audit_logs (actor_user_id, occurred_at desc);

create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_memberships_updated_at
before update on public.organization_memberships
for each row
execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger set_jurisdictions_updated_at
before update on public.tax_jurisdictions
for each row
execute function public.set_updated_at();

create trigger set_exemption_certificates_updated_at
before update on public.exemption_certificates
for each row
execute function public.set_updated_at();

create trigger set_tax_rates_updated_at
before update on public.tax_rates
for each row
execute function public.set_updated_at();

create trigger set_tax_rules_updated_at
before update on public.tax_rules
for each row
execute function public.set_updated_at();

create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

create trigger set_tax_returns_updated_at
before update on public.tax_returns
for each row
execute function public.set_updated_at();

create trigger set_reports_updated_at
before update on public.reports
for each row
execute function public.set_updated_at();

create trigger set_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_updated_at();
