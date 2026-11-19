import Link from "next/link";
import { Activity, ArrowLeft, CircleHelp } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-5 py-12 text-ink">
      <section className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white"><Activity size={23} /></span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-brand">404 · Page not found</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">We can’t find that page.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">The link may be outdated, or the page may have moved. Your workspace data has not been changed.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-bold text-white"><ArrowLeft size={15} /> Back to home</Link>
          <Link href="/help/" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-xs font-bold text-ink"><CircleHelp size={15} /> Help centre</Link>
        </div>
      </section>
    </main>
  );
}
