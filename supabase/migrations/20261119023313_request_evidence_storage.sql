insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-evidence',
  'request-evidence',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

create table public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  request_id uuid not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  content_type text not null check (content_type in ('image/png', 'image/jpeg', 'image/webp', 'application/pdf')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now(),
  constraint request_attachments_request_fk
    foreign key (organization_id, request_id)
    references public.service_requests (organization_id, id)
    on delete cascade
);

create index request_attachments_request_created_idx
  on public.request_attachments (organization_id, request_id, created_at desc);

alter table public.request_attachments enable row level security;

grant select, insert, delete on public.request_attachments to authenticated;

create policy request_attachments_select
on public.request_attachments
for select to authenticated
using (private.can_access_request(organization_id, request_id));

create policy request_attachments_insert
on public.request_attachments
for insert to authenticated
with check (
  uploaded_by = auth.uid()
  and private.can_access_request(organization_id, request_id)
);

create policy request_attachments_delete
on public.request_attachments
for delete to authenticated
using (
  private.can_access_request(organization_id, request_id)
  and (uploaded_by = auth.uid() or private.is_staff_member(organization_id))
);

create policy request_evidence_storage_select
on storage.objects
for select to authenticated
using (
  bucket_id = 'request-evidence'
  and exists (
    select 1
    from public.request_attachments a
    where a.storage_path = name
      and private.can_access_request(a.organization_id, a.request_id)
  )
);

create policy request_evidence_storage_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'request-evidence'
  and exists (
    select 1
    from public.service_requests r
    where r.organization_id = (storage.foldername(name))[1]::uuid
      and r.id = (storage.foldername(name))[2]::uuid
      and private.can_access_request(r.organization_id, r.id)
  )
);

create policy request_evidence_storage_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'request-evidence'
  and exists (
    select 1
    from public.request_attachments a
    where a.storage_path = name
      and private.can_access_request(a.organization_id, a.request_id)
      and (a.uploaded_by = auth.uid() or private.is_staff_member(a.organization_id))
  )
);