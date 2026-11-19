import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing and early access",
  description: "Transparent early-access information for SiteCare Pulse."
};

export default function PricingPage() {
  return <main className="min-h-screen bg-[#f5f7f5] text-ink">
    <header className="border-b border-line bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
      <Link href="/" className="flex items-center gap-2 font-bold"><Activity className="text-brand"/> SiteCare Pulse</Link>
      <Link href="/login/" className="text-sm font-semibold text-brand">Sign in</Link>
    </div></header>
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Pricing</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Early access, with clear expectations.</h1>
      <p className="mt-5 text-base leading-8 text-muted">SiteCare Pulse is in an early product release. We are validating the workflow with a small number of agencies before publishing fixed subscription prices.</p>
      <div className="mt-9 rounded-2xl border border-line bg-white p-7 shadow-sm">
        <div className="text-sm font-bold text-brand">Early access</div>
        <div className="mt-2 text-3xl font-bold">Pilot terms agreed in advance</div>
        <p className="mt-3 text-sm leading-7 text-muted">No automatic billing or payment is enabled in this preview. Any pilot fee, included usage, support scope, and future subscription price will be confirmed in writing before a customer commits.</p>
        <ul className="mt-6 space-y-3 text-sm">{["Client and website records","Service request workflow and activity history","Priority-based response and resolution targets","Monthly work log and CSV export"].map(x=><li key={x} className="flex gap-2"><CheckCircle2 size={17} className="shrink-0 text-brand"/>{x}</li>)}</ul>
        <Link href="/login/?mode=signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Explore the preview <ArrowRight size={16}/></Link>
      </div>
      <p className="mt-6 text-xs leading-6 text-muted">Availability, onboarding, email delivery, backup arrangements, and support response times are subject to the current preview limitations. Do not use the preview as the sole repository for critical business records.</p>
    </section>
    <footer className="border-t border-line bg-white px-5 py-6 text-center text-xs text-muted">© 2026 SiteCare Pulse · <Link className="text-brand" href="/terms/">Terms</Link> · <Link className="text-brand" href="/privacy/">Privacy</Link></footer>
  </main>;
}
