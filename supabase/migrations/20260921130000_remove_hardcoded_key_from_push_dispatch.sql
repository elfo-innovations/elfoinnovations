-- Remove the hardcoded apikey header from the push dispatch trigger function.
-- The /api/public/hooks/dispatch-push endpoint does not validate this header
-- (it only reads notification_id and uses server-side credentials), so no
-- secret needs to live in SQL.

CREATE OR REPLACE FUNCTION public.dispatch_push_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://elfoinnovations.com/api/public/hooks/dispatch-push',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('notification_id', NEW.id::text)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
