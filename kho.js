/* Kho cá nhân — dữ liệu được mã hoá AES-GCM bằng mật khẩu của chủ site.
   Trên web chỉ có bản mã (kho.enc.json); không có mật khẩu thì không đọc được. */
const KEY = "kho-vault-v1";
const L = (v, e) => (window.LM ? LM.t(v, e) : v); // song ngữ (lang.js)
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const enc = new TextEncoder(), dec = new TextDecoder();

let vault = null;      // {v, salt, iv, ct} đang lưu
let cryptoKey = null;  // khoá trong bộ nhớ sau khi mở
let items = [], featured = [];
let cur = "ai", q = "", tag = "";
let grp = "", tagsOpen = false;
const TAG_LIMIT = 8;

async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal() {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, enc.encode(JSON.stringify(items)));
  vault = { v: 1, salt: vault.salt, iv: b64(iv), ct: b64(ct), rev: vault.rev || 0, dirty: true };
  saveLocal();
  pushCloud();
}
function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(vault)); } catch { alert(L("Không lưu được vào trình duyệt.", "Couldn't save to this browser.")); }
}
const plain = (v) => ({ v: 1, salt: v.salt, iv: v.iv, ct: v.ct }); // đúng định dạng kho.enc.json
async function openVault(pass) {
  const key = await deriveKey(pass, unb64(vault.salt));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.iv) }, key, unb64(vault.ct));
  items = JSON.parse(dec.decode(plain));
  cryptoKey = key;
}
async function createVault(pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  vault = { v: 1, salt: b64(salt) };
  cryptoKey = await deriveKey(pass, salt);
  items = structuredClone(window.ITEMS);
  await seal();
}

