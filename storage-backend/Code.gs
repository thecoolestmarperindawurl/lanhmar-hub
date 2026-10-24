/**
 * LANHMAR Data Storage — backend (Google Apps Script + 1 Google Sheet).
 *
 * Tab Requests: Thời gian | Họ tên | Email | Lời nhắn | Mã truy cập | Trạng thái | Ngày duyệt | Ghi chú của tôi
 *                | Nội dung CK (công thức) | Donate | Số tiền (đ) | Ngày nhận | Gợi ý (công thức)
 * Tab Items:    id | kho | title | url | note | tags | type | date   (web ghi đè khi bấm "Đồng bộ Storage")
 * Tab Dashboard: số liệu nhanh + danh sách đang chờ duyệt
 *
 * Duyệt người xem: đối chiếu khoản donate (Nội dung CK = "LM <mã>") với sao kê ngân hàng, chọn Donate = Đã nhận,
 * nhập số tiền, rồi đổi cột Trạng thái từ Pending sang Approved.
 * Thu quyền: Revoked. Từ chối: Rejected.
 *
 * Script Properties cần đặt (Project Settings → Script properties):
 *   ADMIN_KEY           chuỗi bí mật dài, ngẫu nhiên, dùng khi bấm "Đồng bộ Storage"
 *   TELEGRAM_BOT_TOKEN  (tuỳ chọn) token bot từ @BotFather
 *   TELEGRAM_CHAT_ID    (tuỳ chọn) chat id của bạn
 *
 * Chạy hàm setup() (hoặc formatSheets()) để tạo và định dạng lại toàn bộ Sheet.
 */

// ID của Google Sheet "LANHMAR Storage Access" (lấy từ đường dẫn của Sheet)
var SHEET_ID = '1znlZQDBYj0aScVwcc21vnI1m2IBYo5_hfdGDahziJPQ';
var SHEET_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit';
var REQ = 'Requests';
var ITEMS = 'Items';
var MAX_REQUESTS = 2000;
var REQ_HEADERS = ['Thời gian', 'Họ tên', 'Email', 'Lời nhắn của người xin', 'Mã truy cập', 'Trạng thái', 'Ngày duyệt', 'Ghi chú của tôi',
  'Nội dung CK (để đối chiếu)', 'Donate', 'Số tiền (đ)', 'Ngày nhận', 'Gợi ý'];
var DONATE_OPTS = ['Chưa nhận', 'Đã nhận', 'Miễn (khoá KesFlow)', 'Miễn (khác)'];
var CK_PREFIX = 'LM';
var ITEM_HEADERS = ['id', 'kho', 'title', 'url', 'note', 'tags', 'type', 'date'];

function sheet_(name, headers) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, max) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

// Chặn công thức Sheet (=, +, -, @) khi ghi dữ liệu người dùng nhập
function safeCell_(s) {
  s = String(s == null ? '' : s);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function newCode_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var out = '';
  for (var i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function same_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function notify_(text) {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('TELEGRAM_BOT_TOKEN'), chat = p.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chat) return;
  try {
    UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post',
      payload: { chat_id: chat, text: text, disable_web_page_preview: 'true' },
      muteHttpExceptions: true
    });
  } catch (e) {}
}

// Chạy 1 lần để cấp quyền và tạo/định dạng toàn bộ Sheet. Chạy lại bất cứ lúc nào để làm mới giao diện.
function setup() {
  formatSheets();
}

function doGet() {
  return json_({ ok: true, service: 'lanhmar-storage' });
}

/* ================== TIN CẬP NHẬT TRỰC TIẾP (Claude Code + Anthropic News) ================== */
// Lấy tin mới, tóm tắt sơ lược (đoạn mô tả có sẵn của bài) và dịch sang tiếng Việt. Cache 30 phút để nhanh và nhẹ.
function tr_(text) {
  text = String(text || '').trim();
  if (!text) return '';
  var cache = CacheService.getScriptCache();
  var key = 'tr:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text)).slice(0, 24);
  var hit = cache.get(key);
  if (hit) return hit;
  var out = text;
  try { out = LanguageApp.translate(text, 'en', 'vi'); } catch (e) {}
  try { cache.put(key, out, 21600); } catch (e2) {}
  return out;
}

