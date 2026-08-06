GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

DROP POLICY IF EXISTS "Anyone submits a lead" ON public.leads;
CREATE POLICY "Anyone submits a lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage leads" ON public.leads;
DROP POLICY IF EXISTS "Admins update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;

CREATE POLICY "Admins read leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.current_user_is_admin());

CREATE POLICY "Admins update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.current_user_is_admin())
WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admins delete leads"
ON public.leads
FOR DELETE
TO authenticated
USING (public.current_user_is_admin());