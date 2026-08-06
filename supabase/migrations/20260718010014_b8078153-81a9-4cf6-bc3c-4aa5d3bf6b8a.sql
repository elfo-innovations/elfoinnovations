
ALTER TABLE public.conversations
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS developer_id uuid REFERENCES public.developers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'client_admin';

DROP POLICY IF EXISTS "Dev sees own dev convos" ON public.conversations;
CREATE POLICY "Dev sees own dev convos" ON public.conversations FOR SELECT TO authenticated
USING (developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Dev reads own dev msgs" ON public.messages;
CREATE POLICY "Dev reads own dev msgs" ON public.messages FOR SELECT TO authenticated
USING (conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.developers d ON d.id = c.developer_id WHERE d.user_id = auth.uid()));

DROP POLICY IF EXISTS "Dev sends own dev msgs" ON public.messages;
CREATE POLICY "Dev sends own dev msgs" ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.developers d ON d.id = c.developer_id WHERE d.user_id = auth.uid()));

DROP POLICY IF EXISTS "Dev updates own dev msg status" ON public.messages;
CREATE POLICY "Dev updates own dev msg status" ON public.messages FOR UPDATE TO authenticated
USING (conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.developers d ON d.id = c.developer_id WHERE d.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.ensure_project_conversations()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    INSERT INTO public.conversations (project_id, client_id, kind, subject)
    SELECT NEW.id, NEW.client_id, 'client_admin', NEW.name
    WHERE NOT EXISTS (SELECT 1 FROM public.conversations WHERE project_id = NEW.id AND kind='client_admin');
  END IF;
  IF NEW.developer_id IS NOT NULL THEN
    INSERT INTO public.conversations (project_id, developer_id, client_id, kind, subject)
    SELECT NEW.id, NEW.developer_id, NEW.client_id, 'developer_admin', NEW.name
    WHERE NOT EXISTS (SELECT 1 FROM public.conversations WHERE project_id = NEW.id AND kind='developer_admin');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS project_convos_ins ON public.projects;
CREATE TRIGGER project_convos_ins AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.ensure_project_conversations();

DROP TRIGGER IF EXISTS project_convos_upd ON public.projects;
CREATE TRIGGER project_convos_upd AFTER UPDATE OF client_id, developer_id ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.ensure_project_conversations();

INSERT INTO public.conversations (project_id, client_id, kind, subject)
SELECT p.id, p.client_id, 'client_admin', p.name FROM public.projects p
WHERE p.client_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.project_id = p.id AND c.kind='client_admin');

INSERT INTO public.conversations (project_id, developer_id, client_id, kind, subject)
SELECT p.id, p.developer_id, p.client_id, 'developer_admin', p.name FROM public.projects p
WHERE p.developer_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.project_id = p.id AND c.kind='developer_admin');

DROP POLICY IF EXISTS "Avatars auth read" ON storage.objects;
CREATE POLICY "Avatars auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
