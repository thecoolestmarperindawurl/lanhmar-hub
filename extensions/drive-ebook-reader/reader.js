// Drive Ebook Reader — LANHMAR
// Trang đọc: nạp PDF theo từng đoạn (HTTP Range) thẳng từ Drive API, EPUB nạp vào bộ nhớ; không ghi gì xuống đĩa.
// Reader page: streams PDF chunks (HTTP Range) straight from the Drive API, loads EPUB into memory; nothing is written to disk.

import * as pdfjsLib from './vendor/pdfjs/pdf.min.mjs';

const HAS_EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.getURL);
const BASE = HAS_EXT ? chrome.runtime.getURL('') : new URL('./', location.href).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + 'vendor/pdfjs/pdf.worker.min.mjs';

const CHUNK = 1 << 20; // 1 MiB mỗi lần lấy / per range request
const API = 'https://www.googleapis.com/drive/v3/';
const FOLDER = 'application/vnd.google-apps.folder';
const DOC_EXPORT = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.drawing',
]);

// ---------- Ngôn ngữ / language ----------
const params = new URLSearchParams(location.search);
const VI = (params.get('lang') || navigator.language || '').toLowerCase().startsWith('vi');
const T = (vi, en) => (VI ? vi : en);
document.documentElement.lang = VI ? 'vi' : 'en';

const $ = (id) => document.getElementById(id);
const el = {
  title: $('title'), ctrlPdf: $('ctrlPdf'), ctrlEpub: $('ctrlEpub'), net: $('net'),
  home: $('home'), err: $('err'), status: $('status'), statusMsg: $('statusMsg'), statusSub: $('statusSub'),
  pdfView: $('pdfView'), epubWrap: $('epubWrap'), epubView: $('epubView'), toc: $('toc'),
  driveLink: $('driveLink'), setup: $('setup'), folder: $('folder'), folderList: $('folderList'),
};

function applyStaticText() {
  $('hTitle').textContent = T('Đọc ebook trên Google Drive, không cần tải về', 'Read Google Drive ebooks without downloading');
  $('hLead').textContent = T(
    'Dán link hoặc ID file PDF/EPUB trên Drive. Mình chỉ nạp phần đang đọc, nên file vài trăm MB vẫn mở được dù Drive không xem trước nổi.',
    'Paste a Drive link or file ID for a PDF/EPUB. Only the part you are reading is fetched, so files of several hundred MB open even when Drive cannot preview them.');
  $('linkIn').placeholder = 'https://drive.google.com/file/d/…/view';
  $('linkBtn').textContent = T('Mở', 'Open');
  $('hHint').textContent = T('Mẹo: trên trang Drive của file, bấm nút tím “Đọc không cần tải” ở góc dưới phải.', 'Tip: on the Drive page of a file, click the purple “Read without downloading” button at the bottom right.');
  $('hOr').textContent = T('hoặc', 'or');
  $('fileLbl').textContent = T('Mở file PDF/EPUB từ máy', 'Open a PDF/EPUB from this computer');
  $('errRetry').textContent = T('Thử lại', 'Retry');
  $('errHome').textContent = T('Mở file khác', 'Open another file');
  $('prev').title = $('ePrev').title = T('Trang trước', 'Previous page');
  $('next').title = $('eNext').title = T('Trang sau', 'Next page');
  $('zoomOut').title = T('Thu nhỏ', 'Zoom out'); $('zoomIn').title = T('Phóng to', 'Zoom in');
  $('fitW').title = T('Vừa chiều rộng', 'Fit width');
  $('tocBtn').title = T('Mục lục', 'Table of contents');
  $('fontDown').title = T('Chữ nhỏ hơn', 'Smaller text'); $('fontUp').title = T('Chữ lớn hơn', 'Larger text');
  $('theme').title = T('Giao diện sáng / sepia / tối', 'Light / sepia / dark');
  $('openOther').title = T('Mở file khác', 'Open another file');
  el.driveLink.title = T('Mở trên Google Drive', 'Open in Google Drive');
}
applyStaticText();

