/* Data Storage — người xem: đăng ký → chờ duyệt → vào xem bằng email + mã. */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const API = (window.STORAGE_API || "").trim();
const SAVE = "lm-storage-login";

let items = [], featured = [], cur = "ai", q = "", tag = "";
let grp = "";

/* ---------- song ngữ VI/EN: dùng chung "lm_lang" với trang chủ; nút nằm ở cổng (.gate-lang) và thanh điều khiển (fx.js chèn .neu-lang) ---------- */
const STORAGE_UI = {
  vi: { back: "← Về portfolio", h1: "Kho <em>chia sẻ</em>", gate_msg: "Một phần Kho cá nhân của Lan Anh được chia sẻ cho người đã đăng ký và được duyệt.",
    t_reg: "Đăng ký truy cập", t_login: "Tôi đã có mã", l_name: "Họ tên", l_note: "Nội dung chuyển khoản / email khoá học KesFlow (nếu có), hoặc bạn muốn xem gì?",
    b_reg: "Gửi đăng ký", done1: "<b>Đã gửi yêu cầu.</b> Đây là mã truy cập của bạn, chỉ hiện <b>một lần</b>. Hãy lưu lại:",
    done2: "Khi Lan Anh duyệt, bạn dùng <b>email + mã này</b> ở tab “Tôi đã có mã” để vào xem. Chưa được duyệt thì sẽ chưa vào được.",
    l_lemail: "Email đã đăng ký", l_code: "Mã truy cập", b_login: "Vào xem", to_kho: "← Về Kho cá nhân", logout: "Thoát", search: "Tìm trong kho…",
    no_api: "Data Storage chưa được kích hoạt. Quay lại sau nhé.", full: "Tạm thời không nhận thêm đăng ký.", invalid: "Thông tin chưa hợp lệ, kiểm tra lại họ tên và email.",
    existing: (st) => "Email này đã đăng ký rồi (trạng thái: " + st + "). Hãy dùng tab “Tôi đã có mã”.",
    next_step: "<p><b>Bước tiếp theo:</b> ủng hộ Lan Anh để được duyệt. Quét mã QR (nội dung chuyển khoản đã gắn mã của bạn):</p>",
    send_fail: "Không gửi được, thử lại sau.", wrong: "Sai email hoặc mã.", pending: (st) => "Yêu cầu của bạn chưa được duyệt (" + st + "). Quay lại sau nhé.",
    pending_don: "<p>Nếu bạn chưa ủng hộ, quét mã QR bên dưới (nội dung đã gắn mã của bạn). Đã chuyển rồi thì chờ Lan Anh duyệt nhé.</p>",
    conn_fail: "Không kết nối được, thử lại sau.", hello: (n) => "Xin chào " + (n || "bạn") + " — bạn đã được duyệt xem.",
    empty_apps: "Chưa có ứng dụng nào được chia sẻ.", empty: "Chưa có mục nào được chia sẻ trong kho này." },
  en: { back: "← Back to portfolio", h1: "Shared <em>library</em>", gate_msg: "Part of Lan Anh's personal library is shared with people who registered and were approved.",
    t_reg: "Request access", t_login: "I have a code", l_name: "Full name", l_note: "Transfer note / KesFlow course email (if any), or what you'd like to see?",
    b_reg: "Send request", done1: "<b>Request sent.</b> This is your access code, shown <b>only once</b>. Save it:",
    done2: "Once Lan Anh approves, use <b>your email + this code</b> in the “I have a code” tab to view. Until approved you can't get in.",
    l_lemail: "Registered email", l_code: "Access code", b_login: "Enter", to_kho: "← Back to Personal Library", logout: "Sign out", search: "Search the library…",
    no_api: "Data Storage isn't activated yet. Please check back later.", full: "Not accepting new registrations for now.", invalid: "Invalid details, please check your name and email.",
    existing: (st) => "This email is already registered (status: " + st + "). Use the “I have a code” tab.",
    next_step: "<p><b>Next step:</b> support Lan Anh to get approved. Scan the QR code (the transfer note already carries your code):</p>",
    send_fail: "Couldn't send, please try again later.", wrong: "Wrong email or code.", pending: (st) => "Your request hasn't been approved yet (" + st + "). Please check back later.",
    pending_don: "<p>If you haven't supported yet, scan the QR code below (the note carries your code). Already transferred? Please wait for Lan Anh to approve.</p>",
    conn_fail: "Couldn't connect, please try again later.", hello: (n) => "Hello " + (n || "there") + " — you're approved to view.",
    empty_apps: "No apps shared yet.", empty: "Nothing shared in this library yet." }
};
let lang = "vi"; try { lang = localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch {}
const T = (k) => STORAGE_UI[lang][k] ?? STORAGE_UI.vi[k];
let helloName = null; // tên người xem sau khi đăng nhập, để dịch lại câu chào khi đổi ngôn ngữ
function paintLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll(".lang button").forEach((b) => { const on = b.dataset.lang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  document.querySelectorAll("[data-i]").forEach((e) => { e.textContent = T(e.dataset.i); });
  document.querySelectorAll("[data-ih]").forEach((e) => { e.innerHTML = T(e.dataset.ih); }); // chuỗi cố định trong STORAGE_UI
  document.querySelectorAll("[data-ph]").forEach((e) => { e.placeholder = T(e.dataset.ph); });
  const sw = document.querySelector(".neu-sw span"); if (sw) sw.textContent = lang === "en" ? "Compact" : "Gọn";
  if (helloName !== null) $("#hello").textContent = T("hello")(helloName);
  if (!API) $("#gateMsg").textContent = T("no_api");
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest(".lang button"); if (!b) return;
  const next = b.dataset.lang === "en" ? "en" : "vi"; if (next === lang) return;
  lang = next; try { localStorage.setItem("lm_lang", lang); } catch {}
  paintLang();
  if (!$("#app").hidden) { featured = await Res.load(); render(); }
});
document.addEventListener("DOMContentLoaded", paintLang); // sau khi fx.js đã chèn nút VI/EN vào thanh điều khiển

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
  $("#gateMsg").textContent = T("no_api");
  $("#regForm").hidden = true; $("#donHere").hidden = true; document.querySelector(".seg").hidden = true;
}

