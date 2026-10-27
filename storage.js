/* Data Storage — người xem: đăng ký → chờ duyệt → vào xem bằng email + mã. */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const API = (window.STORAGE_API || "").trim();
const SAVE = "lm-storage-login";

let items = [], featured = [], cur = "ai", q = "", tag = "";
let grp = "";

async function call(payload) {
  if (!API) throw new Error("no_api");
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
  return r.json();
}

/* ---------- chế độ đăng ký / đăng nhập ---------- */
function setMode(m) {
  document.querySelectorAll(".seg .tab").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  $("#regForm").hidden = m !== "register" || !$("#regDone").hidden;
  $("#loginForm").hidden = m !== "login";
  const dh = $("#donHere"); if (dh) { dh.hidden = m !== "register" || !$("#regDone").hidden; if (!dh.innerHTML) dh.innerHTML = window.donateHtml({ here: true }); }
  if (m === "login") $("#regDone").hidden = true;
}
document.querySelector(".seg").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) { $("#regDone").hidden = true; setMode(b.dataset.mode); } });

setMode("register");
if (!API) {
  $("#gateMsg").textContent = "Data Storage chưa được kích hoạt. Quay lại sau nhé.";
  $("#regForm").hidden = true; $("#donHere").hidden = true; document.querySelector(".seg").hidden = true;
}

$("#regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#regBtn"), err = $("#regErr");
  err.textContent = ""; btn.disabled = true;
  try {
    const res = await call({ action: "register", name: $("#rName").value, email: $("#rEmail").value, note: $("#rNote").value });
    if (!res.ok) err.textContent = res.error === "full" ? "Tạm thời không nhận thêm đăng ký." : "Thông tin chưa hợp lệ, kiểm tra lại họ tên và email.";
    else if (res.existing) err.textContent = "Email này đã đăng ký rồi (trạng thái: " + res.status + "). Hãy dùng tab “Tôi đã có mã”.";
    else {
      $("#codeBox").textContent = res.code;
      $("#donDone").innerHTML = '<p><b>Bước tiếp theo:</b> ủng hộ Lan Anh để được duyệt. Quét mã QR (nội dung chuyển khoản đã gắn mã của bạn):</p>' + window.donateHtml({ code: res.code });
      $("#regForm").hidden = true; $("#regDone").hidden = false; $("#donHere").hidden = true;
      $("#lEmail").value = $("#rEmail").value; $("#lCode").value = res.code;
    }
  } catch { err.textContent = "Không gửi được, thử lại sau."; }
  btn.disabled = false;
});

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn"), err = $("#loginErr");
  err.textContent = ""; btn.disabled = true;
  $("#donPend").hidden = true;
  await enter($("#lEmail").value, $("#lCode").value, err, true);
  btn.disabled = false;
});

async function enter(email, code, err, remember) {
  try {
    const res = await call({ action: "access", email, code });
    if (!res.ok) { err.textContent = "Sai email hoặc mã."; return false; }
    if (!res.approved) {
      err.textContent = "Yêu cầu của bạn chưa được duyệt (" + res.status + "). Quay lại sau nhé.";
      const dp = $("#donPend"); if (dp && remember) { dp.hidden = false; dp.innerHTML = "<p>Nếu bạn chưa ủng hộ, quét mã QR bên dưới (nội dung đã gắn mã của bạn). Đã chuyển rồi thì chờ Lan Anh duyệt nhé.</p>" + window.donateHtml({ code }); }
      return false;
    }
    if (remember) { try { localStorage.setItem(SAVE, JSON.stringify({ email, code })); } catch {} }
    items = res.items || [];
    featured = await Res.load();
    Res.loadFeeds().then(() => { render(); Res.startAutoRefresh(render); });
    $("#hello").textContent = "Xin chào " + (res.name || "bạn") + " — bạn đã được duyệt xem.";
    $("#gate").hidden = true; $("#app").hidden = false;
    render();
    return true;
  } catch { err.textContent = "Không kết nối được, thử lại sau."; return false; }
}

/* ---------- danh sách (chỉ xem) ---------- */
function render() {
  const k = KHO.find((x) => x.id === cur) || KHO[0];
  $("#tabs").innerHTML = KHO.map((x) => `<button class="tab ${x.id === cur ? "on" : ""}" data-k="${x.id}">${x.icon} ${x.name}<small>${Res.visible(items).filter((i) => i.kho === x.id).length + featured.filter((i) => i.kho === x.id).length}</small></button>`).join("");
  $("#desc").textContent = k.desc;
  const inKho = Res.visible(items).filter((i) => i.kho === cur).concat(featured.filter((i) => i.kho === cur));
  const tags = [...new Set(inKho.flatMap((i) => i.tags || []))].sort();
  if (tag && !tags.includes(tag)) tag = "";
  $("#tags").innerHTML = tags.map((t) => `<span class="chip ${t === tag ? "on" : ""}" data-t="${esc(t)}">#${esc(t)}</span>`).join("");
  const n = q.trim().toLowerCase();
  const list = inKho.filter((i) => !tag || (i.tags || []).includes(tag))
    .filter((i) => !n || [i.title, i.note, i.type, (i.tags || []).join(" ")].join(" ").toLowerCase().includes(n))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const cardOf = (i) => i.featured ? Res.card(i) : `
    <article class="card">
      ${i.type ? `<span class="badge">${esc(i.type)}</span>` : ""}
      <h3>${/^https?:\/\//i.test(i.url) ? `<a href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${esc(i.title)} ↗</a>` : esc(i.title)}</h3>
      <p>${esc(i.note)}</p>
      <div>${(i.tags || []).map((t) => `<span class="chip" data-t="${esc(t)}">#${esc(t)}</span>`).join(" ")}</div>
      <div class="meta"><span>${esc(i.date)}</span></div>
    </article>`;
  $("#groups").innerHTML = Res.groupPills(cur, inKho, grp);
  $("#grid").innerHTML = Res.group(list, cur, grp, cardOf) || `<div class="empty">Chưa có mục nào được chia sẻ trong kho này.</div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset?.g !== undefined && t.classList?.contains("gpill")) { grp = t.dataset.g; render(); }
  else if (t.dataset?.k) { cur = t.dataset.k; tag = ""; grp = ""; render(); }
  else if (t.dataset?.t !== undefined && !$("#app").hidden) { tag = tag === t.dataset.t ? "" : t.dataset.t; render(); }
});
$("#q").addEventListener("input", (e) => { q = e.target.value; render(); });
$("#logout").onclick = () => { try { localStorage.removeItem(SAVE); } catch {} location.reload(); };

/* tự vào lại nếu đã lưu đăng nhập */
(async () => {
  if (!API) return;
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE)); } catch {}
  if (s?.email && s?.code) { const ok = await enter(s.email, s.code, document.createElement("p"), false); if (!ok) { try { localStorage.removeItem(SAVE); } catch {} } }
})();
