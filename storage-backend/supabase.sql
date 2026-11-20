-- LANHMAR Data Storage trên Supabase (thay phần dữ liệu của Apps Script: người xem, mục chia sẻ, nhật ký, kho mã hoá).
-- Chạy MỘT lần trong Supabase → SQL Editor → New query → dán toàn bộ file → Run. Chạy lại an toàn (create or replace / if not exists).
-- Sau đó điền cấu hình riêng ở cuối file (owner_email, Telegram) bằng câu lệnh insert ... on conflict (xem SUPABASE.md bước 3).
--
-- Nguyên tắc bảo mật:
--   * Mọi bảng bật Row Level Security. Người lạ (khoá anon) KHÔNG đọc/ghi thẳng bảng nào.
--   * Người xem chỉ đi qua 3 hàm: register, access, track (kiểm email + mã ngay trong hàm).
--   * Chủ kho đăng nhập Google (Supabase Auth); private.is_owner() so mail đăng nhập với owner_email.
--   * Cấu hình bí mật (mail chủ kho, token Telegram) nằm trong schema private, API không với tới.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.config (key text primary key, value text not null);
alter table private.config enable row level security; -- không có policy: chỉ các hàm security definer (chủ bảng) đọc được

-- pg_net để gửi Telegram từ trong cơ sở dữ liệu (Supabase có sẵn, chỉ cần bật)
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  end if;
end $$;

-- ===================== BẢNG =====================
create table if not exists public.viewers (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null unique check (char_length(email) <= 120 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  note        text not null default '' check (char_length(note) <= 300),
  code        text not null,
  status      text not null default 'Pending' check (status in ('Pending', 'Approved', 'Revoked', 'Rejected')),
  approved_at timestamptz,
  memo        text not null default '' check (char_length(memo) <= 300),
  donate      text not null default '' check (donate in ('', 'Chưa nhận', 'Đã nhận', 'Miễn (khoá KesFlow)', 'Miễn (khác)')),
  amount      bigint not null default 0 check (amount >= 0),
  paid_at     timestamptz
);

create table if not exists public.items (
  id    text primary key,
  kho   text not null,
  title text not null,
  url   text not null default '',
  note  text not null default '',
  tags  text[] not null default '{}',
  type  text not null default '',
  date  text not null default ''
);

create table if not exists public.events (
  id    bigint generated always as identity primary key,
  at    timestamptz not null default now(),
  email text not null,
  ev    text not null check (ev in ('login', 'kho', 'item')),
  kho   text not null default '',
  item  text not null default ''
);
create index if not exists events_at_idx on public.events (at);
create index if not exists events_email_at_idx on public.events (email, at desc);

create table if not exists public.vault (
  id   int primary key default 1 check (id = 1),
  rev  int not null default 0,
  data jsonb,
  at   timestamptz
);

-- ===================== QUYỀN =====================
create or replace function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (auth.jwt() ->> 'role') = 'authenticated'
    and lower(auth.jwt() ->> 'email') = (select lower(value) from private.config where key = 'owner_email'),
    false)
$$;

alter table public.viewers enable row level security;
alter table public.items   enable row level security;
alter table public.events  enable row level security;
alter table public.vault   enable row level security;

drop policy if exists owner_all on public.viewers;
drop policy if exists owner_all on public.items;
drop policy if exists owner_read on public.events;
drop policy if exists owner_delete on public.events;
-- Chủ kho xem/sửa trực tiếp được trong Table Editor và qua API; người khác không thấy dòng nào.
create policy owner_all on public.viewers for all to authenticated using (private.is_owner()) with check (private.is_owner());
create policy owner_all on public.items   for all to authenticated using (private.is_owner()) with check (private.is_owner());
create policy owner_read on public.events for select to authenticated using (private.is_owner());
create policy owner_delete on public.events for delete to authenticated using (private.is_owner());
-- vault: không có policy → chỉ đi qua vault_get / vault_put

