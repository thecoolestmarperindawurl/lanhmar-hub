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
  // Sticker hỏi đáp: bong bóng chat có mặt cười, huy hiệu "?" và các ngôi sao lấp lánh (SVG tự vẽ, màu LANHMAR)
  const STICKER = `<svg class="chat-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <ellipse class="chat-shadow" cx="60" cy="112" rx="26" ry="5"/>
    <g class="chat-body">
      <path d="M22 32Q22 14 40 14H80Q98 14 98 32V62Q98 80 80 80H64L46 100L48 80H40Q22 80 22 62Z" fill="#fff" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
      <path d="M22 32Q22 14 40 14H80Q98 14 98 32V62Q98 80 80 80H64L46 100L48 80H40Q22 80 22 62Z" fill="#2D2FEF" stroke="#241F45" stroke-width="4" stroke-linejoin="round"/>
      <g class="chat-eyes"><ellipse class="chat-eye" cx="46" cy="44" rx="7" ry="9" fill="#fff"/><ellipse class="chat-eye" cx="74" cy="44" rx="7" ry="9" fill="#fff"/><circle cx="47" cy="46" r="3.6" fill="#241F45"/><circle cx="75" cy="46" r="3.6" fill="#241F45"/></g>
      <path d="M48 60Q60 72 72 60" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="37" cy="58" r="4" fill="#FF7A45" opacity=".85"/><circle cx="83" cy="58" r="4" fill="#FF7A45" opacity=".85"/>
    </g>
    <g class="chat-q"><circle cx="98" cy="20" r="16" fill="#FF7A45" stroke="#241F45" stroke-width="3.5"/><text x="98" y="28" text-anchor="middle" font-family="Montserrat,Arial,sans-serif" font-weight="800" font-size="22" fill="#fff">?</text></g>
    <path class="chat-star s1" d="M12 24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFD8C2" stroke="#241F45" stroke-width="2"/>
    <path class="chat-star s2" d="M108 70l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z" fill="#FF7A45" stroke="#241F45" stroke-width="2"/>
    <path class="chat-star s3" d="M22 96l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="#fff" stroke="#241F45" stroke-width="2"/>
  </svg>`;
  const btn = el("button", "chat-fab"); btn.type = "button"; btn.setAttribute("aria-label", "Hỏi Lan Anh: mở khung chat"); btn.title = "Hỏi Lan Anh";
  btn.innerHTML = STICKER;
  const tip = el("span", "chat-tip"); tip.setAttribute("aria-hidden", "true"); btn.appendChild(tip);
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
  btn.onclick = () => { btn.classList.add("pop"); tip.classList.remove("on"); setTimeout(() => btn.classList.remove("pop"), 400); toggle(true); }; x.onclick = () => toggle(false);
  // Lời chào nhấp nháy định kỳ để thu hút (chỉ khi khung đóng và tab đang xem)
  const HELLO = ["Hỏi mình nhé! 💬", "Có thắc mắc gì không? ✨", "Mình trả lời liền! 🚀", "Bí khoá học nào? Hỏi đi 👋"]; let hi = 0;
  const hello = () => { if (openState || document.visibilityState !== "visible" || !badge.hidden) return; tip.textContent = HELLO[hi++ % HELLO.length]; tip.classList.add("on"); setTimeout(() => tip.classList.remove("on"), 4200); };
  setTimeout(() => { hello(); setInterval(hello, 14000); }, 3500);
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
