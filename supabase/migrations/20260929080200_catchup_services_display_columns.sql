-- Catch-up migration: image_display_mode, image_fit, show_in_story,
-- show_in_grid and show_text were added directly to the live database
-- without matching migration files (confirmed via information_schema
-- against project gwkwpbrlrmqrsdjnnckb on 2026-09-29 — all already
-- exist live, with the same defaults/check constraints reproduced
-- below). IF NOT EXISTS / DO blocks make this safe to run against the
-- already-patched live database too.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_display_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS show_in_story boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_in_grid boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_text boolean NOT NULL DEFAULT true;
  ADD COLUMN IF NOT EXISTS image_display_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS image_fit text NOT NULL DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS show_in_story boolean NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_image_display_mode_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_image_display_mode_check
      CHECK (image_display_mode = ANY (ARRAY['full'::text, 'half'::text]));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_image_fit_check'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_image_fit_check
      CHECK (image_fit = ANY (ARRAY['auto'::text, 'contain'::text, 'cover'::text]));
  END IF;
END $$;
