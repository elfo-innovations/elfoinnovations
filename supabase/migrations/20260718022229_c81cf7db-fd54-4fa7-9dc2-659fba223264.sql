
-- WEBSITE SECTIONS: seed + policies
INSERT INTO public.website_sections (section_key, title, sort_order, is_enabled)
SELECT * FROM (VALUES
  ('hero','Hero',10,true),
  ('showcase','Before & After',20,true),
  ('services','Services',30,true),
  ('about','About',40,true),
  ('pricing','Pricing',50,true),
  ('offers','Offers',55,true),
  ('testimonials','Testimonials',60,true),
  ('faq','FAQ',70,true),
  ('cta','Call To Action',80,true)
) AS v(section_key,title,sort_order,is_enabled)
ON CONFLICT (section_key) DO NOTHING;

DROP POLICY IF EXISTS "Public read enabled website sections" ON public.website_sections;
CREATE POLICY "Public read enabled website sections" ON public.website_sections
  FOR SELECT TO anon, authenticated USING (is_enabled = true);
DROP POLICY IF EXISTS "Admins manage website sections" ON public.website_sections;
CREATE POLICY "Admins manage website sections" ON public.website_sections
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.website_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_sections TO authenticated;
GRANT ALL ON public.website_sections TO service_role;

-- HERO CONTENT
CREATE TABLE IF NOT EXISTS public.hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow text,
  heading text NOT NULL DEFAULT 'Software that ships. Delivery you can trust.',
  highlight text DEFAULT 'ships.',
  description text DEFAULT 'ELFO INNOVATIONS designs, builds, and hosts world-class software with a supervised 4-stage pipeline.',
  primary_cta_label text DEFAULT 'Start your project',
  primary_cta_action text DEFAULT 'inquiry',
  secondary_cta_label text DEFAULT 'See our work',
  secondary_cta_href text DEFAULT '/portfolio',
  image_url text,
  trust_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_content TO authenticated;
GRANT ALL ON public.hero_content TO service_role;
ALTER TABLE public.hero_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read hero" ON public.hero_content;
CREATE POLICY "Public read hero" ON public.hero_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage hero" ON public.hero_content;
CREATE POLICY "Admins manage hero" ON public.hero_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_hero_updated ON public.hero_content;
CREATE TRIGGER trg_hero_updated BEFORE UPDATE ON public.hero_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.hero_content (heading, highlight, description, trust_items)
SELECT 'Software that ships. Delivery you can trust.','ships.',
  'ELFO INNOVATIONS designs, builds, and hosts world-class software with a supervised 4-stage pipeline.',
  '[{"label":"120+ shipped"},{"label":"4.9/5 client rating"},{"label":"Enterprise-grade delivery"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.hero_content);

-- NAV LINKS
CREATE TABLE IF NOT EXISTS public.nav_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nav_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nav_links TO authenticated;
GRANT ALL ON public.nav_links TO service_role;
ALTER TABLE public.nav_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read nav" ON public.nav_links;
CREATE POLICY "Public read nav" ON public.nav_links FOR SELECT TO anon, authenticated USING (is_enabled = true);
DROP POLICY IF EXISTS "Admins manage nav" ON public.nav_links;
CREATE POLICY "Admins manage nav" ON public.nav_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_nav_updated ON public.nav_links;
CREATE TRIGGER trg_nav_updated BEFORE UPDATE ON public.nav_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.nav_links (label, href, sort_order)
SELECT * FROM (VALUES ('Services','/services',10),('Portfolio','/portfolio',20),('Pricing','/pricing',30),('About','/about',40)) AS v(label,href,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.nav_links);

-- PROMO BANNERS
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position text NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  background_color text,
  cta_label text,
  cta_href text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promo_banners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_banners TO authenticated;
GRANT ALL ON public.promo_banners TO service_role;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active banners" ON public.promo_banners;
CREATE POLICY "Public read active banners" ON public.promo_banners FOR SELECT TO anon, authenticated
  USING (is_active = true AND (start_at IS NULL OR start_at <= now()) AND (end_at IS NULL OR end_at >= now()));
DROP POLICY IF EXISTS "Admins manage banners" ON public.promo_banners;
CREATE POLICY "Admins manage banners" ON public.promo_banners FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_promo_updated ON public.promo_banners;
CREATE TRIGGER trg_promo_updated BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ABOUT CONTENT
CREATE TABLE IF NOT EXISTS public.about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eyebrow text DEFAULT 'About ELFO',
  title text NOT NULL DEFAULT 'A full-service software company built for delivery.',
  description text,
  mission text,
  vision text,
  image_url text,
  stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  why_us jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.about_content TO authenticated;
