create or replace function private.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  new_org_id uuid;
  clean_name text;
  clean_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  clean_name := pg_catalog.btrim(org_name);
  clean_slug := pg_catalog.lower(pg_catalog.btrim(org_slug));

  if clean_name is null or pg_catalog.char_length(clean_name) < 2 or pg_catalog.char_length(clean_name) > 80 then
    raise exception 'Workspace name must be between 2 and 80 characters';
  end if;

  if clean_slug is null
     or pg_catalog.char_length(clean_slug) < 3
     or pg_catalog.char_length(clean_slug) > 63
     or clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Workspace URL must use 3-63 lowercase letters, numbers, and single hyphens';
  end if;

  insert into public.organizations (name, slug)
  values (clean_name, clean_slug)
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  insert into public.sla_policies (organization_id, priority, response_minutes, resolution_minutes)
  values
    (new_org_id, 'urgent', 60, 240),
    (new_org_id, 'high', 240, 1440),
    (new_org_id, 'normal', 480, 4320),
    (new_org_id, 'low', 1440, 10080);

  return new_org_id;
end;
$function$;

revoke all on function private.create_organization(text, text) from public, anon;
grant execute on function private.create_organization(text, text) to authenticated;