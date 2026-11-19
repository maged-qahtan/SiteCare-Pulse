-- Restrict direct membership writes so only workspace owners can grant admin.
-- This closes the direct-table RLS path in addition to the guarded team RPC.

create or replace function private.is_org_owner(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  );
$function$;

revoke all on function private.is_org_owner(uuid) from public, anon;
grant execute on function private.is_org_owner(uuid) to authenticated;

drop policy if exists "Owners and admins can add non-owner members"
  on public.organization_members;
create policy "Owners and admins can add non-owner members"
  on public.organization_members
  for insert
  to authenticated
  with check (
    role <> 'owner'
    and (role <> 'admin' or private.is_org_owner(organization_id))
    and private.is_org_admin(organization_id)
  );

drop policy if exists "Owners and admins can update non-owner members"
  on public.organization_members;
create policy "Owners and admins can update non-owner members"
  on public.organization_members
  for update
  to authenticated
  using (
    role <> 'owner'
    and private.is_org_admin(organization_id)
  )
  with check (
    role <> 'owner'
    and private.is_org_admin(organization_id)
    and (role <> 'admin' or private.is_org_owner(organization_id))
  );
