# TaxFlow Pro Supabase Schema

## Files

- `supabase/migrations/20260314101500_initial_schema.sql`
- `supabase/migrations/20260314102000_rls_policies.sql`

## 1. SQL schema overview

This schema is designed for a multi-tenant SaaS indirect tax platform where every tenant-owned row carries `organization_id`.

### Core tenancy model

- `organizations`: tenant root record
- `users`: application profile table linked to `auth.users`
- `organization_memberships`: maps users to organizations and roles

### Operational entities

- `products`
- `customers`
- `transactions`
- `tax_jurisdictions`
- `tax_rates`
- `tax_rules`
- `tax_returns`
- `exemption_certificates`
- `reports`
- `notifications`
- `audit_logs`

### Isolation model

Tenant isolation is implemented in three layers:

1. Every tenant-owned table includes `organization_id`.
2. Cross-tenant leaks are reduced with org-scoped composite foreign keys for core business references.
3. Row Level Security checks organization membership before reads or writes.

## 2. Migration order

Run the migrations in this order:

1. `20260314101500_initial_schema.sql`
2. `20260314102000_rls_policies.sql`

If you are using the Supabase CLI:

```bash
supabase db reset
```

Or to generate a migration after local changes:

```bash
supabase migration new add_taxflow_changes
```

## 3. RLS policy summary

### Access model

- `owner` and `admin`: full tenant administration
- `manager`: operational write access for tax setup and filing workflows
- `analyst`: write access for transactions, products, customers, reports, and certificates
- `viewer`: read-only tenant access
- platform admins in `public.users.is_platform_admin` bypass tenant restrictions through policy checks

### Helper functions

The RLS migration defines:

- `public.is_platform_admin()`
- `public.is_org_member(target_organization_id uuid)`
- `public.has_org_role(target_organization_id uuid, allowed_roles public.membership_role[])`

These keep policies short and consistent across tables.

## 4. Example queries

### A. Transactions with customer and jurisdiction for one organization

```sql
select
  t.id,
  t.transaction_number,
  t.transaction_date,
  t.status,
  t.subtotal_amount,
  t.tax_amount,
  c.name as customer_name,
  j.name as jurisdiction_name
from public.transactions t
left join public.customers c
  on c.id = t.customer_id
 and c.organization_id = t.organization_id
left join public.tax_jurisdictions j
  on j.id = t.jurisdiction_id
 and j.organization_id = t.organization_id
where t.organization_id = :organization_id
order by t.transaction_date desc
limit 100;
```

### B. Active tax rate lookup for a transaction date

```sql
select tr.*
from public.tax_rates tr
where tr.organization_id = :organization_id
  and tr.jurisdiction_id = :jurisdiction_id
  and tr.tax_type = 'sales_tax'
  and tr.effective_from <= :transaction_date
  and (tr.effective_to is null or tr.effective_to >= :transaction_date)
order by tr.effective_from desc
limit 1;
```

### C. Tax liability by jurisdiction for a filing period

```sql
select
  t.jurisdiction_id,
  j.name as jurisdiction_name,
  sum(t.taxable_amount) as taxable_sales,
  sum(t.tax_amount) as tax_liability
from public.transactions t
join public.tax_jurisdictions j
  on j.id = t.jurisdiction_id
 and j.organization_id = t.organization_id
where t.organization_id = :organization_id
  and t.transaction_date between :period_start and :period_end
  and t.status in ('calculated', 'filed')
group by t.jurisdiction_id, j.name
order by tax_liability desc;
```

### D. Customers with active exemption certificates

```sql
select
  c.id,
  c.name,
  ec.certificate_number,
  ec.issued_on,
  ec.expires_on,
  j.name as jurisdiction_name
from public.exemption_certificates ec
join public.customers c
  on c.id = ec.customer_id
 and c.organization_id = ec.organization_id
left join public.tax_jurisdictions j
  on j.id = ec.jurisdiction_id
 and j.organization_id = ec.organization_id
where ec.organization_id = :organization_id
  and ec.status = 'active'
  and (ec.expires_on is null or ec.expires_on >= current_date)
order by ec.expires_on nulls last;
```

### E. Draft and overdue tax returns

```sql
select
  tr.id,
  tr.filing_period_start,
  tr.filing_period_end,
  tr.status,
  tr.due_date,
  tr.tax_due_amount,
  j.name as jurisdiction_name
from public.tax_returns tr
join public.tax_jurisdictions j
  on j.id = tr.jurisdiction_id
 and j.organization_id = tr.organization_id
where tr.organization_id = :organization_id
  and tr.status in ('draft', 'under_review', 'approved')
  and tr.due_date < current_date
order by tr.due_date asc;
```

### F. Audit trail for a single transaction

```sql
select
  al.occurred_at,
  al.action,
  al.entity_type,
  al.entity_id,
  u.email as actor_email,
  al.before_state,
  al.after_state
from public.audit_logs al
left join public.users u
  on u.id = al.actor_user_id
where al.organization_id = :organization_id
  and al.entity_type = 'transaction'
  and al.entity_id = :transaction_id
order by al.occurred_at desc;
```

## 5. Notes

- `public.users` is an application-facing profile table; authentication remains in `auth.users`.
- The schema uses composite foreign keys in several places so referenced records must belong to the same organization.
- `transactions` is modeled as a single-row transaction table for simplicity. If line-item tax becomes a near-term requirement, add `transaction_lines` and move product references there.
- The RLS migration assumes writes happen from authenticated users or server-side service-role flows.
