CREATE TYPE public.application_status AS ENUM ('pending','accepted','rejected');

CREATE TABLE public.developer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  github_url text NOT NULL,
  linkedin_url text,
  portfolio_url text,
  primary_role text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  years_experience text NOT NULL,
  current_status text NOT NULL,
  bio text NOT NULL,
  motivation text NOT NULL,
  resume_path text,
  resume_name text,
  status public.application_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  decision_subject text,
  decision_message text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX developer_applications_email_uidx ON public.developer_applications (lower(email));

GRANT INSERT ON public.developer_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_applications TO authenticated;
GRANT ALL ON public.developer_applications TO service_role;

ALTER TABLE public.developer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a developer application"
  ON public.developer_applications FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view developer applications"
  ON public.developer_applications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update developer applications"
  ON public.developer_applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete developer applications"
  ON public.developer_applications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_dev_apps_updated BEFORE UPDATE ON public.developer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_developer_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE admin_ids uuid[]; a uuid;
BEGIN
  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role='admin';
  IF admin_ids IS NOT NULL THEN
    FOREACH a IN ARRAY admin_ids LOOP
      INSERT INTO public.notifications (user_id, title, body, link, category)
      VALUES (a, 'New developer application', NEW.full_name || ' applied as ' || NEW.primary_role, '/admin/developer-requests', 'application');
    END LOOP;
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.notify_developer_application() FROM anon, PUBLIC;

CREATE TRIGGER trg_dev_apps_notify AFTER INSERT ON public.developer_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_developer_application();