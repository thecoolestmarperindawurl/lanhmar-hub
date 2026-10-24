/* Tài nguyên nổi bật (kho-featured.json):
   - Thẻ tài liệu: thumbnail nhỏ, bấm mở cửa sổ giới thiệu + demo + link file ở cuối.
   - Thẻ "LIVE" (feed): tin cập nhật trực tiếp (Claude Code, Anthropic News) lấy qua Apps Script, tóm tắt tiếng Việt, báo tin mới.
   Dùng chung cho Kho cá nhân (kho.js) và Data Storage (storage.js). */
window.Res = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => (/^(https?:\/\/|docs\/|assets\/)[^\s"'<>]*$/i.test(String(u || "")) ? u : "");
  const fmtDate = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d || "") ? d.split("-").reverse().join("/") : d || "");
  let list = [], feeds = null;

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
  // Ẩn mục thường trùng link với mục nổi bật (ví dụ 2 mục mẫu Claude Code / Anthropic News)
  const visible = (arr) => { const u = new Set(list.map((x) => x.url).filter(Boolean)); return arr.filter((i) => !u.has(i.url)); };

  /* ---------- tin trực tiếp ---------- */
  const seenKey = (feed) => "lm-seen-" + feed;
  const latestOf = (feed) => {
    if (!feeds) return "";
    const a = feed === "claude" ? feeds.claude : feeds.news;
    return (a || []).map((x) => x.d || "").sort().pop() || "";
  };
  const newCount = (feed) => {
    if (!feeds) return 0;
    let seen = ""; try { seen = localStorage.getItem(seenKey(feed)) || ""; } catch {}
    if (!seen) return 0; // lần đầu vào: không báo "mới" cho toàn bộ tin cũ
    const a = feed === "claude" ? feeds.claude : feeds.news;
    return (a || []).filter((x) => x.d && x.d > seen).length;
  };
  const markSeen = (feed) => { const l = latestOf(feed); if (l) try { localStorage.setItem(seenKey(feed), l); } catch {} };
  const firstVisit = (feed) => { try { return !localStorage.getItem(seenKey(feed)); } catch { return false; } };

  function toast(msg) {
    let t = document.getElementById("resToast");
    if (!t) { t = document.createElement("div"); t.id = "resToast"; t.className = "res-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 7000);
  }

  async function loadFeeds() {
    const api = (window.STORAGE_API || "").trim();
    if (!api || !list.some((i) => i.feed)) return null;
    try { const c = JSON.parse(sessionStorage.getItem("lm-news")); if (c && Date.now() - c.t < 10 * 60e3) feeds = c.v; } catch {}
    if (!feeds) {
      try {
        const r = await fetch(api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "news" }) });
        const j = await r.json();
        if (j.ok) { feeds = j; try { sessionStorage.setItem("lm-news", JSON.stringify({ t: Date.now(), v: j })); } catch {} }
      } catch {}
    }
    if (feeds) {
      // lần đầu: ghi mốc để từ lần sau mới báo "mới"; các lần sau: báo qua thông báo nổi
      ["claude", "news"].forEach((f) => { if (firstVisit(f)) markSeen(f); });
      const nc = newCount("claude"), nn = newCount("news");
      if ((nc || nn) && !sessionStorage.getItem("lm-news-toast")) {
        try { sessionStorage.setItem("lm-news-toast", "1"); } catch {}
        const parts = []; if (nc) parts.push(nc + " bản Claude Code"); if (nn) parts.push(nn + " tin Anthropic");
        toast("🔔 Có cập nhật mới: " + parts.join(" · "));
      }
    }
    return feeds;
  }

  const feedItems = (feed) => (feeds ? (feed === "claude" ? feeds.claude : feeds.news) || [] : []);
  const updatedText = () => { if (!feeds?.updated) return ""; const d = new Date(feeds.updated); return isNaN(d) ? "" : d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }); };

  function miniLine(feed, x) {
    if (feed === "claude") return `<li><b>v${esc(x.v)}</b> ${esc((x.pt && x.pt[0]) || (x.pte && x.pte[0]) || "")}</li>`;
    return `<li><b>${esc(fmtDate(x.d))}</b> ${esc(x.t || x.te)}</li>`;
  }

  function card(i) {
    if (i.feed) {
      const arr = feedItems(i.feed), n = newCount(i.feed);
      return `<article class="card res-card feed-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
        <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy">
        <div class="res-info">
          <span class="badge live"><i></i>LIVE</span><span class="badge">${esc(i.type || "Cập nhật trực tiếp")}</span>${n ? `<span class="badge new">${n} mới</span>` : ""}
          <h3>${esc(i.title)}</h3>
          ${arr.length ? `<ul class="feed-mini">${arr.slice(0, 2).map((x) => miniLine(i.feed, x)).join("")}</ul>` : `<p>${feeds ? "Chưa có tin." : "Đang tải tin mới…"}</p>`}
          <div class="meta"><span>${updatedText() ? "Cập nhật " + esc(updatedText()) : esc(i.note || "")}</span><span class="res-more">Xem tất cả →</span></div>
        </div>
      </article>`;
    }
    return `<article class="card res-card" data-res="${esc(i.id)}" tabindex="0" role="button" aria-label="${esc(i.title)}">
      <img class="res-thumb" src="${esc(okUrl(i.thumb))}" alt="" loading="lazy">
      <div class="res-info">
        <span class="badge">${esc(i.type || "Tài nguyên")}</span><span class="badge shared">Nổi bật</span>
        <h3>${esc(i.title)}</h3>
        <p>${esc(i.note)}</p>
        <div class="meta"><span>${esc(i.date)}</span><span class="res-more">Xem chi tiết →</span></div>
      </div>
    </article>`;
  }

  function show(dlg, html) {
    dlg.innerHTML = html;
    dlg.querySelector("#resX").onclick = () => dlg.close();
    if (!dlg.dataset.wired) { dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); dlg.dataset.wired = "1"; }
    dlg.showModal();
    dlg.scrollTo({ top: 0, behavior: "instant" });
  }

  function openFeed(i, dlg) {
    const arr = feedItems(i.feed);
    const body = !arr.length ? `<p class="res-pad">${feeds ? "Chưa có tin." : "Chưa tải được tin lúc này, thử lại sau ít phút."}</p>`
      : i.feed === "claude"
        ? arr.map((x) => `<article class="news-item"><div class="news-top"><span class="news-ver">v${esc(x.v)}</span><span class="news-date">${esc(fmtDate(x.d))}</span></div>
            <ul>${(x.pt && x.pt.length ? x.pt : x.pte || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
            <a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">Xem bản phát hành ↗</a></article>`).join("")
        : arr.map((x) => `<article class="news-item"><div class="news-top"><span class="news-date">${esc(fmtDate(x.d))}</span></div>
            <h3>${esc(x.t || x.te)}</h3><p>${esc(x.s || x.se)}</p>${x.te && x.t !== x.te ? `<small>Gốc: ${esc(x.te)}</small>` : ""}
            <a href="${esc(okUrl(x.u))}" target="_blank" rel="noopener">Đọc bài gốc ↗</a></article>`).join("");
    markSeen(i.feed);
    show(dlg, `
      <button class="x" id="resX" aria-label="Đóng">×</button>
      <div class="res-body">
        <div class="res-head"><span class="badge live"><i></i>LIVE</span><h2>${esc(i.title)}</h2>
          <p class="news-meta">${updatedText() ? "Cập nhật lúc " + esc(updatedText()) + " · " : ""}tự làm mới mỗi 30 phút. Tóm tắt dịch tự động, có thể chưa chuẩn: bấm bài gốc để đọc đầy đủ.</p></div>
        <div class="news-list">${body}</div>
      </div>
      <div class="res-cta"><div><b>${esc(i.title)}</b><small>${esc(i.url.replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(okUrl(i.url))}" target="_blank" rel="noopener">Mở trang gốc ↗</a></div>`);
  }

  function open(id) {
    const i = list.find((x) => x.id === id); if (!i) return;
    const dlg = document.getElementById("resDlg"); if (!dlg) return;
    if (i.feed) return openFeed(i, dlg);
    const file = i.file && okUrl(i.file.url) ? i.file : null;
    const abs = file ? new URL(file.url, location.href).href : "";
    show(dlg, `
      <button class="x" id="resX" aria-label="Đóng">×</button>
      <div class="res-body">
        ${i.cover ? `<img class="res-cover" src="${esc(okUrl(i.cover))}" alt="">` : ""}
        <div class="res-head">
          <span class="badge">${esc(i.type || "")}</span>
          <h2>${esc(i.title)}</h2>
          <div class="res-tags">${(i.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join(" ")}</div>
        </div>
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
