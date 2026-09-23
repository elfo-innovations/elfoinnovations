-- Finding: public.has_role(_user_id uuid, _role app_role) is SECURITY DEFINER
-- and was executable by anon. It accepts an arbitrary user_id and role and
-- returns a boolean, which lets an anonymous caller enumerate whether
-- specific user IDs (e.g. guessed/harvested UUIDs) hold a given role
-- (most usefully 'admin') via a plain PostgREST RPC call.
--
-- Verified before this migration:
--   - Every application call site (src/lib/account.functions.ts,
--     src/lib/developers.functions.ts, src/lib/developer-applications.functions.ts,
--     src/lib/clients.functions.ts) calls has_role via context.supabase.rpc(...)
--     from inside a requireSupabaseAuth-gated server function, which requires a
--     valid Bearer token and therefore executes as the `authenticated` role, not
--     `anon`. None of these call sites need anon access.
--   - Exactly one anon-facing RLS policy calls has_role directly:
--     "Public read published blogs" on public.blogs (FOR SELECT TO anon,
--     authenticated USING (is_published = true OR has_role(auth.uid(), 'admin'))).
--     This is rewritten below to call public.current_user_is_admin() instead,
--     which takes no arguments (always checks the caller's own auth.uid()) and
--     therefore cannot be used to probe arbitrary user IDs. It is itself
--     SECURITY DEFINER and owned by the same role as has_role, so it can still
--     call has_role internally regardless of anon's own grant.
--   - All other has_role references in RLS policies (public.* admin-management
--     policies, storage.objects admin/developer-resume/website-media policies)
--     are already scoped TO authenticated only, so they are unaffected by
--     revoking anon's grant.

-- Rewrite the one anon-facing policy to go through current_user_is_admin()
-- instead of calling has_role directly, and grant anon EXECUTE on that
-- zero-argument, self-only check (it cannot be used to probe other users).
DROP POLICY IF EXISTS "Public read published blogs" ON public.blogs;
CREATE POLICY "Public read published blogs"
ON public.blogs
FOR SELECT
TO anon, authenticated
USING (is_published = true OR public.current_user_is_admin());

GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO anon;

-- Remove anon's (and PUBLIC's) ability to call has_role directly with
-- arbitrary uuid/role arguments. authenticated and service_role keep EXECUTE.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
