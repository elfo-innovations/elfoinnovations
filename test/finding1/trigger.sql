-- Verbatim copy of public.generate_project_invoice() and the
-- trg_generate_project_invoice AFTER INSERT trigger on public.projects,
-- pulled directly from the live Supabase project (elfo-web) via
-- pg_get_functiondef(). Do not hand-edit this file to make the test pass —
-- if this ever needs to change, re-pull it from production first.

CREATE OR REPLACE FUNCTION public.generate_project_invoice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  client_row record;
  svc jsonb;
  svc_id uuid;
  svc_row record;
  built_items jsonb := '[]'::jsonb;
  running_subtotal numeric := 0;
  unit_price numeric;
  inv_number text;
  admin_ids uuid[];
  recipient uuid;
BEGIN
  IF NEW.selected_services IS NULL OR jsonb_array_length(NEW.selected_services) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT * INTO client_row FROM public.clients WHERE id = NEW.client_id;

  FOR svc IN SELECT * FROM jsonb_array_elements(NEW.selected_services)
  LOOP
    BEGIN
      svc_id := (svc->>'service_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      svc_id := NULL;
    END;

    IF svc_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT * INTO svc_row FROM public.services WHERE id = svc_id AND is_active = true;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    unit_price := COALESCE(svc_row.price, 0);
    built_items := built_items || jsonb_build_object(
      'description', svc_row.title,
      'qty', 1,
      'unit_price', unit_price,
      'amount', unit_price
    );
    running_subtotal := running_subtotal + unit_price;
  END LOOP;

  inv_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(floor(random() * 99999)::text, 5, '0');

  INSERT INTO public.project_invoices (project_id, client_id, invoice_number, currency, items, subtotal, total, status)
  VALUES (NEW.id, NEW.client_id, inv_number, 'PKR', built_items, running_subtotal, running_subtotal, 'draft');

  SELECT array_agg(user_id) INTO admin_ids FROM public.user_roles WHERE role = 'admin';
  IF admin_ids IS NOT NULL THEN
    FOREACH recipient IN ARRAY admin_ids LOOP
      INSERT INTO public.notifications (user_id, title, body, link, category)
      VALUES (
        recipient,
        'New invoice generated',
        COALESCE(client_row.full_name, 'A client') || ' submitted "' || NEW.name || '" — invoice ' || inv_number,
        '/admin/project-invoices',
        'invoice'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_generate_project_invoice
AFTER INSERT ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.generate_project_invoice();
