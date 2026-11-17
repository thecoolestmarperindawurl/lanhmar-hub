/* Cosmos: lớp chuyển động cho trang chủ LANHMAR (giao diện Galaxy). Canvas 2D + JS thuần, không thư viện ngoài.
   Mỗi phần chỉ chạy khi đang trong khung nhìn; chọn "giảm chuyển động" thì hiện khung tĩnh / bỏ hiệu ứng.
   1  Hero: bụi sao biến hình (dải Ngân Hà ↔ thiên hà xoắn ốc ↔ hành tinh có vành ↔ ngôi sao ★ ↔ chữ LANHMAR), trôi, né con trỏ
   2  Hero: mở màn, chữ MARKETER trồi lên, thị sai khi cuộn, gợi ý cuộn, mũi tên nút
   3  Thanh điều hướng ẩn khi cuộn xuống
   4  Nhảy tới mục xa: màn "bước nhảy siêu tốc" rồi nội dung trồi lên
   5  Hành trình: đám bụi sao bay trước, rơi xuống thành sợi chòm sao; chương nét dần khi sợi chạm tới; số chương lớn đổi theo
   6  Tiêu đề mục: từng ký tự rơi xuống
   7  Dịch vụ: đường dẫn bằng sao sáng lần lượt
   8  "Ngoài giờ": cuộn từ hoàng hôn sang đêm, hành tinh chấm mọc lên, vành quỹ đạo có 3 sao chổi (AI agent chạy 24/7), nổ thành sao
   9  Dự án: tiêu đề rõ dần, thẻ trồi lên lần lượt, rê chuột làm mờ thẻ khác, mở chi tiết phóng ra từ chính thẻ
   10 Liên hệ: giếng sóng hấp dẫn, con trỏ để lại gợn sóng */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const TAU = Math.PI * 2;
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ss = (a, b, t) => { const x = cl((t - a) / (b - a)); return x * x * (3 - 2 * x); };
  const ease3 = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const gauss = () => Math.random() + Math.random() + Math.random() - 1.5;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 1.5);
  const visible = (el, cb, margin = "80px") => { if (!("IntersectionObserver" in window)) return cb(true); new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el); };

  // chấm sáng dựng sẵn: lõi trắng, màu brand, quầng mờ. Dải màu tím → cam.
  const PAL = [[106, 92, 255], [143, 132, 255], [185, 176, 255], [255, 176, 138], [255, 122, 69]];
  const NB = 12;
  const mix = (k) => { const s = k * (PAL.length - 1), i = Math.min(PAL.length - 2, Math.floor(s)), f = s - i; return PAL[i].map((v, j) => Math.round(v + (PAL[i + 1][j] - v) * f)); };
  const SPR = Array.from({ length: NB }, (_, b) => {
    const c = mix(b / (NB - 1)), o = document.createElement("canvas"); o.width = o.height = 32;
    const g = o.getContext("2d"), rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.2, `rgba(${c},1)`); rg.addColorStop(0.5, `rgba(${c},.32)`); rg.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = rg; g.fillRect(0, 0, 32, 32); return o;
  });
  const fitCanvas = (cv, ctx) => { const d = DPR(), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); } ctx.setTransform(d, 0, 0, d, 0, 0); return [w, h]; };

  // tween nhỏ chạy theo requestAnimationFrame (thay cho thư viện)
  const tweens = new Set();
  const tween = (obj, to, dur, easeFn = ease3, yoyo = false) => new Promise((res) => {
    const from = {}; for (const k in to) from[k] = obj[k];
    tweens.add({ obj, from, to, dur: dur * 1000, t0: performance.now(), easeFn, yoyo, res });
  });
  const runTweens = (now) => { for (const tw of tweens) { const k = cl((now - tw.t0) / tw.dur); let e = tw.easeFn(k); if (tw.yoyo) e = Math.sin(Math.PI * e); for (const key in tw.to) tw.obj[key] = lerp(tw.from[key], tw.to[key], e); if (k >= 1) { if (tw.yoyo) for (const key in tw.to) tw.obj[key] = tw.from[key]; tweens.delete(tw); tw.res(); } } };
  const sine = (k) => -(Math.cos(Math.PI * k) - 1) / 2;
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

  /* ========== 1. HERO: bụi sao biến hình ========== */
  (function swarm() {
    const hero = $(".hero"); if (!hero) return;
    const cv = document.createElement("canvas"); cv.className = "cx-swarm"; cv.setAttribute("aria-hidden", "true");
    hero.prepend(cv);
    const ctx = cv.getContext("2d");
    const LOW = innerWidth < 1100 || (navigator.hardwareConcurrency || 8) <= 4;
    const N = innerWidth < 820 ? 1100 : LOW ? 1700 : 3000, K = 5; // 0 dải Ngân Hà · 1 thiên hà xoắn ốc · 2 hành tinh có vành · 3 ngôi sao ★ · 4 chữ LANHMAR
    const S = Array.from({ length: K }, () => new Float32Array(N * 3)), R = new Float32Array(N * 4);
    for (let i = 0; i < N * 4; i++) R[i] = Math.random();

    // lấy mẫu điểm từ một hình vẽ trên canvas phụ
    const sample = (draw, w = 300, h = 300) => { const o = document.createElement("canvas"); o.width = w; o.height = h; const g = o.getContext("2d"); g.fillStyle = "#000"; draw(g, w, h);
      const d = g.getImageData(0, 0, w, h).data, pts = []; for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 128) pts.push([(x - w / 2) / (w / 2), -(y - h / 2) / (w / 2)]); return pts; };
    const star = sample((g) => { g.translate(150, 150); g.scale(12, 12); g.translate(-12, -12); g.fill(new Path2D("M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z")); });
    const fill = (k, gen) => { for (let i = 0; i < N; i++) S[k].set(gen(i), i * 3); };
    const GEN = [
      (i) => { // dải Ngân Hà: tấm lụa xoắn, đầu phải vỡ thành bụi
        const kk = i % 3, u = Math.random(), x = -1.1 + u * 2.2, ph = [0, 1.15, 2.4][kk], amp = [0.2, 0.15, 0.11][kk], w = [0.16, 0.13, 0.1][kk];
        const v = Math.round(Math.random() * 16) / 8 - 1, tw = x * 3.6 + ph, yc = Math.sin(x * 6.5 + ph) * amp;
        let q = [x, yc + v * w * Math.cos(tw), v * w * Math.sin(tw) * 1.6 + (kk - 1) * 0.07];
        const sc = Math.max(0, (u - 0.62) / 0.38); if (Math.random() < sc * 0.9) { const sp = sc * sc * 0.36; q = [x + sc * 0.22 + gauss() * sp, q[1] + gauss() * sp, q[2] + gauss() * sp]; }
        return q; },
      () => { // thiên hà xoắn ốc 2 nhánh, đĩa nghiêng 60°
        const arm = Math.random() < 0.5 ? 0 : Math.PI, r = Math.pow(Math.random(), 0.7), a = r * 4.2 + arm + gauss() * 0.32 * (1.2 - r);
        const x = Math.cos(a) * r, y = Math.sin(a) * r, z = gauss() * 0.05 * (1 - r); return [x, y * 0.5 - z * 0.87, y * 0.87 + z * 0.5]; },
      () => { // hành tinh + vành đai nghiêng
        if (Math.random() < 0.66) { const u = Math.random() * 2 - 1, t = Math.random() * TAU, r = 0.52 + gauss() * 0.01; return [Math.sqrt(1 - u * u) * Math.cos(t) * r, u * r, Math.sqrt(1 - u * u) * Math.sin(t) * r]; }
        const a = Math.random() * TAU, rr = rnd(0.78, 1.05), x = Math.cos(a) * rr, z = Math.sin(a) * rr, ti = 1.25, tz = -0.38;
        let y = -z * Math.sin(ti), z2 = z * Math.cos(ti); return [x * Math.cos(tz) - y * Math.sin(tz), x * Math.sin(tz) + y * Math.cos(tz), z2]; },
      () => { const p = star[(Math.random() * star.length) | 0]; return [p[0] * 1.05 + gauss() * 0.01, p[1] * 1.05 + gauss() * 0.01, (Math.random() - 0.5) * 0.18]; },
      null, // chữ: lấy mẫu sau khi font Montserrat tải xong
    ];
    for (let k = 0; k < 4; k++) fill(k, GEN[k]);
    fill(4, GEN[3]);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      const txt = sample((g, w, h) => { g.font = "800 92px Montserrat, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("LANHMAR", w / 2, h / 2); }, 520, 140);
      if (txt.length) fill(4, () => { const p = txt[(Math.random() * txt.length) | 0]; return [p[0] * 1.15, p[1] * 1.15, (Math.random() - 0.5) * 0.12]; });
    });

    const st = { chaos: 1, w0: 1, w1: 0, w2: 0, w3: 0, w4: 0, x: 0, y: 0, s: 120, sx: 1 };
    let spin = 0, lastT = 0, W = 0, H = 0, spots = null, mouse = { x: -1e4, y: -1e4 }, vel = { x: 0, y: 0 }, prev = { x: 0, y: 0 }, on = true, raf = 0, t0 = performance.now();
    const rect = (el) => { const r = el.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { l: r.left - h.left, t: r.top - h.top, r: r.right - h.left, b: r.bottom - h.top, w: r.width, h: r.height }; };
    const measure = () => {
      [W, H] = fitCanvas(cv, ctx);
      const h1 = $("h1", hero), ph = $(".hero-photo", hero), cta = $(".cta-row", hero); if (!h1 || !ph) return;
      const a = rect(h1), p = rect(ph), c = cta ? rect(cta) : a, phone = W < 820;
      if (!phone) {
        // dải Ngân Hà bắc từ tiêu đề sang ảnh, hơi thấp
        const gl = Math.min(a.r - 40, a.l + a.w * 0.7), gr = p.l + p.w * 0.2;
        const forms = [[(a.r + p.l) / 2, a.t + a.h * 0.25], [p.r + Math.max(70, (W - p.r) / 2), p.t + p.h * 0.22], [(p.l + p.r) / 2, Math.max(140, (110 + p.t) / 2)], [p.r + Math.max(70, (W - p.r) / 2), p.t + p.h * 0.72]]
          .filter(([x]) => x < W - 50);
        spots = { ribbon: [(gl + gr) / 2, a.t + a.h * 0.78, Math.max(90, (gr - gl) / 2.1)], forms, size: Math.min(120, Math.max(64, (W - p.r) * 0.42)) };
      } else {
        spots = { ribbon: [W / 2, (c.b + p.t) / 2 + 6, W * 0.42], forms: [[W * 0.18, p.t + 60], [W * 0.82, p.t + 60], [W * 0.5, p.t - 30]], size: Math.min(70, W * 0.18) };
      }
    };
    new ResizeObserver(() => measure()).observe(hero);
    addEventListener("load", measure); measure();
    if (fine && !reduce) hero.addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    hero.addEventListener("pointerleave", () => { mouse = { x: -1e4, y: -1e4 }; });
    const place = (sp, scale, sx = 1) => { st.x = sp[0]; st.y = sp[1]; st.s = scale; st.sx = sx; };
    const W5 = (f) => ({ w0: +(f === 0), w1: +(f === 1), w2: +(f === 2), w3: +(f === 3), w4: +(f === 4) });

    async function director() {
      place(spots.ribbon, spots.ribbon[2], 1); prev = { x: st.x, y: st.y };
      tween(st, { chaos: 0 }, 3, (k) => 1 - Math.pow(1 - k, 2));
      if (W < 820) return; // điện thoại: chỉ giữ dải Ngân Hà trôi nhẹ, không biến hình để khỏi che chữ và nút
      let last = 0;
      for (;;) {
        await wait(last === 0 ? rnd(7, 9) : rnd(4.5, 7));
        const f = last !== 0 && Math.random() < 0.5 ? 0 : [1, 2, 3, 4].filter((x) => x !== last)[(Math.random() * 3) | 0];
        last = f;
        const sp = f === 0 ? spots.ribbon : spots.forms[(Math.random() * spots.forms.length) | 0], sc = f === 0 ? spots.ribbon[2] : spots.size * (f === 4 ? 1.35 : 1);
        tween(st, { chaos: 1 }, 4.4, sine, true);               // tan ra…
        tween(st, W5(f), rnd(4.2, 5.2));                         // …thành hình mới
        tween(st, { s: sc }, 6);
        await tween(st, { x: sp[0], y: sp[1] }, rnd(7.5, 9.5), sine); // trôi chậm tới chỗ mới
      }
    }

    const frame = (now) => {
      raf = 0; if (!on) return;
      runTweens(now);
      const t = (now - t0) / 1000; spin += (t - lastT) * 0.15 * st.w1; lastT = t;
      ctx.clearRect(0, 0, W, H);
      vel.x = lerp(vel.x, st.x - prev.x, 0.15); vel.y = lerp(vel.y, st.y - prev.y, 0.15); prev = { x: st.x, y: st.y };
      const w = [st.w0, st.w1, st.w2, st.w3, st.w4], calm = 1 - 0.8 * st.w0;
      const ry = (Math.sin(t * 0.11) * 0.45 + (mouse.x > -1e3 ? (mouse.x / W - 0.5) * 0.5 : 0)) * calm + spin;
      const rx = (Math.sin(t * 0.08) * 0.14) * calm, cy = Math.cos(ry), sy = Math.sin(ry), cx_ = Math.cos(rx), sx_ = Math.sin(rx);
      const c = st.chaos, F = 3.2;
      // quầng sáng dưới đám bụi khi đã thành hình
      const halo = (1 - c) * 0.22;
      if (halo > 0.01) { const g = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.s * 1.6); g.addColorStop(0, `rgba(143,132,255,${halo})`); g.addColorStop(0.5, `rgba(255,122,69,${halo * 0.3})`); g.addColorStop(1, "rgba(106,92,255,0)"); ctx.fillStyle = g; ctx.fillRect(st.x - st.s * 1.6, st.y - st.s * 1.6, st.s * 3.2, st.s * 3.2); }
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const i3 = i * 3, i4 = i * 4, r0 = R[i4], r1 = R[i4 + 1], r2 = R[i4 + 2], r3 = R[i4 + 3];
        let x = 0, y = 0, z = 0;
        for (let k = 0; k < K; k++) { const wk = w[k]; if (wk < 0.001) continue; x += S[k][i3] * wk; y += S[k][i3 + 1] * wk; z += S[k][i3 + 2] * wk; }
        x *= st.sx;
        const tt = t * (0.25 + r0 * 0.35), amp = 0.012 + c * 0.32 * (0.4 + r1);
        x += (Math.sin(y * 2.1 + tt * 0.7 + r2 * 6) + Math.sin(z * 1.7 - tt * 0.5)) * amp + (r0 - 0.5) * c * 1.4;
        y += (Math.sin(z * 2.3 + tt * 0.6 + r0 * 6) + Math.sin(x * 1.9 + tt * 0.4)) * amp + (r1 - 0.5) * c * 1.4 + st.w0 * Math.sin(x * 3 - t * 0.8 + r1 * 0.5) * 0.05;
        z += (Math.sin(x * 2.0 - tt * 0.55) + Math.sin(y * 1.6 + tt * 0.65)) * amp + (r2 - 0.5) * c * 1.0;
        const X = x * cy + z * sy, Z0 = -x * sy + z * cy, Y = y * cx_ - Z0 * sx_, Z = y * sx_ + Z0 * cx_;
        const k = F / (F - Z);
        let px = st.x + X * st.s * k, py = st.y - Y * st.s * k;
        const trail = 1.5 + Math.pow(r0, 1.4) * 9; px -= vel.x * trail; py -= vel.y * trail;   // vệt mờ khi đám bụi trôi
        const dx = px - mouse.x, dy = py - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 8100) { const d = Math.sqrt(d2) || 1, f = (90 - d) / 90 * 26; px += dx / d * f; py += dy / d * f; }   // né con trỏ
        if (px < -8 || px > W + 8 || py < -8 || py > H + 8) continue;
        const tw = 0.68 + 0.32 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.2 + r1 * 50), 2);
        const sz = (0.95 + r2 * 1.15) * k * (0.9 + 0.2 * Math.sin(t * 3 + r3 * 40));
        const b = st.w0 > 0.5 ? Math.round(cl((S[0][i3] + 1.1) / 2.2) * (NB - 1)) : r3 < 0.55 ? (r3 * 9) | 0 : NB - 1 - ((r0 * 4) | 0);
        ctx.globalAlpha = cl((0.6 + 0.45 * (Z + 1) / 2) * tw);
        ctx.drawImage(SPR[b], px - sz * 2, py - sz * 2, sz * 4, sz * 4);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    const go = () => { if (!raf) raf = requestAnimationFrame(frame); };
    visible(hero, (v) => { on = v; if (v) go(); }, "0px");
    if (reduce) { st.chaos = 0; place(spots.ribbon, spots.ribbon[2]); addEventListener("load", () => { measure(); place(spots.ribbon, spots.ribbon[2]); go(); }); go(); cv.classList.add("on"); return; }
    setTimeout(() => { measure(); cv.classList.add("on"); director(); }, 500);
  })();

  /* ========== 2. HERO: mở màn, thị sai, gợi ý cuộn, mũi tên ========== */
  (function heroIntro() {
    const hero = $(".hero"); if (!hero) return;
    const wm = $(".watermark", hero);
    if (wm && !reduce) { const t = wm.textContent; wm.textContent = ""; [...t].forEach((ch, i) => { const s = document.createElement("span"); s.className = "cx-l"; s.style.setProperty("--i", i); s.textContent = ch; wm.appendChild(s); }); }
    if (document.documentElement.classList.contains("cx-intro")) { const v = document.createElement("div"); v.className = "cx-veil-in"; v.setAttribute("aria-hidden", "true"); document.body.appendChild(v); v.addEventListener("animationend", () => v.remove()); setTimeout(() => v.remove(), 2500); }
    hero.insertAdjacentHTML("beforeend", '<span class="cx-cue" aria-hidden="true"><i></i></span>');
    // bọc mũi tên → trong nút để nó trượt khi rê chuột
    $$(".btn").forEach((b) => [...b.childNodes].forEach((n) => { if (n.nodeType === 3 && /[→↗]/.test(n.textContent)) { const i = document.createElement("i"); i.className = "cx-arr"; i.textContent = n.textContent.trim(); n.replaceWith(" ", i); } }));
    if (reduce) return;
    const img = $(".hero-photo>img", hero), copy = $(".hero-copy", hero); let tk = 0;
    const upd = () => { tk = 0; const p = cl(scrollY / (hero.offsetHeight || 1));
      if (wm) wm.style.translate = `0 ${(-60 * p).toFixed(1)}%`;
      if (img) img.style.scale = (1 - 0.05 * p).toFixed(3);
      if (copy && innerWidth > 640) { copy.style.translate = `0 ${(-60 * cl(p / 0.55)).toFixed(1)}px`; copy.style.opacity = (1 - cl(p / 0.55)).toFixed(3); } };
    addEventListener("scroll", () => { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true });
  })();

  /* ========== 3. Thanh điều hướng ẩn khi cuộn xuống ========== */
  (function navHide() {
    const nav = $(".pill-nav"); if (!nav) return;
    let last = scrollY;
    addEventListener("scroll", () => { const y = scrollY, down = y > last && y > 240;
      if (down && !nav.classList.contains("cx-hide")) { nav.classList.add("cx-hide"); const m = $("#navlinks"); if (m && m.classList.contains("open")) { m.classList.remove("open"); const b = $("#burger"); if (b) b.setAttribute("aria-expanded", "false"); } }
      else if (!down && y < last - 4) nav.classList.remove("cx-hide");
      last = y; }, { passive: true });
  })();

  /* ========== 4. Nhảy tới mục xa: bước nhảy siêu tốc ========== */
  (function warp() {
    if (reduce || !Element.prototype.animate) return;
    const veil = document.createElement("div"); veil.className = "cx-warp"; veil.setAttribute("aria-hidden", "true"); document.body.appendChild(veil);
    let busy = false;
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a || busy || e.defaultPrevented) return;
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      const y = el.getBoundingClientRect().top + scrollY - 100, d = Math.abs(y - scrollY);
      if (d < innerHeight * 2.4) return; // gần: để trình duyệt cuộn mượt như thường
      e.preventDefault(); busy = true;
      const root = document.documentElement, sb = root.style.scrollBehavior;
      veil.animate([{ opacity: 0, transform: "scale(1.25)" }, { opacity: 1, transform: "scale(1)" }], { duration: 380, easing: "cubic-bezier(.55,0,1,.45)", fill: "forwards" }).finished.then(() => {
        root.style.scrollBehavior = "auto"; scrollTo(0, Math.max(0, y)); root.style.scrollBehavior = sb; history.replaceState(null, "", id);
        $$(":scope > .wrap > *, :scope > .wrap > * > *", el).slice(0, 10).forEach((c, i) => c.animate([{ transform: "translateY(24px)", opacity: 0.3 }, { transform: "none", opacity: 1 }], { duration: 900, delay: 80 + i * 60, easing: "cubic-bezier(.16,1,.3,1)" }));
        return veil.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.9)" }], { duration: 600, delay: 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" }).finished;
      }).finally(() => { busy = false; });
    });
  })();

  /* ========== 5. Hành trình: sợi chòm sao ========== */
  (function story() {
    const box = $("#chapters"); if (!box) return;
    const col = document.createElement("div"); col.className = "cx-thread-col"; col.setAttribute("aria-hidden", "true");
    const cv = document.createElement("canvas"); col.appendChild(cv); box.appendChild(col);
    const ctx = cv.getContext("2d"), LX = 24;
    let chaps = [], Y0 = 0, Y1 = 0, nodes = [], head = -1e9, goal = -1e9, P = [], raf = 0, seen = false, t0 = performance.now();
    const N = innerWidth < 820 ? 380 : 620, FLY = 110;
    for (let i = 0; i < N; i++) P.push({ u: Math.random(), jx: (Math.random() - 0.5) * 1.8, r: 0.7 + Math.random() * 1.3, ph: Math.random() * TAU, sp: 0.5 + Math.random() * 0.7, rx: 4 + Math.random() * 20, ry: 10 + Math.random() * 60 });
    const measure = () => {
      chaps = $$(".chapter", box); if (!chaps.length) return;
      const br = box.getBoundingClientRect();
      Y0 = chaps[0].getBoundingClientRect().top - br.top + 14; Y1 = chaps[chaps.length - 1].getBoundingClientRect().bottom - br.top - 24;
      nodes = chaps.map((c, i) => ({ y: c.getBoundingClientRect().top - br.top + 28, at: nodes[i] ? nodes[i].at : 0 }));
      if (head < Y0) head = goal = Y0 - 1;
      if (!reduce) chaps.forEach((c) => c.classList.add("cx-wait"));
      light();
    };
    const light = () => chaps.forEach((c, i) => { if (reduce || (nodes[i] && head >= nodes[i].y - 30)) { c.classList.add("cx-lit"); if (nodes[i] && !nodes[i].at) nodes[i].at = performance.now(); } });
    new MutationObserver(() => requestAnimationFrame(measure)).observe(box, { childList: true });
    new ResizeObserver(() => measure()).observe(box);
    measure();
    const frame = (now) => {
      raf = 0;
      const [W, H] = fitCanvas(cv, ctx), off = cv.getBoundingClientRect().top - box.getBoundingClientRect().top, t = (now - t0) / 1000;
      goal = Math.max(goal, Math.min(Y1, innerHeight * 0.62 - box.getBoundingClientRect().top));
      head += (goal - head) * 0.07; if (goal - head < 0.3) head = goal; light();
      ctx.clearRect(0, 0, W, H);
      // sợi mảnh nối từ đầu tới đầu sợi (mờ)
      const a0 = Y0 - off, a1 = Math.min(head, Y1) - off;
      if (a1 > a0) { const g = ctx.createLinearGradient(0, a0, 0, a1); g.addColorStop(0, "rgba(143,132,255,.35)"); g.addColorStop(1, "rgba(255,122,69,.45)"); ctx.fillStyle = g; ctx.fillRect(LX - 0.5, Math.max(-5, a0), 1, Math.min(H + 5, a1) - Math.max(-5, a0)); }
      ctx.globalCompositeOperation = "lighter";
      const ccx = LX + 8, ccy = head + 56 - off, show = Math.min(1, t * 0.6);
      for (const q of P) {
        const ty = Y0 + q.u * (Y1 - Y0), d = ty - head, b = Math.round(q.u * (NB - 1));
        const ix = ccx + Math.cos(t * q.sp + q.ph) * q.rx, iy = ccy + Math.sin(t * q.sp * 0.8 + q.ph) * q.ry;
        let x, y, al, sz = q.r;
        if (d > 0) { al = 0.55 * show * cl((640 - d) / 420); x = ix; y = iy; }                       // đang chờ trong đám bụi phía trước
        else { const k = Math.min(1, -d / FLY), e = ease3(k), mx = LX + 30, my = (iy + ty - off) / 2 - 10, tx = LX + q.jx, tyy = ty - off;
          const at = (s) => { const v = 1 - s; return [v * v * ix + 2 * v * s * mx + s * s * tx, v * v * iy + 2 * v * s * my + s * s * tyy]; };
          [x, y] = at(e); sz = q.r * (1 - 0.3 * e); al = 0.55 + 0.3 * e;
          if (k < 1) { const s2 = Math.sin(Math.PI * k); for (let gk = 1; gk <= 3; gk++) { const [gx, gy] = at(Math.max(0, e - gk * 0.03 * s2)); ctx.globalAlpha = 0.5 * (0.4 - gk * 0.1) * s2; ctx.drawImage(SPR[b], gx - sz * 2, gy - sz * 2, sz * 4, sz * 4); } } }
        if (al <= 0.01 || y < -10 || y > H + 10) continue;
        ctx.globalAlpha = al; ctx.drawImage(SPR[b], x - sz * 2, y - sz * 2, sz * 4, sz * 4);
      }
      // nút sao ở đầu mỗi chương: nảy lên khi sợi chạm tới
      nodes.forEach((n, i) => { if (!n.at) return; const y = n.y - off; if (y < -30 || y > H + 30) return;
        const k = cl((now - n.at) / 600), pop = k < 1 ? 1 + Math.sin(Math.PI * k) * 0.8 : 1, s = 7 * pop, b = Math.round(i / Math.max(1, nodes.length - 1) * (NB - 1));
        ctx.globalAlpha = 1; ctx.drawImage(SPR[b], LX - s * 2, y - s * 2, s * 4, s * 4); });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (seen && !reduce) raf = requestAnimationFrame(frame);
    };
    visible(box, (v) => { seen = v; if (v && !raf) raf = requestAnimationFrame(frame); }, "200px");
    if (reduce) { head = goal = 1e9; }
    // số chương lớn phía sau tiêu đề, đổi theo chương đang đọc
    const side = $(".story-side"), n = $("#chapN");
    if (side && n) { const big = document.createElement("span"); big.className = "cx-bignum"; big.setAttribute("aria-hidden", "true"); big.textContent = n.textContent; side.prepend(big);
      new MutationObserver(() => { if (big.textContent === n.textContent) return; big.textContent = n.textContent; big.classList.remove("swap"); void big.offsetWidth; big.classList.add("swap"); }).observe(n, { childList: true, characterData: true, subtree: true }); }
  })();

  /* ========== 6. Tiêu đề mục: từng ký tự rơi xuống ========== */
  (function letters() {
    const heads = $$("#story h2, #menu h2, #services h2, #work h2, #certs h2, #contact h2");
    if (!heads.length || reduce) return;
    const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("cx-in"); e.target.dataset.cxPlayed = "1"; io.unobserve(e.target); } }), { rootMargin: "0px 0px -15% 0px" }) : null;
    const split = (h, mo) => {
      if (h.querySelector(".cx-ch")) return; mo.disconnect();
      const words = h.textContent.trim().split(/\s+/); h.textContent = ""; let i = 0;
      words.forEach((w, wi) => { const ws = document.createElement("span"); ws.className = "cx-w"; [...w].forEach((ch) => { const s = document.createElement("span"); s.className = "cx-ch"; s.style.setProperty("--i", Math.min(i++, 60)); s.textContent = ch; ws.appendChild(s); }); h.appendChild(ws); if (wi < words.length - 1) h.appendChild(document.createTextNode(" ")); });
      h.setAttribute("aria-label", words.join(" "));
      mo.observe(h, { childList: true, characterData: true, subtree: true });
    };
    heads.forEach((h) => {
      h.classList.remove("reveal");
      const mo = new MutationObserver(() => split(h, mo)); // site.js ghi lại chữ khi đổi ngôn ngữ → tách lại
      split(h, mo);
      if (io) io.observe(h); else h.classList.add("cx-in");
    });
  })();

  /* ========== 7. Dịch vụ: đường dẫn sao ========== */
  (function leaders() {
    const box = $("#svcCols"); if (!box) return;
    let io = null;
    const prep = () => {
      $$(".svc h4", box).forEach((h) => { if (!h.querySelector(".cx-leader")) h.insertAdjacentHTML("beforeend", '<i class="cx-leader" aria-hidden="true"></i>'); });
      if (reduce || !("IntersectionObserver" in window)) { $$(".svc", box).forEach((s) => s.classList.add("cx-lit")); return; }
      io = io || new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target);
        $$(".svc", e.target).forEach((s, i) => setTimeout(() => s.classList.add("cx-lit"), 150 + i * 160)); }), { rootMargin: "0px 0px -12% 0px" });
      $$(".svc-col", box).forEach((c) => io.observe(c));
    };
    new MutationObserver(prep).observe(box, { childList: true });
    prep();
  })();

  /* ========== 8. "Ngoài giờ": hoàng hôn → đêm vũ trụ ========== */
  (function night() {
    const sec = $(".after"); if (!sec || reduce) return;
    const wrap = $(".wrap", sec); if (!wrap) return;
    sec.classList.add("cx-night", "cx-quiet");
    const stage = document.createElement("div"); stage.className = "cx-night-stage";
    const cv = document.createElement("canvas"); cv.className = "cx-night-cv"; cv.setAttribute("aria-hidden", "true");
    sec.insertBefore(stage, wrap); stage.append(cv, wrap);
    const ctx = cv.getContext("2d");
    const h2 = $("h2", wrap);
    let A = [], B = [];
    const split = (mo) => { if (!h2 || h2.querySelector(".cx-nw")) return; mo && mo.disconnect();
      const t = h2.textContent.trim(), cut = t.indexOf(","), p1 = cut > 0 ? t.slice(0, cut + 1) : "", p2 = cut > 0 ? t.slice(cut + 1).trim() : t;
      h2.textContent = ""; h2.setAttribute("aria-label", t);
      const add = (s, cls) => s.split(/\s+/).filter(Boolean).map((w) => { const e = document.createElement("span"); e.className = "cx-nw " + cls; e.textContent = w; h2.append(e, " "); return e; });
      A = add(p1, "a"); B = add(p2, "b"); mo && mo.observe(h2, { childList: true, characterData: true, subtree: true }); };
    const mo = new MutationObserver(() => split(mo)); split(mo); mo.observe(h2, { childList: true, characterData: true, subtree: true });
    const flick = (t, s) => (Math.sin(t * 47 + s * 13) > 0.35 ? 1 : 0.25) * (Math.sin(t * 23 + s * 7) > -0.6 ? 1 : 0.4);
    const words = (p, t) => {
      A.forEach((w, i) => { const a = 0.16 + i * 0.035, k = ss(a, a + 0.1, p), off = ss(0.42, 0.48, p), fl = off > 0 && off < 1 ? flick(t, i) : 1;   // trồi lên từ bóng tối, rồi "tắt đèn"
        w.style.opacity = (k * (1 - 0.55 * off) * fl).toFixed(3); w.style.transform = `translateY(${((1 - k) * 0.5).toFixed(3)}em) rotateX(${((1 - k) * 55).toFixed(1)}deg)`; w.style.filter = `blur(${((1 - k) * 10).toFixed(1)}px)`; });
      B.forEach((w, i) => { const a = 0.46 + i * 0.03, k = ss(a, a + 0.08, p), on = k > 0 && k < 1 ? flick(t, i + 5) : 1, g = ss(a + 0.04, a + 0.14, p) * (0.75 + 0.25 * Math.sin(t * 2.2 + i));   // đèn neon bật lên
        w.style.opacity = (k * on).toFixed(3); w.style.transform = `translateY(${((1 - k) * 0.35).toFixed(3)}em) scale(${(1 + (1 - k) * 0.08).toFixed(3)})`;
        w.style.filter = `blur(${((1 - k) * 8).toFixed(1)}px) drop-shadow(0 0 ${(14 * g).toFixed(1)}px rgba(143,132,255,${(0.6 * g).toFixed(2)})) drop-shadow(0 0 ${(28 * g).toFixed(1)}px rgba(255,122,69,${(0.4 * g).toFixed(2)}))`;
        w.style.setProperty("--sx", (((t * 0.35) % 1.6) * 260 - 160).toFixed(1) + "%"); });
    };
    // hành tinh chấm (phân bố Fibonacci), vành quỹ đạo, chân trời, sao
    const NP = innerWidth < 700 ? 900 : 1600, G = [];
    for (let i = 0; i < NP; i++) { const y = 1 - (i + 0.5) / NP * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; G.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, j: Math.random(), s: 0.7 + Math.random() * 0.8 }); }
    const HZ = Array.from({ length: 140 }, () => ({ x: Math.random(), o: Math.random() * TAU }));
    const NO = NP > 1000 ? 260 : 150, ORB = Array.from({ length: NO }, (_, i) => ({ a: i / NO * TAU, r: 1.32 + (Math.random() - 0.5) * 0.05, s: 0.6 + Math.random() * 0.7 }));
    const STAR = Array.from({ length: innerWidth < 700 ? 90 : 180 }, () => ({ x: Math.random(), y: Math.random() * 0.85, d: 0.2 + Math.random() * 0.8, b: (Math.random() * NB) | 0, o: Math.random() * TAU, s: 0.6 + Math.random() * 1.4 }));
    const L = [-0.55, 0.45, 0.7], LN = Math.hypot(...L); L.forEach((v, i) => (L[i] = v / LN));
    let on = false, raf = 0;
    const frame = (now) => {
      raf = 0; if (!on) return;
      const [W, H] = fitCanvas(cv, ctx), r = sec.getBoundingClientRect(), p = cl(-r.top / (r.height - innerHeight)), t = now / 1000;
      const night = ss(0.12, 0.5, p), rise = ss(0, 0.32, p), burst = ss(0.7, 0.97, p);
      sec.classList.toggle("cx-quiet", p < 0.5 || p > 0.93);
      wrap.style.opacity = (1 - ss(0.9, 0.99, p)).toFixed(3);
      words(p, t);
      ctx.clearRect(0, 0, W, H);
      const hy = H * 0.8;
      // hoàng hôn: quầng cam ở chân trời, tắt dần khi vào đêm
      const dusk = (1 - night) * (0.35 + 0.65 * ss(0, 0.1, p));
      if (dusk > 0.01) { const g = ctx.createLinearGradient(0, hy - H * 0.55, 0, H); g.addColorStop(0, "rgba(255,122,69,0)"); g.addColorStop(0.55, `rgba(255,140,100,${0.28 * dusk})`); g.addColorStop(0.8, `rgba(255,122,69,${0.4 * dusk})`); g.addColorStop(1, `rgba(106,92,255,${0.3 * dusk})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      if (night > 0) { ctx.fillStyle = `rgba(6,4,22,${(0.45 * night * (1 - burst * 0.6)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
      // chân trời chấm mờ
      const ha = ((1 - night) * 0.5 + 0.12 * night) * (1 - burst) * (1 - ss(0.5, 0.64, p));
      for (const q of HZ) { ctx.globalAlpha = ha * (0.5 + 0.5 * Math.sin(t * 1.3 + q.o)); ctx.drawImage(SPR[Math.round(lerp(3, 10, q.x))], q.x * W - 3, hy - 3, 6, 6); }
      const lastEl = $(".btn", wrap) || h2, cb = lastEl ? lastEl.getBoundingClientRect().bottom - stage.getBoundingClientRect().top : H * 0.45;
      const R0 = Math.max(60, Math.min(Math.min(W, H) * (W < 700 ? 0.3 : 0.22), (H - cb - 24) * 0.36)), Cx = W / 2;
      const Cy = lerp(W < 700 ? H * 1.05 : H * 1.25, Math.max(H * 0.6, cb + 24 + R0 * 1.35), rise), rot = t * 0.22 + p * 2.4, tilt = 0.38;
      const nightFull = ss(0.42, 0.6, p), ring = ss(0.4, 0.58, p) * (1 - burst);
      if (night > 0.05 && burst < 1) { const fa = night * (1 - ss(0, 0.35, burst)), g = ctx.createRadialGradient(Cx, Cy, R0 * 0.85, Cx, Cy, R0 * 1.6);   // khí quyển: viền tím mỏng
        g.addColorStop(0, "rgba(143,132,255,0)"); g.addColorStop(0.15, `rgba(143,132,255,${0.4 * fa})`); g.addColorStop(1, "rgba(106,92,255,0)"); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(Cx, Cy, R0 * 1.6, 0, TAU); ctx.fill(); }
      const orbit = (back) => { if (ring <= 0.01) return; const oa = t * 0.35, ti = 0.3, tz = -0.32;
        for (const o of ORB) { const Aa = o.a + oa; let x = Math.cos(Aa) * o.r, y = 0, z = Math.sin(Aa) * o.r;
          const y2 = y * Math.cos(ti) - z * Math.sin(ti); z = y * Math.sin(ti) + z * Math.cos(ti); y = y2;
          const x2 = x * Math.cos(tz) - y * Math.sin(tz); y = x * Math.sin(tz) + y * Math.cos(tz); x = x2;
          if ((z < 0) !== back) continue;
          const k = 3.2 / (3.2 - z), px = Cx + x * R0 * k, py = Cy - y * R0 * k;
          if (back && Math.hypot(px - Cx, py - Cy) < R0 * 0.98) continue;                      // nửa sau bị hành tinh che
          const head = Math.pow(0.5 + 0.5 * Math.cos(Aa * 3 - t * 2.1), 18);                    // 3 sao chổi = 3 AI agent chạy quanh
          const sz = (1.8 + 3.4 * head) * o.s * k * (W < 700 ? 0.85 : 1), b = Math.round(((Aa % TAU) + TAU) % TAU / TAU * (NB - 1));
          ctx.globalAlpha = Math.min(1, ring * (back ? 0.45 : 1) * (0.45 + 0.75 * head)); ctx.drawImage(SPR[b], px - sz, py - sz, sz * 2, sz * 2); } };
      orbit(true);
      ctx.globalCompositeOperation = night > 0.5 ? "lighter" : "source-over";
      const glow = (1 - ss(0.42, 0.6, p)) * rise;                                                // còn là mặt trời: quầng cam ấm
      if (glow > 0.01) { ctx.globalAlpha = 1; const g = ctx.createRadialGradient(Cx, Cy, R0 * 0.2, Cx, Cy, R0 * 2.4); g.addColorStop(0, `rgba(255,150,90,${0.42 * glow})`); g.addColorStop(1, "rgba(255,150,90,0)"); ctx.fillStyle = g; ctx.fillRect(Cx - R0 * 2.4, Cy - R0 * 2.4, R0 * 4.8, R0 * 4.8); }
      const cs = Math.cos(rot), sn = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt), hue = ss(0.28, 0.6, p), big = lerp(1.45, 1, night);
      for (const q of G) {
        let x = q.x * cs - q.z * sn, z = q.x * sn + q.z * cs, y = q.y;
        const y2 = y * ct - z * st; z = y * st + z * ct; y = y2;
        const k = 3.2 / (3.2 - z), px = Cx + x * R0 * k, py = Cy - y * R0 * k, lit = Math.max(0, x * L[0] + y * L[1] + z * L[2]);
        let X = px, Y = py, a = (0.2 + 0.8 * (z + 1) / 2) * lerp(1, 0.25 + 0.95 * lit, nightFull), sz = 2.4 * q.s * k * big * lerp(1, 0.8 + 0.55 * lit, nightFull);
        if (burst > 0) { const dx = px - Cx, dy = py - Cy, d = Math.hypot(dx, dy) || 1, f = burst * burst * (Math.max(W, H) * (0.5 + q.j)); X += dx / d * f; Y += dy / d * f - burst * H * 0.15; a *= 1 - burst * 0.55; sz *= 1 - burst * 0.5; }
        if (Y > hy + 2 && burst < 0.05) a *= lerp(0.12, 1, nightFull);                          // dưới chân trời: khuất khi đang mọc
        if (X < -10 || X > W + 10 || Y < -10 || Y > H + 10) continue;
        const b = Math.round(cl(1 - (hue * 0.85 + q.j * 0.25 - 0.1 + (1 - hue) * q.y * 0.1)) * (NB - 1));   // cam (mặt trời) → tím (đêm)
        ctx.globalAlpha = Math.min(1, a * 0.95); ctx.drawImage(SPR[b], X - sz, Y - sz, sz * 2, sz * 2);
        if (q.j > 0.9 && nightFull > 0 && lit < 0.32 && z > -0.1 && burst < 0.6) {               // phía đêm vẫn sáng đèn: việc vẫn chạy
          const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + q.s * 2) + q.j * 90), cz = sz * 1.15; ctx.globalAlpha = nightFull * (0.45 + 0.55 * tw) * (1 - burst); ctx.drawImage(SPR[NB - 1], X - cz, Y - cz, cz * 2, cz * 2); }
      }
      orbit(false);
      ctx.globalCompositeOperation = "source-over";
      if (burst > 0) for (const q of STAR) { const tw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * (0.6 + q.d) + q.o), 2), z = q.s * 2.2; ctx.globalAlpha = 0.55 * tw * q.d * burst; ctx.drawImage(SPR[q.b], q.x * W - z, q.y * H - z, z * 2, z * 2); }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    visible(sec, (v) => { on = v; if (v && !raf) raf = requestAnimationFrame(frame); }, "0px");
  })();

  /* ========== 9. Dự án ========== */
  (function work() {
    const sec = $("#work"); if (!sec) return;
    const head = $(".wrap", sec);
    // tiêu đề rõ dần khi cuộn tới
    const kick = $(".kicker", head), sub = $(".sub", head);
    if (!reduce && "IntersectionObserver" in window) [kick, sub].forEach((el) => { if (!el) return; const box = document.createElement("div"); box.className = "cx-focus"; el.replaceWith(box); box.appendChild(el);
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { box.classList.add("cx-in"); io.disconnect(); } }, { rootMargin: "0px 0px -10% 0px" }); io.observe(box); });
    const grid = $("#projects"); if (!grid) return;
    let io = null, q = [], qt = 0;
    const prep = () => {
      $$(".pcard", grid).forEach((c) => { if (!c.querySelector(".cx-open")) { const ph = $(".ph", c); if (ph) ph.insertAdjacentHTML("beforeend", '<span class="cx-open" aria-hidden="true">↗</span>'); } });
      if (reduce || !("IntersectionObserver" in window)) return;
      io = io || new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) { q.push(e.target); io.unobserve(e.target); } });
        clearTimeout(qt); qt = setTimeout(() => { q.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left)
          .forEach((c, i) => setTimeout(() => c.classList.add("cx-up"), i * 120)); q = []; }, 30); }, { rootMargin: "0px 0px -12% 0px" });
      $$(".pcard:not(.cx-rise)", grid).forEach((c) => { c.classList.add("cx-rise"); io.observe(c); });
    };
    new MutationObserver(prep).observe(grid, { childList: true }); prep();
    // rê chuột: các thẻ khác mờ đi, mascot ngó sang và nhún
    const masc = $(".work-mascot");
    if (fine) {
      grid.addEventListener("pointerover", (e) => { const c = e.target.closest(".pcard"); if (!c) return; grid.classList.add("cx-dim");
        if (masc && !reduce && c !== grid._cxLast) { grid._cxLast = c; const mr = masc.getBoundingClientRect(), cr = c.getBoundingClientRect(); masc.style.rotate = cl(((cr.left + cr.width / 2) - (mr.left + mr.width / 2)) / 900, -1, 1) * 8 + "deg";
          masc.classList.remove("cx-hop"); void masc.offsetWidth; masc.classList.add("cx-hop"); } });
      grid.addEventListener("pointerleave", () => { grid.classList.remove("cx-dim"); grid._cxLast = null; if (masc) masc.style.rotate = ""; });
    }
    // mở chi tiết: hộp thoại phóng ra từ chính thẻ vừa bấm, đóng thì thu về thẻ
    const dlg = $("#dlg"); if (!dlg || reduce || !Element.prototype.animate) return;
    let from = null, fromAt = 0, closing = false;
    document.addEventListener("click", (e) => { const c = e.target.closest(".pcard, .ccard"); if (c) { from = c; fromAt = performance.now(); } }, true);
    const delta = (r1) => { const r2 = dlg.getBoundingClientRect(); return `translate(${(r1.left + r1.width / 2 - (r2.left + r2.width / 2)).toFixed(1)}px,${(r1.top + r1.height / 2 - (r2.top + r2.height / 2)).toFixed(1)}px) scale(${(r1.width / r2.width).toFixed(3)},${(r1.height / r2.height).toFixed(3)})`; };
    new MutationObserver(() => {
      if (!dlg.open || !from || performance.now() - fromAt > 600) return;
      const r1 = from.getBoundingClientRect();
      dlg.animate([{ transform: delta(r1), opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 750, easing: "cubic-bezier(.16,1,.3,1)" });
      $$(".dbody > *", dlg).forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(26px)" }, { opacity: 1, transform: "none" }], { duration: 700, delay: 220 + i * 50, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
    }).observe(dlg, { attributes: true, attributeFilter: ["open"] });
    const shut = () => { if (closing || !dlg.open) return; closing = true; const card = from && document.contains(from) ? from : null;
      const a = card ? dlg.animate([{ transform: "none", opacity: 1 }, { transform: delta(card.getBoundingClientRect()), opacity: 0 }], { duration: 450, easing: "cubic-bezier(.55,0,1,.45)", fill: "forwards" })
        : dlg.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.96)" }], { duration: 250, fill: "forwards" });
      a.finished.then(() => { dlg.close(); a.cancel(); closing = false; from = null; }); };
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("#dlgX")) { e.stopImmediatePropagation(); e.preventDefault(); shut(); } }, true);
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); shut(); });
  })();

  /* ========== 10. Liên hệ: giếng sóng hấp dẫn ========== */
  (function pool() {
    const sec = $("#contact"); if (!sec) return;
    const cv = document.createElement("canvas"); cv.className = "cx-pool"; cv.setAttribute("aria-hidden", "true"); sec.prepend(cv);
    const ctx = cv.getContext("2d"), RIP = [], FL = 0.3;
    let on = false, raf = 0, last = { x: -1e4, y: -1e4, t: 0 }, t0 = performance.now();
    const center = (W, H) => { const img = $(".bye-wrap", sec); if (img && W >= 820) { const r = img.getBoundingClientRect(), s = sec.getBoundingClientRect(); return [r.left - s.left + r.width / 2, Math.min(H - 40, r.bottom - s.top + 30)]; } return [W / 2, H * 0.92]; };
    const ellipse = (x, y, r, a, c, dash) => { if (a <= 0.005 || r < 2) return; ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.setLineDash(dash); ctx.beginPath(); ctx.ellipse(x, y, r, r * FL, 0, 0, TAU); ctx.stroke(); };
    const frame = (now) => {
      raf = 0; if (!on) return;
      const [W, H] = fitCanvas(cv, ctx), t = reduce ? 4 : (now - t0) / 1000, [cx, cy] = center(W, H), RM = Math.max(W, H) * 0.75;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160); g.addColorStop(0, "rgba(185,176,255,.22)"); g.addColorStop(1, "rgba(106,92,255,0)"); ctx.fillStyle = g; ctx.save(); ctx.translate(cx, cy); ctx.scale(1, FL); ctx.translate(-cx, -cy); ctx.fillRect(cx - 160, cy - 160, 320, 320); ctx.restore();
      ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineWidth = 2.2;
      for (let k = 0; k < 9; k++) { const r = (t * 26 + k * (RM / 9)) % RM, a = Math.pow(1 - r / RM, 1.4) * cl(r / 40) * 0.8;   // vòng sóng thở ra từ tâm
        ellipse(cx, cy, r, a, k % 2 ? "rgb(185,176,255)" : "rgb(255,176,138)", [1.2, 7 + r * 0.01]); }
      for (let i = RIP.length - 1; i >= 0; i--) { const q = RIP[i], age = (now - q.t) / 1000; if (age > 4.5) { RIP.splice(i, 1); continue; }   // gợn sóng theo con trỏ
        for (let j = 0; j < 3; j++) { const r = 6 + age * 70 * q.f - j * 14; ellipse(q.x, q.y, r, (1 - age / 4.5) * 0.6 * (1 - j * 0.25), j ? "rgb(143,132,255)" : "rgb(255,176,138)", [1.2, 5]); } }
      ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    if (!reduce) {
      sec.addEventListener("pointermove", (e) => { const r = sec.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
        if (now - last.t > 140 && Math.hypot(x - last.x, y - last.y) > 30) { RIP.push({ x, y, t: now, f: 1 }); if (RIP.length > 10) RIP.shift(); last = { x, y, t: now }; } });
      sec.addEventListener("pointerdown", (e) => { const r = sec.getBoundingClientRect(); RIP.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now(), f: 1.6 }); if (RIP.length > 10) RIP.shift(); });
    }
    visible(sec, (v) => { on = v; if (v && !raf) raf = requestAnimationFrame(frame); }, "100px");
  })();
})();
