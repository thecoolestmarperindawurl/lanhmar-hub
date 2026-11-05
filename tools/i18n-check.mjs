#!/usr/bin/env node
/* Kiểm tra song ngữ VI/EN cho dữ liệu của web LANHMAR.

   Quy ước: trường chữ "x" phải có bản tiếng Anh "x_en" (kho-featured.json, kho-data.js, community-data.js);
   riêng assets/content.json dùng cặp "x_vi" / "x_en". Web tự hiện bản _en khi người xem chọn EN.

   Cách dùng:
     node tools/i18n-check.mjs              # liệt kê trường MỚI thiếu _en (bỏ qua tồn đọng trong tools/i18n-baseline.json); thiếu → exit 1
     node tools/i18n-check.mjs --all        # liệt kê cả tồn đọng
     node tools/i18n-check.mjs --todo i18n-todo.json   # xuất danh sách cần dịch (có chỗ điền "en")
     node tools/i18n-check.mjs --apply i18n-todo.json  # ghi bản dịch đã điền vào file .json (file .js thì in ra để sửa tay)
     node tools/i18n-check.mjs --baseline   # ghi lại tồn đọng hiện tại (chạy sau khi dịch bớt để thu nhỏ danh sách)
   Không cần cài gì thêm. Chạy tự động trên GitHub Actions ở mỗi push/PR (.github/workflows/i18n-check.yml). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const BASELINE = path.join(ROOT, "tools", "i18n-baseline.json");

// Trường chứa chữ cần dịch (ở mọi độ sâu). Trường khác chỉ được duyệt xuống nếu là object/mảng.
const TRANSLATABLE = new Set(["title", "note", "note2", "desc", "sub", "t", "d", "cap", "text", "head", "rows", "items", "status", "type",
  "badge", "btn", "label", "headline", "intro", "name", "ctasTitle", "lb", "tag", "tags", "role", "bio", "points", "topics", "n", "s", "members"]);
// Trường không bao giờ dịch (id, link, ảnh, ngày, mã…)
const SKIP = new Set(["id", "url", "u", "src", "thumb", "cover", "date", "asof", "k", "kho", "group", "shelf", "feed", "icon", "c", "fam", "w", "v",
  "hide", "photo", "logo", "platform", "email", "file", "companies", "growth", "valuation", "alias", "org", "sources"]);

const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
// Chuỗi cần dịch: có chữ cái, không phải link/đường dẫn/mã màu/ngày, và không phải một từ ASCII đơn (PDF, GitHub, 2026-10-22…)
function needs(s) {
  if (typeof s !== "string") return false;
  const x = s.trim();
  if (x.length < 2 || !/\p{L}/u.test(x)) return false;
  if (/^(https?:\/\/|assets\/|docs\/|#[0-9a-f]{3,8}$|\d{4}-\d{2}-\d{2}$)/i.test(x)) return false;
  if (VI.test(x)) return true;
  return !/^[\w.\-+#@/&]+$/.test(x);
}
const strList = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === "string" || (Array.isArray(x) && x.every((y) => typeof y === "string" || typeof y === "number")));
const listNeeds = (a) => a.some((x) => (Array.isArray(x) ? x.some(needs) : needs(x)));
const hasEn = (o, k) => { const e = o[k + "_en"]; return typeof e === "string" ? e.trim() !== "" : Array.isArray(e) ? e.length > 0 : false; };
const isPerson = (o) => o && typeof o === "object" && ("role" in o || "bio" in o || "photo" in o);

// Duyệt dữ liệu kiểu "x" / "x_en"
// Phần tử mảng có "id" thì nhận diện theo id (chèn/xoá ở giữa không làm lệch baseline), không có thì theo chỉ số
const seg = (x, i) => (x && typeof x === "object" && typeof x.id === "string" && x.id ? "{" + x.id + "}" : i);
function walk(o, keys, out) {
  if (Array.isArray(o)) { o.forEach((x, i) => walk(x, keys.concat(seg(x, i)), out)); return; }
  if (!o || typeof o !== "object") return;
  for (const k of Object.keys(o)) {
    if (k.endsWith("_en") || k.endsWith("_vi") || SKIP.has(k)) continue;
    const v = o[k];
    if (TRANSLATABLE.has(k) && !(k === "name" && isPerson(o))) {
      if (typeof v === "string") { if (needs(v) && !hasEn(o, k)) out.push({ keys: keys.concat(k), vi: v }); continue; }
      if (strList(v)) { if (listNeeds(v) && !hasEn(o, k)) out.push({ keys: keys.concat(k), vi: v }); continue; }
    }
    if (v && typeof v === "object") walk(v, keys.concat(k), out);
  }
}
// Duyệt dữ liệu kiểu "x_vi" / "x_en" (assets/content.json)
function walkVi(o, keys, out) {
  if (Array.isArray(o)) { o.forEach((x, i) => walkVi(x, keys.concat(seg(x, i)), out)); return; }
  if (!o || typeof o !== "object") return;
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (k.endsWith("_vi")) {
      const base = k.slice(0, -3), filled = typeof v === "string" ? v.trim() !== "" : Array.isArray(v) && v.length > 0;
      if (filled && !hasEn(o, base)) out.push({ keys: keys.concat(base), vi: v });
    } else if (v && typeof v === "object") walkVi(v, keys.concat(k), out);
  }
}

function loadJs(file, name) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), ctx, { filename: file });
  return ctx.window[name];
}
const SOURCES = [
  { file: "kho-featured.json", get: (f) => JSON.parse(fs.readFileSync(f, "utf8")).items, root: ["items"], walk },
  { file: "kho-data.js", get: (f) => loadJs(f, "KHO"), root: ["KHO"], walk },
  { file: "community-data.js", get: (f) => loadJs(f, "COMMUNITIES"), root: ["COMMUNITIES"], walk },
  { file: "assets/content.json", get: (f) => JSON.parse(fs.readFileSync(f, "utf8")), root: [], walk: walkVi }
];
const pathStr = (keys) => keys.map((k) => (typeof k === "number" || /^\{.*\}$/.test(k) ? "[" + k + "]" : "." + k)).join("").replace(/^\./, "");
const key = (m) => m.file + " › " + pathStr(m.keys);

// ---------- Thu thập ----------
let missing = [];
for (const s of SOURCES) {
  const f = path.join(ROOT, s.file);
  if (!fs.existsSync(f)) continue;
  let data;
  try { data = s.get(f); } catch (e) { console.error("✗ Không đọc được " + s.file + ": " + e.message); process.exitCode = 1; continue; }
  const out = [];
  s.walk(data, [], out);
  out.forEach((m) => missing.push({ file: s.file, keys: s.root.concat(m.keys), vi: m.vi }));
}

// ---------- --apply: ghi bản dịch vào file ----------
if (val("--apply")) {
  const todo = JSON.parse(fs.readFileSync(val("--apply"), "utf8")).filter((x) => x.en && String(x.en).trim());
  const byFile = {};
  todo.forEach((x) => (byFile[x.file] = byFile[x.file] || []).push(x));
  for (const file of Object.keys(byFile)) {
    const f = path.join(ROOT, file);
    if (!file.endsWith(".json")) {
      console.log("\n" + file + " là file .js, hãy thêm tay các trường sau:");
      byFile[file].forEach((x) => console.log("  " + pathStr(x.keys) + "_en = " + JSON.stringify(x.en)));
      continue;
    }
    const data = JSON.parse(fs.readFileSync(f, "utf8"));
    let n = 0;
    byFile[file].forEach((x) => {
      let o = data;
      for (const k of x.keys.slice(0, -1)) { o = Array.isArray(o) && /^\{.*\}$/.test(k) ? o.find((e) => e && e.id === k.slice(1, -1)) : o?.[k]; }
      if (!o || typeof o !== "object") return;
      o[x.keys[x.keys.length - 1] + "_en"] = x.en; n++;
    });
    fs.writeFileSync(f, JSON.stringify(data, null, 2));
    console.log("✓ " + file + ": đã ghi " + n + " bản dịch");
  }
  process.exit(0);
}

// ---------- Baseline (tồn đọng đã biết) ----------
let base = new Set();
try { base = new Set(JSON.parse(fs.readFileSync(BASELINE, "utf8"))); } catch { /* chưa có baseline */ }
if (flag("--baseline")) {
  fs.writeFileSync(BASELINE, JSON.stringify(missing.map(key), null, 2) + "\n");
  console.log("✓ Đã ghi " + missing.length + " mục tồn đọng vào tools/i18n-baseline.json");
  process.exit(0);
}
const fresh = missing.filter((m) => !base.has(key(m)));
const old = missing.filter((m) => base.has(key(m)));
const show = flag("--all") ? missing : fresh;

