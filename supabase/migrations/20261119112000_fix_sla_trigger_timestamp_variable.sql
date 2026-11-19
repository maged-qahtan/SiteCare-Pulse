create or replace function private.apply_request_sla()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  response_target integer;
  resolution_target integer;
  v_now timestamptz := pg_catalog.now();
begin
  select p.response_minutes, p.resolution_minutes
    into response_target, resolution_target
  from public.sla_policies p
  where p.organization_id = new.organization_id
    and p.priority = new.priority
    and p.active = true;

  if tg_op = 'INSERT' then
    if response_target is not null then
      new.response_due_at := v_now + pg_catalog.make_interval(mins => response_target);
      new.resolution_due_at := v_now + pg_catalog.make_interval(mins => resolution_target);
    else
      new.response_due_at := null;
      new.resolution_due_at := null;
    end if;
    new.first_response_at := null;
    new.resolved_at := null;
    return new;
  end if;

  if old.priority is distinct from new.priority then
    if response_target is not null and new.first_response_at is null then
      new.response_due_at := v_now + pg_catalog.make_interval(mins => response_target);
    elsif response_target is null then
      new.response_due_at := null;
    end if;
    if resolution_target is not null and new.resolved_at is null then
      new.resolution_due_at := v_now + pg_catalog.make_interval(mins => resolution_target);
    elsif resolution_target is null then
      new.resolution_due_at := null;
    end if;
  end if;

  if new.first_response_at is null
     and old.status = 'new'
     and new.status in ('triaged','in_progress','waiting_on_client','resolved','closed') then
    new.first_response_at := v_now;
  end if;

  if new.status in ('resolved','closed') and old.status not in ('resolved','closed') then
    new.resolved_at := v_now;
  elsif old.status in ('resolved','closed') and new.status not in ('resolved','closed') then
    new.resolved_at := null;
    if resolution_target is not null then
      new.resolution_due_at := v_now + pg_catalog.make_interval(mins => resolution_target);
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function private.apply_request_sla() from public, anon, authenticated;