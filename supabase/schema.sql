-- ============================================================
-- Strategic Minds AI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Project: vgsmyhqqtkkluhypxyua (production)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  company text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles: users can read their own, admins can read all
create policy "Profiles: read own or admin" on public.profiles
  for select using (
    auth.uid() = id or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Users can update their own profile
create policy "Profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. PROJECTS (replaces ClientProject entity)
-- ============================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Clients see their own projects, admins see all
create policy "Projects: client sees own" on public.projects
  for select using (
    auth.uid() = client_id or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Only admins can create/update projects
create policy "Projects: admin create" on public.projects
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Projects: admin update" on public.projects
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- 3. LEADS (replaces Lead entity for SMAI)
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  service_interest text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  estimate_value numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

-- Public can submit leads (contact form), only admins can read
create policy "Leads: public insert" on public.leads
  for insert with check (true);

create policy "Leads: admin read" on public.leads
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Leads: admin update" on public.leads
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- 4. MESSAGES (client-to-team messaging)
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Clients can send and read their own messages, admins read all
create policy "Messages: client insert own" on public.messages
  for insert with check (auth.uid() = client_id);

create policy "Messages: client read own" on public.messages
  for select using (
    auth.uid() = client_id or exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 5. updated_at trigger
-- ============================================================
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.update_updated_at();

drop trigger if exists set_updated_at on public.leads;
create trigger set_updated_at before update on public.leads
  for each row execute function public.update_updated_at();

-- ============================================================
-- 6. Make first user an admin (run once after you create your account)
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- ============================================================