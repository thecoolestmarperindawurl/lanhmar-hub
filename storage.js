/* Data Storage — người xem: đăng ký → chờ duyệt → vào xem bằng email + mã. */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const API = (window.STORAGE_API || "").trim();
const SAVE = "lm-storage-login";

let items = [], featured = [], cur = "ai", q = "", tag = "";
let grp = "";

/* ---------- song ngữ (lang.js) ---------- */
const STR = {
  gate_msg: ["Một phần Kho cá nhân của Lan Anh được chia sẻ cho người đã đăng ký và được duyệt.", "Part of Lan Anh's personal library, shared with people who sign up and get approved."],
  gate_off: ["Data Storage chưa được kích hoạt. Quay lại sau nhé.", "Data Storage isn't open yet. Please check back later."],
  tab_reg: ["Đăng ký truy cập", "Request access"], tab_login: ["Tôi đã có mã", "I have a code"],
  f_name: ["Họ tên", "Full name"], f_note: ["Nội dung chuyển khoản / email khoá học KesFlow (nếu có), hoặc bạn muốn xem gì?", "Transfer note / KesFlow course email (if any), or what would you like to see?"],
  reg_btn: ["Gửi đăng ký", "Send request"],
  done1: ["<b>Đã gửi yêu cầu.</b> Đây là mã truy cập của bạn, chỉ hiện <b>một lần</b>. Hãy lưu lại:", "<b>Request sent.</b> Here is your access code. It's shown <b>only once</b>, so save it:"],
  done2: ["Khi Lan Anh duyệt, bạn dùng <b>email + mã này</b> ở tab “Tôi đã có mã” để vào xem. Chưa được duyệt thì sẽ chưa vào được.", "Once Lan Anh approves you, use your <b>email + this code</b> on the “I have a code” tab. You can't get in before approval."],
  f_lemail: ["Email đã đăng ký", "Registered email"], f_code: ["Mã truy cập", "Access code"], login_btn: ["Vào xem", "Enter"],
  back_kho: ["← Về Kho cá nhân", "← Personal library"], back_port: ["← Về portfolio", "← Back to portfolio"],
  h1: ["Kho <em>chia sẻ</em>", "Shared <em>library</em>"], search: ["Tìm trong kho…", "Search the library…"], logout: ["Thoát", "Log out"],
  err_full: ["Tạm thời không nhận thêm đăng ký.", "Not accepting new sign-ups for now."],
  err_bad: ["Thông tin chưa hợp lệ, kiểm tra lại họ tên và email.", "Something's not right, please check your name and email."],
  err_exist: ["Email này đã đăng ký rồi (trạng thái: {s}). Hãy dùng tab “Tôi đã có mã”.", "This email is already registered (status: {s}). Use the “I have a code” tab."],
  next_step: ["<b>Bước tiếp theo:</b> ủng hộ Lan Anh để được duyệt. Quét mã QR (nội dung chuyển khoản đã gắn mã của bạn):", "<b>Next step:</b> support Lan Anh to get approved. Scan the QR code (the transfer note already includes your code):"],
  err_send: ["Không gửi được, thử lại sau.", "Couldn't send, please try again later."],
  err_login: ["Sai email hoặc mã.", "Wrong email or code."],
  err_pending: ["Yêu cầu của bạn chưa được duyệt ({s}). Quay lại sau nhé.", "Your request hasn't been approved yet ({s}). Please check back later."],
  pend_qr: ["Nếu bạn chưa ủng hộ, quét mã QR bên dưới (nội dung đã gắn mã của bạn). Đã chuyển rồi thì chờ Lan Anh duyệt nhé.", "If you haven't supported yet, scan the QR code below (the note includes your code). Already sent it? Just wait for Lan Anh to approve."],
  err_net: ["Không kết nối được, thử lại sau.", "Couldn't connect, please try again later."],
  hello: ["Xin chào {n} — bạn đã được duyệt xem.", "Hi {n}, you're approved to browse."], you: ["bạn", "there"],
  empty_apps: ["Chưa có ứng dụng nào được chia sẻ.", "No apps shared yet."], empty: ["Chưa có mục nào được chia sẻ trong kho này.", "Nothing shared in this library yet."],
  title: ["Data Storage — LANHMAR", "Data Storage — LANHMAR"]
};
const S = (k, v) => { const p = STR[k] || [k, k]; let t = window.LM ? LM.t(p[0], p[1]) : p[0]; if (v) Object.keys(v).forEach((x) => (t = t.replace("{" + x + "}", v[x]))); return t; };
let helloName = "";
function applyLang() {
  document.querySelectorAll("[data-i]").forEach((e) => { if (STR[e.dataset.i]) e.textContent = S(e.dataset.i); });
  document.querySelectorAll("[data-ih]").forEach((e) => { if (STR[e.dataset.ih]) e.innerHTML = S(e.dataset.ih); }); // chuỗi cố định trong STR
  document.querySelectorAll("[data-ph]").forEach((e) => { e.placeholder = S(e.dataset.ph); });
  if (!API) $("#gateMsg").textContent = S("gate_off");
  if (helloName) $("#hello").textContent = S("hello", { n: helloName });
  const dh = $("#donHere"); if (dh && dh.innerHTML) dh.innerHTML = window.donateHtml({ here: true });
}
document.addEventListener("lm:lang", () => { applyLang(); if (!$("#app").hidden) render(); });
document.addEventListener("lm:content", () => { if (!$("#app").hidden) render(); }); // bản dịch nội dung chi tiết vừa tải xong

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

