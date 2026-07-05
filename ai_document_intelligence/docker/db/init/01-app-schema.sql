-- App tables for local Postgres (profiles + user templates).
-- auth.users and auth.uid() are provided by the Supabase Postgres image.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.handle_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create table if not exists public.user_templates (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text null,
  name text not null,
  base_type_id text not null,
  outline jsonb not null default '[]'::jsonb,
  source_file_name text null,
  created_at timestamptz not null default now()
);

create index if not exists user_templates_user_id_idx on public.user_templates(user_id);
create index if not exists user_templates_client_id_idx on public.user_templates(client_id);

alter table public.user_templates enable row level security;

drop policy if exists "user_templates_select_own" on public.user_templates;
create policy "user_templates_select_own"
on public.user_templates
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_templates_insert_own" on public.user_templates;
create policy "user_templates_insert_own"
on public.user_templates
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_templates_update_own" on public.user_templates;
create policy "user_templates_update_own"
on public.user_templates
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_templates_delete_own" on public.user_templates;
create policy "user_templates_delete_own"
on public.user_templates
for delete
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
