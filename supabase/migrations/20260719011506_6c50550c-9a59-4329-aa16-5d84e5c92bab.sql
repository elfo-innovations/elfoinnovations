-- Public website read policies should never call admin helper functions for signed-out visitors.
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
DROP POLICY IF EXISTS "Public read pricing" ON public.pricing_plans;
DROP POLICY IF EXISTS "Public read portfolio" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Public read sections" ON public.website_sections;
DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
DROP POLICY IF EXISTS "Public approved testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public can read published blogs" ON public.blogs;

CREATE POLICY "Public read active services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public read current offers"
ON public.offers
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND (start_date IS NULL OR start_date <= now())
  AND (end_date IS NULL OR end_date >= now())
);

CREATE POLICY "Public read active pricing"
ON public.pricing_plans
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public read active portfolio"
ON public.portfolio_projects
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public read enabled sections"
ON public.website_sections
FOR SELECT
TO anon, authenticated
USING (is_enabled = true);

CREATE POLICY "Public read active faqs"
ON public.faqs
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Public read approved testimonials"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (is_approved = true);

CREATE POLICY "Public read published blogs"
ON public.blogs
FOR SELECT
TO anon, authenticated
USING (is_published = true);

-- Revoke public function execution that was temporarily added to restore loading.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_user_is_admin() FROM anon;