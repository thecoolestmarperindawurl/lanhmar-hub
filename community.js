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
