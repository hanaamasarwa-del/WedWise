-- WedWise Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables.

-- 1. Questionnaire submissions
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  budget integer not null,
  guests integer not null,
  region text not null,
  wedding_style text not null,
  colors text[] default '{}',
  decorations text[] default '{}',
  flowers text[] default '{}',
  personal_text text default ''
);

-- 2. AI-generated (or mock) reports
create table if not exists ai_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  title text,
  summary text,
  event_type text,
  budget_fit text,
  budget_notes text,
  design_concept text,
  image_prompt text,
  created_at timestamp with time zone default now()
);

-- 3. Generated (or placeholder) images
create table if not exists generated_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  image_url text,
  prompt_used text,
  created_at timestamp with time zone default now()
);

-- 4. Supplier catalog (for future DB-backed suppliers; demo uses JSON file)
create table if not exists suppliers (
  id serial primary key,
  name text not null,
  category text not null,
  region text,
  min_budget integer,
  max_budget integer,
  style_tags text[] default '{}',
  description text,
  contact_info text,
  created_at timestamp with time zone default now()
);

-- 5. Lead / contact form submissions
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  preferred_contact_time text,
  created_at timestamp with time zone default now()
);
