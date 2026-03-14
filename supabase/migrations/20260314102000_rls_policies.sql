create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.is_platform_admin = true
  );
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(
  target_organization_id uuid,
  allowed_roles public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.role = any (allowed_roles)
  );
$$;

alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.tax_jurisdictions enable row level security;
alter table public.tax_rates enable row level security;
alter table public.tax_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.tax_returns enable row level security;
alter table public.exemption_certificates enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy organizations_select
on public.organizations
for select
using (
  public.is_platform_admin()
  or public.is_org_member(id)
);

create policy organizations_insert
on public.organizations
for insert
to authenticated
with check (true);

create policy organizations_update
on public.organizations
for update
using (
  public.is_platform_admin()
  or public.has_org_role(id, array['owner', 'admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(id, array['owner', 'admin']::public.membership_role[])
);

create policy organizations_delete
on public.organizations
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(id, array['owner']::public.membership_role[])
);

create policy users_select
on public.users
for select
using (
  public.is_platform_admin()
  or id = auth.uid()
);

create policy users_insert
on public.users
for insert
to authenticated
with check (
  public.is_platform_admin()
  or id = auth.uid()
);

create policy users_update
on public.users
for update
using (
  public.is_platform_admin()
  or id = auth.uid()
)
with check (
  public.is_platform_admin()
  or id = auth.uid()
);

create policy membership_select
on public.organization_memberships
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy membership_insert
on public.organization_memberships
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy membership_update
on public.organization_memberships
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy membership_delete
on public.organization_memberships
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy products_select
on public.products
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy products_insert
on public.products
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy products_update
on public.products
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy products_delete
on public.products
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy customers_select
on public.customers
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy customers_insert
on public.customers
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy customers_update
on public.customers
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy customers_delete
on public.customers
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy jurisdictions_select
on public.tax_jurisdictions
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy jurisdictions_insert
on public.tax_jurisdictions
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy jurisdictions_update
on public.tax_jurisdictions
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy jurisdictions_delete
on public.tax_jurisdictions
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy tax_rates_select
on public.tax_rates
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy tax_rates_insert
on public.tax_rates
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy tax_rates_update
on public.tax_rates
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy tax_rates_delete
on public.tax_rates
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy tax_rules_select
on public.tax_rules
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy tax_rules_insert
on public.tax_rules
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy tax_rules_update
on public.tax_rules
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy tax_rules_delete
on public.tax_rules
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy exemptions_select
on public.exemption_certificates
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy exemptions_insert
on public.exemption_certificates
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy exemptions_update
on public.exemption_certificates
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy exemptions_delete
on public.exemption_certificates
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy transactions_select
on public.transactions
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy transactions_insert
on public.transactions
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy transactions_update
on public.transactions
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy transactions_delete
on public.transactions
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy tax_returns_select
on public.tax_returns
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy tax_returns_insert
on public.tax_returns
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy tax_returns_update
on public.tax_returns
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy tax_returns_delete
on public.tax_returns
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy reports_select
on public.reports
for select
using (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);

create policy reports_insert
on public.reports
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy reports_update
on public.reports
for update
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
)
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager', 'analyst']::public.membership_role[])
);

create policy reports_delete
on public.reports
for delete
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin']::public.membership_role[])
);

create policy notifications_select
on public.notifications
for select
using (
  public.is_platform_admin()
  or (
    public.is_org_member(organization_id)
    and (
      user_id is null
      or user_id = auth.uid()
      or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
    )
  )
);

create policy notifications_insert
on public.notifications
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy notifications_update
on public.notifications
for update
using (
  public.is_platform_admin()
  or (
    public.is_org_member(organization_id)
    and (
      user_id = auth.uid()
      or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
    )
  )
)
with check (
  public.is_platform_admin()
  or (
    public.is_org_member(organization_id)
    and (
      user_id = auth.uid()
      or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
    )
  )
);

create policy audit_logs_select
on public.audit_logs
for select
using (
  public.is_platform_admin()
  or public.has_org_role(organization_id, array['owner', 'admin', 'manager']::public.membership_role[])
);

create policy audit_logs_insert
on public.audit_logs
for insert
to authenticated
with check (
  public.is_platform_admin()
  or public.is_org_member(organization_id)
);
