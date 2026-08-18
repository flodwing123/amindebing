-- =========================================================
-- 「啊敏的兵」Supabase 表结构 + RLS
-- 在 Supabase 控制台 → SQL Editor 中一次性执行
-- 设计说明：前端为 localStorage JSON blob 架构（55 个业务键），
-- 为不破坏现有数据结构，采用「KV 同步表」：
--   一行 = 用户的一个数据键（key）→ 完整 JSON（data）
-- 优点：无需拆分重构业务代码；删除用「云端键集合差集」；
-- 数据量小（全站 <1MB），单表完全够用。
-- =========================================================

-- ---------------------------------------------------------
-- 1. KV 同步表
--    user_id   : 关联 auth.users，主键之一
--    key       : 业务键名（如 students / hwRecords / tasks）
--    data      : 该键的完整 JSON 值
--    updated_at: 最后修改时间（last-write-wins 冲突裁决）
-- ---------------------------------------------------------
create table if not exists public.user_sync (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- 按用户 + 时间倒序索引：登录拉取「该用户全部键」和后续增量都走这里
create index if not exists idx_user_sync_updated
  on public.user_sync (user_id, updated_at desc);

-- ---------------------------------------------------------
-- 2. 行级安全（RLS）：每个用户只能读写自己的行
-- ---------------------------------------------------------
alter table public.user_sync enable row level security;

drop policy if exists "user_sync_select_own" on public.user_sync;
create policy "user_sync_select_own" on public.user_sync
  for select using (auth.uid() = user_id);

drop policy if exists "user_sync_insert_own" on public.user_sync;
create policy "user_sync_insert_own" on public.user_sync
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_sync_update_own" on public.user_sync;
create policy "user_sync_update_own" on public.user_sync
  for update using (auth.uid() = user_id);

drop policy if exists "user_sync_delete_own" on public.user_sync;
create policy "user_sync_delete_own" on public.user_sync
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 3.（可选）健康检查：执行后应返回 0 行，证明 RLS 生效
--    在未登录状态下查询应提示 RLS 拦截 / 返回空
-- ---------------------------------------------------------
-- select count(*) from public.user_sync;
