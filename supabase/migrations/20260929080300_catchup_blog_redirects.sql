-- Catch-up migration: the blog_redirects table already exists live
-- without a matching migration file (confirmed via information_schema
-- + pg_constraint against project gwkwpbrlrmqrsdjnnckb on 2026-09-29).
-- Reproduces the live schema and RLS policies exactly so a fresh
-- database built from `supabase/migrations` alone matches production.
-- IF NOT EXISTS makes this safe to run against the already-patched
-- live database too.

CREATE TABLE IF NOT EXISTS public.blog_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL UNIQUE,
  blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_redirects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_redirects'
      AND policyname = 'Admins manage blog redirects'
  ) THEN
    CREATE POLICY "Admins manage blog redirects" ON public.blog_redirects
      FOR ALL TO authenticated
      USING (current_user_is_admin())
      WITH CHECK (current_user_is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_redirects'
      AND policyname = 'Public read blog redirects'
  ) THEN
    CREATE POLICY "Public read blog redirects" ON public.blog_redirects
      FOR SELECT TO anon, authenticated
      USING (true);
  END IF;
END $$;
