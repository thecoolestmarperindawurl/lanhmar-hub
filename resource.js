/* Tài nguyên nổi bật (kho-featured.json):
   - Thẻ tài liệu: thumbnail nhỏ, bấm mở cửa sổ giới thiệu + demo + link file ở cuối.
   - Thẻ LIVE: "claude" (bản phát hành Claude Code), "ainews" (tin 10 hãng AI, lọc theo hãng), "ranking" (xếp hạng công ty AI).
   Tin lấy qua Apps Script (cache 30 phút), tóm tắt tiếng Việt, báo "mới" + thông báo nổi.
   Dùng chung cho Kho cá nhân (kho.js) và Data Storage (storage.js). */
window.Res = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => (/^(https?:\/\/|docs\/|assets\/)[^\s"'<>]*$/i.test(String(u || "")) ? u : "");
  const fmtDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d.split("-").reverse().join("/") : d || "");
  const API = () => (window.STORAGE_API || "").trim();
  let list = [], feeds = null;
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
  async function loadAi(id) {
    if (ai[id]) return ai[id];
    try { const c = JSON.parse(sessionStorage.getItem("lm-ai-" + id)); if (c && Date.now() - c.t < 10 * 60e3) return (ai[id] = c.v); } catch {}
    if (!API()) return null;
    try {
      const j = await post({ action: "ainews", c: id });
      if (j.ok) { ai[id] = j; try { sessionStorage.setItem("lm-ai-" + id, JSON.stringify({ t: Date.now(), v: j })); } catch {} baseline("ai-" + id, j.items); return j; }
    } catch {}
    return null;
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

  async function loadFeeds() {
    if (!API() || !list.some((i) => i.feed)) return null;
    const tasks = [];
    if (list.some((i) => i.feed === "claude")) {
      tasks.push((async () => {
        try { const c = JSON.parse(sessionStorage.getItem("lm-news")); if (c && Date.now() - c.t < 10 * 60e3) feeds = c.v; } catch {}
        if (!feeds) { try { const j = await post({ action: "news" }); if (j.ok) { feeds = j; try { sessionStorage.setItem("lm-news", JSON.stringify({ t: Date.now(), v: j })); } catch {} } } catch {} }
        if (feeds) baseline("claude", feeds.claude);
      })());
    }
    const an = list.find((i) => i.feed === "ainews");
    if (an) (an.companies || []).slice(0, 3).forEach((c) => tasks.push(loadAi(c.id))); // nạp trước 3 hãng đầu để thẻ có tin xem trước
    await Promise.all(tasks);
    const nc = claudeNew(), nn = aiNew();
    if ((nc || nn) && !sessionStorage.getItem("lm-news-toast")) {
      try { sessionStorage.setItem("lm-news-toast", "1"); } catch {}
      const parts = []; if (nc) parts.push(nc + " bản Claude Code"); if (nn) parts.push(nn + " tin AI");
      toast("🔔 Có cập nhật mới: " + parts.join(" · "));
    }
    return feeds;
  }

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
        ${loaded.length ? `<ul class="feed-mini">${loaded.slice(0, 3).map((x) => `<li><b>${esc(compName(i, x.id).split(" ·")[0])}</b> ${esc(x.t || x.te)}</li>`).join("")}</ul>` : `<p>${API() ? "Đang tải tin mới…" : esc(i.note || "")}</p>`}
        <div class="meta"><span>Theo dõi ${(i.companies || []).length} hãng AI</span><span class="res-more">Xem tất cả →</span></div></div></article>`;
    }
    if (i.feed === "ranking") {
      return `<article class="card res-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info"><span class="badge">${esc(i.type)}</span><span class="badge shared">Cập nhật ${esc(i.asof)}</span>
        <h3>${esc(i.title)}</h3><p>${esc(i.note)}</p><div class="meta"><span>${esc(i.date)}</span><span class="res-more">Xem bảng xếp hạng →</span></div></div></article>`;
    }
    return `<article class="card res-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
      <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy">
      <div class="res-info"><span class="badge">${esc(i.type || "Tài nguyên")}</span><span class="badge shared">Nổi bật</span>
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
    dlg.scrollTo({ top: 0, behavior: "instant" });
  }
  const cta = (title, url) => `<div class="res-cta"><div><b>${esc(title)}</b><small>${esc(String(url).replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(url))}" target="_blank" rel="noopener">Mở trang gốc ↗</a></div>`;
  const head = (i, extra) => `<button class="x" id="resX" aria-label="Đóng">×</button><div class="res-body"><div class="res-head"><span class="badge live"><i></i>LIVE</span><h2>${esc(i.title)}</h2>${extra || ""}</div>`;

  function openClaude(i, dlg) {
    const arr = (feeds && feeds.claude) || [];
    const body = !arr.length ? `<p class="res-pad">${feeds ? "Chưa có tin." : "Chưa tải được tin lúc này, thử lại sau ít phút."}</p>`
      : arr.map((x) => `<article class="news-item"><div class="news-top"><span class="news-ver">v${esc(x.v)}</span><span class="news-date">${esc(fmtDate(x.d))}</span></div>
          <ul>${(x.pt && x.pt.length ? x.pt : x.pte || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul><a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">Xem bản phát hành ↗</a></article>`).join("");
    if (feeds) markSeen("claude", feeds.claude);
    show(dlg, head(i, `<p class="news-meta">${feeds ? "Cập nhật lúc " + esc(updatedText(feeds.updated)) + " · " : ""}tự làm mới mỗi 30 phút. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ.</p>`) + `<div class="news-list">${body}</div></div>` + cta(i.title, i.url));
  }

  function aiList(an, id) {
    const v = ai[id];
    if (!v) return `<p class="res-pad">${API() ? "Chưa tải được tin của hãng này, thử lại sau ít phút." : "Chưa kích hoạt nguồn tin."}</p>`;
    return v.items.map((x) => `<article class="news-item"><div class="news-top"><span class="news-date">${esc(fmtDate(x.d))}</span>${x.src ? `<span class="news-src">${esc(x.src)}</span>` : ""}</div>
      <h3>${esc(x.t || x.te)}</h3>${x.s ? `<p>${esc(x.s)}</p>` : ""}${x.te && x.t !== x.te ? `<small>Gốc: ${esc(x.te)}</small>` : ""}<a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">Đọc bài gốc ↗</a></article>`).join("");
  }
  async function openAi(i, dlg, id) {
    id = id || (i.companies[0] || {}).id;
    const chips = `<div class="ai-chips" role="tablist">${i.companies.map((c) => { const n = ai[c.id] ? countNew("ai-" + c.id, ai[c.id].items) : 0; return `<button class="chip ${c.id === id ? "on" : ""}" data-aic="${esc(c.id)}" type="button">${esc(c.name)}${n ? ` <b class="dotnew">${n}</b>` : ""}</button>`; }).join("")}</div>`;
    const render = () => show(dlg, head(i, `<p class="news-meta">Tin mới từ ${i.companies.length} hãng AI, tự làm mới mỗi 30 phút. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ.</p>`) + chips + `<div class="news-list" id="aiList">${ai[id] ? aiList(i, id) : '<p class="res-pad">Đang tải tin…</p>'}</div></div>` + cta(compName(i, id), OFFICIAL[id] || "https://news.google.com/search?q=" + encodeURIComponent(compName(i, id).replace(" · ", " "))));
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

  function open(id) {
    const i = list.find((x) => x.id === id); if (!i) return;
    const dlg = document.getElementById("resDlg"); if (!dlg) return;
    if (i.feed === "claude") return openClaude(i, dlg);
    if (i.feed === "ainews") return openAi(i, dlg);
    if (i.feed === "ranking") return openRanking(i, dlg);
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

  document.addEventListener("click", (e) => { const c = e.target.closest("[data-res]"); if (c) open(c.dataset.res); });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.res) { e.preventDefault(); open(e.target.dataset.res); } });
  return { load, all, card, open, visible, loadFeeds };
})();
