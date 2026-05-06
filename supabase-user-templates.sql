-- Run in Supabase SQL editor.
-- Stores custom templates per authenticated user.

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
