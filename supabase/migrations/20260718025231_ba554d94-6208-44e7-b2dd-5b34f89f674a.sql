INSERT INTO public.website_sections (section_key, title, sort_order, is_enabled)
VALUES ('portfolio', 'Portfolio', 25, true)
ON CONFLICT (section_key) DO NOTHING;