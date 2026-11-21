-- Source-hub: kho bài viết hay do bot Telegram Source-hub bóc tách (skill kes-extract-content) và phân tích.
-- Chạy SAU supabase.sql (cần private.is_owner, private.approved). Supabase → SQL Editor → dán toàn bộ → Run. Chạy lại an toàn.
--
-- Ai làm gì:
--   * Bot trên VPS ghi bằng khoá secret (service_role, bỏ qua RLS). Khoá này CHỈ nằm trong .env trên VPS, không bao giờ vào website.
--   * Người xem đã được duyệt ở Data Storage (email + mã) đọc qua sources_list / sources_get. Thu quyền ở Quản trị Storage là mất quyền xem luôn.
--   * Chủ kho xem/sửa/xoá trực tiếp trong Table Editor.

create table if not exists public.sources (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  url         text not null unique check (char_length(url) <= 1000),
  platform    text not null default '' check (char_length(platform) <= 40),
  title       text not null check (char_length(title) between 1 and 300),
  author      text not null default '' check (char_length(author) <= 200),
  status      text not null default 'full' check (status in ('full', 'partial', 'failed')),
  summary     text not null default '' check (char_length(summary) <= 4000),
  key_ideas   jsonb not null default '[]' check (jsonb_typeof(key_ideas) = 'array'),  -- ["ý chính", ...]
  apply       jsonb not null default '[]' check (jsonb_typeof(apply) = 'array'),      -- ["áp dụng thế nào", ...]
  process     jsonb not null default '[]' check (jsonb_typeof(process) = 'array'),    -- ["bước 1", ...]
  quotes      jsonb not null default '[]' check (jsonb_typeof(quotes) = 'array'),     -- ["trích nguyên văn", ...]
  angles      jsonb not null default '[]' check (jsonb_typeof(angles) = 'array'),     -- ý tưởng bài viết cho bot Content Creator
  tags        text[] not null default '{}',
  extract_md  text not null default '' check (char_length(extract_md) <= 200000) -- extract.md đầy đủ của skill
);
create index if not exists sources_created_idx on public.sources (created_at desc);

alter table public.sources enable row level security;
drop policy if exists owner_all on public.sources;
create policy owner_all on public.sources for all to authenticated using (private.is_owner()) with check (private.is_owner());

-- Project tạo với "Grant API access to new tables" tắt → cấp tay cho bot (service_role). anon/authenticated không đọc thẳng bảng.
grant select, insert, update, delete on public.sources to service_role;
grant select, insert, update, delete on public.sources to authenticated; -- vẫn bị RLS chặn, chỉ chủ kho qua được
revoke all on public.sources from anon;

-- Danh sách (không kèm extract_md cho nhẹ)
create or replace function public.sources_list(p_email text, p_code text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.approved(p_email, p_code) then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  return jsonb_build_object('ok', true, 'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'at', created_at, 'url', url, 'platform', platform, 'title', title, 'author', author, 'status', status,
      'summary', summary, 'key_ideas', key_ideas, 'apply', apply, 'process', process, 'quotes', quotes, 'angles', angles,
      'tags', to_jsonb(tags)) order by created_at desc) from public.sources), '[]'::jsonb));
end $$;

-- Một bài, kèm bản bóc tách đầy đủ
create or replace function public.sources_get(p_email text, p_code text, p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare md text;
begin
  if not private.approved(p_email, p_code) then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  select extract_md into md from public.sources where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'extract_md', md);
end $$;

-- ===================== GIAO VIỆC GIỮA CÁC AGENT =====================
-- Nomad (Zalo) ghi việc → agent được giao (source-hub, content-creator, performance) nhận, làm, ghi kết quả → Nomad báo lại.
-- Chỉ các bot (khoá secret) đọc/ghi; chủ kho xem được trong Table Editor.
create table if not exists public.agent_tasks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  agent       text not null check (agent ~ '^[a-z-]{2,30}$'),          -- bot nhận việc
  kind        text not null default '' check (char_length(kind) <= 40), -- loại việc, vd: extract
  input       jsonb not null default '{}',                              -- vd: {"url": "..."}
  created_by  text not null default '' check (char_length(created_by) <= 40), -- bot giao việc, vd: nomad
  reply_to    jsonb not null default '{}',                              -- nơi báo kết quả (do bot giao việc tự hiểu)
  status      text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  result      jsonb not null default '{}',                              -- {"text": "...", ...}
  done_at     timestamptz,
  notified    boolean not null default false                           -- bot giao việc đã báo lại người dùng chưa
);
create index if not exists agent_tasks_queue_idx on public.agent_tasks (agent, status, created_at);
alter table public.agent_tasks enable row level security;
drop policy if exists owner_read on public.agent_tasks;
create policy owner_read on public.agent_tasks for select to authenticated using (private.is_owner());
grant select, insert, update, delete on public.agent_tasks to service_role;
grant select on public.agent_tasks to authenticated;
revoke all on public.agent_tasks from anon;

revoke execute on function public.sources_list(text, text), public.sources_get(text, text, uuid) from public, anon, authenticated;
grant execute on function public.sources_list(text, text), public.sources_get(text, text, uuid) to anon, authenticated;
