"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Download, FileText, LoaderCircle, RefreshCw } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { createClient } from "@/lib/supabase/client";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
  created_at: string;
  client_account_id: string;
};
type ActivityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};
type ClientRow = { id: string; name: string };

function csvCell(value: unknown) {
  let text = value == null ? "" : typeof value === "string" ? value : JSON.stringify(value);
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function ReportsContent() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [events, setEvents] = useState<ActivityRow[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");

      const { data: membershipData, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", authData.user.id)
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;
      const membership = membershipData as { organization_id: string } | null;
      if (!membership) throw new Error("No workspace membership was found.");

      const start = new Date(`${month}-01T00:00:00`);
      if (Number.isNaN(start.getTime())) throw new Error("Choose a valid reporting month.");
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [requestResult, eventResult, clientResult] = await Promise.all([
        supabase.from("service_requests").select("id,title,status,priority,due_at,created_at,client_account_id").eq("organization_id", membership.organization_id).gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).order("created_at", { ascending: false }),
        supabase.from("activity_events").select("id,entity_type,entity_id,action,details,created_at").eq("organization_id", membership.organization_id).gte("created_at", start.toISOString()).lt("created_at", end.toISOString()).order("created_at", { ascending: false }),
        supabase.from("client_accounts").select("id,name").eq("organization_id", membership.organization_id)
      ]);
      if (requestResult.error) throw requestResult.error;
      if (eventResult.error) throw eventResult.error;
      if (clientResult.error) throw clientResult.error;

      const names: Record<string, string> = {};
      for (const client of (clientResult.data ?? []) as ClientRow[]) names[client.id] = client.name;
      setClientNames(names);
      setRequests((requestResult.data ?? []) as RequestRow[]);
      setEvents((eventResult.data ?? []) as ActivityRow[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load this month's report.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  function downloadCsv() {
    const headers = ["Date", "Event", "Entity type", "Client", "Subject", "File name", "Priority", "Status", "Due date"];
    const rows = events.map((event) => {
      const request = requests.find((item) => item.id === event.entity_id);
      const clientFromEvent = typeof event.details?.client_account_id === "string" ? event.details.client_account_id : "";
      const clientId = request?.client_account_id ?? (event.entity_type === "client" ? event.entity_id : clientFromEvent);
      const subject = typeof event.details?.title === "string"
        ? event.details.title
        : typeof event.details?.name === "string"
          ? event.details.name
          : event.action === "request.comment_added" ? "Request comment" : event.entity_type;
      return [
        event.created_at,
        event.action,
        event.entity_type,
        clientNames[clientId] ?? "",
        subject,
        typeof event.details?.file_name === "string" ? event.details.file_name : "",
        request?.priority ?? (typeof event.details?.new_priority === "string" ? event.details.new_priority : ""),
        request?.status ?? (typeof event.details?.new_status === "string" ? event.details.new_status : ""),
        request?.due_at ?? (typeof event.details?.due_at === "string" ? event.details.due_at : "")
      ].map(csvCell).join(",");
    });
    const csv = [headers.map(csvCell).join(","), ...rows].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sitecare-pulse-report-${month}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const resolvedIds = new Set(events.filter((event) => event.action === "request.status_changed" && ["resolved", "closed"].includes(String(event.details?.new_status))).map((event) => event.entity_id));
  const resolved = resolvedIds.size;
  const open = requests.filter((request) => !["resolved", "closed"].includes(request.status)).length;

  return (
    <main className="min-h-screen bg-[#f5f7f5] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={15} /> Back to overview</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand"><FileText size={15} /> Agency reporting</div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Monthly work report</h1>
            <p className="mt-2 text-sm text-muted">A downloadable record of requests and recorded work for your selected month.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Report month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink" />
            <button onClick={() => void loadReport()} className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-bold text-muted"><RefreshCw size={14} /> Refresh</button>
          </div>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-5"><div className="text-xs font-semibold text-muted">Requests created</div><div className="mt-3 text-3xl font-bold text-ink">{loading ? "—" : requests.length}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5"><div className="text-xs font-semibold text-muted">Resolved during month</div><div className="mt-3 text-3xl font-bold text-ink">{loading ? "—" : resolved}</div></div>
          <div className="rounded-2xl border border-line bg-white p-5"><div className="text-xs font-semibold text-muted">Open requests created this month</div><div className="mt-3 text-3xl font-bold text-ink">{loading ? "—" : open}</div></div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div><h2 className="text-sm font-bold text-ink">Recorded work</h2><p className="mt-1 text-xs text-muted">{events.length} activity events in this period</p></div>
            <button onClick={downloadCsv} disabled={loading || events.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"><Download size={15} /> Export CSV</button>
          </div>
          {loading ? <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted"><LoaderCircle className="animate-spin" size={17} />Loading report...</div> : events.length === 0 ? <div className="px-5 py-12 text-center"><Activity className="mx-auto text-slate-300" size={28} /><p className="mt-3 text-sm font-semibold text-ink">No activity recorded this month</p><p className="mt-1 text-xs text-muted">As work is created and updated, it will appear here.</p></div> : <div className="divide-y divide-line">{events.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><div className="text-xs font-bold text-ink">{event.action.replaceAll(".", " ")}</div><div className="mt-1 truncate text-[11px] text-muted">{typeof event.details?.title === "string" ? event.details.title : typeof event.details?.name === "string" ? event.details.name : event.entity_type}</div></div><time className="text-[10px] text-muted">{new Date(event.created_at).toLocaleString()}</time></div>)}</div>}
        </section>
        <p className="mt-4 text-[11px] leading-5 text-muted">This report reflects records currently stored in the workspace. It does not calculate contractual SLA compliance or include file attachments.</p>
      </div>
    </main>
  );
}

export default function ReportsPage() {
  return <AuthGuard><ReportsContent /></AuthGuard>;
}