// ---------- Tiện ích / helpers ----------
const fmtBytes = (n) => {
  if (!Number.isFinite(n)) return '?';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
};
const storage = {
  async get(key) {
    if (HAS_EXT && chrome.storage) return (await chrome.storage.local.get(key))[key];
    try { return JSON.parse(localStorage.getItem(key)); } catch { return undefined; }
  },
  async set(key, val) {
    if (HAS_EXT && chrome.storage) return chrome.storage.local.set({ [key]: val });
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
  },
};
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function show(which) {
  for (const k of ['home', 'err', 'folder', 'pdfView', 'epubWrap']) el[k].hidden = k !== which;
  el.ctrlPdf.hidden = which !== 'pdfView';
  el.ctrlEpub.hidden = which !== 'epubWrap';
}
function status(msg, sub) {
  if (msg == null) { el.status.hidden = true; return; }
  el.status.hidden = false;
  el.statusMsg.textContent = msg;
  el.statusSub.textContent = sub || '';
}
function setNet(loaded, total, label) {
  el.net.textContent = label || (total ? `${T('Đã nạp', 'Fetched')} ${fmtBytes(loaded)} / ${fmtBytes(total)}` : '');
  el.net.title = total ? T('Chỉ nạp phần cần hiển thị, không lưu file xuống máy', 'Only what is displayed is fetched; nothing is saved to disk') : '';
}

class DriveError extends Error {
  constructor(status, body) { super('HTTP ' + status); this.status = status; this.body = body; }
}

function explain(e) {
  if (e instanceof DriveError) {
    if (e.status === 401) return T('Phiên đăng nhập Google hết hạn. Bấm Thử lại để đăng nhập.', 'Google sign-in expired. Click Retry to sign in again.');
    if (e.status === 403) return T('Google từ chối truy cập: kiểm tra Drive API đã bật trong Google Cloud, tài khoản đã được thêm làm “Test user”, và bạn có quyền xem file này.', 'Google refused access: check that the Drive API is enabled in Google Cloud, your account is added as a “Test user”, and you can view this file.');
    if (e.status === 404) return T('Không tìm thấy file. Link sai, hoặc tài khoản Google đang đăng nhập không có quyền xem.', 'File not found. The link is wrong, or the signed-in Google account cannot view it.');
    return T('Drive API trả lỗi', 'Drive API error') + ' ' + e.status + '.';
  }
  const m = String(e && e.message || e);
  if (/OAuth2 not granted|canceled|cancelled|did not approve/i.test(m)) return T('Bạn chưa cấp quyền đọc Drive cho extension.', 'You did not grant the extension read access to Drive.');
  if (/bad client id|invalid_client|client_id/i.test(m)) return T('Client ID OAuth chưa đúng. Xem phần “Cài đặt OAuth” trong README.', 'The OAuth client ID is wrong. See “OAuth setup” in the README.');
  if (/Invalid PDF|PDF header/i.test(m)) return T('File không phải PDF hợp lệ hoặc bị hỏng.', 'The file is not a valid PDF or is corrupted.');
  if (/password/i.test(m)) return T('PDF có mật khẩu; bản này chưa hỗ trợ.', 'The PDF is password protected; not supported yet.');
  return m;
}

let lastJob = null;
function showError(e, retry) {
  console.error(e);
  status(null);
  show('err');
  $('errTitle').textContent = T('Không mở được', 'Could not open');
  $('errMsg').textContent = explain(e);
  const detail = e instanceof DriveError ? (e.body || '') : (e && e.stack) || '';
  $('errDetail').hidden = !detail;
  $('errDetail').textContent = String(detail).slice(0, 2000);
  lastJob = retry || null;
  $('errRetry').hidden = !retry;
}

// ---------- Google Drive ----------
function clientIdMissing() {
  if (!HAS_EXT) return true;
  const o = chrome.runtime.getManifest().oauth2;
  return !o || !o.client_id || /^PASTE/.test(o.client_id);
}
async function getToken(interactive = true) {
  const r = await chrome.identity.getAuthToken({ interactive });
  return typeof r === 'string' ? r : r && r.token;
}
async function driveFetch(path, init = {}, retry = true) {
  const token = await getToken(true);
  const headers = Object.assign({}, init.headers || {}, { Authorization: 'Bearer ' + token });
  const res = await fetch(API + path, Object.assign({}, init, { headers }));
  if (res.status === 401 && retry) {
    await chrome.identity.removeCachedAuthToken({ token });
    return driveFetch(path, init, false);
  }
  if (!res.ok) throw new DriveError(res.status, await res.text().catch(() => ''));
  return res;
}
async function driveMeta(id) {
  const res = await driveFetch(`files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,webViewLink,fileExtension,parents&supportsAllDrives=true`);
  return res.json();
}
async function driveList(folderId) {
  const files = []; let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await driveFetch(`files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size)&orderBy=folder,name_natural&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true` + (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''));
    const j = await res.json();
    files.push(...(j.files || []));
    pageToken = j.nextPageToken || '';
  } while (pageToken && files.length < 2000);
  return files;
}

