-- =========================================================
-- Site Chat (Elsa) — conversation logging + admin visibility
-- =========================================================

-- Formalize the site_chat_logs table (safe if it already exists from earlier ad-hoc setup)
CREATE TABLE IF NOT EXISTS public.site_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_chat_logs_session ON public.site_chat_logs (session_id, created_at);

GRANT SELECT, INSERT ON public.site_chat_logs TO anon, authenticated;
GRANT ALL ON public.site_chat_logs TO service_role;

ALTER TABLE public.site_chat_logs ENABLE ROW LEVEL SECURITY;

-- Website visitors (anon) can log their own chat messages, but never read anyone else's
DROP POLICY IF EXISTS "Anyone logs site chat messages" ON public.site_chat_logs;
CREATE POLICY "Anyone logs site chat messages" ON public.site_chat_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only admins can browse the conversation history
DROP POLICY IF EXISTS "Admins read site chat logs" ON public.site_chat_logs;
CREATE POLICY "Admins read site chat logs" ON public.site_chat_logs
  FOR SELECT TO authenticated USING (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins delete site chat logs" ON public.site_chat_logs;
CREATE POLICY "Admins delete site chat logs" ON public.site_chat_logs
  FOR DELETE TO authenticated USING (public.current_user_is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_chat_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_chat_logs;
  END IF;
END $$;