/**
 * LANHMAR Data Storage — backend (Google Apps Script gắn với 1 Google Sheet).
 *
 * Sheet cần 2 tab (script tự tạo nếu chưa có):
 *   Requests: Time | Name | Email | Note | Code | Status
 *   Items:    id | kho | title | url | note | tags | type | date
 *
 * Duyệt người xem: đổi cột Status (Requests) từ "Pending" thành "Approved".
 * Thu quyền: đổi thành "Revoked" (hoặc xoá dòng).
 *
 * Script Properties cần đặt (Project Settings → Script properties):
 *   ADMIN_KEY           chuỗi bí mật dài, dùng để đồng bộ dữ liệu từ Kho cá nhân lên Sheet
 *   TELEGRAM_BOT_TOKEN  (tuỳ chọn) token bot từ @BotFather
 *   TELEGRAM_CHAT_ID    (tuỳ chọn) chat id của bạn để bot nhắn khi có đăng ký mới
 */

var REQ = 'Requests';
var ITEMS = 'Items';
var MAX_REQUESTS = 2000;

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
      payload: { chat_id: chat, text: text },
      muteHttpExceptions: true
    });
  } catch (e) {}
}

function doGet() {
  return json_({ ok: true, service: 'lanhmar-storage' });
}

function doPost(e) {
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
  var sh = sheet_(REQ, ['Time', 'Name', 'Email', 'Note', 'Code', 'Status']);
  var rows = sh.getDataRange().getValues();
  if (rows.length > MAX_REQUESTS) return json_({ ok: false, error: 'full' });
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === email) {
      // Đã đăng ký: không hiện lại mã (mã chỉ hiện đúng 1 lần cho người đăng ký)
      return json_({ ok: true, existing: true, status: String(rows[i][5]) });
    }
  }
  var code = newCode_();
  sh.appendRow([new Date(), safeCell_(name), email, safeCell_(note), code, 'Pending']);
  notify_('Yêu cầu truy cập Data Storage mới\nTên: ' + name + '\nEmail: ' + email + (note ? '\nGhi chú: ' + note : '') +
          '\n\nMở Sheet, đổi cột Status thành Approved để cấp quyền.');
  return json_({ ok: true, existing: false, code: code, status: 'Pending' });
}

function access_(b) {
  var email = clean_(b.email, 120).toLowerCase(), code = clean_(b.code, 20).toUpperCase();
  var sh = sheet_(REQ, ['Time', 'Name', 'Email', 'Note', 'Code', 'Status']);
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
  var sh = sheet_(ITEMS, ['id', 'kho', 'title', 'url', 'note', 'tags', 'type', 'date']);
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
  var sh = sheet_(ITEMS, ['id', 'kho', 'title', 'url', 'note', 'tags', 'type', 'date']);
  sh.clear();
  sh.appendRow(['id', 'kho', 'title', 'url', 'note', 'tags', 'type', 'date']);
  var data = items.map(function (it) {
    return [clean_(it.id, 40), clean_(it.kho, 20), safeCell_(clean_(it.title, 200)), clean_(it.url, 500),
            safeCell_(clean_(it.note, 1000)), safeCell_(clean_((it.tags || []).join(','), 200)), safeCell_(clean_(it.type, 40)), clean_(it.date, 20)];
  });
  if (data.length) sh.getRange(2, 1, data.length, 8).setValues(data);
  return json_({ ok: true, count: data.length });
}
