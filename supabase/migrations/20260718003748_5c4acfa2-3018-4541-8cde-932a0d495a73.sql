
-- Allow developer to read/send messages in conversations of their assigned projects
CREATE POLICY "Dev sees project convos" ON public.conversations FOR SELECT TO authenticated
  USING (project_id IN (SELECT p.id FROM public.projects p JOIN public.developers d ON d.id = p.developer_id WHERE d.user_id = auth.uid()));

CREATE POLICY "Dev reads project msgs" ON public.messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.projects p ON p.id = c.project_id JOIN public.developers d ON d.id = p.developer_id WHERE d.user_id = auth.uid()));

CREATE POLICY "Dev sends project msgs" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.projects p ON p.id = c.project_id JOIN public.developers d ON d.id = p.developer_id WHERE d.user_id = auth.uid()));

CREATE POLICY "Dev updates msg status" ON public.messages FOR UPDATE TO authenticated
  USING (conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.projects p ON p.id = c.project_id JOIN public.developers d ON d.id = p.developer_id WHERE d.user_id = auth.uid()));

-- Client can update read_at/delivered_at on incoming messages
CREATE POLICY "Client updates msg status" ON public.messages FOR UPDATE TO authenticated
  USING (conversation_id IN (SELECT c.id FROM public.conversations c JOIN public.clients cl ON cl.id = c.client_id WHERE cl.user_id = auth.uid()));
