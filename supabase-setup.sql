-- ════════════════════════════════════════════════════════════
-- UNICORN EVENTS — Supabase Setup Script
-- Run this once in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════

-- 1. JOBS TABLE (careers page listings)
create table if not exists jobs (
  id bigint primary key,
  title text not null,
  dept text not null,
  type text not null,
  location text not null,
  experience text default '',
  salary text default '',
  description text not null,
  skills jsonb default '[]'::jsonb,
  urgent boolean default false,
  posted_at date default current_date
);

-- 2. VIDEO CONFIG TABLE (hero video — single shared row)
create table if not exists video_config (
  id int primary key default 1,
  type text not null default 'youtube',
  video_id text,
  src text,
  constraint single_row check (id = 1)
);
insert into video_config (id, type, video_id) values (1, 'youtube', 'Bkn4eAhiUIY')
  on conflict (id) do nothing;

-- 3. CONTACT FORM LEADS
create table if not exists contact_leads (
  id bigserial primary key,
  first_name text,
  last_name text,
  email text,
  phone text,
  service text,
  event_date text,
  event_location text,
  message text,
  submitted_at timestamptz default now()
);

-- 4. WEDDING FORM LEADS
create table if not exists wedding_leads (
  id bigserial primary key,
  name text,
  mobile text,
  email text,
  city text,
  bride_name text,
  groom_name text,
  wedding_date text,
  venue_location text,
  guests text,
  budget text,
  venue_type text,
  theme text,
  special text,
  submitted_at timestamptz default now()
);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — allow the public "anon" key to read/write.
-- (Needed because Supabase blocks all access by default.)
-- This matches what a small business site needs: anyone can browse
-- jobs/video, anyone can submit a lead or post a job from the admin
-- panel (which is gated by your password in the JS, same as before).
-- ════════════════════════════════════════════════════════════

alter table jobs enable row level security;
alter table video_config enable row level security;
alter table contact_leads enable row level security;
alter table wedding_leads enable row level security;

create policy "public read jobs" on jobs for select using (true);
create policy "public insert jobs" on jobs for insert with check (true);
create policy "public delete jobs" on jobs for delete using (true);

create policy "public read video_config" on video_config for select using (true);
create policy "public update video_config" on video_config for update using (true);

create policy "public insert contact_leads" on contact_leads for insert with check (true);
create policy "public read contact_leads" on contact_leads for select using (true);

create policy "public insert wedding_leads" on wedding_leads for insert with check (true);
create policy "public read wedding_leads" on wedding_leads for select using (true);

-- Seed the two original jobs (optional — remove if you don't want them)
insert into jobs (id, title, dept, type, location, experience, salary, description, skills, urgent, posted_at)
values
  (1781597804000, 'Senior Event Producer', 'Creative & Design', 'full-time', 'Nagpur', '2', '3', 'Lead end-to-end planning and execution of large-scale corporate and brand events.', '[]'::jsonb, true, '2026-06-16'),
  (1781269028000, 'Graphic Designer', 'Event Production', 'full-time', 'Nagpur', '4', '2', 'Design branding collateral, social creatives and on-ground signage for events.', '[]'::jsonb, true, '2026-06-12')
on conflict (id) do nothing;
