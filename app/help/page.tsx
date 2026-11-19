import Link from "next/link";
import { Activity, ArrowLeft, CheckCircle2, CircleHelp, ShieldCheck } from "lucide-react";

const steps = [
  { title: "Create your agency workspace", body: "Create an account with an email address that can receive Supabase confirmation messages. After signing in, choose your agency name and workspace URL slug." },
  { title: "Add your client accounts", body: "Open Client accounts and add each customer. Use a valid website URL including its real public domain, for example https://example.com." },
  { title: "Register the websites", body: "Open Websites and connect each website record to the correct client account. Choose the platform and enter the site's public URL." },
  { title: "Track service requests", body: "Create a request for the correct client and website, set its priority and due date, and keep updates in the request discussion. Staff can update status; client users are restricted by their role." },
  { title: "Record evidence and report work", body: "Attach relevant screenshots or documents to requests. Use Monthly reports to review recorded activity, export CSV, or print/save the report as PDF." }
];

const faqs = [
  ["Why can’t an external client create an account yet?", "The project’s default Supabase email service is restricted to project team addresses and has a low sending limit. External sign-up and password recovery need a verified SMTP sender and a domain with the required DNS records."],
  ["Are the dashboard figures sample data?", "The public landing-page preview is illustrative. The authenticated workspace dashboard reads its core counts from the signed-in workspace. Do not treat the public preview as customer activity."],
  ["Does SiteCare Pulse monitor websites automatically?", "Not yet. Website records and service requests can be managed, but continuous uptime checks, automatic backups, and automatic SLA email alerts are not currently part of the release."],
  ["How are client records separated?", "The app uses Supabase authentication and database Row Level Security policies to scope records to the user's workspace and client membership. The browser-side route guard is not the security boundary; database policies are."],
  ["Can I accept subscription payments?", "Subscription billing is not enabled. Payment provider eligibility and legal/business requirements must be confirmed for the seller's actual country before enabling checkout."],
  ["What should I do if a page reports a configuration error?", "Check that the Cloudflare Pages deployment has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY set, then trigger a fresh deployment. Never place a service-role or secret key in a NEXT_PUBLIC_ variable."]
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f5f7f5] px-5 py-10 text-ink sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"><ArrowLeft size={15} /> Back to SiteCare Pulse</Link>
        <div className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-9">
          <div className="flex items-center gap-3 text-brand"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf4f0]"><CircleHelp size={22} /></span><span className="text-xs font-bold uppercase tracking-[.16em]">Help centre</span></div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Getting started with SiteCare Pulse</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">A practical guide to setting up your agency workspace and using the current early-release features.</p>
          <div className="mt-8 space-y-6">
            {steps.map((step, index) => <section key={step.title} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf4f0] text-xs font-bold text-brand">{index + 1}</span><div><h2 className="text-sm font-bold">{step.title}</h2><p className="mt-1 text-xs leading-6 text-muted">{step.body}</p></div></section>)}
          </div>
        </div>
        <section className="mt-5 rounded-3xl border border-line bg-white p-6 sm:p-9">
          <div className="flex items-center gap-3"><ShieldCheck className="text-brand" size={20} /><h2 className="text-lg font-bold">Common questions and current limits</h2></div>
          <div className="mt-5 divide-y divide-line">{faqs.map(([question, answer]) => <article key={question} className="py-4 first:pt-0 last:pb-0"><h3 className="text-sm font-bold">{question}</h3><p className="mt-2 text-xs leading-6 text-muted">{answer}</p></article>)}</div>
        </section>
        <p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-muted"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-brand" /> SiteCare Pulse is an early release. Verify critical workflows and access controls with test accounts before storing confidential customer information.</p>
      </div>
    </main>
  );
}