// ---------- Thư mục / folder listing ----------
function navigateTo(id) {
  history.pushState(null, '', location.pathname + '?id=' + encodeURIComponent(id));
  openDrive(id);
}
async function openFolder(meta) {
  status(T('Đang đọc danh sách thư mục…', 'Listing the folder…'), meta.name);
  const files = await driveList(meta.id);
  status(null); show('folder');
  $('folderTitle').textContent = '📁 ' + (meta.name || '');
  const readable = files.filter((f) => f.mimeType === FOLDER || kindOf(f.mimeType, f.name));
  $('folderLead').textContent = readable.length
    ? T(`${files.length} mục · chọn một cuốn để đọc`, `${files.length} items · pick a book to read`)
    : T('Thư mục này chưa có PDF/EPUB hay thư mục con nào đọc được.', 'No readable PDF/EPUB or sub-folder in this folder.');
  const list = el.folderList; list.innerHTML = '';
  const parent = meta.parents && meta.parents[0];
  if (parent) {
    const up = document.createElement('a'); up.href = '#'; up.className = 'up';
    up.innerHTML = '<span class="ico">↰</span><span class="nm"></span>';
    up.querySelector('.nm').textContent = T('Thư mục cha', 'Parent folder');
    up.onclick = (e) => { e.preventDefault(); navigateTo(parent); };
    list.appendChild(up);
  }
  const ICON = { folder: '📁', pdf: '📄', epub: '📚', gdoc: '📝' };
  for (const f of files) {
    const kind = f.mimeType === FOLDER ? 'folder' : kindOf(f.mimeType, f.name);
    const row = document.createElement(kind ? 'a' : 'div');
    row.className = kind ? '' : 'dim';
    const ico = document.createElement('span'); ico.className = 'ico'; ico.textContent = ICON[kind] || '•';
    const nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = f.name; nm.title = f.name;
    const sz = document.createElement('span'); sz.className = 'sz'; sz.textContent = f.size ? fmtBytes(+f.size) : '';
    row.append(ico, nm, sz);
    if (kind) {
      row.href = '#';
      row.onclick = (e) => { e.preventDefault(); navigateTo(f.id); };
    } else {
      const ext = document.createElement('a'); ext.className = 'ext'; ext.target = '_blank'; ext.rel = 'noopener';
      ext.href = 'https://drive.google.com/file/d/' + encodeURIComponent(f.id) + '/view'; ext.textContent = 'Drive ↗';
      row.appendChild(ext);
    }
    list.appendChild(row);
  }
}
window.addEventListener('popstate', () => {
  const id = new URLSearchParams(location.search).get('id');
  if (id) openDrive(id); else goHome();
});
function driveRangeFetcher(id) {
  const path = `files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`;
  return async (begin, end) => {
    const res = await driveFetch(path, { headers: { Range: `bytes=${begin}-${end - 1}` } });
    const buf = await res.arrayBuffer();
    // Máy chủ bỏ qua Range (trả 200 cả file) thì cắt lấy đoạn cần. / If Range was ignored (200, whole body), slice.
    if (res.status === 200 && buf.byteLength > end - begin) return buf.slice(begin, end);
    return buf;
  };
}
async function fetchWhole(res, total, onProgress) {
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const parts = []; let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value); loaded += value.byteLength;
    onProgress && onProgress(loaded, total);
  }
  const out = new Uint8Array(loaded); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  return out;
}
const localRangeFetcher = (file) => (begin, end) => file.slice(begin, end).arrayBuffer();

