alter function private.can_access_client(uuid, uuid) set search_path = '';
alter function private.can_access_request(uuid, uuid) set search_path = '';
alter function private.is_org_admin(uuid) set search_path = '';
alter function private.is_org_member(uuid) set search_path = '';
alter function private.is_staff_member(uuid) set search_path = '';