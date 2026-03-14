-- ① jobs テーブル
create table public.jobs (
  id text primary key,
  user_id text not null,
  name text not null,
  wage integer not null,
  color text not null,
  position integer not null default 0,
  created_at timestamptz default now()
);

-- ② entries テーブル
create table public.entries (
  id bigint primary key,
  user_id text not null,
  job_id text not null,
  job_name text not null,
  hours numeric not null,
  wage integer not null,
  income integer not null,
  transport integer not null default 0,
  memo text not null default '',
  date text not null,
  deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz default now()
);

-- ③ RLS 有効化
alter table public.jobs enable row level security;
alter table public.entries enable row level security;

-- ④ ポリシー: user_id が一致するものだけ操作可能
create policy "own jobs" on public.jobs
  for all using (user_id = current_setting('request.headers')::json->>'x-user-id');

create policy "own entries" on public.entries
  for all using (user_id = current_setting('request.headers')::json->>'x-user-id');
