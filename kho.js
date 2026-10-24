/* Kho cá nhân — dữ liệu được mã hoá AES-GCM bằng mật khẩu của chủ site.
   Trên web chỉ có bản mã (kho.enc.json); không có mật khẩu thì không đọc được. */
const KEY = "kho-vault-v1";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const enc = new TextEncoder(), dec = new TextDecoder();

let vault = null;      // {v, salt, iv, ct} đang lưu
let cryptoKey = null;  // khoá trong bộ nhớ sau khi mở
let items = [], featured = [];
let cur = "ai", q = "", tag = "";
let grp = "";

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
  try { localStorage.setItem(KEY, JSON.stringify(vault)); } catch { alert("Không lưu được vào trình duyệt."); }
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
    if (rv.salt !== vault.salt) { alert("Kho trên đám mây dùng mật khẩu/muối khác với kho đang mở nên không thể gộp."); return false; }
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(rv.iv) }, cryptoKey, unb64(rv.ct));
      items = JSON.parse(dec.decode(pt));
    } catch { alert("Không giải mã được bản trên đám mây."); return false; }
    vault = { ...plain(rv), rev, dirty: false }; saveLocal(); render();
  } else { vault = { ...plain(rv), rev, dirty: false }; saveLocal(); }
  return true;
}
async function afterSignIn() {
  setState("Đang kiểm tra kho trên đám mây…");
  let res;
  try { res = await call("vault_get"); } catch { setState("Không kết nối được máy chủ."); return; }
  if (!res.ok) {
    cloud.token = ""; cloud.ready = false;
    setState(res.error === "denied" ? "Mail này không phải chủ kho (hoặc máy chủ chưa cấu hình OWNER_EMAIL / GOOGLE_CLIENT_ID)." : "Không lấy được kho từ đám mây.");
    return;
  }
  cloud.ready = true; cloud.rev = res.rev || 0;
  const rv = res.vault;
  if (rv) {
    if (!vault || (!vault.dirty && (vault.rev || 0) < cloud.rev)) await adoptRemote(rv, cloud.rev);
    else if (vault.dirty && (vault.rev || 0) !== cloud.rev) {
      if (confirm("Kho trên đám mây khác với kho trên máy này.\nOK = dùng bản trên đám mây (bỏ thay đổi chưa lưu trên máy này).\nHuỷ = giữ bản trên máy này và ghi đè lên đám mây.")) await adoptRemote(rv, cloud.rev);
      else { vault.rev = cloud.rev; saveLocal(); }
    }
    setState("Đã đăng nhập Google. Kho trên đám mây: bản " + cloud.rev + ".");
  } else setState(vault ? "Đã đăng nhập Google. Kho sẽ được lưu lên đám mây khi bạn mở kho." : "Đã đăng nhập Google. Chưa có kho trên đám mây.");
  if (unlocked) pushCloud(); else renderLock();
}
async function pushCloud() {
  if (!API() || !GCID() || !vault || !vault.dirty) return;
  if (!tokenOk() || !cloud.ready) { if (cloud.ready || unlocked) setState("Chưa lưu lên đám mây — bấm “Đồng bộ đám mây”."); return; }
  if (pushing) { again = true; return; }
  pushing = true; setState("Đang lưu lên đám mây…");
  try {
    const sent = vault;
    const res = await call("vault_put", { baseRev: sent.rev || 0, vault: plain(sent) });
    if (res.ok) { vault = { ...vault, rev: res.rev, dirty: vault === sent ? false : true }; cloud.rev = res.rev; saveLocal(); setState("Đã đồng bộ lên đám mây ✓ (bản " + res.rev + ")"); }
    else if (res.error === "conflict") {
      if (confirm("Kho trên đám mây đã được sửa từ thiết bị khác.\nOK = ghi đè bằng bản trên máy này.\nHuỷ = không lưu lên đám mây (nên tải lại và đăng nhập Google để lấy bản mới).")) { vault.rev = res.rev; saveLocal(); again = true; }
      else setState("Chưa đồng bộ: bản trên đám mây mới hơn.");
    } else setState(res.error === "denied" ? "Phiên Google không hợp lệ, hãy đăng nhập lại." : "Lưu lên đám mây thất bại (" + (res.error || "lỗi") + ").");
  } catch { setState("Không kết nối được máy chủ, đã lưu trên máy này."); }
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
  if (!window.google?.accounts?.id) { if (n < 50) setTimeout(() => initGoogle(n + 1), 300); else setState("Không tải được Google Sign-In."); return; }
  google.accounts.id.initialize({ client_id: GCID(), callback: onGoogle, auto_select: false });
  for (const id of ["gBtn", "gBtn2"]) google.accounts.id.renderButton($("#" + id), { theme: "outline", size: "large", text: "signin_with", locale: "vi" });
}

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
    ? "Thiết lập lần đầu: tạo mật khẩu cho kho. Mật khẩu không thể khôi phục — hãy ghi nhớ."
    : none ? "Kho riêng tư. Chỉ chủ trang truy cập được." : "Kho riêng tư. Nhập mật khẩu để mở.";
  $("#pass").hidden = none; $("#unlock").hidden = none;
  $("#pass2").hidden = !first;
  $("#unlock").textContent = first ? "Tạo kho" : "Mở kho";
  $("#lockForm").onsubmit = async (e) => {
    e.preventDefault();
    const p = $("#pass").value, err = $("#lockErr");
    err.textContent = "";
    if (none) { err.textContent = "Không mở được kho."; return; }
    try {
      if (first) {
        if (p.length < 10) { err.textContent = "Mật khẩu tối thiểu 10 ký tự."; return; }
        if (p !== $("#pass2").value) { err.textContent = "Hai mật khẩu chưa khớp."; return; }
        await createVault(p);
      } else await openVault(p);
      $("#pass").value = $("#pass2").value = "";
      $("#lock").hidden = true; $("#app").hidden = false;
      unlocked = true;
      start();
    } catch { err.textContent = "Sai mật khẩu hoặc dữ liệu bị lỗi."; }
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
  const tags = [...new Set(inKho.flatMap((i) => i.tags || []))].sort();
  if (tag && !tags.includes(tag)) tag = "";
  $("#tags").innerHTML = tags.map((t) => `<span class="chip ${t === tag ? "on" : ""}" data-t="${esc(t)}">#${esc(t)}</span>`).join("");
  const needle = q.trim().toLowerCase();
  const list = inKho
    .filter((i) => !tag || (i.tags || []).includes(tag))
    .filter((i) => !needle || [i.title, i.note, i.type, (i.tags || []).join(" ")].join(" ").toLowerCase().includes(needle))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const cardOf = (i) => i.featured ? Res.card(i) : `
    <article class="card">
      ${i.type ? `<span class="badge">${esc(i.type)}</span>` : ""}${i.shared ? `<span class="badge shared">Chia sẻ</span>` : ""}
      <h3>${/^https?:\/\//i.test(i.url) ? `<a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)} ↗</a>` : esc(i.title)}</h3>
      <p>${esc(i.note)}</p>
      <div>${(i.tags || []).map((t) => `<span class="chip" data-t="${esc(t)}">#${esc(t)}</span>`).join(" ")}</div>
      <div class="meta"><span>${esc(i.date)}</span><span class="acts"><button data-edit="${i.id}">Sửa</button><button data-del="${i.id}">Xoá</button></span></div>
    </article>`;
  $("#groups").innerHTML = Res.groupPills(cur, inKho, grp);
  $("#grid").innerHTML = Res.group(list, cur, grp, cardOf) || `<div class="empty">Chưa có mục nào. Bấm “+ Thêm” để bắt đầu.</div>`;
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
  $("#dlgTitle").textContent = it ? "Sửa mục" : "Thêm mục mới";
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
  Res.loadFeeds().then(() => render());
  $("#kho").innerHTML = KHO.map((k) => `<option value="${k.id}">${k.name}</option>`).join("");
  render();
  pushCloud();
}
f.kho.addEventListener("change", () => fillGroups());
$("#cancel").onclick = () => dlg.close();
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.dataset.g !== undefined && t.classList.contains("gpill")) { grp = t.dataset.g; render(); }
  else if (t.dataset.k) { cur = t.dataset.k; tag = ""; grp = ""; render(); }
  else if (t.dataset.t !== undefined) { tag = tag === t.dataset.t ? "" : t.dataset.t; render(); }
  else if (t.dataset.edit) openForm(items.find((i) => i.id === t.dataset.edit));
  else if (t.dataset.del && confirm("Xoá mục này?")) { items = items.filter((i) => i.id !== t.dataset.del); await seal(); render(); }
});
$("#q").addEventListener("input", (e) => { q = e.target.value; render(); });
$("#add").onclick = () => openForm();
$("#syncStorage").onclick = async () => {
  const api = (window.STORAGE_API || "").trim();
  if (!api) { alert("Chưa cấu hình Data Storage (storage-config.js)."); return; }
  let key = ""; try { key = sessionStorage.getItem("lm-admin") || ""; } catch {}
  key = prompt("Admin key của Data Storage (chỉ bạn biết):", key); if (!key) return;
  const shared = items.filter((i) => i.shared).map(({ id, kho, title, url, note, tags, type, date }) => ({ id, kho, title, url, note, tags, type, date }));
  try {
    const r = await fetch(api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "sync", adminKey: key, items: shared }) });
    const res = await r.json();
    if (res.ok) { try { sessionStorage.setItem("lm-admin", key); } catch {} alert("Đã đồng bộ " + res.count + " mục lên Data Storage."); }
    else alert("Không đồng bộ được: sai admin key hoặc lỗi máy chủ.");
  } catch { alert("Không kết nối được tới Data Storage."); }
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
  } catch { alert("File kho.enc.json không hợp lệ."); }
};
if ((window.STORAGE_API || "").trim()) $("#storageBox").hidden = false; // chỉ hiện nút khi Data Storage đã được kích hoạt
$("#importLock").onchange = async (e) => {
  try {
    const v = JSON.parse(await e.target.files[0].text());
    if (!v.salt || !v.iv || !v.ct) throw 0;
    localStorage.setItem(KEY, JSON.stringify(plain(v)));
    location.hash = ""; location.reload();
  } catch { alert("File kho.enc.json không hợp lệ."); }
};
boot();