// ---------- PDF ----------
class RangeTransport extends pdfjsLib.PDFDataRangeTransport {
  constructor(length, initialData, fetchRange, onProgress, onError) {
    super(length, initialData);
    this.fetchRange = fetchRange; this.onProgress = onProgress; this.onError = onError;
    this.loaded = initialData.byteLength; this.aborted = false;
  }
  requestDataRange(begin, end) {
    this.fetchRange(begin, end).then((buf) => {
      if (this.aborted) return;
      this.loaded += buf.byteLength;
      this.onProgress(this.loaded, this.length);
      this.onDataRange(begin, new Uint8Array(buf));
    }).catch((e) => { if (!this.aborted) this.onError(e); });
  }
  abort() { this.aborted = true; }
}

const pdf = {
  doc: null, task: null, transport: null, key: null,
  pages: [],          // { div, canvas, text, w, h, rendered, renderTask, pageObj }
  scale: 1, fit: true, base: null, // base = kích thước trang 1 ở scale 1 / page 1 size at scale 1
  observer: null, current: 1,
};

async function closeCurrent() {
  if (pdf.observer) { pdf.observer.disconnect(); pdf.observer = null; }
  for (const p of pdf.pages) { if (p.renderTask) p.renderTask.cancel(); }
  pdf.pages = [];
  el.pdfView.innerHTML = '';
  if (pdf.transport) pdf.transport.abort();
  if (pdf.task) { try { await pdf.task.destroy(); } catch { /* ignore */ } }
  pdf.doc = pdf.task = pdf.transport = null;
  if (epub.rendition) { try { epub.rendition.destroy(); } catch { /* ignore */ } }
  if (epub.book) { try { epub.book.destroy(); } catch { /* ignore */ } }
  epub.book = epub.rendition = null;
  el.epubView.innerHTML = ''; el.toc.innerHTML = ''; el.toc.hidden = true;
  el.driveLink.hidden = true; setNet(0, 0, ''); el.title.textContent = ''; el.title.title = '';
  document.title = 'Drive Ebook Reader — LANHMAR';
}

async function openPdf({ key, name, length, fetchRange, data }) {
  pdf.key = key;
  status(T('Đang nạp phần đầu của PDF…', 'Fetching the start of the PDF…'), name);
  const common = {
    standardFontDataUrl: BASE + 'vendor/pdfjs/standard_fonts/',
    cMapUrl: BASE + 'vendor/pdfjs/cmaps/', cMapPacked: true,
    wasmUrl: BASE + 'vendor/pdfjs/wasm/',
    isEvalSupported: false,
  };
  let src;
  if (data) {
    src = Object.assign({ data }, common);
    setNet(data.byteLength, data.byteLength);
  } else {
    const first = await fetchRange(0, Math.min(CHUNK, length));
    setNet(first.byteLength, length);
    pdf.transport = new RangeTransport(length, new Uint8Array(first), fetchRange, setNet, (e) => showError(e));
    src = Object.assign({ range: pdf.transport, rangeChunkSize: CHUNK, disableAutoFetch: true, disableStream: true }, common);
  }
  pdf.task = pdfjsLib.getDocument(src);
  pdf.doc = await pdf.task.promise;
  const saved = (await storage.get('pos:' + key)) || {};
  pdf.fit = saved.fit !== false;
  pdf.scale = saved.scale || 1;
  show('pdfView'); // hiện trước để đo chiều rộng / show first so width can be measured
  await buildPdfPages();
  status(null);
  if (saved.page > 1) gotoPage(saved.page, false);
  el.pdfView.focus();
}

async function buildPdfPages() {
  const n = pdf.doc.numPages;
  const p1 = await pdf.doc.getPage(1);
  const vp = p1.getViewport({ scale: 1 });
  pdf.base = { w: vp.width, h: vp.height };
  $('pageOf').textContent = '/ ' + n;
  $('pageIn').max = n;
  if (pdf.fit) pdf.scale = fitScale();
  const frag = document.createDocumentFragment();
  pdf.pages = [];
  for (let i = 1; i <= n; i++) {
    const div = document.createElement('div');
    div.className = 'page'; div.dataset.page = i;
    const num = document.createElement('span'); num.className = 'num'; num.textContent = i;
    div.appendChild(num);
    frag.appendChild(div);
    pdf.pages.push({ div, w: pdf.base.w, h: pdf.base.h, rendered: false, renderTask: null, pageObj: i === 1 ? p1 : null, canvas: null, text: null });
  }
  el.pdfView.appendChild(frag);
  layoutPages();
  pdf.observer = new IntersectionObserver(onPagesVisible, { root: el.pdfView, rootMargin: '200% 0px' });
  for (const p of pdf.pages) pdf.observer.observe(p.div);
  updateZoomLabel();
}

