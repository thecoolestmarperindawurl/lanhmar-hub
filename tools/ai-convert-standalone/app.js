/* AI Convert — chuyển file sang Markdown cho AI Agent. Chạy 100% trong trình duyệt.
   Song ngữ VI/EN: nhớ lựa chọn của bạn trong trình duyệt (localStorage "aiconvert_lang"). */
(function () {
  "use strict";

  // ---------- Song ngữ ----------
  var I18N = {
    vi: {
      title: "AI Convert — LANHMAR",
      marquee: "★ FILE → MARKDOWN ★ AI-READY ★ VIBE CODE ★ ÍT TOKEN HƠN ★ FILE → MARKDOWN ★ AI-READY ★ VIBE CODE ★ ÍT TOKEN HƠN",
      back: "← Trang tác giả",
      h1: "File → <em>Markdown</em> cho AI",
      lead: "Thả PDF, Word, Excel, PowerPoint, HTML hay file code vào đây. Mình chuyển hết sang Markdown sạch để Claude, ChatGPT, Cursor… đọc nhanh hơn, hiểu cấu trúc tốt hơn và tốn ít token hơn. <b>File được xử lý ngay trong trình duyệt của bạn, không tải lên máy chủ nào.</b>",
      drop_b: "Kéo thả file vào đây", drop_s: "hoặc bấm để chọn (chọn được nhiều file)",
      drop_f: "PDF · DOCX · XLSX/XLS/CSV · PPTX · HTML · TXT/MD · JSON/YAML/XML · file code",
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
      e_old: function (e) { return "File ." + e + " đời cũ: mở bằng Word/PowerPoint rồi lưu lại thành .docx/.pptx trước."; },
      e_img: "Ảnh: gửi thẳng ảnh cho AI sẽ chính xác hơn chuyển sang chữ.",
      e_fmt: function (e) { return "Chưa hỗ trợ định dạng ." + e; },
      e_empty: "Không đọc được chữ nào trong file.",
      e_lib: "Không tải được thư viện: ",
      w_scan: "PDF gần như không có lớp chữ (có thể là bản scan/ảnh). Hãy gửi thẳng file cho AI hoặc chạy OCR trước.",
      md_page: "Trang", md_slide: "Slide", md_sheet: "Sheet", md_notes: "Ghi chú", md_col: "Cột", md_img: "Hình",
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
      back: "← Author site",
      h1: "File → <em>Markdown</em> for AI",
      lead: "Drop in PDF, Word, Excel, PowerPoint, HTML or code files. I turn them into clean Markdown so Claude, ChatGPT, Cursor… read faster, understand the structure better and use fewer tokens. <b>Files are processed right in your browser and never uploaded to any server.</b>",
      drop_b: "Drag & drop files here", drop_s: "or click to choose (multiple files allowed)",
      drop_f: "PDF · DOCX · XLSX/XLS/CSV · PPTX · HTML · TXT/MD · JSON/YAML/XML · code files",
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
      e_old: function (e) { return "Legacy ." + e + " file: open it in Word/PowerPoint and save as .docx/.pptx first."; },
      e_img: "Image: sending the image itself to the AI is more accurate than converting it to text.",
      e_fmt: function (e) { return "Unsupported format ." + e; },
      e_empty: "No text could be read from this file.",
      e_lib: "Could not load library: ",
      w_scan: "This PDF has almost no text layer (probably a scan/image). Send the file to the AI directly or run OCR first.",
      md_page: "Page", md_slide: "Slide", md_sheet: "Sheet", md_notes: "Notes", md_col: "Column", md_img: "Image",
      md_empty_sheet: "_(empty sheet)_",
      md_rows: function (n, cut) { return "_" + n + " data rows" + (cut ? ", truncated to the first " + cut : "") + "._"; },
      idx_h: "# INDEX — reference docs for AI",
      idx_p: "Each file below is the Markdown version of a source document. Read this file first, then open only the files relevant to the task.",
      idx_cols: "| File | Source | Type | ≈ Tokens |",
      part_slug: "part"
    }
  };
  var lang = "vi";
  try { lang = localStorage.getItem("aiconvert_lang") === "en" ? "en" : "vi"; } catch (_) { /* chế độ riêng tư */ }
  function T(k) { var v = I18N[lang][k]; return v !== undefined ? v : I18N.vi[k]; }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = T("title");
    document.querySelectorAll("[data-i]").forEach(function (e) { e.textContent = T(e.dataset.i); });
    document.querySelectorAll("[data-ih]").forEach(function (e) { e.innerHTML = T(e.dataset.ih); }); // chuỗi cố định trong I18N
    document.querySelectorAll(".lang button").forEach(function (b) { var on = b.dataset.lang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  }

  // Thư viện tải theo nhu cầu (chỉ khi gặp loại file cần đến)
  // Thư viện đi kèm trong thư mục vendor/ (chạy offline được); lỗi thì thử tải từ CDN công khai
  var LIBS = {
    pdf: ["vendor/pdf.min.js"],
    pdfWorker: "vendor/pdf.worker.min.js",
    mammoth: ["vendor/mammoth.browser.min.js"],
    turndown: ["vendor/turndown.min.js", "vendor/turndown-plugin-gfm.js"],
    xlsx: ["vendor/xlsx.full.min.js"],
    jszip: ["vendor/jszip.min.js"]
  };
  var CDN = {
    "vendor/pdf.min.js": "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    "vendor/mammoth.browser.min.js": "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
    "vendor/turndown.min.js": "https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js",
    "vendor/turndown-plugin-gfm.js": "https://cdn.jsdelivr.net/npm/turndown-plugin-gfm@1.0.2/dist/turndown-plugin-gfm.js",
    "vendor/xlsx.full.min.js": "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    "vendor/jszip.min.js": "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
  };
  var loaded = {};
  function addScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { s.remove(); rej(); };
      document.head.appendChild(s);
    });
  }
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = addScript(src).catch(function () {
      if (!CDN[src]) return Promise.reject();
      return addScript(CDN[src]);
    }).catch(function () { delete loaded[src]; throw new Error(T("e_lib") + src); });
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
      var py0 = page.view[1], ph = (page.view[3] - page.view[1]) || 842;
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
        return { text: txt.replace(/\s+/g, " ").trim(), size: l.size, y: l.y, edge: rel > 0.92 || rel < 0.08 };
      }).filter(function (l) { return l.text; });
      pages.push(out);
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
      ls.forEach(function (l, j) {
        chars += l.text.length;
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
    var wb = isText
      ? window.XLSX.read(await file.text(), { type: "string", FS: ext(file.name) === "tsv" ? "\t" : undefined, raw: true })
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
    return { md: md.join("\n"), meta: { m_sheets: wb.SheetNames.length } };
  }

  async function fromPptx(file, o) {
    await need("jszip");
    var zip = await window.JSZip.loadAsync(await file.arrayBuffer());
    var slides = Object.keys(zip.files).filter(function (p) { return /^ppt\/slides\/slide\d+\.xml$/.test(p); })
      .sort(function (a, b) { return +a.match(/(\d+)\.xml$/)[1] - +b.match(/(\d+)\.xml$/)[1]; });
    var parser = new DOMParser();
    var A = "http://schemas.openxmlformats.org/drawingml/2006/main";
    var P = "http://schemas.openxmlformats.org/presentationml/2006/main";
    function paras(xml) {
      var d = parser.parseFromString(xml, "application/xml");
      var shapes = Array.prototype.slice.call(d.getElementsByTagNameNS(P, "sp"));
      var title = "", body = [];
      shapes.forEach(function (sp) {
        var ph = sp.getElementsByTagNameNS(P, "ph")[0];
        var type = ph ? ph.getAttribute("type") || "" : "";
        var ps = Array.prototype.slice.call(sp.getElementsByTagNameNS(A, "p")).map(function (p) {
          var pPr = p.getElementsByTagNameNS(A, "pPr")[0];
          var lvl = +((pPr && pPr.getAttribute("lvl")) || 0);
          var t = Array.prototype.slice.call(p.getElementsByTagNameNS(A, "t")).map(function (n) { return n.textContent; }).join("").trim();
          return { t: t, lvl: lvl };
        }).filter(function (x) { return x.t; });
        if (!ps.length) return;
        if (/title/i.test(type) && !title) title = ps.map(function (x) { return x.t; }).join(" ");
        else if (type !== "sldNum" && type !== "dt" && type !== "ftr") body = body.concat(ps);
      });
      // Bảng trong slide
      Array.prototype.slice.call(d.getElementsByTagNameNS(A, "tbl")).forEach(function (tb) {
        var rows = Array.prototype.slice.call(tb.getElementsByTagNameNS(A, "tr")).map(function (tr) {
          return Array.prototype.slice.call(tr.getElementsByTagNameNS(A, "tc")).map(function (tc) { return tc.textContent.trim(); });
        });
        if (rows.length) body.push({ table: mdTable(rows) });
      });
      return { title: title, body: body };
    }
    var md = [];
    for (var i = 0; i < slides.length; i++) {
      var s = paras(await zip.file(slides[i]).async("string"));
      var label = T("md_slide") + " " + (i + 1);
      md.push("## " + (o.pages ? label + (s.title ? ": " + s.title : "") : (s.title || label)), "");
      s.body.forEach(function (b) {
        if (b.table) md.push("", b.table, "");
        else md.push("  ".repeat(b.lvl) + "- " + b.t);
      });
      if (o.notes) {
        var rel = zip.file(slides[i].replace("slides/", "slides/_rels/") + ".rels");
        if (rel) {
          var m = /Target="([^"]*notesSlide\d+\.xml)"/.exec(await rel.async("string"));
          var nf = m && zip.file("ppt/" + m[1].replace(/^\.\.\//, ""));
          if (nf) {
            var notes = paras(await nf.async("string")).body.map(function (b) { return b.t; }).filter(Boolean)
              .filter(function (t) { return !/^\d+$/.test(t); });
            if (notes.length) md.push("", "> **" + T("md_notes") + ":** " + notes.join(" "));
          }
        }
      }
      md.push("");
    }
    return { md: md.join("\n"), meta: { m_slides: slides.length } };
  }

  async function fromHtml(file) {
    await need("turndown");
    var d = new DOMParser().parseFromString(await file.text(), "text/html");
    d.querySelectorAll("script,style,noscript,nav,footer,aside,form,iframe,svg").forEach(function (n) { n.remove(); });
    var root = d.querySelector("main,article") || d.body;
    var title = (d.querySelector("title") || {}).textContent;
    var md = turndownSvc().turndown(root.innerHTML);
    if (title && !/^#\s/.test(md)) md = "# " + title.trim() + "\n\n" + md;
    return { md: md, meta: {} };
  }

  async function fromText(file) {
    var e = ext(file.name), t = await file.text();
    if (e === "md" || e === "txt") return { md: t, meta: {} };
    if (e === "json") { try { t = JSON.stringify(JSON.parse(t), null, 2); } catch (_) { /* giữ nguyên */ } }
    var fence = /```/.test(t) ? "````" : "```";
    return { md: fence + (LANG[e] || "") + "\n" + t.replace(/\s+$/, "") + "\n" + fence, meta: {} };
  }

  // Trả về [khoá loại, hàm chuyển] hoặc [null, khoá lỗi, tham số]
  function pick(name) {
    var e = ext(name);
    if (e === "pdf") return ["k_pdf", fromPdf];
    if (e === "docx") return ["k_word", fromDocx];
    if (/^(xlsx|xls|csv|tsv)$/.test(e)) return ["k_sheet", fromSheet];
    if (e === "pptx") return ["k_ppt", fromPptx];
    if (/^html?$/.test(e)) return ["k_html", fromHtml];
    if (e === "md" || e === "txt") return ["k_text", fromText];
    if (LANG[e]) return ["k_code", fromText];
    if (e === "doc" || e === "ppt") return [null, "e_old", e];
    if (/^(png|jpe?g|webp|gif|heic)$/.test(e)) return [null, "e_img"];
    return [null, "e_fmt", e || "?"];
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
    var p = pick(r.name);
    r.busy = true; r.md = ""; r.error = ""; r.errKey = ""; r.lang = lang;
    try {
      if (!p[0]) { r.errKey = p[1]; r.errArg = p[2]; return; }
      r.kind = p[0];
      var out = await p[1](r.file, o);
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
      lang = next; try { localStorage.setItem("aiconvert_lang", lang); } catch (_) { /* bỏ qua */ }
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
