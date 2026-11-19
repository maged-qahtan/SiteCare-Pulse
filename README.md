# SiteCare Pulse

**Agency Client Care Operations Platform**

SiteCare Pulse helps website agencies coordinate client requests, delivery work, service-level commitments, activity history, and client-ready reporting in one workspace.

## Current status

The repository contains the initial dashboard UI and a sample-data preview. A Supabase Free project is provisioned and the database migrations are applied. The repository now includes a browser-based Supabase Auth sign-in/sign-up foundation, an email callback page, a dashboard session gate, and sign-out control. Next.js is configured for static export so it can be hosted on Cloudflare Pages Free. The app is **not yet connected to live deployment credentials or tested with a real signup**.

Email delivery, production deployment, client-facing workflows, monitoring services, and billing are not configured.

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

Temporary transaction-based SQL checks confirmed:
- An organization owner can see both test client accounts and is recognized as an admin.
- A client user can see only their linked client account, not another client's account.
- An unrelated user sees no client accounts and is not recognized as an organization member.

Those test records were rolled back; no test customer data was retained.

The Supabase security advisor currently reports one intentional warning for the authenticated `public.create_organization` SECURITY DEFINER RPC. It is designed to atomically create an organization and its first owner. This RPC still needs a dedicated authenticated-user test before production use. The performance advisor currently reports unused indexes because the database has not yet had real workload; this is expected during initial setup.

**Important:** These checks are not a complete security certification or full end-to-end test suite. Before real customer data is used, add automated tests for every role and every read/write policy, validate the organization-creation RPC, and review the remaining advisor warning.

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

Do not put a Supabase `service_role` or secret key in browser-visible environment variables or commit secrets to GitHub. The middleware leaves preview routes accessible until both public values are configured; once configured, it verifies Supabase JWT claims before protecting the dashboard.

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

All figures, names, requests, dates, and performance metrics currently shown in the dashboard are illustrative sample data. Do not use them as real customer or SLA records.

## Planned development stages

1. Deploy the app on a free hosting tier that permits the intended use.
2. Add the Supabase URL and publishable key as deployment environment variables.
3. Configure Supabase Auth site and redirect URLs; test signup, email confirmation, login, and logout.
4. Implement organization onboarding using the `create_organization` RPC.
5. Connect client accounts, sites, requests, comments, and activity workflows to live data.
6. Add automated role-based RLS tests, SLA rules, evidence attachments, and monthly reports.
7. Validate payment availability and billing only after the product is ready.
