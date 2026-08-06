
-- 1. Extend lead_status with meeting_scheduled (contacted, won/lost already exist as "closed")
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'meeting_scheduled';

-- 2. Messaging: delivered ticks + attachment type
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS attachment_type text;

-- 3. Client-submitted invoices/receipts
CREATE TABLE IF NOT EXISTS public.client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount numeric,
  currency text DEFAULT 'USD',
  note text,
  file_url text,
  file_name text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_invoices TO authenticated;
GRANT ALL ON public.client_invoices TO service_role;

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client sees own invoices" ON public.client_invoices FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()) OR public.current_user_is_admin());
CREATE POLICY "Client inserts own invoices" ON public.client_invoices FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE POLICY "Admin manages invoices" ON public.client_invoices FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

CREATE TRIGGER trg_client_invoices_updated BEFORE UPDATE ON public.client_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Allow clients to submit their own project requirement
DROP POLICY IF EXISTS "Client submits own project" ON public.projects;
CREATE POLICY "Client submits own project" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- 5. Realtime for delivered/read status
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_invoices;
