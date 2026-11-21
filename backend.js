/* Lớp gọi máy chủ dùng chung cho Data Storage (storage.js), Kho cá nhân (kho.js) và Quản trị Storage (kho-admin.js).
   - Có SUPABASE_URL + SUPABASE_ANON_KEY trong storage-config.js → dữ liệu người xem, mục chia sẻ, nhật ký, kho mã hoá đi Supabase
     (hàm SQL trong storage-backend/supabase.sql). Chưa có → mọi thứ đi Apps Script (STORAGE_API) như trước.
   - Chat, tin AI, xếp hạng, khoá học luôn ở Apps Script (chat.js, resource.js gọi thẳng, không qua file này).
   - Chủ kho: đổi ID token Google (đăng nhập ở kho.html) lấy phiên Supabase bằng ownerLogin(); phiên chỉ giữ trong bộ nhớ của tab. */
(() => {
  "use strict";
  const SB = () => String(window.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const KEY = () => String(window.SUPABASE_ANON_KEY || "").trim();
  const GAS = () => String(window.STORAGE_API || "").trim();
  const on = () => !!(SB() && KEY());
  let sess = null; // { token, exp } của chủ kho
  const OWNER = new Set(["admin_data", "admin_set", "admin_user", "vault_get", "vault_put", "sync"]);
  const num = (v) => (v === "" || v == null ? null : Number(v));
  // tên action của Apps Script → [hàm Supabase, tham số]
  const MAP = {
    register: (b) => ["register", { p_name: b.name, p_email: b.email, p_note: b.note || "" }],
    access: (b) => ["access", { p_email: b.email, p_code: b.code }],
    track: (b) => ["track", { p_email: b.email, p_code: b.code, p_events: b.events || [] }],
    admin_data: () => ["admin_data", {}],
    admin_set: (b) => ["admin_set", { p_email: b.email, p_status: b.status ?? null, p_donate: b.donate ?? null, p_amount: num(b.amount), p_memo: b.memo ?? null }],
    admin_user: (b) => ["admin_user", { p_email: b.email }],
    vault_get: () => ["vault_get", {}],
    vault_put: (b) => ["vault_put", { p_base_rev: Number(b.baseRev) || 0, p_vault: b.vault }],
    sync: (b) => ["sync_items", { p_items: b.items || [] }],
    // Source-hub (source-hub.html): chỉ có trên Supabase, không có nhánh Apps Script
    sources_list: (b) => ["sources_list", { p_email: b.email, p_code: b.code }],
    sources_get: (b) => ["sources_get", { p_email: b.email, p_code: b.code, p_id: b.id }]
  };
  const ownerOk = () => !!sess && sess.exp - 60000 > Date.now();

  async function ownerLogin(idToken) {
    sess = null;
    if (!on() || !idToken) return false;
    try {
      const r = await fetch(SB() + "/auth/v1/token?grant_type=id_token", {
        method: "POST", headers: { apikey: KEY(), "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", id_token: idToken })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.access_token) sess = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
    } catch {}
    return !!sess;
  }

  async function call(action, body = {}, opt = {}) {
    if (!on() || !MAP[action]) {
      if (!GAS()) throw new Error("no_api");
      const r = await fetch(GAS(), { method: "POST", keepalive: !!opt.keepalive, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...body, action }) });
      return r.json();
    }
    const [fn, args] = MAP[action](body), owner = OWNER.has(action);
    if (owner && !ownerOk()) return { ok: false, error: "denied" };
    const headers = { apikey: KEY(), "Content-Type": "application/json" };
    // khoá anon kiểu cũ là JWT thì gửi kèm Authorization; khoá publishable kiểu mới chỉ cần apikey
    if (owner) headers.Authorization = "Bearer " + sess.token; else if (/^eyJ/.test(KEY())) headers.Authorization = "Bearer " + KEY();
    const r = await fetch(`${SB()}/rest/v1/rpc/${fn}`, { method: "POST", keepalive: !!opt.keepalive, headers, body: JSON.stringify(args) });
    if (r.status === 404) return { ok: false, error: "bad_action" }; // chưa chạy supabase.sql
    if (r.status === 401 || r.status === 403) return { ok: false, error: "denied" };
    if (!r.ok) return { ok: false, error: "server" };
    return r.json();
  }

  const dashboard = () => { const m = /^https:\/\/([a-z0-9]+)\.supabase\.co/.exec(SB()); return m ? `https://supabase.com/dashboard/project/${m[1]}/editor` : ""; };
  window.LMBackend = { on, call, ownerLogin, ownerOk, dashboard, ready: () => on() || !!GAS() };
})();
