/* Chi tiết ngày lễ phủ lên trang (đi cùng galaxy.js, đọc window.SKY_STATE.fest). Canvas cố định, không bắt chuột, không che nút bấm.
   - Tết Nguyên Đán (7 ngày trước → mùng 7): đèn lồng đỏ đung đưa, hoa mai vàng và hoa đào hồng rơi
   - Quốc khánh 2/9, 30/4 – 1/5: cờ đỏ sao vàng bay trên cột cờ ở góc trái trên
   - Trung thu: đèn ông sao đỏ viền vàng đung đưa
   - Giáng sinh: tuyết rơi nhẹ
   (Pháo hoa và cực quang vẽ trên nền trời trong galaxy.js.) Giảm chuyển động: vẽ một khung tĩnh, không có vật rơi. */
(() => {
  "use strict";
  const ST = window.SKY_STATE; if (!ST || !ST.fest) return;
  const FEST = ST.fest;
  if (!["tet", "national", "reunify", "midautumn", "xmas"].includes(FEST)) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas"); cv.id = "gxFest"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv);
  const ctx = cv.getContext("2d"); if (!ctx) return;
  const TAU = Math.PI * 2;
  let W = 0, H = 0, dpr = 1, SMALL = false, items = [], hangs = [];

  // ---------- cờ Tổ quốc: nền đỏ, sao vàng năm cánh ở giữa (tỉ lệ 2:3, bán kính đường tròn ngoại tiếp sao = 1/5 chiều dài) ----------
  const flagTex = document.createElement("canvas");
  const buildFlag = (L) => { const Hh = Math.round(L * 2 / 3), d = 2; flagTex.width = L * d; flagTex.height = Hh * d; const g = flagTex.getContext("2d"); g.scale(d, d);
    g.fillStyle = "#DA251D"; g.fillRect(0, 0, L, Hh);
    const R = L / 5, r = R * 0.382, cx = L / 2, cy = Hh / 2; g.fillStyle = "#FFFF00"; g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    g.closePath(); g.fill(); return [L, Hh]; };
  let FL = [0, 0];
  const drawFlag = (t) => {
    const [L, Hh] = FL, px = SMALL ? 10 : 24, top = SMALL ? 8 : 16, pole = SMALL ? 64 : 110;
    // cột cờ
    const pg = ctx.createLinearGradient(px - 2, 0, px + 2, 0); pg.addColorStop(0, "#8d8aa8"); pg.addColorStop(0.5, "#f1eefc"); pg.addColorStop(1, "#77739a");
    ctx.fillStyle = pg; ctx.fillRect(px - 1.5, top, 3, pole);
    ctx.fillStyle = "#FFD54A"; ctx.beginPath(); ctx.arc(px, top - 1, 3.2, 0, TAU); ctx.fill();
    // lá cờ gợn sóng: cắt lát dọc, lệch theo sóng, đổ bóng theo độ dốc của sóng; mép gần cột đứng yên
    for (let x = 0; x < L; x += 1) {
      const k = x / L, ph = x * 0.16 - t * 4.2, amp = (SMALL ? 2.2 : 3.4) * k;
      const dy = reduce ? Math.sin(x * 0.16) * amp : Math.sin(ph) * amp, shade = (reduce ? Math.cos(x * 0.16) : Math.cos(ph)) * 0.22 * Math.min(1, k * 3);
      ctx.drawImage(flagTex, x * 2, 0, 2, flagTex.height, px + 1 + x, top + 2 + dy, 1.4, Hh);
      if (shade > 0) { ctx.fillStyle = `rgba(255,255,255,${(shade * 0.5).toFixed(3)})`; ctx.fillRect(px + 1 + x, top + 2 + dy, 1.4, Hh); }
      else { ctx.fillStyle = `rgba(0,0,0,${(-shade).toFixed(3)})`; ctx.fillRect(px + 1 + x, top + 2 + dy, 1.4, Hh); }
    }
  };

  // ---------- đèn lồng Tết ----------
  const lantern = (x, y, s, ang, glow) => {
    ctx.save(); ctx.translate(x, 0); ctx.rotate(ang);
    ctx.strokeStyle = "rgba(255,213,74,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, y - s * 1.3); ctx.stroke();
    ctx.translate(0, y);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3.2); g.addColorStop(0, `rgba(255,80,60,${0.35 * glow})`); g.addColorStop(1, "rgba(255,80,60,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 3.2, 0, TAU); ctx.fill();
    const b = ctx.createLinearGradient(-s, 0, s, 0); b.addColorStop(0, "#9E0F1A"); b.addColorStop(0.45, "#F2363A"); b.addColorStop(1, "#8E0C17");
    ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 1.2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,213,74,.55)"; ctx.lineWidth = 0.8;
    for (const k of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(k) * s || 0.5, s * 1.18, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = "#FFD54A"; ctx.fillRect(-s * 0.45, -s * 1.35, s * 0.9, s * 0.25); ctx.fillRect(-s * 0.45, s * 1.12, s * 0.9, s * 0.25);
    ctx.strokeStyle = "#FF3B30"; ctx.lineWidth = 1.2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.12, s * 1.37); ctx.lineTo(i * s * 0.14, s * 2.1); ctx.stroke(); }
    ctx.restore();
  };
  // ---------- đèn ông sao Trung thu ----------
  const starLantern = (x, y, s, ang, glow) => {
    ctx.save(); ctx.translate(x, 0); ctx.rotate(ang);
    ctx.strokeStyle = "rgba(255,213,74,.7)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, y - s); ctx.stroke();
    ctx.translate(0, y); ctx.rotate(Math.sin(ang * 8) * 0.2);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 3); g.addColorStop(0, `rgba(255,190,80,${0.4 * glow})`); g.addColorStop(1, "rgba(255,190,80,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 3, 0, TAU); ctx.fill();
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * 0.42 : s; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath();
    ctx.fillStyle = "rgba(230,40,50,.88)"; ctx.fill(); ctx.strokeStyle = "#FFD54A"; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = `rgba(255,236,150,${0.55 * glow})`; ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#FFD54A"; ctx.lineWidth = 1; for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * s * 0.55, s * 0.72); ctx.lineTo(k * s * 0.6, s * 1.4); ctx.stroke(); }
    ctx.restore();
  };
  // ---------- hoa mai / hoa đào ----------
  const flower = (x, y, s, rot, flip, col, core) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip, 1);
    ctx.fillStyle = col; for (let i = 0; i < 5; i++) { ctx.rotate(TAU / 5); ctx.beginPath(); ctx.ellipse(0, -s * 0.55, s * 0.36, s * 0.55, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, s * 0.22, 0, TAU); ctx.fill();
    ctx.restore();
  };

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; SMALL = W < 700;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (FEST === "national" || FEST === "reunify") FL = buildFlag(SMALL ? 48 : 78);
    const n = { tet: SMALL ? 12 : 24, xmas: SMALL ? 36 : 70 }[FEST] || 0;
    items = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, v: (FEST === "xmas" ? 18 : 26) + Math.random() * 30, sw: 0.6 + Math.random() * 1.4, ph: Math.random() * TAU,
      s: FEST === "xmas" ? 1 + Math.random() * 2 : 6 + Math.random() * 5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 1.6, mai: Math.random() < 0.6 }));
    // đèn treo: hai chiếc bên trái, một chiếc bên phải (dưới nút Open Storage)
    hangs = FEST === "tet" || FEST === "midautumn" ? (SMALL ? [[22, 70, 12, 0], [W - 26, 150, 11, 3.1]] : [[44, 104, 19, 0], [104, 150, 15, 1.7], [W - 52, 150, 17, 3.1]]) : [];
  };

  let raf = 0, last = 0, t0 = 0, on = true;
  const frame = (now) => {
    if (!t0) t0 = now; const dt = last ? Math.min(now - last, 50) / 1000 : 0.016; last = now; const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    if (FEST === "national" || FEST === "reunify") drawFlag(t);
    for (const [x, y, s, ph] of hangs) { const ang = reduce ? 0 : Math.sin(t * 1.2 + ph) * 0.07, glow = 0.75 + 0.25 * Math.sin(t * 2 + ph); (FEST === "tet" ? lantern : starLantern)(x, y, s, ang, glow); }
    if (!reduce) for (const p of items) {
      p.y += p.v * dt; p.x += Math.sin(t * p.sw + p.ph) * 18 * dt; p.rot += p.vr * dt;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      if (FEST === "xmas") { ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 3, 0, TAU); ctx.fill(); }
      else flower(p.x, p.y, p.s, p.rot, Math.cos(t * p.sw * 1.7 + p.ph), p.mai ? "rgba(255,206,46,.92)" : "rgba(255,170,200,.9)", p.mai ? "#E8892A" : "#D9487A");
    }
    if (!reduce && on) raf = requestAnimationFrame(frame);
  };
  const begin = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); };
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); begin(); }, 150); }, { passive: true });
  document.addEventListener("visibilitychange", () => { on = !document.hidden; if (on) begin(); else cancelAnimationFrame(raf); });
  build(); begin();
})();
