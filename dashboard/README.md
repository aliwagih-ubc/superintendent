# Superintendent Dashboard

A Next.js (App Router) dashboard that reads the daemon's published data from Supabase. It is login-gated and has four views: Now (in-flight tickets, daemon health, slots), Cost (spend totals and breakdowns), History (finished tickets), and Ticket detail (sessions and cost events for one ticket). Updates arrive live via Supabase Realtime.

The dashboard is a standalone npm project, isolated from the daemon. It reads Supabase with the anon key plus the logged-in user's session. Postgres row-level security restricts reads to allowlisted users, so there are no server-side secrets.

## Prerequisites

Provision the Supabase project first (see `../supabase/README.md`). You need:

- The schema from `supabase/migrations/0001_init.sql` run in the project.
- Email and Google providers enabled in Supabase Auth (Authentication, Providers).
- Your email inserted into the `dashboard_users` table.
- The project URL and the anon key from Settings, API.

## Local development

```bash
cd dashboard
npm install
cp .env.local.example .env.local
```

Fill `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then run:

```bash
npm run dev
```

Open http://localhost:3000. You will be redirected to `/login` until you sign in with an allowlisted email.

## Deploy to Vercel

1. Import the repository in Vercel and set the project root directory to `dashboard/`.
2. Add the two environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy.

After deploying, add your Vercel URL to the Supabase Auth redirect allowlist (Authentication, URL Configuration) so the email and Google sign-in callbacks return to the right place.

## Tests

The cost aggregation helpers have unit tests. Run them from the repo root (which has `tsx`):

```bash
node --import tsx --test dashboard/lib/aggregate.test.ts
```
