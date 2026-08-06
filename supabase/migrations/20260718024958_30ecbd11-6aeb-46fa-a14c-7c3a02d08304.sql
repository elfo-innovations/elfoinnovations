
CREATE TABLE public.before_after_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  category text,
  before_image_url text,
  after_image_url text,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.before_after_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.before_after_items TO authenticated;
GRANT ALL ON public.before_after_items TO service_role;
ALTER TABLE public.before_after_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active before/after" ON public.before_after_items FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage before/after" ON public.before_after_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.portfolio_projects ADD COLUMN IF NOT EXISTS github_url text;
