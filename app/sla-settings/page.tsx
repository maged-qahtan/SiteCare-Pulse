"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Clock3, LoaderCircle, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type Priority = "urgent" | "high" | "normal" | "low";
type Policy = {
  priority: Priority;
  response_minutes: number;
  resolution_minutes: number;
  active: boolean;
};
type Membership = { organization_id: string; role: string };

const priorities: { value: Priority; label: string; description: string }[] = [
  { value: "urgent", label: "Urgent", description: "Critical incidents and severe outages" },
  { value: "high", label: "High", description: "Major functionality affected" },
  { value: "normal", label: "Normal", description: "Standard support and maintenance" },
  { value: "low", label: "Low", description: "Minor changes and non-urgent work" }
];

const defaultPolicies: Policy[] = [
  { priority: "urgent", response_minutes: 60, resolution_minutes: 240, active: true },
  { priority: "high", response_minutes: 240, resolution_minutes: 1440, active: true },
  { priority: "normal", response_minutes: 480, resolution_minutes: 4320, active: true },
  { priority: "low", response_minutes: 1440, resolution_minutes: 10080, active: true }
];

function formatMinutes(minutes: number) {
  if (minutes % 1440 === 0) return `${minutes / 1440} days`;
  if (minutes % 60 === 0) return `${minutes / 60} hours`;
  return `${minutes} minutes`;
}

