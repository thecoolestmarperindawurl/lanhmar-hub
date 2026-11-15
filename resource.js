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
  const vi = (s) => plain(s).replace(/cung\s+Song\s+Tử/gi, "Gemini").replace(/Song\s+Tử/g, "Gemini").replace(/\bcung\s+Gemini\b/gi, "Gemini");
  const T = (v, e) => (window.LM ? LM.t(v, e) : v);   // chuỗi giao diện theo ngôn ngữ (lang.js)
  const EN = () => !!(window.LM && LM.lang() === "en");
  // tin AI: bản tiếng Anh dùng tiêu đề/tóm tắt gốc (te/se), bản tiếng Việt dùng bản dịch (t/s)
  const tt = (x) => (EN() ? plain(x.te || x.t) : vi(x.t || x.te));
  const okUrl = (u) => (/^(https?:\/\/|docs\/|assets\/)[^\s"'<>]*$/i.test(String(u || "")) ? u : "");
  const fmtDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d.split("-").reverse().join("/") : d || "");
  const API = () => (window.STORAGE_API || "").trim();
  let raw = [], list = [], feeds = null;
  // thẻ nổi bật theo ngôn ngữ đang chọn (tiêu đề/mô tả tiếng Anh lấy từ kho-en.js)
  const relocalize = () => { list = raw.map((i) => (window.LM ? LM.localizeItem(i) : i)); };
  document.addEventListener("lm:lang", relocalize);
  document.addEventListener("lm:content", relocalize);
  // nội dung chi tiết chỉ có tiếng Việt: báo rõ khi đang xem bản tiếng Anh
  const viNote = (i) => (EN() && !(i && i._full) ? `<p class="res-pad res-vi-note">🇻🇳 The detailed content below is in Vietnamese. Use your browser's translate feature if needed.</p>` : "");
  const TTL = 2 * 60e3;   // cache trình duyệt
  let live = null, keepScroll = null, notified = 0, lastRefresh = Date.now();
  const ai = {}; // id hãng -> { items, updated }
  let rk = null;  // bảng xếp hạng trực tiếp: { quotes, news, updated }

  async function load() {
    try {
      const r = await fetch("kho-featured.json?v=" + Date.now(), { cache: "no-store" });
      if (!r.ok) { raw = list = []; return list; }
      const j = await r.json();
      raw = (j.items || []).map((i) => ({ ...i, featured: true }));
    } catch { raw = []; }
    relocalize();
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

  async function loadRanking(force) {
    const prev = rk;
    if (force) { rk = null; try { sessionStorage.removeItem("lm-rank"); } catch {} }
    if (rk) return rk;
    try { const c = JSON.parse(sessionStorage.getItem("lm-rank")); if (c && Date.now() - c.t < TTL) return (rk = c.v); } catch {}
    if (!API()) return null;
    try {
      const j = await post({ action: "ranking" });
      if (j.ok) { rk = j; try { sessionStorage.setItem("lm-rank", JSON.stringify({ t: Date.now(), v: j })); } catch {} return j; }
    } catch {}
    if (prev) rk = prev; // làm mới lỗi thì giữ số liệu cũ
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
    if (list.some((i) => i.feed === "ranking")) tasks.push(loadRanking(force));
    await Promise.all(tasks);
    if (!feeds && prevFeeds) feeds = prevFeeds; // làm mới lỗi thì giữ tin cũ
    const nc = claudeNew(), nn = aiNew();
    if (nc + nn > notified) {
      notified = nc + nn;
      const parts = []; if (nc) parts.push(nc + T(" bản Claude Code", " Claude Code releases")); if (nn) parts.push(nn + T(" tin AI", " AI news"));
      toast(T("🔔 Có cập nhật mới: ", "🔔 New updates: ") + parts.join(" · "));
    }
    return feeds;
  }

  /* ---------- tự làm mới ---------- */
  const reopenLive = () => {
    const dlg = document.getElementById("resDlg");
    if (!live || !dlg || !dlg.open) return;
    keepScroll = dlg.scrollTop;
    const i = list.find((x) => x.id === live.id); if (!i) return;
    if (live.type === "claude") openClaude(i, dlg); else if (live.type === "ranking") openRanking(i, dlg); else openAi(i, dlg, live.c);
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
  const refreshBtn = () => `<button class="btn news-refresh" type="button" data-refresh>${T("↻ Làm mới", "↻ Refresh")}</button>`;

  const updatedText = (iso) => { if (!iso) return ""; const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleString(EN() ? "en-GB" : "vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }); };
  const OFFICIAL = { anthropic: "https://www.anthropic.com/news", openai: "https://openai.com/news", google: "https://blog.google/products/gemini/", meta: "https://about.fb.com/news/", mistral: "https://mistral.ai/news", nvidia: "https://blogs.nvidia.com/" };
  const compName = (an, id) => (an.companies.find((c) => c.id === id) || {}).name || id;

  /* ---------- thẻ ---------- */
  const fmtPrice = (x) => `${Number(x.p).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${esc(x.cur || "USD")}${x.pc == null ? "" : ` <span class="${x.pc >= 0 ? "up" : "down"}">${x.pc >= 0 ? "▲" : "▼"} ${Math.abs(x.pc).toFixed(2)}%</span>`}`;
  function liveBadges(i, n) { return `<span class="badge live"><i></i>LIVE</span><span class="badge">${esc(i.type || T("Cập nhật trực tiếp", "Live updates"))}</span>${n ? `<span class="badge new">${n} ${T("mới", "new")}</span>` : ""}`; }

  function card(i) {
    if (i.feed === "claude") {
      const arr = (feeds && feeds.claude) || [];
      return `<article class="card res-card feed-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info">${liveBadges(i, claudeNew())}<h3>${esc(i.title)}</h3>
        ${arr.length ? `<ul class="feed-mini">${arr.slice(0, 2).map((x) => `<li><b>v${esc(x.v)}</b> ${esc(EN() ? (x.pte && x.pte[0]) || (x.pt && x.pt[0]) || "" : (x.pt && x.pt[0]) || (x.pte && x.pte[0]) || "")}</li>`).join("")}</ul>` : `<p>${feeds ? T("Chưa có tin.", "No news yet.") : T("Đang tải tin mới…", "Loading the latest news…")}</p>`}
        <div class="meta"><span>${feeds ? T("Cập nhật ", "Updated ") + esc(updatedText(feeds.updated)) : esc(i.note || "")}</span><span class="res-more">${T("Xem tất cả →", "See all →")}</span></div></div></article>`;
    }
    if (i.feed === "ainews") {
      const loaded = Object.entries(ai).filter(([, v]) => v.items && v.items[0]).map(([id, v]) => ({ ...v.items[0], id })); // tin mới nhất của mỗi hãng
      loaded.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
      return `<article class="card res-card feed-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info">${liveBadges(i, aiNew())}<h3>${esc(i.title)}</h3>
        ${loaded.length ? `<ul class="feed-mini">${loaded.slice(0, 4).map((x) => `<li><b style="color:${COLORS[x.id] || "var(--purple-deep)"}">${esc(compName(i, x.id).split(" ·")[0])}</b> ${esc(tt(x))} <small class="nw-when">· ${esc(relDay(x.d))}</small></li>`).join("")}</ul>` : `<p>${API() ? T("Đang tải tin mới…", "Loading the latest news…") : esc(i.note || "")}</p>`}
        <div class="meta"><span>${T("Theo dõi " + (i.companies || []).length + " hãng AI", "Following " + (i.companies || []).length + " AI companies")}</span><span class="res-more">${T("Xem tất cả →", "See all →")}</span></div></div></article>`;
    }
    if (i.feed === "ranking") {
      const q = (rk && rk.quotes) || [];
      return `<article class="card res-card feed-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy"><div class="res-info">${rk ? '<span class="badge live"><i></i>LIVE</span>' : ""}<span class="badge">${esc(i.type)}</span>
        <h3>${esc(i.title)}</h3>
        ${q.length ? `<ul class="feed-mini">${q.slice(0, 2).map((x) => `<li><b>${esc(x.s)}</b> ${fmtPrice(x)}</li>`).join("")}</ul>` : `<p>${esc(i.note)}</p>`}
        <div class="meta"><span>${rk ? T("Cập nhật ", "Updated ") + esc(updatedText(rk.updated)) : T("Mốc ", "As of ") + esc(i.asof)}</span><span class="res-more">${T("Xem bảng xếp hạng →", "See the ranking →")}</span></div></div></article>`;
    }
    return `<article class="card res-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
      <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy">
      <div class="res-info"><div class="res-badges">${(() => { const a = i.type || T("Tài nguyên", "Resource"), b = i.guide ? i.badge || T("Đọc trước", "Read first") : T("Nổi bật", "Featured"), la = a.toLowerCase(), lb = b.toLowerCase(), same = la.includes(lb) || lb.includes(la); return `<span class="badge">${esc(a)}</span>` + (same ? "" : `<span class="badge shared">${esc(b)}</span>`); })()}</div>
        <h3>${esc(i.title)}</h3><p>${esc(i.note)}</p>
        <div class="meta"><span>${esc(i.date)}</span><span class="res-more">${T("Xem chi tiết →", "View details →")}</span></div></div>
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
  const cta = (title, url) => `<div class="res-cta"><div><b>${esc(title)}</b><small>${esc(String(url).replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(url))}" target="_blank" rel="noopener">${T("Mở trang gốc ↗", "Open source page ↗")}</a></div>`;
  const head = (i, extra) => `<button class="x" id="resX" aria-label="${T("Đóng", "Close")}">×</button><div class="res-body"><div class="res-head"><span class="badge live"><i></i>LIVE</span><h2>${esc(i.title)}</h2>${extra || ""}</div>`;

  /* ---------- bản tin kiểu trang báo ---------- */
  const COLORS = { anthropic: "#C2552F", openai: "#0E8A6B", google: "#2F6FDE", xai: "#241F45", microsoft: "#0078B8", meta: "#0866FF", deepseek: "#4D6BFE", mistral: "#E2500C", nvidia: "#4E8A00", perplexity: "#14899A" };
  function relDay(d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || "")) return d || "";
    const n = new Date(), [y, m, dd] = d.split("-").map(Number);
    const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()) - new Date(y, m - 1, dd)) / 864e5);
    return diff <= 0 ? T("Hôm nay", "Today") : diff === 1 ? T("Hôm qua", "Yesterday") : diff < 7 ? T(diff + " ngày trước", diff + " days ago") : fmtDate(d);
  }
  const summ = (x) => (EN() ? plain(x.se) : plain(x.s) ? vi(x.s) : "");
  const snap = {}; // mốc "đã xem" lúc mở cửa sổ, để nhãn Mới không mất khi đổi tab hay làm mới
  const isNew = (x) => { const s = snap[x.c]; return !!(s && x.d && x.d > s); };
  const coTag = (an, id) => `<span class="nw-co" style="--c:${COLORS[id] || "#6A5CFF"}">${esc(compName(an, id).split(" ·")[0])}</span>`;
  const newTag = () => `<span class="nw-new">${T("Mới", "New")}</span>`;
  const when = (x) => `<span class="nw-when">${esc(relDay(x.d))}</span>${isNew(x) ? newTag() : ""}${x.src ? `<span class="news-src">${esc(x.src)}</span>` : ""}`;
  const link = (x, inner, cls) => `<a${cls ? ` class="${cls}"` : ""} href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">${inner}</a>`;
  function newsBody(an, items, q) {
    q = (q || "").trim().toLowerCase();
    const arr = q ? items.filter((x) => (tt(x) + " " + summ(x)).toLowerCase().includes(q)) : items;
    if (!arr.length) return `<p class="nw-empty">${q ? T("Không có tin khớp với từ khoá.", "No news matches your search.") : T("Chưa có tin.", "No news yet.")}</p>`;
    const li = Math.max(0, arr.findIndex((x) => summ(x).length > 40)); // tin nổi bật: tin mới nhất có tóm tắt
    const lead = arr[li], rest = arr.filter((_, k) => k !== li), two = rest.slice(0, 2), more = rest.slice(2);
    let html = `<article class="nw-lead"><div class="nw-meta">${coTag(an, lead.c)}${when(lead)}</div><h3>${link(lead, esc(tt(lead)))}</h3>${summ(lead) ? `<p>${esc(summ(lead))}</p>` : ""}${link(lead, T("Đọc bài gốc ↗", "Read the original ↗"), "nw-read")}</article>`;
    if (two.length) html += `<div class="nw-two">${two.map((x) => `<article class="nw-card"><div class="nw-meta">${coTag(an, x.c)}${when(x)}</div><h4>${link(x, esc(tt(x)))}</h4>${summ(x) ? `<p>${esc(summ(x))}</p>` : ""}</article>`).join("")}</div>`;
    const days = [];
    more.forEach((x) => { const g = days[days.length - 1]; if (g && g.d === x.d) g.items.push(x); else days.push({ d: x.d, items: [x] }); });
    html += days.map((g) => `<h5 class="nw-day"><span>${esc(relDay(g.d))}</span>${relDay(g.d) !== fmtDate(g.d) ? `<small>${esc(fmtDate(g.d))}</small>` : ""}</h5><ul class="nw-rows">${g.items.map((x) => `<li><div class="nw-meta">${coTag(an, x.c)}${isNew(x) ? newTag() : ""}</div><b>${link(x, esc(tt(x)))}</b>${summ(x) ? `<p>${esc(summ(x))}</p>` : ""}</li>`).join("")}</ul>`).join("");
    return html;
  }

  function openClaude(i, dlg) {
    live = { type: "claude", id: i.id };
    const arr = (feeds && feeds.claude) || [];
    if (feeds && !("claude" in snap)) snap.claude = seenOf("claude");
    const pts = (x) => (EN() ? (x.pte && x.pte.length ? x.pte : x.pt || []) : (x.pt && x.pt.length ? x.pt : x.pte || []));
    const li = (t) => `<li>${esc(t)}</li>`;
    const body = !arr.length ? `<p class="res-pad">${feeds ? T("Chưa có tin.", "No news yet.") : T("Chưa tải được tin lúc này, thử lại sau ít phút.", "Couldn't load the news right now, try again in a few minutes.")}</p>`
      : `<ol class="nw-timeline">${arr.map((x, k) => {
          const p = pts(x), fresh = snap.claude && x.d && x.d > snap.claude;
          return `<li class="nw-rel${k ? "" : " latest"}"><div class="nw-meta"><span class="news-ver">v${esc(x.v)}</span><span class="nw-when">${esc(relDay(x.d))}</span>${k ? "" : `<span class="nw-tag">${T("Mới nhất", "Latest")}</span>`}${fresh ? newTag() : ""}</div>
            <ul>${p.slice(0, 4).map(li).join("")}</ul>${p.length > 4 ? `<details><summary>${T("Xem thêm " + (p.length - 4) + " thay đổi", "Show " + (p.length - 4) + " more changes")}</summary><ul>${p.slice(4).map(li).join("")}</ul></details>` : ""}${link(x, T("Xem bản phát hành ↗", "See the release ↗"), "nw-read")}</li>`;
        }).join("")}</ol>`;
    if (feeds) markSeen("claude", feeds.claude);
    show(dlg, head(i, `<p class="news-meta">${feeds ? T("Cập nhật lúc ", "Updated at ") + esc(updatedText(feeds.updated)) + " · " : ""}${T("tự làm mới mỗi 5 phút khi đang mở. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ.", "refreshes every 5 minutes while open. Open the original release for full details.")} ${refreshBtn()}</p>`) + `<div class="news-list nw">${body}</div></div>` + cta(i.title, i.url));
  }

  let aiQ = "";
  const aiItems = (an, id) => (id === "all" ? an.companies.flatMap((c) => (ai[c.id] ? ai[c.id].items.map((x) => ({ ...x, c: c.id })) : [])) : ((ai[id] || {}).items || []).map((x) => ({ ...x, c: id }))).sort((a, b) => (b.d || "").localeCompare(a.d || ""));
  async function openAi(i, dlg, id) {
    const reopen = dlg.open && live && live.type === "ai" && live.id === i.id;
    if (!reopen) { aiQ = ""; Object.keys(snap).forEach((k) => k !== "claude" && delete snap[k]); }
    id = id || "all";
    live = { type: "ai", id: i.id, c: id };
    const loaded = i.companies.filter((c) => ai[c.id]);
    loaded.forEach((c) => { if (!(c.id in snap)) snap[c.id] = seenOf("ai-" + c.id); });
    const items = aiItems(i, id);
    const nNew = (cid) => (ai[cid] ? ai[cid].items.filter((x) => isNew({ ...x, c: cid })).length : 0);
    const allNew = i.companies.reduce((n, c) => n + nNew(c.id), 0);
    const chip = (cid, name, n) => `<button class="chip ${cid === id ? "on" : ""}" data-aic="${esc(cid)}" type="button" role="tab" aria-selected="${cid === id}">${cid === "all" ? "" : `<i style="background:${COLORS[cid] || "#6A5CFF"}"></i>`}${esc(name)}${n ? ` <b class="dotnew">${n}</b>` : ""}</button>`;
    const tabs = `<div class="nw-bar"><div class="ai-chips" role="tablist">${chip("all", T("Tất cả", "All"), allNew)}${i.companies.map((c) => chip(c.id, c.name.split(" ·")[0], nNew(c.id))).join("")}</div><input class="nw-q" id="nwQ" type="search" placeholder="${T("Tìm trong bản tin…", "Search the news…")}" value="${esc(aiQ)}" aria-label="${T("Tìm tin", "Search news")}"></div>`;
    const pending = id === "all" ? i.companies.length - loaded.length : ai[id] ? 0 : 1;
    const upd = loaded.map((c) => ai[c.id].updated).filter(Boolean).sort().pop();
    const stats = `<p class="nw-stats"><b>${items.length}</b> ${T("tin", "stories")} · <b>${id === "all" ? loaded.length : 1}</b> ${T("hãng", id === "all" ? "companies" : "company")}${allNew ? ` · <b class="nw-hot">${allNew}</b> ${T("tin mới từ lần xem trước", "new since your last visit")}` : ""}${pending ? ` · ${T("đang tải thêm " + pending + " hãng…", "loading " + pending + " more…")}` : ""}</p>`;
    const masthead = `<div class="nw-mast"><span class="nw-kick">${T("Bản tin AI", "AI briefing")}</span><span class="nw-date">${esc(new Date().toLocaleDateString(EN() ? "en-GB" : "vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }))}</span></div>`;
    show(dlg, head(i, masthead + `<p class="news-meta">${upd ? T("Cập nhật lúc ", "Updated at ") + esc(updatedText(upd)) + " · " : ""}${T("tự làm mới mỗi 5 phút khi đang mở. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ.", "refreshes every 5 minutes while open. Open the original article for full details.")} ${refreshBtn()}</p>`) + tabs + stats + `<div class="news-list nw" id="aiList">${items.length || !pending ? newsBody(i, items, aiQ) : `<p class="res-pad">${T("Đang tải tin…", "Loading news…")}</p>`}</div></div>` + (id === "all" ? "" : cta(compName(i, id), OFFICIAL[id] || "https://news.google.com/search?q=" + encodeURIComponent(compName(i, id).replace(" · ", " ")))));
    dlg.querySelectorAll("[data-aic]").forEach((b) => (b.onclick = () => { keepScroll = 0; openAi(i, dlg, b.dataset.aic); }));
    const qi = dlg.querySelector("#nwQ");
    if (qi) qi.oninput = () => { aiQ = qi.value; const l = dlg.querySelector("#aiList"); if (l) l.innerHTML = newsBody(i, aiItems(i, id), aiQ); };
    (id === "all" ? loaded : loaded.filter((c) => c.id === id)).forEach((c) => markSeen("ai-" + c.id, ai[c.id].items));
    const want = id === "all" ? i.companies.filter((c) => !ai[c.id]).map((c) => c.id) : ai[id] ? [] : [id];
    if (want.length) {
      await Promise.all(want.map((c) => loadAi(c)));
      if (dlg.open && live && live.type === "ai" && live.c === id) { keepScroll = dlg.scrollTop; openAi(i, dlg, id); }
    }
  }

  function openRanking(i, dlg) {
    live = { type: "ranking", id: i.id };
    const rows = (arr, cols) => arr.map((r, k) => `<tr><td class="rk">${k + 1}</td><td><b>${esc(r.n)}</b>${r.k ? ` <span class="badge">${esc(r.k)}</span>` : ""}<small>${esc(r.d)}</small></td><td class="num">${esc(r.v)}</td></tr>`).join("");
    const quotes = rk && rk.quotes && rk.quotes.length ? `<h4>${T("Giá cổ phiếu trực tiếp (công ty đại chúng)", "Live share prices (public companies)")}</h4><table class="rank-t">${rk.quotes.map((x) => `<tr><td><b>${esc(x.n)}</b> <span class="badge">${esc(x.s)}</span></td><td class="num">${fmtPrice(x)}</td></tr>`).join("")}</table><p class="res-pad rank-live-note">${T("Giá khớp gần nhất so với phiên trước, từ Yahoo Finance, có thể chậm vài phút. Chưa phải vốn hoá. Vốn hoá = giá × số cổ phiếu lưu hành, xem trong bảng bên dưới.", "Last traded price vs. the previous session, from Yahoo Finance, may be delayed a few minutes. This is not market cap: market cap = price × shares outstanding, see the table below.")}</p>` : "";
    const news = rk && rk.news && rk.news.length ? `<h4>${T("Tin mới về định giá, gọi vốn, doanh thu", "Latest on valuations, funding and revenue")}</h4>${rk.news.map((c) => `<div class="rank-news"><h5>${esc(c.n)}</h5>${c.items.map((x) => `<a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener"><span>${esc(fmtDate(x.d))}${x.src ? " · " + esc(x.src) : ""}</span>${esc(tt(x))}</a>`).join("")}</div>`).join("")}<p class="res-pad rank-live-note">${T("Định giá công ty tư nhân chỉ đổi khi có vòng gọi vốn hoặc thương vụ mới, nên không có số theo từng giây. Phần này lấy tin mới nhất trong 30 ngày qua, dịch tự động, hãy bấm bài gốc để xác minh con số.", "Private company valuations only change with a new funding round or deal, so there are no live figures. This section shows news from the last 30 days; open the original article to verify the numbers.")}</p>` : "";
    const status = !API() ? T("Chưa kích hoạt nguồn trực tiếp, đang hiện số liệu tham khảo.", "Live source not enabled, showing reference figures.") : rk ? `${T("Cập nhật lúc", "Updated at")} ${esc(updatedText(rk.updated))}${T(", tự làm mới mỗi 5 phút khi đang mở.", ", refreshes every 5 minutes while open.")} ${refreshBtn()}` : `${T("Chưa tải được dữ liệu trực tiếp, đang hiện số liệu tham khảo.", "Couldn't load live data, showing reference figures.")} ${refreshBtn()}`;
    show(dlg, `<button class="x" id="resX" aria-label="${T("Đóng", "Close")}">×</button><div class="res-body"><div class="res-head">${rk ? '<span class="badge live"><i></i>LIVE</span>' : ""}<span class="badge">${esc(i.type)}</span><h2>${esc(i.title)}</h2><p class="news-meta">${status}</p></div>
      ${quotes}${news}
      <h4>${T("Vốn hoá / định giá lớn nhất", "Largest market cap / valuation")} <small>(${T("mốc đã tổng hợp", "compiled as of")} ${esc(i.asof)})</small></h4><table class="rank-t">${rows(i.valuation)}</table>
      <h4>${T("Tăng trưởng doanh thu nhanh nhất", "Fastest revenue growth")} <small>(${T("mốc", "as of")} ${esc(i.asof)})</small></h4><table class="rank-t">${rows(i.growth)}</table>
      ${viNote(i)}<p class="res-pad rank-note">⚠️ ${esc(i.note2)}</p>
      <h4>${T("Nguồn tham khảo", "Sources")}</h4><ul class="rank-src">${i.sources.map((s) => `<li><a href="${esc(okUrl(s.u))}" target="_blank" rel="noopener">${esc(s.t)} ↗</a></li>`).join("")}</ul></div>`);
  }

  /* ---------- bài lý thuyết / bản đồ kiến thức (guide) ---------- */
  function guideSection(x) {
    const lnk = (u, lb) => (okUrl(u) ? ` <a class="g-link" href="${esc(okUrl(u))}" target="_blank" rel="noopener">${esc(lb || T("Mở trang gốc", "Open source page"))} ↗</a>` : "");
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
      case "cards": return `<div class="g-cards">${x.items.map((c) => /^\d+$/.test(c.tag || "") ? `<div class="g-card g-num"><span class="g-no">${esc(c.tag)}</span><b>${esc(c.t)}</b><p>${esc(c.d)}${lnk(c.u, c.lb)}</p></div>` : `<div class="g-card"><b>${esc(c.t)}</b>${c.tag ? `<span class="badge">${esc(c.tag)}</span>` : ""}<p>${esc(c.d)}${lnk(c.u, c.lb)}</p></div>`).join("")}</div>`;
      // trang giới thiệu skill: mở đầu, trước/sau, hỏi đáp, khung kết
      case "hero": return `<div class="g-hero"><i class="g-blob b1"></i><i class="g-blob b2"></i>${x.kicker ? `<span class="g-kick">${esc(x.kicker)}</span>` : ""}<h3>${esc(x.t)}</h3>${x.lead ? `<p>${esc(x.lead)}</p>` : ""}${(x.ticks || []).length ? `<ul>${x.ticks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</div>`;
      case "cases": return `<div class="g-cases">${x.items.map((c) => `<article class="g-case"><h5>${esc(c.t)}</h5><div class="g-ba"><div class="g-before"><b>${T("Trước", "Before")}</b><p>${esc(c.before)}</p></div><span class="g-arrow" aria-hidden="true">→</span><div class="g-after"><b>${T("Sau", "After")}</b><p>${esc(c.after)}</p></div></div></article>`).join("")}</div>`;
      case "faq": return `<div class="g-faq">${x.items.map((f, n) => `<details${n ? "" : " open"}><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>`;
      case "outro": return `<div class="g-outro"><h3>${esc(x.t)}</h3>${x.d ? `<p>${esc(x.d)}</p>` : ""}${x.note ? `<small>${esc(x.note)}</small>` : ""}</div>`;
      // demo: đầu vào → các bước xử lý → sản phẩm nhận được (khung cửa sổ)
      case "demo": {
        const box = (o, cls, lb) => `<div class="g-dm-${cls}"><span class="g-dm-lb">${esc(o.label || lb)}</span>${o.code ? `<pre>${esc(o.t)}</pre>` : `<p>${esc(o.t)}</p>`}</div>`;
        return `<div class="g-demo">${x.t ? `<h5>${esc(x.t)}</h5>` : ""}<div class="g-dm-flow">
          ${box(x.input, "in", T("Đầu vào", "Input"))}
          <ol class="g-dm-steps" aria-label="${T("Xử lý", "Processing")}"><span class="g-dm-lb">${T("Xử lý", "Processing")}</span>${x.steps.map((s, n) => `<li style="--n:${n}">${esc(s)}</li>`).join("")}</ol>
          <div class="g-dm-out" style="--k:${x.steps.length}"><div class="g-dm-bar"><i></i><i></i><i></i><span>${esc(x.output.label || T("Kết quả", "Result"))}</span></div>${x.output.code ? `<pre>${esc(x.output.t)}</pre>` : `<p>${esc(x.output.t)}</p>`}</div>
        </div>${x.note ? `<small class="g-dm-note">${esc(x.note)}</small>` : ""}</div>`;
      }
      case "table": return `<div class="g-tbl"><table><thead><tr>${x.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${x.rows.map((r) => `<tr>${r.map((c, k) => (k ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
      case "links": return `<ul class="rank-src">${x.items.map((l) => `<li><a href="${esc(okUrl(l.u))}" target="_blank" rel="noopener">${esc(l.t)} ↗</a></li>`).join("")}</ul>`;
      default: return "";
    }
  }
  function openGuide(i, dlg) {
    const nx = i.next && list.find((x) => x.id === i.next.id);
    show(dlg, `<button class="x" id="resX" aria-label="${T("Đóng", "Close")}">×</button><div class="res-body g-body">
      <div class="res-head"><span class="badge">${esc(i.type || T("Lý thuyết", "Theory"))}</span><h2>${esc(i.title)}</h2>${(i.sections || [])[0]?.k === "hero" ? "" : `<p class="news-meta">${esc(i.note || "")}</p>`}</div>${viNote(i)}
      ${(i.sections || []).map(guideSection).join("")}</div>` +
      (Array.isArray(i.ctas) && i.ctas.length ? `<div class="res-cta"><div><b>${esc(EN() ? i.title : i.ctasTitle || i.title)}</b></div><div class="res-cta-btns">${i.ctas.map((c) => `<a class="btn orange-btn" href="${esc(okUrl(c.url))}" target="_blank" rel="noopener">${esc(c.btn)} ↗</a>`).join("")}</div></div>`
        : i.cta ? `<div class="res-cta"><div><b>${esc(EN() ? i.title : i.cta.title)}</b><small>${esc(String(i.cta.url).replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(i.cta.url))}" target="_blank" rel="noopener">${esc(i.cta.btn || T("Mở trang gốc", "Open source page"))} ↗</a></div>` : "") +
      (nx ? `<div class="res-cta"><div><b>${esc(EN() ? "Read next: " + nx.title : i.next.label)}</b></div><button class="btn orange-btn" type="button" data-res="${esc(nx.id)}">${T("Mở tiếp →", "Next →")}</button></div>` : ""));
    reveal(dlg);
  }
  // khối trong bài hiện dần khi cuộn tới (CSS tắt hiệu ứng khi người xem chọn giảm chuyển động)
  function reveal(dlg) {
    const els = dlg.querySelectorAll(".g-body > *:not(.res-head), .g-cards > *, .g-cases > *");
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { root: dlg, threshold: 0.08 });
    els.forEach((el, n) => { el.classList.add("rv"); el.style.setProperty("--d", (n % 4) * 60 + "ms"); io.observe(el); });
    dlg.addEventListener("close", () => io.disconnect(), { once: true });
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
      <button class="x" id="resX" aria-label="${T("Đóng", "Close")}">×</button>
      <div class="res-body">
        ${i.cover ? `<img class="res-cover" src="${esc(okUrl(i.cover))}" alt="">` : ""}
        <div class="res-head"><span class="badge">${esc(i.type || "")}</span><h2>${esc(i.title)}</h2>
          <div class="res-tags">${(i.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join(" ")}</div></div>
        ${viNote(i)}<h4>${T("Giới thiệu", "Overview")}</h4>
        ${(i.intro || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${i.facts?.length ? `<dl class="res-facts">${i.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
        ${i.outline?.length ? `<h4>${T("Xem nhanh nội dung", "Contents at a glance")}</h4><ol class="res-outline">${i.outline.map((o) => `<li><b>${esc(o.t)}</b><span>${esc(o.d)}</span></li>`).join("")}</ol>` : ""}
        ${i.gallery?.length ? `<h4>${T("Demo trong tài liệu", "Inside the document")}</h4><div class="res-gallery">${i.gallery.map((g) => `<figure><img src="${esc(okUrl(g.src))}" alt="${esc(g.cap)}" loading="lazy"><figcaption>${esc(g.cap)}</figcaption></figure>`).join("")}</div>` : ""}
      </div>
      ${file ? `<div class="res-cta"><div><b>${esc(EN() ? "Open the document" : file.label || "Mở tài liệu")}</b><small>${esc(abs.replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(abs)}" target="_blank" rel="noopener">${T("Mở tài liệu ↗", "Open document ↗")}</a></div>` : ""}`);
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
    return `<button class="gpill ${grp === "" ? "on" : ""}" data-g="" type="button">${T("Tất cả", "All")} <small>${arr.length}</small></button>` +
      gs.map((g) => `<button class="gpill ${grp === g.id ? "on" : ""}" data-g="${esc(g.id)}" type="button">${g.icon || ""} ${esc(g.name)} <small>${cnt(g.id)}</small></button>`).join("");
  }
  // Gom thẻ theo mục con; kho không có mục con thì trả về danh sách phẳng. Trả "" nếu không có thẻ nào.
  const introHtml = (g) => {
    const n = g.intro; if (!n) return "";
    const rows = (n.rows || []).map((r) => `<tr><td>${esc(r[0])}</td><td><b>${esc(r[1])}</b></td></tr>`).join("");
    return `<aside class="grp-intro"><p>${esc(n.text)}</p>${rows ? `<table><thead><tr><th>${esc((n.head || [])[0] || T("Tình huống", "Situation"))}</th><th>${esc((n.head || [])[1] || T("Dùng skill", "Use skill"))}</th></tr></thead><tbody>${rows}</tbody></table>` : ""}${n.note ? `<p class="grp-intro-note">${esc(n.note)}</p>` : ""}${n.url ? `<a class="grp-intro-link" href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.btn || T("Mở", "Open"))}</a>` : ""}</aside>`;
  };
  function group(list, kho, grp, cardOf) {
    if (!list.length) return "";
    const gs = khoGroups(kho);
    if (!gs) return list.map(cardOf).join("");
    const loose = !grp && strictKho(kho) ? list.filter((i) => groupOf(i, gs) === "").map(cardOf).join("") : "";
    return gs.filter((g) => !grp || g.id === grp).map((g) => {
      const part = list.filter((i) => groupOf(i, gs) === g.id);
      const shut = collapsed.has(kho + ":" + g.id) && !grp; // đang xem riêng một nhóm thì luôn mở
      return part.length ? `<h3 class="grp-h" data-gtoggle="${esc(g.id)}" role="button" tabindex="0" aria-expanded="${!shut}">${g.icon || ""} ${esc(g.name)} <small>${part.length}</small><i class="grp-arrow" aria-hidden="true"></i></h3><div class="grp-body" ${shut ? "hidden" : ""}>` + introHtml(g) + part.map(cardOf).join("") + "</div>" : "";
    }).join("") + loose;
  }
  /* ---------- Kho Ứng dụng: trình bày kiểu thư viện (nổi bật + kệ lọc + lưới thẻ) ----------
     Thêm ứng dụng mới: thêm một mục vào kho-featured.json với kho: "idea" và các trường
       shelf  (id kệ trong KHO.idea.shelves),  status (vd "Đang dùng"),  spotlight: true (lên mục Nổi bật),
       thumb  (ảnh 960×504 trong assets/res/, cùng cỡ các thẻ khác),   title, note, date, tags, rồi guide + sections hoặc intro như các thẻ khác. */
  const appCfg = () => (window.KHO || []).find((k) => k.id === "idea") || {};
  let shelfCur = "all";
  function appCard(i, big, extra) {
    const sh = (appCfg().shelves || []).find((s) => s.id === i.shelf) || (appCfg().shelves || [])[0] || {};
    const thumb = okUrl(i.thumb);
    const open = i.featured ? `data-res="${esc(i.id)}" role="button" tabindex="0"` : "";
    const go = i.featured ? `<span class="app-go">${T("Xem chi tiết →", "View details →")}</span>` : /^https?:\/\//i.test(i.url || "") ? `<a class="app-go" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">${T("Mở ứng dụng ↗", "Open app ↗")}</a>` : "";
    return `<article class="app-card${big ? " big" : ""}" data-shelf="${esc(sh.id || "")}" ${open} aria-label="${esc(i.title)}">
      <div class="app-thumb">${thumb ? `<img src="${esc(thumb)}" alt="" loading="lazy">` : `<span aria-hidden="true">${esc(appCfg().icon || "▣")}</span>`}</div>
      <div class="app-body">
        <p class="app-meta"><span class="app-shelf">${esc(sh.name || i.type || T("Ứng dụng", "App"))}</span>${i.status ? `<span class="app-status">${esc(i.status)}</span>` : ""}</p>
        <h3>${esc(i.title)}</h3><p class="app-note">${esc(i.note || "")}</p>
        ${go}${extra ? extra(i) : ""}
      </div></article>`;
  }
  function appShelf(list, extra) {
    const cfg = appCfg(), shelves = cfg.shelves || [];
    const shelfOf = (i) => (shelves.some((s) => s.id === i.shelf) ? i.shelf : (shelves[0] || {}).id);
    const cnt = (id) => list.filter((i) => shelfOf(i) === id).length;
    if (shelfCur !== "all" && !shelves.some((s) => s.id === shelfCur)) shelfCur = "all";
    const spot = list.filter((i) => i.spotlight).slice(0, 2);
    const vis = (i) => shelfCur === "all" || shelfOf(i) === shelfCur;
    const shown = list.filter(vis).length;
    return `<div class="apps">
      <div class="app-hero"><span class="lm-mascot app-mascot" data-pose="yeah" data-say="apps"></span><p class="app-k">★ ${esc(cfg.name || T("Kho Ứng dụng", "App Library"))}</p>
        <h2>${esc(cfg.headline || T("Ứng dụng mình xây và dùng hằng ngày.", "Apps I build and use every day."))}</h2>
        <div class="app-counts">${shelves.filter((s) => cnt(s.id)).map((s) => `<span><b>${cnt(s.id)}</b> ${esc(s.name)}</span>`).join("")}</div></div>
      ${spot.length ? `<h3 class="app-sec">${T("Mới và nổi bật", "New and featured")} <span class="lm-mascot app-sec-mascot" data-pose="laptop" data-say="apps"></span></h3><div class="app-spot">${spot.map((i) => appCard(i, true, extra)).join("")}</div>` : ""}
      <div class="app-shelves" role="group" aria-label="${T("Lọc theo kệ", "Filter by shelf")}">
        <button type="button" class="app-shelf-btn${shelfCur === "all" ? " on" : ""}" data-shelf-f="all" aria-pressed="${shelfCur === "all"}"><b>${T("Tất cả", "All")}</b><small>${list.length}</small></button>
        ${shelves.map((s) => { const n = cnt(s.id); return `<button type="button" class="app-shelf-btn${shelfCur === s.id ? " on" : ""}${n ? "" : " soon"}" data-shelf-f="${esc(s.id)}" aria-pressed="${shelfCur === s.id}"><b>${esc(s.name)}</b><small>${n || T("sắp có", "soon")}</small>${s.sub ? `<i>${esc(s.sub)}</i>` : ""}</button>`; }).join("")}
      </div>
      <div class="app-grid">${list.map((i) => appCard(i, false, extra).replace("<article ", `<article ${vis(i) ? "" : "hidden "}`)).join("")}</div>
      <div class="app-empty"${shown ? " hidden" : ""}><span class="lm-mascot" data-pose="wave" data-say="empty" style="--size:110px;margin:0 auto"></span><b>${T("Kệ này đang được chuẩn bị.", "This shelf is being stocked.")}</b><span>${T("Quay lại sau nhé, ứng dụng mới sẽ lên đây.", "Check back soon, new apps will land here.")}</span></div>
    </div>`;
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-shelf-f]"); if (!b) return;
    const box = b.closest(".apps"); const f = b.dataset.shelfF;
    shelfCur = shelfCur === f || f === "all" ? "all" : f; // bấm lại kệ đang chọn thì về Tất cả
    box.querySelectorAll("[data-shelf-f]").forEach((x) => { const on = x.dataset.shelfF === shelfCur; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
    let n = 0; box.querySelectorAll(".app-grid .app-card").forEach((c) => { const on = shelfCur === "all" || c.dataset.shelf === shelfCur; c.hidden = !on; n += on; });
    box.querySelector(".app-empty").hidden = n > 0;
  });

  const groupSelectHtml = (kho, cur) => { const gs = khoGroups(kho); return gs ? gs.map((g) => `<option value="${esc(g.id)}" ${g.id === cur ? "selected" : ""}>${esc(g.name)}</option>`).join("") : ""; };

  document.addEventListener("click", (e) => {
    const gh = e.target.closest("[data-gtoggle]"); if (gh) { toggleGroup(gh); return; }
    const rf = e.target.closest("[data-refresh]");
    if (rf) { rf.disabled = true; rf.textContent = T("Đang làm mới…", "Refreshing…"); refresh(true).catch(() => {}); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { const t = cp.parentNode.querySelector("code").textContent; (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => { cp.textContent = T("Đã copy ✓", "Copied ✓"); setTimeout(() => (cp.textContent = "Copy"), 1500); }, () => { cp.textContent = T("Bôi đen để copy", "Select to copy"); }); return; }
    const c = e.target.closest("[data-res]"); if (c) open(c.dataset.res); });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.gtoggle) { e.preventDefault(); toggleGroup(e.target); return; } if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.res) { e.preventDefault(); open(e.target.dataset.res); } });
  return { load, all, card, open, visible, loadFeeds, refresh, startAutoRefresh, groupPills, group, groupOf, khoGroups, groupSelectHtml, appShelf };
})();
