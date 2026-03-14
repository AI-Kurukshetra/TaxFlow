drop policy if exists organizations_update on public.organizations;                                                 
  drop policy if exists organizations_delete on public.organizations;                                                 
  drop policy if exists membership_insert on public.organization_memberships;                                         
  drop policy if exists membership_update on public.organization_memberships;                                         
  drop policy if exists membership_delete on public.organization_memberships;                                         
  drop policy if exists products_insert on public.products;                                                           
  drop policy if exists products_update on public.products;                                                           
  drop policy if exists products_delete on public.products;                                                           
  drop policy if exists customers_insert on public.customers;                                                         
  drop policy if exists customers_update on public.customers;                                                         
  drop policy if exists customers_delete on public.customers;                                                         
  drop policy if exists jurisdictions_insert on public.tax_jurisdictions;                                             
  drop policy if exists jurisdictions_update on public.tax_jurisdictions;                                             
  drop policy if exists jurisdictions_delete on public.tax_jurisdictions;
  drop policy if exists tax_rates_insert on public.tax_rates;                                                         
  drop policy if exists tax_rates_update on public.tax_rates;                                                         
  drop policy if exists tax_rates_delete on public.tax_rates;                                                         
  drop policy if exists tax_rules_insert on public.tax_rules;                                                         
  drop policy if exists tax_rules_update on public.tax_rules;                                                         
  drop policy if exists tax_rules_delete on public.tax_rules;                                                         
  drop policy if exists exemptions_insert on public.exemption_certificates;                                           
  drop policy if exists exemptions_update on public.exemption_certificates;                                           
  drop policy if exists exemptions_delete on public.exemption_certificates;                                           
  drop policy if exists transactions_insert on public.transactions;                                                   
  drop policy if exists transactions_update on public.transactions;                                                   
  drop policy if exists transactions_delete on public.transactions;                                                   
  drop policy if exists tax_returns_insert on public.tax_returns;                                                     
  drop policy if exists tax_returns_update on public.tax_returns;                                                     
  drop policy if exists tax_returns_delete on public.tax_returns;                                                     
  drop policy if exists reports_insert on public.reports;                                                             
  drop policy if exists reports_update on public.reports;                                                             
  drop policy if exists reports_delete on public.reports;                                                             
  drop policy if exists notifications_select on public.notifications;                                                 
  drop policy if exists notifications_insert on public.notifications;                                                 
  drop policy if exists notifications_update on public.notifications;                                                 
  drop policy if exists audit_logs_select on public.audit_logs;                                                       
                                                                                                                      
  drop function if exists public.has_org_role(uuid, public.membership_role[]);                                        
                                                                                                                      
  alter type public.membership_role rename to membership_role_old;                                                    
                                                                                                                      
  create type public.membership_role as enum (                                                                        
    'admin',                                                                                                          
    'tax_manager',                                                                                                    
    'accountant',                                                                                                     
    'viewer'                                                                                                          
  );                                                                                                                  
                                                                                                                      
  alter table public.organization_memberships                                                                         
    alter column role drop default;                                                                                   
                                                                                                                      
  alter table public.organization_memberships                                                                         
    alter column role type public.membership_role                                                                     
    using (                                                                                                           
      case role::text                                                                                                 
        when 'owner' then 'admin'::public.membership_role                                                             
        when 'admin' then 'admin'::public.membership_role                                                             
        when 'manager' then 'tax_manager'::public.membership_role                                                     
        when 'analyst' then 'accountant'::public.membership_role                                                      
        when 'viewer' then 'viewer'::public.membership_role                                                           
      end                                                                                                             
    );                                                                                                                
                                                                                                                      
  alter table public.organization_memberships                                                                         
    alter column role set default 'viewer'::public.membership_role;                                                   
                                                                                                                      
  drop type public.membership_role_old;                                                                               
                                                                                                                      
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
                                                                                                                      
  create policy organizations_update                                                                                  
  on public.organizations                                                                                             
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(id, array['admin']::public.membership_role[])                                              
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(id, array['admin']::public.membership_role[])                                              
  );                                                                                                                  
                                                                                                                      
  create policy organizations_delete                                                                                  
  on public.organizations                                                                                             
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(id, array['admin']::public.membership_role[])                                              
  );                                                                                                                  
                                                                                                                      
  create policy membership_insert                                                                                     
  on public.organization_memberships                                                                                  
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy membership_update                                                                                     
  on public.organization_memberships                                                                                  
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy membership_delete
  on public.organization_memberships                                                                                  
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy products_insert                                                                                       
  on public.products                                                                                                  
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy products_update                                                                                       
  on public.products                                                                                                  
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy products_delete                                                                                       
  on public.products                                                                                                  
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy customers_insert                                                                                      
  on public.customers                                                                                                 
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy customers_update                                                                                      
  on public.customers                                                                                                 
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy customers_delete                                                                                      
  on public.customers                                                                                                 
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy jurisdictions_insert                                                                                  
  on public.tax_jurisdictions                                                                                         
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy jurisdictions_update                                                                                  
  on public.tax_jurisdictions
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy jurisdictions_delete                                                                                  
  on public.tax_jurisdictions                                                                                         
  for delete                                                                                                          
  using (
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_rates_insert                                                                                      
  on public.tax_rates                                                                                                 
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_rates_update                                                                                      
  on public.tax_rates                                                                                                 
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_rates_delete                                                                                      
  on public.tax_rates                                                                                                 
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_rules_insert                                                                                      
  on public.tax_rules                                                                                                 
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_rules_update                                                                                      
  on public.tax_rules                                                                                                 
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_rules_delete                                                                                      
  on public.tax_rules                                                                                                 
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy exemptions_insert                                                                                     
  on public.exemption_certificates                                                                                    
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy exemptions_update                                                                                     
  on public.exemption_certificates                                                                                    
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )
  );                                                                                                                  
                                                                                                                      
  create policy exemptions_delete                                                                                     
  on public.exemption_certificates                                                                                    
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy transactions_insert                                                                                   
  on public.transactions                                                                                              
  for insert
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy transactions_update                                                                                   
  on public.transactions                                                                                              
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy transactions_delete                                                                                   
  on public.transactions                                                                                              
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_returns_insert                                                                                    
  on public.tax_returns                                                                                               
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_returns_update                                                                                    
  on public.tax_returns                                                                                               
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy tax_returns_delete                                                                                    
  on public.tax_returns                                                                                               
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
  );                                                                                                                  
                                                                                                                      
  create policy reports_insert                                                                                        
  on public.reports                                                                                                   
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy reports_update                                                                                        
  on public.reports                                                                                                   
  for update                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager', 'accountant']::public.membership_role[]                                           
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy reports_delete                                                                                        
  on public.reports                                                                                                   
  for delete                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])                                 
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
        or public.has_org_role(                                                                                       
          organization_id,                                                                                            
          array['admin', 'tax_manager']::public.membership_role[]                                                     
        )                                                                                                             
      )                                                                                                               
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy notifications_insert                                                                                  
  on public.notifications                                                                                             
  for insert                                                                                                          
  to authenticated                                                                                                    
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
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
        or public.has_org_role(                                                                                       
          organization_id,                                                                                            
          array['admin', 'tax_manager']::public.membership_role[]                                                     
        )                                                                                                             
      )                                                                                                               
    )                                                                                                                 
  )                                                                                                                   
  with check (                                                                                                        
    public.is_platform_admin()                                                                                        
    or (                                                                                                              
      public.is_org_member(organization_id)                                                                           
      and (                                                                                                           
        user_id = auth.uid()                                                                                          
        or public.has_org_role(                                                                                       
          organization_id,                                                                                            
          array['admin', 'tax_manager']::public.membership_role[]                                                     
        )                                                                                                             
      )                                                                                                               
    )                                                                                                                 
  );                                                                                                                  
                                                                                                                      
  create policy audit_logs_select                                                                                     
  on public.audit_logs                                                                                                
  for select                                                                                                          
  using (                                                                                                             
    public.is_platform_admin()                                                                                        
    or public.has_org_role(                                                                                           
      organization_id,                                                                                                
      array['admin', 'tax_manager']::public.membership_role[]                                                         
    )                                                                                                                 
  );   