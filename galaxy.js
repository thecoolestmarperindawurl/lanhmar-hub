/* Bầu trời Galaxy (trang chủ, Cộng đồng) — "Bầu trời hôm nay": nền là bầu trời THẬT nhìn từ Sài Gòn trong ngày người xem ghé thăm.
   - Thời điểm: nếu ở Sài Gòn đang là đêm thì lấy đúng lúc này; ban ngày thì lấy 21:00 tối nay (giờ Sài Gòn).
   - Sao: 2.309 sao thật sáng hơn cấp 5,3 (sky-data.js), đúng vị trí theo giờ sao địa phương, kích thước theo cấp sao, màu theo chỉ số B-V;
     nhấp nháy mạnh hơn và mờ hơn khi gần chân trời (khí quyển dày hơn). Đường nối chòm sao rất mờ.
   - Mặt Trăng đúng vị trí và đúng pha (phía sáng quay về phía Mặt Trời); 5 hành tinh mắt thường (Thuỷ, Kim, Hoả, Mộc, Thổ) đúng vị trí,
     sáng đều không nhấp nháy (hành tinh là đĩa nhỏ nên không lấp lánh như sao); dải Ngân Hà theo mặt phẳng thiên hà thật.
   - Thiên hà xoắn ốc (vẽ cách điệu, phóng to) đặt ở vị trí thật của thiên hà Andromeda M31, chỉ hiện khi M31 ở trên chân trời;
     quay vi sai + nhánh là sóng mật độ (tua nhanh).
   - Cả bầu trời quay quanh thiên cực đúng như thật nhưng tua nhanh ×20 (1 phút xem = 20 phút trên trời); mép màn hình có quầng sáng đô thị.
   - Ngày 27/02 (sinh nhật Lan Anh, theo assets/content.json → dob) bầu trời có cực quang. Xem trước: thêm ?sky=aurora vào địa chỉ;
     xem bầu trời một ngày bất kỳ: ?sky=YYYY-MM-DD (21:00 giờ Sài Gòn).
   - Sao băng toả ra từ một radiant. Nhãn nhỏ góc trái dưới cho biết đang xem bầu trời lúc nào, pha Trăng, hành tinh nào đang mọc.
   Hình chiếu: nhìn thẳng lên thiên đỉnh (chiếu nổi), Bắc ở trên, Đông bên trái. Canvas cố định sau nội dung, không bắt chuột;
   dừng khi tab ẩn; chọn giảm chuyển động thì vẽ khung tĩnh (vẫn đúng bầu trời, có cực quang tĩnh vào ngày sinh nhật). */
