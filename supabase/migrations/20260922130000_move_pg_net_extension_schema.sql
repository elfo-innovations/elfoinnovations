-- Finding 13 — pg_net extension registered in the public schema.
--
-- pg_net is NOT relocatable (pg_extension.extrelocatable = false), so
-- `ALTER EXTENSION pg_net SET SCHEMA ...` is rejected by Postgres outright.
-- The only way to change which schema it's registered under is to drop and
-- recreate it there, which is also what Supabase's own default project
-- setup does (CREATE EXTENSION pg_net SCHEMA extensions).
--
-- Note this does NOT move net.http_post to extensions.http_post: pg_net
-- always creates its actual objects (http_post, http_get, http_request_queue,
-- etc.) in a fixed schema literally named "net", regardless of which schema
-- is passed to CREATE EXTENSION. That schema argument only changes the
-- extension's own bookkeeping entry (pg_extension.extnamespace), which is
-- what Supabase's linter checks. public.dispatch_push_for_notification()
-- keeps calling net.http_post unchanged; no code/migration elsewhere
-- references pg_net any other way (verified: net.http_post is called only
-- from that one function, and there were 0 rows queued in
-- net.http_request_queue at the time of this migration, so nothing in
-- flight is lost by the drop).
--
-- Verified live: after this migration, net.http_post still works
-- (test request to httpbin.org returned status_code 200 via
-- net._http_response), and dispatch_push_for_notification()'s body and its
-- trigger on public.notifications are both unchanged and still enabled.

DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
