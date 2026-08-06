
-- =========================================================
-- ELFO INNOVATIONS — Full platform schema
-- =========================================================

-- ---------- ENUMS ----------
CREATE TYPE public.app_role AS ENUM ('admin', 'developer', 'client');
CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','proposal_sent','negotiation','won','lost','converted');
CREATE TYPE public.budget_readiness AS ENUM ('yes_approved','maybe_depends','not_yet_exploring');
CREATE TYPE public.project_status AS ENUM ('planning','in_progress','waiting_client','revision_required','completed','cancelled');
CREATE TYPE public.stage_key AS ENUM ('frontend','backend','database','hosting');
CREATE TYPE public.stage_status AS ENUM ('pending','delivered','admin_review','admin_approved','sent_to_client','client_approved','revision_requested');
CREATE TYPE public.developer_status AS ENUM ('available','busy','on_leave','inactive');
CREATE TYPE public.payment_status AS ENUM ('pending','partial','paid','overdue','cancelled');

-- ---------- UPDATED_AT helper ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- USER ROLES ----------
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.current_user_is_admin());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

-- ---------- PROFILES ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  company text,
  avatar_url text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.current_user_is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.current_user_is_admin());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.current_user_is_admin());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default client role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- LEADS ----------
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_code text UNIQUE NOT NULL DEFAULT ('ELFO-' || upper(substr(gen_random_uuid()::text,1,8))),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  country text,
  country_code text,
  company text,
  project_description text NOT NULL,
  budget_readiness public.budget_readiness NOT NULL,
  estimated_budget text,
  timeline text,
  preferred_contact text,
  status public.lead_status NOT NULL DEFAULT 'new',
  notes text,
  follow_up_at timestamptz,
  converted_client_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage leads" ON public.leads FOR SELECT TO authenticated USING (public.current_user_is_admin());
CREATE POLICY "Admins update leads" ON public.leads FOR UPDATE TO authenticated USING (public.current_user_is_admin());
CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE TO authenticated USING (public.current_user_is_admin());
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- CLIENTS ----------
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  country text,
  source_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all clients" ON public.clients FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Client reads own" ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- DEVELOPERS ----------
CREATE TABLE public.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  skills text[] DEFAULT '{}',
  status public.developer_status NOT NULL DEFAULT 'available',
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developers TO authenticated;
GRANT ALL ON public.developers TO service_role;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all developers" ON public.developers FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Developer reads self" ON public.developers FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER trg_developers_updated BEFORE UPDATE ON public.developers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PROJECTS ----------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code text UNIQUE NOT NULL DEFAULT ('PRJ-' || upper(substr(gen_random_uuid()::text,1,6))),
  name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  developer_id uuid REFERENCES public.developers(id) ON DELETE SET NULL,
  requirements text,
  budget numeric,
  start_date date,
  deadline date,
  priority text DEFAULT 'medium',
  technologies text[] DEFAULT '{}',
  internal_notes text,
  status public.project_status NOT NULL DEFAULT 'planning',
  progress_percent int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all projects" ON public.projects FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Developer sees assigned" ON public.projects FOR SELECT TO authenticated
  USING (developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()));
CREATE POLICY "Client sees own projects" ON public.projects FOR SELECT TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PROJECT STAGES ----------
CREATE TABLE public.project_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage public.stage_key NOT NULL,
  status public.stage_status NOT NULL DEFAULT 'pending',
  developer_comment text,
  admin_comment text,
  client_comment text,
  submitted_at timestamptz,
  admin_approved_at timestamptz,
  sent_to_client_at timestamptz,
  client_approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, stage)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_stages TO authenticated;
GRANT ALL ON public.project_stages TO service_role;
ALTER TABLE public.project_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin stages all" ON public.project_stages FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Developer view assigned stages" ON public.project_stages FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())));
CREATE POLICY "Developer updates assigned stages" ON public.project_stages FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())));
CREATE POLICY "Client view own stages (after admin approve)" ON public.project_stages FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()))
         AND status IN ('sent_to_client','client_approved','revision_requested'));
