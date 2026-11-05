#!/usr/bin/env node
/* Kiểm tra song ngữ VI/EN cho dữ liệu của web LANHMAR. Không cần cài gì thêm (Node 18+).

   Hệ song ngữ đang chạy (lang.js):
     kho-featured.json  (VI)  ↔  kho-en.js  KHO_EN.items[id] {title, note, type, status}   : phần hiện trên THẺ
                               ↔  i18n/featured-en.json [id] = bản sao thẻ đã dịch (sections, cta…) : NỘI DUNG CHI TIẾT
     kho-data.js  KHO (VI)    ↔  kho-en.js  KHO_EN.kho[id] {name, desc, headline, groups{}, shelves{}, intro{}}
     community-data.js        : trường x có bản x_en cạnh nó (desc_en, topics_en, role_en, bio_en, t_en, d_en…)
     assets/content.json      : cặp x_vi / x_en

   Cách dùng:
     node tools/i18n-check.mjs              # báo mục MỚI còn thiếu (bỏ qua tồn đọng trong tools/i18n-baseline.json); thiếu → exit 1
     node tools/i18n-check.mjs --all        # liệt kê cả tồn đọng
     node tools/i18n-check.mjs --baseline   # ghi lại tồn đọng hiện tại (chạy sau khi dịch bớt)
     node tools/i18n-check.mjs --warn       # chỉ cảnh báo, không exit 1
   Chạy tự động trên GitHub Actions ở mỗi push/PR (.github/workflows/i18n-check.yml). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const BASELINE = path.join(ROOT, "tools", "i18n-baseline.json");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const loadJs = (file, name) => { const ctx = { window: {} }; vm.runInNewContext(read(file), ctx, { filename: file }); return ctx.window[name]; };
const filled = (v) => (typeof v === "string" ? v.trim() !== "" : Array.isArray(v) ? v.length > 0 : v != null);
// Chuỗi VI không có dấu tiếng Việt (vd "Skill", "Plugin", "GitHub repo") đã là tiếng Anh → không cần bản _en
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const needsEn = (v) => (typeof v === "string" ? VI.test(v) : Array.isArray(v) ? v.some((x) => typeof x === "string" && VI.test(x)) : false);

const missing = []; // { file, key, hint }
const miss = (file, key, hint) => missing.push({ file, key, hint });

// ---------- 1. Thẻ nổi bật: kho-featured.json ↔ kho-en.js items ↔ featured-en.json ----------
{
  const items = JSON.parse(read("kho-featured.json")).items || [];
  const EN = loadJs("kho-en.js", "KHO_EN") || {};
  const full = fs.existsSync(path.join(ROOT, "i18n/featured-en.json")) ? JSON.parse(read("i18n/featured-en.json")) : {};
  for (const it of items) {
    const e = (EN.items || {})[it.id];
    if (!e) { miss("kho-en.js", `items["${it.id}"]`, `thêm dòng { title, note, type } cho thẻ "${it.title}"`); }
    else {
      for (const k of ["title", "note", "type", "status"]) if (needsEn(it[k]) && !filled(e[k])) miss("kho-en.js", `items["${it.id}"].${k}`, it[k]);
    }
    const f = full[it.id];
    if (!f) { miss("i18n/featured-en.json", `["${it.id}"]`, `thêm bản dịch đầy đủ (cùng cấu trúc thẻ VI) cho "${it.title}"`); }
    else {
      const nv = (it.sections || []).length, ne = (f.sections || []).length;
      if (nv !== ne) miss("i18n/featured-en.json", `["${it.id}"].sections`, `VI có ${nv} khối, EN có ${ne} — bản dịch đã lệch, cập nhật lại`);
    }
    for (const k of Object.keys(it)) if (k.endsWith("_en")) miss("kho-featured.json", `["${it.id}"].${k}`, "hệ đang chạy không đọc trường _en ở file này — chuyển sang kho-en.js / featured-en.json rồi xoá");
  }
  // mục trong featured-en.json không còn thẻ VI tương ứng
  for (const id of Object.keys(full)) if (!items.some((i) => i.id === id)) miss("i18n/featured-en.json", `["${id}"]`, "thẻ VI không còn — xoá bản dịch mồ côi");

  // ---------- 2. Tên kho / mục con / kệ / intro: kho-data.js ↔ KHO_EN.kho ----------
  const KHO = loadJs("kho-data.js", "KHO") || [];
  for (const k of KHO) {
    const e = (EN.kho || {})[k.id] || {};
    for (const f of ["name", "desc", "headline"]) if (needsEn(k[f]) && !filled(e[f])) miss("kho-en.js", `kho.${k.id}.${f}`, k[f]);
    for (const g of k.groups || []) {
      if (!filled((e.groups || {})[g.id])) miss("kho-en.js", `kho.${k.id}.groups.${g.id}`, g.name);
      if (g.intro) {
        const ie = e.intro || {};
        if (!filled(ie.text)) miss("kho-en.js", `kho.${k.id}.intro.text`, g.intro.text);
        if ((g.intro.rows || []).length !== (ie.rows || []).length) miss("kho-en.js", `kho.${k.id}.intro.rows`, `VI ${(g.intro.rows || []).length} dòng, EN ${(ie.rows || []).length}`);
        if (g.intro.btn && !filled(ie.btn)) miss("kho-en.js", `kho.${k.id}.intro.btn`, g.intro.btn);
      }
    }
    for (const s of k.shelves || []) {
      const se = (e.shelves || {})[s.id];
      if (!se || !filled(se[0]) || (s.sub && !filled(se[1]))) miss("kho-en.js", `kho.${k.id}.shelves.${s.id}`, s.name + (s.sub ? " / " + s.sub : ""));
    }
  }
}

// ---------- 3. community-data.js: x ↔ x_en ở mọi độ sâu ----------
{
  const T = new Set(["desc", "topics", "role", "bio", "points", "tags", "t", "d", "members", "sub", "note", "label", "name", "place", "alt"]);
  const seg = (x, i) => (x && typeof x === "object" && typeof x.id === "string" && x.id ? `{${x.id}}` : i);
  const walk = (o, p) => {
    if (Array.isArray(o)) return o.forEach((x, i) => walk(x, p + "[" + seg(x, i) + "]"));
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      if (k.endsWith("_en")) continue;
      const v = o[k];
      const person = k === "name" && o && ("role" in o || "bio" in o || "photo" in o || "alias" in o); // tên người: không bắt buộc dịch
      if (!person && T.has(k) && (typeof v === "string" || Array.isArray(v) && v.every((x) => typeof x === "string"))) {
        if (needsEn(v) && !filled(o[k + "_en"])) miss("community-data.js", `${p}.${k}`, Array.isArray(v) ? JSON.stringify(v) : v);
      } else if (v && typeof v === "object") walk(v, p + "." + k);
    }
  };
  walk(loadJs("community-data.js", "COMMUNITIES") || [], "COMMUNITIES");
  walk(loadJs("community-data.js", "EVENTS") || [], "EVENTS"); // sự kiện trong nhóm: name/desc/place/alt cần _en
}

// ---------- 4. assets/content.json: x_vi ↔ x_en ----------
{
  const walk = (o, p) => {
    if (Array.isArray(o)) return o.forEach((x, i) => walk(x, p + "[" + i + "]"));
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (k.endsWith("_vi")) { if (filled(v) && !filled(o[k.slice(0, -3) + "_en"])) miss("assets/content.json", `${p}.${k.slice(0, -3)}`, Array.isArray(v) ? JSON.stringify(v) : v); }
      else if (v && typeof v === "object") walk(v, p + "." + k);
    }
  };
  walk(JSON.parse(read("assets/content.json")), "");
}

// ---------- Báo cáo ----------
const key = (m) => m.file + " › " + m.key;
let base = new Set();
try { base = new Set(JSON.parse(read("tools/i18n-baseline.json"))); } catch { /* chưa có */ }
if (flag("--baseline")) {
  fs.writeFileSync(BASELINE, JSON.stringify(missing.map(key), null, 2) + "\n");
  console.log(`✓ Đã ghi ${missing.length} mục tồn đọng vào tools/i18n-baseline.json`);
  process.exit(0);
}
const fresh = missing.filter((m) => !base.has(key(m)));
const show = flag("--all") ? missing : fresh;
const oldN = missing.length - fresh.length;
if (!show.length) {
  console.log(`✓ Song ngữ đủ: không có mục mới thiếu bản tiếng Anh${oldN ? ` (tồn đọng cũ: ${oldN}, xem --all)` : ""}.`);
  process.exit(0);
}
console.log(`${flag("--all") ? "Thiếu bản tiếng Anh" : "Mục MỚI thiếu bản tiếng Anh"}: ${show.length}${oldN && !flag("--all") ? ` (tồn đọng cũ: ${oldN}, xem --all)` : ""}`);
let cur = "";
for (const m of show) {
  if (m.file !== cur) { cur = m.file; console.log("\n" + cur); }
  const h = String(m.hint || "");
  console.log("  " + m.key + "  ←  " + (h.length > 100 ? h.slice(0, 97) + "…" : h));
}
console.log("\nXem CLAUDE.md, mục Song ngữ, để biết thêm vào đâu.");
process.exit(flag("--warn") ? 0 : 1);
