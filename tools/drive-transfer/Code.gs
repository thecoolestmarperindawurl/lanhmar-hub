/**
 * LANHMAR Drive Transfer — chuyển (sao chép) dữ liệu từ Google Drive này sang Google Drive khác.
 *
 * Chạy trên tài khoản ĐÍCH. Tài khoản nguồn chỉ cần chia sẻ thư mục cho tài khoản đích (quyền Người xem là đủ).
 * Google sao chép phía máy chủ (File.makeCopy): không tải gì về máy, file lớn cũng không tốn băng thông của bạn.
 * Mỗi lượt chạy tối đa ~4,5 phút rồi tự hẹn lượt tiếp theo sau 1 phút cho tới khi xong.
 * Nhật ký từng file ghi vào sheet "Nhật ký"; chạy lại chỉ chép bù file chưa có (file lỗi, file mới thêm).
 *
 * Cài: tạo Google Sheet mới trên tài khoản đích → Tiện ích mở rộng → Apps Script → dán toàn bộ file này → Lưu
 *      → tải lại Sheet → menu "Chuyển Drive" → "Bắt đầu chuyển…".
 * Mã nguồn: https://github.com/thecoolestmarperindawurl/lanhmar-hub/tree/main/tools/drive-transfer
 */

const BUDGET_MS = 4.5 * 60 * 1000;     // dừng sớm trước giới hạn 6 phút/lượt của Apps Script
const NEXT_RUN_MS = 60 * 1000;         // nghỉ giữa hai lượt
const FLUSH_EVERY = 10;                // ghi nhật ký mỗi N dòng
const LOG_SHEET = 'Nhật ký';
const QUEUE_SHEET = '_queue';
const STATE_KEY = 'LM_DRIVE_TRANSFER';
const SHORTCUT = 'application/vnd.google-apps.shortcut';

const IS_VI = String(Session.getActiveUserLocale() || 'vi').toLowerCase().indexOf('vi') === 0;
function L(vi, en) { return IS_VI ? vi : en; }