function isoDate_(s) {
  s = String(s || '').trim();
  var mm = s.match(/^([A-Za-z]{3})[a-z]* (\d{1,2}), (\d{4})$/);
  if (mm) { // "Oct 22, 2026": đọc thẳng, tránh lệch múi giờ
    var mon = 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(mm[1].charAt(0).toUpperCase() + mm[1].slice(1, 3).toLowerCase());
    if (mon >= 0) return mm[3] + '-' + ('0' + (mon / 3 + 1)).slice(-2) + '-' + ('0' + mm[2]).slice(-2);
  }
  var rr = s.match(/(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})/); // "24 Oct 2026" (RSS)
  if (rr) {
    var mo = 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(rr[2].charAt(0).toUpperCase() + rr[2].slice(1, 3).toLowerCase());
    if (mo >= 0) return rr[3] + '-' + ('0' + (mo / 3 + 1)).slice(-2) + '-' + ('0' + rr[1]).slice(-2);
  }
  var d = new Date(s);
  return isNaN(d) ? '' : Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd');
}

function decode_(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
}

function anthropicNews_() {
  var html = UrlFetchApp.fetch('https://www.anthropic.com/news', { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0' } }).getContentText();
  var re = /<time[^>]*>([^<]+)<\/time>[\s\S]{0,4000}?<a[^>]*href="(\/[^"]+)"[^>]*><h([23])[^>]*>([^<]+)<\/h\3>/g, m, seen = {}, out = [];
  while ((m = re.exec(html))) {
    var path = m[2];
    if (seen[path]) continue;
    seen[path] = 1;
    var tail = html.substr(m.index + m[0].length, 900), sm = tail.match(/<p[^>]*>([^<]{30,})<\/p>/);
    out.push({ d: isoDate_(m[1]), u: 'https://www.anthropic.com' + path, te: decode_(m[4]), se: sm ? decode_(sm[1]) : '' });
  }
  out.sort(function (a, b) { return b.d < a.d ? -1 : b.d > a.d ? 1 : 0; });
  out = out.slice(0, 12);
  out.forEach(function (x) { x.t = tr_(x.te); x.s = tr_(x.se); });
  return out;
}

