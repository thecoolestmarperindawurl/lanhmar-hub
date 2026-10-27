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
 *   OWNER_EMAIL         mail Google của chủ kho (chỉ mail này lấy/ghi được kho mã hoá)
 *   GOOGLE_CLIENT_ID    OAuth Web client ID (đúng giá trị trong storage-config.js)
 *   TELEGRAM_BOT_TOKEN  (cần cho Chat) token bot từ @BotFather
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
var VAULT = 'Vault';
var VAULT_CHUNK = 40000;       // ô Sheet tối đa 50.000 ký tự
var VAULT_MAX = 1500000;       // giới hạn kích thước bản mã
var CHAT = 'Chat';
var GUIDE = 'Hướng dẫn';
var CHAT_HEADERS = ['Thời gian', 'Mã hội thoại', 'Khách', 'Liên hệ', 'Chiều', 'Nội dung', 'Mã tin Telegram', 'Trang'];
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
// Tên sản phẩm/công ty không được dịch (vd. "Gemini" bị dịch thành cung "Song Tử", "Copilot" thành "phi công phụ").
var KEEP_TERMS = ['Gemini', 'Claude', 'ChatGPT', 'GPT', 'OpenAI', 'Anthropic', 'Google', 'DeepMind', 'Grok', 'xAI', 'Copilot', 'Microsoft',
  'Llama', 'Meta', 'Mistral', 'DeepSeek', 'Perplexity', 'NVIDIA', 'Opus', 'Sonnet', 'Haiku', 'Codex', 'Sora', 'Veo', 'Imagen',
  'Nano Banana', 'Gems', 'NotebookLM', 'AI Mode', 'AI Overviews', 'Pixel', 'Workspace', 'Azure', 'Bing', 'Kimi', 'Qwen', 'Cursor', 'Windsurf'];
var KEEP_RE = new RegExp('\\b(' + KEEP_TERMS.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')\\b', 'g');

