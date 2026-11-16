/* Trời sao cho giao diện Galaxy (trang chủ, Cộng đồng): sao lấp lánh nhiều lớp, trôi nhẹ theo cuộn (parallax), sao băng thỉnh thoảng bay qua.
   Một canvas cố định phía sau nội dung, không bắt chuột. Tạm dừng khi tab ẩn; chọn giảm chuyển động thì chỉ vẽ trời sao tĩnh. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.id = "gxSky"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  // màu sao: trắng, lavender, cam nhạt (brand)
  const COLORS = ["255,255,255", "255,255,255", "231,226,251", "178,164,239", "255,216,194", "255,167,127"];
  let W = 0, H = 0, dpr = 1, stars = [], shoots = [], nextShoot = 0, raf = 0, last = 0;

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(420, Math.round((W * H) / 4200));
    stars = Array.from({ length: n }, () => {
      const depth = Math.random(); // 0 = xa, 1 = gần
      return {
        x: Math.random() * W, y: Math.random() * H,
        r: 0.35 + depth * depth * 1.5,
        depth,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        base: 0.35 + Math.random() * 0.55,
        sp: 0.6 + Math.random() * 2.2,
        ph: Math.random() * Math.PI * 2,
      };
    });
  };

  const spawnShoot = (t) => {
    const fromLeft = Math.random() < 0.5;
    const ang = (fromLeft ? 1 : -1) * (Math.PI / 7 + Math.random() * Math.PI / 9);
    shoots.push({
      x: fromLeft ? Math.random() * W * 0.6 : W * 0.4 + Math.random() * W * 0.6,
      y: Math.random() * H * 0.45,
      ang, life: 0, dur: 900 + Math.random() * 600, len: 120 + Math.random() * 120, sp: 0.7 + Math.random() * 0.5,
      left: fromLeft,
    });
    nextShoot = t + 3500 + Math.random() * 5500;
  };

  const draw = (t) => {
    const dt = last ? Math.min(t - last, 50) : 16; last = t;
    ctx.clearRect(0, 0, W, H);
    const sy = scrollY;
    for (const s of stars) {
      // parallax: sao gần trôi nhanh hơn khi cuộn
      let y = (s.y - sy * (0.02 + s.depth * 0.12)) % H; if (y < 0) y += H;
      const a = reduce ? s.base : s.base * (0.55 + 0.45 * Math.sin(t / 1000 * s.sp + s.ph));
      ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`; ctx.fill();
      if (s.r > 1.25) { // sao sáng: quầng và tia chữ thập
        ctx.fillStyle = `rgba(${s.c},${(a * 0.18).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(s.x, y, s.r * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${s.c},${(a * 0.45).toFixed(3)})`; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(s.x - s.r * 4, y); ctx.lineTo(s.x + s.r * 4, y); ctx.moveTo(s.x, y - s.r * 4); ctx.lineTo(s.x, y + s.r * 4); ctx.stroke();
      }
    }
    if (reduce) return;
    if (t > nextShoot) spawnShoot(t);
    shoots = shoots.filter((m) => {
      m.life += dt;
      const p = m.life / m.dur; if (p >= 1) return false;
      const dist = m.life * m.sp, dx = Math.cos(Math.abs(m.ang)) * (m.left ? 1 : -1), dy = Math.sin(Math.abs(m.ang));
      const hx = m.x + dx * dist, hy = m.y + dy * dist;
      const fade = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
      const g = ctx.createLinearGradient(hx, hy, hx - dx * m.len, hy - dy * m.len);
      g.addColorStop(0, `rgba(255,236,224,${(0.95 * fade).toFixed(3)})`);
      g.addColorStop(0.3, `rgba(255,167,127,${(0.5 * fade).toFixed(3)})`);
      g.addColorStop(1, "rgba(106,92,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - dx * m.len, hy - dy * m.len); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(hx, hy, 1.6, 0, Math.PI * 2); ctx.fill();
      return true;
    });
    raf = requestAnimationFrame(draw);
  };

  const start = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(draw); };
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); start(); }, 150); }, { passive: true });
  if (reduce) addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }, { passive: true });
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else start(); });
  build(); nextShoot = performance.now() + 1500; start();
})();
