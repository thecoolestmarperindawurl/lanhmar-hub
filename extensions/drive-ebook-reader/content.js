// Content script chạy trên drive.google.com: thêm nút "Đọc không cần tải" khi đang xem một file.
// Runs on drive.google.com: adds a "Read without downloading" button when a file is open.
(function () {
  const VI = (chrome.i18n.getUILanguage() || '').toLowerCase().startsWith('vi');
  const LABEL = VI ? 'Đọc không cần tải' : 'Read without downloading';
  const LABEL_DIR = VI ? 'Xem sách trong thư mục' : 'Browse books in folder';
  const TITLE = VI ? 'Mở bằng Drive Ebook Reader (LANHMAR)' : 'Open with Drive Ebook Reader (LANHMAR)';

  function currentFileId() {
    const m = location.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/) || location.pathname.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
    if (m) return m[1];
    const q = new URLSearchParams(location.search).get('id');
    if (q && /^[a-zA-Z0-9_-]{10,}$/.test(q) && /\/(open|uc|file)/.test(location.pathname)) return q;
    return null;
  }

  let btn = null;
  function ensureButton(id) {
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lm-reader-btn';
      btn.title = TITLE;
      btn.innerHTML = '<span class="lm-reader-ico" aria-hidden="true">📖</span><span class="lm-reader-txt"></span>';
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'open-reader', id: btn.dataset.id });
      });
      document.documentElement.appendChild(btn);
    }
    btn.dataset.id = id;
    btn.querySelector('.lm-reader-txt').textContent = /\/folders\//.test(location.pathname) ? LABEL_DIR : LABEL;
    btn.hidden = false;
  }
  function hideButton() {
    if (btn) btn.hidden = true;
  }

  let last = null;
  function tick() {
    const id = currentFileId();
    if (id === last) return;
    last = id;
    if (id) ensureButton(id);
    else hideButton();
  }
  tick();
  setInterval(tick, 800); // Drive là SPA, URL đổi không reload / Drive is a SPA
  window.addEventListener('popstate', tick);
})();
