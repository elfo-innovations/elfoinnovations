-- Editable alt text for a blog post's cover image.
-- The column was already added directly to the live database (project
-- gwkwpbrlrmqrsdjnnckb) before this file was written, so this is guarded
-- with IF NOT EXISTS and is safe to run against live as well as a fresh DB.
-- Public pages fall back to the post title when this is empty.

ALTER TABLE public.blogs
  ADD COLUMN IF NOT EXISTS cover_image_alt text;
