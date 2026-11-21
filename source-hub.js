/* Source-hub — kho bài hay do bot Telegram bóc tách. Người xem = người đã được duyệt ở Data Storage (dùng chung email + mã). */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const okUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "#");
const SAVE = "lm-storage-login"; // dùng chung với storage.js: đã vào Storage thì vào thẳng đây

const STR = {
  h1: ["Kho <em>bài hay</em>", "Saved <em>sources</em>"],
  gate_msg: ["Bài viết, video Lan Anh thấy hay: đã bóc tách, phân tích cách áp dụng và quy trình. Vào bằng email + mã truy cập Data Storage đã được duyệt.", "Posts and videos Lan Anh found worth keeping: extracted, with how to apply them and the process. Enter with your approved Data Storage email + code."],
  f_lemail: ["Email đã đăng ký", "Registered email"], f_code: ["Mã truy cập", "Access code"], login_btn: ["Vào xem", "Enter"],
  get_code: ["Chưa có mã? Đăng ký ở Data Storage", "No code? Sign up at Data Storage"],
  err_login: ["Sai email/mã hoặc chưa được duyệt.", "Wrong email/code, or not approved yet."], err_net: ["Không kết nối được, thử lại sau.", "Couldn't connect, please try again later."],
  side_label: ["Nguồn", "Sources"], logout: ["Thoát", "Log out"], search: ["Tìm bài…", "Search…"], tag_filter: ["Lọc theo thẻ", "Filter by tag"],
  hello: ["Xin chào {n}", "Hi {n}"], all: ["Tất cả", "All"], st_items: ["{n} bài", "{n} sources"], empty: ["Chưa có bài nào.", "Nothing here yet."],
  s_summary: ["Tóm tắt", "Summary"], s_ideas: ["Ý chính", "Key ideas"], s_apply: ["Áp dụng thế nào", "How to apply"], s_process: ["Quy trình", "Process"],
  s_quotes: ["Trích nguyên văn", "Quotes"], s_angles: ["Ý tưởng bài viết", "Post ideas"], s_full: ["Bản bóc tách đầy đủ", "Full extract"],
  open_src: ["Mở nguồn gốc ↗", "Open the source ↗"], more: ["Xem phân tích →", "View analysis →"], close: ["Đóng", "Close"], loading: ["Đang tải…", "Loading…"],
  st_partial: ["Bóc tách một phần", "Partial extract"], st_failed: ["Bóc tách lỗi", "Extract failed"], menu: ["Mở danh sách nguồn", "Open source list"]
};
const S = (k, v) => { const p = STR[k] || [k, k]; let t = window.LM ? LM.t(p[0], p[1]) : p[0]; if (v) Object.keys(v).forEach((x) => (t = t.replace("{" + x + "}", v[x]))); return t; };

let who = null, items = [], plat = "", tag = "", q = "", helloName = "";
const mdCache = {};

function applyLang() {
  document.querySelectorAll("[data-i]").forEach((e) => { if (STR[e.dataset.i]) e.textContent = S(e.dataset.i); });
  document.querySelectorAll("[data-ih]").forEach((e) => { if (STR[e.dataset.ih]) e.innerHTML = S(e.dataset.ih); });
  document.querySelectorAll("[data-ph]").forEach((e) => { if (STR[e.dataset.ph]) e.placeholder = S(e.dataset.ph); });
  if (who) { $("#hello").textContent = S("hello", { n: helloName }); render(); }
}
document.addEventListener("lm:lang", applyLang);

async function enter(email, code, remember) {
  const res = await LMBackend.call("sources_list", { email, code });
  if (!res.ok) return false;
  if (remember) { try { localStorage.setItem(SAVE, JSON.stringify({ email, code })); } catch {} }
  who = { email, code }; items = res.items || [];
  helloName = email.split("@")[0];
  $("#gate").hidden = true; $("#app").hidden = false;
  applyLang();
  openFromHash();
  return true;
}

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#loginBtn"), err = $("#loginErr"); err.textContent = ""; btn.disabled = true;
  try { if (!(await enter($("#lEmail").value.trim(), $("#lCode").value.trim(), true))) err.textContent = S("err_login"); }
  catch { err.textContent = S("err_net"); }
  btn.disabled = false;
});

const statusBadge = (i) => i.status === "full" ? "" : `<span class="badge ${esc(i.status)}">${esc(S(i.status === "failed" ? "st_failed" : "st_partial"))}</span>`;
const day = (at) => String(at || "").slice(0, 10);

