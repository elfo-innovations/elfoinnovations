-- Persistent blog categories. Previously the admin category list was derived only from
-- categories currently saved on posts, so a custom category vanished once the last post
-- using it was deleted. This table is the source of truth for the admin list.
-- ADDITIVE ONLY: public.blogs and its policies are untouched (blogs.category stays text).

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> '' AND char_length(name) <= 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_categories_name_lower_key
  ON public.blog_categories (lower(btrim(name)));

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.blog_categories FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;

DROP POLICY IF EXISTS "Admins manage blog categories" ON public.blog_categories;
CREATE POLICY "Admins manage blog categories" ON public.blog_categories
  FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

-- Seed: the curated starter list + every category already used on a post.
INSERT INTO public.blog_categories (name)
SELECT DISTINCT ON (lower(btrim(n))) btrim(n)
FROM (
  VALUES ('Web Development'), ('Software Development'), ('SaaS'), ('AI & Automation'),
         ('Cloud & DevOps'), ('Cybersecurity'), ('Business & Technology'), ('Case Studies')
  UNION ALL
  SELECT category FROM public.blogs WHERE category IS NOT NULL AND btrim(category) <> ''
) AS t(n)
ON CONFLICT DO NOTHING;
