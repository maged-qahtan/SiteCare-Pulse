import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { AuthGuard } from "@/components/auth-guard";
import { LiveDashboardOverview } from "@/components/live-dashboard-overview";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleHelp,
  FileText,
  Globe2,
  LayoutDashboard,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Wrench
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Client accounts", icon: BriefcaseBusiness },
  { label: "Websites", icon: Globe2 },
  { label: "Requests & tasks", icon: Wrench },
  { label: "Monthly reports", icon: FileText },
  { label: "SLA settings", icon: SlidersHorizontal },
  { label: "Team", icon: Users }
];

export default function Home() {
  return (
    <AuthGuard>
      <div className="min-h-screen">
        <aside className="sidebar fixed inset-y-0 left-0 z-20 flex w-[248px] flex-col border-r border-line bg-white px-5 py-6">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Activity size={21} strokeWidth={2.4} /></div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-ink">SiteCare <span className="text-brand">Pulse</span></div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Agency workspace</div>
            </div>
          </div>
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const href = item.label === "Client accounts" ? "/clients/" : item.label === "Websites" ? "/sites/" : item.label === "Requests & tasks" ? "/requests/" : item.label === "Monthly reports" ? "/reports/" : item.label === "SLA settings" ? "/sla-settings/" : item.label === "Team" ? "/team/" : "/dashboard/";
              return <Link key={item.label} href={href} className={`sidebar-link ${item.active ? "active" : ""}`}><Icon size={17} />{item.label}</Link>;
            })}
          </nav>
          <div className="mt-auto rounded-2xl bg-[#f5f8f6] p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand"><CircleHelp size={17} /></div>
            <div className="text-xs font-bold text-ink">Need a hand?</div>
            <p className="mt-1 text-[11px] leading-5 text-muted">Visit the help center for tips on running your client care workflow.</p>
            <span className="mt-3 inline-block text-[11px] font-bold text-muted">Help center coming soon</span>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcece5] text-xs font-bold text-[#28634f]">WS</div>
            <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-ink">Workspace member</div><div className="text-[10px] text-muted">Agency workspace</div></div>
            <ChevronDown size={15} className="text-muted" />
          </div>
        </aside>

        <main className="main-content min-h-screen pl-[248px]">
          <header className="flex h-[76px] items-center justify-between border-b border-line bg-white px-8">
            <div className="flex items-center gap-2 text-xs text-muted"><span>Workspace</span><span>/</span><span className="font-semibold text-ink">Overview</span></div>
            <div className="flex items-center gap-3">
              <span aria-label="Search" className="rounded-lg p-2 text-muted"><Search size={18} /></span>
              <span aria-label="Notifications" className="rounded-lg p-2 text-muted"><Bell size={18} /></span>
              <div className="mx-1 h-7 w-px bg-line" />
              <SignOutButton />
              <div className="hidden text-right sm:block"><div className="text-xs font-bold text-ink">Your workspace</div><div className="text-[10px] text-muted">Live care overview</div></div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcece5] text-xs font-bold text-[#28634f]">WS</div>
            </div>
          </header>

          <nav aria-label="Workspace navigation" className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 py-3 lg:hidden">
            <Link href="/dashboard/" className="shrink-0 rounded-lg bg-[#edf4f0] px-3 py-2 text-[11px] font-bold text-brand">Overview</Link>
            <Link href="/clients/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Clients</Link>
            <Link href="/sites/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Websites</Link>
            <Link href="/requests/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Requests</Link>
            <Link href="/reports/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Reports</Link>
            <Link href="/sla-settings/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">SLA settings</Link>
            <Link href="/team/" className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold text-muted">Team</Link>
          </nav>

          <div className="mx-auto max-w-[1440px] px-8 py-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><span className="status-dot" /> LIVE WORKSPACE · REAL DATA</div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">Agency overview</h1>
                <p className="mt-1.5 text-sm text-muted">Live client, website, and service activity from your workspace.</p>
              </div>
              <Link href="/requests/" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark"><Plus size={16} /> New request</Link>
            </div>

            <LiveDashboardOverview />

            <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-line py-5 text-[10px] text-slate-400">
              <span>© 2026 SiteCare Pulse</span>
              <span>Workspace data is protected by Supabase Row Level Security</span>
            </footer>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
