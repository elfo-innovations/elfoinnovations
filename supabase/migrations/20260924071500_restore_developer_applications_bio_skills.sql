-- Restore bio and skills on public.developer_applications.
-- These were dropped by migration 20260923130714
-- (drop_obsolete_developer_application_columns) when the application form
-- was simplified, but that removal went further than intended: bio/skills
-- are still collected on the /apply form and are read by
-- approveDeveloperApplication() to seed public.developers.bio/.skills on
-- acceptance. country/city/years_experience remain dropped -- those are
-- genuinely no longer collected and nothing reads them.
--
-- NOTE: this migration was applied directly to the live Supabase project
-- (project_id gwkwpbrlrmqrsdjnnckb) via the Supabase MCP tool first, then
-- added here to keep supabase/migrations/ in sync with the live schema --
-- 20260923130714 itself was live-only and was never committed to this repo,
-- which is what caused the "Could not find the 'bio' column" runtime error.
ALTER TABLE public.developer_applications
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '';
