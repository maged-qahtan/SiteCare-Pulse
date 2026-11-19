import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  MessageSquare,
  ShieldCheck,
  Users,
  Wrench
} from "lucide-react";

const features = [
  {
    icon: BriefcaseBusiness,
    title: "Client accounts",
    description: "Keep each client’s contact details and supported business information together."
  },
  {
    icon: Globe2,
    title: "Website portfolio",
    description: "Register WordPress, Shopify, Webflow, and custom websites under the right client."
  },
  {
    icon: Wrench,
    title: "Service request queue",
    description: "Capture issues, priorities, due dates, status changes, and the conversation around each task."
  },
  {
    icon: Activity,
    title: "Activity history",
    description: "Automatically record client, website, request, and comment activity for a clear work trail."
  },
  {
    icon: FileText,
    title: "Monthly work reports",
    description: "Review the month’s recorded activity, SLA measurements, and export a shareable CSV work log."
  },
  {
    icon: Clock3,
    title: "Response and resolution targets",
    description: "Configure first-response and resolution targets for each request priority, then track overdue work."
  },
  {
    icon: Users,
    title: "Team and client access",
    description: "Connect existing confirmed team and client accounts with role-scoped workspace access."
  },
  {
    icon: ShieldCheck,
    title: "Workspace data boundaries",
    description: "Use authenticated access and database-enforced row-level policies to scope records."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f5] text-ink">
      <header className="border-b border-line bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Activity size={21} /></span>
            <span className="text-lg font-bold tracking-tight">SiteCare <span className="text-brand">Pulse</span></span>
          </Link>
          <nav className="flex items-center gap-3 text-xs font-semibold sm:gap-5">
            <Link href="/login/" className="text-muted hover:text-brand">Sign in</Link>
            <Link href="/login/?mode=signup" className="rounded-xl bg-brand px-4 py-2.5 text-white hover:bg-brand-dark">Create workspace</Link>
          </nav>
        </div>
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d6e7df] bg-white px-3 py-1.5 text-[11px] font-bold text-brand"><span className="h-2 w-2 rounded-full bg-brand" /> AGENCY CLIENT CARE WORKSPACE</div>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">Every client website. Every request. <span className="text-brand">One clear workspace.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted">SiteCare Pulse helps small web agencies organise client accounts, website records, service requests, conversations, and the work history behind ongoing website care.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login/?mode=signup" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark">Get started <ArrowRight size={17} /></Link>
              <Link href="/login/" className="inline-flex items-center rounded-xl border border-line bg-white px-5 py-3.5 text-sm font-bold text-ink hover:border-brand">Sign in to your workspace</Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand" /> No credit card requested by this preview</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand" /> Workspace-scoped data access</span>
              <span className="basis-full text-[10px] leading-5 text-muted">Free preview account verification is currently limited to project team email addresses; external client onboarding needs custom SMTP.</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-[#e6f0eb] blur-2xl" />
            <div className="relative rounded-[1.7rem] border border-line bg-white p-5 shadow-[0_25px_80px_rgba(22,56,43,.10)] sm:p-7">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-brand">Workspace preview</p><h2 className="mt-1 text-lg font-bold">Client care overview</h2></div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4f0] text-brand"><Activity size={20} /></span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#f6f8f6] p-4"><BriefcaseBusiness size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-muted">Client accounts</p><p className="mt-1 text-lg font-bold">Organised</p></div>
                <div className="rounded-xl bg-[#f6f8f6] p-4"><Globe2 size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-muted">Websites</p><p className="mt-1 text-lg font-bold">In one place</p></div>
                <div className="rounded-xl bg-[#f6f8f6] p-4"><Wrench size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-muted">Service requests</p><p className="mt-1 text-lg font-bold">Trackable</p></div>
                <div className="rounded-xl bg-[#f6f8f6] p-4"><MessageSquare size={17} className="text-brand" /><p className="mt-3 text-xs font-semibold text-muted">Discussions</p><p className="mt-1 text-lg font-bold">Recorded</p></div>
              </div>
              <div className="mt-4 rounded-xl border border-[#dce9e2] bg-[#f7faf8] p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-ink"><Activity size={15} className="text-brand" /> A clear record of work</div>
                <p className="mt-2 text-[11px] leading-5 text-muted">Requests, status changes, comments, and client updates feed into a searchable workspace history and monthly CSV report.</p>
              </div>
              <p className="mt-4 text-center text-[10px] text-muted">Illustrative product preview — no customer metrics shown</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Built around recurring client care</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">The operational details shouldn’t get lost in messages and spreadsheets.</h2>
            <p className="mt-4 text-sm leading-7 text-muted">Keep the relationship, the website, the request, and the work record connected instead of scattered across separate tools.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return <article key={feature.title} className="rounded-2xl border border-line bg-[#fbfcfb] p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4f0] text-brand"><Icon size={19} /></span>
                <h3 className="mt-4 text-sm font-bold">{feature.title}</h3>
                <p className="mt-2 text-xs leading-6 text-muted">{feature.description}</p>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="rounded-[1.7rem] bg-[#173f34] px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#a8d7c3]">Start with a clear workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Bring your agency’s client care into one place.</h2>
            <p className="mt-4 text-sm leading-7 text-[#d0e1d9]">Create your workspace, add a client, register their website, and start recording service requests and updates.</p>
            <Link href="/login/?mode=signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#173f34] hover:bg-[#edf4f0]">Create your workspace <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[11px] text-muted sm:px-8">
          <span>© 2026 SiteCare Pulse</span>
          <div className="flex items-center gap-4"><Link href="/help/" className="font-semibold text-brand hover:underline">Help centre</Link><span>Early product release · Features and limits are evolving</span></div>
        </div>
      </footer>
    </main>
  );
}
