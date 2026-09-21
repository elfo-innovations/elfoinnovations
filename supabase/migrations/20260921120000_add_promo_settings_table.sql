-- promo_settings exists on the live database but was never captured in a
-- committed migration. This migration brings supabase/migrations in sync
-- with the live schema (ref gwkwpbrlrmqrsdjnnckb) so the repo can rebuild
-- the current schema from a clean database.

CREATE TABLE public.promo_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  marquee_text text NOT NULL DEFAULT '',
  marquee_enabled boolean NOT NULL DEFAULT false,
  theme text NOT NULL DEFAULT 'dark',
  hero_mode text NOT NULL DEFAULT 'off',
  hero_image_url text,
  theme_color_enabled boolean NOT NULL DEFAULT false,
  theme_color text NOT NULL DEFAULT '#2a63ff',
  logo_enabled boolean NOT NULL DEFAULT false,
  logo_url text,
  bg_color_enabled boolean NOT NULL DEFAULT false,
  bg_color text NOT NULL DEFAULT '#0a1128',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promo_settings_pkey PRIMARY KEY (id),
  CONSTRAINT promo_settings_theme_check CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text])),
  CONSTRAINT promo_settings_hero_mode_check CHECK (hero_mode = ANY (ARRAY['off'::text, 'slider'::text, 'image'::text]))
);

ALTER TABLE public.promo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read promo settings"
  ON public.promo_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins manage promo settings"
  ON public.promo_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_promo_settings_updated
  BEFORE UPDATE ON public.promo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
