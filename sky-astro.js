/* Tính bầu trời thật (độ chính xác vừa đủ để vẽ, sai số cỡ 1°) cho nền "Bầu trời hôm nay" của galaxy.js.
   - Giờ sao địa phương: công thức GMST (IAU 1982).
   - Mặt Trời: công thức rút gọn của Almanac (US Naval Observatory).
   - Hành tinh Thuỷ, Kim, Hoả, Mộc, Thổ: phần tử quỹ đạo Kepler gần đúng của JPL (E. M. Standish, dùng cho năm 1800–2050).
   - Mặt Trăng: phương pháp của Paul Schlyter (có các nhiễu động chính).
   Toạ độ sao/thiên thể lấy theo kỷ nguyên J2000 (bỏ qua tuế sai ~0,4° tới năm 2026: không thấy được trên màn hình).
   Dùng được cả trong trình duyệt (window.SkyAstro) lẫn Node (để kiểm tra). */
(function (root) {
  "use strict";
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const norm = (a) => ((a % 360) + 360) % 360;
  const dayNum = (date) => date.getTime() / 86400000 + 2440587.5 - 2451545.0; // số ngày tính từ J2000.0
  const OBL = 23.43928;

  // giờ sao địa phương (độ)
  const lst = (date, lon) => { const d = dayNum(date), T = d / 36525; return norm(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T + lon); };

  // xích đạo (độ) → chân trời: độ cao alt, phương vị az (tính từ hướng Bắc, sang Đông)
  const horizontal = (ra, dec, lstDeg, lat) => {
    const H = (lstDeg - ra) * D2R, d = dec * D2R, p = lat * D2R;
    const sa = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(H);
    const alt = Math.asin(Math.max(-1, Math.min(1, sa)));
    const az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.cos(p) * Math.sin(d) - Math.sin(p) * Math.cos(d) * Math.cos(H));
    return { alt: alt * R2D, az: norm(az * R2D) };
  };
  // hoàng đạo (độ) → xích đạo
  const eclToEq = (lon, lat, eps = OBL) => {
    const l = lon * D2R, b = lat * D2R, e = eps * D2R;
    const x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l) * Math.cos(e) - Math.sin(b) * Math.sin(e), z = Math.cos(b) * Math.sin(l) * Math.sin(e) + Math.sin(b) * Math.cos(e);
    return { ra: norm(Math.atan2(y, x) * R2D), dec: Math.asin(z) * R2D };
  };
  // toạ độ thiên hà (l, b) → xích đạo J2000
  const galToEq = (l, b) => {
    const raGP = 192.85948 * D2R, decGP = 27.12825 * D2R, lNCP = 122.93192 * D2R, L = l * D2R, B = b * D2R;
    const sd = Math.sin(B) * Math.sin(decGP) + Math.cos(B) * Math.cos(decGP) * Math.cos(lNCP - L);
    const dec = Math.asin(sd);
    const y = Math.cos(B) * Math.sin(lNCP - L), x = Math.sin(B) * Math.cos(decGP) - Math.cos(B) * Math.sin(decGP) * Math.cos(lNCP - L);
    return { ra: norm((Math.atan2(y, x) + raGP) * R2D), dec: dec * R2D };
  };

  // Mặt Trời
  const sun = (date) => {
    const d = dayNum(date), g = norm(357.529 + 0.98560028 * d) * D2R, q = norm(280.459 + 0.98564736 * d);
    const L = norm(q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)), eps = 23.439 - 0.00000036 * d;
    return { ...eclToEq(L, 0, eps), lon: L };
  };

  // hành tinh: [a, e, I, L, ϖ, Ω] và tốc độ thay đổi mỗi thế kỷ (JPL, Standish)
  const EL = {
    mercury: [[0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
    venus: [[0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255], [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418]],
    earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0]],
    mars: [[1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
    jupiter: [[5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
    saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
  };
  const helio = (name, T) => {
    const [e0, r] = EL[name], [a, e, I, L, wb, O] = e0.map((v, i) => v + r[i] * T);
    const w = wb - O, M = norm(L - wb) * D2R;
    let E = M + e * Math.sin(M); for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cw = Math.cos(w * D2R), sw = Math.sin(w * D2R), cO = Math.cos(O * D2R), sO = Math.sin(O * D2R), cI = Math.cos(I * D2R), sI = Math.sin(I * D2R);
    return [(cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp, (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp, (sw * sI) * xp + (cw * sI) * yp];
  };
  const planet = (name, date) => {
    const T = dayNum(date) / 36525, p = helio(name, T), E = helio("earth", T);
    const x = p[0] - E[0], y = p[1] - E[1], z = p[2] - E[2];
    const lon = norm(Math.atan2(y, x) * R2D), lat = Math.atan2(z, Math.hypot(x, y)) * R2D;
    return { ...eclToEq(lon, lat), dist: Math.hypot(x, y, z) };
  };

  // Mặt Trăng (Schlyter): toạ độ hoàng đạo của ngày, có nhiễu động chính
  const moon = (date) => {
    const d = dayNum(date) + 1.5; // Schlyter đếm ngày từ 0/1/2000 0h
    const N = norm(125.1228 - 0.0529538083 * d), i = 5.1454, w = norm(318.0634 + 0.1643573223 * d), a = 60.2666, e = 0.054900, M = norm(115.3654 + 13.0649929509 * d);
    let E = M * D2R + e * Math.sin(M * D2R) * (1 + e * Math.cos(M * D2R)); for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M * D2R) / (1 - e * Math.cos(E));
    const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E), v = Math.atan2(yv, xv) * R2D, r = Math.hypot(xv, yv);
    const xh = r * (Math.cos(N * D2R) * Math.cos((v + w) * D2R) - Math.sin(N * D2R) * Math.sin((v + w) * D2R) * Math.cos(i * D2R));
    const yh = r * (Math.sin(N * D2R) * Math.cos((v + w) * D2R) + Math.cos(N * D2R) * Math.sin((v + w) * D2R) * Math.cos(i * D2R));
    const zh = r * Math.sin((v + w) * D2R) * Math.sin(i * D2R);
    let lon = Math.atan2(yh, xh) * R2D, lat = Math.atan2(zh, Math.hypot(xh, yh)) * R2D;
    const Ms = norm(356.0470 + 0.9856002585 * d), ws = 282.9404 + 4.70935e-5 * d, Ls = norm(Ms + ws), Lm = norm(N + w + M), Dm = norm(Lm - Ls), F = norm(Lm - N);
    const s = (x) => Math.sin(x * D2R), c = (x) => Math.cos(x * D2R);
    lon += -1.274 * s(M - 2 * Dm) + 0.658 * s(2 * Dm) - 0.186 * s(Ms) - 0.059 * s(2 * M - 2 * Dm) - 0.057 * s(M - 2 * Dm + Ms) + 0.053 * s(M + 2 * Dm) + 0.046 * s(2 * Dm - Ms) + 0.041 * s(M - Ms) - 0.035 * s(Dm) - 0.031 * s(M + Ms) - 0.015 * s(2 * F - 2 * Dm) + 0.011 * s(M - 4 * Dm);
    lat += -0.173 * s(F - 2 * Dm) - 0.055 * s(M - F - 2 * Dm) - 0.046 * s(M + F - 2 * Dm) + 0.033 * s(F + 2 * Dm) + 0.017 * s(2 * M + F);
    // đổi về J2000 (bỏ tuế sai từ ngày đó về J2000: ~1,4°/thế kỷ)
    lon = norm(lon - 1.3970 * (d / 36525));
    const eq = eclToEq(lon, lat);
    const sn = sun(date), el = norm(lon - sn.lon + 1.3970 * (d / 36525)); // độ giãn theo kinh độ hoàng đạo
    const cosE = Math.cos(lat * D2R) * Math.cos(el * D2R);
    return { ...eq, illum: (1 - cosE) / 2, waxing: el < 180, phaseAngle: el };
  };

  root.SkyAstro = { lst, horizontal, eclToEq, galToEq, sun, planet, moon, dayNum, PLANETS: ["mercury", "venus", "mars", "jupiter", "saturn"] };
})(typeof window !== "undefined" ? window : globalThis);
