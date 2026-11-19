"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Globe2, LoaderCircle, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type Role = "owner" | "admin" | "member" | "client";
type ClientAccount = { id: string; name: string };
type Site = {
  id: string;
  client_account_id: string;
  name: string;
  url: string;
  platform: "wordpress" | "shopify" | "webflow" | "custom" | "other";
  status: "active" | "paused" | "archived";
  created_at: string;
};
type Membership = { organization_id: string; role: Role; client_account_id: string | null };
type DbResult<T> = { data: T | null; error: Error | null };

const platformLabels: Record<Site["platform"], string> = {
  wordpress: "WordPress", shopify: "Shopify", webflow: "Webflow", custom: "Custom", other: "Other"
};

function SitesContent() {
  const [sites, setSites] = useState<Site[]>([]);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [role, setRole] = useState<Role>("client");
  const [organizationId, setOrganizationId] = useState("");
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Site["platform"]>("wordpress");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isClient = role === "client";

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw authError ?? new Error("Please sign in again.");
      const membershipQuery = supabase.from("organization_members") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            limit: (count: number) => { single: () => Promise<DbResult<Membership>> };
          };
        };
      };
      const { data: membership, error: membershipError } = await membershipQuery
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
      const [clientResult, siteResult] = await Promise.all([
        clientTable.select("id,name").eq("organization_id", membership.organization_id).order("name", { ascending: true }),
        siteTable.select("id,client_account_id,name,url,platform,status,created_at")
          .eq("organization_id", membership.organization_id).order("created_at", { ascending: false })
      ]);
      if (clientResult.error) throw clientResult.error;
      if (siteResult.error) throw siteResult.error;
      const visibleClients = clientResult.data ?? [];
      setClients(visibleClients);
      setSites(siteResult.data ?? []);
      if (membership.client_account_id) setClientId(membership.client_account_id);
      else if (!clientId && visibleClients[0]) setClientId(visibleClients[0].id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load websites.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { void loadSites(); }, [loadSites]);

  const clientNames = useMemo(() => new Map(clients.map(client => [client.id, client.name])), [clients]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      if (isClient) throw new Error("Only agency team members can add websites.");
      if (!organizationId || !clientId) throw new Error("Choose a client account first.");
      const rawUrl = url.trim();
      const cleanUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(cleanUrl);
      } catch {
        throw new Error("Enter a valid website address, such as example.com.");
      }
      if (!["http:", "https:"].includes(parsedUrl.protocol) || !parsedUrl.hostname.includes(".")) {
        throw new Error("Enter a valid public website domain, such as example.com.");
      }
      const siteTable = supabase.from("sites") as unknown as {
        insert: (values: {
          organization_id: string;
          client_account_id: string;
          name: string;
          url: string;
          platform: Site["platform"];
        }) => Promise<{ error: Error | null }>;
      };
      const { error: insertError } = await siteTable.insert({
        organization_id: organizationId,
        client_account_id: clientId,
        name: name.trim(),
        url: cleanUrl,
        platform
      });
      if (insertError) throw insertError;
      setName("");
      setUrl("");
      setPlatform("wordpress");
      setNotice("Website added successfully.");
      await loadSites();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add website.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5]">
      <header className="flex h-[72px] items-center justify-between border-b border-line bg-white px-5 sm:px-8">
        <Link href="/dashboard/" className="flex items-center gap-3 text-sm font-bold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white"><Activity size={19} /></span>SiteCare <span className="-ml-3 text-brand">Pulse</span></Link>
        <nav aria-label="Workspace navigation" className="flex items-center gap-3 text-xs font-semibold text-muted"><Link href="/dashboard/" className="hover:text-brand">Dashboard</Link><Link href="/clients/" className="hover:text-brand">Clients</Link><Link href="/sites/" className="hover:text-brand">Websites</Link><Link href="/requests/" className="hover:text-brand">Requests</Link><Link href="/reports/" className="hover:text-brand">Reports</Link><Link href="/sla-settings/" className="hover:text-brand">SLA</Link></nav><SignOutButton />
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link href="/dashboard/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={14} /> Back to overview</Link>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><Globe2 size={15} /> WEBSITE PORTFOLIO</div><h1 className="text-2xl font-bold tracking-tight text-ink">Websites</h1><p className="mt-1.5 text-sm text-muted">Keep every supported client website in one place.</p></div>
          <button onClick={() => void loadSites()} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted hover:text-brand"><RefreshCw size={14} /> Refresh</button>
        </div>
        {error && <p role="alert" className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{notice}</p>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-ink">Client websites</h2><p className="mt-1 text-[11px] text-muted">Live records from your workspace</p></div><span className="rounded-full bg-[#edf4f0] px-3 py-1 text-xs font-bold text-brand">{sites.length} total</span></div>
            {loading ? <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" />Loading websites...</div> : sites.length === 0 ? <div className="px-6 py-14 text-center"><Globe2 className="mx-auto text-slate-300" size={30} /><h3 className="mt-3 text-sm font-bold text-ink">No websites yet</h3><p className="mt-1 text-xs text-muted">{isClient ? "Your agency has not added a website yet." : "Add the first website using the form."}</p></div> : <div className="divide-y divide-line">{sites.map(site => <article key={site.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4f0] text-brand"><Globe2 size={18} /></div><div className="min-w-0"><h3 className="truncate text-sm font-bold text-ink">{site.name}</h3><a href={site.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-[11px] text-muted hover:text-brand">{site.url}</a><div className="mt-1 text-[10px] text-muted">{clientNames.get(site.client_account_id) ?? "Client"} · {platformLabels[site.platform]}</div></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${site.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{site.status}</span></article>)}</div>}
          </section>
          {!isClient && <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="mb-5 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-brand"><Plus size={17} /></span><div><h2 className="text-sm font-bold text-ink">Add a website</h2><p className="text-[11px] text-muted">Register a client website</p></div></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Client account *</span><select required value={clientId} onChange={event => setClientId(event.target.value)} className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand"><option value="">Choose a client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Website name *</span><input required minLength={2} maxLength={160} value={name} onChange={event => setName(event.target.value)} placeholder="Main company website" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Website URL *</span><input required type="text" value={url} onChange={event => setUrl(event.target.value)} placeholder="example.com" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Platform</span><select value={platform} onChange={event => setPlatform(event.target.value as Site["platform"])} className="w-full rounded-xl border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand">{Object.entries(platformLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <button disabled={saving || !clientId || name.trim().length < 2 || !url.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{saving ? "Saving..." : "Add website"}</button>
            </form>
            <p className="mt-4 text-[10px] leading-5 text-muted">Website access is scoped to the selected client account by database policies.</p>
          </aside>}
        </div>
      </main>
    </div>
  );
}

export default function SitesPage() {
  return <AuthGuard><SitesContent /></AuthGuard>;
}
