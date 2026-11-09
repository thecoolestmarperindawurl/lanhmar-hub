// Service worker: mở trang đọc cho một file Drive. / Opens the reader page for a Drive file.
const ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
  /[?&]id=([a-zA-Z0-9_-]{10,})/,
  /\/document\/d\/([a-zA-Z0-9_-]{10,})/,
  /\/presentation\/d\/([a-zA-Z0-9_-]{10,})/,
];

function extractId(url) {
  if (!url) return null;
  for (const re of ID_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

function openReader(id, openerTabId) {
  const url = chrome.runtime.getURL('reader.html') + (id ? '?id=' + encodeURIComponent(id) : '');
  const opts = { url };
  if (openerTabId != null) opts.openerTabId = openerTabId;
  return chrome.tabs.create(opts);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'open-reader') {
    openReader(msg.id, sender.tab && sender.tab.id).then(() => sendResponse({ ok: true }));
    return true; // trả lời bất đồng bộ / async response
  }
  return false;
});

chrome.action.onClicked.addListener((tab) => {
  openReader(extractId(tab && tab.url), tab && tab.id);
});
