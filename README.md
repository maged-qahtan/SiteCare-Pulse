# SiteCare Pulse

**Agency Client Care Operations Platform**

SiteCare Pulse helps website agencies coordinate client requests, delivery work, service-level commitments, activity history, and client-ready reporting in one workspace.

## Current status

This repository contains the initial UI foundation and a dashboard preview using sample data. It is not yet connected to authentication, a database, email, monitoring services, or billing.

## Product principles

- Multi-tenant by design: each agency's data must remain isolated.
- Client-visible accountability: requests, updates, evidence, and completed work have a clear history.
- SLA clarity: response and resolution commitments should be measurable.
- Proof of value: monthly reports should explain the work delivered.
- Cost discipline: use free tiers during validation and avoid paid infrastructure before revenue.

## Technology

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important

All figures, names, requests, dates, and performance metrics currently shown in the dashboard are illustrative sample data. Do not use them as real customer or SLA records.

## Planned development stages

1. Validate product workflows and refine the dashboard.
2. Add authentication and agency workspaces.
3. Implement tenant-safe database schema and access policies.
4. Add client accounts, requests, tasks, comments, and activity history.
5. Add SLA rules, evidence attachments, and monthly reports.
6. Add billing only after the product and payment availability are validated.