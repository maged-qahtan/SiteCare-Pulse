import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of use", description: "Draft terms for the SiteCare Pulse early-access preview." };

export default function TermsPage() {
  return <main className="min-h-screen bg-[#f5f7f5] text-ink"><article className="mx-auto max-w-3xl px-5 py-14">
    <Link href="/" className="text-sm font-semibold text-brand">← SiteCare Pulse</Link>
    <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-brand">Legal · Draft for review</p>
    <h1 className="mt-3 text-4xl font-bold">Terms of use</h1>
    <p className="mt-4 text-sm text-muted">Last updated: 20 November 2026</p>
    <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
      <section><h2 className="font-bold text-ink">1. Preview service</h2><p>SiteCare Pulse is an early-access software preview for organising agency clients, websites, service requests, work history, and reports. Features may change, be unavailable, or be discontinued while the service is evaluated.</p></section>
      <section><h2 className="font-bold text-ink">2. Account responsibility</h2><p>You must provide accurate account information, protect your credentials, and promptly notify the service operator if you suspect unauthorised access. You are responsible for actions performed through your account.</p></section>
      <section><h2 className="font-bold text-ink">3. Acceptable use</h2><p>Do not misuse the service, attempt to access another workspace, upload unlawful or malicious content, interfere with service operation, or use the service in violation of applicable law.</p></section>
      <section><h2 className="font-bold text-ink">4. Customer data</h2><p>You retain responsibility for the information and files you submit and must have the rights and permissions needed to process them. Workspace access is intended to be restricted by account roles and database policies, but the preview is not a substitute for an independently verified security programme.</p></section>
      <section><h2 className="font-bold text-ink">5. Availability, backups, and support</h2><p>The preview is provided on an as-available basis. No uptime, recovery-time, backup-retention, or support-response guarantee is offered. Do not store the only copy of important records here. Maintain independent copies of critical data.</p></section>
      <section><h2 className="font-bold text-ink">6. Fees and billing</h2><p>No automatic subscription billing or payment processing is enabled in the current preview. Any paid pilot or future subscription must be described and accepted separately before payment is due.</p></section>
      <section><h2 className="font-bold text-ink">7. Suspension and termination</h2><p>Access may be suspended where reasonably necessary to protect the service, users, or data, or to address misuse. You should export information you need while access is available.</p></section>
      <section><h2 className="font-bold text-ink">8. Disclaimer and liability</h2><p>To the extent permitted by applicable law, the preview is supplied without warranties and the operator is not liable for indirect or consequential loss. Nothing in these terms excludes liability that cannot legally be excluded.</p></section>
      <section><h2 className="font-bold text-ink">9. Contact and governing terms</h2><p>Before public commercial launch, the operator's legal identity, contact address, governing law, dispute process, and any mandatory consumer disclosures must be completed and reviewed by qualified counsel. These draft terms are not legal advice and are not yet a final customer contract.</p></section>
    </div>
    <p className="mt-10 border-t border-line pt-5 text-xs text-muted"><Link href="/privacy/" className="text-brand">Read the privacy notice</Link> · <Link href="/pricing/" className="text-brand">Pricing and early access</Link></p>
  </article></main>;
}
