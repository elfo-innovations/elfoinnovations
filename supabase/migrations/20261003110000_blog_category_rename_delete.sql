-- Atomic rename / delete for blog categories, used by the Web Portal "Blog Categories" tab.
-- SECURITY INVOKER on purpose: the existing admin-only RLS on blog_categories and blogs
-- applies to the caller, so a non-admin calling these changes nothing.
-- blogs.category is plain text, so renaming/deleting must also update posts that use it.

CREATE OR REPLACE FUNCTION public.rename_blog_category(p_id uuid, p_name text)
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  old_name text;
  new_name text := btrim(p_name);
  affected integer := 0;
BEGIN
  IF new_name = '' OR char_length(new_name) > 80 THEN
    RAISE EXCEPTION 'Category name must be 1-80 characters';
  END IF;
  SELECT name INTO old_name FROM public.blog_categories WHERE id = p_id;
  IF old_name IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  UPDATE public.blog_categories SET name = new_name WHERE id = p_id;
  UPDATE public.blogs SET category = new_name WHERE category = old_name;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END; $$;

CREATE OR REPLACE FUNCTION public.delete_blog_category(p_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  old_name text;
  affected integer := 0;
BEGIN
  SELECT name INTO old_name FROM public.blog_categories WHERE id = p_id;
  IF old_name IS NULL THEN
    RAISE EXCEPTION 'Category not found';
  END IF;
  UPDATE public.blogs SET category = NULL WHERE category = old_name;
  GET DIAGNOSTICS affected = ROW_COUNT;
  DELETE FROM public.blog_categories WHERE id = p_id;
  RETURN affected;
END; $$;

REVOKE ALL ON FUNCTION public.rename_blog_category(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_blog_category(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_blog_category(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_blog_category(uuid) TO authenticated;
