-- Add outcome queues used by /api/wedding-follow-up.
-- Run this on existing Supabase projects that were created before these
-- tables were added to supabase-schema.sql.

create extension if not exists pgcrypto;

create table if not exists secured_clients (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamp with time zone not null default now()
);

create table if not exists potential_clients (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_secured_clients_created_at
  on secured_clients (created_at desc);

create index if not exists idx_secured_clients_submission_id
  on secured_clients (submission_id);

create index if not exists idx_potential_clients_created_at
  on potential_clients (created_at desc);

create index if not exists idx_potential_clients_submission_id
  on potential_clients (submission_id);

alter table secured_clients enable row level security;
alter table potential_clients enable row level security;