-- ===================== TIỆN ÍCH =====================
create or replace function private.notify(msg text) returns void
language plpgsql security definer set search_path = '' as $$
declare tok text; chat text;
begin
  select value into tok from private.config where key = 'telegram_bot_token';
  select value into chat from private.config where key = 'telegram_chat_id';
  if tok is null or chat is null or to_regproc('net.http_post') is null then return; end if;
  execute 'select net.http_post(url := $1, body := $2, headers := $3)'
    using 'https://api.telegram.org/bot' || tok || '/sendMessage',
          jsonb_build_object('chat_id', chat, 'text', msg, 'disable_web_page_preview', true),
          '{"Content-Type":"application/json"}'::jsonb;
exception when others then null; -- Telegram lỗi không được làm hỏng việc đăng ký
end $$;

-- 8 ký tự từ bảng chữ không dễ nhầm (bỏ I, O, 0, 1), lấy từ gen_random_uuid (ngẫu nhiên an toàn)
create or replace function private.new_code() returns text
language plpgsql volatile set search_path = '' as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := uuid_send(gen_random_uuid()); s text := '';
begin
  for i in 0..7 loop s := s || substr(a, (get_byte(b, i) % 32) + 1, 1); end loop;
  return s;
end $$;

create or replace function private.approved(p_email text, p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.viewers
    where email = lower(trim(p_email)) and code = upper(trim(p_code)) and status = 'Approved')
$$;

-- ===================== NGƯỜI XEM (khoá anon) =====================
create or replace function public.register(p_name text, p_email text, p_note text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n text := left(trim(coalesce(p_name, '')), 80); e text := lower(left(trim(coalesce(p_email, '')), 120));
        t text := left(trim(coalesce(p_note, '')), 300); st text; c text;
begin
  if n = '' or e !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  select status into st from public.viewers where email = e;
  if found then return jsonb_build_object('ok', true, 'existing', true, 'status', st); end if;  -- mã chỉ hiện một lần
  if (select count(*) from public.viewers) >= 2000 then return jsonb_build_object('ok', false, 'error', 'full'); end if;
  c := private.new_code();
  insert into public.viewers (name, email, note, code) values (n, e, t, c);
  perform private.notify('🔔 Yêu cầu truy cập Data Storage mới' || chr(10) || 'Tên: ' || n || chr(10) || 'Email: ' || e ||
    case when t <> '' then chr(10) || 'Lời nhắn: ' || t else '' end || chr(10) || 'Nội dung CK cần tìm trong sao kê: LM ' || c ||
    chr(10) || chr(10) || '👉 Duyệt trong Kho cá nhân → Quản trị Storage.');
  return jsonb_build_object('ok', true, 'existing', false, 'code', c, 'status', 'Pending');
end $$;

create or replace function public.access(p_email text, p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.viewers;
begin
  select * into v from public.viewers where email = lower(trim(coalesce(p_email, ''))) and code = upper(trim(coalesce(p_code, '')));
  if not found then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  if v.status <> 'Approved' then return jsonb_build_object('ok', true, 'approved', false, 'status', v.status); end if;
  insert into public.events (email, ev) values (v.email, 'login');
  return jsonb_build_object('ok', true, 'approved', true, 'name', v.name,
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'kho', kho, 'title', title, 'url', url, 'note', note, 'tags', to_jsonb(tags), 'type', type, 'date', date)) from public.items), '[]'::jsonb));
end $$;

