-- הרצה חד־פעמית: Supabase > SQL Editor > New query > הדבק > Run
create table if not exists public.construction_issues (
  id bigint generated always as identity primary key,
  issue_type text not null check (length(trim(issue_type)) between 1 and 160),
  location text not null check (length(trim(location)) between 1 and 300),
  reporter_name text check (length(reporter_name) <= 120),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.construction_issues enable row level security;

-- צפייה ועריכה פתוחות לכולם (כמו באתר המקורי)
create policy "anyone can read"   on public.construction_issues for select to anon using (true);
create policy "anyone can add"    on public.construction_issues for insert to anon with check (true);
create policy "anyone can update" on public.construction_issues for update to anon using (true) with check (true);
create policy "anyone can delete" on public.construction_issues for delete to anon using (true);
