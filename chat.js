/* Chat "Hỏi Lan Anh": tin nhắn gửi qua Apps Script tới bot Telegram của chủ; câu trả lời của chủ hiện lại ở đây.
   Cần window.STORAGE_API (storage-config.js). Không lưu mật khẩu/khoá nào ở phía web. */
(() => {
  const API = (window.STORAGE_API || "").trim();
  if (!API) return;
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
  const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  let vid = LS("lm-chat-vid"); if (!vid || vid.length < 16) { vid = rnd(); LS("lm-chat-vid", vid); }
  const page = /storage\.html/.test(location.pathname) ? "storage" : "kho";
  const post = async (body) => (await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })).json();
  let msgs = []; try { msgs = JSON.parse(LS("lm-chat-msgs") || "[]"); } catch {}
  let seenAdmin = Number(LS("lm-chat-seen") || 0), openState = false, timer = null, lastSend = 0;

  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const btn = el("button", "chat-fab", "💬 Hỏi Lan Anh"); btn.type = "button"; btn.setAttribute("aria-label", "Mở khung chat");
  const badge = el("b", "chat-dot"); badge.hidden = true; btn.appendChild(badge);
  const box = el("section", "chat-box"); box.hidden = true; box.setAttribute("aria-label", "Chat với Lan Anh");
  const head = el("div", "chat-head"); head.appendChild(el("b", "", "💬 Hỏi Lan Anh"));
  const x = el("button", "chat-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Đóng"); head.appendChild(x);
  const note = el("p", "chat-note", "Tin nhắn của bạn được gửi tới Telegram của Lan Anh. Câu trả lời sẽ hiện ngay trong khung này (có thể mất vài phút), hoặc Lan Anh liên hệ qua cách bạn để lại.");
  const list = el("div", "chat-list"); list.setAttribute("aria-live", "polite");
  const form = el("form", "chat-form"); form.autocomplete = "off";
  const name = el("input"); name.placeholder = "Tên của bạn"; name.maxLength = 60; name.value = LS("lm-chat-name") || "";
  const contact = el("input"); contact.placeholder = "Email / Zalo (không bắt buộc)"; contact.maxLength = 120; contact.value = LS("lm-chat-contact") || "";
  const trap = el("input"); trap.name = "website"; trap.tabIndex = -1; trap.autocomplete = "off"; trap.setAttribute("aria-hidden", "true"); trap.className = "chat-trap";
  const text = el("textarea"); text.placeholder = "Nhập câu hỏi…"; text.rows = 3; text.maxLength = 1000; text.required = true;
  const send = el("button", "btn primary", "Gửi"); send.type = "submit";
  const err = el("p", "chat-err");
  form.append(name, contact, trap, text, err, send);
  box.append(head, note, list, form);
  document.body.append(btn, box);

  const adminCount = () => msgs.filter((m) => m.w === "a").length;
  function render() {
    list.textContent = "";
    if (!msgs.length) list.appendChild(el("p", "chat-empty", "Chưa có tin nhắn. Hãy đặt câu hỏi đầu tiên."));
    msgs.forEach((m) => { const b = el("div", "chat-msg " + (m.w === "a" ? "adm" : "me")); b.appendChild(el("span", "", m.t)); list.appendChild(b); });
    list.scrollTop = list.scrollHeight;
    const unread = Math.max(0, adminCount() - seenAdmin);
    badge.hidden = !unread || openState; badge.textContent = unread;
    LS("lm-chat-msgs", JSON.stringify(msgs.slice(-60)));
  }
  async function pull() {
    if (!msgs.length) return; // chưa gửi tin nào thì không cần hỏi máy chủ
    try { const j = await post({ action: "chat_get", vid }); if (j.ok) { msgs = j.msgs.map((m) => ({ w: m.w, t: m.t })); if (openState) { seenAdmin = adminCount(); LS("lm-chat-seen", String(seenAdmin)); } render(); } } catch {}
  }
  const schedule = () => { clearInterval(timer); timer = setInterval(() => { if (document.visibilityState === "visible") pull(); }, openState ? 15000 : 60000); };
  function toggle(on) {
    openState = on; box.hidden = !on; btn.hidden = on;
    if (on) { seenAdmin = adminCount(); LS("lm-chat-seen", String(seenAdmin)); render(); pull(); setTimeout(() => text.focus(), 50); }
    schedule();
  }
  btn.onclick = () => toggle(true); x.onclick = () => toggle(false);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openState) toggle(false); });
  form.onsubmit = async (e) => {
    e.preventDefault(); err.textContent = "";
    const t = text.value.trim(); if (!t) return;
    if (Date.now() - lastSend < 8000) { err.textContent = "Bạn gửi hơi nhanh, đợi vài giây nhé."; return; }
    send.disabled = true; send.textContent = "Đang gửi…";
    LS("lm-chat-name", name.value.trim()); LS("lm-chat-contact", contact.value.trim());
    try {
      const j = await post({ action: "chat_send", vid, name: name.value.trim(), contact: contact.value.trim(), text: t, page, website: trap.value });
      if (j.ok) { lastSend = Date.now(); msgs.push({ w: "k", t }); text.value = ""; render(); if (j.tg === false) err.textContent = "Đã lưu tin nhắn nhưng chưa gửi được tới Telegram, Lan Anh vẫn xem được trong bảng."; }
      else err.textContent = j.error === "rate" ? "Bạn đã gửi quá nhiều tin, thử lại sau ít phút." : "Chưa gửi được, thử lại nhé.";
    } catch { err.textContent = "Không kết nối được, thử lại sau."; }
    send.disabled = false; send.textContent = "Gửi";
  };
  render(); schedule(); if (msgs.length) pull();
})();
