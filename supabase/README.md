# Supabase Provisioning

Superintendent can publish cost, ticket, session, and heartbeat data to a Supabase project so you can access a hosted web dashboard. This is optional. Without these steps the daemon runs fully local.

## Steps

1. Create a Supabase project at https://supabase.com. Free tier is sufficient.

2. Open the SQL editor in your project dashboard. Paste the contents of `migrations/0001_init.sql` and run it. This creates the four data tables, the dashboard user allowlist, and row-level security policies.

3. Add your email to the allowlist so the dashboard can read data. In the SQL editor run:

   ```sql
   insert into dashboard_users (email) values ('your@email.com');
   ```

4. Copy your credentials from the project Settings page (API section):
   - Project URL (starts with `https://`)
   - Service role key (secret, used by the daemon for writes)
   - Anon key (public, used by the dashboard for reads)

5. Add the daemon credentials to `.env` in the Superintendent directory:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   The daemon will detect these on next start and begin publishing.

6. Pass the project URL and anon key to the dashboard (Plan 3). The dashboard reads data as an allowlisted authenticated user via Supabase Auth.

## Notes

The service role key bypasses row-level security. Keep it in `.env` and do not commit it. The anon key is safe to include in client-side dashboard code because RLS blocks all reads from unauthenticated or non-allowlisted users.
