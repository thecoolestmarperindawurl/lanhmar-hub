(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || "")) ? u : "");
  const list = Array.isArray(window.COMMUNITIES) ? window.COMMUNITIES : [];

  const card = (g) => {
    const url = okUrl(g.url), soon = g.status === "soon";
    return `<article class="cm-card reveal" id="${esc(g.id)}">
      <div class="cm-top"><span class="cm-plat">${esc(g.platform || "Cộng đồng")}</span><span class="cm-state ${soon ? "soon" : ""}"><i></i>${soon ? "Sắp mở" : "Đang mở"}</span></div>
      <h3>${esc(g.name)}</h3>
      <p>${esc(g.desc)}</p>
      ${(g.topics || []).length ? `<ul class="cm-topics">${g.topics.slice(0, 5).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <dl class="cm-meta"><dt>Nền tảng</dt><dd>${esc(g.platform || "Đang cập nhật")}</dd>${g.members ? `<dt>Thành viên</dt><dd>${esc(g.members)}</dd>` : ""}</dl>
      <div class="cm-act">
        ${url ? `<a class="cm-join" href="${esc(url)}" target="_blank" rel="noopener">Tham gia nhóm →</a><button class="cm-copy" type="button" data-copy="${esc(url)}">Sao chép link</button>`
              : `<span class="cm-join" aria-disabled="true">Link đang cập nhật</span>`}
      </div></article>`;
  };
  const add = `<article class="cm-card add reveal"><div class="cm-plus">+</div><h3>Bạn muốn một nhóm mới?</h3><p>Gợi ý chủ đề nhóm bạn muốn tham gia, hoặc mời mình vào cộng đồng của bạn.</p><a class="btn dark" href="index.html#contact">Nhắn cho mình →</a></article>`;
  $("#cmGrid").innerHTML = list.map(card).join("") + add;
  const open = list.filter((g) => g.status !== "soon").length;
  $("#cmCount").innerHTML = `<b>${open}</b> nhóm đang mở`;


  // phần giới thiệu chi tiết cho nhóm nổi bật
  const initials = (n) => String(n).split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();
  const f = list.find((g) => g.feature);
  if (f) {
    const url = okUrl(f.url), ex = (f.experts || []).filter((x) => x.show !== false && x.name);
    const expCard = (x) => `<article class="cm-ex reveal"><div class="cm-av" aria-hidden="true">${esc(initials(x.name))}</div><div class="cm-ex-b"><h3>${esc(x.name)}</h3>${x.role ? `<p class="cm-role">${esc(x.role)}</p>` : ""}${x.bio ? `<p>${esc(x.bio)}</p>` : ""}${(x.points || []).length ? `<ul>${x.points.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}${(x.links || []).length ? `<div class="cm-lk">${x.links.filter((l) => okUrl(l.u)).map((l) => `<a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(l.t)} ↗</a>`).join("")}</div>` : ""}</div></article>`;
    const mod = f.moderator;
    $("#spotBody").innerHTML = `
      <p class="kicker">NHÓM NỔI BẬT</p>
      <h2>Giới thiệu nhóm ${esc(f.name)}.</h2>
      <div class="cm-about reveal"><p>${esc(f.desc)}</p>
        <dl class="cm-facts"><div><dt>Nền tảng</dt><dd>${esc(f.platform)}</dd></div>${mod ? `<div><dt>Moderator</dt><dd>${esc(mod.name)}</dd></div>` : ""}<div><dt>Chủ đề</dt><dd>${(f.topics || []).map(esc).join(", ")}</dd></div></dl>
        ${url ? `<div class="cm-act"><a class="cm-join" href="${esc(url)}" target="_blank" rel="noopener">Vào nhóm trên ${esc(f.platform)} →</a></div>` : ""}</div>
      ${(f.members_kinds || []).length ? `<h3 class="cm-sub">Ai đang ở trong nhóm</h3><div class="cm-kinds">${f.members_kinds.map((k, i) => `<div class="cm-kind reveal"><b class="n">${i + 1}</b><h4>${esc(k.t)}</h4><p>${esc(k.d)}</p></div>`).join("")}</div>` : ""}
      ${ex.length ? `<h3 class="cm-sub">Chuyên gia đang hoạt động trong nhóm</h3><div class="cm-exs">${ex.map(expCard).join("")}</div>` : ""}
      ${mod ? `<h3 class="cm-sub">Người điều hành</h3><article class="cm-ex reveal"><div class="cm-av" aria-hidden="true">${esc(initials(mod.name))}</div><div class="cm-ex-b"><h3>${esc(mod.name)}</h3><p class="cm-role">${esc(mod.role)}</p><div class="cm-lk"><a href="index.html">Xem trang cá nhân ↗</a></div></div></article>` : ""}`;
    $("#spot").hidden = false;
  }

  // sao chép link
  const toast = (m) => { const t = $("#cmToast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2200); };
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Đã sao chép link nhóm"); } catch { toast("Không sao chép được, hãy bấm giữ vào link"); }
  });

  // hiện dần khi cuộn
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) els.forEach((x) => x.classList.add("in"));
  else { const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.08 }); els.forEach((x, i) => { x.style.setProperty("--d", (i % 4) * 80 + "ms"); io.observe(x); }); }

  // menu điện thoại
  const burger = $("#burger"), nav = $("#navlinks");
  const setMenu = (o) => { nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "✕" : "☰"; };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
})();
