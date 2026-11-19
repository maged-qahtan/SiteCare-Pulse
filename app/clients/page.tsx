"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, BriefcaseBusiness, Globe2, LoaderCircle, Mail, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";

type ClientAccount = {
  id: string;
  name: string;
  contact_email: string | null;
  website_url: string | null;
  status: "active" | "paused" | "archived";
  created_at: string;
};

function ClientsContent() {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Please sign in again.");
      const membershipQuery = supabase.from("organization_members") as unknown as {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            limit: (count: number) => {
              single: () => Promise<{ data: { organization_id: string; role: string } | null; error: Error | null }>;
            };
          };
        };
      };
      const { data: membership, error: membershipError } = await membershipQuery
        .select("organization_id,role")
        .eq("user_id", userData.user.id)
        .limit(1)
        .single();
      if (membershipError) throw membershipError;
      if (!membership) throw new Error("No agency workspace membership was found.");
      const { data, error: clientsError } = await supabase
        .from("client_accounts")
        .select("id,name,contact_email,website_url,status,created_at")
        .eq("organization_id", membership.organization_id)
        .order("created_at", { ascending: false });
      if (clientsError) throw clientsError;
      setClients((data ?? []) as ClientAccount[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load client accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw userError ?? new Error("Please sign in again.");
      const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id,role")
        .eq("user_id", userData.user.id)
        .limit(1)
        .single();
      if (membershipError) throw membershipError;
      if (membership.role === "client") throw new Error("Client accounts cannot create other client accounts.");
      const cleanWebsite = website.trim()
        ? (/^https?:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`)
        : null;
      const clientAccounts = supabase.from("client_accounts") as unknown as {
        insert: (values: {
          organization_id: string;
          name: string;
          contact_email: string | null;
          website_url: string | null;
        }) => Promise<{ error: Error | null }>;
      };
      const { error: insertError } = await clientAccounts.insert({
        organization_id: membership.organization_id,
        name: name.trim(),
        contact_email: email.trim() || null,
        website_url: cleanWebsite
      });
      if (insertError) throw insertError;
      setName("");
      setEmail("");
      setWebsite("");
      setNotice("Client account created.");
      await loadClients();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create client account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5]">
      <header className="flex h-[72px] items-center justify-between border-b border-line bg-white px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-bold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white"><Activity size={19} /></span>SiteCare <span className="-ml-3 text-brand">Pulse</span></Link>
        <div className="flex items-center gap-4"><Link href="/" className="text-xs font-semibold text-muted hover:text-brand">Dashboard</Link><SignOutButton /></div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={14} /> Back to overview</Link>
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><BriefcaseBusiness size={15} /> AGENCY WORKSPACE</div><h1 className="text-2xl font-bold tracking-tight text-ink">Client accounts</h1><p className="mt-1.5 text-sm text-muted">Manage the businesses your agency supports.</p></div>
          <button onClick={() => void loadClients()} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted hover:text-brand"><RefreshCw size={14} /> Refresh</button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-ink">Your clients</h2><p className="mt-1 text-[11px] text-muted">Live records from your private workspace</p></div><span className="rounded-full bg-[#edf4f0] px-3 py-1 text-xs font-bold text-brand">{clients.length} total</span></div>
            {loading ? <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted"><LoaderCircle size={17} className="animate-spin" />Loading client accounts...</div> : clients.length === 0 ? <div className="px-6 py-14 text-center"><BriefcaseBusiness className="mx-auto text-slate-300" size={30} /><h3 className="mt-3 text-sm font-bold text-ink">No clients yet</h3><p className="mt-1 text-xs text-muted">Add your first client using the form.</p></div> : <div className="divide-y divide-line">{clients.map(client => <article key={client.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4f0] text-brand"><BriefcaseBusiness size={18} /></div><div className="min-w-0"><h3 className="truncate text-sm font-bold text-ink">{client.name}</h3><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">{client.contact_email && <span className="inline-flex items-center gap-1"><Mail size={12} />{client.contact_email}</span>}{client.website_url && <a href={client.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand"><Globe2 size={12} />{client.website_url}</a>}</div></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${client.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{client.status}</span></article>)}</div>}
          </section>
          <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="mb-5 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf4f0] text-brand"><Plus size={17} /></span><div><h2 className="text-sm font-bold text-ink">Add a client</h2><p className="text-[11px] text-muted">Create a new client account</p></div></div>
            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Client / company name *</span><input required minLength={2} maxLength={160} value={name} onChange={e => setName(e.target.value)} placeholder="Acme Studio" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Contact email</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@company.com" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Website</span><input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="company.com" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand" /></label>
              {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">{error}</p>}
              {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-700">{notice}</p>}
              <button disabled={saving || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />}{saving ? "Saving..." : "Create client account"}</button>
            </form>
            <p className="mt-4 text-[10px] leading-5 text-muted">Client data is protected by your workspace&apos;s database access policies.</p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function ClientsPage() {
  return <AuthGuard><ClientsContent /></AuthGuard>;
}