function fitScale() {
  const avail = Math.min(el.pdfView.clientWidth - 32, 1100);
  return Math.max(0.2, Math.min(6, avail / pdf.base.w));
}
function layoutPages() {
  for (const p of pdf.pages) {
    p.div.style.width = Math.floor(p.w * pdf.scale) + 'px';
    p.div.style.height = Math.floor(p.h * pdf.scale) + 'px';
    p.div.style.setProperty('--scale-factor', pdf.scale);
    p.div.style.setProperty('--total-scale-factor', pdf.scale);
  }
}
function updateZoomLabel() { $('zoomLabel').textContent = Math.round(pdf.scale * 100) + '%'; }

const near = new Set();
function onPagesVisible(entries) {
  for (const e of entries) {
    const i = +e.target.dataset.page;
    if (e.isIntersecting) { near.add(i); renderPage(i); } else { near.delete(i); }
  }
  // Giải phóng trang ở xa để tiết kiệm RAM / free far-away pages
  for (const p of pdf.pages) {
    const i = +p.div.dataset.page;
    if (p.rendered && !near.has(i) && Math.abs(i - pdf.current) > 4) unrenderPage(p);
  }
}
function unrenderPage(p) {
  if (p.renderTask) { p.renderTask.cancel(); p.renderTask = null; }
  if (p.canvas) { p.canvas.width = p.canvas.height = 0; p.canvas.remove(); p.canvas = null; }
  if (p.text) { p.text.remove(); p.text = null; }
  p.rendered = false; p.renderedScale = 0;
}
async function renderPage(i) {
  const p = pdf.pages[i - 1];
  if (!p || !pdf.doc) return;
  if (p.rendered && p.renderedScale === pdf.scale) return;
  if (p.renderTask) { p.renderTask.cancel(); p.renderTask = null; }
  const scaleAtStart = pdf.scale;
  try {
    if (!p.pageObj) p.pageObj = await pdf.doc.getPage(i);
    if (pdf.scale !== scaleAtStart || !pdf.doc) return;
    const vp1 = p.pageObj.getViewport({ scale: 1 });
    if (p.w !== vp1.width || p.h !== vp1.height) { p.w = vp1.width; p.h = vp1.height; layoutPages(); }
    const vp = p.pageObj.getViewport({ scale: pdf.scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 4096 / vp.width, 3);
    const canvas = p.canvas || document.createElement('canvas');
    canvas.width = Math.floor(vp.width * dpr); canvas.height = Math.floor(vp.height * dpr);
    if (!p.canvas) { p.canvas = canvas; p.div.prepend(canvas); }
    const ctx = canvas.getContext('2d', { alpha: false });
    p.renderTask = p.pageObj.render({ canvasContext: ctx, viewport: vp, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null });
    await p.renderTask.promise;
    p.renderTask = null;
    p.rendered = true; p.renderedScale = pdf.scale;
    // Lớp chữ để bôi đen / sao chép. / Text layer for selection & copy.
    if (p.text) p.text.remove();
    const text = document.createElement('div'); text.className = 'textLayer';
    p.div.appendChild(text); p.text = text;
    const tl = new pdfjsLib.TextLayer({ textContentSource: p.pageObj.streamTextContent(), container: text, viewport: vp });
    tl.render().catch(() => {});
  } catch (e) {
    if (e && e.name === 'RenderingCancelledException') return;
    console.warn('render page', i, e);
  }
}

function pageTops() {
  let y = 18; const tops = [];
  for (const p of pdf.pages) { tops.push(y); y += Math.floor(p.h * pdf.scale) + 16; }
  return tops;
}
function currentPageFromScroll() {
  const tops = pageTops();
  const mid = el.pdfView.scrollTop + Math.min(el.pdfView.clientHeight * 0.3, 240);
  let lo = 0, hi = tops.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tops[m] <= mid) lo = m; else hi = m - 1; }
  return lo + 1;
}
function gotoPage(n, smooth) {
  n = Math.max(1, Math.min(pdf.pages.length, n | 0));
  const top = pageTops()[n - 1] - 10;
  el.pdfView.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  pdf.current = n; $('pageIn').value = n;
}
const savePos = debounce(() => {
  if (pdf.key && pdf.doc) storage.set('pos:' + pdf.key, { page: pdf.current, scale: pdf.scale, fit: pdf.fit });
}, 500);
let scrollTick = false;
el.pdfView.addEventListener('scroll', () => {
  if (scrollTick || !pdf.doc) return;
  scrollTick = true;
  requestAnimationFrame(() => {
    scrollTick = false;
    const n = currentPageFromScroll();
    if (n !== pdf.current) { pdf.current = n; $('pageIn').value = n; }
    savePos();
  });
});
function setScale(s, fit = false) {
  if (!pdf.doc) return;
  const page = pdf.current;
  const tops = pageTops();
  const offsetRatio = (el.pdfView.scrollTop - tops[page - 1]) / Math.max(1, pdf.pages[page - 1].h * pdf.scale);
  pdf.fit = fit;
  pdf.scale = Math.max(0.2, Math.min(6, s));
  for (const p of pdf.pages) if (p.rendered) unrenderPage(p);
  layoutPages(); updateZoomLabel();
  const t2 = pageTops();
  el.pdfView.scrollTop = t2[page - 1] + offsetRatio * pdf.pages[page - 1].h * pdf.scale;
  for (const i of near) renderPage(i);
  savePos();
}
$('zoomIn').onclick = () => setScale(pdf.scale * 1.15);
$('zoomOut').onclick = () => setScale(pdf.scale / 1.15);
$('fitW').onclick = () => setScale(fitScale(), true);
$('prev').onclick = () => gotoPage(pdf.current - 1, true);
$('next').onclick = () => gotoPage(pdf.current + 1, true);
$('pageIn').addEventListener('change', (e) => gotoPage(+e.target.value, false));
$('pageIn').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); gotoPage(+e.target.value, false); } });
window.addEventListener('resize', debounce(() => { if (pdf.doc && pdf.fit) setScale(fitScale(), true); }, 150));
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea')) return;
  if (!el.pdfView.hidden) {
    if (e.key === '+' || e.key === '=') { setScale(pdf.scale * 1.15); e.preventDefault(); }
    else if (e.key === '-') { setScale(pdf.scale / 1.15); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { gotoPage(pdf.current - 1, true); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { gotoPage(pdf.current + 1, true); e.preventDefault(); }
  } else if (!el.epubWrap.hidden && epub.rendition) {
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') epub.rendition.prev();
    else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') epub.rendition.next();
  }
});

