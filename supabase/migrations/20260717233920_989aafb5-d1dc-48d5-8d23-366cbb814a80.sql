
-- Grant Data API access to public tables (was missing, blocking inserts/selects)
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

GRANT SELECT ON public.services, public.portfolio_projects, public.pricing_plans, public.faqs, public.testimonials, public.offers, public.website_sections TO anon, authenticated;
GRANT ALL ON public.services, public.portfolio_projects, public.pricing_plans, public.faqs, public.testimonials, public.offers, public.website_sections TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.clients, public.developers, public.projects, public.project_stages, public.project_files, public.payments, public.conversations, public.messages, public.notifications, public.media_library, public.audit_logs TO authenticated;
GRANT ALL ON public.profiles, public.clients, public.developers, public.projects, public.project_stages, public.project_files, public.payments, public.conversations, public.messages, public.notifications, public.media_library, public.audit_logs TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Create the admin account
DO $$
DECLARE
  admin_id uuid;
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM auth.users WHERE email = 'elfoinnovations@gmail.com';
  IF existing_id IS NULL THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated',
      'elfoinnovations@gmail.com', extensions.crypt('elfoinnovationsstarton2026$', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"ELFO Admin"}'::jsonb,
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), admin_id, jsonb_build_object('sub', admin_id::text, 'email', 'elfoinnovations@gmail.com'), 'email', admin_id::text, now(), now(), now());
  ELSE
    admin_id := existing_id;
  END IF;

  INSERT INTO public.profiles (id, full_name, email) VALUES (admin_id, 'ELFO Admin', 'elfoinnovations@gmail.com')
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;
