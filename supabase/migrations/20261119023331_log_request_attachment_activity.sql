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
  related_client_id uuid;
  related_request_title text;
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
    event_details := pg_catalog.jsonb_build_object('name', new.name, 'platform', new.platform, 'client_account_id', new.client_account_id);
  elsif tg_table_name = 'service_requests' then
    event_entity_type := 'request';
    event_entity_id := new.id;
    if tg_op = 'INSERT' then
      event_action := 'request.created';
      event_details := pg_catalog.jsonb_build_object(
        'title', new.title,
        'priority', new.priority,
        'client_account_id', new.client_account_id,
        'site_id', new.site_id
      );
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
        'client_account_id', new.client_account_id,
        'site_id', new.site_id,
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
    select r.client_account_id, r.title
      into related_client_id, related_request_title
      from public.service_requests r
      where r.id = new.request_id and r.organization_id = new.organization_id;
    event_details := pg_catalog.jsonb_build_object(
      'comment_id', new.id,
      'client_account_id', related_client_id,
      'title', related_request_title
    );
  elsif tg_table_name = 'request_attachments' then
    event_actor := new.uploaded_by;
    event_entity_type := 'request';
    event_entity_id := new.request_id;
    event_action := 'request.attachment_added';
    select r.client_account_id, r.title
      into related_client_id, related_request_title
      from public.service_requests r
      where r.id = new.request_id and r.organization_id = new.organization_id;
    event_details := pg_catalog.jsonb_build_object(
      'title', related_request_title,
      'client_account_id', related_client_id,
      'file_name', new.file_name,
      'content_type', new.content_type,
      'size_bytes', new.size_bytes
    );
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

drop trigger if exists request_attachments_activity_insert on public.request_attachments;
create trigger request_attachments_activity_insert
after insert on public.request_attachments
for each row execute function private.log_activity_event();