(() => {
  "use strict";
  const A = window.SkyAstro, DATA = window.SKY_DATA;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.id = "gxSky"; cv.setAttribute("aria-hidden", "true");
  document.body.prepend(cv);
  const ctx = cv.getContext("2d");
  if (!ctx || !A || !DATA) return;
  const TAU = Math.PI * 2, D2R = Math.PI / 180;
  const LAT = 10.7769, LON = 106.7009;     // Sài Gòn
  const BIRTHDAY = "02-27";                // ngày sinh trong assets/content.json (dob 27/02/2004)
  const SPEED = 20;                        // tua nhanh nhật động ×20
  const M31 = { ra: 10.6847, dec: 41.2687 };

  // ---------- chọn thời điểm ----------
  const saigonParts = (d) => { const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value])); return p; };
  const at21 = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 21 - 7, 0)); // 21:00 giờ Sài Gòn (UTC+7)
  const q = new URLSearchParams(location.search).get("sky") || "";
  let start, mode; // mode: "now" | "tonight" | "date"
  const qd = q.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (qd) { start = at21(+qd[1], +qd[2], +qd[3]); mode = "date"; }
  else {
    const now = new Date(), s = A.sun(now), sunAlt = A.horizontal(s.ra, s.dec, A.lst(now, LON), LAT).alt;
    if (sunAlt < -12) { start = now; mode = "now"; }
    else { const p = saigonParts(now); start = at21(+p.year, +p.month, +p.day); if (+p.hour < 6) start = new Date(start.getTime() - 86400000); mode = "tonight"; }
  }
  const sp = saigonParts(start);
  const AURORA = q === "aurora" || `${sp.month}-${sp.day}` === BIRTHDAY;

  // ---------- dữ liệu dựng sẵn ----------
  const bvRGB = (bv) => { // chỉ số màu B-V → màu hiển thị gần đúng
    const T = [[-0.3, [155, 176, 255]], [0, [202, 215, 255]], [0.3, [248, 247, 255]], [0.6, [255, 244, 234]], [1.0, [255, 210, 161]], [1.5, [255, 180, 120]], [2.0, [255, 160, 100]]];
    let i = 0; while (i < T.length - 2 && bv > T[i + 1][0]) i++;
    const [b0, c0] = T[i], [b1, c1] = T[i + 1], f = Math.max(0, Math.min(1, (bv - b0) / (b1 - b0)));
    return c0.map((v, j) => Math.round(v + (c1[j] - v) * f)).join(",");
  };
  const STARS = DATA.stars.map(([ra, dec, mag, bv]) => ({ ra, dec, mag, c: bvRGB(bv), r: Math.max(0.45, 2.5 - 0.42 * mag), base: Math.min(1, Math.max(0.28, 1.05 - mag * 0.13)), f1: 1.3 + Math.random() * 3.2, f2: 4 + Math.random() * 7, ph: Math.random() * TAU, x: 0, y: 0, alt: -1 }));
  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  // dải Ngân Hà: hạt phân bố theo toạ độ thiên hà (dày và rộng hơn về phía tâm thiên hà ở chòm Nhân Mã)
  const MW = Array.from({ length: 2600 }, () => {
    let l = Math.random() * 360; if (Math.random() < 0.45) l = (gauss() * 40 + 360) % 360;
    const near = Math.cos(((l + 180) % 360 - 180) * D2R) * 0.5 + 0.5, b = gauss() * (3 + 6 * near);
    const eq = A.galToEq(l, b);
    return { ...eq, s: 0.8 + Math.random() * 1.6, a: (0.05 + 0.1 * near) * (0.5 + Math.random()), c: Math.random() < 0.7 ? "200,205,255" : "255,220,200", x: 0, y: 0, alt: -1 };
  });
  const LINES = DATA.lines.map((con) => con.map((seg) => seg.map(([ra, dec]) => ({ ra, dec, x: 0, y: 0, alt: -1 }))));

  // ---------- hình chiếu: nhìn lên thiên đỉnh ----------
  let W = 0, H = 0, dpr = 1, CX = 0, CY = 0, RH = 0, SMALL = false;
  const proj = (o, lstDeg) => { const h = A.horizontal(o.ra, o.dec, lstDeg, LAT); o.alt = h.alt; if (h.alt < -2) return o;
    const r = RH * Math.tan((90 - h.alt) * D2R / 2) / Math.tan(Math.PI / 4), a = h.az * D2R; // chân trời: r = RH
    o.x = CX - Math.sin(a) * r; o.y = CY - Math.cos(a) * r; return o; };            // Bắc ở trên, Đông bên trái (nhìn lên trời)

  let sky = { lst: 0, date: start, moon: null, planets: [], m31: null, sunXY: null }, lastProj = -1e9;
  const PLC = { mercury: ["220,210,200", 1.6], venus: ["255,250,235", 3.2], mars: ["255,140,95", 2.1], jupiter: ["255,236,205", 2.7], saturn: ["240,222,165", 2.0] };
  const reproject = (date) => {
    const l = A.lst(date, LON);
    for (const s of STARS) proj(s, l);
    for (const m of MW) proj(m, l);
    for (const con of LINES) for (const seg of con) for (const p of seg) proj(p, l);
    const mo = A.moon(date), su = A.sun(date);
    sky = { lst: l, date, moon: proj({ ...mo }, l), sun: proj({ ...su }, l), planets: A.PLANETS.map((n) => ({ n, ...proj({ ...A.planet(n, date) }, l) })), m31: proj({ ...M31 }, l) };
    // hướng Bắc tại M31 (để xoay thiên hà đúng góc vị trí ~38°)
    const n2 = proj({ ra: M31.ra, dec: M31.dec + 2 }, l);
    sky.m31.pa = Math.atan2(n2.y - sky.m31.y, n2.x - sky.m31.x) + 38 * D2R;
    // hướng tới Mặt Trời (Mặt Trời dưới chân trời vẫn chiếu được ra ngoài vòng chân trời)
    const h = A.horizontal(su.ra, su.dec, l, LAT), r = RH * Math.tan((90 - h.alt) * D2R / 2), a = h.az * D2R;
    sky.sunXY = [CX - Math.sin(a) * r, CY - Math.cos(a) * r];
  };

  // ---------- thiên hà Andromeda (cách điệu) ----------
  let GR = 0, gal = [];
  const INCL = 0.42, PITCH = Math.tan(0.3), V = 0.05, OMEGA_P = 0.035;
  const gcv = document.createElement("canvas"), gx = gcv.getContext("2d");
  let gSize = 0, gLast = -1;
  const buildGalaxy = () => {
    GR = Math.min(W, H) * (SMALL ? 0.2 : 0.24);
    gal = Array.from({ length: SMALL ? 1500 : 3200 }, () => {
      const bulge = Math.random() < 0.14, r = bulge ? Math.abs(gauss()) * GR * 0.09 : Math.min(GR, -Math.log(1 - Math.random() * 0.95) * GR * 0.3 + GR * 0.04), hii = !bulge && Math.random() < 0.06;
      return { r, a: Math.random() * TAU, bulge, hii, z: gauss() * (bulge ? GR * 0.05 : GR * 0.012), s: bulge ? 0.6 + Math.random() * 0.8 : hii ? 1.1 + Math.random() * 0.8 : 0.5 + Math.random() * 0.8,
        c: bulge ? "255,232,200" : hii ? "255,150,170" : r < GR * 0.35 ? "255,240,225" : Math.random() < 0.5 ? "200,212,255" : "178,164,239", b: 0.25 + Math.random() * 0.6 };
    });
    gLast = -1;
  };
  const renderGalaxy = (t, tilt) => {
    gSize = Math.ceil(GR * 2.2);
    if (gcv.width !== Math.round(gSize * dpr)) gcv.width = gcv.height = Math.round(gSize * dpr);
    gx.setTransform(dpr, 0, 0, dpr, 0, 0); gx.clearRect(0, 0, gSize, gSize);
    const c = gSize / 2, rc = GR * 0.08, ct = Math.cos(tilt), st = Math.sin(tilt);
    const g = gx.createRadialGradient(c, c, 0, c, c, GR * 0.5);
    g.addColorStop(0, "rgba(255,236,214,.7)"); g.addColorStop(0.08, "rgba(255,200,170,.3)"); g.addColorStop(0.45, "rgba(106,92,255,.07)"); g.addColorStop(1, "rgba(106,92,255,0)");
    gx.save(); gx.translate(c, c); gx.rotate(tilt); gx.scale(1, INCL + 0.18); gx.translate(-c, -c); gx.fillStyle = g; gx.beginPath(); gx.arc(c, c, GR * 0.5, 0, TAU); gx.fill(); gx.restore();
    gx.globalCompositeOperation = "lighter";
    for (const p of gal) {
      const v = V * GR * (1 - Math.exp(-p.r / rc)), th = p.a + (p.r > 1 ? (v / p.r) * t : 0);
      let al = p.b;
      if (!p.bulge) { const arm = th - OMEGA_P * t - Math.log(Math.max(p.r, rc) / rc) / PITCH, d = (1 + Math.cos(2 * arm)) / 2; al *= p.hii ? Math.pow(d, 6) * 1.5 : 0.05 + 0.95 * Math.pow(d, 4); al *= 1 - Math.pow(p.r / GR, 3) * 0.7; }
      if (al < 0.03) continue;
      const x = Math.cos(th) * p.r, y = Math.sin(th) * p.r * INCL + p.z;
      gx.fillStyle = `rgba(${p.c},${Math.min(1, al).toFixed(3)})`; gx.fillRect(c + x * ct - y * st - p.s / 2, c + x * st + y * ct - p.s / 2, p.s, p.s);
    }
    gx.globalCompositeOperation = "source-over";
  };

  // ---------- cực quang (ngày sinh nhật) ----------
  const strip = document.createElement("canvas"); strip.width = 2; strip.height = 256;
  { const g = strip.getContext("2d"), gr = g.createLinearGradient(0, 256, 0, 0);
    gr.addColorStop(0, "rgba(90,255,180,0)"); gr.addColorStop(0.08, "rgba(110,255,190,.95)"); gr.addColorStop(0.25, "rgba(70,230,200,.75)");
    gr.addColorStop(0.5, "rgba(143,132,255,.5)"); gr.addColorStop(0.78, "rgba(255,120,200,.28)"); gr.addColorStop(1, "rgba(255,120,200,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256); }
  const CURTAINS = [{ y: 0.34, h: 0.32, f: 0.0031, s: 0.22, ph: 0, a: 0.75 }, { y: 0.44, h: 0.26, f: 0.0043, s: -0.17, ph: 2.1, a: 0.55 }, { y: 0.26, h: 0.22, f: 0.0026, s: 0.12, ph: 4.2, a: 0.42 }];
  // vẽ ở 1/3 độ phân giải vào canvas phụ ~15 lần/giây rồi phóng lên: rèm mềm, đỡ tốn máy
  const acv = document.createElement("canvas"), ax = acv.getContext("2d"), bcv = document.createElement("canvas"), bx = bcv.getContext("2d"); let aLast = -1;
  const renderAurora = (t) => {
    const w = Math.ceil(W / 3), h = Math.ceil(H / 3); if (acv.width !== w || acv.height !== h) { acv.width = w; acv.height = h; }
    ax.clearRect(0, 0, w, h); ax.globalCompositeOperation = "lighter";
    const glow = ax.createLinearGradient(0, 0, 0, h * 0.7); glow.addColorStop(0, "rgba(80,255,190,.07)"); glow.addColorStop(1, "rgba(80,255,190,0)"); ax.fillStyle = glow; ax.fillRect(0, 0, w, h * 0.7);
    for (const c of CURTAINS) {
      for (let x = -8; x < w + 8; x += 1) {
        const X = x * 3, u = X + Math.sin(X * c.f * 1.3 + t * c.s + c.ph) * 60;                        // nếp gấp của rèm
        const base = h * c.y + (Math.sin(u * c.f + t * 0.25 + c.ph) * 0.07 + Math.sin(u * c.f * 2.7 - t * 0.4) * 0.025) * h;
        const hh = h * c.h * (0.7 + 0.3 * Math.sin(u * c.f * 1.9 + t * 0.3 + c.ph));
        const fold = 0.5 + 0.5 * Math.sin(u * c.f * 3 + t * c.s * 2 + c.ph);
        const ray = 0.7 + 0.3 * Math.sin(X * 0.071 + t * 0.9 + c.ph) * Math.sin(X * 0.0293 - t * 0.55) * Math.sin(X * 0.013 + t * 0.21);  // tia dọc không đều, trôi ngang
        const al = c.a * fold * fold * ray * (0.6 + 0.4 * Math.sin(t * 0.5 + X * 0.002 + c.ph));
        if (al < 0.002) continue;
        ax.globalAlpha = Math.min(1, al); ax.drawImage(strip, x, base - hh, 1.5, hh);
      }
    }
    ax.globalAlpha = 1; ax.globalCompositeOperation = "source-over";
    if ("filter" in bx) { if (bcv.width !== w || bcv.height !== h) { bcv.width = w; bcv.height = h; } bx.clearRect(0, 0, w, h); bx.filter = "blur(2px)"; bx.drawImage(acv, 0, 0); bx.filter = "none"; }   // làm nhoè cho rèm mềm như thật
  };
  const drawAurora = (now, t) => {
    if (aLast < 0 || now - aLast > 66 || reduce) { renderAurora(t); aLast = now; }
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.imageSmoothingEnabled = true; ctx.drawImage("filter" in bx ? bcv : acv, 0, 0, W, H); ctx.restore();
  };

  // ---------- sao băng ----------
  let meteors = [], nextMeteor = 0, RADX = 0, RADY = 0;
  const spawnMeteor = (t) => {
    const fire = Math.random() < 0.1, x = W * (0.05 + Math.random() * 0.9), y = H * (0.04 + Math.random() * 0.55);
    let dx = x - RADX, dy = y - RADY; const dist = Math.hypot(dx, dy); dx /= dist; dy /= dist;
    const persp = Math.min(1.6, 0.45 + dist / Math.max(W, H));
    meteors.push({ x, y, dx, dy, life: 0, dur: fire ? 1100 : 450 + Math.random() * 450, sp: (fire ? 0.5 : 0.7 + Math.random() * 0.6) * persp, len: (fire ? 220 : 90 + Math.random() * 90) * persp, fire });
    nextMeteor = t + 2500 + Math.random() * 6000;
  };
  const drawMeteors = (dt) => { meteors = meteors.filter((m) => {
    m.life += dt; const p = m.life / m.dur; if (p >= 1) return false;
    const d = m.life * m.sp, hx = m.x + m.dx * d, hy = m.y + m.dy * d, L = m.len * Math.min(1, p * 3), fade = p < 0.15 ? p / 0.15 : Math.pow(1 - (p - 0.15) / 0.85, 1.4);
    const gr = ctx.createLinearGradient(hx, hy, hx - m.dx * L, hy - m.dy * L);
    gr.addColorStop(0, `rgba(255,248,240,${(0.95 * fade).toFixed(3)})`); gr.addColorStop(0.25, m.fire ? `rgba(255,150,90,${(0.7 * fade).toFixed(3)})` : `rgba(210,220,255,${(0.45 * fade).toFixed(3)})`); gr.addColorStop(1, "rgba(106,92,255,0)");
    ctx.strokeStyle = gr; ctx.lineWidth = m.fire ? 3 : 1.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - m.dx * L, hy - m.dy * L); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${fade.toFixed(3)})`; ctx.beginPath(); ctx.arc(hx, hy, m.fire ? 2.6 : 1.4, 0, TAU); ctx.fill();
    return true; }); };

  // ---------- Mặt Trăng có pha ----------
  const drawMoon = (m) => {
    if (m.alt < -1) return;
    const R = SMALL ? 9 : 12, [sx, sy] = sky.sunXY, ang = Math.atan2(sy - m.y, sx - m.x), k = m.illum;
    const g = ctx.createRadialGradient(m.x, m.y, R * 0.5, m.x, m.y, R * (4 + 4 * k)); g.addColorStop(0, `rgba(255,248,230,${(0.18 + 0.3 * k).toFixed(3)})`); g.addColorStop(1, "rgba(255,248,230,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, R * (4 + 4 * k), 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(ang);
    ctx.fillStyle = "rgba(60,58,90,.55)"; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();              // phần tối (ánh đất mờ)
    ctx.fillStyle = "#FFF6E4"; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2);                  // nửa hướng về Mặt Trời
    ctx.ellipse(0, 0, Math.abs(R * (1 - 2 * k)), R, 0, Math.PI / 2, k >= 0.5 ? Math.PI * 1.5 : -Math.PI / 2, k < 0.5); ctx.fill();
    ctx.restore();
  };

  // ---------- nhãn "Bầu trời hôm nay" ----------
  const lang = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };
  const T = (vi, en) => (lang() === "en" ? en : vi);
  const PN = { mercury: ["Sao Thuỷ", "Mercury"], venus: ["Sao Kim", "Venus"], mars: ["Sao Hoả", "Mars"], jupiter: ["Sao Mộc", "Jupiter"], saturn: ["Sao Thổ", "Saturn"] };
  const phaseName = (m) => { const k = m.illum, w = m.waxing;
    if (k < 0.03) return T("Trăng non", "New moon"); if (k > 0.97) return T("Trăng tròn", "Full moon");
    if (k < 0.45) return w ? T("Trăng lưỡi liềm đầu tháng", "Waxing crescent") : T("Trăng lưỡi liềm cuối tháng", "Waning crescent");
    if (k <= 0.55) return w ? T("Trăng thượng huyền", "First quarter") : T("Trăng hạ huyền", "Last quarter");
    return w ? T("Trăng khuyết đang tròn dần", "Waxing gibbous") : T("Trăng khuyết đang khuyết dần", "Waning gibbous"); };
  const tag = document.createElement("button"); tag.type = "button"; tag.className = "gx-skytag";
  document.body.appendChild(tag);
  let open = true;
  const renderTag = () => {
    const p = saigonParts(sky.date), when = mode === "now" ? T("lúc này", "right now") : mode === "tonight" ? T(`tối nay ${p.hour}:${p.minute}`, `tonight ${p.hour}:${p.minute}`) : `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}`;
    const up = sky.planets.filter((x) => x.alt > 0).map((x) => T(...PN[x.n]));
    const moon = sky.moon.alt > 0 ? `${phaseName(sky.moon)} ${Math.round(sky.moon.illum * 100)}%` : T("Trăng chưa mọc", "Moon below the horizon");
    const parts = [T(`Bầu trời Sài Gòn ${when}`, `Saigon sky ${when}`), moon, up.length ? up.join(", ") : ""].filter(Boolean);
    const bday = AURORA ? `<b>${T("✦ Cực quang mừng sinh nhật Lan Anh (27/02)", "✦ An aurora for Lan Anh's birthday (Feb 27)")}</b>` : "";
    tag.innerHTML = `<i aria-hidden="true">✦</i><span>${bday}${parts.join(" · ")}</span>`;
    tag.setAttribute("aria-label", (AURORA ? T("Cực quang mừng sinh nhật Lan Anh. ", "An aurora for Lan Anh's birthday. ") : "") + parts.join(", "));
    tag.setAttribute("aria-expanded", open);
    tag.classList.toggle("open", open); tag.classList.toggle("bday", AURORA);
  };
  tag.addEventListener("click", () => { open = !open; renderTag(); });
  document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(renderTag, 60); });
  setTimeout(() => { if (open) { open = false; renderTag(); } }, (AURORA ? 14000 : 9000) * (innerWidth < 700 ? 0.5 : 1));

  // ---------- dựng khung ----------
  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    SMALL = W < 700; CX = W / 2; CY = H / 2; RH = Math.hypot(W, H) * 0.55;
    RADX = W * 0.12; RADY = -H * 0.12;
    buildGalaxy(); lastProj = -1e9;
  };

  let raf = 0, last = 0, t0 = 0, hiddenAt = 0;
  const frame = (now) => {
    if (!t0) t0 = now;
    const dt = last ? Math.min(now - last, 50) : 16; last = now;
    const t = (now - t0) / 1000;
    // thời điểm trên trời: tua nhanh ×20; vị trí tính lại mỗi 0,25 giây (trời quay chậm), nhấp nháy vẽ mỗi khung
    if (now - lastProj > 250 || reduce) { reproject(new Date(start.getTime() + (reduce ? 0 : t * 1000 * SPEED))); lastProj = now; if (Math.floor(t) % 30 === 0 || !tag.innerHTML) renderTag(); }
    ctx.clearRect(0, 0, W, H);
    // quầng sáng đô thị gần chân trời
    const lp = ctx.createRadialGradient(CX, CY, RH * 0.62, CX, CY, RH); lp.addColorStop(0, "rgba(255,140,90,0)"); lp.addColorStop(1, "rgba(255,140,90,.10)"); ctx.fillStyle = lp; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (const m of MW) { if (m.alt < 0) continue; ctx.globalAlpha = m.a * Math.min(1, m.alt / 20); ctx.fillStyle = `rgb(${m.c})`; ctx.fillRect(m.x - m.s, m.y - m.s, m.s * 2, m.s * 2); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    // đường nối chòm sao (rất mờ)
    ctx.strokeStyle = "rgba(185,176,255,.07)"; ctx.lineWidth = 1; ctx.beginPath();
    for (const con of LINES) for (const seg of con) for (let i = 1; i < seg.length; i++) { const a = seg[i - 1], b = seg[i]; if (a.alt < 0 || b.alt < 0) continue; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    ctx.stroke();
    // thiên hà Andromeda
    const g = sky.m31;
    if (g && g.alt > 3) {
      if (gLast < 0 || now - gLast > 66 || reduce) { renderGalaxy(reduce ? 0 : t, g.pa); gLast = now; }
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = (SMALL ? 0.5 : 1) * Math.min(1, g.alt / 15);
      ctx.drawImage(gcv, g.x - gSize / 2, g.y - gSize / 2, gSize, gSize); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    // sao thật
    for (const s of STARS) {
      if (s.alt < 0 || s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) continue;
      const low = 1 - Math.min(1, s.alt / 45), ext = Math.min(1, 0.25 + s.alt / 12);           // gần chân trời: nhấp nháy mạnh hơn, mờ hơn
      const amp = reduce ? 0 : (0.1 + 0.3 * low) * (s.mag > 2 ? 1 : 0.7);
      const tw = 1 - amp * (0.5 + 0.5 * Math.sin(t * s.f1 + s.ph)) * (0.7 + 0.3 * Math.sin(t * s.f2 + s.ph * 2));
      const al = s.base * tw * ext;
      if (s.r > 1.5) { const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4); hg.addColorStop(0, `rgba(${s.c},${(al * 0.35).toFixed(3)})`); hg.addColorStop(1, `rgba(${s.c},0)`); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = `rgba(${s.c},${al.toFixed(3)})`;
      if (s.r < 0.9) ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2); else { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
    }
    // hành tinh: sáng đều, không lấp lánh
    for (const p of sky.planets) {
      if (p.alt < 0) continue; const [c, r] = PLC[p.n], ext = Math.min(1, 0.3 + p.alt / 12);
      const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5); hg.addColorStop(0, `rgba(${c},${(0.45 * ext).toFixed(3)})`); hg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${c},${ext.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }
    drawMoon(sky.moon);
    if (AURORA) drawAurora(now, reduce ? 6 : t);
    if (reduce) return;
    if (now > nextMeteor) spawnMeteor(now);
    drawMeteors(dt);
    raf = requestAnimationFrame(frame);
  };

  const begin = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); };
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); begin(); }, 150); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); hiddenAt = performance.now(); }
    else { t0 += performance.now() - hiddenAt; begin(); }
  });
  build(); nextMeteor = performance.now() + 1200; begin();
})();
