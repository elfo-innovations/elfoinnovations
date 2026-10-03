-- 301 redirects for renamed blog categories. A category's public URL is
-- /blogs/category/<slug>, where slug is derived from its name, so renaming a category
-- changes its URL. rename_blog_category() now records the old slug here and the category
-- page redirects it to the current one (same idea as blog_redirects for article slugs).

-- Mirrors slugify() in src/lib/faq-utils.ts so SQL and the app agree on slugs.
CREATE OR REPLACE FUNCTION public.blog_category_slug(p_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT btrim(left(btrim(regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9]+', '-', 'g'), '-'), 70), '-');
$$;

CREATE TABLE IF NOT EXISTS public.blog_category_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL UNIQUE,
  category_id uuid NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_category_redirects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_category_redirects FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_category_redirects TO authenticated;
GRANT ALL ON public.blog_category_redirects TO service_role;

DROP POLICY IF EXISTS "Admins manage blog category redirects" ON public.blog_category_redirects;
CREATE POLICY "Admins manage blog category redirects" ON public.blog_category_redirects
  FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

-- Public lookup: old slug -> CURRENT category name (null if none). SECURITY DEFINER so
-- anonymous visitors can resolve a redirect without read access to either table.
CREATE OR REPLACE FUNCTION public.resolve_blog_category_redirect(p_old_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.name
  FROM public.blog_category_redirects r
  JOIN public.blog_categories c ON c.id = r.category_id
  WHERE r.old_slug = p_old_slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_blog_category_redirect(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_blog_category_redirect(text) TO anon, authenticated;

-- rename_blog_category: same behaviour as before, plus recording the redirect.
CREATE OR REPLACE FUNCTION public.rename_blog_category(p_id uuid, p_name text)
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  old_name text;
  new_name text := btrim(p_name);
  v_old_slug text;
  v_new_slug text;
  affected integer := 0;
BEGIN
  IF new_name = '' OR char_length(new_name) > 80 THEN
    RAISE EXCEPTION 'Category name must be 1-80 characters';
  END IF;
  SELECT name INTO old_name FROM public.blog_categories WHERE id = p_id;
  IF old_name IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  v_old_slug := public.blog_category_slug(old_name);
  v_new_slug := public.blog_category_slug(new_name);

  UPDATE public.blog_categories SET name = new_name WHERE id = p_id;
  UPDATE public.blogs SET category = new_name WHERE category = old_name;
  GET DIAGNOSTICS affected = ROW_COUNT;

  -- The new slug is a live URL again, so it must not also be a redirect source.
  DELETE FROM public.blog_category_redirects WHERE old_slug = v_new_slug;
  IF v_old_slug <> '' AND v_old_slug <> v_new_slug THEN
    INSERT INTO public.blog_category_redirects (old_slug, category_id)
    VALUES (v_old_slug, p_id)
    ON CONFLICT (old_slug) DO UPDATE SET category_id = EXCLUDED.category_id;
  END IF;
  RETURN affected;
END; $$;
