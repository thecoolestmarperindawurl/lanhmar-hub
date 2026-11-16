/* Bầu trời Galaxy (trang chủ, Cộng đồng) — chuyển động theo mô hình vũ trụ thật, chỉ tua nhanh để mắt thấy được:
   1. Nhật động: cả bầu trời quay quanh một thiên cực (như Trái Đất tự quay), mọi sao cùng tốc độ góc → vệt cung tròn đồng tâm.
   2. Thiên hà xoắn ốc nằm ở thiên cực: sao trong đĩa quay VI SAI theo đường cong quay phẳng (v ≈ hằng số, ω = v/r → trong nhanh, ngoài chậm);
      hai nhánh xoắn là SÓNG MẬT ĐỘ quay đều với tốc độ mẫu Ωp, nên nhánh không bị cuộn chặt dù sao vẫn quay vi sai.
   3. Sao lấp lánh (nhấp nháy khí quyển): sao nhỏ và sao gần "chân trời" (cuối màn hình) nhấp nháy mạnh hơn; màu sao theo nhiệt độ (lớp phổ O→M).
   4. Mưa sao băng: mọi vệt đều toả ra từ một điểm radiant; vệt càng xa radiant càng dài (phối cảnh); thỉnh thoảng có cầu lửa.
   5. Thị sai khi cuộn: sao gần trôi nhanh hơn sao xa.
   Canvas cố định phía sau nội dung, không bắt chuột; dừng khi tab ẩn; chọn giảm chuyển động thì chỉ vẽ một khung tĩnh. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.id = "gxSky"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const TAU = Math.PI * 2;

  // Tua nhanh: bầu trời quay 1 vòng / 40 phút (thật: 1 vòng / ~23 giờ 56 phút).
  const SKY_W = TAU / (40 * 60);
  // Màu sao theo lớp phổ và tỉ lệ xuất hiện (ước lượng cho sao nhìn thấy bằng mắt thường).
  const SPECTRA = [["155,176,255", 0.08], ["202,215,255", 0.22], ["248,247,255", 0.25], ["255,244,234", 0.2], ["255,210,161", 0.17], ["255,190,150", 0.08]];
  const pickColor = () => { let u = Math.random(); for (const [c, p] of SPECTRA) { if ((u -= p) <= 0) return c; } return SPECTRA[2][0]; };

  let SMALL = false, W = 0, H = 0, dpr = 1, PX = 0, PY = 0, R = 0;
  let stars = [], gal = [], meteors = [], nextMeteor = 0, raf = 0, last = 0, t0 = 0;
  let RADX = 0, RADY = 0; // radiant của mưa sao băng

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); gLast = -1;
    const small = SMALL = W < 700;
    // thiên cực = tâm thiên hà, đặt ở góc dưới bên phải để không đè lên chữ
    PX = W * (small ? 0.78 : 0.82); PY = H * (small ? 0.84 : 0.74);
    R = Math.min(W, H) * (small ? 0.42 : 0.56);
    RADX = W * 0.12; RADY = -H * 0.12;

    // Sao phân bố đều theo diện tích trên đĩa bao trọn màn hình quanh thiên cực, để khi trời quay luôn có sao đi vào khung.
    const rMax = Math.hypot(Math.max(PX, W - PX), Math.max(PY, H - PY)) + 30;
    const density = 1 / 4600;
    const n = Math.min(2600, Math.round(Math.PI * rMax * rMax * density));
    stars = Array.from({ length: n }, () => {
      const depth = Math.random() ** 1.6; // phần lớn là sao xa, mờ
      return {
        r: Math.sqrt(Math.random()) * rMax, a: Math.random() * TAU,
        depth, size: 0.3 + depth * 1.55, c: pickColor(),
        base: 0.28 + depth * 0.6 + Math.random() * 0.12,
        f1: 1.3 + Math.random() * 3.2, f2: 4 + Math.random() * 7, ph: Math.random() * TAU,
      };
    });

    // Thiên hà: phân bố đĩa hàm mũ (sáng tập trung ở lõi), lõi phình (bulge) màu vàng ấm, đĩa ngoài xanh trắng, vài vùng HII hồng cam.
    const ng = small ? 2200 : 5000;
    gal = Array.from({ length: ng }, () => {
      const bulge = Math.random() < 0.14;
      const r = bulge ? Math.abs(gauss()) * R * 0.09 : Math.min(R, -Math.log(1 - Math.random() * 0.95) * R * 0.3 + R * 0.04);
      const hii = !bulge && Math.random() < 0.06;
      return {
        r, a: Math.random() * TAU, bulge, hii,
        z: gauss() * (bulge ? R * 0.05 : R * 0.012), // độ dày đĩa
        s: bulge ? 0.7 + Math.random() * 0.9 : hii ? 1.3 + Math.random() * 1 : 0.6 + Math.random() * 0.9,
        c: bulge ? "255,232,200" : hii ? "255,150,170" : r < R * 0.35 ? "255,240,225" : Math.random() < 0.5 ? "200,212,255" : "178,164,239",
        b: 0.25 + Math.random() * 0.6,
      };
    });
  };
  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

  // ---------- thiên hà ----------
  const INCL = 0.5;           // cos(độ nghiêng) → elip dẹt
  const PITCH = Math.tan(0.3);  // góc xoắn ~17° (thiên hà loại Sb/Sc)
  const V = 0.05;             // vận tốc quay (đơn vị R/giây sau khi tua nhanh) — đường cong quay phẳng
  const OMEGA_P = 0.035;      // tốc độ mẫu của sóng mật độ (rad/giây)
  // Thiên hà quay chậm nên vẽ vào canvas phụ ~15 lần/giây rồi dán lên khung chính (đỡ tốn CPU khi có hàng nghìn sao).
  const gcv = document.createElement("canvas"), gx = gcv.getContext("2d");
  let gSize = 0, gLast = -1;
  const renderGalaxy = (t, skyA) => {
    gSize = Math.ceil(R * 2.2);
    if (gcv.width !== Math.round(gSize * dpr)) { gcv.width = gcv.height = Math.round(gSize * dpr); }
    gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, gSize, gSize);
    const ctx = gx;
    const cx = gSize / 2, cy = gSize / 2, rc = R * 0.08;
    const tilt = -0.48 + skyA; // thiên hà quay theo nhật động như mọi vật trên trời
    const ct = Math.cos(tilt), st = Math.sin(tilt);
    // quầng sáng lõi
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5);
    g.addColorStop(0, "rgba(255,236,214,.7)"); g.addColorStop(0.08, "rgba(255,200,170,.3)");
    g.addColorStop(0.45, "rgba(106,92,255,.07)"); g.addColorStop(1, "rgba(106,92,255,0)");
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.scale(1, INCL + 0.18); ctx.translate(-cx, -cy);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, TAU); ctx.fill(); ctx.restore();

    ctx.globalCompositeOperation = "lighter";
    for (const p of gal) {
      // quay vi sai: v(r) tăng nhanh rồi phẳng → ω = v/r
      const v = V * R * (1 - Math.exp(-p.r / rc));
      const th = p.a + (p.r > 1 ? (v / p.r) * t : 0);
      let alpha = p.b;
      if (!p.bulge) {
        // vị trí so với nhánh xoắn logarit của sóng mật độ (2 nhánh)
        const arm = th - OMEGA_P * t - Math.log(Math.max(p.r, rc) / rc) / PITCH;
        const d = (1 + Math.cos(2 * arm)) / 2;
        alpha *= p.hii ? Math.pow(d, 6) * 1.5 : 0.05 + 0.95 * Math.pow(d, 4);
        alpha *= 1 - Math.pow(p.r / R, 3) * 0.7; // rìa đĩa mờ dần
      }
      if (alpha < 0.03) continue;
      const x = Math.cos(th) * p.r, y = Math.sin(th) * p.r * INCL + p.z;
      const sx = cx + x * ct - y * st, sy = cy + x * st + y * ct;
      ctx.fillStyle = `rgba(${p.c},${Math.min(1, alpha).toFixed(3)})`;
      ctx.fillRect(sx - p.s / 2, sy - p.s / 2, p.s, p.s);
      if (alpha > 0.55 && !p.bulge) { // vùng nhánh sáng: thêm quầng mờ để nhánh liền mạch như ảnh chụp phơi sáng
        ctx.fillStyle = `rgba(${p.c},${(alpha * 0.07).toFixed(3)})`;
        ctx.fillRect(sx - p.s * 3, sy - p.s * 3, p.s * 6, p.s * 6);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  };
  const drawGalaxy = (now, t, skyA, shiftY) => {
    if (gLast < 0 || now - gLast > 66 || reduce) { renderGalaxy(t, skyA); gLast = now; }
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = SMALL ? 0.45 : 1; // màn hình nhỏ: nội dung đè lên thiên hà nên làm mờ bớt
    ctx.drawImage(gcv, PX - gSize / 2, PY + shiftY - gSize / 2, gSize, gSize);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  // ---------- sao băng ----------
  const spawnMeteor = (t) => {
    const fire = Math.random() < 0.1;
    // điểm xuất hiện ngẫu nhiên ở nửa trên, hướng bay = hướng ra xa radiant
    const x = W * (0.05 + Math.random() * 0.9), y = H * (0.04 + Math.random() * 0.55);
    let dx = x - RADX, dy = y - RADY; const dist = Math.hypot(dx, dy); dx /= dist; dy /= dist;
    const persp = Math.min(1.6, 0.45 + dist / Math.max(W, H)); // xa radiant → vệt dài hơn
    meteors.push({ x, y, dx, dy, life: 0, dur: (fire ? 1100 : 450 + Math.random() * 450), sp: (fire ? 0.5 : 0.7 + Math.random() * 0.6) * persp, len: (fire ? 220 : 90 + Math.random() * 90) * persp, fire });
    nextMeteor = t + 2500 + Math.random() * 6000;
  };
  const drawMeteors = (dt) => {
    meteors = meteors.filter((m) => {
      m.life += dt; const p = m.life / m.dur; if (p >= 1) return false;
      const d = m.life * m.sp, hx = m.x + m.dx * d, hy = m.y + m.dy * d;
      const L = m.len * Math.min(1, p * 3); // vệt dài dần khi thiên thạch cháy
      const fade = p < 0.15 ? p / 0.15 : Math.pow(1 - (p - 0.15) / 0.85, 1.4);
      const gr = ctx.createLinearGradient(hx, hy, hx - m.dx * L, hy - m.dy * L);
      gr.addColorStop(0, `rgba(255,248,240,${(0.95 * fade).toFixed(3)})`);
      gr.addColorStop(0.25, m.fire ? `rgba(255,150,90,${(0.7 * fade).toFixed(3)})` : `rgba(210,220,255,${(0.45 * fade).toFixed(3)})`);
      gr.addColorStop(1, "rgba(106,92,255,0)");
      ctx.strokeStyle = gr; ctx.lineWidth = m.fire ? 3 : 1.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - m.dx * L, hy - m.dy * L); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(hx, hy, m.fire ? 2.6 : 1.4, 0, TAU); ctx.fill();
      if (m.fire) { ctx.fillStyle = `rgba(255,170,110,${(0.25 * fade).toFixed(3)})`; ctx.beginPath(); ctx.arc(hx, hy, 9, 0, TAU); ctx.fill(); }
      return true;
    });
  };

  // ---------- vòng vẽ ----------
  const frame = (now) => {
    if (!t0) t0 = now;
    const dt = last ? Math.min(now - last, 50) : 16; last = now;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    const skyA = reduce ? 0 : t * SKY_W;
    const sy = scrollY;
    const span = H + 40;

    drawGalaxy(now, reduce ? 0 : t, skyA, -Math.min(sy * 0.02, 120));

    for (const s of stars) {
      const a = s.a + skyA;
      const x = PX + Math.cos(a) * s.r; if (x < -10 || x > W + 10) continue;
      const ry = PY + Math.sin(a) * s.r; if (ry < -20 || ry > H + 20) continue;
      // thị sai: dịch theo độ sâu rồi gói lại trong khung (sao vẫn giữ mật độ)
      let y = ry - sy * (0.015 + s.depth * 0.09) + 20; y = ((y % span) + span) % span - 20;
      // nhấp nháy: mạnh hơn với sao nhỏ và sao gần chân trời
      const amp = reduce ? 0 : (0.12 + (1 - s.depth) * 0.25) * (0.6 + 0.8 * (y / H));
      const tw = 1 - amp * (0.5 + 0.5 * Math.sin(t * s.f1 + s.ph)) * (0.7 + 0.3 * Math.sin(t * s.f2 + s.ph * 2));
      const al = Math.max(0, s.base * tw);
      ctx.fillStyle = `rgba(${s.c},${al.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, s.size, 0, TAU); ctx.fill();
      if (s.size > 1.5) { // sao sáng: quầng mềm (nhoè khí quyển), không viền cứng
        const hg = ctx.createRadialGradient(x, y, 0, x, y, s.size * 4);
        hg.addColorStop(0, `rgba(${s.c},${(al * 0.35).toFixed(3)})`); hg.addColorStop(1, `rgba(${s.c},0)`);
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y, s.size * 4, 0, TAU); ctx.fill();
      }
    }

    if (reduce) return;
    if (now > nextMeteor) spawnMeteor(now);
    drawMeteors(dt);
    raf = requestAnimationFrame(frame);
  };

  let hiddenAt = 0;
  const start = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); };
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); start(); }, 150); }, { passive: true });
  if (reduce) addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); hiddenAt = performance.now(); }
    else { t0 += performance.now() - hiddenAt; start(); } // không "nhảy cóc" khi quay lại tab
  });
  build(); nextMeteor = performance.now() + 1200; start();
})();