function SlaSettingsContent() {
  const [policies, setPolicies] = useState<Policy[]>(defaultPolicies);
  const [organizationId, setOrganizationId] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");
      const { data: membershipData, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id,role")
        .eq("user_id", authData.user.id)
        .limit(1)
        .maybeSingle();
      if (membershipError) throw membershipError;
      const membership = membershipData as Membership | null;
      if (!membership) throw new Error("No workspace membership was found.");
      setOrganizationId(membership.organization_id);
      setRole(membership.role);

      const { data, error: policyError } = await supabase
        .from("sla_policies")
        .select("priority,response_minutes,resolution_minutes,active")
        .eq("organization_id", membership.organization_id);
      if (policyError) throw policyError;
      const rows = (data ?? []) as Policy[];
      setPolicies(priorities.map((item) => rows.find((row) => row.priority === item.value) ?? defaultPolicies.find((row) => row.priority === item.value)!));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load SLA policies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function changePolicy(priority: Priority, key: "response_minutes" | "resolution_minutes" | "active", value: number | boolean) {
    setPolicies((current) => current.map((policy) => policy.priority === priority ? { ...policy, [key]: value } : policy));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role !== "owner" && role !== "admin") {
      setError("Only workspace owners and admins can change SLA policies.");
      return;
    }
    if (policies.some((policy) =>
      !Number.isInteger(policy.response_minutes) || policy.response_minutes < 1 || policy.response_minutes > 525600
      || !Number.isInteger(policy.resolution_minutes) || policy.resolution_minutes < 1 || policy.resolution_minutes > 525600
    )) {
      setError("Enter whole-minute targets between 1 and 525,600 minutes.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");
      const table = supabase.from("sla_policies") as unknown as {
        update: (values: { response_minutes: number; resolution_minutes: number; active: boolean; updated_by: string; updated_at: string }) => {
          eq: (column: string, value: string) => {
            eq: (column: string, value: string) => Promise<{ error: Error | null }>;
          };
        };
      };
      for (const policy of policies) {
        const { error: updateError } = await table.update({
          response_minutes: policy.response_minutes,
          resolution_minutes: policy.resolution_minutes,
          active: policy.active,
          updated_by: authData.user.id,
          updated_at: new Date().toISOString()
        }).eq("organization_id", organizationId).eq("priority", policy.priority);
        if (updateError) throw updateError;
      }
      setNotice("SLA policies saved. New requests will use the updated targets. Existing requests keep their original deadlines unless their priority changes.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save SLA policies.");
    } finally {
      setSaving(false);
    }
  }

  const canManage = role === "owner" || role === "admin";

  return (
    <div className="min-h-screen bg-[#f5f7f5]">
      <header className="flex h-[72px] items-center justify-between border-b border-line bg-white px-5 sm:px-8">
        <Link href="/dashboard/" className="flex items-center gap-3 text-sm font-bold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white"><Activity size={19} /></span>SiteCare <span className="-ml-3 text-brand">Pulse</span></Link>
        <nav aria-label="Workspace navigation" className="hidden items-center gap-4 text-xs font-semibold text-muted sm:flex"><Link href="/dashboard/">Dashboard</Link><Link href="/clients/">Clients</Link><Link href="/sites/">Websites</Link><Link href="/requests/">Requests</Link><Link href="/reports/">Reports</Link><Link href="/sla-settings/" className="text-brand">SLA</Link><Link href="/team/" className="hover:text-brand">Team</Link></nav>
        <SignOutButton />
      </header>
      <nav aria-label="Mobile workspace navigation" className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3 sm:hidden">
        <Link href="/dashboard/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Overview</Link>
        <Link href="/clients/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Clients</Link>
        <Link href="/sites/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Websites</Link>
        <Link href="/requests/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Requests</Link>
        <Link href="/reports/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Reports</Link>
        <Link href="/sla-settings/" className="shrink-0 rounded-lg bg-[#edf4f0] px-3 py-2 text-[11px] font-bold text-brand">SLA</Link>
      </nav>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link href="/dashboard/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={14} /> Back to overview</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-brand"><Clock3 size={15} /> SERVICE LEVEL SETTINGS</div><h1 className="text-2xl font-bold tracking-tight text-ink">Response & resolution targets</h1><p className="mt-1.5 text-sm text-muted">Configure internal target times by request priority.</p></div>
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted"><RefreshCw size={14} /> Refresh</button>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          <ShieldCheck size={17} className="mt-0.5 shrink-0" />
          <p>These are configurable operational targets, not contractual guarantees. The starter values are examples; agree service commitments with each customer separately. Targets use elapsed clock time, not business hours.</p>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{error}</p>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">{notice}</p>}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-white p-12 text-sm text-muted"><LoaderCircle className="animate-spin" size={17} />Loading policies...</div> : policies.map((policy) => {
            const meta = priorities.find((item) => item.value === policy.priority)!;
            return <section key={policy.priority} className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-sm font-bold text-ink">{meta.label} priority</h2><p className="mt-1 text-[11px] text-muted">{meta.description}</p></div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted"><input type="checkbox" checked={policy.active} disabled={!canManage} onChange={(event) => changePolicy(policy.priority, "active", event.target.checked)} /> Active</label>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">First response target (minutes)</span><input type="number" min={1} max={525600} step={1} required disabled={!canManage} value={policy.response_minutes} onChange={(event) => changePolicy(policy.priority, "response_minutes", Number(event.target.value))} className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand disabled:bg-slate-50" /><span className="mt-1 block text-[10px] text-muted">Current target: {formatMinutes(policy.response_minutes)}</span></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Resolution target (minutes)</span><input type="number" min={1} max={525600} step={1} required disabled={!canManage} value={policy.resolution_minutes} onChange={(event) => changePolicy(policy.priority, "resolution_minutes", Number(event.target.value))} className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand disabled:bg-slate-50" /><span className="mt-1 block text-[10px] text-muted">Current target: {formatMinutes(policy.resolution_minutes)}</span></label>
              </div>
            </section>;
          })}
          {!loading && canManage && <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-xs font-bold text-white disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={15} /> : <Save size={15} />}{saving ? "Saving..." : "Save SLA policies"}</button>}
          {!loading && !canManage && <p className="rounded-xl bg-white p-4 text-xs text-muted">You can view these policies. Only workspace owners and admins can change them.</p>}
        </form>
      </main>
    </div>
  );
}

export default function SlaSettingsPage() {
  return <AuthGuard><SlaSettingsContent /></AuthGuard>;
}
