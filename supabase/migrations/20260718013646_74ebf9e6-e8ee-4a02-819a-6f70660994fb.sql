
CREATE OR REPLACE FUNCTION public.notify_message_recipients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv record;
  admin_ids uuid[];
  recipient uuid;
  preview text;
  sender_name text;
  project_name text;
BEGIN
  SELECT c.*, p.name AS pname, cl.full_name AS cname, cl.user_id AS client_user_id,
         d.user_id AS developer_user_id
  INTO conv
  FROM public.conversations c
  LEFT JOIN public.projects p ON p.id = c.project_id
  LEFT JOIN public.clients cl ON cl.id = c.client_id
  LEFT JOIN public.developers d ON d.id = c.developer_id
  WHERE c.id = NEW.conversation_id;

  SELECT COALESCE(pr.full_name, pr.email, NEW.sender_role) INTO sender_name
  FROM public.profiles pr WHERE pr.id = NEW.sender_id;

  project_name := COALESCE(conv.pname, conv.subject, 'Conversation');
  preview := COALESCE(NULLIF(NEW.body, ''), CASE WHEN NEW.attachment_name IS NOT NULL THEN '📎 '||NEW.attachment_name ELSE 'New message' END);
  preview := LEFT(preview, 140);

  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';

  IF NEW.sender_role = 'admin' THEN
    IF conv.kind = 'client_admin' THEN recipient := conv.client_user_id;
    ELSIF conv.kind = 'developer_admin' THEN recipient := conv.developer_user_id;
    END IF;
    IF recipient IS NOT NULL AND recipient <> NEW.sender_id THEN
      INSERT INTO public.notifications (user_id, title, body, link, category)
      VALUES (recipient, 'New message from Admin', sender_name||': '||preview,
              '/'||CASE WHEN conv.kind='developer_admin' THEN 'developer' ELSE 'client' END||'/messages', 'message');
    END IF;
  ELSE
    IF admin_ids IS NOT NULL THEN
      FOREACH recipient IN ARRAY admin_ids LOOP
        IF recipient <> NEW.sender_id THEN
          INSERT INTO public.notifications (user_id, title, body, link, category)
          VALUES (recipient,
                  'New message from '||INITCAP(NEW.sender_role)||' · '||project_name,
                  sender_name||': '||preview,
                  '/admin/projects', 'message');
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_message_recipients ON public.messages;
CREATE TRIGGER trg_notify_message_recipients
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message_recipients();

-- Ensure notifications realtime + insert policy for the trigger (SECURITY DEFINER bypasses RLS but ensure users can read/update their own)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Make sure users can update their notifications (mark as read)
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
