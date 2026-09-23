-- Finding: anonymous clients could INSERT directly into public.leads and
-- public.developer_applications via the PostgREST API using only the
-- public anon key, bypassing the Turnstile verification and validation
-- that the public Contact/Lead form and Developer Application form perform
-- server-side (see src/lib/leads.functions.ts and
-- src/lib/developer-applications.functions.ts). Both forms already submit
-- exclusively through server functions that use the service-role client
-- (supabaseAdmin), which bypasses RLS entirely — so neither table needs an
-- anon/authenticated INSERT policy or grant for legitimate submissions to
-- keep working.

-- leads: remove the permissive "Anyone submits a lead" INSERT policy and
-- the underlying anon/authenticated INSERT grant. Admin SELECT/UPDATE/DELETE
-- policies are untouched.
DROP POLICY IF EXISTS "Anyone submits a lead" ON public.leads;
REVOKE INSERT ON public.leads FROM anon, authenticated;

-- developer_applications: same fix, mirroring the leads table.
DROP POLICY IF EXISTS "Anyone can submit a developer application" ON public.developer_applications;
REVOKE INSERT ON public.developer_applications FROM anon, authenticated;
