"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, CalendarClock, CircleAlert, Clock3, Download, FileText, LoaderCircle,
  MessageSquare, Paperclip, Plus, RefreshCw, Send, Wrench
} from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type Role = "owner" | "admin" | "member" | "client";
type Priority = "low" | "normal" | "high" | "urgent";
type RequestStatus = "new" | "triaged" | "in_progress" | "waiting_on_client" | "resolved" | "closed";
type ClientAccount = { id: string; name: string; status: string };
type Site = { id: string; client_account_id: string; name: string; url: string; platform: string };
type ServiceRequest = {
  id: string;
  client_account_id: string;
  site_id: string | null;
  title: string;
  description: string;
  priority: Priority;
  status: RequestStatus;
  due_at: string | null;
  created_at: string;
};
type RequestComment = { id: string; request_id: string; user_id: string; body: string; created_at: string };
type RequestAttachment = { id: string; request_id: string; storage_path: string; file_name: string; content_type: string; size_bytes: number; created_at: string };
type Membership = { organization_id: string; role: Role; client_account_id: string | null };
type DbResult<T> = { data: T | null; error: Error | null };

const statusLabels: Record<RequestStatus, string> = {
  new: "New", triaged: "Triaged", in_progress: "In progress",
  waiting_on_client: "Waiting on client", resolved: "Resolved", closed: "Closed"
};
const priorityLabels: Record<Priority, string> = {
  low: "Low", normal: "Normal", high: "High", urgent: "Urgent"
};