-- Lượt xem kho / thẻ: chỉ người đã duyệt; tối đa 30 sự kiện mỗi lần; tự xoá nhật ký quá 180 ngày
create or replace function public.track(p_email text, p_code text, p_events jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare e text := lower(trim(coalesce(p_email, ''))); n int;
begin
  if not private.approved(e, p_code) then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  insert into public.events (email, ev, kho, item)
  select e, x->>'ev', x->>'kho', case when x->>'ev' = 'item' then x->>'item' else '' end
  from (select value as x from jsonb_array_elements(case when jsonb_typeof(p_events) = 'array' then p_events else '[]'::jsonb end) limit 30) s
  where x->>'ev' in ('kho', 'item') and coalesce(x->>'kho', '') ~ '^[a-z0-9-]{1,20}$'
    and (x->>'ev' = 'kho' or coalesce(x->>'item', '') ~ '^[A-Za-z0-9_.-]{1,80}$');
  get diagnostics n = row_count;
  if random() < 0.02 then delete from public.events where at < now() - interval '180 days'; end if;
  return jsonb_build_object('ok', true, 'n', n);
end $$;

-- ===================== CHỦ KHO (đăng nhập Google) =====================
create or replace function public.admin_data() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare since timestamptz := now() - interval '90 days';
begin
  if not private.is_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  return jsonb_build_object(
    'ok', true, 'now', now(), 'sheet', null,
    'donateOpts', jsonb_build_array('Chưa nhận', 'Đã nhận', 'Miễn (khoá KesFlow)', 'Miễn (khác)'),
    'people', coalesce((select jsonb_agg(jsonb_build_object('at', created_at, 'name', name, 'email', email, 'note', note, 'code', code,
        'status', status, 'approvedAt', approved_at, 'memo', memo, 'donate', donate, 'amount', amount, 'paidAt', paid_at) order by created_at desc)
      from public.viewers), '[]'::jsonb),
    'days', coalesce((select jsonb_object_agg(d, jsonb_build_object('login', l, 'kho', k, 'item', i, 'users', u)) from (
        select to_char(at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') d, count(*) filter (where ev = 'login') l,
               count(*) filter (where ev = 'kho') k, count(*) filter (where ev = 'item') i, count(distinct email) u
        from public.events where at >= since group by 1) x), '{}'::jsonb),
    'kho', coalesce((select jsonb_object_agg(kho, c) from (
        select kho, count(*) c from public.events where at >= since and ev = 'kho' group by kho) x), '{}'::jsonb),
    'items', coalesce((select jsonb_object_agg(item, c) from (
        select item, count(*) c from public.events where at >= since and ev = 'item' group by item order by c desc limit 50) x), '{}'::jsonb),
    'users', coalesce((select jsonb_object_agg(email, jsonb_build_object('logins', lg, 'events', evs, 'last', last)) from (
        select email, count(*) filter (where ev = 'login') lg, count(*) filter (where ev <> 'login') evs, max(at) last
        from public.events where at >= since group by email) x), '{}'::jsonb));
end $$;

create or replace function public.admin_set(p_email text, p_status text default null, p_donate text default null,
                                            p_amount numeric default null, p_memo text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  if p_status is not null and p_status not in ('Pending', 'Approved', 'Revoked', 'Rejected') then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  if p_donate is not null and p_donate not in ('Chưa nhận', 'Đã nhận', 'Miễn (khoá KesFlow)', 'Miễn (khác)') then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  update public.viewers set
    status      = coalesce(p_status, status),
    approved_at = case when p_status = 'Approved' and approved_at is null then now() else approved_at end,
    donate      = coalesce(p_donate, donate),
    amount      = case when p_donate is not null and p_amount is not null and p_amount >= 0 then round(p_amount) else amount end,
    paid_at     = case when p_donate = 'Đã nhận' and paid_at is null then now() else paid_at end,
    memo        = coalesce(left(p_memo, 300), memo)
  where email = lower(trim(coalesce(p_email, '')));
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.admin_user(p_email text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  return jsonb_build_object('ok', true, 'events', coalesce((select jsonb_agg(jsonb_build_object('at', at, 'ev', ev, 'kho', kho, 'item', item) order by at desc, id desc)
    from (select * from public.events where email = lower(trim(coalesce(p_email, ''))) order by at desc, id desc limit 100) x), '[]'::jsonb));
end $$;

-- Đẩy các mục đã tích "Chia sẻ" từ Kho cá nhân (thay cho sync bằng ADMIN_KEY)
create or replace function public.sync_items(p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not private.is_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  delete from public.items where true;
  insert into public.items (id, kho, title, url, note, tags, type, date)
  select left(x->>'id', 40), left(x->>'kho', 20), left(x->>'title', 200), left(coalesce(x->>'url', ''), 500), left(coalesce(x->>'note', ''), 1000),
         coalesce((select array_agg(left(t, 40)) from jsonb_array_elements_text(case when jsonb_typeof(x->'tags') = 'array' then x->'tags' else '[]'::jsonb end) t), '{}'),
         left(coalesce(x->>'type', ''), 40), left(coalesce(x->>'date', ''), 20)
  from (select value as x from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) limit 2000) s
  where coalesce(x->>'id', '') <> '' and coalesce(x->>'kho', '') <> '' and coalesce(x->>'title', '') <> ''
  on conflict (id) do nothing;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'count', n);
end $$;

-- Kho mã hoá: máy chủ chỉ giữ bản mã (salt, iv, ct), không bao giờ thấy mật khẩu
create or replace function public.vault_get() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v public.vault;
begin
  if not private.is_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  select * into v from public.vault where id = 1;
  if not found or v.rev = 0 or v.data is null then return jsonb_build_object('ok', true, 'rev', 0, 'vault', null); end if;
  return jsonb_build_object('ok', true, 'rev', v.rev, 'at', v.at, 'vault', v.data);
end $$;

create or replace function public.vault_put(p_base_rev int, p_vault jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare cur int;
begin
  if not private.is_owner() then return jsonb_build_object('ok', false, 'error', 'denied'); end if;
  if jsonb_typeof(p_vault->'salt') <> 'string' or jsonb_typeof(p_vault->'iv') <> 'string' or jsonb_typeof(p_vault->'ct') <> 'string' then
    return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  if length(p_vault::text) > 1500000 then return jsonb_build_object('ok', false, 'error', 'too_big'); end if;
  insert into public.vault (id) values (1) on conflict (id) do nothing;
  select rev into cur from public.vault where id = 1 for update;
  if coalesce(p_base_rev, -1) <> cur then return jsonb_build_object('ok', false, 'error', 'conflict', 'rev', cur); end if;
  update public.vault set rev = cur + 1, at = now(),
    data = jsonb_build_object('v', 1, 'salt', p_vault->>'salt', 'iv', p_vault->>'iv', 'ct', p_vault->>'ct') where id = 1;
  return jsonb_build_object('ok', true, 'rev', cur + 1);
end $$;

-- ===================== AI GỌI ĐƯỢC HÀM NÀO =====================
-- Chỉ thu quyền trên đúng các hàm của file này (không đụng hàm khác nếu dùng chung project)
revoke execute on function public.register(text, text, text), public.access(text, text), public.track(text, text, jsonb),
  public.admin_data(), public.admin_set(text, text, text, numeric, text), public.admin_user(text),
  public.sync_items(jsonb), public.vault_get(), public.vault_put(int, jsonb),
  private.is_owner(), private.notify(text), private.new_code(), private.approved(text, text) from public, anon, authenticated;
grant usage on schema public to anon, authenticated;   -- cần khi tạo project với "Grant API access to new tables" tắt
grant usage on schema private to anon, authenticated;  -- để chính sách RLS gọi được is_owner; bảng config vẫn bị chặn
revoke all on private.config from public, anon, authenticated;
grant execute on function private.is_owner() to authenticated;
grant execute on function public.register(text, text, text), public.access(text, text), public.track(text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_data(), public.admin_set(text, text, text, numeric, text), public.admin_user(text),
  public.sync_items(jsonb), public.vault_get(), public.vault_put(int, jsonb) to authenticated;
