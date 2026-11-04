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

  // màu nhấn theo loại thẻ: p = tím, o = cam, m = tím + cam
  const accentOf = (c) => {
    const t = ((c.querySelector(".badge") || {}).textContent || "").toLowerCase();
    if (/khoá|khóa|workshop|lms|ebook|web/.test(t)) return "p";
    if (/skill|hướng dẫn|lý thuyết|tổng hợp|research|bài viết|tin|live/.test(t)) return "o";
    if (/repo|tool|công cụ|plugin|lut|font|drive|vps|adobe|dji|bảng|template|tài liệu/.test(t)) return "m";
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
  if (hover && !reduce) {
    let raf = 0;
    document.addEventListener("pointermove", (e) => {
      const c = e.target.closest && e.target.closest(".card"); if (!c || raf) return;
      raf = requestAnimationFrame(() => { raf = 0; const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); });
    }, { passive: true });
  }

  // gợn sóng khi bấm
  if (!reduce) {
    document.addEventListener("pointerdown", (e) => {
      const t = e.target.closest && e.target.closest(".btn,.tab,.gpill,.chip,.card");
      if (!t || t.disabled) return;
      const r = t.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, p = document.createElement("span");
      p.className = "fx-ripple"; p.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      t.appendChild(p); setTimeout(() => p.remove(), 700);
    }, { passive: true });
  }


  // điều khiển cách xem (công tắc và thanh trượt kiểu neumorphism): Gọn / Cỡ thẻ, nhớ lựa chọn trên trình duyệt này
  {
    const bar = document.querySelector(".bar");
    const grid = document.getElementById("grid");
    if (bar && grid && !document.querySelector(".neu-ctl")) {
      const get = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
      const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
      const wrap = document.createElement("div"); wrap.className = "neu-ctl";
      wrap.innerHTML = `<label class="neu-sw"><input type="checkbox" id="neuCompact" role="switch"><i></i><span>Gọn</span></label><label class="neu-rg"><span>Cỡ thẻ</span><input type="range" id="neuSize" min="240" max="420" step="20" aria-label="Cỡ thẻ"></label>`;
      bar.appendChild(wrap);
      const cb = wrap.querySelector("#neuCompact"), rg = wrap.querySelector("#neuSize");
      const apply = () => { document.body.classList.toggle("neu-compact", cb.checked); grid.style.setProperty("--gmin", rg.value + "px"); };
      cb.checked = get("lm-neu-compact", "0") === "1"; rg.value = get("lm-neu-size", "300"); apply();
      cb.addEventListener("change", () => { set("lm-neu-compact", cb.checked ? "1" : "0"); apply(); });
      rg.addEventListener("input", () => { set("lm-neu-size", rg.value); apply(); });
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
