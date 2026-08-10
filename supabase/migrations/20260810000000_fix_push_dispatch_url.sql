-- Fix stale webhook URL left over from the Lovable migration.
-- Replace 'https://elfoinnovations.com' below with your actual deployed domain if different.

CREATE OR REPLACE FUNCTION public.dispatch_push_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://elfoinnovations.com/api/public/hooks/dispatch-push', -- confirmed domain
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_457hgbemElU2_JfDl8zMyQ_ct93W_44' -- same key used elsewhere in the old trigger, or regednerate
    ),
    body := jsonb_build_object('notification_id', NEW.id::text)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;