function tr_(text) {
  text = String(text || '').trim();
  if (!text) return '';
  var cache = CacheService.getScriptCache();
  var key = 'tr3:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text)).slice(0, 24);
  var hit = cache.get(key);
  if (hit) return hit;
  var out = text;
  try {
    // Che tên sản phẩm bằng mã vô nghĩa (Qzx0q...) để máy dịch không hiểu nhầm (Gemini = cung hoàng đạo), dịch xong thì trả lại tên gốc
    var toks = [];
    var masked = text.replace(KEEP_RE, function (m) { var i = toks.indexOf(m); if (i < 0) i = toks.push(m) - 1; return 'Qzx' + i + 'q'; });
    var vi = LanguageApp.translate(masked, 'en', 'vi');
    vi = vi.replace(/Qzx\s*(\d+)\s*q/gi, function (_, i) { return toks[Number(i)] || ''; });
    out = /Qzx\d/i.test(vi) ? stripTags_(LanguageApp.translate(text, 'en', 'vi')) : vi; // mã bị biến dạng thì dịch thường
    out = out.replace(/\bcung\s+(Gemini)\b/gi, '$1');
  } catch (e) {}
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
  if (s.length < 90000) { cache.put('news', s, 300); cache.put('news_last', s, 21600); }
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
  var t = String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '');
  // Mô tả RSS có thể chứa thẻ HTML đã bị mã hoá (&lt;img ...&gt;): bỏ thẻ, giải mã, rồi bỏ thẻ lần nữa
  for (var k = 0; k < 2; k++) t = decode_(t.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
  return t;
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
  if (items.length) { var j = JSON.stringify(out); if (j.length < 90000) cache.put(key, j, 300); }
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
    if (pre.action === 'chat_get') return chatGet_(pre);
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
      case 'vault_get': return vaultGet_(body);
      case 'vault_put': return vaultPut_(body);
      case 'chat_send': return chatSend_(body);
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

/* ================== KHO MÃ HOÁ ĐỒNG BỘ (đăng nhập Google) ==================
 * Máy chủ chỉ giữ bản mã (salt, iv, ct) đã mã hoá ở trình duyệt, không bao giờ thấy mật khẩu hay nội dung.
 * Chỉ OWNER_EMAIL, đã đăng nhập Google (ID token hợp lệ cho đúng GOOGLE_CLIENT_ID), mới lấy/ghi được.
 * Tab Vault (ẩn): A1 = {"rev":n,"chunks":k,"at":"ISO"}, A2.. = bản mã JSON cắt thành các đoạn. */

function verifyOwner_(idToken) {
  var p = PropertiesService.getScriptProperties();
  var owner = String(p.getProperty('OWNER_EMAIL') || '').trim().toLowerCase();
  var cid = String(p.getProperty('GOOGLE_CLIENT_ID') || '').trim();
  idToken = String(idToken || '');
  if (!owner || !cid || idToken.length < 100 || idToken.length > 4000) return false;
  try {
    var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return false;
    var t = JSON.parse(r.getContentText());
    var iss = String(t.iss || '');
    return same_(String(t.aud || ''), cid) &&
      (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') &&
      String(t.email_verified) === 'true' &&
      String(t.email || '').toLowerCase() === owner &&
      Number(t.exp) * 1000 > Date.now();
  } catch (e) {
    return false;
  }
}

function vaultMeta_(sh) {
  var v = sh.getRange(1, 1).getValue();
  try { var m = JSON.parse(String(v)); if (m && m.chunks >= 0) return m; } catch (e) {}
  return { rev: 0, chunks: 0 };
}

function vaultGet_(b) {
  if (!verifyOwner_(b.idToken)) return json_({ ok: false, error: 'denied' });
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(VAULT);
  if (!sh) return json_({ ok: true, rev: 0, vault: null });
  var m = vaultMeta_(sh);
  if (!m.rev || !m.chunks) return json_({ ok: true, rev: 0, vault: null });
  var parts = sh.getRange(2, 1, m.chunks, 1).getValues().map(function (r) { return String(r[0]); });
  try {
    return json_({ ok: true, rev: m.rev, at: m.at, vault: JSON.parse(parts.join('')) });
  } catch (e) {
    return json_({ ok: false, error: 'corrupt' });
  }
}

function vaultPut_(b) {
  if (!verifyOwner_(b.idToken)) return json_({ ok: false, error: 'denied' });
  var v = b.vault;
  if (!v || typeof v.salt !== 'string' || typeof v.iv !== 'string' || typeof v.ct !== 'string') return json_({ ok: false, error: 'invalid' });
  var text = JSON.stringify({ v: 1, salt: v.salt, iv: v.iv, ct: v.ct });
  if (text.length > VAULT_MAX) return json_({ ok: false, error: 'too_big' });
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(VAULT);
  if (!sh) { sh = ss.insertSheet(VAULT); sh.hideSheet(); }
  var cur = vaultMeta_(sh);
  if (Number(b.baseRev) !== Number(cur.rev)) return json_({ ok: false, error: 'conflict', rev: cur.rev });
  var chunks = [];
  for (var i = 0; i < text.length; i += VAULT_CHUNK) chunks.push([text.substr(i, VAULT_CHUNK)]);
  var oldLast = sh.getLastRow();
  if (oldLast > 1) sh.getRange(2, 1, oldLast - 1, 1).clearContent();
  sh.getRange(2, 1, chunks.length, 1).setNumberFormat('@').setValues(chunks);
  var rev = (cur.rev || 0) + 1;
  sh.getRange(1, 1).setNumberFormat('@').setValue(JSON.stringify({ rev: rev, chunks: chunks.length, at: new Date().toISOString() }));
  return json_({ ok: true, rev: rev });
}

/* ================== CHAT: tin nhắn của khách gửi tới Telegram của chủ ==================
 * Khách gõ tin trong widget "Hỏi Lan Anh" → lưu tab Chat + gửi bot Telegram kèm "Mã hội thoại".
 * Chủ trả lời bằng cách "Trả lời (Reply)" đúng tin của bot trong Telegram, hoặc gõ: /r <mã> <nội dung>.
 * Hàm pollTelegram (chạy mỗi phút bằng trigger, tạo bằng installChatTrigger) đọc câu trả lời và đưa vào tab Chat,
 * widget của khách tự hiện câu trả lời. Chỉ nhận tin trả lời từ đúng TELEGRAM_CHAT_ID của chủ. */

function telegramSend_(text) {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('TELEGRAM_BOT_TOKEN'), chat = p.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chat) return '';
  try {
    var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', payload: { chat_id: chat, text: text, disable_web_page_preview: 'true' }, muteHttpExceptions: true
    });
    var j = JSON.parse(r.getContentText());
    return j.ok && j.result ? String(j.result.message_id) : '';
  } catch (e) { return ''; }
}

function threadOf_(vid) { return 'T' + String(vid).slice(0, 8).toUpperCase(); }

// Lấy tab Chat; lần đầu tạo thì định dạng theo template chung của Storage.
function chatSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID), had = !!ss.getSheetByName(CHAT);
  var sh = sheet_(CHAT, CHAT_HEADERS);
  if (!had) { try { formatChat_(sh); } catch (e) {} }
  return sh;
}

