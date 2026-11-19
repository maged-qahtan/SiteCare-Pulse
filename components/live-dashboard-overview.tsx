"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Globe2, LifeBuoy, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Summary = {
  clients: number;
  sites: number;
  openRequests: number;
  resolvedThisMonth: number;
};
type RequestRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  client_account_id: string;
};
type ActivityRow = {
  id: string;
  entity_type: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  new: "New",
  triaged: "Triaged",
  in_progress: "In progress",
  waiting_on_client: "Waiting on client",
  resolved: "Resolved",
  closed: "Closed"
};

function Metric({ label, value, icon: Icon, hint }: {
  label: string;
  value: number;
  icon: typeof BriefcaseBusiness;
  hint: string;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between text-xs font-semibold text-muted">
        <span>{label}</span>
        <Icon size={17} className="text-slate-400" />
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight text-ink">{value}</div>
      <div className="mt-2 text-[11px] text-muted">{hint}</div>
    </div>
  );
}

export function LiveDashboardOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
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

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [clientsResult, sitesResult, openResult, resolvedResult, requestResult, activityResult] = await Promise.all([
          supabase.from("client_accounts").select("id,name", { count: "exact" }).eq("organization_id", membership.organization_id),
          supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id),
          supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id).in("status", ["new", "triaged", "in_progress", "waiting_on_client"]),
          supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id).in("status", ["resolved", "closed"]).gte("created_at", monthStart.toISOString()),
          supabase.from("service_requests").select("id,title,status,priority,created_at,client_account_id").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(5),
          supabase.from("activity_events").select("id,entity_type,action,details,created_at").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(8)
        ]);

        for (const result of [clientsResult, sitesResult, openResult, resolvedResult, requestResult, activityResult]) {
          if (result.error) throw result.error;
        }

        const names: Record<string, string> = {};
        for (const client of (clientsResult.data ?? []) as { id: string; name: string }[]) names[client.id] = client.name;

        if (!active) return;
        setClientNames(names);
        setSummary({
          clients: clientsResult.count ?? 0,
          sites: sitesResult.count ?? 0,
          openRequests: openResult.count ?? 0,
          resolvedThisMonth: resolvedResult.count ?? 0
        });
        setRequests((requestResult.data ?? []) as RequestRow[]);
        setActivity((activityResult.data ?? []) as ActivityRow[]);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load live workspace metrics.");
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  if (error) {
    return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>;
  }

  if (!summary) {
    return <div className="flex items-center gap-2 rounded-2xl border border-line bg-white p-6 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" />Loading live workspace data...</div>;
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Client accounts" value={summary.clients} icon={BriefcaseBusiness} hint="Live records in this workspace" />
        <Metric label="Websites" value={summary.sites} icon={Globe2} hint="Registered client websites" />
        <Metric label="Open requests" value={summary.openRequests} icon={LifeBuoy} hint="Requests that still need attention" />
        <Metric label="Resolved (this month's requests)" value={summary.resolvedThisMonth} icon={CheckCircle2} hint="Created this month and now resolved or closed" />
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div><h2 className="text-sm font-bold text-ink">Latest service requests</h2><p className="mt-1 text-[11px] text-muted">Live records from your workspace</p></div>
          <Link href="/requests/" className="text-xs font-bold text-brand">Open request queue →</Link>
        </div>
        {requests.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <LifeBuoy className="mx-auto text-slate-300" size={28} />
            <p className="mt-3 text-sm font-semibold text-ink">No requests yet</p>
            <p className="mt-1 text-xs text-muted">Create your first service request to start tracking client work.</p>
            <Link href="/requests/" className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white">Create a request</Link>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-ink">{request.title}</div>
                  <div className="mt-1 text-[11px] text-muted">{clientNames[request.client_account_id] ?? "Client"} · {new Date(request.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{request.priority}</span>
                  <span className="rounded-full bg-[#edf5f1] px-2.5 py-1 text-[10px] font-semibold text-brand">{statusLabels[request.status] ?? request.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Activity history</h2>
          <p className="mt-1 text-[11px] text-muted">Automatically recorded workspace events</p>
        </div>
        {activity.length === 0 ? (
          <p className="px-5 py-8 text-center text-xs text-muted">New client, website, request, and comment activity will appear here.</p>
        ) : (
          <div className="divide-y divide-line">
            {activity.map((event) => {
              const labels: Record<string, string> = {
                "client.created": "Client account created",
                "site.created": "Website registered",
                "request.created": "Service request created",
                "request.status_changed": "Request status changed",
                "request.priority_changed": "Request priority changed",
                "request.updated": "Request details updated",
                "request.comment_added": "Comment added to a request"
              };
              const subject = typeof event.details?.name === "string" ? event.details.name : typeof event.details?.title === "string" ? event.details.title : "Workspace item";
              return (
                <div key={event.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-ink">{labels[event.action] ?? event.action}</div>
                    <div className="mt-1 truncate text-[11px] text-muted">{subject}</div>
                  </div>
                  <time className="shrink-0 text-[10px] text-muted">{new Date(event.created_at).toLocaleString()}</time>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
