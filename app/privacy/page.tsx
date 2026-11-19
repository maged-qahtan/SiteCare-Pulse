import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy notice", description: "Draft privacy information for the SiteCare Pulse preview." };

export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#f5f7f5] text-ink"><article className="mx-auto max-w-3xl px-5 py-14">
    <Link href="/" className="text-sm font-semibold text-brand">← SiteCare Pulse</Link>
    <p className="mt-8 text-xs font-bold uppercase tracking-[.16em] text-brand">Privacy · Draft for review</p>
    <h1 className="mt-3 text-4xl font-bold">Privacy notice</h1>
    <p className="mt-4 text-sm text-muted">Last updated: 20 November 2026</p>
    <div className="mt-8 space-y-7 text-sm leading-7 text-muted">
      <section><h2 className="font-bold text-ink">1. Scope and operator</h2><p>This draft describes information processed by the SiteCare Pulse early-access application. The operator&apos;s full legal name, business address, and privacy contact must be added before commercial launch. This notice is not a final jurisdiction-specific privacy disclosure.</p></section>
      <section><h2 className="font-bold text-ink">2. Information processed</h2><p>The application may process account email and authentication identifiers; workspace, team, and client records; website details; service requests, comments, status and activity history; and files or evidence that users upload. Do not submit passwords, payment-card data, government identifiers, or unnecessary sensitive personal information.</p></section>
      <section><h2 className="font-bold text-ink">3. Purposes</h2><p>Information is used to authenticate users, operate workspaces, provide client-care workflows, maintain activity records, generate reports, protect the service, and troubleshoot errors.</p></section>
      <section><h2 className="font-bold text-ink">4. Service providers and transfers</h2><p>The preview uses Supabase for database, authentication, and file storage services, and Cloudflare Pages for application hosting and delivery. These providers may process data in infrastructure regions outside a user&apos;s country. Provider terms and applicable transfer safeguards should be reviewed before production use.</p></section>
      <section><h2 className="font-bold text-ink">5. Retention and security</h2><p>Records are retained while the relevant workspace and service remain active unless deleted or otherwise required by law. Access controls and database row-level security are used, but no internet service can guarantee absolute security. Independent backups and restore testing are not yet an assured managed feature.</p></section>
      <section><h2 className="font-bold text-ink">6. Your choices and rights</h2><p>Depending on applicable law, individuals may have rights to access, correct, delete, restrict, or object to processing and may lodge a complaint with a competent authority. A verified privacy contact and process for handling these requests must be published before launch.</p></section>
      <section><h2 className="font-bold text-ink">7. Cookies and analytics</h2><p>Authentication and session technologies are required for signed-in features. No optional analytics or advertising tracking is intentionally described as active in this preview. Confirm the deployed configuration before relying on this statement.</p></section>
      <section><h2 className="font-bold text-ink">8. Children and changes</h2><p>The service is intended for business users and is not designed for children. This notice may be updated as the product and its providers change.</p></section>
      <section><h2 className="font-bold text-ink">9. Before public launch</h2><p>Add the operator&apos;s legal identity and contact, applicable legal bases, retention periods, subprocessors, cross-border transfer details, request process, and any legally required disclosures. Obtain jurisdiction-specific legal review.</p></section>
    </div>
    <p className="mt-10 border-t border-line pt-5 text-xs text-muted"><Link href="/terms/" className="text-brand">Read the terms of use</Link> · <Link href="/pricing/" className="text-brand">Pricing and early access</Link></p>
  </article></main>;
}