/* ---------------- Menu ---------------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu(L('Chuyển Drive', 'Drive Transfer'))
    .addItem(L('Bắt đầu chuyển…', 'Start a transfer…'), 'startTransfer')
    .addItem(L('Xem tiến độ', 'Show progress'), 'showStatus')
    .addSeparator()
    .addItem(L('Tạm dừng', 'Pause'), 'pauseTransfer')
    .addItem(L('Tiếp tục', 'Resume'), 'resumeTransfer')
    .addItem(L('Quét lại và chép bù (file lỗi / file mới)', 'Rescan and copy missing files'), 'rescanTransfer')
    .addToUi();
}

function startTransfer() {
  const ui = SpreadsheetApp.getUi();
  const old = getState_();
  if (old && old.status === 'running') {
    const a = ui.alert(L('Đang có một lượt chuyển chạy dở. Bỏ nó và bắt đầu lượt mới?',
      'A transfer is still running. Drop it and start a new one?'), ui.ButtonSet.YES_NO);
    if (a !== ui.Button.YES) return;
  }

  const r1 = ui.prompt(L('1/2 · Thư mục NGUỒN', '1/2 · SOURCE folder'),
    L('Dán link thư mục trên Drive cũ (tài khoản cũ phải chia sẻ thư mục này cho tài khoản đang mở Sheet).',
      'Paste the folder link from the old Drive (the old account must share it with the account running this Sheet).'),
    ui.ButtonSet.OK_CANCEL);
  if (r1.getSelectedButton() !== ui.Button.OK) return;
  const srcId = parseId_(r1.getResponseText());
  let src;
  try { src = DriveApp.getFolderById(srcId); src.getName(); }
  catch (e) { ui.alert(L('Không mở được thư mục nguồn. Kiểm tra link và quyền chia sẻ.\n', 'Cannot open the source folder. Check the link and sharing.\n') + e.message); return; }

  const r2 = ui.prompt(L('2/2 · Thư mục ĐÍCH', '2/2 · DESTINATION folder'),
    L('Dán link thư mục đích trên Drive này (Drive của tôi hoặc Drive dùng chung). Để trống = tự tạo thư mục mới trong Drive của tôi.',
      'Paste the destination folder link on this Drive (My Drive or a shared drive). Leave empty to create a new folder in My Drive.'),
    ui.ButtonSet.OK_CANCEL);
  if (r2.getSelectedButton() !== ui.Button.OK) return;
  let dst;
  const dstText = r2.getResponseText().trim();
  try {
    if (dstText) { dst = DriveApp.getFolderById(parseId_(dstText)); dst.getName(); }
    else {
      const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      dst = DriveApp.getRootFolder().createFolder(src.getName() + L(' (chuyển ', ' (transfer ') + stamp + ')');
    }
  } catch (e) { ui.alert(L('Không mở/tạo được thư mục đích.\n', 'Cannot open/create the destination folder.\n') + e.message); return; }

  const same = old && old.srcId === srcId && old.dstId === dst.getId();
  if (!same) {   // lượt mới với cặp thư mục khác: cất nhật ký cũ, mở nhật ký mới
    const oldLog = SpreadsheetApp.getActive().getSheetByName(LOG_SHEET);
    if (oldLog && oldLog.getLastRow() > 1) oldLog.setName(LOG_SHEET + ' ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH.mm'));
    else if (oldLog) SpreadsheetApp.getActive().deleteSheet(oldLog);
  }
  resetQueue_([[srcId, dst.getId(), src.getName(), false, '']]);
  setState_({
    srcId: srcId, dstId: dst.getId(), srcName: src.getName(), dstUrl: dst.getUrl(),
    status: 'running', started: Date.now(), lastRun: 0, runs: 0,
    stats: same ? old.stats : { files: 0, folders: 0, bytes: 0, skipped: 0, errors: 0 }
  });

  logSheet_().activate();
  ui.alert(L('Đã bắt đầu (lượt đầu chạy trong vòng 1 phút). Script tự chạy từng lượt khoảng 5 phút cho tới khi xong, kể cả khi bạn đóng Sheet.\nTheo dõi ở sheet "Nhật ký" hoặc menu Chuyển Drive → Xem tiến độ.\n\nĐích: ',
    'Started (first round within a minute). The script runs in ~5-minute rounds until done, even if you close the Sheet.\nWatch the "Nhật ký" (log) sheet or Drive Transfer → Show progress.\n\nDestination: ') + dst.getUrl());
  kick_();
}

function pauseTransfer() {
  const s = getState_(); if (!s) return;
  s.status = 'paused'; setState_(s); clearTriggers_();
  SpreadsheetApp.getActive().toast(L('Đã tạm dừng. Bấm Tiếp tục để chạy lại.', 'Paused. Use Resume to continue.'));
}

function resumeTransfer() {
  const s = getState_();
  if (!s) { SpreadsheetApp.getUi().alert(L('Chưa có lượt chuyển nào.', 'No transfer yet.')); return; }
  if (!queueSheet_().getLastRow() || queueSheet_().getLastRow() < 2) { rescanTransfer(); return; }
  s.status = 'running'; setState_(s);
  kick_();
  SpreadsheetApp.getActive().toast(L('Sẽ chạy tiếp trong vòng 1 phút.', 'Resuming within a minute.'));
}

/** Quét lại toàn bộ cây nguồn: file đã chép (có trong nhật ký) được bỏ qua, chỉ chép phần còn thiếu. */
function rescanTransfer() {
  const s = getState_();
  if (!s) { SpreadsheetApp.getUi().alert(L('Chưa có lượt chuyển nào.', 'No transfer yet.')); return; }
  resetQueue_([[s.srcId, s.dstId, s.srcName, false, '']]);
  s.status = 'running'; s.stats.errors = 0; s.stats.skipped = 0; setState_(s);
  kick_();
  SpreadsheetApp.getActive().toast(L('Đang quét lại, chỉ chép file còn thiếu.', 'Rescanning; only missing files will be copied.'));
}

function showStatus() {
  const s = getState_();
  if (!s) { SpreadsheetApp.getUi().alert(L('Chưa có lượt chuyển nào.', 'No transfer yet.')); return; }
  const q = Math.max(queueSheet_().getLastRow() - 1, 0);
  const st = { running: L('đang chạy', 'running'), paused: L('tạm dừng', 'paused'), done: L('xong', 'done') }[s.status] || s.status;
  SpreadsheetApp.getUi().alert(
    L('Trạng thái: ', 'Status: ') + st + '\n' +
    L('Nguồn: ', 'Source: ') + s.srcName + '\n' +
    L('Đích: ', 'Destination: ') + s.dstUrl + '\n\n' +
    L('Đã chép: ', 'Copied: ') + s.stats.files + L(' file · ', ' files · ') + fmtBytes_(s.stats.bytes) + '\n' +
    L('Thư mục đã tạo: ', 'Folders created: ') + s.stats.folders + '\n' +
    L('Bỏ qua (lối tắt): ', 'Skipped (shortcuts): ') + s.stats.skipped + '\n' +
    L('Lỗi: ', 'Errors: ') + s.stats.errors + '\n' +
    L('Thư mục còn chờ: ', 'Folders waiting: ') + q + '\n' +
    L('Số lượt đã chạy: ', 'Rounds so far: ') + s.runs +
    (s.lastRun ? '\n' + L('Lượt gần nhất: ', 'Last round: ') + new Date(s.lastRun).toLocaleString() : ''));
}

