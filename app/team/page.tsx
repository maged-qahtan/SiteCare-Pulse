"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, LoaderCircle, Plus, RefreshCw, Users, ShieldCheck } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";
import { getActiveMembership } from "@/lib/supabase/workspace";

type TeamMember = { user_id: string; email: string; role: "owner" | "admin" | "member"; created_at: string };
type Membership = { organization_id: string; role: string };

function TeamContent() {
  const [members,setMembers] = useState<TeamMember[]>([]);
  const [organizationId,setOrganizationId] = useState("");
  const [role,setRole] = useState("");
  const [email,setEmail] = useState("");
  const [newRole,setNewRole] = useState<"admin"|"member">("member");
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient() as unknown as {
        auth: { getUser: () => Promise<{data:{user:{id:string}|null};error:Error|null}> };
        from: (table:string) => { select:(columns:string)=>{eq:(column:string,value:string)=>{limit:(n:number)=>{maybeSingle:()=>Promise<{data:Membership|null;error:Error|null}>}}} };
        rpc: (name:string,args:{target_org:string}) => Promise<{data:TeamMember[]|null;error:Error|null}>;
      };
      const {data:authData,error:authError}=await supabase.auth.getUser();
      if(authError||!authData.user) throw authError??new Error("Please sign in again.");
      const membership = await getActiveMembership(supabase, authData.user.id);
      setOrganizationId(membership.organization_id);
      setRole(membership.role);
      if(membership.role==="client") {
        setMembers([]);
        return;
      }
      const {data,error:listError}=await supabase.rpc("list_team_members",{target_org:membership.organization_id});
      if(listError) throw listError;
      setMembers(data??[]);
    } catch(caught) {
      setError(caught instanceof Error?caught.message:"Unable to load team members.");
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(()=>{void load();},[load]);

  async function addMember(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(role!=="owner"&&role!=="admin") return;
    setSaving(true);setError("");setNotice("");
    try {
      const supabase=createClient() as unknown as {
        rpc:(name:string,args:{target_org:string;member_email:string;member_role:string})=>Promise<{data:string|null;error:Error|null}>;
      };
      const {error:rpcError}=await supabase.rpc("add_existing_team_member",{
        target_org:organizationId,
        member_email:email.trim(),
        member_role:newRole
      });
      if(rpcError) throw rpcError;
      setEmail("");
      setNotice("Team member connected. No invitation email was sent.");
      await load();
    } catch(caught) {
      setError(caught instanceof Error?caught.message:"Unable to add this team member.");
    } finally {
      setSaving(false);
    }
  }

  const canManage=role==="owner"||role==="admin";

  return <div className="min-h-screen bg-[#f5f7f5]">
    <header className="flex h-[72px] items-center justify-between border-b border-line bg-white px-5 sm:px-8">
      <Link href="/dashboard/" className="flex items-center gap-3 text-sm font-bold text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white"><Activity size={19}/></span>SiteCare <span className="-ml-3 text-brand">Pulse</span></Link>
      <nav aria-label="Workspace navigation" className="hidden items-center gap-4 text-xs font-semibold text-muted sm:flex"><Link href="/dashboard/">Dashboard</Link><Link href="/clients/">Clients</Link><Link href="/sites/">Websites</Link><Link href="/requests/">Requests</Link><Link href="/reports/">Reports</Link><Link href="/sla-settings/">SLA</Link><Link href="/team/" className="text-brand">Team</Link><Link href="/help/" className="hover:text-brand">Help</Link></nav>
      <SignOutButton/>
    </header>
    <nav aria-label="Mobile workspace navigation" className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3 sm:hidden">
      <Link href="/dashboard/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Overview</Link>
      <Link href="/clients/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Clients</Link>
      <Link href="/sites/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Websites</Link>
      <Link href="/requests/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Requests</Link>
      <Link href="/reports/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Reports</Link>
      <Link href="/sla-settings/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">SLA</Link>
      <Link href="/team/" className="shrink-0 rounded-lg bg-[#edf4f0] px-3 py-2 text-[11px] font-bold text-brand">Team</Link>
    <Link href="/help/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Help</Link></nav>
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <Link href="/dashboard/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={14}/> Back to overview</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-brand"><Users size={15}/> AGENCY WORKSPACE</div><h1 className="text-2xl font-bold tracking-tight text-ink">Team members</h1><p className="mt-1.5 text-sm text-muted">Manage the people who help deliver client care.</p></div>
        <button type="button" onClick={()=>void load()} className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-muted"><RefreshCw size={14}/> Refresh</button>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-900"><ShieldCheck size={17} className="mt-0.5 shrink-0"/><p>Only already-confirmed SiteCare Pulse accounts can be connected. The current free email setup does not send invitations. Share access details securely with the intended person yourself.</p></div>
      {error&&<p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{error}</p>}
      {notice&&<p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">{notice}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-ink">Workspace team</h2><p className="mt-1 text-[11px] text-muted">Staff accounts and assigned roles</p></div><span className="rounded-full bg-[#edf4f0] px-3 py-1.5 text-[11px] font-bold text-brand">{members.length} members</span></div>
          {loading?<div className="flex items-center justify-center gap-2 p-12 text-sm text-muted"><LoaderCircle size={17} className="animate-spin"/>Loading team...</div>:role==="client"?<p className="p-8 text-center text-xs text-muted">Team details are only available to workspace staff.</p>:members.length===0?<p className="p-8 text-center text-xs text-muted">No team members found.</p>:<div className="divide-y divide-line">{members.map(member=><div key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><div className="truncate text-xs font-bold text-ink">{member.email}</div><div className="mt-1 text-[10px] text-muted">Joined {new Date(member.created_at).toLocaleDateString()}</div></div><span className="rounded-full bg-[#edf4f0] px-3 py-1.5 text-[10px] font-bold capitalize text-brand">{member.role}</span></div>)}</div>}
        </section>
        {canManage&&<aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="mb-4"><h2 className="text-sm font-bold text-ink">Connect a team member</h2><p className="mt-1 text-[11px] leading-5 text-muted">Add a confirmed account as an admin or member.</p></div>
          <form onSubmit={addMember} className="space-y-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Account email</span><input required type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="teammate@example.com" className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-brand"/></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink">Workspace role</span><select value={newRole} onChange={event=>setNewRole(event.target.value as "admin"|"member")} className="w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-brand"><option value="member">Member — manage day-to-day work</option>{role === "owner" && <option value="admin">Admin — manage workspace settings</option>}</select></label>
            <button disabled={saving||!email.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white disabled:opacity-50">{saving?<LoaderCircle size={15} className="animate-spin"/>:<Plus size={15} />}{saving?"Connecting...":"Connect team member"}</button>
          </form>
        </aside>}
      </div>
    </main>
  </div>;
}

export default function TeamPage(){return <AuthGuard><TeamContent/></AuthGuard>;}
