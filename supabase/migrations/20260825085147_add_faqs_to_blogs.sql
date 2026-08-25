alter table blogs add column if not exists faqs jsonb not null default '[]'::jsonb;
