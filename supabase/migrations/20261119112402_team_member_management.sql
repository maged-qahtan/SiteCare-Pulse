create or replace function private.add_existing_team_member(
  target_org uuid,
  member_email text,
  member_role text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  clean_email text;
  target_user uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not private.is_org_admin(target_org) then
    raise exception 'Only workspace owners and admins can add team members';
  end if;
  if member_role not in ('admin','member') then
    raise exception 'Team role must be admin or member';
  end if;

  clean_email := pg_catalog.lower(pg_catalog.btrim(member_email));
  if clean_email is null or pg_catalog.char_length(clean_email) > 254 or pg_catalog.strpos(clean_email,'@') < 2 then
    raise exception 'Enter a valid account email address';
  end if;

  select u.id into target_user
  from auth.users u
  where pg_catalog.lower(u.email)=clean_email
    and u.email_confirmed_at is not null
  order by u.created_at desc
  limit 1;

  if target_user is null then
    raise exception 'No confirmed SiteCare Pulse account exists for this email';
  end if;

  if exists (
    select 1 from public.organization_members m
    where m.organization_id=target_org and m.user_id=target_user
  ) then
    raise exception 'This user is already a workspace member';
  end if;

  insert into public.organization_members (organization_id,user_id,role)
  values (target_org,target_user,member_role);

  insert into public.activity_events (organization_id,actor_id,entity_type,entity_id,action,details)
  values (target_org,auth.uid(),'member',target_user,'team.member_linked',pg_catalog.jsonb_build_object('role',member_role));

  return target_user;
end;
$function$;

revoke all on function private.add_existing_team_member(uuid,text,text) from public,anon;
grant execute on function private.add_existing_team_member(uuid,text,text) to authenticated;

create or replace function public.add_existing_team_member(
  target_org uuid,
  member_email text,
  member_role text
)
returns uuid
language sql
security invoker
set search_path = ''
as $function$
  select private.add_existing_team_member(target_org,member_email,member_role);
$function$;

revoke all on function public.add_existing_team_member(uuid,text,text) from public,anon;
grant execute on function public.add_existing_team_member(uuid,text,text) to authenticated;

create or replace function private.list_team_members(target_org uuid)
returns table(user_id uuid,email text,role text,created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null or not private.is_staff_member(target_org) then
    raise exception 'Workspace staff access required';
  end if;
  return query
    select m.user_id,u.email::text,m.role,m.created_at
    from public.organization_members m
    join auth.users u on u.id=m.user_id
    where m.organization_id=target_org
      and m.role in ('owner','admin','member')
    order by case m.role when 'owner' then 1 when 'admin' then 2 else 3 end, m.created_at;
end;
$function$;

revoke all on function private.list_team_members(uuid) from public,anon;
grant execute on function private.list_team_members(uuid) to authenticated;

create or replace function public.list_team_members(target_org uuid)
returns table(user_id uuid,email text,role text,created_at timestamptz)
language sql
security invoker
set search_path = ''
as $function$
  select * from private.list_team_members(target_org);
$function$;

revoke all on function public.list_team_members(uuid) from public,anon;
grant execute on function public.list_team_members(uuid) to authenticated;