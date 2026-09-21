-- Finding 5 — authenticate the push-dispatch webhook call.
--
-- The endpoint at /api/public/hooks/dispatch-push is reachable by anyone on
-- the internet and previously accepted any notification_id with no auth, so it
-- could be replayed to spam a user or probe which notification IDs exist.
--
-- This migration makes the trigger send a shared secret on every call. The
-- secret value is NOT stored in this function body, because function source is
-- readable via pg_get_functiondef by any role with a direct connection. It is
-- read at call time from Supabase Vault instead, so the value never appears in
-- this migration, in git, or in the schema dump.
--
-- Prerequisite (see the deploy note in dispatch-push.ts):
--   1. Create the Vault secret named 'webhook_dispatch_secret'.
--   2. Set the SAME value as the Cloudflare secret WEBHOOK_DISPATCH_SECRET
--      (wrangler secret put, or dashboard > Settings > Variables and secrets,
--      type "Secret" -- NOT a plain [vars] entry in wrangler.toml).
--
-- Migration history note: this function body was first applied to the live
-- database as version 20260921121937. It is filed here as 20260921141000 so
-- that it sorts AFTER 20260921130000_remove_hardcoded_key_from_push_dispatch,
-- which otherwise overwrites it on a fresh replay and drops the header. This
-- is the single canonical webhook-secret migration; the function body is
-- identical to what is live, and CREATE OR REPLACE makes re-applying it safe.
--
-- Until both are set the header is sent as an empty string. That is safe:
-- the endpoint only began rejecting unauthenticated calls in the accompanying
-- code change, which is deployed after the secrets are in place.

CREATE OR REPLACE FUNCTION public.dispatch_push_for_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_secret text;
BEGIN
  SELECT decrypted_secret
    INTO v_secret
    FROM vault.decrypted_secrets
   WHERE name = 'webhook_dispatch_secret'
   LIMIT 1;

  PERFORM net.http_post(
    url := 'https://elfoinnovations.com/api/public/hooks/dispatch-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object('notification_id', NEW.id::text)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let push dispatch failures block the originating write.
  RETURN NEW;
END;
$function$;
