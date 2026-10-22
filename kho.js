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
let items = [];
let cur = "ai", q = "", tag = "";

async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function seal() {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, enc.encode(JSON.stringify(items)));
  vault = { v: 1, salt: vault.salt, iv: b64(iv), ct: b64(ct) };
  try { localStorage.setItem(KEY, JSON.stringify(vault)); } catch { alert("Không lưu được vào trình duyệt."); }
}
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

/* ---------- màn hình khoá ---------- */
async function boot() {
  try { vault = JSON.parse(localStorage.getItem(KEY)); } catch { vault = null; }
  if (!vault) {
    try { const r = await fetch("kho.enc.json", { cache: "no-store" }); if (r.ok) vault = await r.json(); } catch {}
  }
  const first = !vault;
  $("#lockMsg").textContent = first
    ? "Lần đầu: tạo mật khẩu cho kho. Mật khẩu không thể khôi phục — hãy ghi nhớ."
    : "Kho riêng tư. Nhập mật khẩu để mở.";
  $("#pass2").hidden = !first;
  $("#unlock").textContent = first ? "Tạo kho" : "Mở kho";
  $("#lockForm").onsubmit = async (e) => {
    e.preventDefault();
    const p = $("#pass").value, err = $("#lockErr");
    err.textContent = "";
    try {
      if (first) {
        if (p.length < 10) { err.textContent = "Mật khẩu tối thiểu 10 ký tự."; return; }
        if (p !== $("#pass2").value) { err.textContent = "Hai mật khẩu chưa khớp."; return; }
        await createVault(p);
      } else await openVault(p);
      $("#pass").value = $("#pass2").value = "";
      $("#lock").hidden = true; $("#app").hidden = false;
      start();
    } catch { err.textContent = "Sai mật khẩu hoặc dữ liệu bị lỗi."; }
  };
}

/* ---------- giao diện kho ---------- */
function renderTabs() {
  $("#tabs").innerHTML = KHO.map((k) =>
    `<button class="tab ${k.id === cur ? "on" : ""}" data-k="${k.id}">${k.icon} ${k.name}<small>${items.filter((i) => i.kho === k.id).length}</small></button>`).join("");
}
function render() {
  const k = KHO.find((x) => x.id === cur);
  renderTabs();
  $("#desc").textContent = k.desc;
  const inKho = items.filter((i) => i.kho === cur);
  const tags = [...new Set(inKho.flatMap((i) => i.tags || []))].sort();
  if (tag && !tags.includes(tag)) tag = "";
  $("#tags").innerHTML = tags.map((t) => `<span class="chip ${t === tag ? "on" : ""}" data-t="${esc(t)}">#${esc(t)}</span>`).join("");
  const needle = q.trim().toLowerCase();
  const list = inKho
    .filter((i) => !tag || (i.tags || []).includes(tag))
    .filter((i) => !needle || [i.title, i.note, i.type, (i.tags || []).join(" ")].join(" ").toLowerCase().includes(needle))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  $("#grid").innerHTML = list.length ? list.map((i) => `
    <article class="card">
      ${i.type ? `<span class="badge">${esc(i.type)}</span>` : ""}${i.shared ? `<span class="badge shared">Chia sẻ</span>` : ""}
      <h3>${/^https?:\/\//i.test(i.url) ? `<a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)} ↗</a>` : esc(i.title)}</h3>
      <p>${esc(i.note)}</p>
      <div>${(i.tags || []).map((t) => `<span class="chip" data-t="${esc(t)}">#${esc(t)}</span>`).join(" ")}</div>
      <div class="meta"><span>${esc(i.date)}</span><span class="acts"><button data-edit="${i.id}">Sửa</button><button data-del="${i.id}">Xoá</button></span></div>
    </article>`).join("") : `<div class="empty">Chưa có mục nào. Bấm “+ Thêm” để bắt đầu.</div>`;
}

const dlg = $("#dlg"), f = $("#form");
function openForm(it) {
  f.reset();
  f.id.value = it?.id || ""; f.kho.value = it?.kho || cur; f.title.value = it?.title || "";
  f.url.value = it?.url || ""; f.type.value = it?.type || ""; f.tags.value = (it?.tags || []).join(", "); f.note.value = it?.note || ""; f.shared.checked = !!it?.shared;
  $("#dlgTitle").textContent = it ? "Sửa mục" : "Thêm mục mới";
  dlg.showModal();
}
f.addEventListener("submit", async (e) => {
  e.preventDefault();
  let url = f.url.value.trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
  const rec = { id: f.id.value || "u" + Date.now(), kho: f.kho.value, title: f.title.value.trim(), url,
    type: f.type.value.trim(), note: f.note.value.trim(),
    shared: f.shared.checked, tags: f.tags.value.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean), date: new Date().toISOString().slice(0, 10) };
  const idx = items.findIndex((i) => i.id === rec.id);
  if (idx >= 0) items[idx] = rec; else items.push(rec);
  await seal(); dlg.close(); cur = rec.kho; render();
});

function start() {
  $("#kho").innerHTML = KHO.map((k) => `<option value="${k.id}">${k.name}</option>`).join("");
  render();
}
$("#cancel").onclick = () => dlg.close();
document.addEventListener("click", async (e) => {
  const t = e.target;
  if (t.dataset.k) { cur = t.dataset.k; tag = ""; render(); }
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
$("#lockNow").onclick = () => location.reload();
$("#export").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(vault)], { type: "application/json" }));
  a.download = "kho.enc.json"; a.click();
};
$("#import").onchange = async (e) => {
  try {
    const v = JSON.parse(await e.target.files[0].text());
    if (!v.salt || !v.iv || !v.ct) throw 0;
    localStorage.setItem(KEY, JSON.stringify(v));
    location.reload();
  } catch { alert("File kho.enc.json không hợp lệ."); }
};
if ((window.STORAGE_API || "").trim()) $("#storageBox").hidden = false; // chỉ hiện nút khi Data Storage đã được kích hoạt
boot();
