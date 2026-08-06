ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS closed_at timestamptz;