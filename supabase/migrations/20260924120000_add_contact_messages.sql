-- Public /contact page submissions.
-- Rows are inserted ONLY by the submitContactMessage server function
-- (src/lib/contact.functions.ts) using the service-role client after
-- Turnstile verification, so anon/authenticated get no INSERT grant/policy
-- (same model as public.leads after 20260923090000). Admins read/update/delete.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.contact_messages FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

DROP POLICY IF EXISTS "Admins read contact messages" ON public.contact_messages;
CREATE POLICY "Admins read contact messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins update contact messages" ON public.contact_messages;
CREATE POLICY "Admins update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins delete contact messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.current_user_is_admin());

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);

DROP TRIGGER IF EXISTS trg_contact_messages_updated ON public.contact_messages;
CREATE TRIGGER trg_contact_messages_updated BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- In-app (bell + push) notification for admins, mirroring public.notify_new_lead().
CREATE OR REPLACE FUNCTION public.notify_new_contact_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_ids uuid[]; a uuid;
BEGIN
  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';
  IF admin_ids IS NOT NULL THEN
    FOREACH a IN ARRAY admin_ids LOOP
      INSERT INTO public.notifications (user_id, title, body, link, category)
      VALUES (
        a,
        'New contact message',
        NEW.full_name || ' — ' || NEW.subject,
        '/admin/contact-messages',
        'contact'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.notify_new_contact_message() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_contact_messages_notify ON public.contact_messages;
CREATE TRIGGER trg_contact_messages_notify AFTER INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_contact_message();

-- Navbar link (the navbar reads public.nav_links; the FALLBACK list in
-- Navbar.tsx is only used when that table is empty).
INSERT INTO public.nav_links (label, href, sort_order, is_enabled)
SELECT 'Contact', '/contact', 50, true
WHERE NOT EXISTS (SELECT 1 FROM public.nav_links WHERE href = '/contact');