/* ---------- đồng bộ đám mây (đăng nhập Google, chỉ chủ kho) ---------- */
const API = () => (window.STORAGE_API || "").trim();
const GCID = () => (window.GOOGLE_CLIENT_ID || "").trim();
let cloud = { token: "", exp: 0, rev: 0, ready: false };
let unlocked = false, pushing = false, again = false;
const tokenExp = (t) => { try { return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp * 1000; } catch { return 0; } };
const tokenOk = () => !!cloud.token && cloud.exp - 60000 > Date.now();
function setState(t) { $("#lockCloud").textContent = t; $("#cloudState").textContent = t; }
async function call(action, extra) {
  const r = await fetch(API(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, idToken: cloud.token, ...extra }) });
  return r.json();
}
async function adoptRemote(rv, rev) {
  if (unlocked) { // đang mở: chỉ nhận nếu cùng muối (cùng một kho) để giải mã bằng khoá hiện có
    if (rv.salt !== vault.salt) { alert(L("Kho trên đám mây dùng mật khẩu/muối khác với kho đang mở nên không thể gộp.", "The cloud library uses a different password/salt from the one open here, so they can't be merged.")); return false; }
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(rv.iv) }, cryptoKey, unb64(rv.ct));
      items = JSON.parse(dec.decode(pt));
    } catch { alert(L("Không giải mã được bản trên đám mây.", "Couldn't decrypt the cloud copy.")); return false; }
    vault = { ...plain(rv), rev, dirty: false }; saveLocal(); render();
  } else { vault = { ...plain(rv), rev, dirty: false }; saveLocal(); }
  return true;
}
async function afterSignIn() {
  setState(L("Đang kiểm tra kho trên đám mây…", "Checking the cloud library…"));
  let res;
  try { res = await call("vault_get"); } catch { setState(L("Không kết nối được máy chủ.", "Couldn't reach the server.")); return; }
  if (!res.ok) {
    cloud.token = ""; cloud.ready = false;
    setState(res.error === "denied" ? L("Mail này không phải chủ kho (hoặc máy chủ chưa cấu hình OWNER_EMAIL / GOOGLE_CLIENT_ID).", "This email isn't the library owner (or the server hasn't set OWNER_EMAIL / GOOGLE_CLIENT_ID).") : L("Không lấy được kho từ đám mây.", "Couldn't fetch the library from the cloud."));
    return;
  }
  cloud.ready = true; cloud.rev = res.rev || 0;
  const rv = res.vault;
  if (rv) {
    if (!vault || (!vault.dirty && (vault.rev || 0) < cloud.rev)) await adoptRemote(rv, cloud.rev);
    else if (vault.dirty && (vault.rev || 0) !== cloud.rev) {
      if (confirm(L("Kho trên đám mây khác với kho trên máy này.\nOK = dùng bản trên đám mây (bỏ thay đổi chưa lưu trên máy này).\nHuỷ = giữ bản trên máy này và ghi đè lên đám mây.", "The cloud library differs from the one on this device.\nOK = use the cloud copy (discard unsaved changes here).\nCancel = keep this device's copy and overwrite the cloud."))) await adoptRemote(rv, cloud.rev);
      else { vault.rev = cloud.rev; saveLocal(); }
    }
    setState(L("Đã đăng nhập Google. Kho trên đám mây: bản ", "Signed in with Google. Cloud library: version ") + cloud.rev + ".");
  } else setState(vault ? L("Đã đăng nhập Google. Kho sẽ được lưu lên đám mây khi bạn mở kho.", "Signed in with Google. The library will be saved to the cloud when you open it.") : L("Đã đăng nhập Google. Chưa có kho trên đám mây.", "Signed in with Google. No library in the cloud yet."));
  if (unlocked) pushCloud(); else renderLock();
}
async function pushCloud() {
  if (!API() || !GCID() || !vault || !vault.dirty) return;
  if (!tokenOk() || !cloud.ready) { if (cloud.ready || unlocked) setState(L("Chưa lưu lên đám mây — bấm “Đồng bộ đám mây”.", "Not saved to the cloud yet. Click “Sync to cloud”.")); return; }
  if (pushing) { again = true; return; }
  pushing = true; setState(L("Đang lưu lên đám mây…", "Saving to the cloud…"));
  try {
    const sent = vault;
    const res = await call("vault_put", { baseRev: sent.rev || 0, vault: plain(sent) });
    if (res.ok) { vault = { ...vault, rev: res.rev, dirty: vault === sent ? false : true }; cloud.rev = res.rev; saveLocal(); setState(L("Đã đồng bộ lên đám mây ✓ (bản ", "Synced to the cloud ✓ (version ") + res.rev + ")"); }
    else if (res.error === "conflict") {
      if (confirm(L("Kho trên đám mây đã được sửa từ thiết bị khác.\nOK = ghi đè bằng bản trên máy này.\nHuỷ = không lưu lên đám mây (nên tải lại và đăng nhập Google để lấy bản mới).", "The cloud library was changed on another device.\nOK = overwrite it with this device's copy.\nCancel = don't save to the cloud (reload and sign in with Google to get the latest)."))) { vault.rev = res.rev; saveLocal(); again = true; }
      else setState(L("Chưa đồng bộ: bản trên đám mây mới hơn.", "Not synced: the cloud copy is newer."));
    } else setState(res.error === "denied" ? L("Phiên Google không hợp lệ, hãy đăng nhập lại.", "Google session expired, please sign in again.") : L("Lưu lên đám mây thất bại (", "Saving to the cloud failed (") + (res.error || L("lỗi", "error")) + ").");
  } catch { setState(L("Không kết nối được máy chủ, đã lưu trên máy này.", "Couldn't reach the server; saved on this device.")); }
  pushing = false;
  if (again) { again = false; pushCloud(); }
}
function onGoogle(r) {
  cloud.token = r.credential; cloud.exp = tokenExp(r.credential);
  if ($("#gDlg").open) $("#gDlg").close();
  afterSignIn();
}
function initGoogle(n = 0) {
  if (!GCID() || !API()) return;
  $("#gBox").hidden = false; $("#cloudSync").hidden = false;
  if (!window.google?.accounts?.id) { if (n < 50) setTimeout(() => initGoogle(n + 1), 300); else setState(L("Không tải được Google Sign-In.", "Couldn't load Google Sign-In.")); return; }
  google.accounts.id.initialize({ client_id: GCID(), callback: onGoogle, auto_select: false });
  for (const id of ["gBtn", "gBtn2"]) google.accounts.id.renderButton($("#" + id), { theme: "outline", size: "large", text: "signin_with", locale: "vi" });
}