// ---------- --todo: xuất danh sách cần dịch ----------
if (val("--todo")) {
  fs.writeFileSync(val("--todo"), JSON.stringify(show.map((m) => ({ file: m.file, keys: m.keys, vi: m.vi, en: "" })), null, 2) + "\n");
  console.log("✓ Đã xuất " + show.length + " mục cần dịch ra " + val("--todo") + " — điền trường \"en\" rồi chạy --apply");
  process.exit(0);
}

// ---------- Báo cáo ----------
if (!show.length) {
  console.log("✓ Song ngữ đủ: không có trường mới thiếu _en" + (old.length ? " (tồn đọng cũ: " + old.length + ", xem --all)" : "") + ".");
  process.exit(process.exitCode || 0);
}
console.log((flag("--all") ? "Thiếu bản tiếng Anh: " : "Trường MỚI thiếu bản tiếng Anh: ") + show.length + (old.length && !flag("--all") ? " (tồn đọng cũ: " + old.length + ", xem --all)" : ""));
let cur = "";
for (const m of show) {
  if (m.file !== cur) { cur = m.file; console.log("\n" + cur); }
  const vi = Array.isArray(m.vi) ? JSON.stringify(m.vi) : m.vi;
  console.log("  " + pathStr(m.keys) + "  ←  " + (vi.length > 90 ? vi.slice(0, 87) + "…" : vi));
}
console.log("\nThêm trường <tên>_en cạnh mỗi trường trên (xem CLAUDE.md, mục Song ngữ). Xuất danh sách để dịch: --todo i18n-todo.json");
process.exit(flag("--warn") ? 0 : 1);
