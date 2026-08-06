
-- 1) Revoke public/anon EXECUTE on trigger function (SECURITY DEFINER)
REVOKE EXECUTE ON FUNCTION public.notify_client_review() FROM anon, PUBLIC;

-- 2) Consolidate duplicate admin policies to a single mechanism (has_role)
DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Admin manage media" ON public.media_library;
DROP POLICY IF EXISTS "Admin manage offers" ON public.offers;
DROP POLICY IF EXISTS "Admin manage portfolio" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Admin manage pricing" ON public.pricing_plans;
DROP POLICY IF EXISTS "Admin manage services" ON public.services;
DROP POLICY IF EXISTS "Admin manage testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin manage sections" ON public.website_sections;

-- Drop duplicate public-read policies (keep one per table)
DROP POLICY IF EXISTS "Public read visible portfolio" ON public.portfolio_projects;
DROP POLICY IF EXISTS "Public read visible pricing" ON public.pricing_plans;
DROP POLICY IF EXISTS "Public read visible services" ON public.services;
DROP POLICY IF EXISTS "Public read current offers" ON public.offers;
DROP POLICY IF EXISTS "Public read enabled sections" ON public.website_sections;
