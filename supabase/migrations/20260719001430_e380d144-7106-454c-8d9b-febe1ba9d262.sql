
-- Restrict avatar reads to file owner (folder = auth.uid())
DROP POLICY IF EXISTS "Avatars auth read" ON storage.objects;
CREATE POLICY "Avatars owner read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- Lock down SECURITY DEFINER functions: revoke public/anon/authenticated where not needed.
-- Trigger-only functions: no direct execute needed.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_default_stages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_project_conversations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_message_recipients() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.dispatch_push_for_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role / current_user_is_admin are used inside RLS policies as the signed-in user.
-- Keep executable by authenticated only; revoke from anon/public.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
