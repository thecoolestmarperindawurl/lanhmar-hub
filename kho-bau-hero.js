/* Hero Kho báu: cuộn từ sáng sang tối, sao Hải Vương 3D nhô lên từ chân trời.
   Hành tinh được vẽ từng điểm ảnh trên canvas 2D (không cần thư viện): mặt cầu có họa tiết dải mây, Vết Tối Lớn, mây ti trắng,
   ánh sáng đổi hướng và đổi màu theo tiến độ cuộn (nắng trắng → ánh cam hoàng hôn → chỉ còn viền sáng), kèm vành đai mảnh và vệ tinh Triton.
   Tiến độ cuộn p (0..1) điều khiển: nền sáng→tối, độ cao hành tinh, hướng sáng, hai khối chữ và ba thẻ. */
(() => {
  const hero = document.getElementById("kbHero"), cv = document.getElementById("kbPlanet");
  if (!hero || !cv || !cv.getContext) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const copy1 = hero.querySelector(".kb-copy1"), copy2 = hero.querySelector(".kb-copy2");
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const mix3 = (A, B, t) => [mix(A[0], B[0], t), mix(A[1], B[1], t), mix(A[2], B[2], t)];

  // ---- họa tiết bề mặt: nhiễu giá trị lặp theo kinh độ ----
  const hash = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const vnoise = (x, y, px, s) => {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const X0 = ((x0 % px) + px) % px, X1 = (X0 + 1) % px;
    const a = hash(X0, y0, s), b = hash(X1, y0, s), c = hash(X0, y0 + 1, s), d = hash(X1, y0 + 1, s);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
  const fbm = (x, y, px, s, oct) => { let v = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < oct; i++) { v += a * vnoise(x * f, y * f, px * f, s + i); t += a; a *= 0.5; f *= 2; } return v / t; };
  const TW = 1024, TH = 512, TEX = new Uint8Array(TW * TH * 3);
  function buildTexture() {
    const deep = [22, 48, 148], midc = [38, 88, 214], bright = [92, 152, 252];
    for (let j = 0; j < TH; j++) {
      const v = j / TH, lat = (v - 0.5) * Math.PI;
      for (let i = 0; i < TW; i++) {
        const u = i / TW;
        const band = Math.sin(lat * 8 + fbm(u * 6, v * 3, 6, 1, 3) * 3.2) * 0.5 + 0.5;
        let c = mix3(deep, midc, 0.3 + 0.55 * band);
        c = mix3(c, bright, ss(0.55, 0.9, fbm(u * 9, v * 6, 9, 4, 3)) * 0.5);
        // mây ti trắng kéo dài theo kinh độ, nhiều ở vĩ độ trung bình
        const w = ss(0.62, 0.8, fbm(u * 14, v * 50, 14, 7, 3)) * (0.3 + 0.7 * ss(0.15, 0.5, Math.abs(lat)));
        // Vết Tối Lớn + mây bạn đồng hành
        let dl = u - 0.62; dl -= Math.round(dl);
        const d = Math.hypot((dl * 2 * Math.PI) / 0.42, (lat + 0.35) / 0.2);
        c = mix3(c, [8, 22, 92], (1 - ss(0.6, 1.1, d)) * 0.85);
        let dl2 = u - 0.7; dl2 -= Math.round(dl2);
        const comp = 1 - ss(0.3, 1, Math.hypot((dl2 * 2 * Math.PI) / 0.5, (lat + 0.62) / 0.07));
        c = mix3(c, [236, 246, 255], clamp(Math.max(w * 0.85, comp * 0.9)));
        const k = (j * TW + i) * 3; TEX[k] = c[0]; TEX[k + 1] = c[1]; TEX[k + 2] = c[2];
      }
    }
  }

  // ---- hình học mặt cầu (tính một lần) ----
  const CS = 560, R = 170, N = R * 2, CX = CS / 2, CY = CS / 2;
  cv.width = cv.height = CS;
  const pc = document.createElement("canvas"); pc.width = pc.height = N; const pctx = pc.getContext("2d");
  const img = pctx.createImageData(N, N), PX = img.data;
  const NX = new Float32Array(N * N), NY = new Float32Array(N * N), NZ = new Float32Array(N * N), UB = new Float32Array(N * N), VI = new Int16Array(N * N), AL = new Uint8Array(N * N), RM = new Float32Array(N * N);
  (function geo() {
    const tilt = 0.38, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = y * N + x, sx = (x - R + 0.5) / R, sy = -(y - R + 0.5) / R, r2 = sx * sx + sy * sy;
      if (r2 >= 1.04) { AL[k] = 0; continue; }
      const r = Math.sqrt(r2), sz = Math.sqrt(Math.max(0, 1 - r2));
      AL[k] = Math.round(clamp((1 - r) * R * 0.8) * 255);
      NX[k] = sx; NY[k] = sy; NZ[k] = sz;
      const x1 = sx * ct + sy * st, y1 = -sx * st + sy * ct;
      UB[k] = Math.atan2(x1, sz) / (2 * Math.PI) + 0.5;
      VI[k] = clamp(Math.asin(clamp(y1, -1, 1)) / Math.PI + 0.5, 0, 0.999) * TH | 0;
      RM[k] = Math.pow(1 - sz, 3);
    }
  })();

  const state = { p: 0, n: 1, warm: 1, theta: 2.2, t: 0 };
  function planetPixels(rot) {
    const th = state.theta, Lx0 = Math.sin(th) * 0.85, Ly0 = 0.5, Lz0 = Math.cos(th), Ln = Math.hypot(Lx0, Ly0, Lz0);
    const Lx = Lx0 / Ln, Ly = Ly0 / Ln, Lz = Lz0 / Ln, w = state.warm;
    const lc = mix3([255, 247, 234], [255, 138, 78], w), rc = mix3([120, 190, 255], [255, 150, 92], w);
    const ro = rot / (2 * Math.PI);
    for (let k = 0; k < N * N; k++) {
      const a = AL[k]; if (!a) { PX[k * 4 + 3] = 0; continue; }
      let u = UB[k] + ro; u -= Math.floor(u);
      const ti = (VI[k] * TW + ((u * TW) | 0)) * 3;
      const dot = NX[k] * Lx + NY[k] * Ly + NZ[k] * Lz, d = ss(-0.1, 0.65, dot), rl = ss(-0.35, 0.7, dot), rf = RM[k];
      const a0 = 0.05, a1 = 0.07, a2 = 0.16;
      let r = TEX[ti] / 255 * (a0 + d * 1.2 * lc[0] / 255) + rf * (rl * rc[0] / 255 * 0.95 + 0.06);
      let g = TEX[ti + 1] / 255 * (a1 + d * 1.2 * lc[1] / 255) + rf * (rl * rc[1] / 255 * 0.95 + 0.1);
      let b = TEX[ti + 2] / 255 * (a2 + d * 1.2 * lc[2] / 255) + rf * (rl * rc[2] / 255 * 0.95 + 0.28);
      const o = k * 4; PX[o] = clamp(r) * 255; PX[o + 1] = clamp(g) * 255; PX[o + 2] = clamp(b) * 255; PX[o + 3] = a;
    }
    pctx.putImageData(img, 0, 0);
  }

  const TILT = -0.38;
  function ring(a, back, rgb, alpha, lw) {
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(TILT);
    ctx.beginPath(); ctx.ellipse(0, 0, a * R, a * R * 0.24, 0, back ? Math.PI : 0, back ? Math.PI * 2 : Math.PI);
    ctx.strokeStyle = `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${alpha})`; ctx.lineWidth = lw; ctx.stroke(); ctx.restore();
  }
  function moon(psi, front) {
    const s = Math.sin(psi); if ((s > 0) !== front) return;
    const ox = Math.cos(psi) * R * 1.5, oy = s * R * 1.5 * 0.28, c = Math.cos(TILT), sn = Math.sin(TILT);
    const x = CX + ox * c - oy * sn, y = CY + ox * sn + oy * c, mr = R * 0.07;
    const g = ctx.createRadialGradient(x - mr * 0.35, y - mr * 0.4, mr * 0.1, x, y, mr);
    const w = state.warm; g.addColorStop(0, `rgb(${mix(250, 255, w) | 0},${mix(238, 190, w) | 0},${mix(232, 150, w) | 0})`); g.addColorStop(1, "rgb(60,56,92)");
    ctx.beginPath(); ctx.arc(x, y, mr, 0, 7); ctx.fillStyle = g; ctx.fill();
  }
  function draw() {
    const w = state.warm, rot = state.t * 0.1 + state.p * 2.6, psi = state.t * 0.35 + 1;
    ctx.clearRect(0, 0, CS, CS);
    const hc = mix3([120, 190, 255], [255, 130, 84], w), ha = mix(0.34, 0.26, state.n);
    const hg = ctx.createRadialGradient(CX, CY, R * 0.96, CX, CY, R * 1.6);
    hg.addColorStop(0, `rgba(${hc[0] | 0},${hc[1] | 0},${hc[2] | 0},${ha})`); hg.addColorStop(1, `rgba(${hc[0] | 0},${hc[1] | 0},${hc[2] | 0},0)`);
    ctx.fillStyle = hg; ctx.fillRect(0, 0, CS, CS);
    const rg = mix3([190, 215, 255], [255, 205, 170], w);
    ring(1.3, true, rg, 0.2, 4); ring(1.5, true, rg, 0.26, 1.6); moon(psi, false);
    planetPixels(rot); ctx.drawImage(pc, CX - R, CY - R);
    ring(1.3, false, rg, 0.2, 4); ring(1.5, false, rg, 0.26, 1.6); moon(psi, true);
  }

  // ---- cuộn: p điều khiển mọi thứ ----
  function setVars(v) { for (const k in v) hero.style.setProperty("--" + k, v[k]); }
  function progress() { const r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight; return span > 0 ? clamp(-r.top / span) : 1; }
  function scrub() {
    const p = progress(), eo = (x) => 1 - Math.pow(1 - x, 3);
    state.p = p; state.n = ss(0.08, 0.7, p); state.warm = ss(0.25, 0.8, p); state.theta = 0.25 + 2.35 * ss(0, 0.9, p);
    const c1 = 1 - ss(0.2, 0.38, p), c2 = ss(0.5, 0.66, p), cp = ss(0.62, 0.88, p);
    setVars({ n: state.n.toFixed(3), rise: (0.27 + 0.23 * eo(ss(0, 0.8, p))).toFixed(3), c1: c1.toFixed(3), c2: c2.toFixed(3), cp: cp.toFixed(3) });
    if (copy1) copy1.style.visibility = c1 < 0.02 ? "hidden" : "visible";
    if (copy2) copy2.style.visibility = c2 < 0.02 ? "hidden" : "visible";
    hero.classList.toggle("kb-live", cp > 0.3);
  }

  let visible = true, raf = 0, last = 0;
  function loop(ts) {
    raf = 0; if (!visible) return;
    if (ts - last > 28) { state.t = ts / 1000; scrub(); draw(); last = ts; }
    raf = requestAnimationFrame(loop);
  }
  buildTexture();
  if (reduce) {
    hero.classList.add("kb-static");
    Object.assign(state, { p: 0.8, n: 1, warm: 1, theta: 2.1, t: 2 }); setVars({ n: 1, rise: 0.36, c1: 1, c2: 0, cp: 1 }); draw(); return;
  }
  scrub(); draw();
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: "100px" }).observe(hero);
  raf = requestAnimationFrame(loop);
})();