/* ---------- chữ cố định trên trang theo ngôn ngữ ---------- */
const UI = {
  kicker: ["★ Kho cá nhân", "★ Personal library"], lock_h: ["Khu <em>riêng</em> tư", "Private <em>area</em>"],
  pass: ["Mật khẩu", "Password"], pass2: ["Nhập lại mật khẩu", "Repeat password"],
  g_hint: ["Chủ kho: đăng nhập Google để mở kho trên mọi thiết bị, rồi nhập mật khẩu.", "Owner: sign in with Google to open the library on any device, then enter the password."],
  import_bk: ["Nhập bản sao lưu (kho.enc.json)", "Import backup (kho.enc.json)"], back_port: ["← Về portfolio", "← Back to portfolio"],
  to_storage: ["Truy cập Data Storage →", "Go to Data Storage →"], no_access: ["Chưa có quyền? Đăng ký ở đó, Lan Anh duyệt xong bạn sẽ xem được phần được chia sẻ.", "No access? Sign up there; once Lan Anh approves you, you can see the shared part."],
  app_h: ["Kho <em>tool</em> của mình", "My <em>toolbox</em>"], app_p: ["Nơi gom AI, thiết kế, dựng video, repo hay và kiến thức khoá học — cập nhật liên tục.", "AI, design, video editing, great repos and course notes in one place, always updated."],
  search: ["Tìm trong kho…", "Search the library…"], add: ["+ Thêm", "+ Add"],
  foot: ["★ Dữ liệu được mã hoá trong trình duyệt — nhớ Xuất bản mã để sao lưu.", "★ Data is encrypted in your browser. Remember to export the encrypted copy as a backup."],
  export: ["Xuất bản mã", "Export encrypted copy"], import: ["Nhập bản mã", "Import encrypted copy"], cloud: ["Đồng bộ đám mây", "Sync to cloud"],
  sync_st: ["Đồng bộ Storage", "Sync Storage"], lock: ["Khoá lại", "Lock"],
  f_kho: ["Kho", "Library"], f_grp: ["Mục con", "Section"], f_title: ["Tiêu đề *", "Title *"], f_type: ["Loại", "Type"], type: ["Repo, Template, Bài viết, Khoá học…", "Repo, Template, Article, Course…"],
  f_tags: ["Tag (cách nhau bằng dấu phẩy)", "Tags (comma separated)"], f_note: ["Ghi chú", "Note"], f_share: ["Chia sẻ mục này trong Data Storage", "Share this item in Data Storage"],
  marquee: ["★ KHO AI ★ KHO DESIGN ★ KHO EDIT ★ KHO TOOL ★ KHO KNOWLEDGE ★ KHO ỨNG DỤNG ★ KHO AI ★ KHO DESIGN ★ KHO EDIT ★ KHO TOOL ★ KHO KNOWLEDGE ★ KHO ỨNG DỤNG", "★ AI LIBRARY ★ DESIGN LIBRARY ★ EDIT LIBRARY ★ TOOL LIBRARY ★ KNOWLEDGE LIBRARY ★ APP LIBRARY ★ AI LIBRARY ★ DESIGN LIBRARY ★ EDIT LIBRARY ★ TOOL LIBRARY ★ KNOWLEDGE LIBRARY ★ APP LIBRARY"],
  cancel: ["Huỷ", "Cancel"], save: ["Lưu", "Save"], g_h: ["Đăng nhập Google", "Sign in with Google"],
  g_p: ["Đăng nhập lại bằng mail chủ kho để lưu/đồng bộ lên đám mây.", "Sign in again with the owner email to save/sync to the cloud."], close: ["Đóng", "Close"]
};
function applyUI() {
  const U = (k) => L(UI[k][0], UI[k][1]);
  document.querySelectorAll("[data-ku]").forEach((e) => { if (UI[e.dataset.ku]) e.textContent = U(e.dataset.ku); });
  document.querySelectorAll("[data-kh]").forEach((e) => { if (UI[e.dataset.kh]) e.innerHTML = U(e.dataset.kh); }); // chuỗi cố định trong UI
  document.querySelectorAll("[data-kp]").forEach((e) => { if (UI[e.dataset.kp]) e.placeholder = U(e.dataset.kp); });
  document.title = L("Kho cá nhân", "Personal library");
}
applyUI();
document.addEventListener("lm:content", () => { if (unlocked) render(); }); // bản dịch nội dung chi tiết vừa tải xong
document.addEventListener("lm:lang", () => {
  applyUI();
  if (unlocked) { $("#kho").innerHTML = KHO.map((k) => `<option value="${k.id}">${k.name}</option>`).join(""); render(); } else renderLock();
});
/* ---------- màn hình khoá ---------- */
async function boot() {
  try { vault = JSON.parse(localStorage.getItem(KEY)); } catch { vault = null; }
  if (!vault) {
    try { const r = await fetch("kho.enc.json", { cache: "no-store" }); if (r.ok) vault = await r.json(); } catch {}
  }
  if (vault && vault.rev === undefined) { vault.rev = 0; vault.dirty = true; } // bản cũ / bản nhập: chưa có trên đám mây
  renderLock(); initGoogle();
}
function renderLock() {
  // Chỉ chủ trang mới tạo được kho: người lạ vào không thấy form tạo kho (cần mở kho.html#setup).
  const setup = location.hash === "#setup";
  const first = !vault && setup;
  const none = !vault && !setup;
  $("#lockMsg").textContent = first
    ? L("Thiết lập lần đầu: tạo mật khẩu cho kho. Mật khẩu không thể khôi phục — hãy ghi nhớ.", "First-time setup: create a password for the library. It can't be recovered, so remember it.")
    : none ? L("Kho riêng tư. Chỉ chủ trang truy cập được.", "Private library. Only the site owner can access it.") : L("Kho riêng tư. Nhập mật khẩu để mở.", "Private library. Enter the password to open it.");
  $("#pass").hidden = none; $("#unlock").hidden = none;
  $("#pass2").hidden = !first;
  $("#unlock").textContent = first ? L("Tạo kho", "Create library") : L("Mở kho", "Open library");
  $("#lockForm").onsubmit = async (e) => {
    e.preventDefault();
    const p = $("#pass").value, err = $("#lockErr");
    err.textContent = "";
    if (none) { err.textContent = L("Không mở được kho.", "Couldn't open the library."); return; }
    try {
      if (first) {
        if (p.length < 10) { err.textContent = L("Mật khẩu tối thiểu 10 ký tự.", "Password must be at least 10 characters."); return; }
        if (p !== $("#pass2").value) { err.textContent = L("Hai mật khẩu chưa khớp.", "The passwords don't match."); return; }
        await createVault(p);
      } else await openVault(p);
      $("#pass").value = $("#pass2").value = "";
      $("#lock").hidden = true; $("#app").hidden = false;
      unlocked = true;
      start();
    } catch { err.textContent = L("Sai mật khẩu hoặc dữ liệu bị lỗi.", "Wrong password or corrupted data."); }
  };
}

