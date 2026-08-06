
DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.client_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  company text,
  email text,
  title text NOT NULL,
  message text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  allow_public boolean NOT NULL DEFAULT false,
  status public.review_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.client_reviews (user_id);
CREATE INDEX ON public.client_reviews (status);
CREATE UNIQUE INDEX client_reviews_one_active_per_project ON public.client_reviews (user_id, COALESCE(project_id::text,'none')) WHERE status <> 'rejected';

GRANT SELECT, INSERT, UPDATE ON public.client_reviews TO authenticated;
GRANT SELECT ON public.client_reviews TO anon;
GRANT ALL ON public.client_reviews TO service_role;

ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved reviews" ON public.client_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND allow_public = true);

CREATE POLICY "Clients view own reviews" ON public.client_reviews
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Clients insert own reviews" ON public.client_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending' AND reviewed_by IS NULL);

CREATE POLICY "Admins view all reviews" ON public.client_reviews
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins moderate reviews" ON public.client_reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete reviews" ON public.client_reviews
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_client_reviews_updated
  BEFORE UPDATE ON public.client_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify admins on new review; notify client on status change
CREATE OR REPLACE FUNCTION public.notify_client_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE admin_ids uuid[]; a uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role='admin';
    IF admin_ids IS NOT NULL THEN
      FOREACH a IN ARRAY admin_ids LOOP
        INSERT INTO public.notifications (user_id, title, body, link, category)
        VALUES (a, 'New client review · Pending', NEW.client_name || ' submitted a ' || NEW.rating || '★ review', '/admin/reviews', 'review');
      END LOOP;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, link, category)
    VALUES (NEW.user_id,
      CASE WHEN NEW.status='approved' THEN 'Your review was approved' ELSE 'Update on your review' END,
      CASE WHEN NEW.status='approved' THEN 'Thank you! Your review is now live on our website.'
           WHEN NEW.status='rejected' THEN 'Your review was not published. Please contact us for details.'
           ELSE 'Status: ' || NEW.status::text END,
      '/client/reviews', 'review');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_client_reviews_notify
  AFTER INSERT OR UPDATE ON public.client_reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_client_review();
