drop policy if exists request_evidence_storage_delete on storage.objects;

create policy request_evidence_storage_delete
on storage.objects
for delete to authenticated
using (
  bucket_id = 'request-evidence'
  and exists (
    select 1
    from public.service_requests r
    where r.organization_id = (storage.foldername(name))[1]::uuid
      and r.id = (storage.foldername(name))[2]::uuid
      and private.can_access_request(r.organization_id, r.id)
      and (owner = auth.uid() or private.is_staff_member(r.organization_id))
  )
);