// ---------- EPUB ----------
const epub = { book: null, rendition: null, key: null, fontPct: 100, tocLinks: [], ro: null };

async function openEpub({ key, name, data }) {
  epub.key = key;
  status(T('Đang dựng sách…', 'Preparing the book…'), name);
  if (typeof window.ePub !== 'function') throw new Error('epub.js not loaded');
  const saved = (await storage.get('pos:' + key)) || {};
  epub.fontPct = saved.fontPct || 100;
  const book = window.ePub(data.buffer ? data.buffer : data);
  epub.book = book;
  show('epubWrap');
  const box = () => ({ w: Math.max(200, el.epubView.clientWidth), h: Math.max(200, el.epubView.clientHeight) });
  const b0 = box();
  const rendition = book.renderTo(el.epubView, { width: b0.w, height: b0.h, flow: 'paginated', spread: 'auto', minSpreadWidth: 1000, allowScriptedContent: false });
  epub.rendition = rendition;
  if (!epub.ro) {
    epub.ro = new ResizeObserver(debounce(() => { if (epub.rendition) { const b = box(); epub.rendition.resize(b.w, b.h); } }, 120));
    epub.ro.observe(el.epubView);
  }
  rendition.themes.register('light', { body: { background: '#ffffff', color: '#1a1a2e' } });
  rendition.themes.register('sepia', { body: { background: '#f8f1dd', color: '#3b2f1e' } });
  rendition.themes.register('dark', { body: { background: '#1b1c36', color: '#e8e8ff' }, a: { color: '#9fa0ff' } });
  rendition.themes.select(document.body.dataset.theme);
  rendition.themes.fontSize(epub.fontPct + '%');
  rendition.on('relocated', (loc) => {
    const href = loc && loc.start && loc.start.href;
    let label = '';
    for (const a of epub.tocLinks) {
      const hit = href && a.dataset.href.split('#')[0] === href.split('#')[0];
      a.classList.toggle('cur', !!hit);
      if (hit && !label) label = a.textContent;
    }
    const d = loc && loc.start && loc.start.displayed;
    $('eWhere').textContent = (label ? label + ' · ' : '') + (d ? `${d.page}/${d.total}` : '');
    if (loc && loc.start) storage.set('pos:' + key, { cfi: loc.start.cfi, fontPct: epub.fontPct });
  });
  rendition.on('keydown', (e) => {
    if (e.key === 'ArrowLeft') rendition.prev();
    if (e.key === 'ArrowRight' || e.key === ' ') rendition.next();
  });
  await book.ready;
  const nav = await book.loaded.navigation;
  buildToc(nav && nav.toc || []);
  await rendition.display(saved.cfi || undefined);
  status(null);
}
function buildToc(items, depth = 0) {
  if (depth === 0) { el.toc.innerHTML = ''; epub.tocLinks = []; }
  for (const it of items) {
    const a = document.createElement('a');
    a.href = '#'; a.textContent = (it.label || '').trim() || '…'; a.dataset.href = it.href || '';
    if (depth) a.className = 'lvl' + Math.min(depth, 2);
    a.onclick = (e) => { e.preventDefault(); epub.rendition.display(it.href); if (window.innerWidth <= 720) el.toc.hidden = true; };
    el.toc.appendChild(a); epub.tocLinks.push(a);
    if (it.subitems && it.subitems.length) buildToc(it.subitems, depth + 1);
  }
}
$('tocBtn').onclick = () => { el.toc.hidden = !el.toc.hidden; };
$('ePrev').onclick = () => epub.rendition && epub.rendition.prev();
$('eNext').onclick = () => epub.rendition && epub.rendition.next();
function setFont(pct) {
  epub.fontPct = Math.max(60, Math.min(220, pct));
  if (epub.rendition) epub.rendition.themes.fontSize(epub.fontPct + '%');
}
$('fontUp').onclick = () => setFont(epub.fontPct + 10);
$('fontDown').onclick = () => setFont(epub.fontPct - 10);

