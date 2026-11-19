# SiteCare Pulse

**Agency Client Care Operations Platform**

SiteCare Pulse helps website agencies coordinate client requests, delivery work, service-level commitments, activity history, and client-ready reporting in one workspace.

## Current status

The application is deployed on Cloudflare Pages Free and connected to a Supabase Free project. A real owner account has successfully signed in, created an agency workspace, and created one client account. The live client-account and request pages have been opened against the database. The app includes browser-based Supabase Auth (including password-reset flow), agency onboarding, client account management, website portfolio management, service request creation and status management, request discussion comments, automatic activity history, and a monthly CSV work-report export. The public product landing page is at `/`, and the authenticated workspace dashboard is at `/dashboard/`. The dashboard summary reads live client, website, open-request, and resolved-request counts from Supabase. The latest-request list and activity history also use live records; no sample customer metrics are presented as real.

This is an early working MVP, not yet a production-ready commercial SaaS. The complete end-to-end workflow still needs verification, including registering a valid website, creating and updating a request, comments, client-role access, password recovery email delivery, and automated tenant-isolation tests. Automatic activity history is implemented for client creation, website registration, request creation and updates, and request comments. A monthly activity CSV export is available. SLA automation and breach notifications, evidence attachments, branded PDF reports, team invitations, and billing are not yet implemented.

## Product principles

- Multi-tenant by design: each agency's data must remain isolated.
- Client-visible accountability: requests, updates, evidence, and completed work have a clear history.
- SLA clarity: response and resolution commitments should be measurable.
- Proof of value: monthly reports should explain the work delivered.
- Cost discipline: use free tiers during validation and avoid paid infrastructure before revenue.

## Database foundation

The Supabase database currently records these applied migration versions, and the repository migration filenames are aligned to those versions:

1. `20261119002142_initial_schema.sql` — organizations, team/client memberships, client accounts, sites, service requests, comments, activity events, and initial RLS policies.
2. `20261119002208_restrict_membership_admin.sql` — limits membership administration to organization owners and admins.
3. `20261119002558_move_rls_helpers_to_private.sql` — moves internal RLS helper functions to the non-exposed `private` schema and updates policies.
4. `20261119002618_add_foreign_key_indexes.sql` — adds indexes to support foreign-key lookups.
5. `20261119021701_harden_create_organization_rpc.sql` — validates workspace names/slugs and locks down the function search path and grants.
6. `20261119021837_activity_event_triggers.sql` — automatically records key workspace activity in the activity_events table.
7. `20261119022422_enrich_activity_event_details.sql` — includes client references in request and comment events for accurate reporting.
8. `20261119022628_move_create_organization_definer_private.sql` — moves the SECURITY DEFINER implementation into the non-exposed private schema and leaves a SECURITY INVOKER RPC wrapper in public.\n9. `20261119023219_harden_private_rls_helper_search_paths.sql` — hardens all private RLS helper function search paths.

Temporary transaction-based SQL checks confirmed:
- An organization owner can see both test client accounts and is recognized as an admin.
- A client user can see only their linked client account, not another client's account.
- An unrelated user sees no client accounts and is not recognized as an organization member.

Those test records were rolled back; no test customer data was retained.

The workspace-creation RPC is exposed as a `SECURITY INVOKER` wrapper; its hardened `SECURITY DEFINER` implementation lives in the non-exposed `private` schema. All private RLS helper functions now use an empty search path with fully qualified object references. The latest Supabase security advisor no longer reports that function. One warning remains: leaked-password protection is disabled in Supabase Auth; enable it in the Supabase dashboard before production customer onboarding. The performance advisor currently reports unused indexes because the database has not yet had real workload; review them after usage data exists.

**Important:** These checks are not a complete security certification or full end-to-end test suite. Before real customer data is used, add automated tests for every role and every read/write policy, validate the organization-creation RPC, and revisit leaked-password protection only if the product later moves to a paid Supabase plan.

## Static deployment and authentication

The app is configured for Cloudflare Pages static hosting:

- Framework preset: Next.js (Static HTML Export)
- Build command: `npm run build`
- Build output directory: `out`
- Node.js version: `22` (pinned in `.node-version`)

The browser uses Supabase Auth. The dashboard's client-side session gate is a user-experience guard, not the data-security boundary. **Row Level Security in Supabase must protect every live data query and mutation.** Never put a Supabase service-role or secret key in the browser.

The app expects these public environment variables at deployment time:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not put a Supabase `service_role` or secret key in browser-visible environment variables or commit secrets to GitHub. The current dashboard gate runs in the browser and checks the signed-in Supabase user and organization membership. It is a navigation guard only, not server-side authorization. Supabase Row Level Security is the actual data-protection boundary and must remain enabled and correctly tested for every table and operation.

The Supabase Auth URL configuration must allow the deployed app's `https://<your-pages-domain>/auth/callback/` URL and the local development callback `http://localhost:3000/auth/callback/` before signup confirmation can be tested. Cloudflare Pages deployment must use the Free plan; do not enable paid Workers, Functions, or add-ons.

## Technology

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Supabase Postgres, Auth, and Row Level Security

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important

The authenticated dashboard metrics, request queue, and activity history use live workspace records. The public landing page contains a clearly labelled illustrative product preview, not customer metrics. Manual due dates can be set on requests and overdue open requests are highlighted; automated SLA policies and breach notifications are not yet implemented.

## Planned development stages

1. Complete authenticated end-to-end tests for the deployed owner and client workflows, including password recovery.
2. Register and verify a valid website, then test request creation, status changes, comments, activity history, and CSV export.
3. Add automated role-based RLS tests for every table and operation, including cross-tenant isolation.
4. Implement configurable SLA policies, response/resolution timers, and breach notifications.
5. Add secure evidence attachments and branded PDF reports.
6. Add team invitations and a more complete client portal experience.
7. Validate payment availability, pricing, and billing only after the product is ready.
