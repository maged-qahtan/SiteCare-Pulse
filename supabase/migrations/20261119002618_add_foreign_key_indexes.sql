create index if not exists activity_events_actor_id_idx on public.activity_events(actor_id);
create index if not exists organization_members_org_client_idx on public.organization_members(organization_id, client_account_id);
create index if not exists request_comments_user_id_idx on public.request_comments(user_id);
create index if not exists service_requests_assigned_to_idx on public.service_requests(assigned_to);
create index if not exists service_requests_created_by_idx on public.service_requests(created_by);
create index if not exists service_requests_org_site_client_idx on public.service_requests(organization_id, site_id, client_account_id);