function RequestsContent() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [uploadingRequestId, setUploadingRequestId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [role, setRole] = useState<Role>("client");
  const [organizationId, setOrganizationId] = useState("");
  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all");
  const isClient = role === "client";

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");

      const memberships = supabase.from("organization_members") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            limit: (count: number) => { single: () => Promise<DbResult<Membership>> };
          };
        };
      };
      const { data: membership, error: membershipError } = await memberships
        .select("organization_id,role,client_account_id")
        .eq("user_id", authData.user.id).limit(1).single();
      if (membershipError) throw membershipError;
      if (!membership) throw new Error("No agency workspace membership was found.");

      setRole(membership.role);
      setOrganizationId(membership.organization_id);

      const clientTable = supabase.from("client_accounts") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => Promise<DbResult<ClientAccount[]>>;
          };
        };
      };
      const siteTable = supabase.from("sites") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => Promise<DbResult<Site[]>>;
          };
        };
      };
      const requestTable = supabase.from("service_requests") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => Promise<DbResult<ServiceRequest[]>>;
          };
        };
      };
      const attachmentTable = supabase.from("request_attachments") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => Promise<DbResult<RequestAttachment[]>>;
          };
        };
      };
      const commentTable = supabase.from("request_comments") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, options: { ascending: boolean }) => Promise<DbResult<RequestComment[]>>;
          };
        };
      };

      const [clientResult, siteResult, requestResult, commentResult, attachmentResult] = await Promise.all([
        clientTable.select("id,name,status").eq("organization_id", membership.organization_id).order("name", { ascending: true }),
        siteTable.select("id,client_account_id,name,url,platform").eq("organization_id", membership.organization_id).order("name", { ascending: true }),
        requestTable.select("id,client_account_id,site_id,title,description,priority,status,due_at,created_at")
          .eq("organization_id", membership.organization_id).order("created_at", { ascending: false }),
        commentTable.select("id,request_id,user_id,body,created_at")
          .eq("organization_id", membership.organization_id).order("created_at", { ascending: true }),
        attachmentTable.select("id,request_id,storage_path,file_name,content_type,size_bytes,created_at")
          .eq("organization_id", membership.organization_id).order("created_at", { ascending: false })
      ]);
      if (clientResult.error) throw clientResult.error;
      if (siteResult.error) throw siteResult.error;
      if (requestResult.error) throw requestResult.error;
      if (commentResult.error) throw commentResult.error;
      if (attachmentResult.error) throw attachmentResult.error;

      const visibleClients = (clientResult.data ?? []) as ClientAccount[];
      setClients(visibleClients);
      setSites((siteResult.data ?? []) as Site[]);
      setRequests((requestResult.data ?? []) as ServiceRequest[]);
      setComments((commentResult.data ?? []) as RequestComment[]);
      setAttachments((attachmentResult.data ?? []) as RequestAttachment[]);
      if (membership.client_account_id) setClientId(membership.client_account_id);
      else if (!clientId && visibleClients[0]) setClientId(visibleClients[0].id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  const availableSites = useMemo(
    () => sites.filter(site => site.client_account_id === clientId),
    [sites, clientId]
  );
  const clientNames = useMemo(
    () => new Map(clients.map(client => [client.id, client.name])),
    [clients]
  );
  const siteNames = useMemo(
    () => new Map(sites.map(site => [site.id, site.name])),
    [sites]
  );
  const filteredRequests = useMemo(() => {
    const query = requestSearch.trim().toLowerCase();
    return requests.filter(request => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesSearch = !query
        || request.title.toLowerCase().includes(query)
        || request.description.toLowerCase().includes(query)
        || (clientNames.get(request.client_account_id) ?? "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [requests, requestSearch, statusFilter, clientNames]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");
      if (!organizationId || !clientId) throw new Error("Choose a client account first.");

      const insertValues = {
        organization_id: organizationId,
        client_account_id: clientId,
        site_id: siteId || null,
        title: title.trim(),
        description: description.trim(),
        priority: isClient ? "normal" as Priority : priority,
        status: "new" as RequestStatus,
        created_by: authData.user.id,
        assigned_to: null as string | null,
        due_at: !isClient && dueAt ? new Date(dueAt).toISOString() : null
      };
      const requestTable = supabase.from("service_requests") as unknown as {
        insert: (values: typeof insertValues) => Promise<{ error: Error | null }>;
      };
      const { error: insertError } = await requestTable.insert(insertValues);
      if (insertError) throw insertError;

      setTitle("");
      setDescription("");
      setSiteId("");
      setDueAt("");
      if (!isClient) setPriority("normal");
      setNotice("Request created successfully.");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create request.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const body = (commentDrafts[requestId] ?? "").trim();
    if (!body) return;
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");
      const commentTable = supabase.from("request_comments") as unknown as {
        insert: (values: { organization_id: string; request_id: string; user_id: string; body: string }) => Promise<{ error: Error | null }>;
      };
      const { error: insertError } = await commentTable.insert({
        organization_id: organizationId,
        request_id: requestId,
        user_id: authData.user.id,
        body
      });
      if (insertError) throw insertError;
      setCommentDrafts(current => ({ ...current, [requestId]: "" }));
      setNotice("Comment added.");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add comment.");
    }
  }

  async function handleUploadAttachment(event: ChangeEvent<HTMLInputElement>, requestId: string) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Upload a PNG, JPG, WebP image, or PDF file.");
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setError("Each attachment must be smaller than 10 MB.");
      return;
    }

    setUploadingRequestId(requestId);
    setError("");
    setNotice("");
    let uploadedPath = "";
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 100) || "evidence";
      uploadedPath = `${organizationId}/${requestId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("request-evidence").upload(uploadedPath, file, {
        contentType: file.type,
        upsert: false
      });
      if (uploadError) throw uploadError;

      const attachmentTable = supabase.from("request_attachments") as unknown as {
        insert: (values: {
          organization_id: string;
          request_id: string;
          uploaded_by: string;
          storage_path: string;
          file_name: string;
          content_type: string;
          size_bytes: number;
        }) => Promise<{ error: Error | null }>;
      };
      const { error: metadataError } = await attachmentTable.insert({
        organization_id: organizationId,
        request_id: requestId,
        uploaded_by: authData.user.id,
        storage_path: uploadedPath,
        file_name: file.name.slice(0, 255),
        content_type: file.type,
        size_bytes: file.size
      });
      if (metadataError) {
        await supabase.storage.from("request-evidence").remove([uploadedPath]);
        throw metadataError;
      }

      setNotice("Evidence attached to the request.");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload this attachment.");
    } finally {
      setUploadingRequestId(null);
    }
  }

  async function downloadAttachment(attachment: RequestAttachment) {
    setError("");
    const previewWindow = window.open("", "_blank");
    if (previewWindow) previewWindow.opener = null;
    try {
      const supabase = createClient();
      const { data, error: signedUrlError } = await supabase.storage
        .from("request-evidence")
        .createSignedUrl(attachment.storage_path, 60);
      if (signedUrlError) throw signedUrlError;
      if (previewWindow) previewWindow.location.href = data.signedUrl;
      else window.location.assign(data.signedUrl);
    } catch (caught) {
      previewWindow?.close();
      setError(caught instanceof Error ? caught.message : "Unable to open this attachment.");
    }
  }

  async function updateStatus(requestId: string, nextStatus: RequestStatus) {
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const requestTable = supabase.from("service_requests") as unknown as {
        update: (values: { status: RequestStatus }) => {
          eq: (column: string, value: string) => Promise<{ error: Error | null }>;
        };
      };
      const { error: updateError } = await requestTable.update({ status: nextStatus }).eq("id", requestId);
      if (updateError) throw updateError;
      setNotice("Request status updated.");
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update request status.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5]">
      <header className="flex h-[72px] items-center justify-between border-b border-line bg-white px-5 sm:px-8">
        <Link href="/dashboard/" className="flex items-center gap-3 text-sm font-bold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white"><Activity size={19} /></span>SiteCare <span className="-ml-3 text-brand">Pulse</span></Link>
        <nav aria-label="Workspace navigation" className="flex items-center gap-3 text-xs font-semibold text-muted"><Link href="/dashboard/" className="hover:text-brand">Dashboard</Link><Link href="/clients/" className="hover:text-brand">Clients</Link><Link href="/sites/" className="hover:text-brand">Websites</Link><Link href="/requests/" className="hover:text-brand">Requests</Link><Link href="/reports/" className="hover:text-brand">Reports</Link></nav><SignOutButton />
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link href="/dashboard/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={14} /> Back to overview</Link>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><Wrench size={15} /> SERVICE WORKSPACE</div><h1 className="text-2xl font-bold tracking-tight text-ink">Requests & tasks</h1><p className="mt-1.5 text-sm text-muted">Create, track, and manage client service requests.</p></div>
          <button onClick={() => void loadWorkspace()} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted hover:text-brand"><RefreshCw size={14} /> Refresh</button>
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{notice}</p>}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-ink">Request queue</h2><p className="mt-1 text-[11px] text-muted">Live records from your workspace</p></div><span className="rounded-full bg-[#edf4f0] px-3 py-1 text-xs font-bold text-brand">{filteredRequests.length} of {requests.length}</span></div>
            <div className="grid gap-2 border-b border-line p-4 sm:grid-cols-[minmax(0,1fr)_190px]">
              <input value={requestSearch} onChange={event => setRequestSearch(event.target.value)} placeholder="Search requests, details, or clients..." aria-label="Search requests" className="w-full rounded-xl border border-line px-3 py-2.5 text-xs outline-none focus:border-brand" />
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as "all" | RequestStatus)} aria-label="Filter requests by status" className="rounded-xl border border-line bg-white px-3 py-2.5 text-xs outline-none focus:border-brand">
                <option value="all">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            {loading ? <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" />Loading requests...</div> : requests.length === 0 ? <div className="px-6 py-14 text-center"><Wrench className="mx-auto text-slate-300" size={30} /><h3 className="mt-3 text-sm font-bold text-ink">No requests yet</h3><p className="mt-1 text-xs text-muted">Create the first request using the form.</p></div> : filteredRequests.length === 0 ? <div className="px-6 py-12 text-center text-xs text-muted">No requests match these filters.</div> : <div className="divide-y divide-line">{filteredRequests.map(request => <article key={request.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="text-sm font-bold text-ink">{request.title}</h3><p className="mt-1 text-xs leading-5 text-muted">{request.description || "No additional details provided."}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted"><span>{clientNames.get(request.client_account_id) ?? "Client"}</span>{request.site_id && <span>· {siteNames.get(request.site_id) ?? "Website"}</span>}<span>· {new Date(request.created_at).toLocaleDateString()}</span></div></div>
                <div className="flex shrink-0 flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${request.priority === "urgent" ? "bg-rose-50 text-rose-700" : request.priority === "high" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{priorityLabels[request.priority]}</span><span className="rounded-full bg-[#edf4f0] px-2.5 py-1 text-[10px] font-bold text-brand">{statusLabels[request.status]}</span></div>
              </div>
              {request.due_at && <div className={`mt-3 flex items-center gap-1.5 text-[10px] ${new Date(request.due_at).getTime() < Date.now() && !["resolved", "closed"].includes(request.status) ? "font-semibold text-rose-600" : "text-muted"}`}><CalendarClock size={12} /> Due {new Date(request.due_at).toLocaleString()}{new Date(request.due_at).getTime() < Date.now() && !["resolved", "closed"].includes(request.status) && <span className="ml-1 rounded-full bg-rose-50 px-2 py-0.5">Overdue</span>}</div>}
              {!isClient && <div className="mt-3 flex items-center gap-2"><label htmlFor={`status-${request.id}`} className="text-[10px] font-semibold text-muted">Update status</label><select id={`status-${request.id}`} value={request.status} onChange={event => void updateStatus(request.id, event.target.value as RequestStatus)} className="rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] text-ink">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
              <div className="mt-4 border-t border-line pt-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-muted"><MessageSquare size={12} /> Updates ({comments.filter(comment => comment.request_id === request.id).length})</div>
                <div className="space-y-2">{comments.filter(comment => comment.request_id === request.id).map(comment => <div key={comment.id} className="rounded-lg bg-[#f7f9f8] px-3 py-2"><p className="whitespace-pre-wrap text-[11px] leading-5 text-ink">{comment.body}</p><p className="mt-1 text-[9px] text-muted">{new Date(comment.created_at).toLocaleString()}</p></div>)}</div>
                <form onSubmit={event => void handleAddComment(event, request.id)} className="mt-3 flex gap-2">
                  <input value={commentDrafts[request.id] ?? ""} onChange={event => setCommentDrafts(current => ({ ...current, [request.id]: event.target.value }))} maxLength={3000} placeholder="Write an update..." aria-label="Write an update" className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-[11px] outline-none focus:border-brand" />
                  <button type="submit" disabled={!(commentDrafts[request.id] ?? "").trim()} aria-label="Add comment" className="rounded-lg bg-brand px-3 text-white disabled:opacity-40"><Send size={13} /></button>
                </form>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {attachments.filter(attachment => attachment.request_id === request.id).map(attachment => (
                      <button key={attachment.id} type="button" onClick={() => void downloadAttachment(attachment)} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold text-muted hover:border-brand hover:text-brand">
                        <FileText size={12} /> {attachment.file_name} <span className="text-slate-400">({Math.max(1, Math.round(attachment.size_bytes / 1024))} KB)</span> <Download size={11} />
                      </button>
                    ))}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#edf4f0] px-3 py-2 text-[10px] font-bold text-brand hover:bg-[#e2eee8]">
                    <Paperclip size={12} /> {uploadingRequestId === request.id ? "Uploading..." : "Attach evidence"}
                    <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" disabled={uploadingRequestId === request.id} onChange={event => void handleUploadAttachment(event, request.id)} />
                  </label>
                </div>
              </div>
            </article>)}</div>}
          </section>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="mb-5 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-brand"><Plus size={17} /></span><div><h2 className="text-sm font-bold text-ink">New request</h2><p className="text-[11px] text-muted">Add a service request</p></div></div>
            <form onSubmit={handleCreate} className="space-y-4">
              {!isClient && <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Client account *</span><select required value={clientId} onChange={event => { setClientId(event.target.value); setSiteId(""); }} className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand"><option value="">Choose a client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>}
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Website (optional)</span><select value={siteId} onChange={event => setSiteId(event.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand"><option value="">No specific website</option>{availableSites.map(site => <option key={site.id} value={site.id}>{site.name} — {site.platform}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Request title *</span><input required minLength={3} maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Describe the issue briefly" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Details</span><textarea rows={4} maxLength={5000} value={description} onChange={event => setDescription(event.target.value)} placeholder="What needs to be done?" className="w-full resize-y rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              {!isClient && <><label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Priority</span><select value={priority} onChange={event => setPriority(event.target.value as Priority)} className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Due date (optional)</span><input type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label></>}
              {isClient && <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[10px] leading-5 text-muted"><CircleAlert size={12} className="mr-1 inline" />Client requests start as normal priority and new status. Your agency team can triage them.</p>}
              <button disabled={saving || !clientId || title.trim().length < 3} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}{saving ? "Creating..." : "Create request"}</button>
            </form>
          </aside>
        </div>
        <p className="mt-5 flex items-center gap-2 text-[10px] text-muted"><Clock3 size={12} /> Access to requests is enforced by Supabase row-level security.</p>
      </main>
    </div>
  );
}

export default function RequestsPage() {
  return <AuthGuard><RequestsContent /></AuthGuard>;
}
