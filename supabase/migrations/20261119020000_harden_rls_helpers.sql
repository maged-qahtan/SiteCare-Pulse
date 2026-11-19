create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_org_member(target_org uuid)
returns boolean language sql stable security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_staff_member(target_org uuid)
returns boolean language sql stable security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function private.is_org_admin(target_org uuid)
returns boolean language sql stable security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = (select auth.uid())
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function private.can_access_client(target_org uuid, target_client uuid)
returns boolean language sql stable security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = (select auth.uid())
      and (
        m.role in ('owner', 'admin', 'member')
        or (m.role = 'client' and m.client_account_id = target_client)
      )
  );
$$;

create or replace function private.can_access_request(target_org uuid, target_request uuid)
returns boolean language sql stable security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.service_requests r
    join public.organization_members m
      on m.organization_id = r.organization_id and m.user_id = (select auth.uid())
    where r.organization_id = target_org and r.id = target_request
      and (
        m.role in ('owner', 'admin', 'member')
        or (m.role = 'client' and m.client_account_id = r.client_account_id)
      )
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.is_staff_member(uuid) from public, anon;
revoke all on function private.is_org_admin(uuid) from public, anon;
revoke all on function private.can_access_client(uuid, uuid) from public, anon;
revoke all on function private.can_access_request(uuid, uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_staff_member(uuid) to authenticated;
grant execute on function private.is_org_admin(uuid) to authenticated;
grant execute on function private.can_access_client(uuid, uuid) to authenticated;
grant execute on function private.can_access_request(uuid, uuid) to authenticated;

drop policy if exists "Members can read their organizations" on public.organizations;
create policy "Members can read their organizations" on public.organizations
for select to authenticated using (private.is_org_member(id));

drop policy if exists "Owners and admins can update organizations" on public.organizations;
create policy "Owners and admins can update organizations" on public.organizations
for update to authenticated
using (private.is_org_admin(id))
with check (private.is_org_member(id));

drop policy if exists "Members can read organization membership" on public.organization_members;
create policy "Members can read organization membership" on public.organization_members
for select to authenticated
using (user_id = (select auth.uid()) or private.is_staff_member(organization_id));

drop policy if exists "Owners and admins can add non-owner members" on public.organization_members;
create policy "Owners and admins can add non-owner members" on public.organization_members
for insert to authenticated
with check (role <> 'owner' and private.is_org_admin(organization_id));

drop policy if exists "Owners and admins can update non-owner members" on public.organization_members;
create policy "Owners and admins can update non-owner members" on public.organization_members
for update to authenticated
using (role <> 'owner' and private.is_org_admin(organization_id))
with check (role <> 'owner' and private.is_org_admin(organization_id));

drop policy if exists "Owners and admins can remove non-owner members" on public.organization_members;
create policy "Owners and admins can remove non-owner members" on public.organization_members
for delete to authenticated
using (role <> 'owner' and private.is_org_admin(organization_id));

drop policy if exists "Authorized members can read client accounts" on public.client_accounts;
create policy "Authorized members can read client accounts" on public.client_accounts
for select to authenticated using (private.can_access_client(organization_id, id));

drop policy if exists "Staff can create client accounts" on public.client_accounts;
create policy "Staff can create client accounts" on public.client_accounts
for insert to authenticated with check (private.is_staff_member(organization_id));

drop policy if exists "Staff can update client accounts" on public.client_accounts;
create policy "Staff can update client accounts" on public.client_accounts
for update to authenticated
using (private.is_staff_member(organization_id))
with check (private.is_staff_member(organization_id));

drop policy if exists "Staff can delete client accounts" on public.client_accounts;
create policy "Staff can delete client accounts" on public.client_accounts
for delete to authenticated using (private.is_staff_member(organization_id));

drop policy if exists "Authorized members can read sites" on public.sites;
create policy "Authorized members can read sites" on public.sites
for select to authenticated using (private.can_access_client(organization_id, client_account_id));

drop policy if exists "Staff can create sites" on public.sites;
create policy "Staff can create sites" on public.sites
for insert to authenticated with check (private.is_staff_member(organization_id));

drop policy if exists "Staff can update sites" on public.sites;
create policy "Staff can update sites" on public.sites
for update to authenticated
using (private.is_staff_member(organization_id))
with check (private.is_staff_member(organization_id));

drop policy if exists "Staff can delete sites" on public.sites;
create policy "Staff can delete sites" on public.sites
for delete to authenticated using (private.is_staff_member(organization_id));

drop policy if exists "Authorized members can read requests" on public.service_requests;
create policy "Authorized members can read requests" on public.service_requests
for select to authenticated using (private.can_access_client(organization_id, client_account_id));

drop policy if exists "Staff or linked clients can create requests" on public.service_requests;
create policy "Staff or linked clients can create requests" on public.service_requests
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.can_access_client(organization_id, client_account_id)
  and (
    private.is_staff_member(organization_id)
    or (status = 'new' and priority = 'normal' and assigned_to is null)
  )
);

