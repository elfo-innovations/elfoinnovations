-- Get Started form (public.leads) currently only emails the admin on insert —
-- unlike developer_applications, it never inserts into public.notifications,
-- so the admin never gets a push notification for new leads.
-- This mirrors the existing public.notify_developer_application() trigger.
CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_ids uuid[]; a uuid;
BEGIN
  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';
  IF admin_ids IS NOT NULL THEN
    FOREACH a IN ARRAY admin_ids LOOP
      INSERT INTO public.notifications (user_id, title, body, link, category)
      VALUES (
        a,
        'New inquiry received',
        NEW.full_name || ' — ' || NEW.lead_code,
        '/admin/leads',
        'lead'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_new_lead() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_leads_notify ON public.leads;
CREATE TRIGGER trg_leads_notify AFTER INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_lead();