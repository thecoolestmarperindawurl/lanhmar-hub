/* AI Convert — chuyển file sang Markdown cho AI Agent. Chạy 100% trong trình duyệt.
   Song ngữ VI/EN: dùng chung lựa chọn với trang chủ (localStorage "lm_lang"). */
(function () {
  "use strict";

  // ---------- Song ngữ ----------
  var I18N = {
    vi: {
      title: "AI Convert — LANHMAR",
      marquee: "★ FILE → MARKDOWN ★ AI-READY ★ VIBE CODE ★ ÍT TOKEN HƠN ★ FILE → MARKDOWN ★ AI-READY ★ VIBE CODE ★ ÍT TOKEN HƠN",
      back: "← Về portfolio",
      h1: "File → <em>Markdown</em> cho AI",
      lead: "Thả PDF, Word, Excel, PowerPoint, HTML hay file code vào đây. Mình chuyển hết sang Markdown sạch để Claude, ChatGPT, Cursor… đọc nhanh hơn, hiểu cấu trúc tốt hơn và tốn ít token hơn. <b>File được xử lý ngay trong trình duyệt của bạn, không tải lên máy chủ nào.</b>",
      drop_b: "Kéo thả file vào đây", drop_s: "hoặc bấm để chọn (chọn được nhiều file)",
      drop_f: "PDF · DOCX · XLSX/XLS/CSV · PPTX · EPUB · HTML · RSS · IPYNB · ZIP · TXT/MD · JSON/YAML/XML · file code",
      opts: "Tuỳ chọn làm sạch",
      o_front: "Thêm metadata đầu file (nguồn, loại, ước tính token)", o_pages: "Đánh dấu số trang / số slide",
      o_hf: "PDF: bỏ header/footer lặp lại & số trang", o_notes: "PPTX: lấy cả ghi chú người thuyết trình",
      o_space: "Gộp dòng trống thừa", o_rows1: "Excel: tối đa", o_rows2: "dòng/sheet",
      o_chunk1: "Chia đoạn khi vượt", o_chunk2: "(0 = không chia)",
      res_h: "Kết quả", copy_all: "Copy tất cả", dl_bundle: "Tải 1 file context.md", dl_zip: "Tải .zip (từng file + INDEX.md)", clear: "Xoá",
      tips_h: "Dùng trong vibe code thế nào?",
      tip1: "<b>Bỏ vào repo:</b> giải nén .zip vào thư mục <code>docs/context/</code>. Trong <code>CLAUDE.md</code> (hoặc <code>.cursorrules</code>) ghi một dòng: <i>“Tài liệu tham khảo nằm ở docs/context/, đọc INDEX.md trước.”</i> Agent sẽ chỉ mở đúng file cần, thay vì nhai cả PDF.",
      tip2: "<b>Dán thẳng vào chat:</b> dùng “Copy tất cả” hoặc file <code>context.md</code>. Mỗi tài liệu được bọc trong thẻ <code>&lt;document&gt;</code> để AI phân biệt nguồn.",
      tip3: "<b>Tài liệu dài:</b> bật “Chia đoạn” để mỗi phần vừa cửa sổ ngữ cảnh, đưa lần lượt từng phần.",
      tip4: "<b>Ảnh, sơ đồ, bản scan:</b> công cụ này chỉ lấy chữ. Với ảnh, gửi thẳng ảnh cho AI (các model hiện nay đọc được ảnh) sẽ chính xác hơn.",
      tok_note: "Ước tính token là con số thô (≈ số ký tự ÷ 4 với tiếng Anh, ÷ 3 với tiếng Việt có dấu), chỉ để so sánh. Số thật phụ thuộc tokenizer của từng model.",
      foot: "★ LANHMAR · AI Convert — xử lý cục bộ trong trình duyệt",
      // phần động
      busy: "Đang xử lý…", reading: "đang đọc…", skipped: "Bỏ qua",
      sum: function (ok, all, tok) { return ok + "/" + all + " file chuyển xong · tổng ≈ " + tok + " token (ước tính)"; },
      copy: "Copy", dl: "Tải .md", view: "Xem", hide: "Ẩn", copied: "Đã copy ✓", parts: "phần",
      copy_fail: "Trình duyệt không cho copy, hãy dùng nút Tải.",
      m_pages: "số trang", m_sheets: "số sheet", m_slides: "số slide",
      k_pdf: "PDF", k_word: "Word", k_sheet: "Bảng tính", k_ppt: "PowerPoint", k_html: "HTML", k_text: "Văn bản", k_code: "Code/dữ liệu",
      k_epub: "Sách EPUB", k_nb: "Notebook Jupyter", k_feed: "RSS/Atom", k_zip: "Tệp nén ZIP",
      m_chapters: "số chương", m_cells: "số ô", m_items: "số bài", m_files: "số file", m_encoding: "bảng mã",
      e_old: function (e) { return "File ." + e + " đời cũ: mở bằng Word/PowerPoint rồi lưu lại thành .docx/.pptx trước."; },
      e_img: "Ảnh: gửi thẳng ảnh cho AI sẽ chính xác hơn chuyển sang chữ.",
      e_fmt: function (e) { return "Chưa hỗ trợ định dạng ." + e; },
      e_empty: "Không đọc được chữ nào trong file.",
      e_lib: "Không tải được thư viện: ",
      w_scan: "PDF gần như không có lớp chữ (có thể là bản scan/ảnh). Hãy gửi thẳng file cho AI hoặc chạy OCR trước.",
      md_page: "Trang", md_slide: "Slide", md_sheet: "Sheet", md_notes: "Ghi chú", md_col: "Cột", md_img: "Hình",
      md_chart: "Biểu đồ", md_cat: "Hạng mục", md_series: "Chuỗi", md_file: "File", md_author: "Tác giả", md_publisher: "Nhà xuất bản",
      md_date: "Ngày", md_lang: "Ngôn ngữ", md_skip: "Bỏ qua trong file nén",
      md_more: function (n) { return "_Còn " + n + " file chưa đọc (giới hạn 200 file mỗi tệp nén)._"; },
      md_empty_sheet: "_(sheet trống)_",
      md_rows: function (n, cut) { return "_" + n + " dòng dữ liệu" + (cut ? ", đã cắt còn " + cut + " dòng đầu" : "") + "._"; },
      idx_h: "# INDEX — tài liệu tham khảo cho AI",
      idx_p: "Mỗi file dưới đây là bản Markdown của một tài liệu gốc. Đọc file này trước, rồi chỉ mở file liên quan tới việc đang làm.",
      idx_cols: "| File | Nguồn gốc | Loại | ≈ Token |",
      part_slug: "phan"
    },
    en: {
      title: "AI Convert — LANHMAR",
      marquee: "★ FILE → MARKDOWN ★ AI-READY ★ VIBE CODE ★ FEWER TOKENS ★ FILE → MARKDOWN ★ AI-READY ★ VIBE CODE ★ FEWER TOKENS",
      back: "← Back to portfolio",
      h1: "File → <em>Markdown</em> for AI",
      lead: "Drop in PDF, Word, Excel, PowerPoint, HTML or code files. I turn them into clean Markdown so Claude, ChatGPT, Cursor… read faster, understand the structure better and use fewer tokens. <b>Files are processed right in your browser and never uploaded to any server.</b>",
      drop_b: "Drag & drop files here", drop_s: "or click to choose (multiple files allowed)",
      drop_f: "PDF · DOCX · XLSX/XLS/CSV · PPTX · EPUB · HTML · RSS · IPYNB · ZIP · TXT/MD · JSON/YAML/XML · code files",
      opts: "Clean-up options",
      o_front: "Add metadata header (source, type, token estimate)", o_pages: "Mark page / slide numbers",
      o_hf: "PDF: remove repeated headers/footers & page numbers", o_notes: "PPTX: include speaker notes",
      o_space: "Collapse extra blank lines", o_rows1: "Excel: max", o_rows2: "rows/sheet",
      o_chunk1: "Split when over", o_chunk2: "(0 = no split)",
      res_h: "Results", copy_all: "Copy all", dl_bundle: "Download context.md", dl_zip: "Download .zip (files + INDEX.md)", clear: "Clear",
      tips_h: "How to use it when vibe coding",
      tip1: "<b>Put it in the repo:</b> unzip into <code>docs/context/</code>. In <code>CLAUDE.md</code> (or <code>.cursorrules</code>) add one line: <i>“Reference docs live in docs/context/, read INDEX.md first.”</i> The agent then opens only the file it needs instead of chewing through the whole PDF.",
      tip2: "<b>Paste straight into chat:</b> use “Copy all” or the <code>context.md</code> file. Each document is wrapped in a <code>&lt;document&gt;</code> tag so the AI can tell sources apart.",
      tip3: "<b>Long documents:</b> turn on “Split” so each part fits the context window, then feed them one by one.",
      tip4: "<b>Images, diagrams, scans:</b> this tool extracts text only. For images, sending the image itself to the AI (current models can read images) is more accurate.",
      tok_note: "Token counts are rough estimates (≈ characters ÷ 4 for English, ÷ 3 for accented Vietnamese), for comparison only. Real counts depend on each model's tokenizer.",
      foot: "★ LANHMAR · AI Convert — processed locally in your browser",
      busy: "Processing…", reading: "reading…", skipped: "Skipped",
      sum: function (ok, all, tok) { return ok + "/" + all + " files converted · ≈ " + tok + " tokens total (estimate)"; },
      copy: "Copy", dl: "Download .md", view: "View", hide: "Hide", copied: "Copied ✓", parts: "parts",
      copy_fail: "Your browser blocked copying, please use Download instead.",
      m_pages: "pages", m_sheets: "sheets", m_slides: "slides",
      k_pdf: "PDF", k_word: "Word", k_sheet: "Spreadsheet", k_ppt: "PowerPoint", k_html: "HTML", k_text: "Text", k_code: "Code/data",
      k_epub: "EPUB book", k_nb: "Jupyter notebook", k_feed: "RSS/Atom", k_zip: "ZIP archive",
      m_chapters: "chapters", m_cells: "cells", m_items: "items", m_files: "files", m_encoding: "encoding",
      e_old: function (e) { return "Legacy ." + e + " file: open it in Word/PowerPoint and save as .docx/.pptx first."; },
      e_img: "Image: sending the image itself to the AI is more accurate than converting it to text.",
      e_fmt: function (e) { return "Unsupported format ." + e; },
      e_empty: "No text could be read from this file.",
      e_lib: "Could not load library: ",
      w_scan: "This PDF has almost no text layer (probably a scan/image). Send the file to the AI directly or run OCR first.",
      md_page: "Page", md_slide: "Slide", md_sheet: "Sheet", md_notes: "Notes", md_col: "Column", md_img: "Image",
      md_chart: "Chart", md_cat: "Category", md_series: "Series", md_file: "File", md_author: "Author", md_publisher: "Publisher",
      md_date: "Date", md_lang: "Language", md_skip: "Skipped inside the archive",
      md_more: function (n) { return "_" + n + " more files not read (limit: 200 files per archive)._"; },
      md_empty_sheet: "_(empty sheet)_",
      md_rows: function (n, cut) { return "_" + n + " data rows" + (cut ? ", truncated to the first " + cut : "") + "._"; },
      idx_h: "# INDEX — reference docs for AI",
      idx_p: "Each file below is the Markdown version of a source document. Read this file first, then open only the files relevant to the task.",
      idx_cols: "| File | Source | Type | ≈ Tokens |",
      part_slug: "part"
    }
  };
  var lang = "vi";
  try { lang = localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch (_) { /* chế độ riêng tư */ }
  function T(k) { var v = I18N[lang][k]; return v !== undefined ? v : I18N.vi[k]; }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = T("title");
    document.querySelectorAll("[data-i]").forEach(function (e) { e.textContent = T(e.dataset.i); });
    document.querySelectorAll("[data-ih]").forEach(function (e) { e.innerHTML = T(e.dataset.ih); }); // chuỗi cố định trong I18N
    document.querySelectorAll(".lang button").forEach(function (b) { var on = b.dataset.lang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  }

  // Thư viện tải theo nhu cầu (chỉ khi gặp loại file cần đến)
  var LIBS = {
    pdf: ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"],
    pdfWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    mammoth: ["https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"],
    turndown: [
      "https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js",
      "https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js"
    ],
    xlsx: ["https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"],
    jszip: ["https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"]
  };
  var loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res;
      s.onerror = function () { delete loaded[src]; rej(new Error(T("e_lib") + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  function need(name) {
    return LIBS[name].reduce(function (p, src) { return p.then(function () { return loadScript(src); }); }, Promise.resolve());
  }

  var $ = function (id) { return document.getElementById(id); };
  var results = []; // {file, name, base, size, kind, md, meta, warn, error, lang}

  function opts() {
    return {
      front: $("oFront").checked, pages: $("oPages").checked, headFoot: $("oHeadFoot").checked,
      notes: $("oNotes").checked, space: $("oSpace").checked,
      rows: Math.max(10, parseInt($("oRows").value, 10) || 1000),
      chunk: Math.max(0, parseInt($("oChunk").value, 10) || 0)
    };
  }

  // ---------- Tiện ích ----------
  function ext(name) { var m = /\.([^.]+)$/.exec(name); return m ? m[1].toLowerCase() : ""; }
  function baseName(name) { return name.replace(/\.[^.]+$/, ""); }
  function slug(s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
      .replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "file";
  }
  function estTokens(text) {
    // Ước tính thô: tiếng Việt có dấu tách token nhiều hơn tiếng Anh.
    var vi = (text.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi) || []).length;
    var ratio = vi / Math.max(1, text.length) > 0.03 ? 3 : 4;
    return Math.ceil(text.length / ratio);
  }
  function fmtNum(n) { return n.toLocaleString(lang === "en" ? "en-US" : "vi-VN"); }
  function fmtSize(b) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
  function tidy(md, o) {
    // NFC: chữ Việt dạng tổ hợp (file từ Mac, Windows-1258) tốn token gấp đôi; bỏ ký tự vô hình (zero-width, soft hyphen)
    md = md.normalize("NFC").replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "");
    md = md.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").replace(/ /g, " ");
    md = md.replace(/^(\s*)([-*]|\d+\.) {2,}/gm, "$1$2 ");
    if (o.space) md = md.replace(/\n{3,}/g, "\n\n");
    return md.trim() + "\n";
  }
  function cell(v) {
    if (v === null || v === undefined) return "";
    return String(v).replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>").trim();
  }
  function mdTable(rows) {
    var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
    if (!w) return "";
    var pad = function (r) { var a = r.slice(); while (a.length < w) a.push(""); return a; };
    var head = pad(rows[0]).map(function (c, i) { return cell(c) || T("md_col") + " " + (i + 1); });
    var out = ["| " + head.join(" | ") + " |", "|" + head.map(function () { return " --- "; }).join("|") + "|"];
    rows.slice(1).forEach(function (r) { out.push("| " + pad(r).map(cell).join(" | ") + " |"); });
    return out.join("\n");
  }
  // Đọc file chữ với bảng mã tự nhận (như charset_normalizer của markitdown): BOM → UTF-8 → bảng mã cũ hợp lý nhất
  var LEGACY = [
    { enc: "windows-1258", re: /[\u00A0-\u024F\u0300-\u036F\u1EA0-\u1EF9\u2013\u2014\u2018-\u201E\u2026\u20AB]/ },
    { enc: "shift_jis", re: /[\u3000-\u30FF\u4E00-\u9FFF\uFF01-\uFF60]/ },
    { enc: "gb18030", re: /[\u3000-\u303F\u4E00-\u9FFF\uFF01-\uFF60]/ },
    { enc: "big5", re: /[\u3000-\u303F\u4E00-\u9FFF\uFF01-\uFF60]/ },
    { enc: "euc-kr", re: /[\uAC00-\uD7A3\u3000-\u303F\u4E00-\u9FFF\uFF01-\uFF60]/ }
  ];
  async function readText(file) {
    var b = new Uint8Array(await file.arrayBuffer());
    var dec = function (enc, bytes, fatal) { return new TextDecoder(enc, fatal ? { fatal: true } : undefined).decode(bytes); };
    if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return { text: dec("utf-8", b.subarray(3)), enc: "utf-8" };
    if (b[0] === 0xFF && b[1] === 0xFE) return { text: dec("utf-16le", b.subarray(2)), enc: "utf-16le" };
    if (b[0] === 0xFE && b[1] === 0xFF) return { text: dec("utf-16be", b.subarray(2)), enc: "utf-16be" };
    try { return { text: dec("utf-8", b, true), enc: "utf-8" }; } catch (_) { /* không phải UTF-8 */ }
    var best = null;
    LEGACY.forEach(function (c) {
      var t; try { t = dec(c.enc, b, true); } catch (_) { return; }
      var hi = t.match(/[^\x00-\x7F]/g) || [];
      var score = hi.length ? hi.filter(function (ch) { return c.re.test(ch); }).length / hi.length : 1;
      if (!best || score > best.score) best = { text: t, enc: c.enc, score: score };
    });
    return best || { text: dec("windows-1252", b), enc: "windows-1252" };
  }
  function encMeta(enc) { return enc && enc !== "utf-8" ? { m_encoding: enc } : {}; }

  // Nhận diện theo nội dung, không chỉ theo đuôi file (file tải về hay bị đặt sai đuôi / mất đuôi)
  async function sniff(file) {
    var b = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "pdf"; // %PDF
    if (!(b[0] === 0x50 && b[1] === 0x4B && (b[2] === 3 || b[2] === 5))) return "";     // PK..
    await need("jszip");
    var z = await window.JSZip.loadAsync(file);
    file._zip = z;
    if (z.file("word/document.xml")) return "docx";
    if (z.file("ppt/presentation.xml")) return "pptx";
    if (z.file("xl/workbook.xml")) return "xlsx";
    if (z.file("META-INF/container.xml") || (z.file("mimetype") && /epub/.test(await z.file("mimetype").async("string")))) return "epub";
    return "zip";
  }
  async function zipOf(file) { return file._zip || (file._zip = await window.JSZip.loadAsync(await file.arrayBuffer())); }
  function kids(el, name) { return Array.prototype.filter.call(el ? el.children : [], function (c) { return !name || c.localName === name; }); }
  function kid(el, name) { return kids(el, name)[0] || null; }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }

  var LANG = { js: "javascript", jsx: "jsx", ts: "typescript", tsx: "tsx", py: "python", css: "css", sql: "sql", sh: "bash",
    gs: "javascript", java: "java", go: "go", rb: "ruby", php: "php", json: "json", yaml: "yaml", yml: "yaml", xml: "xml" };

  // ---------- Bộ chuyển đổi ----------
  function turndownSvc() {
    var td = new window.TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
    if (window.turndownPluginGfm) td.use(window.turndownPluginGfm.gfm);
    td.remove(["script", "style", "noscript", "iframe", "svg", "canvas"]);
    // Bảng HTML bất kỳ → bảng Markdown (Word không có <th> nên plugin GFM bỏ qua)
    td.addRule("anyTable", {
      filter: "table",
      replacement: function (c, n) {
        var rows = Array.prototype.slice.call(n.rows || []).map(function (tr) {
          return Array.prototype.slice.call(tr.cells).map(function (cl) { return cl.textContent.replace(/\s+/g, " ").trim(); });
        }).filter(function (r) { return r.some(Boolean); });
        return rows.length ? "\n\n" + mdTable(rows) + "\n\n" : "";
      }
    });
    // Link (theo markitdown): bỏ javascript:/data:… và neo nội trang (#…) — chỉ giữ chữ; mã hoá dấu cách, ngoặc trong URL
    td.addRule("safeLink", {
      filter: function (n) { return n.nodeName === "A" && n.getAttribute("href"); },
      replacement: function (c, n) {
        var href = n.getAttribute("href").trim(), m = /^([a-z][a-z0-9+.-]*):/i.exec(href);
        if (!c.trim()) return "";
        if (href.charAt(0) === "#" || (m && !/^(https?|file|mailto)$/i.test(m[1]))) return c;
        if (n.closest && n.closest("pre")) return c;
        if (c.trim().replace(/\\(.)/g, "$1") === href) return "<" + href + ">";
        return "[" + c + "](" + href.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29") + ")";
      }
    });
    td.addRule("checkbox", {
      filter: function (n) { return n.nodeName === "INPUT" && (n.getAttribute("type") || "").toLowerCase() === "checkbox"; },
      replacement: function (c, n) { return n.hasAttribute("checked") ? "[x] " : "[ ] "; }
    });
    td.addRule("dropImg", { filter: "img", replacement: function (c, n) { var a = n.getAttribute("alt"); return a ? "[" + T("md_img") + ": " + a + "]" : ""; } });
    return td;
  }

  async function fromPdf(file, o) {
    await need("pdf");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    var doc = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    var pages = [];
    var sizes = [];
    for (var p = 1; p <= doc.numPages; p++) {
      var page = await doc.getPage(p);
      var py0 = page.view[1], ph = (page.view[3] - page.view[1]) || 842, pw = (page.view[2] - page.view[0]) || 595;
      var tc = await page.getTextContent();
      // Gom các mẩu chữ theo toạ độ y thành dòng
      var lines = [];
      tc.items.forEach(function (it) {
        if (!it.str || !it.str.trim()) return;
        var y = Math.round(it.transform[5]), x = it.transform[4], h = Math.abs(it.transform[3]) || it.height || 0;
        var line = lines.find(function (l) { return Math.abs(l.y - y) <= Math.max(2, h * 0.4); });
        if (!line) { line = { y: y, parts: [], size: 0 }; lines.push(line); }
        line.parts.push({ x: x, s: it.str, w: it.width || 0 });
        line.size = Math.max(line.size, h);
      });
      lines.sort(function (a, b) { return b.y - a.y; });
      var out = lines.map(function (l) {
        l.parts.sort(function (a, b) { return a.x - b.x; });
        var txt = "", end = null;
        l.parts.forEach(function (pt) {
          if (end !== null && pt.x - end > 1.5 && !/\s$/.test(txt) && !/^\s/.test(pt.s)) txt += " ";
          txt += pt.s; end = pt.x + pt.w;
        });
        sizes.push(l.size);
        var rel = (l.y - py0) / ph;
        return { text: txt.replace(/\s+/g, " ").trim(), size: l.size, y: l.y, edge: rel > 0.92 || rel < 0.08, cells: pdfCells(l), pw: pw };
      }).filter(function (l) { return l.text; });
      pages.push(out);
      page.cleanup(); // giải phóng bộ nhớ từng trang (PDF dài)
    }

    // Header/footer: dòng trong vùng lề trên/dưới (8% chiều cao trang) lặp lại trên >= 50% số trang, hoặc là số trang
    if (o.headFoot && pages.length >= 3) {
      var cnt = {}, drop = {};
      var key = function (t) { return t.replace(/\d+/g, "#").toLowerCase(); };
      pages.forEach(function (ls) {
        var seen = {};
        ls.filter(function (l) { return l.edge; }).forEach(function (l) { var k = key(l.text); if (!seen[k]) { seen[k] = 1; cnt[k] = (cnt[k] || 0) + 1; } });
      });
      Object.keys(cnt).forEach(function (k) { if (cnt[k] >= Math.ceil(pages.length * 0.5)) drop[k] = 1; });
      pages = pages.map(function (ls) {
        return ls.filter(function (l) {
          if (!l.edge) return true;
          if (drop[key(l.text)]) return false;
          return !/^(trang|page)?\s*\d+(\s*(\/|of|trên)\s*\d+)?$/i.test(l.text);
        });
      });
    }

    // Số hiệu kiểu MasterFormat (".1", ".2") bị tách riêng một dòng → ghép với dòng sau (theo markitdown)
    pages = pages.map(function (ls) {
      var out = [];
      for (var j = 0; j < ls.length; j++) {
        if (/^\.\d+$/.test(ls[j].text) && ls[j + 1]) {
          var nx = Object.assign({}, ls[j + 1]); nx.text = ls[j].text + " " + nx.text; nx.noTable = true;
          out.push(nx); j++;
        } else out.push(ls[j]);
      }
      return out;
    });

    // Đoán tiêu đề theo cỡ chữ so với cỡ chữ phổ biến nhất
    var body = (function () {
      var c = {}; sizes.forEach(function (s) { var r = Math.round(s); c[r] = (c[r] || 0) + 1; });
      return +Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0] || 10;
    })();

    var md = [];
    var chars = 0;
    pages.forEach(function (ls, i) {
      if (o.pages) md.push("\n<!-- " + T("md_page") + " " + (i + 1) + " -->\n");
      var para = [];
      var flush = function () { if (para.length) { md.push(para.join(" ").replace(/(\w)- (\w)/g, "$1$2")); md.push(""); para = []; } };
      var regions = pdfTables(ls), skipTo = -1;
      ls.forEach(function (l, j) {
        chars += l.text.length;
        if (j < skipTo) return;
        var tb = regions.find(function (t) { return t.start === j; });
        if (tb) { flush(); md.push(mdTable(tb.rows), ""); skipTo = tb.end; return; }
        var ratio = l.size / body;
        if (ratio >= 1.15 && l.text.length < 120) {
          flush();
          md.push((ratio >= 1.6 ? "# " : ratio >= 1.3 ? "## " : "### ") + l.text); md.push("");
          return;
        }
        if (/^([•●▪◦\-–*]|\d+[.)])\s+/.test(l.text)) { flush(); md.push(l.text.replace(/^[•●▪◦–*]\s+/, "- ")); return; }
        // Khoảng cách dòng lớn → đoạn mới
        var prev = ls[j - 1];
        if (prev && prev.y - l.y > l.size * 1.9) flush();
        para.push(l.text);
      });
      flush();
    });

    return { md: md.join("\n"), meta: { m_pages: doc.numPages }, warn: chars < doc.numPages * 30 ? "w_scan" : "" };
  }

  // Một dòng PDF → các ô chữ (mảnh cách nhau xa hơn ~1 cỡ chữ là ô khác)
  function pdfCells(l) {
    var cells = [], gap = Math.max(4, l.size * 1.0);
    l.parts.forEach(function (pt) {
      var last = cells[cells.length - 1], x1 = pt.x + pt.w;
      if (last && pt.x - last.x1 <= gap) { last.t += (pt.x - last.x1 > 1.5 && !/\s$/.test(last.t) && !/^\s/.test(pt.s) ? " " : "") + pt.s; last.x1 = Math.max(last.x1, x1); }
      else cells.push({ x: pt.x, x1: x1, t: pt.s });
    });
    return cells.map(function (c) { c.t = c.t.replace(/\s+/g, " ").trim(); return c; }).filter(function (c) { return c.t; });
  }

  // Bảng không kẻ khung (port từ markitdown _extract_form_content_from_words): các dòng ≥ 3 ô chung cột → bảng Markdown
  function pdfTables(ls) {
    if (ls.length < 2) return [];
    var pw = ls[0].pw || 595;
    var info = ls.map(function (l) {
      var c = l.cells, w = c.length ? c[c.length - 1].x1 - c[0].x : 0;
      return { para: l.noTable || (w > pw * 0.55 && l.text.length > 60) || c.length < 2, c: c };
    });
    var xs = [];
    info.forEach(function (r) { if (!r.para && r.c.length >= 3) r.c.forEach(function (c) { xs.push(c.x); }); });
    if (xs.length < 6) return [];
    xs.sort(function (a, b) { return a - b; });
    // Ngưỡng gom cột thích nghi: phân vị 70 của khoảng cách giữa các mốc x, kẹp trong [25, 50]
    var gaps = [];
    for (var i = 1; i < xs.length; i++) if (xs[i] - xs[i - 1] > 5) gaps.push(xs[i] - xs[i - 1]);
    gaps.sort(function (a, b) { return a - b; });
    var tol = gaps.length >= 3 ? Math.max(25, Math.min(50, gaps[Math.floor(gaps.length * 0.7)])) : 35;
    var cols = [];
    xs.forEach(function (x) { if (!cols.length || x - cols[cols.length - 1] > tol) cols.push(x); });
    if (cols.length < 2) return [];
    var span = cols[cols.length - 1] - cols[0];
    if (span / cols.length < 30 || cols.length / (span / 72) > 10 || cols.length > Math.max(15, Math.floor(20 * pw / 612))) return [];
    var colOf = function (x) {
      for (var k = 0; k < cols.length - 1; k++) if (x < cols[k + 1] - 20) return k;
      return cols.length - 1;
    };
    info.forEach(function (r) {
      if (r.para) { r.tab = false; return; }
      var hit = {};
      r.c.forEach(function (c) { for (var k = 0; k < cols.length; k++) if (Math.abs(c.x - cols[k]) < 40) { hit[k] = 1; break; } });
      r.tab = Object.keys(hit).length >= 2;
    });
    var out = [];
    for (var s = 0; s < info.length; s++) {
      if (!info[s].tab) continue;
      var e = s; while (e < info.length && info[e].tab) e++;
      if (e - s >= 2) {
        var rows = info.slice(s, e).map(function (r) {
          var a = cols.map(function () { return ""; });
          r.c.forEach(function (c) { var k = colOf(c.x); a[k] = a[k] ? a[k] + " " + c.t : c.t; });
          return a;
        });
        var used = cols.map(function (_, k) { return rows.some(function (r) { return r[k]; }); });
        rows = rows.map(function (r) { return r.filter(function (_, k) { return used[k]; }); });
        // Ô dài (> 30 ký tự) chiếm > 30% → là văn xuôi dàn cột, không phải bảng
        var cellsAll = [].concat.apply([], rows).filter(Boolean);
        var long = cellsAll.filter(function (t) { return t.length > 30; }).length;
        if (rows[0].length >= 2 && long <= cellsAll.length * 0.3) out.push({ start: s, end: e, rows: rows });
      }
      s = e;
    }
    return out;
  }

  async function fromDocx(file) {
    await need("mammoth"); await need("turndown");
    var r = await window.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, {
      convertImage: window.mammoth.images.imgElement(function () { return Promise.resolve({ src: "" }); })
    });
    return { md: turndownSvc().turndown(r.value), meta: {} };
  }

  async function fromSheet(file, o) {
    await need("xlsx");
    var isText = /^(csv|tsv)$/.test(ext(file.name));
    var rt = isText ? await readText(file) : null;
    var wb = isText
      ? window.XLSX.read(rt.text, { type: "string", FS: ext(file.name) === "tsv" ? "\t" : undefined, raw: true })
      : window.XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    var md = [];
    wb.SheetNames.forEach(function (n) {
      var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: "", blankrows: false });
      rows = rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
      // Bỏ cột trống hoàn toàn
      var w = rows.reduce(function (m, r) { return Math.max(m, r.length); }, 0);
      var keep = [];
      for (var c = 0; c < w; c++) if (rows.some(function (r) { return String(r[c] || "").trim() !== ""; })) keep.push(c);
      rows = rows.map(function (r) { return keep.map(function (c) { return r[c]; }); });
      if (!isText || wb.SheetNames.length > 1) md.push("## " + T("md_sheet") + ": " + n, "");
      if (!rows.length) { md.push(T("md_empty_sheet"), ""); return; }
      var total = rows.length - 1;
      md.push(mdTable(rows.slice(0, o.rows + 1)), "");
      md.push(T("md_rows")(fmtNum(total), total > o.rows ? fmtNum(o.rows) : ""), "");
    });
    return { md: md.join("\n"), meta: Object.assign({ m_sheets: wb.SheetNames.length }, encMeta(rt && rt.enc)) };
  }

  async function fromPptx(file, o) {
    await need("jszip");
    var zip = await zipOf(file);
    var slides = Object.keys(zip.files).filter(function (p) { return /^ppt\/slides\/slide\d+\.xml$/.test(p); })
      .sort(function (a, b) { return +a.match(/(\d+)\.xml$/)[1] - +b.match(/(\d+)\.xml$/)[1]; });
    var parser = new DOMParser();
    var A = "http://schemas.openxmlformats.org/drawingml/2006/main";
    var P = "http://schemas.openxmlformats.org/presentationml/2006/main";
    var C = "http://schemas.openxmlformats.org/drawingml/2006/chart";
    var R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    var xml = function (t) { return parser.parseFromString(t, "application/xml"); };
    // Vị trí (trên → dưới, trái → phải) như markitdown: hình không có toạ độ (placeholder) đứng đầu
    var pos = function (el) {
      var off = el.getElementsByTagNameNS(A, "off")[0];
      return off ? [+off.getAttribute("y") || 0, +off.getAttribute("x") || 0] : [-1e15, -1e15];
    };
    function textParas(sp) {
      return Array.prototype.slice.call(sp.getElementsByTagNameNS(A, "p")).map(function (p) {
        var pPr = p.getElementsByTagNameNS(A, "pPr")[0];
        var lvl = +((pPr && pPr.getAttribute("lvl")) || 0);
        var t = Array.prototype.slice.call(p.getElementsByTagNameNS(A, "t")).map(function (n) { return n.textContent; }).join("").trim();
        return { t: t, lvl: lvl };
      }).filter(function (x) { return x.t; });
    }
    function paras(src) {
      var d = xml(src), title = "", body = [];
      function walk(parent) {
        kids(parent).filter(function (k) { return /^(sp|grpSp|graphicFrame|pic)$/.test(k.localName); })
          .map(function (k, i) { return { k: k, p: pos(k), i: i }; })
          .sort(function (a, b) { return a.p[0] - b.p[0] || a.p[1] - b.p[1] || a.i - b.i; })
          .forEach(function (e) {
            var k = e.k;
            if (k.localName === "grpSp") return walk(k);
            if (k.localName === "pic") {
              var nv = k.getElementsByTagNameNS(P, "cNvPr")[0];
              var alt = nv ? (nv.getAttribute("descr") || "").replace(/\s+/g, " ").trim() : "";
              if (alt) body.push({ t: "[" + T("md_img") + ": " + alt + "]", lvl: 0 });
              return;
            }
            if (k.localName === "graphicFrame") {
              var tb = k.getElementsByTagNameNS(A, "tbl")[0];
              if (tb) {
                var rows = Array.prototype.slice.call(tb.getElementsByTagNameNS(A, "tr")).map(function (tr) {
                  return Array.prototype.slice.call(tr.getElementsByTagNameNS(A, "tc")).map(function (tc) { return tc.textContent.trim(); });
                });
                if (rows.length) body.push({ table: mdTable(rows) });
              }
              var ch = k.getElementsByTagNameNS(C, "chart")[0];
              if (ch) body.push({ chart: ch.getAttributeNS(R, "id") || ch.getAttribute("r:id") });
              return;
            }
            var ph = k.getElementsByTagNameNS(P, "ph")[0];
            var type = ph ? ph.getAttribute("type") || "" : "";
            var ps = textParas(k);
            if (!ps.length) return;
            if (/title/i.test(type) && !title) title = ps.map(function (x) { return x.t; }).join(" ");
            else if (type !== "sldNum" && type !== "dt" && type !== "ftr") body = body.concat(ps);
          });
      }
      var tree = d.getElementsByTagNameNS(P, "spTree")[0];
      if (tree) walk(tree);
      return { title: title, body: body };
    }
    async function rels(path) {
      var f = zip.file(path.replace(/([^/]+)$/, "_rels/$1.rels")), map = {};
      if (!f) return map;
      Array.prototype.forEach.call(xml(await f.async("string")).getElementsByTagName("Relationship"), function (r) { map[r.getAttribute("Id")] = r.getAttribute("Target"); });
      return map;
    }
    function resolve(from, target) {
      var parts = from.split("/").slice(0, -1);
      target.split("/").forEach(function (seg) { if (seg === "..") parts.pop(); else if (seg && seg !== ".") parts.push(seg); });
      return parts.join("/");
    }
    // Biểu đồ → bảng số liệu (hạng mục × chuỗi), như markitdown _convert_chart_to_markdown
    async function chartMd(path) {
      var f = zip.file(path); if (!f) return "";
      var d = xml(await f.async("string"));
      var ttl = d.getElementsByTagNameNS(C, "title")[0];
      var name = ttl ? Array.prototype.map.call(ttl.getElementsByTagNameNS(A, "t"), function (n) { return n.textContent; }).join("").trim() : "";
      var pts = function (el) {
        var m = {};
        if (el) Array.prototype.forEach.call(el.getElementsByTagNameNS(C, "pt"), function (pt) { m[+pt.getAttribute("idx")] = txt(pt.getElementsByTagNameNS(C, "v")[0]); });
        return m;
      };
      var sers = Array.prototype.slice.call(d.getElementsByTagNameNS(C, "ser")).map(function (s, i) {
        var tx = kid(s, "tx");
        return {
          name: (tx && txt(tx.getElementsByTagNameNS(C, "v")[0])) || T("md_series") + " " + (i + 1),
          cat: pts(kid(s, "cat") || kid(s, "xVal")), val: pts(kid(s, "val") || kid(s, "yVal"))
        };
      });
      if (!sers.length) return "";
      var idx = {};
      sers.forEach(function (s) { Object.keys(s.cat).concat(Object.keys(s.val)).forEach(function (k) { idx[k] = 1; }); });
      var cats = sers.find(function (s) { return Object.keys(s.cat).length; });
      var rows = [[T("md_cat")].concat(sers.map(function (s) { return s.name; }))];
      Object.keys(idx).map(Number).sort(function (a, b) { return a - b; }).forEach(function (k) {
        rows.push([cats && cats.cat[k] !== undefined ? cats.cat[k] : String(k + 1)].concat(sers.map(function (s) { return s.val[k] !== undefined ? s.val[k] : ""; })));
      });
      return "### " + T("md_chart") + (name ? ": " + name : "") + "\n\n" + mdTable(rows);
    }
    var md = [];
    for (var i = 0; i < slides.length; i++) {
      var s = paras(await zip.file(slides[i]).async("string"));
      var rl = await rels(slides[i]);
      var label = T("md_slide") + " " + (i + 1);
      md.push("## " + (o.pages ? label + (s.title ? ": " + s.title : "") : (s.title || label)), "");
      for (var j = 0; j < s.body.length; j++) {
        var b = s.body[j];
        if (b.table) md.push("", b.table, "");
        else if (b.chart) { var cm = rl[b.chart] ? await chartMd(resolve(slides[i], rl[b.chart])) : ""; if (cm) md.push("", cm, ""); }
        else md.push("  ".repeat(b.lvl) + "- " + b.t);
      }
      if (o.notes) {
        var nt = Object.keys(rl).map(function (k) { return rl[k]; }).find(function (t) { return /notesSlide\d+\.xml$/.test(t); });
        var nf = nt && zip.file(resolve(slides[i], nt));
        if (nf) {
          var notes = paras(await nf.async("string")).body.map(function (b) { return b.t; }).filter(Boolean)
            .filter(function (t) { return !/^\d+$/.test(t); });
          if (notes.length) md.push("", "> **" + T("md_notes") + ":** " + notes.join(" "));
        }
      }
      md.push("");
    }
    return { md: md.join("\n"), meta: { m_slides: slides.length } };
  }

  function htmlToMd(html, keepNav) {
    var d = new DOMParser().parseFromString(html, "text/html");
    d.querySelectorAll("script,style,noscript,iframe,svg,template" + (keepNav ? "" : ",nav,footer,aside,form")).forEach(function (n) { n.remove(); });
    var root = (!keepNav && d.querySelector("main,article")) || d.body || d.documentElement;
    return { md: turndownSvc().turndown(root.innerHTML || ""), title: txt(d.querySelector("title")) };
  }

  async function fromHtml(file) {
    await need("turndown");
    var rt = await readText(file);
    var h = htmlToMd(rt.text);
    var md = h.md;
    if (h.title && !/^#\s/.test(md)) md = "# " + h.title + "\n\n" + md;
    return { md: md, meta: encMeta(rt.enc) };
  }

  // EPUB: đọc container.xml → .opf → metadata Dublin Core + thứ tự spine, mỗi chương HTML → Markdown (như markitdown)
  async function fromEpub(file) {
    await need("jszip"); await need("turndown");
    var z = await zipOf(file), parser = new DOMParser();
    var xml = function (t) { return parser.parseFromString(t, "application/xml"); };
    var cf = z.file("META-INF/container.xml");
    var opfPath = cf ? (xml(await cf.async("string")).getElementsByTagName("rootfile")[0] || { getAttribute: function () { return ""; } }).getAttribute("full-path") : "";
    if (!opfPath) opfPath = Object.keys(z.files).find(function (n) { return /\.opf$/i.test(n); }) || "";
    var opf = xml(await z.file(opfPath).async("string"));
    var DC = "http://purl.org/dc/elements/1.1/";
    var dc = function (n) { return Array.prototype.map.call(opf.getElementsByTagNameNS(DC, n), txt).filter(Boolean); };
    var base = opfPath.split("/").slice(0, -1);
    var manifest = {};
    Array.prototype.forEach.call(opf.getElementsByTagNameNS("*", "item"), function (it) { manifest[it.getAttribute("id")] = it.getAttribute("href"); });
    var resolve = function (href) {
      var parts = base.slice();
      href.split("#")[0].split("/").forEach(function (seg) { if (seg === "..") parts.pop(); else if (seg && seg !== ".") parts.push(seg); });
      var raw = parts.join("/"), dec = raw;
      try { dec = decodeURIComponent(raw); } catch (_) { /* giữ nguyên */ }
      return z.file(dec) ? dec : raw;
    };
    var spine = Array.prototype.map.call(opf.getElementsByTagNameNS("*", "itemref"), function (r) { return manifest[r.getAttribute("idref")]; })
      .filter(Boolean).map(resolve);
    var title = dc("title")[0] || "", head = [];
    if (title) head.push("# " + title, "");
    [["md_author", dc("creator").join(", ")], ["md_publisher", dc("publisher")[0]], ["md_date", dc("date")[0]], ["md_lang", dc("language")[0]]]
      .forEach(function (kv) { if (kv[1]) head.push("- **" + T(kv[0]) + ":** " + kv[1]); });
    var desc = dc("description")[0];
    if (desc) head.push("", htmlToMd(desc, true).md);
    var parts = [head.join("\n")], n = 0;
    for (var i = 0; i < spine.length; i++) {
      var f = z.file(spine[i]); if (!f) continue;
      var md = htmlToMd(await f.async("string"), true).md.trim();
      if (md) { parts.push(md); n++; }
    }
    return { md: parts.join("\n\n"), meta: { m_chapters: n } };
  }

  // Jupyter notebook: ô markdown giữ nguyên, ô code bọc theo ngôn ngữ kernel, bỏ output (tốn token, thường là rác hiển thị)
  async function fromIpynb(file) {
    var rt = await readText(file), nb = JSON.parse(rt.text.replace(/^﻿/, ""));
    var meta = nb.metadata || {};
    var lang = (meta.kernelspec && meta.kernelspec.language) || (meta.language_info && meta.language_info.name) || "python";
    var src = function (c) { return Array.isArray(c.source) ? c.source.join("") : String(c.source || ""); };
    var cells = (nb.cells || []).map(function (c) {
      var t = src(c).replace(/\s+$/, "");
      if (!t) return "";
      if (c.cell_type === "markdown") return t;
      var fence = /```/.test(t) ? "````" : "```";
      return fence + (c.cell_type === "code" ? lang : "") + "\n" + t + "\n" + fence;
    }).filter(Boolean);
    var md = cells.join("\n\n");
    if (meta.title && !/^#\s/.test(md)) md = "# " + meta.title + "\n\n" + md;
    return { md: md, meta: { m_cells: (nb.cells || []).length } };
  }

  // RSS 2.0 / RSS 1.0 (RDF) / Atom → mỗi bài một mục; file XML khác → khối code
  async function fromXml(file) {
    var rt = await readText(file);
    var d = new DOMParser().parseFromString(rt.text, "application/xml");
    var root = d.documentElement, name = root ? root.localName : "";
    if (!/^(rss|feed|RDF)$/.test(name) || d.getElementsByTagName("parsererror").length) return fromText(file, rt);
    await need("turndown");
    var body = function (el) {
      if (!el) return "";
      var t = el.textContent.trim(), type = el.getAttribute("type") || "";
      if (type === "xhtml") return turndownSvc().turndown(el.innerHTML || t);
      return /<[a-z][\s\S]*>/i.test(t) || /html/.test(type) ? htmlToMd(t, true).md : t;
    };
    var md = [], items;
    if (name === "feed") {
      md.push("# " + txt(kid(root, "title")), txt(kid(root, "subtitle")));
      items = kids(root, "entry").map(function (e) {
        var link = kids(e, "link").find(function (l) { return (l.getAttribute("rel") || "alternate") === "alternate"; });
        return { t: txt(kid(e, "title")), d: txt(kid(e, "updated") || kid(e, "published")), l: link ? link.getAttribute("href") : "", b: body(kid(e, "content") || kid(e, "summary")) };
      });
    } else {
      var ch = name === "rss" ? kid(root, "channel") : kid(root, "channel");
      md.push("# " + txt(kid(ch, "title")), txt(kid(ch, "description")));
      var holder = name === "rss" ? ch : root;
      items = kids(holder, "item").map(function (e) {
        var enc = kid(e, "encoded");
        return { t: txt(kid(e, "title")), d: txt(kid(e, "pubDate") || kid(e, "date")), l: txt(kid(e, "link")), b: body(enc || kid(e, "description")) };
      });
    }
    items.forEach(function (it) {
      md.push("", "## " + (it.t || "—"));
      var line = [it.d, it.l ? "<" + it.l + ">" : ""].filter(Boolean).join(" · ");
      if (line) md.push("_" + line + "_");
      if (it.b) md.push("", it.b);
    });
    return { md: md.filter(function (x, i) { return i > 1 || x !== "# "; }).join("\n"), meta: Object.assign({ m_items: items.length }, encMeta(rt.enc)), kind: "k_feed" };
  }

  // ZIP: chuyển từng file bên trong (một cấp), tiêu đề của file con hạ một bậc để giữ cây mục lục
  async function fromZip(file, o) {
    await need("jszip");
    var z = await zipOf(file), LIMIT = 200;
    var entries = Object.keys(z.files).map(function (n) { return z.files[n]; })
      .filter(function (f) { return !f.dir && !/(^|\/)(__MACOSX|\.[^/]*)(\/|$)/.test(f.name); })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
    var md = [], skipped = [], n = 0;
    for (var i = 0; i < entries.length && i < LIMIT; i++) {
      var f = entries[i], inner = new File([await f.async("blob")], f.name.split("/").pop());
      var p = await route(inner);
      if (!p[0] || p[0] === "k_zip") { skipped.push(f.name); continue; }
      try {
        var out = await p[1](inner, o);
        if (!out.md || !out.md.trim()) { skipped.push(f.name); continue; }
        md.push("## " + T("md_file") + ": " + f.name, "", demote(out.md.trim()), "");
        n++;
      } catch (e) { skipped.push(f.name + " (" + (e && e.message ? e.message : e) + ")"); }
    }
    if (skipped.length) md.push("## " + T("md_skip"), "", skipped.map(function (x) { return "- " + x; }).join("\n"), "");
    if (entries.length > LIMIT) md.push(T("md_more")(entries.length - LIMIT));
    return { md: md.join("\n"), meta: { m_files: n } };
  }
  function demote(md) {
    var fence = false;
    return md.split("\n").map(function (l) {
      if (/^(```|~~~)/.test(l)) fence = !fence;
      return !fence && /^#{1,5} /.test(l) ? "#" + l : l;
    }).join("\n");
  }

  async function fromText(file, rt) {
    rt = rt || await readText(file);
    var e = ext(file.name), t = rt.text, meta = encMeta(rt.enc);
    if (e === "md" || e === "txt") return { md: t, meta: meta };
    if (e === "json") { try { t = JSON.stringify(JSON.parse(t), null, 2); } catch (_) { /* giữ nguyên */ } }
    var fence = /```/.test(t) ? "````" : "```";
    return { md: fence + (LANG[e] || "") + "\n" + t.replace(/\s+$/, "") + "\n" + fence, meta: meta };
  }

  // Trả về [khoá loại, hàm chuyển] hoặc [null, khoá lỗi, tham số]
  function pick(name) {
    var e = ext(name);
    if (e === "pdf") return ["k_pdf", fromPdf];
    if (e === "docx") return ["k_word", fromDocx];
    if (/^(xlsx|xls|csv|tsv)$/.test(e)) return ["k_sheet", fromSheet];
    if (e === "pptx") return ["k_ppt", fromPptx];
    if (/^x?html?$/.test(e)) return ["k_html", fromHtml];
    if (e === "epub") return ["k_epub", fromEpub];
    if (e === "ipynb") return ["k_nb", fromIpynb];
    if (/^(xml|rss|atom)$/.test(e)) return ["k_code", fromXml];
    if (e === "md" || e === "txt") return ["k_text", fromText];
    if (LANG[e]) return ["k_code", fromText];
    if (e === "doc" || e === "ppt") return [null, "e_old", e];
    if (/^(png|jpe?g|webp|gif|heic)$/.test(e)) return [null, "e_img"];
    return [null, "e_fmt", e || "?"];
  }
  // Ưu tiên nội dung thật của file (chữ ký %PDF, cấu trúc ZIP của Office/EPUB), rồi mới tới đuôi file
  var BY_SIG = { pdf: ["k_pdf", fromPdf], docx: ["k_word", fromDocx], pptx: ["k_ppt", fromPptx], xlsx: ["k_sheet", fromSheet], epub: ["k_epub", fromEpub], zip: ["k_zip", fromZip] };
  async function route(file) {
    var sig = "";
    try { sig = await sniff(file); } catch (_) { /* không đọc được chữ ký → theo đuôi */ }
    return BY_SIG[sig] || pick(file.name);
  }
  function errText(r) {
    if (r.errKey) { var v = T(r.errKey); return typeof v === "function" ? v(r.errArg) : v; }
    return r.error;
  }

  function frontMatter(r) {
    var lines = ["---", "source: \"" + r.name.replace(/"/g, "'") + "\"", "type: " + I18N.en[r.kind], "size: " + fmtSize(r.size)];
    Object.keys(r.meta).forEach(function (k) { lines.push(k.replace(/^m_/, "") + ": " + r.meta[k]); });
    lines.push("est_tokens: " + r.tokens, "converted: " + new Date().toISOString().slice(0, 10), "---", "");
    return lines.join("\n");
  }

  // Chia theo tiêu đề / đoạn văn, không cắt giữa đoạn
  function chunks(md, max) {
    if (!max || estTokens(md) <= max) return [md];
    var blocks = md.split(/\n(?=#{1,3} |<!-- )|\n\n/);
    var out = [], cur = "";
    blocks.forEach(function (b) {
      var next = cur ? cur + "\n\n" + b : b;
      if (cur && estTokens(next) > max) { out.push(cur); cur = b; } else cur = next;
    });
    if (cur) out.push(cur);
    return out;
  }

  function finalFiles(r, o) {
    var parts = chunks(r.md, o.chunk);
    var base = slug(r.base);
    return parts.map(function (p, i) {
      var name = base + (parts.length > 1 ? "-" + T("part_slug") + "-" + String(i + 1).padStart(2, "0") : "") + ".md";
      var head = o.front ? frontMatter(r).replace("---\n", "---\n" + (parts.length > 1 ? "part: " + (i + 1) + "/" + parts.length + "\n" : "")) : "";
      return { name: name, text: head + p.trim() + "\n" };
    });
  }

  // ---------- Giao diện ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function render() {
    var o = opts();
    $("resPanel").hidden = !results.length;
    var ok = results.filter(function (r) { return r.md; });
    var inTok = ok.reduce(function (s, r) { return s + r.tokens; }, 0);
    var busy = results.some(function (r) { return r.busy; });
    $("sum").innerHTML = busy ? '<span class="spin"></span> ' + esc(T("busy")) : esc(T("sum")(fmtNum(ok.length), fmtNum(results.length), fmtNum(inTok)));
    ["copyAll", "dlBundle", "dlZip"].forEach(function (id) { $(id).disabled = busy || !ok.length; });
    $("list").innerHTML = results.map(function (r, i) {
      if (r.busy) return '<div class="item"><div class="item-head"><h3>' + esc(r.name) + '</h3><span><span class="spin"></span> ' + esc(T("reading")) + "</span></div></div>";
      if (!r.md) return '<div class="item err"><div class="item-head"><h3>' + esc(r.name) + '</h3><span class="badge">' + esc(T("skipped")) + '</span></div><p class="msg">' + esc(errText(r)) + "</p></div>";
      var files = finalFiles(r, o);
      var meta = Object.keys(r.meta).map(function (k) { return '<span class="badge ok">' + esc(T(k)) + ": " + esc(r.meta[k]) + "</span>"; }).join("");
      return '<div class="item"><div class="item-head"><h3>' + esc(r.name) + '</h3><div class="item-acts">' +
        '<button data-act="copy" data-i="' + i + '">' + esc(T("copy")) + '</button><button data-act="dl" data-i="' + i + '">' + esc(T("dl")) + '</button><button data-act="toggle" data-i="' + i + '">' + esc(T("view")) + "</button></div></div>" +
        '<div class="item-meta"><span class="badge">' + esc(T(r.kind)) + '</span><span class="badge ok">' + fmtSize(r.size) + "</span>" + meta +
        '<span class="badge ok">≈ ' + fmtNum(r.tokens) + " token</span>" + (files.length > 1 ? '<span class="badge ok">' + files.length + " " + esc(T("parts")) + "</span>" : "") + "</div>" +
        (r.warn ? '<p class="msg">' + esc(T(r.warn)) + "</p>" : "") +
        '<pre hidden id="pv' + i + '">' + esc(files.map(function (f) { return f.text; }).join("\n\n").slice(0, 20000)) + "</pre></div>";
    }).join("");
  }

  async function convert(r, o) {
    r.busy = true; r.md = ""; r.error = ""; r.errKey = ""; r.lang = lang;
    try {
      var p = await route(r.file);
      if (!p[0]) { r.errKey = p[1]; r.errArg = p[2]; return; }
      r.kind = p[0];
      var out = await p[1](r.file, o);
      if (out.kind) r.kind = out.kind;
      r.md = tidy(out.md, o); r.meta = out.meta || {}; r.warn = out.warn || "";
      r.tokens = estTokens(r.md);
      if (!r.md.trim()) { r.md = ""; r.errKey = "e_empty"; }
    } catch (e) {
      r.error = e && e.message ? e.message : String(e); r.md = "";
    } finally { r.busy = false; }
  }

  async function run(list) {
    var o = opts();
    list.forEach(function (r) { r.busy = true; }); // khoá nút tải tới khi chuyển xong hết
    render();
    for (var k = 0; k < list.length; k++) { await convert(list[k], o); render(); }
  }

  function handle(fileList) {
    var jobs = Array.prototype.slice.call(fileList).map(function (f) {
      var r = { file: f, name: f.name, base: baseName(f.name), size: f.size, busy: true };
      results.push(r);
      return r;
    });
    return run(jobs);
  }

  function allFiles() {
    var o = opts(), names = {};
    var list = [];
    results.filter(function (r) { return r.md; }).forEach(function (r) {
      finalFiles(r, o).forEach(function (f) {
        var n = f.name, i = 2;
        if (names[n]) n = f.name.replace(/\.md$/, "-" + slug(ext(r.name)) + ".md");
        while (names[n]) n = f.name.replace(/\.md$/, "-" + i++ + ".md");
        names[n] = 1; list.push({ name: n, text: f.text, r: r });
      });
    });
    return list;
  }

  function bundle() {
    return allFiles().map(function (f) {
      return '<document source="' + esc(f.r.name) + '" file="' + f.name + '">\n' + f.text.trim() + "\n</document>";
    }).join("\n\n") + "\n";
  }

  function indexMd(list) {
    var rows = list.map(function (f) { return "| [" + f.name + "](" + f.name + ") | " + cell(f.r.name) + " | " + T(f.r.kind) + " | " + fmtNum(estTokens(f.text)) + " |"; });
    return T("idx_h") + "\n\n" + T("idx_p") + "\n\n" + T("idx_cols") + "\n| --- | --- | --- | --- |\n" + rows.join("\n") + "\n";
  }

  function save(name, blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function copy(text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = T("copied"); setTimeout(function () { btn.textContent = t; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (_) { alert(T("copy_fail")); }
      ta.remove();
    }
  }

  // ---------- Sự kiện ----------
  var drop = $("drop");
  $("files").addEventListener("change", function (e) { if (e.target.files.length) handle(e.target.files); e.target.value = ""; });
  drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("files").click(); } });
  ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { if (e.dataTransfer.files.length) handle(e.dataTransfer.files); });
  document.querySelectorAll(".opts input").forEach(function (i) { i.addEventListener("change", render); });

  // Đổi ngôn ngữ: dịch giao diện và chuyển lại các file đã có để nội dung Markdown cũng đổi theo
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = b.dataset.lang === "en" ? "en" : "vi"; if (next === lang) return;
      lang = next; try { localStorage.setItem("lm_lang", lang); } catch (_) { /* bỏ qua */ }
      applyLang();
      var stale = results.filter(function (r) { return !r.busy && r.lang !== lang; });
      if (stale.length) run(stale); else render();
    });
  });

  $("list").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]"); if (!b) return;
    var i = +b.dataset.i, r = results[i], files = finalFiles(r, opts());
    if (b.dataset.act === "copy") copy(files.map(function (f) { return f.text; }).join("\n\n"), b);
    else if (b.dataset.act === "dl") files.forEach(function (f) { save(f.name, new Blob([f.text], { type: "text/markdown;charset=utf-8" })); });
    else { var pv = $("pv" + i); pv.hidden = !pv.hidden; b.textContent = pv.hidden ? T("view") : T("hide"); }
  });
  $("copyAll").addEventListener("click", function () { copy(bundle(), this); });
  $("dlBundle").addEventListener("click", function () { save("context.md", new Blob([bundle()], { type: "text/markdown;charset=utf-8" })); });
  $("dlZip").addEventListener("click", async function () {
    var btn = this; btn.disabled = true;
    try {
      await need("jszip");
      var zip = new window.JSZip(), list = allFiles();
      list.forEach(function (f) { zip.file(f.name, f.text); });
      zip.file("INDEX.md", indexMd(list));
      save("ai-context.zip", await zip.generateAsync({ type: "blob" }));
    } catch (e) { alert(e.message); }
    btn.disabled = false;
  });
  $("clear").addEventListener("click", function () { results = []; render(); });

  applyLang();
})();
