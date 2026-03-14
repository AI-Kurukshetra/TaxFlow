drop policy if exists users_insert on public.users;
drop policy if exists users_update on public.users;

create policy users_insert
on public.users
for insert
to authenticated
with check (
  public.is_platform_admin()
  or (
    id = auth.uid()
    and coalesce(is_platform_admin, false) = false
  )
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
  or (
    id = auth.uid()
    and coalesce(is_platform_admin, false) = false
  )
);
