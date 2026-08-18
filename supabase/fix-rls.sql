-- =========================================================
-- 「啊敏的兵」RLS 策略修复脚本（幂等，可重复执行）
-- 症状：注册成功，但写入数据时返回 403
--   new row violates row-level security policy for table "user_sync"
-- 原因：INSERT / UPDATE 策略未生效（可能上次执行不完整）
-- 解决：把 user_sync 的 4 个 RLS 策略全部重建一次
-- 执行：Supabase 控制台 → SQL Editor → 粘贴全部 → Run
-- =========================================================

-- 1. 确保表存在且结构正确（已存在则无副作用）
create table if not exists public.user_sync (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists idx_user_sync_updated
  on public.user_sync (user_id, updated_at desc);

-- 2. 确保 RLS 开启
alter table public.user_sync enable row level security;

-- 3. 重建 4 个策略（drop + create，幂等）
drop policy if exists "user_sync_select_own" on public.user_sync;
create policy "user_sync_select_own" on public.user_sync
  for select using (auth.uid() = user_id);

drop policy if exists "user_sync_insert_own" on public.user_sync;
create policy "user_sync_insert_own" on public.user_sync
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_sync_update_own" on public.user_sync;
create policy "user_sync_update_own" on public.user_sync
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_sync_delete_own" on public.user_sync;
create policy "user_sync_delete_own" on public.user_sync
  for delete using (auth.uid() = user_id);

-- 4. 验证：执行后应看到 4 行策略
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'user_sync'
order by cmd;
