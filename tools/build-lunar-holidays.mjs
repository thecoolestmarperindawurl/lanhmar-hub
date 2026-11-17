// Tạo sky-holidays.js: ngày Tết Nguyên Đán (mùng 1 tháng Giêng) và Trung thu (rằm tháng Tám) theo âm lịch Việt Nam, múi giờ UTC+7.
// Quy tắc lịch âm dương: tháng bắt đầu ở ngày Sóc (trăng mới) theo giờ Hà Nội; tháng 11 là tháng chứa Đông chí; năm có 13 tháng thì
// tháng nhuận là tháng đầu tiên sau tháng 11 không chứa trung khí (kinh độ Mặt Trời là bội của 30°).
// Thiên văn tính bằng astronomy-engine (MIT). Cách chạy: npm i astronomy-engine (thư mục tạm) rồi
//   node tools/build-lunar-holidays.mjs <đường dẫn tới node_modules/astronomy-engine> [năm đầu] [năm cuối]
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const A = require(process.argv[2]);
const Y0 = +(process.argv[3] || 2026), Y1 = +(process.argv[4] || 2045);
const TZ = 7 * 3600e3, DAY = 86400e3;
const localDay = (d) => Math.floor((d.getTime() + TZ) / DAY);                    // số ngày (theo giờ VN) kể từ 1970-01-01
const iso = (n) => new Date(n * DAY).toISOString().slice(0, 10);
const newMoonsFrom = (dayN, count) => { const out = []; let t = new Date(dayN * DAY - TZ - 2 * DAY);
  while (out.length < count) { const r = A.SearchMoonPhase(0, t, 40); const n = localDay(r.date); if (n >= dayN || out.length) out.push(n); t = new Date(r.date.getTime() + 2 * DAY); } return out; };
const sunLonAtDay = (n) => A.SunPosition(new Date(n * DAY - TZ)).elon;               // kinh độ Mặt Trời lúc 0h giờ VN
const month11 = (y) => { const sol = localDay(A.Seasons(y).dec_solstice.date);       // Sóc cuối cùng có ngày ≤ ngày Đông chí
  const nms = newMoonsFrom(sol - 35, 3); return nms.filter((n) => n <= sol).pop(); };
const yearMonths = (y) => { // các tháng âm của năm âm lịch y (từ tháng 11 năm y-1 tới trước tháng 11 năm y)
  const a = month11(y - 1), b = month11(y), nms = newMoonsFrom(a, 15).filter((n) => n <= b);
  const len = nms.length - 1, leap = len === 13;
  let leapIdx = -1;
  if (leap) for (let i = 1; i < len; i++) { if (Math.floor(sunLonAtDay(nms[i]) / 30) === Math.floor(sunLonAtDay(nms[i + 1]) / 30)) { leapIdx = i; break; } }
  const months = []; let m = 11;
  for (let i = 0; i < len; i++) { if (i === leapIdx) months.push({ m: months[months.length - 1].m, leap: true, start: nms[i] }); else { months.push({ m, leap: false, start: nms[i] }); m = m === 12 ? 1 : m + 1; } }
  return months;
};
const tet = {}, trungthu = {}, leaps = {};
for (let y = Y0; y <= Y1; y++) {
  const ms = yearMonths(y);
  tet[y] = iso(ms.find((x) => x.m === 1 && !x.leap).start);
  trungthu[y] = iso(ms.find((x) => x.m === 8 && !x.leap).start + 14);
  const L = ms.find((x) => x.leap); if (L) leaps[y] = L.m;
}
const out = `/* Ngày lễ âm lịch cho galaxy.js — TẠO TỰ ĐỘNG bằng tools/build-lunar-holidays.mjs, đừng sửa tay.
   Tết Nguyên Đán (mùng 1 tháng Giêng) và Trung thu (rằm tháng Tám) theo âm lịch Việt Nam (UTC+7), năm ${Y0}–${Y1}.
   Tính bằng astronomy-engine (ngày Sóc, Đông chí, trung khí, tháng nhuận). Năm có tháng nhuận: ${JSON.stringify(leaps)}. */
window.SKY_LUNAR = ${JSON.stringify({ tet, trungthu })};
`;
writeFileSync("sky-holidays.js", out);
console.log(out);