function claudeCode_() {
  var md = UrlFetchApp.fetch('https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md', { muteHttpExceptions: true }).getContentText().slice(0, 30000);
  var parts = md.split(/\n## /).slice(1, 7), dates = {};
  try {
    var rel = JSON.parse(UrlFetchApp.fetch('https://api.github.com/repos/anthropics/claude-code/releases?per_page=8', { muteHttpExceptions: true, headers: { 'User-Agent': 'lanhmar-storage' } }).getContentText());
    rel.forEach(function (r) { dates[String(r.tag_name).replace(/^v/, '')] = isoDate_(r.published_at); });
  } catch (e) {}
  return parts.map(function (p) {
    var lines = p.split('\n'), v = lines[0].trim(), pts = [];
    lines.slice(1).forEach(function (l) {
      if (pts.length < 4 && /^-\s+/.test(l)) pts.push(decode_(l.replace(/^-\s+/, '').replace(/`/g, '')).slice(0, 220));
    });
    return { v: v, d: dates[v] || '', u: 'https://github.com/anthropics/claude-code/releases/tag/v' + v, pte: pts, pt: pts.map(tr_) };
  });
}

function news_() {
  var cache = CacheService.getScriptCache(), hit = cache.get('news');
  if (hit) return json_(JSON.parse(hit));
  var out = { ok: true, updated: new Date().toISOString(), news: [], claude: [] };
  try { out.news = anthropicNews_(); } catch (e1) {}
  try { out.claude = claudeCode_(); } catch (e2) {}
  if (!out.news.length && !out.claude.length) {
    var last = cache.get('news_last');
    return json_(last ? JSON.parse(last) : { ok: false });
  }
  var s = JSON.stringify(out);
  if (s.length < 90000) { cache.put('news', s, 1800); cache.put('news_last', s, 21600); }
  return json_(out);
}

/* ---------- Tin AI toàn ngành, theo từng hãng ---------- */
var AI_SOURCES = {
  anthropic: { anthropic: true },
  openai: { rss: 'https://openai.com/news/rss.xml' },
  google: { rss: 'https://blog.google/products/gemini/rss/' },
  xai: { gnews: 'Grok xAI' },
  microsoft: { gnews: 'Microsoft Copilot' },
  meta: { rss: 'https://about.fb.com/news/tag/ai/feed/' },
  deepseek: { gnews: 'DeepSeek AI' },
  mistral: { rss: 'https://mistral.ai/rss.xml' },
  nvidia: { rss: 'https://blogs.nvidia.com/feed/' },
  perplexity: { gnews: 'Perplexity AI' }
};

function stripTags_(s) {
  return decode_(String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
}

function tag_(block, name) {
  var m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>'));
  return m ? m[1] : '';
}

function rssItems_(xml, n) {
  var items = String(xml).match(/<item[\s>][\s\S]*?<\/item>/g) || [];
  return items.slice(0, n).map(function (b) {
    return { title: stripTags_(tag_(b, 'title')), link: stripTags_(tag_(b, 'link')), date: isoDate_(stripTags_(tag_(b, 'pubDate')).replace(/^[A-Za-z]{3}, /, '').replace(/ \d\d:\d\d:\d\d.*$/, '')), desc: stripTags_(tag_(b, 'description')).slice(0, 260), source: stripTags_(tag_(b, 'source')) };
  });
}

function aiNews_(id) {
  var src = AI_SOURCES[id];
  if (!src) return json_({ ok: false, error: 'bad_company' });
  var cache = CacheService.getScriptCache(), key = 'ai:' + id, hit = cache.get(key);
  if (hit) return json_(JSON.parse(hit));
  var items = [];
  try {
    if (src.anthropic) {
      items = anthropicNews_().slice(0, 6);
    } else {
      var url = src.rss || 'https://news.google.com/rss/search?q=' + encodeURIComponent(src.gnews + ' when:14d') + '&hl=en-US&gl=US&ceid=US:en';
      var xml = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0' } }).getContentText();
      rssItems_(xml, 6).forEach(function (it) {
        var title = it.title, s = it.desc;
        if (src.gnews) { // Google News: tiêu đề dạng "Tiêu đề - Nguồn"
          var cut = title.lastIndexOf(' - ');
          if (cut > 20) { if (!it.source) it.source = title.slice(cut + 3); title = title.slice(0, cut); }
          s = it.source ? 'Nguồn: ' + it.source : '';
        }
        items.push({ d: it.date, u: it.link, te: title, se: src.gnews ? '' : s, t: tr_(title), s: src.gnews ? s : tr_(s), src: it.source || '' });
      });
    }
  } catch (e) {}
  var out = { ok: items.length > 0, c: id, updated: new Date().toISOString(), items: items };
  if (items.length) { var j = JSON.stringify(out); if (j.length < 90000) cache.put(key, j, 1800); }
  return json_(out);
}

// Khoá học KesFlow mới nhất: đọc từ trang chủ kesflow.vn để link giới thiệu luôn trỏ đúng khoá (TA06, TA07...).
function course_() {
  var cache = CacheService.getScriptCache(), hit = cache.get('course');
  if (hit) return json_(JSON.parse(hit));
  try {
    var home = UrlFetchApp.fetch('https://kesflow.vn/', { muteHttpExceptions: true, followRedirects: true }).getContentText();
    var re = /\/khoa-hoc\/(teamwork-voi-ai-ta(\d+))/g, m, best = null;
    while ((m = re.exec(home))) {
      var n = parseInt(m[2], 10);
      if (!best || n > best.n) best = { slug: m[1], n: n };
    }
    if (!best) return json_({ ok: false });
    var page = UrlFetchApp.fetch('https://kesflow.vn/khoa-hoc/' + best.slug, { muteHttpExceptions: true, followRedirects: true }).getContentText();
    function meta(p) {
      var r = page.match(new RegExp('<meta property="' + p + '" content="([^"]*)"'));
      return r ? r[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").slice(0, 300) : '';
    }
    var out = { ok: true, slug: best.slug, title: meta('og:title'), description: meta('og:description') };
    cache.put('course', JSON.stringify(out), 21600);
    return json_(out);
  } catch (err) {
    return json_({ ok: false });
  }
}

function doPost(e) {
  try {
    var pre = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (pre.action === 'course') return course_();
    if (pre.action === 'news') return news_();
    if (pre.action === 'ainews') return aiNews_(String(pre.c || ''));
  } catch (err0) {
    return json_({ ok: false, error: 'server' });
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.action) {
      case 'register': return register_(body);
      case 'access': return access_(body);
      case 'sync': return sync_(body);
      default: return json_({ ok: false, error: 'bad_action' });
    }
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

function register_(b) {
  var name = clean_(b.name, 80), email = clean_(b.email, 120).toLowerCase(), note = clean_(b.note, 300);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'invalid' });
  var sh = sheet_(REQ, REQ_HEADERS);
  var rows = sh.getDataRange().getValues();
  if (rows.length > MAX_REQUESTS) return json_({ ok: false, error: 'full' });
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email) {
      // Đã đăng ký: không hiện lại mã (mã chỉ hiện đúng 1 lần cho người đăng ký)
      return json_({ ok: true, existing: true, status: String(rows[i][5]) });
    }
  }
  var code = newCode_();
  // Ghi vào dòng trống tiếp theo (giữ nguyên định dạng sẵn có của Sheet)
  var next = 2;
  for (var k = 1; k < rows.length; k++) if (String(rows[k][2]) !== '') next = k + 2;
  sh.getRange(next, 1, 1, 6).setValues([[new Date(), safeCell_(name), email, safeCell_(note), code, 'Pending']]);
  notify_('🔔 Yêu cầu truy cập Data Storage mới\nTên: ' + name + '\nEmail: ' + email + (note ? '\nLời nhắn: ' + note : '') +
          '\nNội dung CK cần tìm trong sao kê: ' + CK_PREFIX + ' ' + code +
          '\n\n👉 Duyệt ngay: ' + SHEET_URL + '#gid=' + sh.getSheetId() +
          '\nĐã nhận donate → chọn Donate = Đã nhận (cột J), rồi đổi Trạng thái thành Approved.');
  return json_({ ok: true, existing: false, code: code, status: 'Pending' });
}

function access_(b) {
  var email = clean_(b.email, 120).toLowerCase(), code = clean_(b.code, 20).toUpperCase();
  var sh = sheet_(REQ, REQ_HEADERS);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email && same_(String(rows[i][4]).toUpperCase(), code)) {
      var status = String(rows[i][5]);
      if (status !== 'Approved') return json_({ ok: true, approved: false, status: status });
      return json_({ ok: true, approved: true, name: String(rows[i][1]), items: readItems_() });
    }
  }
  return json_({ ok: false, error: 'denied' });
}

function readItems_() {
  var sh = sheet_(ITEMS, ITEM_HEADERS);
  var rows = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    out.push({ id: String(r[0]), kho: String(r[1]), title: String(r[2]), url: String(r[3]), note: String(r[4]),
               tags: String(r[5]).split(',').map(function (t) { return t.trim(); }).filter(String),
               type: String(r[6]), date: String(r[7]) });
  }
  return out;
}

function sync_(b) {
  var key = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if (!key || !same_(key, String(b.adminKey || ''))) return json_({ ok: false, error: 'denied' });
  var items = (b.items || []).slice(0, 2000);
  var sh = sheet_(ITEMS, ITEM_HEADERS);
  var last = sh.getLastRow();
  // Chỉ xoá nội dung (giữ định dạng, dropdown, màu)
  if (last > 1) sh.getRange(2, 1, last - 1, ITEM_HEADERS.length).clearContent();
  var data = items.map(function (it) {
    return [clean_(it.id, 40), clean_(it.kho, 20), safeCell_(clean_(it.title, 200)), clean_(it.url, 500),
            safeCell_(clean_(it.note, 1000)), safeCell_(clean_((it.tags || []).join(','), 200)), safeCell_(clean_(it.type, 40)), clean_(it.date, 20)];
  });
  if (data.length) sh.getRange(2, 1, data.length, ITEM_HEADERS.length).setValues(data);
  return json_({ ok: true, count: data.length });
}

/* ================== GIAO DIỆN SHEET (template theo dõi) ================== */
var C = {
  purple: '#2D2FEF', purpleSoft: '#E7E2FB', ink: '#241F45', orange: '#FF7A45', orangeSoft: '#FFD8C2',
  green: '#D9F2E3', greenText: '#17633A', yellow: '#FFF4CC', yellowText: '#7A5B00',
  red: '#FBDADA', redText: '#8E1B1B', grey: '#E8E8EE', greyText: '#55507A'
};

function formatSheets() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  ss.setSpreadsheetLocale('en_US'); // công thức dùng dấu phẩy, định dạng ngày/số nhất quán
  var req = sheet_(REQ, REQ_HEADERS), items = sheet_(ITEMS, ITEM_HEADERS);
  var dash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  // Dọn trang tính trống mặc định (Sheet1 / Trang tính1)
  ss.getSheets().forEach(function (sh) {
    var n = sh.getName();
    if (n !== REQ && n !== ITEMS && n !== 'Dashboard' && sh.getLastRow() <= 1 && ss.getSheets().length > 3) ss.deleteSheet(sh);
  });
  formatRequests_(req);
  formatItems_(items);
  buildDashboard_(dash, req);
  ss.setActiveSheet(dash); ss.moveActiveSheet(1);
  ss.setActiveSheet(req); ss.moveActiveSheet(2);
  ss.setActiveSheet(items); ss.moveActiveSheet(3);
  ss.setActiveSheet(dash);
  SpreadsheetApp.flush();
}

function header_(sh, headers, bg) {
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setBackground(bg).setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left').setVerticalAlignment('middle');
  sh.setRowHeight(1, 38);
  sh.setFrozenRows(1);
}

function ensureRows_(sh, n) {
  if (sh.getMaxRows() < n) sh.insertRowsAfter(sh.getMaxRows(), n - sh.getMaxRows());
}

function formatRequests_(sh) {
  var MAXR = 2000, cols = REQ_HEADERS.length;
  sh.setTabColor(C.purple);
  header_(sh, REQ_HEADERS, C.purple);
  ensureRows_(sh, MAXR);
  var n = MAXR - 1;
  sh.getRange(2, 1, n, cols).setVerticalAlignment('middle').setFontSize(10)
    .setBorder(false, false, true, false, false, false, '#E0DCF5', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, 4, n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sh.getRange(2, 8, n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sh.getRange(2, 1, n, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(2, 7, n, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, 5, n, 1).setFontFamily('Roboto Mono').setHorizontalAlignment('center').setFontWeight('bold');
  var st = sh.getRange(2, 6, n, 1);
  st.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Approved', 'Rejected', 'Revoked'], true).setAllowInvalid(false)
    .setHelpText('Pending = chờ duyệt · Approved = cho xem · Rejected = từ chối · Revoked = thu quyền').build());
  st.setHorizontalAlignment('center').setFontWeight('bold');
  [150, 170, 240, 290, 130, 130, 120, 260].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

  var rowRange = sh.getRange(2, 1, n, cols), stRange = st;
  function rules(val, bg, fg) {
    return [
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$F2="' + val + '"')
        .setBackground(bg).setFontColor(fg).setBold(true).setRanges([stRange]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$F2="' + val + '"')
        .setBackground(bg).setRanges([rowRange]).build()
    ];
  }
  sh.setConditionalFormatRules([].concat(
    rules('Pending', C.yellow, C.yellowText), rules('Approved', C.green, C.greenText),
    rules('Revoked', C.red, C.redText), rules('Rejected', C.grey, C.greyText)));
  var f = sh.getFilter(); if (f) f.remove();
  sh.getRange(1, 1, MAXR, cols).createFilter();
  // --- cột theo dõi donate (I..M) ---
  sh.getRange(2, 9, n, 1).setFormula('=IF($E2="","","' + CK_PREFIX + ' "&$E2)')
    .setFontFamily('Roboto Mono').setFontWeight('bold').setFontColor('#A6380D').setHorizontalAlignment('center');
  var dn = sh.getRange(2, 10, n, 1);
  dn.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(DONATE_OPTS, true).setAllowInvalid(false)
    .setHelpText('Chưa nhận · Đã nhận (có tiền trong sao kê) · Miễn (khoá KesFlow hoặc lý do khác)').build())
    .setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(2, 11, n, 1).setNumberFormat('#,##0').setHorizontalAlignment('right');
  sh.getRange(2, 12, n, 1).setNumberFormat('dd/MM/yyyy').setHorizontalAlignment('center');
  sh.getRange(2, 13, n, 1).setFormula('=IF($C2="","",IF($F2="Approved","✔ Đã duyệt",IF($F2<>"Pending","",IF(OR($J2="Đã nhận",LEFT($J2,3)="Miễn"),"👉 CÓ THỂ DUYỆT","⏳ Chờ donate"))))')
    .setFontWeight('bold').setHorizontalAlignment('center');
  [220, 150, 120, 120, 170].forEach(function (w, i) { sh.setColumnWidth(i + 9, w); });
  sh.getRange(1, 9, 1, 5).setBackground(C.orange);
  var rules2 = sh.getConditionalFormatRules();
  rules2.push(
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$M2="👉 CÓ THỂ DUYỆT"')
      .setBackground('#B7E4C7').setFontColor(C.greenText).setBold(true).setRanges([sh.getRange(2, 13, n, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$M2="⏳ Chờ donate"')
      .setFontColor(C.yellowText).setRanges([sh.getRange(2, 13, n, 1)]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND($F2="Approved",OR($J2="",$J2="Chưa nhận"))')
      .setBackground('#FFC9C9').setFontColor(C.redText).setBold(true).setRanges([dn]).build());
  sh.setConditionalFormatRules(rules2);
  sh.getRange(1, 9).setNote('Người đóng góp phải ghi đúng nội dung này khi chuyển khoản. Tìm nội dung này trong sao kê TPBank để biết ai đã chuyển. (Tự điền từ cột Mã truy cập.)');
  sh.getRange(1, 10).setNote('Sau khi thấy tiền trong sao kê: chọn "Đã nhận". Khoá KesFlow hoặc trường hợp đặc biệt: chọn "Miễn".');
  sh.getRange(1, 13).setNote('Tự tính: 👉 CÓ THỂ DUYỆT = đã nhận donate/được miễn nhưng chưa Approved.');
  sh.getRange(1, 6).setNote('Đổi sang Approved để cấp quyền xem. Revoked = thu quyền ngay lần tải sau.');
  sh.getRange(1, 5).setNote('Người xin dùng mã này cùng email để vào xem. Mã chỉ hiện 1 lần cho họ.');
}

function formatItems_(sh) {
  var MAXR = 2000, cols = ITEM_HEADERS.length;
  sh.setTabColor(C.orange);
  header_(sh, ITEM_HEADERS, C.orange);
  ensureRows_(sh, MAXR);
  var n = MAXR - 1;
  sh.getRange(2, 1, n, cols).setVerticalAlignment('middle').setFontSize(10)
    .setBorder(false, false, true, false, false, false, '#F3D7C8', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, 5, n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  var kho = sh.getRange(2, 2, n, 1);
  kho.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['ai', 'design', 'edit', 'tool', 'knowledge', 'idea'], true).setAllowInvalid(false).build())
    .setHorizontalAlignment('center').setFontWeight('bold');
  var colors = {
    ai: ['#E7E2FB', '#2D2FEF'], design: ['#FBDDF0', '#9B1C6B'], edit: ['#FFD8C2', '#A6380D'],
    tool: ['#DCEBFF', '#1B4FA0'], knowledge: ['#D9F2E3', '#17633A'], idea: ['#FFF4CC', '#7A5B00']
  };
  sh.setConditionalFormatRules(Object.keys(colors).map(function (k) {
    return SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$B2="' + k + '"')
      .setBackground(colors[k][0]).setFontColor(colors[k][1]).setRanges([kho]).build();
  }));
  [100, 110, 280, 280, 320, 180, 110, 110].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  var f = sh.getFilter(); if (f) f.remove();
  sh.getRange(1, 1, MAXR, cols).createFilter();
  sh.getRange(1, 1).setNote('Tab này do web ghi khi bấm "Đồng bộ Storage" trong Kho cá nhân. Sửa tay sẽ bị ghi đè ở lần đồng bộ sau.');
}

function kpi_(sh, row, col, label, formula, bg, fg) {
  sh.getRange(row, col, 1, 2).merge().setValue(label).setBackground(bg).setFontColor(fg).setFontSize(10)
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.getRange(row + 1, col, 2, 2).merge().setFormula(formula).setBackground(bg).setFontColor(fg).setFontSize(32)
    .setFontWeight('bold').setHorizontalAlignment('center').setVerticalAlignment('middle');
  sh.getRange(row, col, 3, 2).setBorder(true, true, true, true, false, false, '#FFFFFF', SpreadsheetApp.BorderStyle.SOLID_THICK);
}

function buildDashboard_(sh, req) {
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.clearConditionalFormatRules();
  sh.setTabColor(C.ink);
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 24);
  for (var c = 2; c <= 11; c++) sh.setColumnWidth(c, 92);

  sh.getRange('B2:K2').merge().setValue('★ LANHMAR · Data Storage').setFontSize(20).setFontWeight('bold')
    .setFontColor('#FFFFFF').setBackground(C.purple).setVerticalAlignment('middle').setHorizontalAlignment('left');
  sh.setRowHeight(2, 52);
  sh.getRange('B3:K3').merge().setValue('Theo dõi yêu cầu truy cập và donate: đối chiếu sao kê, ghi Donate, rồi duyệt ở tab Requests.')
    .setFontColor(C.greyText).setFontSize(10).setBackground(C.purpleSoft).setVerticalAlignment('middle');
  sh.setRowHeight(3, 28);

  kpi_(sh, 5, 2, 'TỔNG YÊU CẦU', '=COUNTA(Requests!C2:C)', C.purpleSoft, C.purple);
  kpi_(sh, 5, 4, 'CHỜ DUYỆT', '=COUNTIF(Requests!F2:F,"Pending")', C.yellow, C.yellowText);
  kpi_(sh, 5, 6, 'ĐÃ DUYỆT', '=COUNTIF(Requests!F2:F,"Approved")', C.green, C.greenText);
  kpi_(sh, 5, 8, 'THU QUYỀN / TỪ CHỐI', '=COUNTIF(Requests!F2:F,"Revoked")+COUNTIF(Requests!F2:F,"Rejected")', C.red, C.redText);
  kpi_(sh, 5, 10, 'MỤC CHIA SẺ', '=COUNTA(Items!A2:A)', C.orangeSoft, '#A6380D');
  sh.setRowHeight(5, 26); sh.setRowHeight(6, 30); sh.setRowHeight(7, 30);

  // --- khối donate ---
  kpi_(sh, 9, 2, 'ĐÃ NHẬN DONATE', '=COUNTIF(Requests!J2:J,"Đã nhận")', C.green, C.greenText);
  kpi_(sh, 9, 4, 'TỔNG TIỀN (đ)', '=SUM(Requests!K2:K)', C.green, C.greenText);
  kpi_(sh, 9, 6, 'SẴN SÀNG DUYỆT', '=COUNTIF(Requests!M2:M,"👉 CÓ THỂ DUYỆT")', C.orangeSoft, '#A6380D');
  kpi_(sh, 9, 8, 'CHỜ DONATE', '=COUNTIF(Requests!M2:M,"⏳ Chờ donate")', C.yellow, C.yellowText);
  kpi_(sh, 9, 10, 'DUYỆT NHƯNG CHƯA GHI DONATE', '=COUNTIFS(Requests!F2:F,"Approved",Requests!J2:J,"")+COUNTIFS(Requests!F2:F,"Approved",Requests!J2:J,"Chưa nhận")', C.red, C.redText);
  sh.getRange('D10:E11').setNumberFormat('#,##0').setFontSize(22);
  sh.setRowHeight(9, 26); sh.setRowHeight(10, 30); sh.setRowHeight(11, 30);

  sh.getRange('B13:K13').merge().setValue('👉 SẴN SÀNG DUYỆT: đã nhận donate / được miễn, chưa Approved').setFontWeight('bold')
    .setFontColor(C.greenText).setBackground(C.green).setVerticalAlignment('middle');
  sh.setRowHeight(13, 30);
  sh.getRange('B14:G14').setValues([['Họ tên', 'Email', 'Mã', 'Nội dung CK', 'Số tiền (đ)', 'Donate']]).setFontWeight('bold').setFontColor(C.greyText)
    .setBorder(false, false, true, false, false, false, '#CFCADF', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('B15').setFormula('=IFERROR(QUERY(Requests!A2:M,"select B,C,E,I,K,J where F=\'Pending\' and (J=\'Đã nhận\' or J starts with \'Miễn\') order by A desc limit 12",0),"Chưa có ai sẵn sàng duyệt")');
  sh.getRange('B15:G26').setFontSize(10).setVerticalAlignment('middle');
  sh.getRange('D15:E26').setFontFamily('Roboto Mono').setFontWeight('bold');
  sh.getRange('F15:F26').setNumberFormat('#,##0');

  sh.getRange('B28:K28').merge().setValue('⏳ ĐANG CHỜ DONATE (mới nhất ở trên)').setFontWeight('bold')
    .setFontColor(C.yellowText).setBackground(C.yellow).setVerticalAlignment('middle');
  sh.setRowHeight(28, 30);
  sh.getRange('B29:G29').setValues([['Họ tên', 'Email', 'Lời nhắn', 'Mã', 'Nội dung CK', 'Thời gian']]).setFontWeight('bold').setFontColor(C.greyText)
    .setBorder(false, false, true, false, false, false, '#CFCADF', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('B30').setFormula('=IFERROR(QUERY(Requests!A2:M,"select B,C,D,E,I,A where F=\'Pending\' and not (J=\'Đã nhận\' or J starts with \'Miễn\') order by A desc limit 12",0),"Không có yêu cầu nào đang chờ ✔")');
  sh.getRange('B30:G41').setFontSize(10).setVerticalAlignment('middle');
  sh.getRange('E30:F41').setFontFamily('Roboto Mono').setFontWeight('bold');
  sh.getRange('G30:G41').setNumberFormat('dd/MM HH:mm');

  sh.getRange('B43:K49').merge().setValue(
    'CÁCH DUYỆT CHÍNH XÁC (theo donate)\n1. Có yêu cầu mới → bot Telegram nhắn tên, email và "Nội dung CK" (dạng LM + mã).\n2. Mở sao kê TPBank, tìm đúng nội dung đó. Có tiền → vào tab Requests, cột Donate chọn "Đã nhận", nhập Số tiền và Ngày nhận.\n3. Cột Gợi ý chuyển thành "👉 CÓ THỂ DUYỆT" → đổi Trạng thái thành Approved. Khoá KesFlow / trường hợp đặc biệt: Donate = "Miễn".\n4. Không thấy tiền → để Pending. Muốn thu quyền → Revoked. Từ chối → Rejected.\n5. Ô đỏ "DUYỆT NHƯNG CHƯA GHI DONATE" nhắc bạn bổ sung nếu lỡ duyệt trước.')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top').setFontSize(10)
    .setFontColor(C.ink).setBackground('#FAF8FF')
    .setBorder(true, true, true, true, false, false, C.purpleSoft, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.getRange('B51').setFormula('=HYPERLINK("#gid=' + req.getSheetId() + '","→ Mở danh sách yêu cầu (Requests)")')
    .setFontWeight('bold').setFontColor(C.purple);
}
