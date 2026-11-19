create or replace function private.log_activity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  event_actor uuid;
  event_action text;
  event_entity_type text;
  event_entity_id uuid;
  event_details jsonb := '{}'::jsonb;
begin
  event_actor := auth.uid();

  if tg_table_name = 'client_accounts' then
    event_entity_type := 'client';
    event_entity_id := new.id;
    event_action := 'client.created';
    event_details := pg_catalog.jsonb_build_object('name', new.name);
  elsif tg_table_name = 'sites' then
    event_entity_type := 'site';
    event_entity_id := new.id;
    event_action := 'site.created';
    event_details := pg_catalog.jsonb_build_object('name', new.name, 'platform', new.platform);
  elsif tg_table_name = 'service_requests' then
    event_entity_type := 'request';
    event_entity_id := new.id;
    if tg_op = 'INSERT' then
      event_action := 'request.created';
      event_details := pg_catalog.jsonb_build_object('title', new.title, 'priority', new.priority);
    else
      if old.status is distinct from new.status then
        event_action := 'request.status_changed';
      elsif old.priority is distinct from new.priority then
        event_action := 'request.priority_changed';
      else
        event_action := 'request.updated';
      end if;
      event_details := pg_catalog.jsonb_build_object(
        'title', new.title,
        'old_status', old.status,
        'new_status', new.status,
        'old_priority', old.priority,
        'new_priority', new.priority,
        'due_at', new.due_at,
        'assigned_to', new.assigned_to
      );
    end if;
  elsif tg_table_name = 'request_comments' then
    event_actor := new.user_id;
    event_entity_type := 'request';
    event_entity_id := new.request_id;
    event_action := 'request.comment_added';
    event_details := pg_catalog.jsonb_build_object('comment_id', new.id);
  else
    return new;
  end if;

  insert into public.activity_events (
    organization_id, actor_id, entity_type, entity_id, action, details
  ) values (
    new.organization_id, event_actor, event_entity_type, event_entity_id, event_action, event_details
  );

  return new;
end;
$function$;

revoke all on function private.log_activity_event() from public;
revoke all on function private.log_activity_event() from anon, authenticated;

drop trigger if exists client_accounts_activity_insert on public.client_accounts;
create trigger client_accounts_activity_insert
after insert on public.client_accounts
for each row execute function private.log_activity_event();

drop trigger if exists sites_activity_insert on public.sites;
create trigger sites_activity_insert
after insert on public.sites
for each row execute function private.log_activity_event();

drop trigger if exists service_requests_activity_insert on public.service_requests;
create trigger service_requests_activity_insert
after insert on public.service_requests
for each row execute function private.log_activity_event();

drop trigger if exists service_requests_activity_update on public.service_requests;
create trigger service_requests_activity_update
after update of status, priority, due_at, assigned_to, title, description on public.service_requests
for each row
when (
  old.status is distinct from new.status
  or old.priority is distinct from new.priority
  or old.due_at is distinct from new.due_at
  or old.assigned_to is distinct from new.assigned_to
  or old.title is distinct from new.title
  or old.description is distinct from new.description
)
execute function private.log_activity_event();

drop trigger if exists request_comments_activity_insert on public.request_comments;
create trigger request_comments_activity_insert
after insert on public.request_comments
for each row execute function private.log_activity_event();