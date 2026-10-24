/* Tài nguyên nổi bật (kho-featured.json): thẻ có thumbnail nhỏ, bấm mở cửa sổ giới thiệu + demo + link file ở cuối.
   Dùng chung cho Kho cá nhân (kho.js) và Data Storage (storage.js). */
window.Res = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => (/^(https?:\/\/|docs\/|assets\/)[^\s"'<>]*$/i.test(String(u || "")) ? u : "");
  let list = [];

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

  function card(i) {
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

  function open(id) {
    const i = list.find((x) => x.id === id); if (!i) return;
    const dlg = document.getElementById("resDlg"); if (!dlg) return;
    const file = i.file && okUrl(i.file.url) ? i.file : null;
    const abs = file ? new URL(file.url, location.href).href : "";
    dlg.innerHTML = `
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
      ${file ? `<div class="res-cta"><div><b>${esc(file.label || "Mở tài liệu")}</b><small>${esc(abs.replace(/^https?:\/\//, ""))}</small></div><a class="btn orange-btn" href="${esc(abs)}" target="_blank" rel="noopener">Mở tài liệu ↗</a></div>` : ""}`;
    dlg.querySelector("#resX").onclick = () => dlg.close();
    if (!dlg.dataset.wired) { dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); dlg.dataset.wired = "1"; }
    dlg.showModal();
    dlg.scrollTop = 0;
  }

  document.addEventListener("click", (e) => { const c = e.target.closest("[data-res]"); if (c) open(c.dataset.res); });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset?.res) { e.preventDefault(); open(e.target.dataset.res); } });
  return { load, all, card, open };
})();
