/**
 * LANHMAR Data Storage — backend (Google Apps Script + 1 Google Sheet).
 *
 * Tab Requests: Thời gian | Họ tên | Email | Lời nhắn | Mã truy cập | Trạng thái | Ngày duyệt | Ghi chú của tôi
 * Tab Items:    id | kho | title | url | note | tags | type | date   (web ghi đè khi bấm "Đồng bộ Storage")
 * Tab Dashboard: số liệu nhanh + danh sách đang chờ duyệt
 *
 * Duyệt người xem: đổi cột Trạng thái (Requests) từ Pending sang Approved.
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
var REQ_HEADERS = ['Thời gian', 'Họ tên', 'Email', 'Lời nhắn của người xin', 'Mã truy cập', 'Trạng thái', 'Ngày duyệt', 'Ghi chú của tôi'];
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
          '\n\n👉 Duyệt ngay: ' + SHEET_URL + '#gid=' + sh.getSheetId() +
          '\nĐổi cột Trạng thái thành Approved để cấp quyền.');
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
  sh.getRange('B3:K3').merge().setValue('Theo dõi yêu cầu truy cập: duyệt ở tab Requests, đổi cột "Trạng thái".')
    .setFontColor(C.greyText).setFontSize(10).setBackground(C.purpleSoft).setVerticalAlignment('middle');
  sh.setRowHeight(3, 28);

  kpi_(sh, 5, 2, 'TỔNG YÊU CẦU', '=COUNTA(Requests!C2:C)', C.purpleSoft, C.purple);
  kpi_(sh, 5, 4, 'CHỜ DUYỆT', '=COUNTIF(Requests!F2:F,"Pending")', C.yellow, C.yellowText);
  kpi_(sh, 5, 6, 'ĐÃ DUYỆT', '=COUNTIF(Requests!F2:F,"Approved")', C.green, C.greenText);
  kpi_(sh, 5, 8, 'THU QUYỀN / TỪ CHỐI', '=COUNTIF(Requests!F2:F,"Revoked")+COUNTIF(Requests!F2:F,"Rejected")', C.red, C.redText);
  kpi_(sh, 5, 10, 'MỤC CHIA SẺ', '=COUNTA(Items!A2:A)', C.orangeSoft, '#A6380D');
  sh.setRowHeight(5, 26); sh.setRowHeight(6, 30); sh.setRowHeight(7, 30);

  sh.getRange('B9:K9').merge().setValue('⏳ ĐANG CHỜ DUYỆT (mới nhất ở trên)').setFontWeight('bold')
    .setFontColor(C.yellowText).setBackground(C.yellow).setVerticalAlignment('middle');
  sh.setRowHeight(9, 30);
  sh.getRange('B10:F10').setValues([['Họ tên', 'Email', 'Lời nhắn', 'Mã', 'Thời gian']]).setFontWeight('bold').setFontColor(C.greyText)
    .setBorder(false, false, true, false, false, false, '#CFCADF', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('B11').setFormula('=IFERROR(QUERY(Requests!A2:H,"select B,C,D,E,A where F=\'Pending\' order by A desc limit 12",0),"Không có yêu cầu nào đang chờ ✔")');
  sh.getRange('B11:F22').setFontSize(10).setVerticalAlignment('middle');
  sh.getRange('E11:E22').setFontFamily('Roboto Mono').setFontWeight('bold');
  sh.getRange('F11:F22').setNumberFormat('dd/MM HH:mm');

  sh.getRange('B24:K29').merge().setValue(
    'CÁCH DÙNG NHANH\n1. Có yêu cầu mới → bot Telegram nhắn kèm link Sheet.\n2. Mở tab Requests, chọn ô Trạng thái của người đó → Approved (cho xem) hoặc Rejected (từ chối).\n3. Muốn thu quyền → đổi thành Revoked, họ mất quyền ngay lần tải sau.\n4. Mục chia sẻ lấy từ Kho cá nhân: tích "Chia sẻ" rồi bấm "Đồng bộ Storage".')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP).setVerticalAlignment('top').setFontSize(10)
    .setFontColor(C.ink).setBackground('#FAF8FF')
    .setBorder(true, true, true, true, false, false, C.purpleSoft, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  sh.getRange('B31').setFormula('=HYPERLINK("#gid=' + req.getSheetId() + '","→ Mở danh sách yêu cầu (Requests)")')
    .setFontWeight('bold').setFontColor(C.purple);
}