GRANT ALL ON public.about_content TO service_role;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read about" ON public.about_content;
CREATE POLICY "Public read about" ON public.about_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage about" ON public.about_content;
CREATE POLICY "Admins manage about" ON public.about_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_about_updated ON public.about_content;
CREATE TRIGGER trg_about_updated BEFORE UPDATE ON public.about_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.about_content (description, mission, vision, why_us, stats)
SELECT 'ELFO INNOVATIONS partners with founders, growing businesses, and enterprises to design, engineer, and ship software.',
  'Make world-class software delivery accessible to every ambitious team.',
  'Set the global standard for transparent, outcome-first software development.',
  '[{"title":"Zero-risk delivery","description":"You approve every stage before you pay."},{"title":"Cross-functional team","description":"Design, frontend, backend, cloud."},{"title":"Enterprise pipeline","description":"Frontend, Backend, Database, Hosting."},{"title":"Real-time transparency","description":"Chat and track progress live."}]'::jsonb,
  '[{"label":"Projects shipped","value":"120+"},{"label":"Client rating","value":"4.9/5"},{"label":"Avg. time to launch","value":"3 wks"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.about_content);

-- SERVICES extend + policies
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url text;
DROP POLICY IF EXISTS "Public read visible services" ON public.services;
CREATE POLICY "Public read visible services" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
INSERT INTO public.services (title, description, icon, sort_order)
SELECT * FROM (VALUES
  ('Web Development','Modern, blazing-fast websites and web apps.','Globe',10),
  ('Mobile Development','iOS and Android apps that feel native.','Smartphone',20),
  ('Cloud Solutions','Scalable, cost-effective cloud architectures.','Cloud',30),
  ('E-Commerce','Storefronts that convert and scale.','ShoppingCart',40),
  ('Custom Software','Bespoke systems for unique operations.','Code2',50),
  ('UI/UX Design','Design that users actually love.','Palette',60)
) AS v(title,description,icon,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.services);

-- PRICING
DROP POLICY IF EXISTS "Public read visible pricing" ON public.pricing_plans;
CREATE POLICY "Public read visible pricing" ON public.pricing_plans FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage pricing" ON public.pricing_plans;
CREATE POLICY "Admins manage pricing" ON public.pricing_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.pricing_plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_plans TO authenticated;
GRANT ALL ON public.pricing_plans TO service_role;
INSERT INTO public.pricing_plans (name, price, description, features, is_popular, sort_order)
SELECT * FROM (VALUES
  ('Starter','$500','For new founders','{"Landing page","Contact form","1 revision round","Hosting setup"}'::text[],false,10),
  ('Professional','$1,000','Growing businesses','{"Multi-page site","CMS","2 revision rounds","SEO basics","Analytics"}'::text[],true,20),
  ('Business','$1,500','Full web platform','{"Custom design","Advanced CMS","Integrations","Priority support"}'::text[],false,30),
  ('Enterprise','Custom','Bespoke systems','{"Everything in Business","Custom architecture","SLA","Dedicated team"}'::text[],false,40)
) AS v(name,price,description,features,is_popular,sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_plans);

-- PORTFOLIO
ALTER TABLE public.portfolio_projects
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technologies text[] NOT NULL DEFAULT '{}'::text[];
DROP POLICY IF EXISTS "Public read visible portfolio" ON public.portfolio_projects;
CREATE POLICY "Public read visible portfolio" ON public.portfolio_projects FOR SELECT TO anon, authenticated USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage portfolio" ON public.portfolio_projects;
CREATE POLICY "Admins manage portfolio" ON public.portfolio_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.portfolio_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_projects TO authenticated;
GRANT ALL ON public.portfolio_projects TO service_role;

-- TESTIMONIALS
DROP POLICY IF EXISTS "Admins manage testimonials" ON public.testimonials;
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

-- FAQS
DROP POLICY IF EXISTS "Admins manage faqs" ON public.faqs;
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;

-- OFFERS
DROP POLICY IF EXISTS "Public read active offers" ON public.offers;
CREATE POLICY "Public read active offers" ON public.offers FOR SELECT TO anon, authenticated
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));
DROP POLICY IF EXISTS "Admins manage offers" ON public.offers;
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT SELECT ON public.offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;

-- MEDIA LIBRARY
ALTER TABLE public.media_library
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS folder text,
  ADD COLUMN IF NOT EXISTS alt_text text;
DROP POLICY IF EXISTS "Admins manage media" ON public.media_library;
CREATE POLICY "Admins manage media" ON public.media_library FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Public read media" ON public.media_library;
CREATE POLICY "Public read media" ON public.media_library FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.media_library TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_library TO authenticated;
GRANT ALL ON public.media_library TO service_role;

-- STORAGE: website-media (private bucket)
DROP POLICY IF EXISTS "Read website-media" ON storage.objects;
CREATE POLICY "Read website-media" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'website-media');
DROP POLICY IF EXISTS "Admins write website-media" ON storage.objects;
CREATE POLICY "Admins write website-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'website-media' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins update website-media" ON storage.objects;
CREATE POLICY "Admins update website-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'website-media' AND public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Admins delete website-media" ON storage.objects;
CREATE POLICY "Admins delete website-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'website-media' AND public.has_role(auth.uid(),'admin'));

-- REALTIME
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='website_sections') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.website_sections; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='promo_banners') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_banners; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='offers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offers; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='hero_content') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hero_content; END IF;
END $$;