/* ---------------- Vòng chạy chính ---------------- */

function runBatch() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;            // đã có lượt khác đang chạy
  const t0 = Date.now();
  clearTriggers_();
  let s = getState_();
  try {
    if (!s || s.status !== 'running') return;
    const done = loadDone_();
    const log = [];
    let finished = false;

    while (Date.now() - t0 < BUDGET_MS) {
      const row = queueHead_();
      if (!row) { finished = true; break; }
      const res = processFolder_(row, t0, done, log, s.stats);
      flushLog_(log);
      if (res === 'done') queueSheet_().deleteRow(2);
      else break;
    }
    flushLog_(log);

    s = Object.assign(getState_() || s, { stats: s.stats, lastRun: Date.now(), runs: (s.runs || 0) + 1 });
    if (finished) {
      s.status = 'done'; setState_(s);
      notifyDone_(s);
    } else {
      setState_(s);
      if (s.status === 'running') ScriptApp.newTrigger('runBatch').timeBased().after(NEXT_RUN_MS).create();
    }
  } catch (e) {
    // lỗi bất ngờ (hết hạn mức ngày, mất mạng…): ghi lại và thử lại sau 10 phút
    logSheet_().appendRow([new Date(), L('LỖI LƯỢT', 'ROUND ERROR'), '', '', '', '', '', String(e && e.message || e)]);
    if (s && s.status === 'running') ScriptApp.newTrigger('runBatch').timeBased().after(10 * NEXT_RUN_MS).create();
  } finally {
    lock.releaseLock();
  }
}

/** Xử lý một thư mục: tạo thư mục con bên đích (đưa vào hàng đợi) rồi chép file. Trả 'done' hoặc 'paused'. */
function processFolder_(row, t0, done, log, stats) {
  const [srcId, dstId, path, foldersDone, token] = row;
  let src, dst;
  try { src = DriveApp.getFolderById(srcId); dst = DriveApp.getFolderById(dstId); }
  catch (e) { log.push(logRow_('LỖI', path, 'folder', '', srcId, '', e.message)); stats.errors++; return 'done'; }

  if (!foldersDone) {
    const children = [];
    const it = src.getFolders();
    while (it.hasNext()) {
      const f = it.next();
      const name = f.getName();
      const ex = dst.getFoldersByName(name);
      let d;
      if (ex.hasNext()) d = ex.next();
      else { d = retry_(() => dst.createFolder(name)); stats.folders++; }
      children.push([f.getId(), d.getId(), path + '/' + name, false, '']);
    }
    const q = queueSheet_();
    if (children.length) q.getRange(q.getLastRow() + 1, 1, children.length, 5).setValues(children);
    q.getRange(2, 4).setValue(true);
  }

  const files = token ? DriveApp.continueFileIterator(token) : src.getFiles();
  while (files.hasNext()) {
    if (Date.now() - t0 > BUDGET_MS) {
      queueSheet_().getRange(2, 5).setValue(files.getContinuationToken());
      return 'paused';
    }
    const f = files.next();
    const id = f.getId();
    if (done[id]) continue;
    const name = f.getName();
    const p = path + '/' + name;
    let mime = '';
    try {
      mime = f.getMimeType();
      if (mime === SHORTCUT) {
        log.push(logRow_('BỎ QUA', p, mime, '', id, '', L('Lối tắt (shortcut): chia sẻ/chuyển thư mục gốc của nó', 'Shortcut: share/transfer its target instead')));
        stats.skipped++;
      } else {
        const size = f.getSize();
        const c = retry_(() => f.makeCopy(name, dst));
        try { if (f.getDescription()) c.setDescription(f.getDescription()); } catch (e) {}
        done[id] = 1;
        stats.files++; stats.bytes += size;
        log.push(logRow_('OK', p, mime, size, id, c.getUrl(), ''));
      }
    } catch (e) {
      stats.errors++;
      log.push(logRow_('LỖI', p, mime, '', id, '', explain_(e)));
    }
    if (log.length >= FLUSH_EVERY) flushLog_(log);
  }
  return 'done';
}

/* ---------------- Tiện ích ---------------- */

function retry_(fn) {
  for (let i = 0; ; i++) {
    try { return fn(); }
    catch (e) {
      const m = String(e && e.message || e);
      const transient = /rate|limit exceeded|service error|internal error|try again|timed out|backend/i.test(m);
      if (!transient || i >= 3) throw e;
      Utilities.sleep(1000 * Math.pow(2, i + 1));
    }
  }
}

function explain_(e) {
  const m = String(e && e.message || e);
  if (/permission|access denied|quyền/i.test(m)) return L('Không có quyền sao chép (chủ file chặn tải/sao chép?) — ', 'No permission to copy (owner disabled download/copy?) — ') + m;
  if (/storage|quota|bộ nhớ/i.test(m)) return L('Hết dung lượng hoặc hạn mức ngày (750 GB/24 giờ) — ', 'Out of storage or daily limit (750 GB/24h) — ') + m;
  return m;
}