drop policy if exists "Staff can update requests" on public.service_requests;
create policy "Staff can update requests" on public.service_requests
for update to authenticated
using (private.is_staff_member(organization_id))
with check (private.is_staff_member(organization_id));

drop policy if exists "Staff can delete requests" on public.service_requests;
create policy "Staff can delete requests" on public.service_requests
for delete to authenticated using (private.is_staff_member(organization_id));

drop policy if exists "Authorized members can read request comments" on public.request_comments;
create policy "Authorized members can read request comments" on public.request_comments
for select to authenticated using (private.can_access_request(organization_id, request_id));

drop policy if exists "Authorized members can add request comments" on public.request_comments;
create policy "Authorized members can add request comments" on public.request_comments
for insert to authenticated
with check (user_id = (select auth.uid()) and private.can_access_request(organization_id, request_id));

drop policy if exists "Users can read activity for accessible clients" on public.activity_events;
create policy "Users can read activity for accessible clients" on public.activity_events
for select to authenticated
using (
  private.is_staff_member(organization_id)
  or exists (
    select 1
    from public.organization_members m
    join public.client_accounts c
      on c.organization_id = m.organization_id and c.id = m.client_account_id
    where m.organization_id = activity_events.organization_id
      and m.user_id = (select auth.uid()) and m.role = 'client'
      and (
        (entity_type = 'client' and entity_id = c.id)
        or exists (
          select 1 from public.sites s
          where s.organization_id = c.organization_id
            and s.client_account_id = c.id
            and s.id = activity_events.entity_id and entity_type = 'site'
        )
        or exists (
          select 1 from public.service_requests r
          where r.organization_id = c.organization_id
            and r.client_account_id = c.id
            and r.id = activity_events.entity_id and entity_type = 'request'
        )
      )
  )
);

drop policy if exists "Staff can append activity events" on public.activity_events;
create policy "Staff can append activity events" on public.activity_events
for insert to authenticated
with check (actor_id = (select auth.uid()) and private.is_staff_member(organization_id));

drop function if exists public.is_org_member(uuid);
drop function if exists public.is_staff_member(uuid);
drop function if exists public.can_access_client(uuid, uuid);
drop function if exists public.can_access_request(uuid, uuid);
drop function if exists public.is_org_admin(uuid);

create index if not exists activity_events_actor_id_idx on public.activity_events(actor_id);
create index if not exists organization_members_org_client_idx on public.organization_members(organization_id, client_account_id);
create index if not exists request_comments_user_id_idx on public.request_comments(user_id);
create index if not exists service_requests_assigned_to_idx on public.service_requests(assigned_to);
create index if not exists service_requests_created_by_idx on public.service_requests(created_by);
create index if not exists service_requests_org_site_client_idx on public.service_requests(organization_id, site_id, client_account_id);
