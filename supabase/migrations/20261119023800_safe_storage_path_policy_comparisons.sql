drop policy if exists request_evidence_storage_insert on storage.objects;
create policy request_evidence_storage_insert
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'request-evidence'
  and exists (
    select 1
    from public.service_requests r
    where r.organization_id::text = (storage.foldername(name))[1]
      and r.id::text = (storage.foldername(name))[2]
      and private.can_access_request(r.organization_id, r.id)
  )
);

drop policy if exists request_evidence_storage_delete on storage.objects;
create policy request_evidence_storage_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'request-evidence'
  and exists (
    select 1
    from public.service_requests r
    where r.organization_id::text = (storage.foldername(name))[1]
      and r.id::text = (storage.foldername(name))[2]
      and private.can_access_request(r.organization_id, r.id)
      and (
        owner = auth.uid()
        or private.is_staff_member(r.organization_id)
      )
  )
);