-- Catch-up migration: these columns were added directly to the live
-- database at some point without a matching migration file being
-- committed (confirmed via information_schema against project
-- gwkwpbrlrmqrsdjnnckb on 2026-09-29 — all three already exist live).
-- Written now so a fresh database built from `supabase/migrations`
-- alone matches production. IF NOT EXISTS makes this safe to run
-- against the already-patched live database too.

ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS content_html text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tldr text;
