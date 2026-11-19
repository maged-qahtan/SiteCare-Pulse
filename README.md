# SiteCare Pulse

**Agency Client Care Operations Platform**

SiteCare Pulse helps website agencies coordinate client requests, delivery work, service-level commitments, activity history, and client-ready reporting in one workspace.

## Current status

This repository contains the initial UI foundation and a dashboard preview using sample data. A Supabase Free project is provisioned and the database migrations are applied. The Next.js application is **not yet connected** to Supabase authentication or live data. Email, monitoring services, client-facing workflows, and billing are not configured.

## Product principles

- Multi-tenant by design: each agency's data must remain isolated.
- Client-visible accountability: requests, updates, evidence, and completed work have a clear history.
- SLA clarity: response and resolution commitments should be measurable.
- Proof of value: monthly reports should explain the work delivered.
- Cost discipline: use free tiers during validation and avoid paid infrastructure before revenue.

## Database foundation

The Supabase database has these migrations applied:

1. `20261119000000_initial_schema.sql` — organizations, team/client memberships, client accounts, sites, service requests, comments, activity events, and initial RLS policies.
2. `20261119010000_restrict_membership_admin.sql` — limits membership administration to organization owners and admins.
3. `20261119020000_harden_rls_helpers.sql` — moves RLS helper functions into the non-exposed `private` schema, updates policies, and adds foreign-key indexes.

The migration history in Supabase currently records the applied migrations. Temporary transaction-based SQL checks confirmed:
- An organization owner can see both test client accounts and is recognized as an admin.
- A client user can see only their linked client account, not another client's account.
- An unrelated user sees no client accounts and is not recognized as an organization member.

Those test records were rolled back; no test customer data was retained.

The Supabase security advisor currently reports one intentional warning for the authenticated `public.create_organization` SECURITY DEFINER RPC. It is designed to atomically create an organization and its first owner. The internal RLS helper functions are in the non-exposed `private` schema. The performance advisor currently reports unused indexes because the database has not yet had real workload; this is expected during initial setup.

**Important:** These checks are not a complete security certification or full end-to-end test suite. Before real customer data is used, add automated tests for every role and every read/write policy, validate the organization-creation RPC, and review the remaining advisor warning.

## Technology

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- Supabase Postgres and Row Level Security

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important

All figures, names, requests, dates, and performance metrics currently shown in the dashboard are illustrative sample data. Do not use them as real customer or SLA records.

## Planned development stages

1. Connect Supabase Auth to the existing Next.js application without exposing secret keys.
2. Implement sign-up/sign-in, organization onboarding, and session handling.
3. Add client accounts, sites, requests, comments, and activity workflows.
4. Add automated role-based RLS tests and end-to-end tests.
5. Add SLA rules, evidence attachments, and monthly reports.
6. Validate deployment and customer workflows; add billing only after payment availability is confirmed.
