-- Restrict team membership administration to owners and admins.
create or replace function public.is_org_admin(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_org_admin(uuid) from public;
grant execute on function public.is_org_admin(uuid) to authenticated;

drop policy if exists "Owners and admins can add non-owner members" on public.organization_members;
create policy "Owners and admins can add non-owner members"
on public.organization_members for insert
to authenticated
with check (
  role <> 'owner'
  and public.is_org_admin(organization_id)
);

drop policy if exists "Owners and admins can update non-owner members" on public.organization_members;
create policy "Owners and admins can update non-owner members"
on public.organization_members for update
to authenticated
using (
  role <> 'owner'
  and public.is_org_admin(organization_id)
)
with check (
  role <> 'owner'
  and public.is_org_admin(organization_id)
);

drop policy if exists "Owners and admins can remove non-owner members" on public.organization_members;
create policy "Owners and admins can remove non-owner members"
on public.organization_members for delete
to authenticated
using (
  role <> 'owner'
  and public.is_org_admin(organization_id)
);
