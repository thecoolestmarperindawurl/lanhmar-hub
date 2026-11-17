// Tạo sky-data.js (dữ liệu sao thật cho nền "Bầu trời hôm nay" trong galaxy.js) từ gói d3-celestial.
// Nguồn: d3-celestial (Olaf Frohn, BSD-3-Clause), dữ liệu sao lấy từ Hipparcos/Yale BSC; đường nối chòm sao theo IAU.
// Cách chạy:  npm i d3-celestial  (ở thư mục tạm)  rồi
//             node tools/build-sky-data.mjs <đường dẫn tới node_modules/d3-celestial/data> [cấp sao giới hạn, mặc định 5.3]
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const LIM = parseFloat(process.argv[3] || "5.3");
if (!dir) { console.error("Thiếu đường dẫn tới thư mục data của d3-celestial"); process.exit(1); }
const stars = JSON.parse(readFileSync(join(dir, "stars.6.json"), "utf8")).features;
const lines = JSON.parse(readFileSync(join(dir, "constellations.lines.json"), "utf8")).features;
const ra = (lon) => +(((lon % 360) + 360) % 360).toFixed(2); // kinh độ GeoJSON [-180,180] → xích kinh 0–360°
const S = stars.filter((f) => f.properties.mag <= LIM)
  .map((f) => [ra(f.geometry.coordinates[0]), +f.geometry.coordinates[1].toFixed(2), +(+f.properties.mag).toFixed(1), +(+f.properties.bv || 0.6).toFixed(1)])
  .sort((a, b) => a[2] - b[2]);
const C = lines.map((f) => f.geometry.coordinates.map((seg) => seg.map(([lo, la]) => [ra(lo), +la.toFixed(1)])));
const out = `/* Dữ liệu bầu trời thật cho galaxy.js — TẠO TỰ ĐỘNG bằng tools/build-sky-data.mjs, đừng sửa tay.
   Sao: ${S.length} sao sáng hơn cấp ${LIM} [xích kinh°, xích vĩ°, cấp sao, chỉ số màu B-V]; đường nối ${C.length} chòm sao (IAU).
   Nguồn: d3-celestial © 2015 Olaf Frohn, giấy phép BSD-3-Clause (https://github.com/ofrohn/d3-celestial), dữ liệu Hipparcos / Yale Bright Star Catalog. */
window.SKY_DATA = ${JSON.stringify({ stars: S, lines: C })};
`;
writeFileSync("sky-data.js", out);
console.log(`sky-data.js: ${S.length} sao, ${C.length} chòm sao, ${(out.length / 1024).toFixed(1)} KB`);