CREATE POLICY "Client updates own stages status" ON public.project_stages FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));
CREATE TRIGGER trg_stages_updated BEFORE UPDATE ON public.project_stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create 4 stages when project inserted
CREATE OR REPLACE FUNCTION public.create_default_stages()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.project_stages (project_id, stage) VALUES
    (NEW.id, 'frontend'), (NEW.id, 'backend'), (NEW.id, 'database'), (NEW.id, 'hosting');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_projects_stages AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.create_default_stages();

-- ---------- PROJECT FILES ----------
CREATE TABLE public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage public.stage_key,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_type text,
  file_size int,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visible_to_client boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_files TO authenticated;
GRANT ALL ON public.project_files TO service_role;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin files all" ON public.project_files FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Dev files assigned" ON public.project_files FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())))
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid())));
CREATE POLICY "Client visible files" ON public.project_files FOR SELECT TO authenticated
  USING (visible_to_client = true AND project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

-- ---------- PAYMENTS ----------
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone text NOT NULL,
  amount numeric NOT NULL,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status public.payment_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin payments all" ON public.payments FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Client view own payments" ON public.payments FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- MESSAGES (Client <-> Admin realtime) ----------
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin conv all" ON public.conversations FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Client sees own conv" ON public.conversations FOR ALL TO authenticated
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()))
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE TRIGGER trg_conv_updated BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  body text,
  attachment_url text,
  attachment_name text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin msgs all" ON public.messages FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "Client msgs own conv" ON public.messages FOR ALL TO authenticated
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())))
  WITH CHECK (sender_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_stages;

-- ---------- NOTIFICATIONS ----------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link text,
  category text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner notifs" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.current_user_is_admin())
  WITH CHECK (user_id = auth.uid() OR public.current_user_is_admin());
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ---------- SERVICES ----------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text,
  cta_label text,
  cta_href text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read services" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage services" ON public.services FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PORTFOLIO / BEFORE-AFTER ----------
CREATE TABLE public.portfolio_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  category text,
  client_name text,
  before_image_url text,
  after_image_url text,
  live_url text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.portfolio_projects TO authenticated;
GRANT ALL ON public.portfolio_projects TO service_role;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read portfolio" ON public.portfolio_projects FOR SELECT TO anon, authenticated USING (is_active = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage portfolio" ON public.portfolio_projects FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_portfolio_updated BEFORE UPDATE ON public.portfolio_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PRICING ----------
CREATE TABLE public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price text NOT NULL,
  description text,
  features text[] NOT NULL DEFAULT '{}',
  cta_label text DEFAULT 'Get Started',
  is_popular boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_plans TO authenticated;
GRANT ALL ON public.pricing_plans TO service_role;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pricing" ON public.pricing_plans FOR SELECT TO anon, authenticated USING (is_active = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage pricing" ON public.pricing_plans FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_pricing_updated BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- FAQ ----------
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (is_active = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- TESTIMONIALS ----------
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  company text,
  profile_image_url text,
  rating int NOT NULL DEFAULT 5,
  review text NOT NULL,
  project_name text,
  is_approved boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public approved testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_approved = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_testimonials_updated BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- OFFERS ----------
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  banner_image_url text,
  discount text,
  cta_label text,
  cta_href text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  show_popup boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read offers" ON public.offers FOR SELECT TO anon, authenticated USING (is_active = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage offers" ON public.offers FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- WEBSITE SECTIONS ----------
CREATE TABLE public.website_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text,
  content jsonb NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.website_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.website_sections TO authenticated;
GRANT ALL ON public.website_sections TO service_role;
ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sections" ON public.website_sections FOR SELECT TO anon, authenticated USING (is_enabled = true OR public.current_user_is_admin());
CREATE POLICY "Admin manage sections" ON public.website_sections FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE TRIGGER trg_sections_updated BEFORE UPDATE ON public.website_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- MEDIA LIBRARY ----------
CREATE TABLE public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  file_type text,
  file_size int,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_library TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_library TO authenticated;
GRANT ALL ON public.media_library TO service_role;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read media" ON public.media_library FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin manage media" ON public.media_library FOR ALL TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

-- ---------- AUDIT LOGS ----------
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.current_user_is_admin());
CREATE POLICY "Auth insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
