/* Bầu trời Galaxy (trang chủ, Cộng đồng) — "Bầu trời hôm nay": nền là bầu trời THẬT nhìn từ Sài Gòn đúng lúc người xem ghé thăm.
   - Ngày / chạng vạng / đêm theo độ cao Mặt Trời thật: ban ngày trời xanh sáng hơn (vẫn đủ đậm để chữ trắng dễ đọc), có Mặt Trời và mây trôi;
     chạng vạng có ráng chiều về phía Mặt Trời, sao sáng nhất và hành tinh hiện trước; đêm thấy rõ dải Ngân Hà (mờ đi khi trăng sáng) và M31.
   - Sao thật (sky-data.js), Mặt Trăng đúng vị trí và pha, 5 hành tinh mắt thường; tính bằng sky-astro.js. Đêm tua nhanh ×20, ngày chạy đúng giờ.
   - Ngày lễ (sky-holidays.js tính sẵn Tết và Trung thu âm lịch): Tết (7 ngày trước → mùng 6), Quốc khánh 1–2/9, 30/4 – 1/5, Trung thu,
     Giáng sinh 24–25/12, Tết Dương lịch 31/12 – 1/1, sinh nhật 27/02 (cực quang). Pháo hoa vẽ ở đây (khi trời tối); cờ, đèn lồng, hoa mai/đào,
     đèn ông sao, tuyết ở sky-fest.js. Nhãn góc trái dưới có lời chúc VI/EN.
   - Xem trước: ?sky=day | dusk | night | aurora | YYYY-MM-DD | YYYY-MM-DDTHH:MM ; ?fest=tet | national | reunify | midautumn | xmas | newyear | birthday
   Hình chiếu: nhìn thẳng lên thiên đỉnh, Bắc ở trên, Đông bên trái. Canvas cố định sau nội dung, không bắt chuột; dừng khi tab ẩn;
   chọn giảm chuyển động thì vẽ khung tĩnh. */
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
  const SPEED = 20;                        // ban đêm: tua nhanh nhật động ×20; ngày và chạng vạng chạy đúng giờ thật
  const M31 = { ra: 10.6847, dec: 41.2687 };

  // ---------- chọn thời điểm ----------
  const saigonParts = (d) => { const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value])); return p; };
  const atVN = (y, m, d, hh = 21, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh - 7, mm)); // giờ Sài Gòn (UTC+7)
  // Xem trước: ?sky=day | dusk | night | aurora | YYYY-MM-DD (21:00) | YYYY-MM-DDTHH:MM ; ?fest=tet | national | reunify | midautumn | xmas | newyear | birthday
  const QS = new URLSearchParams(location.search), q = QS.get("sky") || "", qf = QS.get("fest") || "";
  let start = new Date(), mode = "now";
  const tp = saigonParts(start), qd = q.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (qd) { start = atVN(+qd[1], +qd[2], +qd[3], qd[4] ? +qd[4] : 21, qd[5] ? +qd[5] : 0); mode = "date"; }
  else if (q === "day") { start = atVN(+tp.year, +tp.month, +tp.day, 13, 0); mode = "date"; }
  else if (q === "dusk") { start = atVN(+tp.year, +tp.month, +tp.day, 17, 55); mode = "date"; }
  else if (q === "night") { start = atVN(+tp.year, +tp.month, +tp.day, 22, 0); mode = "date"; }
  const sp = saigonParts(start), MD = `${sp.month}-${sp.day}`;

  // ---------- ngày lễ (theo ngày ở Sài Gòn) ----------
  const LUNAR = window.SKY_LUNAR || { tet: {}, trungthu: {} };
  const dayNo = (iso) => Math.floor(Date.parse(iso + "T00:00:00Z") / 86400000);
  const today = dayNo(`${sp.year}-${sp.month}-${sp.day}`);
  const near = (iso, a, b) => iso && today - dayNo(iso) >= a && today - dayNo(iso) <= b;
  const CAN = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"], CHI = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];
  const ZOD = ["Monkey", "Rooster", "Dog", "Pig", "Rat", "Ox", "Tiger", "Cat", "Dragon", "Snake", "Horse", "Goat"];
  let FEST = null, festYear = +sp.year;
  const tetY = [+sp.year, +sp.year + 1].find((y) => near(LUNAR.tet[y], -7, 6));
  if (["tet", "national", "reunify", "midautumn", "xmas", "newyear", "birthday"].includes(qf)) FEST = qf;
  else if (q === "aurora" || MD === BIRTHDAY) FEST = "birthday";
  else if (tetY) { FEST = "tet"; festYear = tetY; }
  else if (MD === "09-01" || MD === "09-02") FEST = "national";
  else if (MD === "04-30" || MD === "05-01") FEST = "reunify";
  else if (near(LUNAR.trungthu[sp.year], -2, 0)) FEST = "midautumn";
  else if (MD === "12-24" || MD === "12-25") FEST = "xmas";
  else if (MD === "12-31" || MD === "01-01") { FEST = "newyear"; if (MD === "12-31") festYear++; }
  if (FEST === "tet" && !tetY) festYear = Object.keys(LUNAR.tet).map(Number).find((y) => dayNo(LUNAR.tet[y]) >= today - 6) || +sp.year;
  const AURORA = FEST === "birthday";
  // mùng 1 → mùng 3 Tết, Quốc khánh, đêm 1/1: pháo hoa khi trời tối; đêm giao thừa: màn pháo hoa lớn đúng 0h (xem phần đếm ngược)
  const FIREWORKS = FEST === "national" || (FEST === "newyear" && MD === "01-01") || (FEST === "tet" && (!tetY || near(LUNAR.tet[tetY], 0, 2)));   // tối giao thừa để dành cho màn pháo hoa lúc 0h
  window.SKY_STATE = { fest: FEST, year: festYear, phase: null, sunAlt: -30 };

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
  // quầng sáng liền mạch của dải Ngân Hà (dọc xích đạo thiên hà, sáng và dày hơn về phía tâm ở Nhân Mã), chỉ rõ khi trời tối hẳn
  const MWG = [];
  for (let l = 0; l < 360; l += 3) { const near = Math.cos(((l + 180) % 360 - 180) * D2R) * 0.5 + 0.5;
    for (const b of near > 0.6 ? [-5, 0, 5] : [0]) MWG.push({ ...A.galToEq(l + Math.random() * 2, b + gauss() * 1.5), w: 0.35 + 0.65 * near * (b ? 0.7 : 1), x: 0, y: 0, alt: -1 }); }
  const blob = document.createElement("canvas"); blob.width = blob.height = 64;
  { const g = blob.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(220,215,255,1)"); r.addColorStop(0.4, "rgba(185,176,255,.45)"); r.addColorStop(1, "rgba(185,176,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  // mây ban ngày: vài đám mây mờ trôi chậm
  const CLOUDS = Array.from({ length: 7 }, () => ({ x: Math.random(), y: 0.1 + Math.random() * 0.75, s: 0.6 + Math.random() * 0.9, v: 0.004 + Math.random() * 0.006, p: Array.from({ length: 6 }, () => [gauss() * 0.6, gauss() * 0.18, 0.5 + Math.random() * 0.6]) }));

  // ---------- hình chiếu: nhìn lên thiên đỉnh ----------
  let W = 0, H = 0, dpr = 1, CX = 0, CY = 0, RH = 0, SMALL = false;
  const proj = (o, lstDeg) => { const h = A.horizontal(o.ra, o.dec, lstDeg, LAT); o.alt = h.alt; if (h.alt < -2) return o;
    const r = RH * Math.tan((90 - h.alt) * D2R / 2) / Math.tan(Math.PI / 4), a = h.az * D2R; // chân trời: r = RH
    o.x = CX - Math.sin(a) * r; o.y = CY - Math.cos(a) * r; return o; };            // Bắc ở trên, Đông bên trái (nhìn lên trời)

  let sky = { lst: 0, date: start, moon: null, planets: [], m31: null, sunXY: null }, lastProj = -1e9;
  const PMAG = { mercury: 0, venus: -4, mars: 0.8, jupiter: -2.2, saturn: 0.7 };   // cấp sao tiêu biểu để biết lúc nào hiện ra
  const PLC = { mercury: ["220,210,200", 1.6], venus: ["255,250,235", 3.2], mars: ["255,140,95", 2.1], jupiter: ["255,236,205", 2.7], saturn: ["240,222,165", 2.0] };
  const reproject = (date) => {
    const l = A.lst(date, LON);
    for (const s of STARS) proj(s, l);
    for (const m of MW) proj(m, l);
    for (const m of MWG) proj(m, l);
    for (const con of LINES) for (const seg of con) for (const p of seg) proj(p, l);
    const mo = A.moon(date), su = A.sun(date);
    sky = { lst: l, date, moon: proj({ ...mo }, l), sun: proj({ ...su }, l), planets: A.PLANETS.map((n) => ({ n, ...proj({ ...A.planet(n, date) }, l) })), m31: proj({ ...M31 }, l) };
    // hướng Bắc tại M31 (để xoay thiên hà đúng góc vị trí ~38°)
    const n2 = proj({ ra: M31.ra, dec: M31.dec + 2 }, l);
    sky.m31.pa = Math.atan2(n2.y - sky.m31.y, n2.x - sky.m31.x) + 38 * D2R;
    // hướng tới Mặt Trời (Mặt Trời dưới chân trời vẫn chiếu được ra ngoài vòng chân trời)
    const h = A.horizontal(su.ra, su.dec, l, LAT), r = RH * Math.tan((90 - h.alt) * D2R / 2), a = h.az * D2R;
    sky.sunXY = [CX - Math.sin(a) * r, CY - Math.cos(a) * r];
    sky.sunAlt = h.alt;
    // pha bầu trời theo độ cao Mặt Trời: ngày (> 0°), chạng vạng (0 → −12°), đêm (< −12°)
    const ph = h.alt > 0 ? "day" : h.alt > -12 ? "dusk" : "night";
    if (ph !== window.SKY_STATE.phase) { window.SKY_STATE.phase = ph; document.documentElement.dataset.sky = ph; window.dispatchEvent(new CustomEvent("sky:state", { detail: window.SKY_STATE })); }
    window.SKY_STATE.sunAlt = h.alt;
  };
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  // cấp sao giới hạn nhìn thấy theo độ sáng của trời: ban ngày chỉ Trăng; chạng vạng hiện dần sao sáng nhất và hành tinh trước
  const limMag = (alt) => (alt > 0 ? -5 : alt > -12 ? -1 - alt * 0.55 : 5.6);
  const vis = (mag, alt) => Math.max(0, Math.min(1, (limMag(alt) - mag) / 1.2 + 0.2));

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
    if (m.alt < -1 || (m.illum < 0.03 && (sky.sunAlt ?? -30) > -6)) return;   // trăng non giữa ban ngày: không nhìn thấy
    const R = SMALL ? 9 : 12, [sx, sy] = sky.sunXY, ang = Math.atan2(sy - m.y, sx - m.x), k = m.illum;
    const g = ctx.createRadialGradient(m.x, m.y, R * 0.5, m.x, m.y, R * (4 + 4 * k)); g.addColorStop(0, `rgba(255,248,230,${(0.18 + 0.3 * k).toFixed(3)})`); g.addColorStop(1, "rgba(255,248,230,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m.x, m.y, R * (4 + 4 * k), 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(ang);
    const dark = 1 - sstep(-6, 2, sky.sunAlt ?? -30);                                                           // ban ngày không thấy phần tối của Trăng
    if (dark > 0.01) { ctx.fillStyle = `rgba(60,58,90,${(0.55 * dark).toFixed(3)})`; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); }   // phần tối (ánh đất mờ)
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
  const canChi = (y) => `${CAN[y % 10]} ${CHI[y % 12]}`;
  const greet = () => ({
    birthday: T("✦ Cực quang mừng sinh nhật Lan Anh (27/02)", "✦ An aurora for Lan Anh's birthday (Feb 27)"),
    tet: T(`✦ Chúc mừng năm mới · Tết ${canChi(festYear)}`, `✦ Happy Lunar New Year · Year of the ${ZOD[festYear % 12]} (${canChi(festYear)})`),
    national: T("✦ Mừng Quốc khánh 2/9", "✦ Happy National Day of Vietnam (Sep 2)"),
    reunify: T("✦ Mừng ngày Giải phóng miền Nam, thống nhất đất nước 30/4 và Quốc tế Lao động 1/5", "✦ Celebrating Reunification Day (Apr 30) and International Workers' Day (May 1)"),
    midautumn: T("✦ Trung thu vui vẻ · rằm tháng Tám", "✦ Happy Mid-Autumn Festival"),
    xmas: T("✦ Giáng sinh an lành", "✦ Merry Christmas"),
    newyear: T(`✦ Chúc mừng năm mới ${festYear}`, `✦ Happy New Year ${festYear}`),
  })[FEST] || "";
  const renderTag = () => {
    const p = saigonParts(sky.date), alt = sky.sunAlt ?? -30;
    const part = alt > 0 ? T("ban ngày", "daytime") : alt > -12 ? T("chạng vạng", "twilight") : T("ban đêm", "night");
    const when = mode === "now" ? T(`lúc này (${part})`, `right now (${part})`) : `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year} (${part})`;
    const up = sky.planets.filter((x) => x.alt > 0 && vis(PMAG[x.n], alt) > 0.3).map((x) => T(...PN[x.n]));
    const moon = sky.moon.alt > 0 ? `${phaseName(sky.moon)} ${Math.round(sky.moon.illum * 100)}%` : T("Trăng chưa mọc", "Moon below the horizon");
    const mw = alt < -15 && sky.moon && (sky.moon.alt <= 0 || sky.moon.illum < 0.5) ? T("thấy rõ dải Ngân Hà", "Milky Way in view") : "";
    const parts = [T(`Bầu trời Sài Gòn ${when}`, `Saigon sky ${when}`), moon, up.length ? up.join(", ") : "", mw].filter(Boolean);
    const gr = greet();
    tag.innerHTML = `<i aria-hidden="true">✦</i><span>${gr ? `<b>${gr}</b>` : ""}${parts.join(" · ")}</span>`;
    tag.setAttribute("aria-label", (gr ? gr.replace("✦ ", "") + ". " : "") + parts.join(", "));
    tag.setAttribute("aria-expanded", open);
    tag.classList.toggle("open", open); tag.className = tag.className.replace(/\bfest-\S+/g, "").trim(); if (FEST) tag.classList.add("fest-" + FEST);
    tag.classList.toggle("bday", AURORA);
  };
  tag.addEventListener("click", () => { open = !open; renderTag(); });
  document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(renderTag, 60); });
  setTimeout(() => { if (open) { open = false; renderTag(); } }, (FEST ? 14000 : 9000) * (innerWidth < 700 ? 0.5 : 1));

  // ---------- dựng khung ----------
  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight;   // nền mờ ảo: 1.5× đủ nét, đỡ ~45% điểm ảnh so với 2×
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    SMALL = W < 700; CX = W / 2; CY = H / 2; RH = Math.hypot(W, H) * 0.55;
    RADX = W * 0.12; RADY = -H * 0.12;
    buildGalaxy(); lastProj = -1e9;
  };

  // ---------- trời ban ngày / chạng vạng ----------
  const mixC = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const drawSkyLight = (alt, t) => {
    const day = sstep(-12, 4, alt);                         // 0: đêm → 1: ngày
    if (day <= 0.002) return;
    // màu trời: giữ đủ tối để chữ trắng vẫn dễ đọc (ngày: xanh lam đậm → xanh nhạt ở chân trời)
    const dusk = 1 - sstep(-2, 10, alt);                    // gần chân trời: trời ngả tím
    const zen = mixC([30, 52, 140], [36, 30, 96], dusk), hor = mixC([78, 108, 206], [92, 62, 150], dusk);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, RH);
    g.addColorStop(0, `rgba(${zen},${(0.95 * day).toFixed(3)})`); g.addColorStop(1, `rgba(${hor},${(0.95 * day).toFixed(3)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // ráng chiều / rạng đông về phía Mặt Trời (mạnh nhất khi Mặt Trời quanh −3°)
    const tw = Math.exp(-Math.pow((alt + 3) / 6, 2));
    if (tw > 0.02) { const [sx, sy] = sky.sunXY, rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, RH * 1.1);
      rg.addColorStop(0, `rgba(255,150,90,${(0.55 * tw).toFixed(3)})`); rg.addColorStop(0.35, `rgba(255,110,150,${(0.28 * tw).toFixed(3)})`); rg.addColorStop(1, "rgba(143,132,255,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H); }
  };
  const drawSun = (alt) => {
    if (alt < -1) return; const [x, y] = sky.sunXY, low = 1 - sstep(0, 25, alt);
    if (x < -400 || x > W + 400 || y < -400 || y > H + 400) return;
    // quầng Mặt Trời vừa phải để chữ phía trên vẫn đọc rõ
    const R = SMALL ? 120 : 190, core = ctx.createRadialGradient(x, y, 0, x, y, R), c = low > 0.5 ? "255,190,120" : "255,244,214";
    core.addColorStop(0, "rgba(255,255,245,.8)"); core.addColorStop(0.08, `rgba(${c},.45)`); core.addColorStop(0.3, `rgba(${c},.1)`); core.addColorStop(1, `rgba(${c},0)`);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = core; ctx.fillRect(x - R, y - R, R * 2, R * 2); ctx.restore();
  };
  const drawClouds = (alt, dt) => {
    const day = sstep(-6, 8, alt); if (day <= 0.01) return;
    const S = Math.max(W, H) * 0.16;
    for (const c of CLOUDS) {
      if (!reduce) c.x = (c.x + c.v * dt / 1000 * 0.25) % 1.3;
      const cx = (c.x - 0.15) * W, cy = c.y * H;
      for (const [dx, dy, r] of c.p) { const R = S * c.s * r, X = cx + dx * S * c.s, Y = cy + dy * S * c.s;
        const g = ctx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, `rgba(235,238,255,${(0.11 * day).toFixed(3)})`); g.addColorStop(1, "rgba(235,238,255,0)");
        ctx.fillStyle = g; ctx.fillRect(X - R, Y - R, R * 2, R * 2); }
    }
  };

  // ---------- pháo hoa (Quốc khánh, giao thừa → mùng 3 Tết, Tết Dương lịch; chỉ khi trời tối) ----------
  const FW_COL = { national: ["255,59,48", "255,214,74", "255,240,200"], tet: ["255,59,48", "255,214,74", "255,140,180", "255,240,200"], newyear: ["143,132,255", "255,122,69", "255,214,74", "255,255,255"] };
  let rockets = [], sparks = [], nextFw = 0, finaleUntil = 0;   // finaleUntil: thời điểm (performance.now) hết màn pháo hoa giao thừa
  const fireworks = (now, dt, alt) => {
    const finale = now < finaleUntil;
    if (!(FIREWORKS || finale) || (alt > -4 && !finale)) return;
    const cols = FW_COL[FEST] || FW_COL.newyear;
    if (!reduce && now > nextFw) { rockets.push({ x: W * (0.12 + Math.random() * 0.76), y: H + 10, vy: -(0.55 + Math.random() * 0.25) * H / 1000, ty: H * (0.12 + Math.random() * 0.35), c: cols[(Math.random() * cols.length) | 0] }); nextFw = now + (finale ? 120 + Math.random() * 260 : 700 + Math.random() * 1500); }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    rockets = rockets.filter((r) => { r.y += r.vy * dt; ctx.fillStyle = `rgba(${r.c},.9)`; ctx.fillRect(r.x - 1, r.y, 2, 10);
      if (r.y > r.ty) return true;
      const n = (finale ? 110 : 70) + ((Math.random() * 40) | 0), sp = (finale ? 0.16 : 0.12) * (1 + Math.random() * 0.8) * Math.min(W, H) / 1000, two = Math.random() < 0.5 ? cols[(Math.random() * cols.length) | 0] : r.c;
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU + Math.random() * 0.1, v = sp * (0.6 + Math.random() * 0.5); sparks.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, dur: 1300 + Math.random() * 700, c: i % 3 ? r.c : two }); }
      return false; });
    sparks = sparks.filter((p) => { p.life += dt; const k = p.life / p.dur; if (k >= 1) return false;
      const px = p.x, py = p.y; p.vx *= 0.985; p.vy = p.vy * 0.985 + 0.00009 * dt; p.x += p.vx * dt; p.y += p.vy * dt;   // lực cản + trọng lực
      const a = (1 - k) * (k < 0.1 ? k / 0.1 : 1) * (0.75 + 0.25 * Math.sin(p.life * 0.05));
      ctx.strokeStyle = `rgba(${p.c},${a.toFixed(3)})`; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
      return true; });
    ctx.restore();
  };

  let raf = 0, last = 0, t0 = 0, hiddenAt = 0, skyMs = start.getTime();
  const frame = (now) => {
    if (!reduce && last && now - last < 31) { raf = requestAnimationFrame(frame); return; }   // vẽ ~30 khung/giây: sao lấp lánh chậm nên mắt không thấy khác, máy đỡ một nửa việc
    if (!t0) t0 = now;
    const dt = last ? Math.min(now - last, 50) : 16; last = now;
    const t = (now - t0) / 1000;
    // thời điểm trên trời: đêm tua nhanh ×20, ngày/chạng vạng đúng giờ thật; vị trí tính lại mỗi 0,25 giây
    if (!reduce) skyMs += dt * ((sky.sunAlt ?? -30) < -12 ? SPEED : 1);
    if (now - lastProj > 250 || reduce) { reproject(new Date(skyMs)); lastProj = now; if (Math.floor(t) % 30 === 0 || !tag.innerHTML) renderTag(); }
    const alt = sky.sunAlt, night = 1 - sstep(-12, 0, alt), deep = 1 - sstep(-18, -10, alt);
    const moonWash = sky.moon && sky.moon.alt > 0 ? 1 - 0.55 * sky.moon.illum : 1;     // trăng sáng làm Ngân Hà mờ đi
    ctx.clearRect(0, 0, W, H);
    drawSkyLight(alt, t);
    // quầng sáng đô thị gần chân trời (ban đêm)
    if (night > 0.01) { const lp = ctx.createRadialGradient(CX, CY, RH * 0.62, CX, CY, RH); lp.addColorStop(0, "rgba(255,140,90,0)"); lp.addColorStop(1, `rgba(255,140,90,${(0.1 * night).toFixed(3)})`); ctx.fillStyle = lp; ctx.fillRect(0, 0, W, H); }
    // dải Ngân Hà: quầng liền mạch + hạt bụi sao
    const mw = deep * moonWash;
    if (mw > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      const bs = (SMALL ? 70 : 110);
      for (const m of MWG) { if (m.alt < 0) continue; const z = bs * (0.7 + 0.6 * m.w); ctx.globalAlpha = 0.085 * m.w * mw * Math.min(1, m.alt / 20); ctx.drawImage(blob, m.x - z / 2, m.y - z / 2, z, z); }
      for (const m of MW) { if (m.alt < 0) continue; ctx.globalAlpha = m.a * 1.4 * mw * Math.min(1, m.alt / 20); ctx.fillStyle = `rgb(${m.c})`; ctx.fillRect(m.x - m.s, m.y - m.s, m.s * 2, m.s * 2); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    // đường nối chòm sao (rất mờ, chỉ ban đêm)
    if (night > 0.3) { ctx.strokeStyle = `rgba(185,176,255,${(0.07 * night).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath();
      for (const con of LINES) for (const seg of con) for (let i = 1; i < seg.length; i++) { const a = seg[i - 1], b = seg[i]; if (a.alt < 0 || b.alt < 0) continue; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke(); }
    // thiên hà Andromeda
    const g = sky.m31;
    if (g && g.alt > 3 && deep > 0.02) {
      if (gLast < 0 || now - gLast > 66 || reduce) { renderGalaxy(reduce ? 0 : t, g.pa); gLast = now; }
      ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = (SMALL ? 0.5 : 1) * Math.min(1, g.alt / 15) * deep;
      ctx.drawImage(gcv, g.x - gSize / 2, g.y - gSize / 2, gSize, gSize); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
    // sao thật: hiện dần theo độ tối của trời (sao sáng nhất hiện trước lúc chạng vạng)
    for (const s of STARS) {
      if (s.alt < 0 || s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) continue;
      const v = vis(s.mag, alt); if (v <= 0) continue;
      const low = 1 - Math.min(1, s.alt / 45), ext = Math.min(1, 0.25 + s.alt / 12);
      const amp = reduce ? 0 : (0.1 + 0.3 * low) * (s.mag > 2 ? 1 : 0.7);
      const tw = 1 - amp * (0.5 + 0.5 * Math.sin(t * s.f1 + s.ph)) * (0.7 + 0.3 * Math.sin(t * s.f2 + s.ph * 2));
      const al = s.base * tw * ext * v;
      if (s.r > 1.5) { const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4); hg.addColorStop(0, `rgba(${s.c},${(al * 0.35).toFixed(3)})`); hg.addColorStop(1, `rgba(${s.c},0)`); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = `rgba(${s.c},${al.toFixed(3)})`;
      if (s.r < 0.9) ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2); else { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill(); }
    }
    // hành tinh: sáng đều, không lấp lánh; hiện từ lúc chạng vạng (Kim, Mộc hiện sớm nhất)
    for (const p of sky.planets) {
      if (p.alt < 0) continue; const [c, r] = PLC[p.n], ext = Math.min(1, 0.3 + p.alt / 12) * vis(PMAG[p.n], alt); if (ext <= 0.01) continue;
      const hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5); hg.addColorStop(0, `rgba(${c},${(0.45 * ext).toFixed(3)})`); hg.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(p.x, p.y, r * 5, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(${c},${ext.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }
    drawSun(alt);
    drawClouds(alt, dt);
    drawMoon(sky.moon);
    if (AURORA) { ctx.save(); ctx.globalAlpha = alt > 0 ? 0.6 : 1; drawAurora(now, reduce ? 6 : t); ctx.restore(); }
    fireworks(now, dt, alt);
    if (reduce) return;
    if (night > 0.6) { if (now > nextMeteor) spawnMeteor(now); }
    drawMeteors(dt);
    raf = requestAnimationFrame(frame);
  };

  // ---------- đếm ngược giao thừa (Tết Nguyên Đán và Tết Dương lịch) ----------
  // Dùng đồng hồ thật (không theo bầu trời tua nhanh). Từ 18h đêm giao thừa: nhãn đếm ngược dưới thanh menu; 10 giây cuối: số lớn giữa màn hình;
  // đúng 0h: pháo hoa dồn dập ~40 giây + lời chúc. Xem thử: ?sky=2027-02-05T23:59 (giao thừa Tết Đinh Mùi) hoặc ?sky=2026-12-31T23:59.
  (() => {
    let target = 0, lunar = false;
    if (FEST === "tet" && tetY) { const d = LUNAR.tet[tetY]; const [y, m, dd] = d.split("-").map(Number); target = atVN(y, m, dd, 0, 0).getTime(); lunar = true; }
    else if (FEST === "newyear" && MD === "12-31") target = atVN(festYear, 1, 1, 0, 0).getTime();
    if (!target) return;
    const t0r = performance.now(), base = mode === "date" ? start.getTime() : Date.now();
    const realNow = () => base + (performance.now() - t0r);
    if (realNow() > target + 120000 || target - realNow() > 30 * 3600000) return;     // đã qua hẳn, hoặc còn quá xa
    const pill = document.createElement("div"); pill.className = "gx-count"; pill.setAttribute("role", "timer");
    const big = document.createElement("div"); big.className = "gx-count-big"; big.setAttribute("aria-hidden", "true");
    const hny = document.createElement("div"); hny.className = "gx-hny"; hny.setAttribute("role", "status");
    document.body.append(pill, big, hny);
    const pad = (n) => String(n).padStart(2, "0");
    let lastBig = -1, fired = false;
    const paintHny = () => { hny.innerHTML = `<b>${T("Chúc mừng năm mới!", "Happy New Year!")}</b><span>${lunar ? T(`Tết ${canChi(festYear)} · ${festYear}`, `Year of the ${ZOD[festYear % 12]} · ${festYear}`) : festYear}</span>`; };
    const tick = () => {
      const left = target - realNow();
      if (left > 0) {
        const s = Math.ceil(left / 1000), hms = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
        const show = left <= 6 * 3600000;
        pill.hidden = !show; document.documentElement.classList.toggle("gx-counting", show);   // điện thoại: nhãn bầu trời thu gọn để nhường chỗ
        if (show) pill.innerHTML = lunar
          ? `<i aria-hidden="true">✦</i><span>${T(`Giao thừa Tết ${canChi(festYear)} · còn`, `Lunar New Year's Eve · Year of the ${ZOD[festYear % 12]} in`)}</span><b>${hms}</b>`
          : `<i aria-hidden="true">✦</i><span>${T(`Giao thừa ${festYear} · còn`, `New Year ${festYear} in`)}</span><b>${hms}</b>`;
        if (s <= 10) { if (s !== lastBig) { lastBig = s; big.textContent = s; big.classList.remove("on"); void big.offsetWidth; big.classList.add("on"); } }
        else big.classList.remove("on");
        return;
      }
      if (!fired) {
        fired = true; pill.hidden = true; big.classList.remove("on"); document.documentElement.classList.remove("gx-counting");
        finaleUntil = performance.now() + 40000; nextFw = 0;
        for (let i = 0; i < 9; i++) rockets.push({ x: W * (0.08 + 0.84 * i / 8), y: H + 10 + Math.random() * 80, vy: -(0.6 + Math.random() * 0.2) * H / 1000, ty: H * (0.1 + Math.random() * 0.3), c: (FW_COL[FEST] || FW_COL.newyear)[i % 3] });
        paintHny();
        hny.classList.add("on"); setTimeout(() => hny.classList.remove("on"), 10000);
      }
      if (realNow() > target + 120000) { clearInterval(iv); pill.remove(); big.remove(); setTimeout(() => hny.remove(), 11000); }
    };
    const iv = setInterval(tick, 200); tick();
    document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(() => { tick(); if (fired) paintHny(); }, 60); });
  })();

  const begin = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); };
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { build(); begin(); }, 150); }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); hiddenAt = performance.now(); }
    else { t0 += performance.now() - hiddenAt; begin(); }
  });
  build(); nextMeteor = performance.now() + 1200; begin();
})();
