/* Chuyển động cho trang chủ và Cộng đồng. Tắt khi người dùng chọn giảm chuyển động. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hover = matchMedia("(hover: hover)").matches;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lang = () => { try { return localStorage.getItem("lm_lang") || "vi"; } catch { return "vi"; } };
  const star4 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="currentColor"/></svg>';

  // thanh tiến độ cuộn (luôn hiện) và nền đổi khi cuộn
  {
    const bar = document.createElement("div"); bar.id = "moProg"; bar.setAttribute("aria-hidden", "true");
    const fill = document.createElement("i"); bar.appendChild(fill); document.body.appendChild(bar);
    const nav = $(".pill-nav"); let tk = 0;
    const upd = () => { tk = 0; const h = document.documentElement.scrollHeight - innerHeight; fill.style.transform = `scaleX(${h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0})`; if (nav) nav.classList.toggle("mo-scrolled", scrollY > 24); };
    addEventListener("scroll", () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); addEventListener("resize", upd, { passive: true }); upd();
  }

  // tiêu đề mục có đường kẻ
  const kick = $$(".kicker").filter((k) => !k.closest(".hero"));
  kick.forEach((k) => k.classList.add("mo-line"));
  if (reduce || !("IntersectionObserver" in window)) kick.forEach((k) => k.classList.add("in"));
  else { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.6 }); kick.forEach((k) => io.observe(k)); }

  // lấp lánh + pill kính quanh ảnh (chỉ trang chủ)
  const copy = $(".hero-copy"), photo = $(".hero-photo");
  if (copy) copy.insertAdjacentHTML("beforeend", `<i class="mo-flare a">${star4}</i><i class="mo-flare b">${star4}</i>`);
  if (photo) {
    const words = [["SEO", "c1", 14], ["AI AGENT", "c2", 22], ["PERFORMANCE", "c3", 12], ["DESIGN & EDIT", "c4", 18]];
    photo.insertAdjacentHTML("beforeend", words.map(([w, c, d]) => `<span class="mo-chip ${c}" data-depth="${d}" aria-hidden="true"><b>★</b>${w}</span>`).join(""));
  }

  // hàng pill chạy ngược chiều: các brand đã cộng tác seeding (profile.brands_seeding trong assets/content.json)
  const band = () => {
    const anchor = $("#services"); if (!anchor) return;
    fetch("assets/content.json?v=" + (window.__v || "1")).then((r) => r.json()).then((d) => {
      const p = d.profile || {}, L = lang();
      // mỗi brand: { name, logo, bg? } (logo đặt trong assets/img/brands/; bg = màu nền ô cho logo đi kèm nền thương hiệu); chưa có logo thì hiện tên dạng chữ
      const br = (p.brands_seeding || []).map((b) => (typeof b === "string" ? { name: b, logo: "" } : b)).filter((b) => b && b.name);
      const half = Math.ceil(br.length / 2);
      const rows = [br.slice(0, half), br.slice(half)].filter((r) => r.length);
      if (!rows.length) return;
      // lặp đủ dài để vòng chạy không hở trên màn hình rộng; bản lặp bị ẩn khi chọn giảm chuyển động
      const allLogo = br.every((b) => /^assets\/img\/brands\/[\w\-.]+\.(svg|png|webp|jpg)$/i.test(b.logo || ""));
      const mkText = (arr) => {
        const k = Math.max(1, Math.ceil(1800 / (arr.length * 150)));
        const items = Array.from({ length: k }, (_, n) => arr.map((b) => `<span class="mo-pill${n ? " mo-dup" : ""}">${esc(b.name)}</span>`).join("")).join("");
        const one = `<div class="mo-track">${items}</div>`;
        return one + one.replace('class="mo-track"', 'class="mo-track" aria-hidden="true"');
      };
      const mk = (arr) => {
        const k = Math.max(1, Math.ceil(1800 / (arr.length * 170)));
        const okLogo = (u) => /^assets\/img\/brands\/[\w\-.]+\.(svg|png|webp|jpg)$/i.test(u || "");
        // chỉ chuyển sang dải logo khi mọi brand đã có logo; thiếu thì giữ dạng chữ để dải đồng đều
        if (!allLogo) return mkText(arr);
        const tile = (b, n) => okLogo(b.logo)
          ? `<span class="mo-logo${/^#[0-9a-f]{6}$/i.test(b.bg || "") ? " fill" : ""}${n ? " mo-dup" : ""}"${/^#[0-9a-f]{6}$/i.test(b.bg || "") ? ` style="background:${b.bg}"` : ""} title="${esc(b.name)}"><img src="${esc(b.logo)}" alt="${esc(b.name)}" loading="lazy" decoding="async"></span>`
          : `<span class="mo-logo txt${n ? " mo-dup" : ""}">${esc(b.name)}</span>`;
        const items = Array.from({ length: k }, (_, n) => arr.map((b) => tile(b, n)).join("")).join("");
        const one = `<div class="mo-track">${items}</div>`;
        return one + one.replace('class="mo-track"', 'class="mo-track" aria-hidden="true"');
      };
      let el = $("#moBand");
      if (!el) { el = document.createElement("section"); el.id = "moBand"; el.className = "mo-band"; anchor.parentNode.insertBefore(el, anchor); }
      const head = L === "en" ? ["BRANDS · SEEDING", "Brands I have worked with."] : ["BRAND ĐÃ CỘNG TÁC · SEEDING", "Những thương hiệu mình đã đồng hành."];
      el.classList.toggle("mo-brands", allLogo); // dải logo: luôn chạy từ trái sang phải (xem motion.css)
      el.innerHTML = `<div class="wrap"><p class="kicker mo-line in">★ ${head[0]}</p><h2>${head[1]}</h2></div>` + rows.map((r, i) => `<div class="mo-row r${i + 1}">${mk(r)}</div>`).join("");
    }).catch(() => {});
  };
  band();
  document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(band, 60); });

  // băng ca-rô trước chân trang
  const foot = $("footer"); if (foot) foot.insertAdjacentHTML("beforebegin", '<div class="mo-check" aria-hidden="true"></div>');

  if (reduce) return;

  // thẻ nghiêng 3D + vệt sáng theo chuột
  const TILT = ".pcard,.course-card,.svc-col,.ccard,.stat,.menu-grid>.card,.chapter,.cm-card,.cm-step";
  const prep = (n) => { if (n.nodeType !== 1) return; const f = (el) => { if (el.dataset.mo) return; el.dataset.mo = "1"; el.classList.add("mo-tilt"); el.insertAdjacentHTML("beforeend", '<i class="mo-glare" aria-hidden="true"></i>'); }; if (n.matches && n.matches(TILT)) f(n); n.querySelectorAll && n.querySelectorAll(TILT).forEach(f); };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(prep))).observe(document.body, { childList: true, subtree: true });
  prep(document.body);
  if (hover) {
    let raf = 0;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".mo-tilt");
      $$(".mo-tilt.hot").forEach((h) => { if (h !== el) { h.classList.remove("hot"); h.style.transform = ""; } });
      if (!el || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add("hot"); el.style.setProperty("--gx", x * 100 + "%"); el.style.setProperty("--gy", y * 100 + "%");
        el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 7).toFixed(2)}deg) rotateY(${((x - 0.5) * 9).toFixed(2)}deg) translateY(-4px)`;
      });
    }, { passive: true });
    document.addEventListener("pointerleave", () => $$(".mo-tilt.hot").forEach((h) => { h.classList.remove("hot"); h.style.transform = ""; }), true);

    // nút hút nhẹ về phía con trỏ
    document.addEventListener("pointermove", (e) => {
      const b = e.target.closest && e.target.closest(".btn"); if (!b) return;
      const r = b.getBoundingClientRect();
      b.style.setProperty("--mx2", Math.max(-6, Math.min(6, (e.clientX - r.left - r.width / 2) * 0.12)) + "px");
      b.style.setProperty("--my2", Math.max(-4, Math.min(4, (e.clientY - r.top - r.height / 2) * 0.18)) + "px");
    }, { passive: true });
    document.addEventListener("pointerout", (e) => { const b = e.target.closest && e.target.closest(".btn"); if (b) { b.style.removeProperty("--mx2"); b.style.removeProperty("--my2"); } });

    // pill kính trôi theo con trỏ (視 sai)
    if (photo) addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      $$(".mo-chip", photo).forEach((c) => { const d = +c.dataset.depth || 12; c.style.translate = `${(nx * d * 2).toFixed(1)}px ${(ny * d * 2).toFixed(1)}px`; });
    }, { passive: true });
  }

  // băng chuyền: thẻ gần giữa to hơn
  const rail = $("#certList");
  if (rail) {
    let tk = 0;
    const focus = () => { tk = 0; const r = rail.getBoundingClientRect(), c = r.left + r.width / 2;
      [...rail.children].forEach((k) => { const b = k.getBoundingClientRect(), d = Math.min(1, Math.abs(b.left + b.width / 2 - c) / (r.width * 0.55)); k.style.scale = (1 - d * 0.1).toFixed(3); k.style.opacity = (1 - d * 0.35).toFixed(2); }); };
    const sched = () => { if (!tk) tk = requestAnimationFrame(focus); };
    rail.addEventListener("scroll", sched, { passive: true }); addEventListener("resize", sched, { passive: true });
    new MutationObserver(sched).observe(rail, { childList: true }); sched();
  }

  // thanh công cụ: các biểu tượng phần mềm sáng lần lượt
  let i = 0;
  setInterval(() => { if (document.hidden) return; const all = $$(".swl"); if (!all.length) return; all.forEach((x) => x.classList.remove("mo-on")); all[i++ % all.length].classList.add("mo-on"); }, 1100);
})();
