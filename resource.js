/* Tài nguyên nổi bật (kho-featured.json):
   - Thẻ tài liệu: thumbnail nhỏ, bấm mở cửa sổ giới thiệu + demo + link file ở cuối.
   - Thẻ LIVE: "claude" (bản phát hành Claude Code), "ainews" (tin 10 hãng AI, lọc theo hãng), "ranking" (xếp hạng công ty AI).
   Tin lấy qua Apps Script (cache máy chủ 5 phút, web tự làm mới mỗi 5 phút khi đang mở), tóm tắt tiếng Việt, báo "mới" + thông báo nổi.
   Dùng chung cho Kho cá nhân (kho.js) và Data Storage (storage.js). */
window.Res = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Văn bản thuần: bỏ thẻ HTML còn sót (kể cả thẻ bị mã hoá trong mô tả RSS) và giải mã ký tự đặc biệt
  const plain = (s) => { let t = String(s ?? ""); for (let k = 0; k < 2; k++) t = new DOMParser().parseFromString(t, "text/html").body.textContent || ""; return t.replace(/\s+/g, " ").trim(); };
  // Sửa lỗi dịch máy đã biết: "Gemini" bị dịch thành cung "Song Tử" (máy chủ mới đã chặn, đây là lớp phòng thêm cho tin cũ trong cache)
  const vi = (s) => plain(s).replace(/cung\s+Song\s+Tử/gi, "Gemini").replace(/Song\s+Tử/g, "Gemini");
  const okUrl = (u) => (/^(https?:\/\/|docs\/|assets\/)[^\s"'<>]*$/i.test(String(u || "")) ? u : "");
  const fmtDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d.split("-").reverse().join("/") : d || "");
  const API = () => (window.STORAGE_API || "").trim();
  let list = [], feeds = null;
  const TTL = 2 * 60e3;   // cache trình duyệt
  let live = null, keepScroll = null, notified = 0, lastRefresh = Date.now();
  const ai = {}; // id hãng -> { items, updated }

  async function load() {
    try {
      const r = await fetch("kho-featured.json?v=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return (list = []);
      const j = await r.json();
      list = (j.items || []).map((i) => ({ ...i, featured: true }));
    } catch { list = []; }
    return list;
  }
  const all = () => list;
  // Ẩn mục thường trùng link với mục nổi bật (hoặc nằm trong danh sách "hide")
  const visible = (arr) => { const u = new Set(list.flatMap((x) => [x.url, ...(x.hide || [])]).filter(Boolean)); return arr.filter((i) => !u.has(i.url)); };

  /* ---------- gọi API ---------- */
  async function post(body) {
    const r = await fetch(API(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    return r.json();
  }
  async function loadAi(id, force) {
    const prev = ai[id];
    if (force) { delete ai[id]; try { sessionStorage.removeItem("lm-ai-" + id); } catch {} }
    if (ai[id]) return ai[id];
    try { const c = JSON.parse(sessionStorage.getItem("lm-ai-" + id)); if (c && Date.now() - c.t < TTL) return (ai[id] = c.v); } catch {}
    if (!API()) return null;
    try {
      const j = await post({ action: "ainews", c: id });
      if (j.ok) { ai[id] = j; try { sessionStorage.setItem("lm-ai-" + id, JSON.stringify({ t: Date.now(), v: j })); } catch {} baseline("ai-" + id, j.items); return j; }
    } catch {}
    if (prev) ai[id] = prev; // làm mới lỗi thì giữ tin cũ
    return prev || null;
  }

  /* ---------- mốc "đã xem" + tin mới ---------- */
  const seenKey = (k) => "lm-seen-" + k;
  const latest = (items) => (items || []).map((x) => x.d || "").sort().pop() || "";
  function baseline(k, items) { try { if (!localStorage.getItem(seenKey(k))) localStorage.setItem(seenKey(k), latest(items)); } catch {} }
  const seenOf = (k) => { try { return localStorage.getItem(seenKey(k)) || ""; } catch { return ""; } };
  const countNew = (k, items) => { const s = seenOf(k); return s ? (items || []).filter((x) => x.d && x.d > s).length : 0; };
  const markSeen = (k, items) => { const l = latest(items); if (l) try { localStorage.setItem(seenKey(k), l); } catch {} };
  const aiNew = () => Object.entries(ai).reduce((n, [id, v]) => n + countNew("ai-" + id, v.items), 0);
  const claudeNew = () => (feeds ? countNew("claude", feeds.claude) : 0);

  function toast(msg) {
    let t = document.getElementById("resToast");
    if (!t) { t = document.createElement("div"); t.id = "resToast"; t.className = "res-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 7000);
  }

  async function loadFeeds(force) {
    if (!API() || !list.some((i) => i.feed)) return null;
    const prevFeeds = feeds;
    if (force) { feeds = null; try { sessionStorage.removeItem("lm-news"); } catch {} }
    const tasks = [];
    if (list.some((i) => i.feed === "claude")) {
      tasks.push((async () => {
        try { const c = JSON.parse(sessionStorage.getItem("lm-news")); if (c && Date.now() - c.t < TTL) feeds = c.v; } catch {}
        if (!feeds) { try { const j = await post({ action: "news" }); if (j.ok) { feeds = j; try { sessionStorage.setItem("lm-news", JSON.stringify({ t: Date.now(), v: j })); } catch {} } } catch {} }
        if (feeds) baseline("claude", feeds.claude);
      })());
    }
    const an = list.find((i) => i.feed === "ainews");
    if (an) { const ids = new Set((an.companies || []).slice(0, 3).map((c) => c.id)); Object.keys(ai).forEach((k) => ids.add(k)); ids.forEach((id) => tasks.push(loadAi(id, force))); } // nạp trước 3 hãng đầu; làm mới thì nạp lại cả các hãng đã xem
    await Promise.all(tasks);
    if (!feeds && prevFeeds) feeds = prevFeeds; // làm mới lỗi thì giữ tin cũ
    const nc = claudeNew(), nn = aiNew();
    if (nc + nn > notified) {
      notified = nc + nn;
      const parts = []; if (nc) parts.push(nc + " bản Claude Code"); if (nn) parts.push(nn + " tin AI");
      toast("🔔 Có cập nhật mới: " + parts.join(" · "));
    }
    return feeds;
  }

  /* ---------- tự làm mới ---------- */
  const reopenLive = () => {
    const dlg = document.getElementById("resDlg");
    if (!live || !dlg || !dlg.open) return;
    keepScroll = dlg.scrollTop;
    const i = list.find((x) => x.id === live.id); if (!i) return;
    if (live.type === "claude") openClaude(i, dlg); else openAi(i, dlg, live.c);
  };
  async function refresh(force = true) {
    lastRefresh = Date.now();
    await loadFeeds(force);
    reopenLive();
  }
  function startAutoRefresh(onChange) {
    const run = async () => { try { await refresh(true); } catch {} if (onChange) onChange(); };
    setInterval(() => { if (document.visibilityState === "visible") run(); }, 5 * 60e3);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && Date.now() - lastRefresh > 2 * 60e3) run(); });
    window.addEventListener("online", run);
  }
  const refreshBtn = '<button class="btn news-refresh" type="button" data-refresh>↻ Làm mới</button>';

  const updatedText = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }); };
  const OFFICIAL = { anthropic: "https://www.anthropic.com/news", openai: "https://openai.com/news", google: "https://blog.google/products/gemini/", meta: "https://about.fb.com/news/", mistral: "https://mistral.ai/news", nvidia: "https://blogs.nvidia.com/" };
  const compName = (an, id) => (an.companies.find((c) => c.id === id) || {}).name || id;

  /* ---------- thẻ ---------- */
  function liveBadges(i, n) { return `<span class="badge live"><i></i>LIVE</span><span class="badge">${esc(i.type || "Cập nhật trực tiếp")}</span>${n ? `<span class="badge new">${n} mới</span>` : ""}`; }

  function card(i) {
    if (i.feed === "claude") {
      const arr = (feeds && feeds.claude) || [];
      return `<article class="card res-card feed-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info">${liveBadges(i, claudeNew())}<h3>${esc(i.title)}</h3>
        ${arr.length ? `<ul class="feed-mini">${arr.slice(0, 2).map((x) => `<li><b>v${esc(x.v)}</b> ${esc((x.pt && x.pt[0]) || (x.pte && x.pte[0]) || "")}</li>`).join("")}</ul>` : `<p>${feeds ? "Chưa có tin." : "Đang tải tin mới…"}</p>`}
        <div class="meta"><span>${feeds ? "Cập nhật " + esc(updatedText(feeds.updated)) : esc(i.note || "")}</span><span class="res-more">Xem tất cả →</span></div></div></article>`;
    }
    if (i.feed === "ainews") {
      const loaded = Object.entries(ai).filter(([, v]) => v.items && v.items[0]).map(([id, v]) => ({ ...v.items[0], id })); // tin mới nhất của mỗi hãng
      loaded.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
      return `<article class="card res-card feed-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info">${liveBadges(i, aiNew())}<h3>${esc(i.title)}</h3>
        ${loaded.length ? `<ul class="feed-mini">${loaded.slice(0, 3).map((x) => `<li><b>${esc(compName(i, x.id).split(" ·")[0])}</b> ${esc(vi(x.t || x.te))}</li>`).join("")}</ul>` : `<p>${API() ? "Đang tải tin mới…" : esc(i.note || "")}</p>`}
        <div class="meta"><span>Theo dõi ${(i.companies || []).length} hãng AI</span><span class="res-more">Xem tất cả →</span></div></div></article>`;
    }
    if (i.feed === "ranking") {
      return `<article class="card res-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info"><span class="badge">${esc(i.type)}</span><span class="badge shared">Cập nhật ${esc(i.asof)}</span>
        <h3>${esc(i.title)}</h3><p>${esc(i.note)}</p><div class="meta"><span>${esc(i.date)}</span><span class="res-more">Xem bảng xếp hạng →</span></div></div></article>`;
    }
    return `<article class="card res-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
      <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy">
      <div class="res-info"><div class="res-badges">${(() => { const a = i.type || "Tài nguyên", b = i.guide ? i.badge || "Đọc trước" : "Nổi bật", la = a.toLowerCase(), lb = b.toLowerCase(), same = la.includes(lb) || lb.includes(la); return `<span class="badge">${esc(a)}</span>` + (same ? "" : `<span class="badge shared">${esc(b)}</span>`); })()}</div>
        <h3>${esc(i.title)}</h3><p>${esc(i.note)}</p>
        <div class="meta"><span>${esc(i.date)}</span><span class="res-more">Xem chi tiết →</span></div></div>
    </article>`;
  }

  /* ---------- cửa sổ ---------- */
  function show(dlg, html) {
    dlg.innerHTML = html;
    dlg.querySelector("#resX").onclick = () => dlg.close();
    if (!dlg.dataset.wired) { dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); dlg.dataset.wired = "1"; }
    if (!dlg.open) dlg.showModal();
    dlg.scrollTo({ top: keepScroll == null ? 0 : keepScroll, behavior: "instant" }); keepScroll = null;
    if (!dlg.dataset.liveWired) { dlg.addEventListener("close", () => { live = null; }); dlg.dataset.liveWired = "1"; }
  }
  const cta = (title, url) => `<div class="res-cta"><div><b>${esc(title)}</b><small>${esc(String(url).replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(url))}" target="_blank" rel="noopener">Mở trang gốc ↗</a></div>`;
  const head = (i, extra) => `<button class="x" id="resX" aria-label="Đóng">×</button><div class="res-body"><div class="res-head"><span class="badge live"><i></i>LIVE</span><h2>${esc(i.title)}</h2>${extra || ""}</div>`;

  function openClaude(i, dlg) {
    live = { type: "claude", id: i.id };
    const arr = (feeds && feeds.claude) || [];
    const body = !arr.length ? `<p class="res-pad">${feeds ? "Chưa có tin." : "Chưa tải được tin lúc này, thử lại sau ít phút."}</p>`
      : arr.map((x) => `<article class="news-item"><div class="news-top"><span class="news-ver">v${esc(x.v)}</span><span class="news-date">${esc(fmtDate(x.d))}</span></div>
          <ul>${(x.pt && x.pt.length ? x.pt : x.pte || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul><a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">Xem bản phát hành ↗</a></article>`).join("");
    if (feeds) markSeen("claude", feeds.claude);
    show(dlg, head(i, `<p class="news-meta">${feeds ? "Cập nhật lúc " + esc(updatedText(feeds.updated)) + " · " : ""}tự làm mới mỗi 5 phút khi đang mở. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ. ${refreshBtn}</p>`) + `<div class="news-list">${body}</div></div>` + cta(i.title, i.url));
  }

  function aiList(an, id) {
    const v = ai[id];
    if (!v) return `<p class="res-pad">${API() ? "Chưa tải được tin của hãng này, thử lại sau ít phút." : "Chưa kích hoạt nguồn tin."}</p>`;
    return v.items.map((x) => `<article class="news-item"><div class="news-top"><span class="news-date">${esc(fmtDate(x.d))}</span>${x.src ? `<span class="news-src">${esc(x.src)}</span>` : ""}</div>
      <h3>${esc(vi(x.t || x.te))}</h3>${plain(x.s) ? `<p>${esc(vi(x.s))}</p>` : ""}${x.te && x.t !== x.te ? `<small>Gốc: ${esc(plain(x.te))}</small>` : ""}<a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">Đọc bài gốc ↗</a></article>`).join("");
  }
  async function openAi(i, dlg, id) {
    id = id || (i.companies[0] || {}).id;
    live = { type: "ai", id: i.id, c: id };
    const chips = `<div class="ai-chips" role="tablist">${i.companies.map((c) => { const n = ai[c.id] ? countNew("ai-" + c.id, ai[c.id].items) : 0; return `<button class="chip ${c.id === id ? "on" : ""}" data-aic="${esc(c.id)}" type="button">${esc(c.name)}${n ? ` <b class="dotnew">${n}</b>` : ""}</button>`; }).join("")}</div>`;
    const render = () => show(dlg, head(i, `<p class="news-meta">Tin mới từ ${i.companies.length} hãng AI${ai[id] && ai[id].updated ? ", cập nhật lúc " + esc(updatedText(ai[id].updated)) : ""}, tự làm mới mỗi 5 phút khi đang mở. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ. ${refreshBtn}</p>`) + chips + `<div class="news-list" id="aiList">${ai[id] ? aiList(i, id) : '<p class="res-pad">Đang tải tin…</p>'}</div></div>` + cta(compName(i, id), OFFICIAL[id] || "https://news.google.com/search?q=" + encodeURIComponent(compName(i, id).replace(" · ", " "))));
    render();
    dlg.querySelectorAll("[data-aic]").forEach((b) => (b.onclick = () => openAi(i, dlg, b.dataset.aic)));
    if (!ai[id]) { const v = await loadAi(id); if (dlg.open) { if (v) { markSeen("ai-" + id, v.items); } openAi(i, dlg, id); } }
    else markSeen("ai-" + id, ai[id].items);
  }

  function openRanking(i, dlg) {
    const rows = (arr, cols) => arr.map((r, k) => `<tr><td class="rk">${k + 1}</td><td><b>${esc(r.n)}</b>${r.k ? ` <span class="badge">${esc(r.k)}</span>` : ""}<small>${esc(r.d)}</small></td><td class="num">${esc(r.v)}</td></tr>`).join("");
    show(dlg, `<button class="x" id="resX" aria-label="Đóng">×</button><div class="res-body"><div class="res-head"><span class="badge">${esc(i.type)}</span><h2>${esc(i.title)}</h2><p class="news-meta">Số liệu tham khảo, cập nhật ${esc(i.asof)}.</p></div>
      <h4>Vốn hoá / định giá lớn nhất</h4><table class="rank-t">${rows(i.valuation)}</table>
      <h4>Tăng trưởng doanh thu nhanh nhất</h4><table class="rank-t">${rows(i.growth)}</table>
      <p class="res-pad rank-note">⚠️ ${esc(i.note2)}</p>
      <h4>Nguồn tham khảo</h4><ul class="rank-src">${i.sources.map((s) => `<li><a href="${esc(okUrl(s.u))}" target="_blank" rel="noopener">${esc(s.t)} ↗</a></li>`).join("")}</ul></div>`);
  }

  /* ---------- bài lý thuyết / bản đồ kiến thức (guide) ---------- */
  function guideSection(x) {
    const lnk = (u, lb) => (okUrl(u) ? ` <a class="g-link" href="${esc(okUrl(u))}" target="_blank" rel="noopener">${esc(lb || "Mở trang gốc")} ↗</a>` : "");
    switch (x.k) {
      case "h": return `<h4>${esc(x.t)}</h4>`;
      case "p": return `<p>${esc(x.t)}</p>`;
      case "callout": return `<p class="g-callout">${esc(x.t)}</p>`;
      case "swatches": return `<div class="g-sw">${x.items.map((c) => `<div class="g-sw-i"><i style="background:${esc(/^#[0-9a-f]{3,8}$/i.test(c.c) ? c.c : "#ccc")}"></i><b>${esc(c.n)}</b><code>${esc(c.c)}</code><small>${esc(c.d)}</small></div>`).join("")}</div>`;
      case "code": return `<div class="g-code">${x.cap ? `<small>${esc(x.cap)}</small>` : ""}<pre><code>${esc(x.t)}</code></pre><button type="button" class="g-copy" data-copy>Copy</button></div>`;
      case "fontdemo": {
        if (!document.getElementById("fd-fonts")) { const l = document.createElement("link"); l.id = "fd-fonts"; l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&family=Work+Sans:wght@300;400;600;800&family=Bebas+Neue&display=swap"; document.head.appendChild(l); }
        return `<div class="g-fd">${x.items.map((f) => `<div class="g-fd-i"><small>${esc(f.n)}</small><div class="g-fd-s" style="font-family:'${esc(/^[A-Za-z ]+$/.test(f.fam) ? f.fam : "Montserrat")}',sans-serif;font-weight:${esc(/^\d{3}$/.test(String(f.w)) ? f.w : 400)}">${esc(f.s)}</div>${f.d ? `<p>${esc(f.d)}</p>` : ""}</div>`).join("")}</div>`;
      }
      case "list": return `<ul class="g-list">${x.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
      case "steps": return `<ol class="res-outline">${x.items.map((o) => `<li><b>${esc(o.t)}</b><span>${esc(o.d)}</span></li>`).join("")}</ol>`;
      case "cards": return `<div class="g-cards">${x.items.map((c) => `<div class="g-card"><b>${esc(c.t)}</b>${c.tag ? `<span class="badge">${esc(c.tag)}</span>` : ""}<p>${esc(c.d)}${lnk(c.u, c.lb)}</p></div>`).join("")}</div>`;
      case "table": return `<div class="g-tbl"><table><thead><tr>${x.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${x.rows.map((r) => `<tr>${r.map((c, k) => (k ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
      case "links": return `<ul class="rank-src">${x.items.map((l) => `<li><a href="${esc(okUrl(l.u))}" target="_blank" rel="noopener">${esc(l.t)} ↗</a></li>`).join("")}</ul>`;
      default: return "";
    }
  }
  function openGuide(i, dlg) {
    const nx = i.next && list.find((x) => x.id === i.next.id);
    show(dlg, `<button class="x" id="resX" aria-label="Đóng">×</button><div class="res-body g-body">
      <div class="res-head"><span class="badge">${esc(i.type || "Lý thuyết")}</span><h2>${esc(i.title)}</h2><p class="news-meta">${esc(i.note || "")}</p></div>
      ${(i.sections || []).map(guideSection).join("")}</div>` +
      (Array.isArray(i.ctas) && i.ctas.length ? `<div class="res-cta"><div><b>${esc(i.ctasTitle || i.title)}</b></div><div class="res-cta-btns">${i.ctas.map((c) => `<a class="btn orange-btn" href="${esc(okUrl(c.url))}" target="_blank" rel="noopener">${esc(c.btn)} ↗</a>`).join("")}</div></div>`
        : i.cta ? `<div class="res-cta"><div><b>${esc(i.cta.title)}</b><small>${esc(String(i.cta.url).replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(i.cta.url))}" target="_blank" rel="noopener">${esc(i.cta.btn || "Mở trang gốc")} ↗</a></div>` : "") +
      (nx ? `<div class="res-cta"><div><b>${esc(i.next.label)}</b></div><button class="btn orange-btn" type="button" data-res="${esc(nx.id)}">Mở tiếp →</button></div>` : ""));
  }

  function open(id) {
    const i = list.find((x) => x.id === id); if (!i) return;
    const dlg = document.getElementById("resDlg"); if (!dlg) return;
    if (i.feed === "claude") return openClaude(i, dlg);
    if (i.feed === "ainews") return openAi(i, dlg);
    if (i.feed === "ranking") return openRanking(i, dlg);
    if (i.guide) return openGuide(i, dlg);
    const file = i.file && okUrl(i.file.url) ? i.file : null;
    const abs = file ? new URL(file.url, location.href).href : "";
    show(dlg, `
      <button class="x" id="resX" aria-label="Đóng">×</button>
      <div class="res-body">
        ${i.cover ? `<img class="res-cover" src="${esc(okUrl(i.cover))}" alt="">` : ""}
        <div class="res-head"><span class="badge">${esc(i.type || "")}</span><h2>${esc(i.title)}</h2>
          <div class="res-tags">${(i.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join(" ")}</div></div>
        <h4>Giới thiệu</h4>
        ${(i.intro || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${i.facts?.length ? `<dl class="res-facts">${i.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        ${i.outline?.length ? `<h4>Xem nhanh nội dung</h4><ol class="res-outline">${i.outline.map((o) => `<li><b>${esc(o.t)}</b><span>${esc(o.d)}</span></li>`).join("")}</ol>` : ""}
        ${i.gallery?.length ? `<h4>Demo trong tài liệu</h4><div class="res-gallery">${i.gallery.map((g) => `<figure><img src="${esc(okUrl(g.src))}" alt="${esc(g.cap)}" loading="lazy"><figcaption>${esc(g.cap)}</figcaption></figure>`).join("")}</div>` : ""}
      </div>
      ${file ? `<div class="res-cta"><div><b>${esc(file.label || "Mở tài liệu")}</b><small>${esc(abs.replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(abs)}" target="_blank" rel="noopener">Mở tài liệu ↗</a></div>` : ""}`);
  }


  /* ---------- mục con của kho (ví dụ Kho AI: AI News / AI Agent / Khác) ---------- */
  const khoGroups = (kho) => ((window.KHO || []).find((k) => k.id === kho) || {}).groups || null;
  const strictKho = (k) => !!((window.KHO || []).find((x) => x.id === k) || {}).strictGroups; // kho này không gom mục chưa phân nhóm vào nhóm cuối
  const groupOf = (i, groups) => (groups.some((g) => g.id === i.group) ? i.group : strictKho(i.kho) ? "" : groups[groups.length - 1].id);
  const collapsed = new Set(); // nhóm đã thu gọn (kho:nhóm)
  function toggleGroup(h) {
    const body = h.nextElementSibling; if (!body || !body.classList.contains("grp-body")) return;
    const key = (window.__khoCur || "") + ":" + h.dataset.gtoggle, open = body.hidden;
    body.hidden = !open; h.setAttribute("aria-expanded", String(open)); if (open) collapsed.delete(key); else collapsed.add(key);
  }
  function groupPills(kho, arr, grp) {
    const gs = khoGroups(kho); if (!gs) return "";
    const cnt = (id) => arr.filter((i) => groupOf(i, gs) === id).length;
    return `<button class="gpill ${grp === "" ? "on" : ""}" data-g="" type="button">Tất cả <small>${arr.length}</small></button>` +
      gs.map((g) => `<button class="gpill ${grp === g.id ? "on" : ""}" data-g="${esc(g.id)}" type="button">${g.icon || ""} ${esc(g.name)} <small>${cnt(g.id)}</small></button>`).join("");
  }
  // Gom thẻ theo mục con; kho không có mục con thì trả về danh sách phẳng. Trả "" nếu không có thẻ nào.
  function group(list, kho, grp, cardOf) {
    if (!list.length) return "";
    const gs = khoGroups(kho);
    if (!gs) return list.map(cardOf).join("");
    const loose = !grp && strictKho(kho) ? list.filter((i) => groupOf(i, gs) === "").map(cardOf).join("") : "";
    return gs.filter((g) => !grp || g.id === grp).map((g) => {
      const part = list.filter((i) => groupOf(i, gs) === g.id);
      const shut = collapsed.has(kho + ":" + g.id) && !grp; // đang xem riêng một nhóm thì luôn mở
      return part.length ? `<h3 class="grp-h" data-gtoggle="${esc(g.id)}" role="button" tabindex="0" aria-expanded="${!shut}">${g.icon || ""} ${esc(g.name)} <small>${part.length}</small><i class="grp-arrow" aria-hidden="true"></i></h3><div class="grp-body" ${shut ? "hidden" : ""}>` + part.map(cardOf).join("") + "</div>" : "";
    }).join("") + loose;
  }
  const groupSelectHtml = (kho, cur) => { const gs = khoGroups(kho); return gs ? gs.map((g) => `<option value="${esc(g.id)}" ${g.id === cur ? "selected" : ""}>${esc(g.name)}</option>`).join("") : ""; };

  document.addEventListener("click", (e) => {
    const gh = e.target.closest("[data-gtoggle]"); if (gh) { toggleGroup(gh); return; }
    const rf = e.target.closest("[data-refresh]");
    if (rf) { rf.disabled = true; rf.textContent = "Đang làm mới…"; refresh(true).catch(() => {}); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { const t = cp.parentNode.querySelector("code").textContent; (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => { cp.textContent = "Đã copy ✓"; setTimeout(() => (cp.textContent = "Copy"), 1500); }, () => { cp.textContent = "Bôi đen để copy"; }); return; }
    const c = e.target.closest("[data-res]"); if (c) open(c.dataset.res); });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.gtoggle) { e.preventDefault(); toggleGroup(e.target); return; } if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.res) { e.preventDefault(); open(e.target.dataset.res); } });
  return { load, all, card, open, visible, loadFeeds, refresh, startAutoRefresh, groupPills, group, groupOf, khoGroups, groupSelectHtml };
})();
