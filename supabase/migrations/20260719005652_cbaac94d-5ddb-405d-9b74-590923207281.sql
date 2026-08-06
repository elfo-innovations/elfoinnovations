
-- 1) Audit logs: revoke direct insert by users; only service_role / triggers can insert.
DROP POLICY IF EXISTS "Auth insert audit" ON public.audit_logs;

-- 2) Messages: add explicit WITH CHECK mirroring USING
DROP POLICY IF EXISTS "Client updates msg status" ON public.messages;
CREATE POLICY "Client updates msg status" ON public.messages
FOR UPDATE TO authenticated
USING (conversation_id IN (SELECT c.id FROM conversations c JOIN clients cl ON cl.id=c.client_id WHERE cl.user_id=auth.uid()))
WITH CHECK (conversation_id IN (SELECT c.id FROM conversations c JOIN clients cl ON cl.id=c.client_id WHERE cl.user_id=auth.uid()));

DROP POLICY IF EXISTS "Dev updates msg status" ON public.messages;
CREATE POLICY "Dev updates msg status" ON public.messages
FOR UPDATE TO authenticated
USING (conversation_id IN (SELECT c.id FROM conversations c JOIN projects p ON p.id=c.project_id JOIN developers d ON d.id=p.developer_id WHERE d.user_id=auth.uid()))
WITH CHECK (conversation_id IN (SELECT c.id FROM conversations c JOIN projects p ON p.id=c.project_id JOIN developers d ON d.id=p.developer_id WHERE d.user_id=auth.uid()));

-- 3) Storage: replace fragile LIKE match with exact filename equality
DROP POLICY IF EXISTS "ownership read project buckets" ON storage.objects;
CREATE POLICY "ownership read project buckets" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = ANY (ARRAY['project-files','chat-attachments','client-invoices'])
  AND (
    has_role(auth.uid(),'admin'::app_role)
    OR owner = auth.uid()
    OR (bucket_id='project-files' AND EXISTS (
      SELECT 1 FROM project_files pf
      JOIN projects p ON p.id=pf.project_id
      LEFT JOIN clients cl ON cl.id=p.client_id
      LEFT JOIN developers dv ON dv.id=p.developer_id
      WHERE pf.storage_path=objects.name AND (cl.user_id=auth.uid() OR dv.user_id=auth.uid())
    ))
    OR (bucket_id='client-invoices' AND EXISTS (
      SELECT 1 FROM client_invoices ci
      JOIN clients cl ON cl.id=ci.client_id
      WHERE cl.user_id=auth.uid()
        AND split_part(ci.file_url, '/client-invoices/', 2) = objects.name
    ))
    OR (bucket_id='chat-attachments' AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations cv ON cv.id=m.conversation_id
      LEFT JOIN clients cl ON cl.id=cv.client_id
      LEFT JOIN developers dv ON dv.id=cv.developer_id
      WHERE split_part(m.attachment_url, '/chat-attachments/', 2) = objects.name
        AND (cl.user_id=auth.uid() OR dv.user_id=auth.uid() OR m.sender_id=auth.uid())
    ))
  )
);
