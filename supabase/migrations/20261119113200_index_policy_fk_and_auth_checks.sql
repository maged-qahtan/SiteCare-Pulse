create index if not exists request_attachments_uploaded_by_idx
  on public.request_attachments (uploaded_by);

create index if not exists sla_policies_updated_by_idx
  on public.sla_policies (updated_by);

drop policy if exists request_attachments_insert on public.request_attachments;
create policy request_attachments_insert
on public.request_attachments
for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and private.can_access_request(organization_id, request_id)
);

drop policy if exists request_attachments_delete on public.request_attachments;
create policy request_attachments_delete
on public.request_attachments
for delete to authenticated
using (
  private.can_access_request(organization_id, request_id)
  and (uploaded_by = (select auth.uid()) or private.is_staff_member(organization_id))
);

drop policy if exists sla_policies_admin_insert on public.sla_policies;
create policy sla_policies_admin_insert
on public.sla_policies
for insert to authenticated
with check (private.is_org_admin(organization_id) and updated_by = (select auth.uid()));

drop policy if exists sla_policies_admin_update on public.sla_policies;
create policy sla_policies_admin_update
on public.sla_policies
for update to authenticated
using (private.is_org_admin(organization_id))
with check (private.is_org_admin(organization_id) and updated_by = (select auth.uid()));