function render() {
  const plats = [...new Set(items.map((i) => i.platform || "web"))].sort();
  if (plat && !plats.includes(plat)) plat = "";
  const count = (p) => items.filter((i) => !p || (i.platform || "web") === p).length;
  $("#tabs").innerHTML = ["", ...plats].map((p) => `<button class="tab ${p === plat ? "on" : ""}" data-p="${esc(p)}">${esc(p || S("all"))}<small>${count(p)}</small></button>`).join("");
  const inPlat = items.filter((i) => !plat || (i.platform || "web") === plat);
  const tags = [...new Set(inPlat.flatMap((i) => i.tags || []))].sort();
  if (tag && !tags.includes(tag)) tag = "";
  { const box = $("#tagBox"); box.hidden = !tags.length; box.querySelector("summary").textContent = `${S("tag_filter")} (${tags.length})`; }
  $("#tags").innerHTML = tags.map((t) => `<span class="chip ${t === tag ? "on" : ""}" data-t="${esc(t)}">#${esc(t)}</span>`).join("");
  const n = q.trim().toLowerCase();
  const list = inPlat.filter((i) => !tag || (i.tags || []).includes(tag))
    .filter((i) => !n || [i.title, i.author, i.summary, (i.tags || []).join(" "), (i.key_ideas || []).join(" ")].join(" ").toLowerCase().includes(n));
  $("#stats").innerHTML = `<span class="lms-stat">${esc(S("st_items", { n: list.length }))}</span>`;
  $("#grid").innerHTML = list.length ? list.map((i) => `
    <article class="card" data-id="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
      <span class="badge">${esc(i.platform || "web")}</span>${statusBadge(i)}
      <h3>${esc(i.title)}</h3>
      <p>${esc((i.summary || "").slice(0, 220))}${(i.summary || "").length > 220 ? "…" : ""}</p>
      <div>${(i.tags || []).map((t) => `<span class="chip" data-t="${esc(t)}">#${esc(t)}</span>`).join(" ")}</div>
      <div class="meta"><span>${esc(day(i.at))}${i.author ? " · " + esc(i.author) : ""}</span><span class="res-more">${esc(S("more"))}</span></div>
    </article>`).join("") : `<div class="empty">${esc(S("empty"))}</div>`;
}

const listSec = (k, arr, ordered) => arr?.length ? `<h4>${esc(S(k))}</h4><${ordered ? "ol" : "ul"} class="sh-list">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</${ordered ? "ol" : "ul"}>` : "";

function open(id) {
  const i = items.find((x) => x.id === id); if (!i) return;
  const dlg = $("#resDlg");
  dlg.innerHTML = `<button class="x" id="resX" aria-label="${esc(S("close"))}">×</button>
    <div class="res-body">
      <div class="res-head"><span class="badge">${esc(i.platform || "web")}</span>${statusBadge(i)}<h2>${esc(i.title)}</h2>
        <div class="res-tags">${(i.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join(" ")}</div>
        <p><small>${esc(day(i.at))}${i.author ? " · " + esc(i.author) : ""}</small></p></div>
      ${i.summary ? `<h4>${esc(S("s_summary"))}</h4><p>${esc(i.summary)}</p>` : ""}
      ${listSec("s_ideas", i.key_ideas)}${listSec("s_apply", i.apply)}${listSec("s_process", i.process, true)}
      ${i.quotes?.length ? `<h4>${esc(S("s_quotes"))}</h4>${i.quotes.map((x) => `<blockquote class="sh-quote">${esc(x)}</blockquote>`).join("")}` : ""}
      ${listSec("s_angles", i.angles)}
      <details id="mdBox"><summary>${esc(S("s_full"))}</summary><pre class="sh-md">${esc(mdCache[id] ?? S("loading"))}</pre></details>
    </div>
    <div class="res-cta"><div><b>${esc(S("open_src"))}</b><small>${esc(String(i.url).replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(i.url))}" target="_blank" rel="noopener noreferrer">${esc(S("open_src"))}</a></div>`;
  $("#resX").onclick = () => dlg.close();
  $("#mdBox").addEventListener("toggle", async (e) => {
    if (!e.target.open || mdCache[id] != null) return;
    try { const r = await LMBackend.call("sources_get", { ...who, id }); mdCache[id] = r.ok ? r.extract_md || "" : S("err_net"); }
    catch { mdCache[id] = S("err_net"); }
    const pre = dlg.querySelector(".sh-md"); if (pre) pre.textContent = mdCache[id];
  }, { once: false });
  if (!dlg.open) dlg.showModal();
  dlg.scrollTo({ top: 0 });
  history.replaceState(null, "", "#" + id);
}
$("#resDlg").addEventListener("click", (e) => { if (e.target.id === "resDlg") e.target.close(); });
$("#resDlg").addEventListener("close", () => history.replaceState(null, "", location.pathname + location.search));
function openFromHash() { const id = location.hash.slice(1); if (id) open(id); }

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest?.("[data-p]")) { plat = t.closest("[data-p]").dataset.p; tag = ""; render(); side(false); }
  else if (t.dataset?.t !== undefined && !$("#app").hidden && !t.closest("dialog")) { tag = tag === t.dataset.t ? "" : t.dataset.t; render(); }
  else if (t.closest?.("#grid [data-id]")) open(t.closest("[data-id]").dataset.id);
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches?.("#grid [data-id]")) { e.preventDefault(); open(e.target.dataset.id); }
  if (e.key === "Escape") side(false);
});
$("#q").addEventListener("input", (e) => { q = e.target.value; render(); });

function side(open) {
  const sd = $("#lmsSide"), b = $("#lmsBurger"), sc = $("#lmsScrim");
  sd.classList.toggle("open", open); sc.hidden = !open; b.setAttribute("aria-expanded", open); b.setAttribute("aria-label", S("menu"));
}
$("#lmsBurger").addEventListener("click", () => side(!$("#lmsSide").classList.contains("open")));
$("#lmsScrim").addEventListener("click", () => side(false));
$("#logout").onclick = () => { try { localStorage.removeItem(SAVE); } catch {} location.reload(); };

applyLang();
(async () => {
  let s = null; try { s = JSON.parse(localStorage.getItem(SAVE)); } catch {}
  if (s?.email && s?.code) { try { if (!(await enter(s.email, s.code, false))) localStorage.removeItem(SAVE); } catch {} }
})();