function chatSend_(b) {
  var vid = String(b.vid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
  if (vid.length < 16) return json_({ ok: false, error: 'invalid' });
  if (b.website) return json_({ ok: true }); // bẫy bot: ô ẩn phải để trống
  var text = clean_(b.text, 1000);
  if (!text) return json_({ ok: false, error: 'invalid' });
  var name = clean_(b.name, 60) || 'Khách', contact = clean_(b.contact, 120), page = clean_(b.page, 20);
  var cache = CacheService.getScriptCache(), kv = 'chat:v:' + vid, kg = 'chat:g';
  var nv = Number(cache.get(kv) || 0), ng = Number(cache.get(kg) || 0);
  if (nv >= 5 || ng >= 60) return json_({ ok: false, error: 'rate' }); // tối đa 5 tin/10 phút mỗi khách, 60 tin/giờ toàn hệ thống
  cache.put(kv, String(nv + 1), 600); cache.put(kg, String(ng + 1), 3600);
  var thread = threadOf_(vid);
  var mid = telegramSend_('💬 Tin nhắn mới trong Kho\nMã hội thoại: ' + thread + '\nTên: ' + name + (contact ? '\nLiên hệ: ' + contact : '') +
    (page ? '\nTrang: ' + page : '') + '\n\n' + text + '\n\n👉 Trả lời: bấm Reply vào tin này (hoặc gõ /r ' + thread + ' nội dung).');
  var sh = chatSheet_();
  sh.appendRow([new Date(), thread, safeCell_(name), safeCell_(contact), 'Khách', safeCell_(text), mid, page]);
  return json_({ ok: true, thread: thread, tg: !!mid });
}

function chatGet_(b) {
  var vid = String(b.vid || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
  if (vid.length < 16) return json_({ ok: false, error: 'invalid' });
  var thread = threadOf_(vid);
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CHAT);
  if (!sh) return json_({ ok: true, msgs: [] });
  var rows = sh.getDataRange().getValues(), out = [];
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) !== thread) continue;
    out.push({ w: rows[i][4] === 'Admin' ? 'a' : 'k', t: String(rows[i][5]).slice(0, 1000), d: rows[i][0] instanceof Date ? rows[i][0].toISOString() : '' });
  }
  return json_({ ok: true, msgs: out.slice(-60) });
}

// Chạy mỗi phút (trigger): đọc câu trả lời của chủ trong Telegram và ghi vào tab Chat.
function pollTelegram() {
  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty('TELEGRAM_BOT_TOKEN'), chat = p.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chat) return;
  var off = Number(p.getProperty('TG_OFFSET') || 0);
  var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates?timeout=0&offset=' + off, { muteHttpExceptions: true });
  var j; try { j = JSON.parse(r.getContentText()); } catch (e) { return; }
  if (!j.ok || !j.result || !j.result.length) return;
  var sh = chatSheet_();
  j.result.forEach(function (u) {
    off = u.update_id + 1;
    var m = u.message;
    if (!m || !m.chat || String(m.chat.id) !== String(chat) || !m.text) return; // chỉ nhận từ chủ
    var thread = '', text = m.text;
    if (m.reply_to_message && m.reply_to_message.text) {
      var mm = m.reply_to_message.text.match(/Mã hội thoại:\s*(T[A-Z0-9]+)/);
      if (mm) thread = mm[1];
    }
    if (!thread) {
      var rc = text.match(/^\/r\s+(T[A-Za-z0-9]+)\s+([\s\S]+)/);
      if (rc) { thread = rc[1].toUpperCase(); text = rc[2]; }
    }
    if (!thread) return;
    sh.appendRow([new Date(), thread, 'Lan Anh', '', 'Admin', safeCell_(clean_(text, 1000)), String(m.message_id), '']);
  });
  p.setProperty('TG_OFFSET', String(off));
}

// Chạy 1 lần để bật trigger đọc trả lời mỗi phút.
function installChatTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'pollTelegram') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pollTelegram').timeBased().everyMinutes(1).create();
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
  var req = sheet_(REQ, REQ_HEADERS), items = sheet_(ITEMS, ITEM_HEADERS), chat = sheet_(CHAT, CHAT_HEADERS);
  var dash = ss.getSheetByName('Dashboard') || ss.insertSheet('Dashboard');
  // Dọn trang tính trống mặc định (Sheet1 / Trang tính1)
  ss.getSheets().forEach(function (sh) {
    var n = sh.getName();
    if (n !== REQ && n !== ITEMS && n !== VAULT && n !== CHAT && n !== GUIDE && n !== 'Dashboard' && sh.getLastRow() <= 1 && ss.getSheets().length > 3) ss.deleteSheet(sh);
  });
  formatRequests_(req);
  formatItems_(items);
  formatChat_(chat);
  // Tab nào khác được thêm vào Storage về sau (không phải tab hệ thống) cũng được áp template chung
  ss.getSheets().forEach(function (sh) {
    var n = sh.getName();
    if (n === REQ || n === ITEMS || n === CHAT || n === VAULT || n === GUIDE || n === 'Dashboard') return;
    try { formatAny_(sh); } catch (e) {}
  });
  buildDashboard_(dash, req);
  var guide = ss.getSheetByName(GUIDE) || ss.insertSheet(GUIDE);
  buildGuide_(guide, { dash: dash, req: req, items: items, chat: chat });
  ss.setActiveSheet(dash); ss.moveActiveSheet(1);
  ss.setActiveSheet(guide); ss.moveActiveSheet(2);
  ss.setActiveSheet(req); ss.moveActiveSheet(3);
  ss.setActiveSheet(items); ss.moveActiveSheet(4);
  ss.setActiveSheet(chat); ss.moveActiveSheet(5);
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

