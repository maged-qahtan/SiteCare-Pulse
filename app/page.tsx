import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Wrench
} from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Client accounts", icon: BriefcaseBusiness },
  { label: "Requests & tasks", icon: Wrench },
  { label: "Service level", icon: Clock3 },
  { label: "Activity log", icon: Activity },
  { label: "Reports", icon: FileText }
];

const requests = [
  { initials: "NB", name: "Northstar Boutique", task: "Checkout page showing an error", priority: "High", status: "In progress", due: "Today, 2:30 PM", tone: "rose" },
  { initials: "AC", name: "Atlas Consulting", task: "Update team profile and service pages", priority: "Normal", status: "Waiting on client", due: "Tomorrow", tone: "amber" },
  { initials: "GM", name: "Greenfield Medical", task: "Monthly plugin and security review", priority: "Normal", status: "Scheduled", due: "Nov 21", tone: "blue" },
  { initials: "SL", name: "Studio Lumen", task: "Mobile navigation menu overlaps content", priority: "Urgent", status: "In progress", due: "Today, 11:00 AM", tone: "violet" }
];

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: string }) {
  const styles: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700"
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone] ?? styles.green}`}>{children}</span>;
}

export default function Home() {
  return (
    <div className="min-h-screen">
      <aside className="sidebar fixed inset-y-0 left-0 z-20 flex w-[248px] flex-col border-r border-line bg-white px-5 py-6">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Activity size={21} strokeWidth={2.4} /></div>
          <div><div className="text-[15px] font-bold tracking-tight text-ink">SiteCare <span className="text-brand">Pulse</span></div><div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.16em] text-muted">Agency workspace</div></div>
        </div>
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return <a key={item.label} href="#" className={`sidebar-link ${item.active ? "active" : ""}`}><Icon size={17} />{item.label}{item.label === "Requests & tasks" && <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">8</span>}</a>;
          })}
        </nav>
        <div className="mb-3 mt-9 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Manage</div>
        <nav className="space-y-1">
          <a href="#" className="sidebar-link"><Users size={17} />Team members</a>
          <a href="#" className="sidebar-link"><Settings2 size={17} />Settings</a>
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f5f8f6] p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand"><CircleHelp size={17} /></div>
          <div className="text-xs font-bold text-ink">Need a hand?</div>
          <p className="mt-1 text-[11px] leading-5 text-muted">Visit the help center for tips on running your client care workflow.</p>
          <a href="#" className="mt-3 inline-block text-[11px] font-bold text-brand">Explore help center →</a>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcece5] text-xs font-bold text-[#28634f]">MQ</div>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-bold text-ink">Workspace Admin</div><div className="text-[10px] text-muted">Starter workspace</div></div>
          <ChevronDown size={15} className="text-muted" />
        </div>
      </aside>

      <main className="main-content min-h-screen pl-[248px]">
        <header className="flex h-[76px] items-center justify-between border-b border-line bg-white px-8">
          <div className="flex items-center gap-2 text-xs text-muted"><span>Workspace</span><span>/</span><span className="font-semibold text-ink">Overview</span></div>
          <div className="flex items-center gap-3">
            <button aria-label="Search" className="rounded-lg p-2 text-muted hover:bg-slate-50"><Search size={18} /></button>
            <button aria-label="Notifications" className="relative rounded-lg p-2 text-muted hover:bg-slate-50"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" /></button>
            <div className="mx-1 h-7 w-px bg-line" />
            <div className="hidden text-right sm:block"><div className="text-xs font-bold text-ink">Good morning</div><div className="text-[10px] text-muted">Here is your care overview</div></div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dcece5] text-xs font-bold text-[#28634f]">MQ</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-8 py-8">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand"><span className="status-dot" /> LIVE WORKSPACE PREVIEW</div><h1 className="text-2xl font-bold tracking-tight text-ink">Good morning, Admin <span>👋</span></h1><p className="mt-1.5 text-sm text-muted">Here’s what’s happening across your client websites today.</p></div>
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark"><Plus size={16} /> New request</button>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="metric-card"><div className="flex items-center justify-between text-xs font-semibold text-muted"><span>Active clients</span><BriefcaseBusiness size={17} className="text-slate-400" /></div><div className="mt-4 flex items-end justify-between"><div className="text-3xl font-bold tracking-tight text-ink">24</div><span className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><ArrowUpRight size={13} /> 12.5%</span></div><div className="mt-2 text-[11px] text-muted">Compared to last month</div></div>
            <div className="metric-card"><div className="flex items-center justify-between text-xs font-semibold text-muted"><span>Open requests</span><LifeBuoy size={17} className="text-slate-400" /></div><div className="mt-4 flex items-end justify-between"><div className="text-3xl font-bold tracking-tight text-ink">08</div><span className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600"><ArrowDownRight size={13} /> 4.2%</span></div><div className="mt-2 text-[11px] text-muted">2 urgent requests need attention</div></div>
            <div className="metric-card"><div className="flex items-center justify-between text-xs font-semibold text-muted"><span>Resolved this month</span><CheckCircle2 size={17} className="text-slate-400" /></div><div className="mt-4 flex items-end justify-between"><div className="text-3xl font-bold tracking-tight text-ink">36</div><span className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><ArrowUpRight size={13} /> 18.0%</span></div><div className="mt-2 text-[11px] text-muted">Across all client accounts</div></div>
            <div className="metric-card"><div className="flex items-center justify-between text-xs font-semibold text-muted"><span>SLA response rate</span><ShieldCheck size={17} className="text-slate-400" /></div><div className="mt-4 flex items-end justify-between"><div className="text-3xl font-bold tracking-tight text-ink">96.8<span className="text-xl">%</span></div><span className="mb-1 text-[11px] font-bold text-emerald-600">On target</span></div><div className="mt-2 text-[11px] text-muted">Within agreed response times</div></div>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4"><div><h2 className="text-sm font-bold text-ink">Request queue</h2><p className="mt-1 text-[11px] text-muted">Track work across your client accounts</p></div><button className="text-xs font-bold text-brand">View all requests →</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="bg-[#fafcfb] text-[10px] font-bold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Client / Request</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Due date</th></tr></thead><tbody className="divide-y divide-line">{requests.map((request) => <tr key={request.name} className="hover:bg-slate-50/60"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf4f0] text-[10px] font-bold text-[#376b58]">{request.initials}</div><div><div className="text-xs font-bold text-ink">{request.name}</div><div className="mt-1 text-[11px] text-muted">{request.task}</div></div></div></td><td className="px-4 py-4"><Badge tone={request.priority === "Urgent" ? "violet" : request.priority === "High" ? "rose" : "blue"}>{request.priority}</Badge></td><td className="px-4 py-4"><Badge tone={request.status === "In progress" ? "green" : request.status === "Waiting on client" ? "amber" : "blue"}>{request.status}</Badge></td><td className="px-4 py-4 text-[11px] font-medium text-muted">{request.due}</td></tr>)}</tbody></table></div>
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-[10px] text-muted"><span>Showing 4 of 8 open requests</span><span>Updated just now</span></div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">SLA health</h2><p className="mt-1 text-[11px] text-muted">Response time performance</p></div><ShieldCheck size={19} className="text-brand" /></div><div className="mt-5 flex items-end justify-between"><div><div className="text-3xl font-bold tracking-tight text-ink">96.8%</div><div className="mt-1 text-[11px] text-emerald-600">+2.4% from last month</div></div><div className="text-right text-[10px] text-muted">Monthly target<br/><strong className="text-ink">95%</strong></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[96.8%] rounded-full bg-brand" /></div><div className="mt-3 flex justify-between text-[10px] text-muted"><span>0%</span><span>100%</span></div></div>

              <div className="rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-ink">Upcoming deadlines</h2><p className="mt-1 text-[11px] text-muted">What needs attention next</p></div><CalendarClock size={18} className="text-slate-400" /></div><div className="mt-4 space-y-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-rose-50 text-rose-600"><span className="text-[9px] font-bold uppercase">Nov</span><span className="text-sm font-bold">19</span></div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-ink">Checkout issue fix</div><div className="mt-1 text-[10px] text-muted">Northstar Boutique · 2:30 PM</div></div><span className="mt-1 h-2 w-2 rounded-full bg-rose-400" /></div><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-amber-50 text-amber-600"><span className="text-[9px] font-bold uppercase">Nov</span><span className="text-sm font-bold">20</span></div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-ink">Client content review</div><div className="mt-1 text-[10px] text-muted">Atlas Consulting · All day</div></div><span className="mt-1 h-2 w-2 rounded-full bg-amber-400" /></div><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-sky-50 text-sky-600"><span className="text-[9px] font-bold uppercase">Nov</span><span className="text-sm font-bold">21</span></div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-ink">Monthly maintenance</div><div className="mt-1 text-[10px] text-muted">Greenfield Medical · 10:00 AM</div></div><span className="mt-1 h-2 w-2 rounded-full bg-sky-400" /></div></div></div>

              <div className="rounded-2xl bg-[#173f35] p-5 text-white"><div className="flex items-center gap-2 text-emerald-200"><Activity size={16} /><span className="text-[10px] font-bold uppercase tracking-[.14em]">The SiteCare difference</span></div><h3 className="mt-3 text-base font-bold leading-6">Make every hour of care visible.</h3><p className="mt-2 text-[11px] leading-5 text-emerald-100/75">Turn completed work into clear, client-ready proof of the value your agency delivers.</p><div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-200">Explore monthly reports <ArrowUpRight size={13} /></div></div>
            </div>
          </section>
          <footer className="mt-8 flex flex-wrap justify-between gap-2 border-t border-line py-5 text-[10px] text-slate-400"><span>© 2026 SiteCare Pulse. Built for better client care.</span><span>Product preview · Sample data only</span></footer>
        </div>
      </main>
    </div>
  );
}