// ---------- Giao diện / theme ----------
const THEMES = ['light', 'sepia', 'dark'];
storage.get('theme').then((t) => { if (THEMES.includes(t)) document.body.dataset.theme = t; });
$('theme').onclick = () => {
  const t = THEMES[(THEMES.indexOf(document.body.dataset.theme) + 1) % THEMES.length];
  document.body.dataset.theme = t; storage.set('theme', t);
  if (epub.rendition) epub.rendition.themes.select(t);
};

// ---------- Mở file / open ----------
function extractId(s) {
  s = (s || '').trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s;
  const m = s.match(/\/(?:file|document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]{10,})/)
    || s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/)
    || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : null;
}
function kindOf(mime, name) {
  const ext = (name || '').toLowerCase().split('.').pop();
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime === 'application/epub+zip' || ext === 'epub') return 'epub';
  if (DOC_EXPORT.has(mime)) return 'gdoc';
  return null;
}

async function openDrive(id) {
  const job = () => openDrive(id);
  try {
    await closeCurrent();
    show('pdfView'); el.pdfView.hidden = true; el.ctrlPdf.hidden = true;
    if (clientIdMissing()) { showSetup(); return; }
    status(T('Đang kết nối Google Drive…', 'Connecting to Google Drive…'));
    const meta = await driveMeta(id);
    el.title.textContent = meta.name || id; el.title.title = meta.name || '';
    document.title = (meta.name || 'Ebook') + ' — Drive Ebook Reader';
    if (meta.webViewLink) { el.driveLink.href = meta.webViewLink; el.driveLink.hidden = false; }
    if (meta.mimeType === FOLDER) { await openFolder(meta); return; }
    const kind = kindOf(meta.mimeType, meta.name);
    const size = +meta.size || 0;
    if (kind === 'pdf') {
      await openPdf({ key: id, name: meta.name, length: size, fetchRange: driveRangeFetcher(id) });
    } else if (kind === 'epub') {
      status(T('Đang nạp EPUB vào bộ nhớ…', 'Loading EPUB into memory…'), fmtBytes(size));
      const res = await driveFetch(`files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`);
      const data = await fetchWhole(res, size, (l, t) => { setNet(l, t); status(T('Đang nạp EPUB vào bộ nhớ…', 'Loading EPUB into memory…'), `${fmtBytes(l)} / ${fmtBytes(t)}`); });
      await openEpub({ key: id, name: meta.name, data });
    } else if (kind === 'gdoc') {
      status(T('Đang xuất Google Docs sang PDF…', 'Exporting the Google document to PDF…'), meta.name);
      const res = await driveFetch(`files/${encodeURIComponent(id)}/export?mimeType=application/pdf`);
      const data = await fetchWhole(res, 0);
      await openPdf({ key: id, name: meta.name, data });
    } else {
      throw new Error(T('Định dạng chưa hỗ trợ: ', 'Unsupported format: ') + (meta.mimeType || '?') + T('. Hiện mình đọc PDF, EPUB và Google Docs/Slides.', '. PDF, EPUB and Google Docs/Slides are supported.'));
    }
  } catch (e) {
    showError(e, job);
  }
}
async function openLocal(file) {
  const job = () => openLocal(file);
  try {
    await closeCurrent();
    el.title.textContent = file.name; el.title.title = file.name;
    document.title = file.name + ' — Drive Ebook Reader';
    const key = 'local:' + file.name + ':' + file.size;
    const kind = kindOf(file.type, file.name);
    if (kind === 'pdf') await openPdf({ key, name: file.name, length: file.size, fetchRange: localRangeFetcher(file) });
    else if (kind === 'epub') await openEpub({ key, name: file.name, data: new Uint8Array(await file.arrayBuffer()) });
    else throw new Error(T('Chỉ hỗ trợ PDF và EPUB.', 'Only PDF and EPUB are supported.'));
  } catch (e) { showError(e, job); }
}
function showSetup() {
  status(null); show('home');
  el.setup.hidden = false;
  el.setup.innerHTML = T(
    '<b>Cần cài đặt một lần:</b> extension chưa có OAuth Client ID nên chưa gọi được Google Drive.<ol><li>Mở <code>chrome://extensions</code>, bật Developer mode, copy <b>ID</b> của extension này.</li><li>Vào Google Cloud Console → tạo project → bật <b>Google Drive API</b> → OAuth consent screen (External, Testing, thêm email của bạn làm Test user).</li><li>Credentials → Create OAuth client ID → loại <b>Chrome Extension</b> → dán Item ID ở bước 1.</li><li>Dán Client ID vào <code>oauth2.client_id</code> trong <code>manifest.json</code>, rồi bấm Reload extension.</li></ol>Chi tiết ở README trong thư mục extension.',
    '<b>One-time setup:</b> the extension has no OAuth Client ID yet, so it cannot call Google Drive.<ol><li>Open <code>chrome://extensions</code>, enable Developer mode, copy this extension\'s <b>ID</b>.</li><li>In Google Cloud Console create a project → enable the <b>Google Drive API</b> → OAuth consent screen (External, Testing, add your email as a Test user).</li><li>Credentials → Create OAuth client ID → type <b>Chrome Extension</b> → paste the Item ID from step 1.</li><li>Paste the Client ID into <code>oauth2.client_id</code> in <code>manifest.json</code>, then reload the extension.</li></ol>Details in the README inside the extension folder.');
}
function goHome() {
  closeCurrent();
  history.replaceState(null, '', location.pathname);
  status(null); show('home');
  el.setup.hidden = !clientIdMissing();
  if (!el.setup.hidden) showSetup();
  $('linkIn').focus();
}
$('linkForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = extractId($('linkIn').value);
  if (!id) { $('linkIn').focus(); $('linkIn').select(); return; }
  history.replaceState(null, '', location.pathname + '?id=' + encodeURIComponent(id));
  openDrive(id);
});
$('fileIn').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) openLocal(f); e.target.value = ''; });
$('openOther').onclick = goHome;
$('errHome').onclick = goHome;
$('errRetry').onclick = () => { if (lastJob) lastJob(); };

// ---------- Khởi động / boot ----------
const startId = params.get('id');
if (startId && /^[a-zA-Z0-9_-]{10,}$/.test(startId)) openDrive(startId);
else goHome();

// Cho trang thử nghiệm / for tests
window.__reader = { pdf, epub, openLocal, extractId, kindOf };
