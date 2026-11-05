/* Hiệu ứng tương tác nhẹ cho Kho và Data Storage: hiện dần khi cuộn, ánh sáng theo chuột, gợn sóng khi bấm, thanh tiến độ cuộn, màu nhấn theo loại thẻ.
   Chỉ dùng màu và chữ có sẵn của LANHMAR; tắt khi người dùng chọn giảm chuyển động. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hover = matchMedia("(hover: hover)").matches;
  const root = document.documentElement;
  const seen = new Set();
  try { JSON.parse(sessionStorage.getItem("lm-fx-seen") || "[]").forEach((k) => seen.add(k)); } catch {}
  const keyOf = (c) => c.dataset.res || (c.querySelector("h3") || {}).textContent || "";
  // công tắc "Hiệu ứng" (gợn sóng khi bấm, ánh sáng theo chuột, vệt sao theo con trỏ); nhớ trên trình duyệt này; mặc định bật, trừ khi máy chọn giảm chuyển động
  const getLS = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
  const setLS = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  // máy chọn "giảm chuyển động": mặc định tắt nhưng người xem vẫn bật được bằng công tắc
  let fxOn = getLS("lm-fx-on", reduce ? "0" : "1") === "1";
  document.body.classList.toggle("fx-off", !fxOn);

  // màu nhấn theo loại thẻ: p = tím, o = cam, m = tím + cam
  const accentOf = (c) => {
    const t = ((c.querySelector(".badge") || {}).textContent || "").toLowerCase();
    if (/khoá|khóa|course|workshop|lms|ebook|web|site/.test(t)) return "p";
    if (/skill|hướng dẫn|guide|lý thuyết|theory|tổng hợp|roundup|research|bài viết|tin|live|map/.test(t)) return "o";
    if (/repo|tool|công cụ|plugin|lut|font|drive|vps|adobe|dji|bảng|ranking|template|tài liệu|extension|app/.test(t)) return "m";
    let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return ["p", "o", "m"][Math.abs(h) % 3];
  };

  let io = null, batch = 0, batchT = 0;
  if (!reduce && "IntersectionObserver" in window) {
    root.classList.add("fx");
    io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        const c = e.target; io.unobserve(c);
        const k = keyOf(c);
        if (seen.has(k)) c.classList.add("in", "seen");
        else { c.style.setProperty("--d", Math.min(batch++, 8) * 0.06 + "s"); c.classList.add("in"); seen.add(k); }
        clearTimeout(batchT); batchT = setTimeout(() => { batch = 0; try { sessionStorage.setItem("lm-fx-seen", JSON.stringify([...seen].slice(-300))); } catch {} }, 400);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  }
  const prep = (c) => {
    if (c.dataset.fx) return; c.dataset.fx = "1";
    c.dataset.accent = accentOf(c);
    if (io) io.observe(c);
  };
  const scan = (n) => { if (n.nodeType !== 1) return; if (n.matches && n.matches(".card")) prep(n); n.querySelectorAll && n.querySelectorAll(".card").forEach(prep); };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll(".card").forEach(prep);

  // ánh sáng theo chuột trên thẻ
  if (hover) {
    let raf = 0;
    document.addEventListener("pointermove", (e) => {
      if (!fxOn) return;
      const c = e.target.closest && e.target.closest(".card"); if (!c || raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); });
    }, { passive: true });
  }

  // gợn sóng khi bấm
  {
    document.addEventListener("pointerdown", (e) => {
      if (!fxOn) return;
      const t = e.target.closest && e.target.closest(".btn,.tab,.gpill,.chip,.card");
      if (!t || t.disabled) return;
      const r = t.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, p = document.createElement("span");
      p.className = "fx-ripple"; p.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      t.appendChild(p); setTimeout(() => p.remove(), 700);
    }, { passive: true });
  }


  // vệt sao ★ theo con trỏ (màu brand, thưa, tự tan) và bung sao nhỏ khi bấm — chỉ khi công tắc Hiệu ứng bật
  if (hover) {
    const layer = document.createElement("div"); layer.className = "fx-stars"; layer.setAttribute("aria-hidden", "true"); document.body.appendChild(layer);
    const COLORS = ["#FF7A45", "#6A5CFF", "#FFD8C2", "#B2A4EF"];
    let last = 0, n = 0;
    const star = (x, y, big) => {
      if (layer.childElementCount > 40) return;
      const el = document.createElement("i"); el.textContent = "★";
      const sz = big ? 14 + Math.random() * 10 : 8 + Math.random() * 8, dx = (Math.random() - .5) * (big ? 90 : 24), dy = (big ? -30 : 10) + Math.random() * (big ? 40 : 20);
      el.style.cssText = `left:${x}px;top:${y}px;font-size:${sz}px;color:${COLORS[n++ % COLORS.length]};--dx:${dx}px;--dy:${dy}px;--rot:${(Math.random() - .5) * 180}deg`;
      layer.appendChild(el); setTimeout(() => el.remove(), 900);
    };
    document.addEventListener("pointermove", (e) => {
      if (!fxOn || e.pointerType !== "mouse") return;
      const t = performance.now(); if (t - last < 70) return; last = t;
      star(e.clientX, e.clientY, false);
    }, { passive: true });
    document.addEventListener("pointerdown", (e) => { if (!fxOn) return; for (let i = 0; i < 6; i++) star(e.clientX, e.clientY, true); }, { passive: true });
  }

  // công tắc "Hiệu ứng" trong thanh tìm kiếm của Kho / Storage (thay cho Gọn và Cỡ thẻ cũ)
  {
    const bar = document.querySelector(".bar");
    if (bar && !document.querySelector(".neu-ctl")) {
      const wrap = document.createElement("div"); wrap.className = "neu-ctl";
      wrap.innerHTML = `<label class="neu-sw" title="Gợn sóng khi bấm, ánh sáng theo chuột, vệt sao theo con trỏ"><input type="checkbox" id="fxToggle" role="switch"><i></i><span data-fx="label">Hiệu ứng</span></label>`;
      bar.appendChild(wrap);
      const cb = wrap.querySelector("#fxToggle"), lb = wrap.querySelector('[data-fx="label"]');
      const fxLang = () => { const T = (v, e) => (window.LM ? LM.t(v, e) : v); lb.textContent = T("Hiệu ứng", "Effects"); wrap.querySelector(".neu-sw").title = T("Gợn sóng khi bấm, ánh sáng theo chuột, vệt sao theo con trỏ", "Click ripples, hover glow, star trail behind the cursor"); };
      fxLang(); document.addEventListener("lm:lang", fxLang);
      cb.checked = fxOn;
      cb.addEventListener("change", () => { fxOn = cb.checked; setLS("lm-fx-on", fxOn ? "1" : "0"); document.body.classList.toggle("fx-off", !fxOn); });
    }
  }

  // thanh tiến độ cuộn: luôn hiện (không phải chuyển động nên không tắt khi chọn giảm chuyển động)
  {
    const bar = document.createElement("div"); bar.id = "fxProg"; bar.setAttribute("aria-hidden", "true");
    const fill = document.createElement("i"); bar.appendChild(fill); document.body.appendChild(bar);
    let tk = 0;
    const upd = () => { tk = 0; const h = root.scrollHeight - innerHeight; const r = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0; fill.style.transform = `scaleX(${r})`; };
    addEventListener("scroll", () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true });
    addEventListener("resize", upd, { passive: true });
    upd();
  }
})();