/* ---------- giao diện kho ---------- */
function renderTabs() {
  $("#tabs").innerHTML = KHO.map((k) =>
    `<button class="tab ${k.id === cur ? "on" : ""}" data-k="${k.id}">${k.icon} ${k.name}<small>${Res.visible(items).filter((i) => i.kho === k.id).length + featured.filter((i) => i.kho === k.id).length}</small></button>`).join("");
}
function render() {
  const k = KHO.find((x) => x.id === cur);
  renderTabs();
  $("#desc").textContent = k.desc;
  const inKho = Res.visible(items).filter((i) => i.kho === cur).concat(featured.filter((i) => i.kho === cur));
  window.__khoCur = cur;
  // Thanh lọc tag gọn: chỉ hiện các tag dùng nhiều nhất, còn lại thu vào nút "+N thẻ"
  const freq = {};
  inKho.forEach((i) => (i.tags || []).forEach((t) => (freq[t] = (freq[t] || 0) + 1)));
  const tags = Object.keys(freq).sort((a, b) => freq[b] - freq[a] || a.localeCompare(b));
  if (tag && !tags.includes(tag)) tag = "";
  let shown = tagsOpen ? tags : tags.slice(0, TAG_LIMIT);
  if (tag && !shown.includes(tag)) shown = [tag, ...shown.slice(0, TAG_LIMIT - 1)];
  $("#tags").innerHTML = shown.map((t) => `<span class="chip ${t === tag ? "on" : ""}" data-t="${esc(t)}">#${esc(t)}</span>`).join("") +
    (tags.length > TAG_LIMIT ? `<button class="chip more" type="button" data-more>${tagsOpen ? L("Thu gọn ▴", "Show less ▴") : "+" + (tags.length - TAG_LIMIT) + L(" thẻ ▾", " more ▾")}</button>` : "");
  const needle = q.trim().toLowerCase();
  const list = inKho
    .filter((i) => !tag || (i.tags || []).includes(tag))
    .filter((i) => !needle || [i.title, i.note, i.type, (i.tags || []).join(" ")].join(" ").toLowerCase().includes(needle))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const cardOf = (i) => i.featured ? Res.card(i) : `
    <article class="card">
      ${i.type ? `<span class="badge">${esc(i.type)}</span>` : ""}${i.shared ? `<span class="badge shared">${L("Chia sẻ", "Shared")}</span>` : ""}
      <h3>${/^https?:\/\//i.test(i.url) ? `<a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)} ↗</a>` : esc(i.title)}</h3>
      <p>${esc(i.note)}</p>
      <div class="card-tags">${(i.tags || []).slice(0, 3).map((t) => `<span class="chip" data-t="${esc(t)}">#${esc(t)}</span>`).join(" ")}${(i.tags || []).length > 3 ? `<span class="chip dim">+${i.tags.length - 3}</span>` : ""}</div>
      <div class="meta"><span>${esc(i.date)}</span><span class="acts"><button data-edit="${i.id}">${L("Sửa", "Edit")}</button><button data-del="${i.id}">${L("Xoá", "Delete")}</button></span></div>
    </article>`;
  $("#grid").classList.toggle("is-apps", cur === "idea");
  if (cur === "idea") { // Kho Ứng dụng: trình bày kiểu thư viện
    $("#groups").innerHTML = ""; $("#tags").innerHTML = "";
    const acts = (i) => i.featured ? "" : `<div class="meta"><span>${esc(i.date)}</span><span class="acts"><button data-edit="${i.id}">${L("Sửa", "Edit")}</button><button data-del="${i.id}">${L("Xoá", "Delete")}</button></span></div>`;
    $("#grid").innerHTML = list.length ? Res.appShelf(list, acts) : `<div class="empty">${L("Chưa có ứng dụng nào. Bấm “+ Thêm” để bắt đầu.", "No apps yet. Click “+ Add” to start.")}</div>`;
    return;
  }
  $("#groups").innerHTML = Res.groupPills(cur, inKho, grp);
  requestAnimationFrame(() => document.querySelectorAll(".tab.on,.gpill.on").forEach((b) => { const c = b.parentElement; if (c && c.scrollWidth > c.clientWidth) c.scrollTo({ left: b.offsetLeft - c.clientWidth / 2 + b.offsetWidth / 2, behavior: "smooth" }); }));
  $("#grid").innerHTML = Res.group(list, cur, grp, cardOf) || `<div class="empty">${L("Chưa có mục nào. Bấm “+ Thêm” để bắt đầu.", "Nothing here yet. Click “+ Add” to start.")}</div>`;
}

const dlg = $("#dlg"), f = $("#form");
function fillGroups(sel) {
  const html = Res.groupSelectHtml(f.kho.value, sel);
  f.group.innerHTML = html;
  f.group.closest("label, .grp-row").hidden = !html;
}
function openForm(it) {
  f.reset();
  f.id.value = it?.id || ""; f.kho.value = it?.kho || cur; fillGroups(it?.group); f.title.value = it?.title || "";
  f.url.value = it?.url || ""; f.type.value = it?.type || ""; f.tags.value = (it?.tags || []).join(", "); f.note.value = it?.note || ""; f.shared.checked = !!it?.shared;
  $("#dlgTitle").textContent = it ? L("Sửa mục", "Edit item") : L("Thêm mục mới", "Add new item");
  dlg.showModal();
}
f.addEventListener("submit", async (e) => {
  e.preventDefault();
  let url = f.url.value.trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
  const rec = { id: f.id.value || "u" + Date.now(), kho: f.kho.value, group: f.group.value || "", title: f.title.value.trim(), url,
    type: f.type.value.trim(), note: f.note.value.trim(),
    shared: f.shared.checked, tags: f.tags.value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean), date: new Date().toISOString().slice(0, 10) };
  const idx = items.findIndex((i) => i.id === rec.id);
  if (idx >= 0) items[idx] = rec; else items.push(rec);
  await seal(); dlg.close(); cur = rec.kho; render();
});

async function start() {
  featured = await Res.load();
  Res.loadFeeds().then(() => { render(); Res.startAutoRefresh(render); });
  $("#kho").innerHTML = KHO.map((k) => `<option value="${k.id}">${k.name}</option>`).join("");
  render();
  pushCloud();
}
f.kho.addEventListener("change", () => fillGroups());
$("#cancel").onclick = () => dlg.close();
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.dataset.g !== undefined && t.classList.contains("gpill")) { grp = t.dataset.g; render(); }
  else if (t.dataset.more !== undefined) { tagsOpen = !tagsOpen; render(); }
  else if (t.dataset.k) { cur = t.dataset.k; tag = ""; grp = ""; tagsOpen = false; render(); }
  else if (t.dataset.t !== undefined) { tag = tag === t.dataset.t ? "" : t.dataset.t; render(); }
  else if (t.dataset.edit) openForm(items.find((i) => i.id === t.dataset.edit));
  else if (t.dataset.del && confirm(L("Xoá mục này?", "Delete this item?"))) { items = items.filter((i) => i.id !== t.dataset.del); await seal(); render(); }
});
$("#q").addEventListener("input", (e) => { q = e.target.value; render(); });
$("#add").onclick = () => openForm();
$("#syncStorage").onclick = async () => {
  const api = (window.STORAGE_API || "").trim();
  if (!api) { alert(L("Chưa cấu hình Data Storage (storage-config.js).", "Data Storage isn't configured (storage-config.js).")); return; }
  let key = ""; try { key = sessionStorage.getItem("lm-admin") || ""; } catch {}
  key = prompt(L("Admin key của Data Storage (chỉ bạn biết):", "Data Storage admin key (only you know it):"), key); if (!key) return;
  const shared = items.filter((i) => i.shared).map(({ id, kho, title, url, note, tags, type, date }) => ({ id, kho, title, url, note, tags, type, date }));
  try {
    const r = await fetch(api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "sync", adminKey: key, items: shared }) });
    const res = await r.json();
    if (res.ok) { try { sessionStorage.setItem("lm-admin", key); } catch {} alert(L("Đã đồng bộ ", "Synced ") + res.count + L(" mục lên Data Storage.", " items to Data Storage.")); }
    else alert(L("Không đồng bộ được: sai admin key hoặc lỗi máy chủ.", "Couldn't sync: wrong admin key or server error."));
  } catch { alert(L("Không kết nối được tới Data Storage.", "Couldn't connect to Data Storage.")); }
};
$("#cloudSync").onclick = () => { if (tokenOk() && cloud.ready) afterSignIn(); else $("#gDlg").showModal(); };
$("#gClose").onclick = () => $("#gDlg").close();
$("#lockNow").onclick = () => location.reload();
$("#export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(plain(vault))], { type: "application/json" }));
  a.download = "kho.enc.json"; a.click();
};
$("#import").onchange = async (e) => {
  try {
    const v = JSON.parse(await e.target.files[0].text());
    if (!v.salt || !v.iv || !v.ct) throw 0;
    localStorage.setItem(KEY, JSON.stringify(plain(v)));
    location.reload();
  } catch { alert(L("File kho.enc.json không hợp lệ.", "Invalid kho.enc.json file.")); }
};
if ((window.STORAGE_API || "").trim()) $("#storageBox").hidden = false; // chỉ hiện nút khi Data Storage đã được kích hoạt
$("#importLock").onchange = async (e) => {
  try {
    const v = JSON.parse(await e.target.files[0].text());
    if (!v.salt || !v.iv || !v.ct) throw 0;
    localStorage.setItem(KEY, JSON.stringify(plain(v)));
    location.hash = ""; location.reload();
  } catch { alert(L("File kho.enc.json không hợp lệ.", "Invalid kho.enc.json file.")); }
};
boot();
