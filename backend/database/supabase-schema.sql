-- WedWise Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables.

create extension if not exists pgcrypto;

-- 1. Questionnaire submissions
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  budget integer not null check (budget > 0),
  guests integer not null check (guests > 0),
  region text not null,
  wedding_style text not null,
  colors text[] not null default '{}',
  decorations text[] not null default '{}',
  flowers text[] not null default '{}',
  personal_text text not null default '',
  inspiration_url text
);

-- 2. AI-generated (or mock) reports
create table if not exists ai_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  title text,
  summary text,
  event_type text,
  budget_fit text,
  budget_notes text,
  design_concept text,
  image_prompt text,
  created_at timestamp with time zone not null default now()
);

-- 3. Generated images, if image persistence is re-enabled
create table if not exists generated_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  image_url text,
  prompt_used text,
  created_at timestamp with time zone not null default now()
);

-- 4. Supplier catalog (for future DB-backed suppliers; demo uses JSON file)
create table if not exists suppliers (
  id serial primary key,
  name text not null,
  category text not null,
  region text,
  city text,
  min_budget integer check (min_budget is null or min_budget >= 0),
  max_budget integer check (max_budget is null or max_budget >= 0),
  price_unit text,
  guest_capacity_min integer check (guest_capacity_min is null or guest_capacity_min >= 0),
  guest_capacity_max integer check (guest_capacity_max is null or guest_capacity_max >= 0),
  style_tags text[] not null default '{}',
  tags text[] not null default '{}',
  description text,
  contact_info text,
  website_url text,
  is_demo boolean not null default true,
  is_active boolean not null default true,
  info_source text,
  last_reviewed_at date,
  created_at timestamp with time zone not null default now(),
  check (max_budget is null or min_budget is null or max_budget >= min_budget),
  check (guest_capacity_max is null or guest_capacity_min is null or guest_capacity_max >= guest_capacity_min)
);

-- 5. Lead / contact form submissions
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  preferred_contact_time text,
  consent_to_contact boolean not null default true,
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed', 'not_relevant')),
  created_at timestamp with time zone not null default now()
);

-- 6. Final user decision after generated wedding visualization
create table if not exists wedding_follow_ups (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  decision text not null check (decision in ('continue', 'thinking')),
  image_generated boolean not null default false,
  report_summary text,
  created_at timestamp with time zone not null default now()
);

create index if not exists idx_submissions_created_at
  on submissions (created_at desc);

create index if not exists idx_submissions_region_style
  on submissions (region, wedding_style);

create index if not exists idx_ai_reports_submission_id
  on ai_reports (submission_id);

create index if not exists idx_generated_images_submission_id
  on generated_images (submission_id);

create index if not exists idx_suppliers_catalog_lookup
  on suppliers (is_active, category, region, min_budget, max_budget);

create index if not exists idx_suppliers_style_tags
  on suppliers using gin (style_tags);

create index if not exists idx_leads_submission_id
  on leads (submission_id);

create index if not exists idx_leads_status_created_at
  on leads (status, created_at desc);

create index if not exists idx_wedding_follow_ups_decision_created_at
  on wedding_follow_ups (decision, created_at desc);

create index if not exists idx_wedding_follow_ups_submission_id
  on wedding_follow_ups (submission_id);

alter table submissions enable row level security;
alter table ai_reports enable row level security;
alter table generated_images enable row level security;
alter table suppliers enable row level security;
alter table leads enable row level security;
alter table wedding_follow_ups enable row level security;