function formatChat_(sh) {
  var MAXR = 2000, cols = CHAT_HEADERS.length;
  sh.setTabColor(C.greenText);
  header_(sh, CHAT_HEADERS, C.greenText);
  ensureRows_(sh, MAXR);
  var n = MAXR - 1;
  sh.getRange(2, 1, n, cols).setVerticalAlignment('middle').setFontSize(10)
    .setBorder(false, false, true, false, false, false, '#CFE8D8', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(2, 1, n, 1).setNumberFormat('dd/MM/yyyy HH:mm');
  sh.getRange(2, 2, n, 1).setFontFamily('Roboto Mono').setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(2, 4, n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sh.getRange(2, 6, n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sh.getRange(2, 7, n, 1).setFontFamily('Roboto Mono').setFontColor(C.greyText);
  var who = sh.getRange(2, 5, n, 1);
  who.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Khách', 'Admin'], true).setAllowInvalid(false)
    .setHelpText('Khách = tin khách gửi · Admin = câu trả lời của bạn (lấy từ Telegram)').build())
    .setHorizontalAlignment('center').setFontWeight('bold');
  var rowRange = sh.getRange(2, 1, n, cols);
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="Khách"').setBackground(C.purpleSoft).setFontColor(C.purple).setBold(true).setRanges([who]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="Admin"').setBackground(C.green).setFontColor(C.greenText).setBold(true).setRanges([who]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$E2="Admin"').setBackground('#F1FAF5').setRanges([rowRange]).build()
  ]);
  [150, 120, 150, 180, 90, 420, 130, 90].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  var f = sh.getFilter(); if (f) f.remove();
  sh.getRange(1, 1, MAXR, cols).createFilter();
  sh.getRange(1, 2).setNote('Mã hội thoại (T + 8 ký tự). Trả lời trong Telegram bằng Reply, hoặc gõ /r <mã> nội dung.');
  sh.getRange(1, 1).setNote('Tab này do web ghi khi khách gửi tin trong khung chat. Câu trả lời của bạn được thêm tự động từ Telegram.');
}

// Template chung cho mọi tab khác trong Storage (tab hệ thống như Vault bị bỏ qua).
function formatAny_(sh) {
  if (sh.isSheetHidden() || sh.getLastRow() < 1) return;
  var cols = Math.max(1, sh.getLastColumn());
  var heads = sh.getRange(1, 1, 1, cols).getValues()[0];
  sh.setTabColor(C.greyText);
  header_(sh, heads, C.greyText);
  var rows = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, 1, rows, cols).setVerticalAlignment('middle').setFontSize(10)
    .setBorder(false, false, true, false, false, false, '#E0DCF5', SpreadsheetApp.BorderStyle.SOLID);
  for (var c = 1; c <= cols; c++) if (sh.getColumnWidth(c) < 120) sh.setColumnWidth(c, 150);
  var f = sh.getFilter(); if (f) f.remove();
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), cols).createFilter();
}

/* ================== THÔNG BÁO KHI MỞ SHEET ==================
 * Mở Sheet là hiện bảng "Thông báo LANHMAR": số yêu cầu truy cập đang chờ, số tin chat cần giải đáp, v.v.
 * Dùng simple trigger onOpen (chỉ đọc Sheet đang mở), nên không cần thêm quyền. Menu LANHMAR → Xem thông báo để xem lại. */

