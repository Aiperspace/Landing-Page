-- Git-style document versioning (repos, branches, commits, artifacts, members).

create table if not exists public.doc_repositories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doc_repositories_owner_id_idx on public.doc_repositories(owner_id);

create table if not exists public.doc_members (
  repo_id uuid not null references public.doc_repositories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (repo_id, user_id)
);

create index if not exists doc_members_user_id_idx on public.doc_members(user_id);

create table if not exists public.doc_commits (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.doc_repositories(id) on delete cascade,
  parent_commit_id uuid references public.doc_commits(id) on delete set null,
  author_id uuid not null references auth.users(id),
  message text not null default '',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists doc_commits_repo_id_idx on public.doc_commits(repo_id);
create index if not exists doc_commits_parent_idx on public.doc_commits(parent_commit_id);

create table if not exists public.doc_branches (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.doc_repositories(id) on delete cascade,
  name text not null,
  head_commit_id uuid references public.doc_commits(id) on delete set null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (repo_id, name)
);

create index if not exists doc_branches_repo_id_idx on public.doc_branches(repo_id);

create table if not exists public.doc_artifacts (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid not null references public.doc_repositories(id) on delete cascade,
  commit_id uuid not null references public.doc_commits(id) on delete cascade,
  filename text not null,
  content_type text,
  storage_path text not null,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists doc_artifacts_commit_id_idx on public.doc_artifacts(commit_id);

drop trigger if exists trg_doc_repositories_updated_at on public.doc_repositories;
create trigger trg_doc_repositories_updated_at
before update on public.doc_repositories
for each row execute function public.handle_updated_at();

-- RLS: members (including owner row) can read; editors+ can write commits/branches.
alter table public.doc_repositories enable row level security;
alter table public.doc_members enable row level security;
alter table public.doc_branches enable row level security;
alter table public.doc_commits enable row level security;
alter table public.doc_artifacts enable row level security;

drop policy if exists doc_repos_select_member on public.doc_repositories;
create policy doc_repos_select_member on public.doc_repositories
for select to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1 from public.doc_members m
    where m.repo_id = doc_repositories.id and m.user_id = auth.uid()
  )
);

drop policy if exists doc_repos_insert_owner on public.doc_repositories;
create policy doc_repos_insert_owner on public.doc_repositories
for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists doc_repos_update_owner on public.doc_repositories;
create policy doc_repos_update_owner on public.doc_repositories
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists doc_repos_delete_owner on public.doc_repositories;
create policy doc_repos_delete_owner on public.doc_repositories
for delete to authenticated
using (owner_id = auth.uid());

drop policy if exists doc_members_select on public.doc_members;
create policy doc_members_select on public.doc_members
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.doc_repositories r
    where r.id = doc_members.repo_id and r.owner_id = auth.uid()
  )
);

drop policy if exists doc_members_manage_owner on public.doc_members;
create policy doc_members_manage_owner on public.doc_members
for all to authenticated
using (
  exists (
    select 1 from public.doc_repositories r
    where r.id = doc_members.repo_id and r.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.doc_repositories r
    where r.id = doc_members.repo_id and r.owner_id = auth.uid()
  )
);

drop policy if exists doc_branches_select on public.doc_branches;
create policy doc_branches_select on public.doc_branches
for select to authenticated
using (
  exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_branches.repo_id
      and (r.owner_id = auth.uid() or m.user_id is not null)
  )
);

drop policy if exists doc_branches_write on public.doc_branches;
create policy doc_branches_write on public.doc_branches
for all to authenticated
using (
  exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_branches.repo_id
      and (
        r.owner_id = auth.uid()
        or (m.user_id is not null and m.role in ('owner', 'editor'))
      )
  )
)
with check (
  exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_branches.repo_id
      and (
        r.owner_id = auth.uid()
        or (m.user_id is not null and m.role in ('owner', 'editor'))
      )
  )
);

drop policy if exists doc_commits_select on public.doc_commits;
create policy doc_commits_select on public.doc_commits
for select to authenticated
using (
  exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_commits.repo_id
      and (r.owner_id = auth.uid() or m.user_id is not null)
  )
);

drop policy if exists doc_commits_insert on public.doc_commits;
create policy doc_commits_insert on public.doc_commits
for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_commits.repo_id
      and (
        r.owner_id = auth.uid()
        or (m.user_id is not null and m.role in ('owner', 'editor'))
      )
  )
);

drop policy if exists doc_artifacts_select on public.doc_artifacts;
create policy doc_artifacts_select on public.doc_artifacts
for select to authenticated
using (
  exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_artifacts.repo_id
      and (r.owner_id = auth.uid() or m.user_id is not null)
  )
);

drop policy if exists doc_artifacts_insert on public.doc_artifacts;
create policy doc_artifacts_insert on public.doc_artifacts
for insert to authenticated
with check (
  exists (
    select 1 from public.doc_repositories r
    left join public.doc_members m on m.repo_id = r.id and m.user_id = auth.uid()
    where r.id = doc_artifacts.repo_id
      and (
        r.owner_id = auth.uid()
        or (m.user_id is not null and m.role in ('owner', 'editor'))
      )
  )
);

grant all on public.doc_repositories to anon, authenticated, service_role;
grant all on public.doc_members to anon, authenticated, service_role;
grant all on public.doc_branches to anon, authenticated, service_role;
grant all on public.doc_commits to anon, authenticated, service_role;
grant all on public.doc_artifacts to anon, authenticated, service_role;
