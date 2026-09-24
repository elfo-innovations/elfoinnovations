-- FAQ categories + per-question slug / featured flag.
-- ADDITIVE ONLY: no existing faqs rows are deleted or recreated; existing RLS
-- policies on public.faqs ("Public read active faqs", "Admins manage faqs") are untouched.

-- 1) Categories -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.faq_categories FROM anon, authenticated;
GRANT SELECT ON public.faq_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_categories TO authenticated;
GRANT ALL ON public.faq_categories TO service_role;

DROP POLICY IF EXISTS "Public read active faq categories" ON public.faq_categories;
CREATE POLICY "Public read active faq categories" ON public.faq_categories
  FOR SELECT TO anon, authenticated USING (is_active = true OR public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins manage faq categories" ON public.faq_categories;
CREATE POLICY "Admins manage faq categories" ON public.faq_categories
  FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

DROP TRIGGER IF EXISTS trg_faq_categories_updated ON public.faq_categories;
CREATE TRIGGER trg_faq_categories_updated BEFORE UPDATE ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) New columns on faqs (nullable / defaulted, so existing rows stay valid) --
ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.faq_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS faqs_category_id_idx ON public.faqs (category_id);
CREATE UNIQUE INDEX IF NOT EXISTS faqs_slug_key ON public.faqs (slug) WHERE slug IS NOT NULL;

-- 3) Stable, human-readable anchor slug generated from the question ----------
CREATE OR REPLACE FUNCTION public.faqs_set_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base := btrim(regexp_replace(lower(NEW.question), '[^a-z0-9]+', '-', 'g'), '-');
    base := left(coalesce(nullif(base, ''), 'faq'), 70);
    base := btrim(base, '-');
    candidate := base;
    IF EXISTS (SELECT 1 FROM public.faqs WHERE slug = candidate AND id <> NEW.id) THEN
      candidate := base || '-' || substr(NEW.id::text, 1, 4);
    END IF;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.faqs_set_slug() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_faqs_set_slug ON public.faqs;
CREATE TRIGGER trg_faqs_set_slug BEFORE INSERT ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.faqs_set_slug();

-- Backfill slugs for the existing rows (update only; nothing is deleted).
WITH s AS (
  SELECT id,
         left(btrim(left(coalesce(nullif(btrim(regexp_replace(lower(question), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'faq'), 70), '-'), 70) AS base,
         row_number() OVER (
           PARTITION BY left(btrim(left(coalesce(nullif(btrim(regexp_replace(lower(question), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'faq'), 70), '-'), 70)
           ORDER BY sort_order, id
         ) AS rn
  FROM public.faqs WHERE slug IS NULL
)
UPDATE public.faqs f
SET slug = CASE WHEN s.rn = 1 THEN s.base ELSE s.base || '-' || substr(f.id::text, 1, 4) END
FROM s WHERE f.id = s.id;

-- 4) Seed the four categories and file the existing 14 questions -------------
INSERT INTO public.faq_categories (name, slug, description, sort_order) VALUES
  ('General Questions',   'general',            'About ELFO Innovations, our services and who we work with.', 10),
  ('Pricing & Payments',  'pricing-payments',   'How our pay-after-you-see-it model, contracts and payments work.', 20),
  ('Process & Delivery',  'process-delivery',   'How we build, review and deliver your project.', 30),
  ('Support & Technical', 'support-technical',  'Hosting, migrations and post-launch support.', 40)
ON CONFLICT (slug) DO NOTHING;

-- Only touches rows that have no category yet, so re-running never overrides admin edits.
UPDATE public.faqs f
SET category_id = c.id
FROM (VALUES
  ('ec5db278-2cd4-4684-92a7-618561647579'::uuid, 'general'),
  ('92bef6f4-cf80-4b48-a90d-0c9db047fef8'::uuid, 'general'),
  ('bf829778-325a-48a0-8c8d-eb5522537e66'::uuid, 'general'),
  ('d130cfab-d4ac-4cf0-b0c3-6a347201e102'::uuid, 'general'),
  ('828042ca-3969-48eb-af92-047130dafc31'::uuid, 'pricing-payments'),
  ('fcb08b5d-e430-490a-aaa0-09eaeadc709f'::uuid, 'pricing-payments'),
  ('4e063a0b-28ec-461f-9e4a-5a03013f2b8f'::uuid, 'pricing-payments'),
  ('55fd2402-4b2d-44bb-975c-34f43df1fe94'::uuid, 'process-delivery'),
  ('742be6f1-7d11-4070-a93a-f0c6de24dc59'::uuid, 'process-delivery'),
  ('f3d947ce-f625-4c8b-9552-43f4ae3c26ac'::uuid, 'process-delivery'),
  ('1430a968-ff56-43c0-bfd1-d99f6a8f3944'::uuid, 'process-delivery'),
  ('d15a35ef-b8b2-4668-827a-715c505819e0'::uuid, 'support-technical'),
  ('34798054-a2e4-49cc-963e-a4b76d9d8b69'::uuid, 'support-technical'),
  ('9cd58372-9541-4e16-86fe-e405e330d7ca'::uuid, 'support-technical')
) AS m(faq_id, cat_slug)
JOIN public.faq_categories c ON c.slug = m.cat_slug
WHERE f.id = m.faq_id AND f.category_id IS NULL;

-- Home page keeps showing the same first six questions it shows today.
UPDATE public.faqs SET is_featured = true
WHERE sort_order <= 60 AND NOT is_featured
  AND NOT EXISTS (SELECT 1 FROM public.faqs WHERE is_featured);

-- 5) Navbar link (navbar reads public.nav_links; FALLBACK in Navbar.tsx is only for an empty table)
INSERT INTO public.nav_links (label, href, sort_order, is_enabled)
SELECT 'FAQ', '/faqs', 45, true
WHERE NOT EXISTS (SELECT 1 FROM public.nav_links WHERE href = '/faqs');