// Tính số liệu thông báo từ dữ liệu 2 tab (hàm thuần, dễ kiểm tra).
function noticeCalc_(reqRows, chatRows, itemsCount) {
  var out = { pending: 0, ready: 0, waiting: 0, approvedNoDonate: 0, total: 0, pendingList: [], threads: 0, msgs: 0, chatList: [], items: itemsCount || 0 };
  for (var i = 1; i < reqRows.length; i++) {
    var r = reqRows[i];
    if (!String(r[2] || '').trim()) continue;
    out.total++;
    var st = String(r[5] || ''), dn = String(r[9] || '');
    var paid = dn === 'Đã nhận' || dn.indexOf('Miễn') === 0;
    if (st === 'Pending') {
      out.pending++;
      if (paid) out.ready++; else out.waiting++;
      if (out.pendingList.length < 5) out.pendingList.push({ name: String(r[1] || ''), email: String(r[2] || ''), paid: paid });
    } else if (st === 'Approved' && (dn === '' || dn === 'Chưa nhận')) out.approvedNoDonate++;
  }
  // Theo từng cuộc chat: cuộc nào có tin cuối là của khách thì cần giải đáp; đếm tin khách gửi sau câu trả lời cuối của chủ
  var last = {}, order = [], lastAdmin = {}, unanswered = {};
  for (var j = 1; j < chatRows.length; j++) {
    var c = chatRows[j], th = String(c[1] || '');
    if (!th) continue;
    if (!last[th]) { order.push(th); unanswered[th] = 0; }
    var who = String(c[4] || '');
    last[th] = { who: who, name: String(c[2] || 'Khách'), text: String(c[5] || '') };
    if (who === 'Admin') unanswered[th] = 0; else unanswered[th]++;
  }
  order.forEach(function (th) {
    if (last[th].who === 'Khách') {
      out.threads++;
      out.msgs += unanswered[th];
      out.chatList.push({ thread: th, name: last[th].name, text: last[th].text.slice(0, 70) });
    }
  });
  out.chatList = out.chatList.slice(-5).reverse();
  return out;
}

function noticeEsc_(t) {
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function noticeHtml_(n) {
  function card(num, label, bg, fg, detail) {
    return '<div style="display:flex;gap:12px;align-items:flex-start;background:' + bg + ';border-radius:14px;padding:12px 14px;margin:8px 0">' +
      '<div style="font:800 28px/1 Arial;color:' + fg + ';min-width:38px;text-align:center">' + num + '</div>' +
      '<div style="flex:1"><div style="font:700 14px Arial;color:' + fg + '">' + label + '</div>' + (detail ? '<div style="font:12px/1.5 Arial;color:#241F45;margin-top:4px">' + detail + '</div>' : '') + '</div></div>';
  }
  var parts = [];
  if (n.pending) {
    var det = n.pendingList.map(function (p) { return '• ' + noticeEsc_(p.name) + ' (' + noticeEsc_(p.email) + ')' + (p.paid ? ' <b style="color:#17633A">đã có donate, duyệt được</b>' : ' <i>chờ donate</i>'); }).join('<br>');
    parts.push(card(n.pending, 'yêu cầu truy cập web đang chờ duyệt' + (n.ready ? ' · ' + n.ready + ' sẵn sàng duyệt' : ''), '#FFF4CC', '#7A5B00', det + '<br>Mở tab <b>Requests</b>, đổi Trạng thái thành Approved.'));
  }
  if (n.threads) {
    var d2 = n.chatList.map(function (c) { return '• <b>' + noticeEsc_(c.name) + '</b>: ' + noticeEsc_(c.text); }).join('<br>');
    parts.push(card(n.threads, 'cuộc chat cần giải đáp' + (n.msgs > n.threads ? ' (' + n.msgs + ' tin chưa trả lời)' : ''), '#E7E2FB', '#2D2FEF', d2 + '<br>Trả lời trong Telegram bằng Reply (hoặc <b>/r mã nội dung</b>).'));
  }
  if (n.approvedNoDonate) parts.push(card(n.approvedNoDonate, 'người đã duyệt nhưng chưa ghi donate', '#FBDADA', '#8E1B1B', 'Vào Requests, cột Donate chọn "Đã nhận" hoặc "Miễn".'));
  if (!parts.length) return '';
  var foot = '<div style="font:12px Arial;color:#55507A;margin-top:10px;border-top:1px dashed #D6CEF7;padding-top:8px">Tổng ' + n.total + ' yêu cầu · ' + n.items + ' mục đang chia sẻ. Mở lại bảng này: menu <b>LANHMAR → Xem thông báo</b>.</div>';
  return '<div style="font-family:Arial,sans-serif;padding:4px 2px"><div style="font:800 18px Arial;color:#2D2FEF;margin-bottom:2px">★ LANHMAR · Cần xử lý</div>' + parts.join('') + foot +
    '<div style="text-align:right;margin-top:10px"><button onclick="google.script.host.close()" style="background:#FF7A45;color:#241F45;border:2px solid #241F45;border-radius:999px;padding:8px 20px;font:700 13px Arial;cursor:pointer">Đã xem</button></div></div>';
}

function showNotices_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var req = ss.getSheetByName(REQ), chat = ss.getSheetByName(CHAT), items = ss.getSheetByName(ITEMS);
  var reqRows = req ? req.getDataRange().getValues() : [[]];
  var chatRows = chat ? chat.getDataRange().getValues() : [[]];
  var itemsCount = 0;
  if (items && items.getLastRow() > 1) items.getRange(2, 1, items.getLastRow() - 1, 1).getValues().forEach(function (r) { if (r[0]) itemsCount++; });
  var n = noticeCalc_(reqRows, chatRows, itemsCount);
  var html = noticeHtml_(n);
  if (!html) { ss.toast('Không có việc cần xử lý ✔ (' + n.total + ' yêu cầu, ' + n.items + ' mục chia sẻ)', 'LANHMAR', 6); return; }
  var blocks = (n.pending ? 1 : 0) + (n.threads ? 1 : 0) + (n.approvedNoDonate ? 1 : 0);
  SpreadsheetApp.getUi().showModelessDialog(HtmlService.createHtmlOutput(html).setWidth(480).setHeight(Math.min(560, 150 + 120 * blocks)), 'Thông báo LANHMAR');
}

