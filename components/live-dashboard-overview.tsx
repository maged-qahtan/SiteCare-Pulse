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
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");

        const { data: membership, error: membershipError } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", authData.user.id)
          .limit(1)
          .maybeSingle();
        if (membershipError) throw membershipError;
        if (!membership) throw new Error("No workspace membership was found.");

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [clientsResult, sitesResult, openResult, resolvedResult, requestResult] = await Promise.all([
          supabase.from("client_accounts").select("id,name", { count: "exact" }).eq("organization_id", membership.organization_id),
          supabase.from("sites").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id),
          supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id).in("status", ["new", "triaged", "in_progress", "waiting_on_client"]),
          supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("organization_id", membership.organization_id).in("status", ["resolved", "closed"]).gte("created_at", monthStart.toISOString()),
          supabase.from("service_requests").select("id,title,status,priority,created_at,client_account_id").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(5)
        ]);

        for (const result of [clientsResult, sitesResult, openResult, resolvedResult, requestResult]) {
          if (result.error) throw result.error;
        }

        const names: Record<string, string> = {};
        for (const client of clientsResult.data ?? []) names[client.id] = client.name;

        if (!active) return;
        setClientNames(names);
        setSummary({
          clients: clientsResult.count ?? 0,
          sites: sitesResult.count ?? 0,
          openRequests: openResult.count ?? 0,
          resolvedThisMonth: resolvedResult.count ?? 0
        });
        setRequests((requestResult.data ?? []) as RequestRow[]);
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
        <Metric label="Resolved this month" value={summary.resolvedThisMonth} icon={CheckCircle2} hint="Resolved or closed since month start" />
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
    </>
  );
}
