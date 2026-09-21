-- Finding 5 — authenticate the public push-dispatch webhook.
--
-- dispatch_push_for_notification() fires the trigger side of
-- src/routes/api/public/hooks/dispatch-push.ts, which is a public endpoint
-- with no auth of its own. This adds a shared secret, read from Vault, sent
-- as the x-webhook-secret header. The endpoint now rejects any request that
-- doesn't present the matching secret (see dispatch-push.ts for the
-- constant-time comparison on that side).
--
-- The Vault secret itself ('webhook_dispatch_secret') is NOT set by this
-- migration — secret values are data, not schema, and don't belong in a
-- committed migration file. It must already exist (via
-- select vault.create_secret(value, 'webhook_dispatch_secret', ...)) before
-- this function is relied on; if the name is missing, decrypted_secret is
-- NULL and coalesce() below sends an empty header, which the endpoint's
-- fail-closed check will correctly reject rather than accept.
--
-- The same value must also be set as a Cloudflare Worker *secret* (never a
-- plain [vars] entry in wrangler.toml, which is stored unencrypted):
--   wrangler secret put WEBHOOK_DISPATCH_SECRET

CREATE OR REPLACE FUNCTION public.dispatch_push_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  RETURN NEW;
END;
$$;
