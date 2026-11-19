# SiteCare Pulse — operations and launch checklist

Updated: 2026-11-20

## Deployment architecture

- Production application: Cloudflare Pages project `sitecare-pulse1`.
- Static output: `out`; build command should remain `npm run build` / Next static export.
- Supabase project: `nrrebbachekyxjtqkssh`.
- A separate Cloudflare Workers Builds trigger was found for this repository. It runs `npm run build` then `npx wrangler deploy`, which is not the Pages deployment path. The build attempted OpenNext after the static export and failed looking for `.next/standalone/.next/server/pages-manifest.json`. Its branch filter was changed to a non-matching sentinel to prevent accidental Worker builds while preserving the trigger record. Do not delete the trigger or token until confirming no other dependency. Pages deployments remain the intended production path.

## Security change

Migration `20261120100000_owner_only_admin_grants_rls.sql` adds `private.is_org_owner(uuid)` and tightens INSERT/UPDATE RLS policies on `public.organization_members`. Only owners may grant or retain the `admin` role through direct table writes; admins can continue managing non-owner, non-admin members subject to existing helper rules. The migration does not modify membership rows.

Verification performed after migration:
- Confirmed policy definitions include owner-only checks for admin grants.
- Confirmed current organizations still have their original owner memberships.
- A simulated authenticated owner sees one organization and one membership in its scoped query.
- This is a scoped SQL/RLS smoke test, not a full independent-account end-to-end test. Do not describe cross-tenant isolation as fully certified until separately authenticated sessions for both tenants have been tested against every relevant table and Storage operation.

## Auth email setup

Password reset UI and callback routes exist, but external email delivery is blocked by Supabase's default SMTP restrictions. Configure a custom SMTP provider in Supabase Dashboard → Authentication → SMTP Settings, then set sender name/address, host, port, username, and password in the dashboard only. Never commit SMTP credentials or send them through chat.

In Authentication → URL Configuration:
- Site URL: `https://sitecare-pulse1.pages.dev`
- Allowed redirect URL: `https://sitecare-pulse1.pages.dev/auth/callback/`
- Local development callback if needed: `http://localhost:3000/auth/callback/`

After configuration, test a real signup confirmation and password reset to an external mailbox. Verify the reset link returns to `/reset-password/`. No email delivery is claimed until this test passes.

## Free-tier backup procedure

Supabase Free does not include the daily managed backups available on paid plans. Use a separate secure machine or trusted local device to maintain encrypted logical database exports and a separate copy of private Storage objects. Keep credentials out of the repository and chat.

Suggested manual database export (run locally after installing and authenticating the Supabase CLI):
```sh
supabase db dump --project-ref nrrebbachekyxjtqkssh -f sitecare-pulse-db.sql
```

Before adopting a repeatable schedule, verify current CLI syntax with `supabase db dump --help`, use a secure authenticated session, encrypt the resulting file, and store it outside the project and source repository. Export Storage object bytes separately; a database dump contains metadata, not the object contents.

Restore testing must be performed in a separate disposable test project/database, never over the production project. A valid restore test includes schema, rows, roles/policies/functions as appropriate, and actual Storage files. Supabase project branches may incur charges; do not create one without checking and approving the exact cost.

## Public pages

- `/pricing/`: early-access pricing disclosure; no checkout or recurring billing.
- `/terms/` and `/privacy/`: clearly labelled draft templates. They are not legal advice and are not ready as final commercial legal documents.
- Before commercial launch, insert operator legal identity and contact, governing law, data controller/processor roles, lawful bases, retention, subprocessor list, transfer safeguards, rights request process, and jurisdiction-specific terms reviewed by qualified counsel.

## Remaining launch gates

- Complete independent-account cross-tenant tests for every table, RPC, and Storage path.
- Verify SMTP and external mailbox signup/reset end to end.
- Create encrypted off-site database and Storage backups and demonstrate restore in isolated test environment.
- Decide whether to retain the disabled Worker trigger (recommended until dependencies are reviewed); do not enable it with the current incompatible command.
- Review public legal drafts and complete operator identity/contact details.
- Confirm production deployment, Pages build output, environment variables, and auth redirects after merging the release branch.
- Billing/payment integration is intentionally not enabled; verify provider availability and legal eligibility before any implementation.