$("#regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#regBtn"), err = $("#regErr");
  err.textContent = ""; btn.disabled = true;
  try {
    const res = await call({ action: "register", name: $("#rName").value, email: $("#rEmail").value, note: $("#rNote").value });
    if (!res.ok) err.textContent = res.error === "full" ? T("full") : T("invalid");
    else if (res.existing) err.textContent = T("existing")(res.status);
    else {
      $("#codeBox").textContent = res.code;
      $("#donDone").innerHTML = T("next_step") + window.donateHtml({ code: res.code });
      $("#regForm").hidden = true; $("#regDone").hidden = false; $("#donHere").hidden = true;
      $("#lEmail").value = $("#rEmail").value; $("#lCode").value = res.code;
    }
  } catch { err.textContent = T("send_fail"); }
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
    if (!res.ok) { err.textContent = T("wrong"); return false; }
    if (!res.approved) {
      err.textContent = T("pending")(res.status);
      const dp = $("#donPend"); if (dp && remember) { dp.hidden = false; dp.innerHTML = T("pending_don") + window.donateHtml({ code }); }
      return false;
    }
    if (remember) { try { localStorage.setItem(SAVE, JSON.stringify({ email, code })); } catch {} }
    items = res.items || [];
    featured = await Res.load();
    Res.loadFeeds().then(() => { render(); Res.startAutoRefresh(render); });
    helloName = res.name || ""; $("#hello").textContent = T("hello")(helloName);
    $("#gate").hidden = true; $("#app").hidden = false;
    render();
    return true;
  } catch { err.textContent = T("conn_fail"); return false; }
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
  $("#grid").classList.toggle("is-apps", cur === "idea");
  if (cur === "idea") { // Kho Ứng dụng: trình bày kiểu thư viện
    $("#groups").innerHTML = ""; $("#tags").innerHTML = "";
    $("#grid").innerHTML = list.length ? Res.appShelf(list) : `<div class="empty">${T("empty_apps")}</div>`;
    return;
  }
  $("#groups").innerHTML = Res.groupPills(cur, inKho, grp);
  $("#grid").innerHTML = Res.group(list, cur, grp, cardOf) || `<div class="empty">${T("empty")}</div>`;
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