function showNotices() { showNotices_(); }

// Chạy tự động khi mở Sheet: tạo menu LANHMAR và hiện bảng thông báo.
function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('LANHMAR').addItem('Xem thông báo', 'showNotices').addItem('Định dạng lại tất cả tab', 'formatSheets').addToUi();
  } catch (e) {}
  try { showNotices_(); } catch (e2) {}
}

/* ================== TAB HƯỚNG DẪN ==================
 * Nội dung do code tạo; chạy lại setup hoặc menu LANHMAR → Định dạng lại tất cả tab sẽ làm mới tab này.
 * Ghi chú riêng của bạn hãy để ở tab khác (tab mới sẽ tự được định dạng), đừng sửa tay tab này. */
function guideRows_(t) {
  // 'S' = tiêu đề mục, 'R' = dòng: [loại, mục, nội dung, việc cần làm / lưu ý, (công thức liên kết tuỳ chọn ở cột D)]
  return [
    ['S', '1. CÁC TAB TRONG FILE NÀY'],
    ['R', 'Dashboard', 'Số liệu nhanh: tổng yêu cầu, chờ duyệt, đã duyệt, donate; danh sách "sẵn sàng duyệt" và "đang chờ donate".', 'Chỉ xem. Tự cập nhật.', '=HYPERLINK("#gid=' + t.dash.getSheetId() + '","→ Mở Dashboard")'],
    ['R', 'Hướng dẫn', 'Tab này: cách dùng file và cách thao tác để đồng bộ đúng với website.', 'Chỉ đọc. Không sửa tay.'],
    ['R', 'Requests', 'Người đăng ký xem Data Storage trên web (họ tên, email, mã truy cập, trạng thái) và theo dõi donate.', 'Bạn sửa: Trạng thái, Ghi chú, Donate, Số tiền, Ngày nhận.', '=HYPERLINK("#gid=' + t.req.getSheetId() + '","→ Mở Requests")'],
    ['R', 'Items', 'Các mục bạn tích "Chia sẻ" trong Kho cá nhân. Web ghi vào đây khi bấm "Đồng bộ Storage".', 'Không sửa tay: lần đồng bộ sau sẽ ghi đè.', '=HYPERLINK("#gid=' + t.items.getSheetId() + '","→ Mở Items")'],
    ['R', 'Chat', 'Tin khách gửi từ khung chat trên web (Khách) và câu trả lời của bạn lấy từ Telegram (Admin).', 'Xem lịch sử. Trả lời trong Telegram, không gõ vào đây.', '=HYPERLINK("#gid=' + t.chat.getSheetId() + '","→ Mở Chat")'],
    ['R', 'Vault (ẩn)', 'Bản sao đã mã hoá của Kho cá nhân để mở kho trên mọi thiết bị bằng đăng nhập Google.', 'Không mở, không sửa, không xoá. Mất tab này = mất bản đồng bộ trên đám mây.'],

    ['S', '2. QUY TRÌNH HẰNG NGÀY'],
    ['R', 'Duyệt người xem', '1) Có người đăng ký: bot Telegram báo tên, email và "Nội dung CK" (LM + mã).\n2) Đối chiếu sao kê ngân hàng, thấy tiền thì vào Requests: cột Donate = "Đã nhận", điền Số tiền và Ngày nhận.\n3) Cột Gợi ý hiện "CÓ THỂ DUYỆT" thì đổi Trạng thái thành Approved.', 'Người xem vào Data Storage bằng email + mã. Thu quyền: Revoked. Từ chối: Rejected. Khoá KesFlow hoặc trường hợp đặc biệt: Donate = Miễn.'],
    ['R', 'Chia sẻ mục từ Kho', 'Trong Kho cá nhân: thêm/sửa mục, tích "Chia sẻ mục này trong Data Storage", rồi bấm "Đồng bộ Storage" ở chân trang và nhập ADMIN_KEY.', 'Tab Items cập nhật ngay. Bỏ tích rồi đồng bộ lại để gỡ mục khỏi Storage.'],
    ['R', 'Trả lời chat', 'Khách gửi tin trong khung chat 💬. Bot LanhMar Contact Bot nhắn bạn kèm "Mã hội thoại".\nTrả lời: bấm Reply vào đúng tin của bot, hoặc gõ /r <mã> nội dung.', 'Câu trả lời hiện trên web sau khoảng 1 đến 2 phút. Tab Chat ghi cả hai chiều.'],
    ['R', 'Bảng thông báo khi mở Sheet', 'Mở Sheet là hiện bảng "Cần xử lý": số yêu cầu truy cập đang chờ duyệt, số cuộc chat chưa giải đáp, số người đã duyệt nhưng chưa ghi donate. Không có việc gì thì hiện thông báo nhỏ "Không có việc cần xử lý".', 'Xem lại: menu LANHMAR → Xem thông báo. Bảng chỉ đọc dữ liệu, không thay đổi gì.'],
    ['R', 'Tin AI News', 'Tự lấy tin 10 hãng AI và bản phát hành Claude Code, dịch sang tiếng Việt, cache 5 phút.', 'Trên web bấm "Làm mới" nếu cần ngay.'],

    ['S', '3. ĐỒNG BỘ VỚI WEBSITE: LÀM ĐÚNG ĐỂ KHÔNG HỎNG'],
    ['R', 'KHÔNG đổi tên tab', 'Web tìm tab theo tên: Requests, Items, Chat, Vault, Dashboard, Hướng dẫn.', 'Đổi tên = web mất kết nối với tab đó.'],
    ['R', 'KHÔNG đổi hàng tiêu đề', 'Giữ nguyên hàng 1 và thứ tự cột. Không chèn, xoá hoặc đổi chỗ cột.', 'Cần thêm cột: nhờ Claude sửa code trước, rồi mới thêm.'],
    ['R', 'Cột được sửa tay', 'Requests: Trạng thái (F), Ghi chú của tôi (H), Donate (J), Số tiền (K), Ngày nhận (L).', 'Các cột còn lại (nhất là Mã truy cập, Nội dung CK, Gợi ý) do hệ thống điền và tính, đừng ghi đè.'],
    ['R', 'Thêm tab mới', 'Bạn có thể thêm tab ghi chú/báo cáo riêng.', 'Sau đó vào menu LANHMAR → Định dạng lại tất cả tab: tab mới tự nhận cùng kiểu (tiêu đề màu, cố định hàng đầu, bộ lọc).'],
    ['R', 'Khi sửa hoặc nâng cấp code', '1) Apps Script (mở từ Sheet): dán Code.gs mới → Lưu.\n2) Chạy hàm setup khi cần định dạng lại tab.\n3) Triển khai → Quản lý triển khai → bút chì trên triển khai đang dùng → Phiên bản: Phiên bản mới → Triển khai.', 'KHÔNG chọn "Triển khai mới": URL /exec sẽ đổi và web mất kết nối. Nếu lỡ đổi URL, cập nhật storage-config.js trên GitHub.'],

    ['S', '4. THIẾT LẬP (SCRIPT PROPERTIES)'],
    ['R', 'Nơi đặt', 'Apps Script → Cài đặt dự án → Thuộc tính tập lệnh.', 'Không ghi giá trị bí mật vào Sheet này.'],
    ['R', 'ADMIN_KEY', 'Khoá dùng khi bấm "Đồng bộ Storage".', 'Chuỗi dài, khó đoán. Đổi nếu nghi bị lộ.'],
    ['R', 'OWNER_EMAIL, GOOGLE_CLIENT_ID', 'Mail chủ kho và OAuth Client ID cho đăng nhập Google mở kho.', 'Chỉ mail chủ kho mới lấy được bản mã trong Vault.'],
    ['R', 'TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID', 'Token của LanhMar Contact Bot và mã chat của bạn, dùng cho thông báo và chat.', 'Lộ token: vào @BotFather → Revoke current token, rồi cập nhật lại.'],
    ['R', 'Trigger pollTelegram', 'Chạy mỗi phút để đọc câu trả lời chat của bạn từ Telegram.', 'Mất trigger thì chạy lại hàm installChatTrigger một lần.'],

    ['S', '5. SỰ CỐ THƯỜNG GẶP'],
    ['R', 'Web báo không kết nối được', 'Kiểm tra URL /exec trong storage-config.js còn đúng triển khai đang dùng, và mở URL đó phải thấy {"ok":true,...}.', 'Triển khai: Thực thi dưới tên "Tôi", Ai có quyền truy cập "Bất kỳ ai".'],
    ['R', 'Telegram không báo tin mới', 'Kiểm tra TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID và bạn đã nhắn bot một câu chưa.', 'Chạy thử hàm setup để cấp lại quyền nếu Google yêu cầu.'],
    ['R', 'Trả lời chat không hiện trên web', 'Dùng Reply đúng tin của bot (không gõ tin mới). Kiểm tra trigger pollTelegram có trong danh sách Trình kích hoạt.', 'Chờ 1 đến 2 phút.'],
    ['R', 'Tab nhìn lộn xộn', 'Menu LANHMAR → Định dạng lại tất cả tab (hoặc chạy hàm setup).', 'Không xoá dữ liệu.'],
    ['R', 'Quên mật khẩu kho', 'Mật khẩu không khôi phục được vì kho mã hoá ngay trên trình duyệt.', 'Luôn cất bản sao lưu kho.enc.json (nút "Xuất bản mã" trong Kho).'],

    ['S', '6. BẢO MẬT'],
    ['R', 'Chia sẻ file', 'Không chia sẻ Sheet này cho người khác: có email người đăng ký, tin chat và bản mã kho.', 'Cần người khác xem: tạo bản sao chỉ gồm tab cần thiết.'],
    ['R', 'Link công khai', 'Link Drive trong Kho nằm trong mã nguồn công khai trên GitHub.', 'Kiểm tra thư mục khoá trả phí chỉ chia sẻ cho đúng người.'],

    ['S', '7. LIÊN KẾT'],
    ['R', 'Kho cá nhân', 'Trang chính của Kho, đăng nhập Google rồi nhập mật khẩu.', 'Chỉ chủ kho.', '=HYPERLINK("https://lanhmar.id.vn/kho.html","→ lanhmar.id.vn/kho.html")'],
    ['R', 'Data Storage', 'Trang cho người được duyệt xem phần chia sẻ.', 'Công khai, cần email + mã.', '=HYPERLINK("https://lanhmar.id.vn/storage.html","→ lanhmar.id.vn/storage.html")'],
    ['R', 'Mã nguồn', 'Toàn bộ code web và Code.gs nằm trên GitHub.', 'Repo lanhmar-hub.', '=HYPERLINK("https://github.com/thecoolestmarperindawurl/lanhmar-hub","→ github.com/thecoolestmarperindawurl/lanhmar-hub")']
  ];
}

