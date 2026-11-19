-- SiteCare Pulse: initial multi-tenant data model.
-- Apply with Supabase CLI after creating a Supabase project.
-- No live database is configured by this migration alone.

create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$'),
  created_at timestamptz not null default now()
);

create table public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 160),
  contact_email text,
  website_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'client')),
  client_account_id uuid,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id),
  foreign key (organization_id, client_account_id)
    references public.client_accounts(organization_id, id) on delete cascade,
  check (
    (role = 'client' and client_account_id is not null)
    or (role <> 'client' and client_account_id is null)
  )
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_account_id uuid not null,
  name text not null check (char_length(trim(name)) between 2 and 160),
  url text not null,
  platform text not null default 'other'
    check (platform in ('wordpress', 'shopify', 'webflow', 'custom', 'other')),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  unique (organization_id, id, client_account_id),
  foreign key (organization_id, client_account_id)
    references public.client_accounts(organization_id, id) on delete cascade
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  client_account_id uuid not null,
  site_id uuid,
  title text not null check (char_length(trim(title)) between 3 and 200),
  description text not null default '',
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'new'
    check (status in ('new', 'triaged', 'in_progress', 'waiting_on_client', 'resolved', 'closed')),
  created_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, client_account_id)
    references public.client_accounts(organization_id, id) on delete cascade,
  foreign key (organization_id, site_id, client_account_id)
    references public.sites(organization_id, id, client_account_id)
);

create table public.request_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  request_id uuid not null,
  user_id uuid not null references auth.users(id),
  body text not null check (char_length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  foreign key (organization_id, request_id)
    references public.service_requests(organization_id, id) on delete cascade
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null check (entity_type in ('client', 'site', 'request', 'comment', 'member')),
  entity_id uuid not null,
  action text not null check (char_length(trim(action)) between 1 and 100),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members(user_id);
create index client_accounts_org_idx on public.client_accounts(organization_id);
create index sites_client_idx on public.sites(organization_id, client_account_id);
create index service_requests_queue_idx on public.service_requests(organization_id, status, priority, created_at desc);
create index service_requests_client_idx on public.service_requests(organization_id, client_account_id);
create index request_comments_request_idx on public.request_comments(organization_id, request_id, created_at);
create index activity_events_org_idx on public.activity_events(organization_id, created_at desc);

-- SECURITY DEFINER helpers avoid recursive RLS checks on organization_members.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_staff_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function public.can_access_client(target_org uuid, target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and (
        m.role in ('owner', 'admin', 'member')
        or (m.role = 'client' and m.client_account_id = target_client)
      )
  );
$$;

create or replace function public.can_access_request(target_org uuid, target_request uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.service_requests r
    join public.organization_members m
      on m.organization_id = r.organization_id and m.user_id = auth.uid()
    where r.organization_id = target_org
      and r.id = target_request
      and (
        m.role in ('owner', 'admin', 'member')
        or (m.role = 'client' and m.client_account_id = r.client_account_id)
      )
  );
$$;

-- Create the agency and its first owner atomically after Supabase Auth signup.
create or replace function public.create_organization(org_name text, org_slug text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.organizations (name, slug)
  values (trim(org_name), lower(trim(org_slug)))
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;

revoke all on function public.create_organization(text, text) from public;
grant execute on function public.create_organization(text, text) to authenticated;

alter table public.organizations enable row level security;
alter table public.client_accounts enable row level security;
alter table public.organization_members enable row level security;
alter table public.sites enable row level security;
alter table public.service_requests enable row level security;
alter table public.request_comments enable row level security;
alter table public.activity_events enable row level security;

create policy "Members can read their organizations"
on public.organizations for select
to authenticated
using (public.is_org_member(id));

create policy "Owners and admins can update organizations"
on public.organizations for update
to authenticated
using (exists (
  select 1 from public.organization_members m
  where m.organization_id = id and m.user_id = auth.uid()
    and m.role in ('owner', 'admin')
))
with check (public.is_org_member(id));

create policy "Members can read organization membership"
on public.organization_members for select
to authenticated
using (user_id = auth.uid() or public.is_staff_member(organization_id));

create policy "Owners and admins can add non-owner members"
on public.organization_members for insert
to authenticated
with check (
  role <> 'owner'
  and public.is_staff_member(organization_id)
);

create policy "Owners and admins can update non-owner members"
on public.organization_members for update
to authenticated
using (role <> 'owner' and public.is_staff_member(organization_id))
with check (role <> 'owner' and public.is_staff_member(organization_id));

create policy "Owners and admins can remove non-owner members"
on public.organization_members for delete
to authenticated
using (role <> 'owner' and public.is_staff_member(organization_id));

create policy "Authorized members can read client accounts"
on public.client_accounts for select
to authenticated
using (public.can_access_client(organization_id, id));

create policy "Staff can create client accounts"
on public.client_accounts for insert
to authenticated
with check (public.is_staff_member(organization_id));

create policy "Staff can update client accounts"
on public.client_accounts for update
to authenticated
using (public.is_staff_member(organization_id))
with check (public.is_staff_member(organization_id));

create policy "Staff can delete client accounts"
on public.client_accounts for delete
to authenticated
using (public.is_staff_member(organization_id));

create policy "Authorized members can read sites"
on public.sites for select
to authenticated
using (public.can_access_client(organization_id, client_account_id));

create policy "Staff can create sites"
on public.sites for insert
to authenticated
with check (public.is_staff_member(organization_id));

create policy "Staff can update sites"
on public.sites for update
to authenticated
using (public.is_staff_member(organization_id))
with check (public.is_staff_member(organization_id));

create policy "Staff can delete sites"
on public.sites for delete
to authenticated
using (public.is_staff_member(organization_id));

create policy "Authorized members can read requests"
on public.service_requests for select
to authenticated
using (public.can_access_client(organization_id, client_account_id));

create policy "Staff or linked clients can create requests"
on public.service_requests for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_access_client(organization_id, client_account_id)
  and (
    public.is_staff_member(organization_id)
    or (status = 'new' and priority = 'normal' and assigned_to is null)
  )
);

create policy "Staff can update requests"
on public.service_requests for update
to authenticated
using (public.is_staff_member(organization_id))
with check (public.is_staff_member(organization_id));

create policy "Staff can delete requests"
on public.service_requests for delete
to authenticated
using (public.is_staff_member(organization_id));

create policy "Authorized members can read request comments"
on public.request_comments for select
to authenticated
using (public.can_access_request(organization_id, request_id));

create policy "Authorized members can add request comments"
on public.request_comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.can_access_request(organization_id, request_id)
);

create policy "Users can read activity for accessible clients"
on public.activity_events for select
to authenticated
using (
  public.is_staff_member(organization_id)
  or exists (
    select 1
    from public.organization_members m
    join public.client_accounts c
      on c.organization_id = m.organization_id
     and c.id = m.client_account_id
    where m.organization_id = activity_events.organization_id
      and m.user_id = auth.uid()
      and m.role = 'client'
      and (
        (entity_type = 'client' and entity_id = c.id)
        or exists (
          select 1 from public.sites s
          where s.organization_id = c.organization_id
            and s.client_account_id = c.id
            and s.id = activity_events.entity_id
            and entity_type = 'site'
        )
        or exists (
          select 1 from public.service_requests r
          where r.organization_id = c.organization_id
            and r.client_account_id = c.id
            and r.id = activity_events.entity_id
            and entity_type = 'request'
        )
      )
  )
);

create policy "Staff can append activity events"
on public.activity_events for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.is_staff_member(organization_id)
);