applyLang();
setMode("register");
if (!API) {
  $("#gateMsg").textContent = S("gate_off");
  $("#regForm").hidden = true; $("#donHere").hidden = true; document.querySelector(".seg").hidden = true;
}

$("#regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#regBtn"), err = $("#regErr");
  err.textContent = ""; btn.disabled = true;
  try {
    const res = await call({ action: "register", name: $("#rName").value, email: $("#rEmail").value, note: $("#rNote").value });
    if (!res.ok) err.textContent = res.error === "full" ? S("err_full") : S("err_bad");
    else if (res.existing) err.textContent = S("err_exist", { s: res.status });
    else {
      $("#codeBox").textContent = res.code;
      $("#donDone").innerHTML = "<p>" + S("next_step") + "</p>" + window.donateHtml({ code: res.code });
      $("#regForm").hidden = true; $("#regDone").hidden = false; $("#donHere").hidden = true;
      $("#lEmail").value = $("#rEmail").value; $("#lCode").value = res.code;
    }
  } catch { err.textContent = S("err_send"); }
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
    if (!res.ok) { err.textContent = S("err_login"); return false; }
    if (!res.approved) {
      err.textContent = S("err_pending", { s: res.status });
      const dp = $("#donPend"); if (dp && remember) { dp.hidden = false; dp.innerHTML = "<p>" + S("pend_qr") + "</p>" + window.donateHtml({ code }); }
      return false;
    }
    if (remember) { try { localStorage.setItem(SAVE, JSON.stringify({ email, code })); } catch {} }
    items = res.items || [];
    featured = await Res.load();
    Res.loadFeeds().then(() => { render(); Res.startAutoRefresh(render); });
    helloName = res.name || S("you"); $("#hello").textContent = S("hello", { n: helloName });
    $("#gate").hidden = true; $("#app").hidden = false;
    render();
    return true;
  } catch { err.textContent = S("err_net"); return false; }
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
    $("#grid").innerHTML = list.length ? Res.appShelf(list) : `<div class="empty">${esc(S("empty_apps"))}</div>`;
    return;
  }
  $("#groups").innerHTML = Res.groupPills(cur, inKho, grp);
  $("#grid").innerHTML = Res.group(list, cur, grp, cardOf) || `<div class="empty">${esc(S("empty"))}</div>`;
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