function buildGuide_(sh, t) {
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
  sh.clear();
  sh.clearConditionalFormatRules();
  var f0 = sh.getFilter(); if (f0) f0.remove();
  sh.setTabColor(C.yellowText);
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 24); sh.setColumnWidth(2, 230); sh.setColumnWidth(3, 640); sh.setColumnWidth(4, 330);
  sh.getRange('B2:D2').merge().setValue('★ LANHMAR · Hướng dẫn sử dụng file Storage').setFontSize(20).setFontWeight('bold')
    .setFontColor('#FFFFFF').setBackground(C.purple).setVerticalAlignment('middle').setHorizontalAlignment('left');
  sh.setRowHeight(2, 52);
  sh.getRange('B3:D3').merge().setValue('Xem lại khi quên: tab nào làm gì, thao tác nào để Sheet đồng bộ đúng với website, và cách xử lý sự cố. Tab này do code tạo, chạy lại setup sẽ làm mới.')
    .setFontColor(C.greyText).setFontSize(10).setBackground(C.purpleSoft).setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
  sh.setRowHeight(3, 32);
  var rows = guideRows_(t), r = 5;
  rows.forEach(function (x) {
    if (x[0] === 'S') {
      sh.getRange(r, 2, 1, 3).merge().setValue(x[1]).setFontWeight('bold').setFontSize(11).setFontColor('#FFFFFF')
        .setBackground(C.ink).setVerticalAlignment('middle');
      sh.setRowHeight(r, 30);
      r += 1;
      return;
    }
    sh.getRange(r, 2, 1, 3).setValues([[x[1], x[2], x[3]]]);
    if (x[4]) sh.getRange(r, 4).setFormula(x[4]).setFontColor(C.purple).setFontWeight('bold');
    sh.getRange(r, 2).setFontWeight('bold').setFontColor(C.purple);
    sh.getRange(r, 4).setFontColor(x[4] ? C.purple : C.greyText);
    r += 1;
  });
  var last = r - 1;
  sh.getRange(5, 2, last - 4, 3).setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top').setFontSize(10)
    .setBorder(false, false, true, false, false, false, '#E0DCF5', SpreadsheetApp.BorderStyle.SOLID);
  // Dòng thường nền nhạt xen kẽ để dễ đọc; dòng tiêu đề mục giữ nền đậm
  for (var i = 5; i <= last; i++) {
    var isHeader = rows[i - 5][0] === 'S';
    if (!isHeader) { sh.getRange(i, 2, 1, 3).setBackground(i % 2 ? '#FAF8FF' : '#FFFFFF'); sh.setRowHeight(i, Math.max(34, 18 * Math.ceil(String(rows[i - 5][2]).length / 95) + 8)); }
  }
  sh.setFrozenRows(3);
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
