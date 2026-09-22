-- Minimal isolated schema for the Finding 1 regression test.
-- This is NOT the full production schema. It reproduces only the tables,
-- enums, and columns that public.generate_project_invoice() (the
-- trg_generate_project_invoice AFTER INSERT trigger on public.projects)
-- actually reads or writes, as verified directly against the live
-- Supabase project (elfo-web) via `pg_get_functiondef` and
-- `information_schema.columns`.
--
-- Runs against an isolated local PostgreSQL test database only.
-- Never run against production.

create extension if not exists pgcrypto; -- gen_random_uuid()

create type app_role as enum ('admin', 'developer', 'client');
create type project_status as enum (
  'planning', 'in_progress', 'waiting_client',
  'revision_required', 'completed', 'cancelled'
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null
);

create table services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_active boolean not null default true,
  price numeric not null default 0
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid references clients (id),
  status project_status not null default 'planning',
  selected_services jsonb not null default '[]'::jsonb
);

create table project_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  client_id uuid not null,
  invoice_number text not null,
  currency text not null default 'PKR',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'draft'
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  link text,
  category text
);
