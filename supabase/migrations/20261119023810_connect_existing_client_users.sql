create or replace function private.add_existing_client_member(
  target_org uuid,
  target_client uuid,
  member_email text
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
    raise exception 'Only workspace owners and admins can connect client portal users';
  end if;

  clean_email := pg_catalog.lower(pg_catalog.btrim(member_email));
  if clean_email is null
     or pg_catalog.char_length(clean_email) > 254
     or pg_catalog.strpos(clean_email, '@') < 2 then
    raise exception 'Enter a valid account email address';
  end if;

  if not exists (
    select 1 from public.client_accounts c
    where c.organization_id = target_org and c.id = target_client
  ) then
    raise exception 'The selected client account does not belong to this workspace';
  end if;

  select u.id into target_user
  from auth.users u
  where pg_catalog.lower(u.email) = clean_email
    and u.email_confirmed_at is not null
  order by u.created_at desc
  limit 1;

  if target_user is null then
    raise exception 'No confirmed SiteCare Pulse account exists for this email';
  end if;

  if exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = target_user
  ) then
    raise exception 'This user is already a member of the workspace';
  end if;

  insert into public.organization_members (
    organization_id, user_id, role, client_account_id
  ) values (
    target_org, target_user, 'client', target_client
  );

  insert into public.activity_events (
    organization_id, actor_id, entity_type, entity_id, action, details
  ) values (
    target_org,
    auth.uid(),
    'client',
    target_client,
    'client.member_linked',
    pg_catalog.jsonb_build_object('role', 'client')
  );

  return target_user;
end;
$function$;

revoke all on function private.add_existing_client_member(uuid, uuid, text) from public, anon;
grant execute on function private.add_existing_client_member(uuid, uuid, text) to authenticated;

create or replace function public.add_existing_client_member(
  target_org uuid,
  target_client uuid,
  member_email text
)
returns uuid
language sql
security invoker
set search_path = ''
as $function$
  select private.add_existing_client_member(target_org, target_client, member_email);
$function$;

revoke all on function public.add_existing_client_member(uuid, uuid, text) from public, anon;
grant execute on function public.add_existing_client_member(uuid, uuid, text) to authenticated;