function parseId_(text) {
  const t = String(text || '').trim();
  const m = t.match(/\/folders\/([\w-]{10,})/) || t.match(/[?&]id=([\w-]{10,})/) || t.match(/\/d\/([\w-]{10,})/);
  return m ? m[1] : t;
}

function fmtBytes_(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return n.toFixed(i ? 1 : 0) + ' ' + u[i];
}

function logRow_(status, path, mime, size, srcId, dstUrl, note) {
  return [new Date(), status, path, String(mime || '').replace('application/vnd.google-apps.', 'google-'), size === '' ? '' : fmtBytes_(size), srcId, dstUrl, note];
}

function flushLog_(log) {
  if (!log.length) return;
  const sh = logSheet_();
  sh.getRange(sh.getLastRow() + 1, 1, log.length, 8).setValues(log);
  log.length = 0;
}

/** ID nguồn đã chép thành công (cột F, trạng thái OK) để chạy lại không chép trùng. */
function loadDone_() {
  const sh = logSheet_();
  const n = sh.getLastRow() - 1;
  const done = {};
  if (n < 1) return done;
  sh.getRange(2, 2, n, 5).getValues().forEach(r => { if (r[0] === 'OK' && r[4]) done[r[4]] = 1; });
  return done;
}

function logSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOG_SHEET, 0);
    sh.getRange(1, 1, 1, 8).setValues([[L('Thời gian', 'Time'), L('Trạng thái', 'Status'), L('Đường dẫn', 'Path'), L('Loại', 'Type'),
      L('Dung lượng', 'Size'), L('ID nguồn', 'Source ID'), L('Link bản chép', 'Copy link'), L('Ghi chú', 'Note')]])
      .setFontWeight('bold').setBackground('#2D2FEF').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 380); sh.setColumnWidth(8, 320);
  }
  return sh;
}

function queueSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(QUEUE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(QUEUE_SHEET);
    sh.getRange(1, 1, 1, 5).setValues([['srcId', 'dstId', 'path', 'foldersDone', 'fileToken']]);
    sh.hideSheet();
  }
  return sh;
}

function queueHead_() {
  const sh = queueSheet_();
  if (sh.getLastRow() < 2) return null;
  const r = sh.getRange(2, 1, 1, 5).getValues()[0];
  if (!r[0]) { sh.deleteRow(2); return queueHead_(); }
  return [String(r[0]), String(r[1]), String(r[2]), r[3] === true || r[3] === 'TRUE', String(r[4] || '')];
}

function resetQueue_(rows) {
  const sh = queueSheet_();
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
  sh.getRange(2, 1, rows.length, 5).setValues(rows);
}

function getState_() {
  const v = PropertiesService.getDocumentProperties().getProperty(STATE_KEY);
  return v ? JSON.parse(v) : null;
}
function setState_(s) { PropertiesService.getDocumentProperties().setProperty(STATE_KEY, JSON.stringify(s)); }

/** Chạy nền qua trigger thay vì giữ Sheet bận 5 phút. */
function kick_() { clearTriggers_(); ScriptApp.newTrigger('runBatch').timeBased().after(1000).create(); }

function clearTriggers_() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'runBatch') ScriptApp.deleteTrigger(t); });
}

function notifyDone_(s) {
  const body = L('Chuyển Drive xong: ', 'Drive transfer finished: ') + s.srcName + '\n' +
    L('Đã chép ', 'Copied ') + s.stats.files + L(' file (', ' files (') + fmtBytes_(s.stats.bytes) + '), ' +
    s.stats.folders + L(' thư mục, ', ' folders, ') + s.stats.errors + L(' lỗi, ', ' errors, ') + s.stats.skipped + L(' bỏ qua.', ' skipped.') + '\n' +
    L('Đích: ', 'Destination: ') + s.dstUrl + '\n' +
    L('Nhật ký: ', 'Log: ') + SpreadsheetApp.getActive().getUrl() + '\n\n' +
    (s.stats.errors ? L('Có file lỗi: xem sheet Nhật ký (lọc LỖI), sửa nguyên nhân rồi chọn "Quét lại và chép bù".',
      'Some files failed: filter the log by LỖI, fix the cause, then use "Rescan and copy missing files".') : '');
  try { MailApp.sendEmail(Session.getEffectiveUser().getEmail(), L('[LANHMAR] Chuyển Drive xong', '[LANHMAR] Drive transfer finished'), body); } catch (e) {}
  try { SpreadsheetApp.getActive().toast(L('Chuyển xong!', 'Transfer finished!'), 'Drive Transfer', 10); } catch (e) {}
}
