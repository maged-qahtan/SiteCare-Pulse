create table public.sla_policies (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  priority text not null check (priority in ('low','normal','high','urgent')),
  response_minutes integer not null check (response_minutes between 1 and 525600),
  resolution_minutes integer not null check (resolution_minutes between 1 and 525600),
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (organization_id, priority)
);

alter table public.sla_policies enable row level security;
grant select, insert, update, delete on public.sla_policies to authenticated;

create policy sla_policies_staff_read
on public.sla_policies for select to authenticated
using (private.is_staff_member(organization_id));

create policy sla_policies_admin_insert
on public.sla_policies for insert to authenticated
with check (private.is_org_admin(organization_id) and updated_by = auth.uid());

create policy sla_policies_admin_update
on public.sla_policies for update to authenticated
using (private.is_org_admin(organization_id))
with check (private.is_org_admin(organization_id) and updated_by = auth.uid());

create policy sla_policies_admin_delete
on public.sla_policies for delete to authenticated
using (private.is_org_admin(organization_id));

alter table public.service_requests
  add column response_due_at timestamptz,
  add column resolution_due_at timestamptz,
  add column first_response_at timestamptz,
  add column resolved_at timestamptz;

create index service_requests_response_due_idx
  on public.service_requests (organization_id, response_due_at)
  where first_response_at is null and status not in ('resolved','closed');

create index service_requests_resolution_due_idx
  on public.service_requests (organization_id, resolution_due_at)
  where resolved_at is null and status not in ('resolved','closed');

insert into public.sla_policies (organization_id, priority, response_minutes, resolution_minutes)
select o.id, p.priority, p.response_minutes, p.resolution_minutes
from public.organizations o
cross join (values
  ('urgent', 60, 240),
  ('high', 240, 1440),
  ('normal', 480, 4320),
  ('low', 1440, 10080)
) as p(priority, response_minutes, resolution_minutes)
on conflict (organization_id, priority) do nothing;

create or replace function private.apply_request_sla()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  response_target integer;
  resolution_target integer;
  current_time timestamptz := pg_catalog.now();
begin
  select p.response_minutes, p.resolution_minutes
    into response_target, resolution_target
  from public.sla_policies p
  where p.organization_id = new.organization_id
    and p.priority = new.priority
    and p.active = true;

  if tg_op = 'INSERT' then
    if response_target is not null then
      new.response_due_at := current_time + pg_catalog.make_interval(mins => response_target);
      new.resolution_due_at := current_time + pg_catalog.make_interval(mins => resolution_target);
    end if;
    new.first_response_at := null;
    new.resolved_at := null;
    return new;
  end if;

  if old.priority is distinct from new.priority then
    if response_target is not null and new.first_response_at is null then
      new.response_due_at := current_time + pg_catalog.make_interval(mins => response_target);
    end if;
    if resolution_target is not null and new.resolved_at is null then
      new.resolution_due_at := current_time + pg_catalog.make_interval(mins => resolution_target);
    end if;
  end if;

  if new.first_response_at is null
     and old.status = 'new'
     and new.status in ('triaged','in_progress','waiting_on_client','resolved','closed') then
    new.first_response_at := current_time;
  end if;

  if new.status in ('resolved','closed') and old.status not in ('resolved','closed') then
    new.resolved_at := current_time;
  elsif old.status in ('resolved','closed') and new.status not in ('resolved','closed') then
    new.resolved_at := null;
    if resolution_target is not null then
      new.resolution_due_at := current_time + pg_catalog.make_interval(mins => resolution_target);
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function private.apply_request_sla() from public, anon, authenticated;

create trigger service_requests_apply_sla
before insert or update of status, priority on public.service_requests
for each row execute function private.apply_request_sla();