/* Ranh trên trang chủ: nút Ranh nổi (#ranhDock, đậu ngay trên khung chat) + tour giới thiệu trang (học từ Mimi của GZA).
   - Có màn Big Bang (bigbang.js): Ranh bật ra từ logo rồi rơi xuống đậu ở #ranhDock, bigbang.js gọi RanhDock.land().
     Không có màn mở đầu (lần ghé sau trong phiên, máy giảm chuyển động): Ranh hiện dần.
   - Tour tự chạy một lần cho khách mới (localStorage lm_tour = "done"); bấm Ranh để xem lại; ?tour để buộc chạy.
   - Bước: chào (ở Ranh) → Kho báu → khối Data Storage → từng ô (Open Storage, Đăng ký, Đăng nhập, Donate) → Cộng đồng → Liên hệ → kết (ở Ranh).
   Phím: → / Enter tiếp, ← lùi, Esc đóng. Mục bị ẩn trên điện thoại thì chỉ vào nút menu. */
(() => {
  "use strict";
  const lang = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STEPS = [
    { el: ["#ranhDock"], mood: "wave",
      vi: ["Chào bạn, mình là Ranh!", "Mình đậu ở góc này nè. Để mình dẫn bạn đi một vòng xem trang có gì hay, chưa tới 30 giây thôi!"],
      en: ["Hi, I'm Ranh!", "I live down here in the corner. Let me show you around real quick, it takes less than 30 seconds!"] },
    { el: [".nav-treasure", "#burger"], mood: "idea",
      vi: ["Kho báu", "Nơi Lan Anh cất các công cụ, mẫu và ứng dụng AI dùng miễn phí. Ghé lấy đồ nghề nè!"],
      en: ["Treasure", "Free AI tools, templates and apps Lan Anh has collected. Come grab some gear!"] },
    { el: ["#heroAccess"], mood: "laptop",
      vi: ["Data Storage", "Đây là kho tài liệu Lan Anh chia sẻ: khoá học, tài liệu marketing, skill AI, ứng dụng hay. Có 4 nút, mình giới thiệu lần lượt từng nút nha."],
      en: ["Data Storage", "This is the library Lan Anh shares: courses, marketing docs, AI skills and handy apps. There are 4 buttons, let me walk you through each one."] },
    { el: ["#haOpen"], mood: "wow",
      vi: ["① Open Storage", "Bấm để bay vào cổng kho. Ở đó bạn chọn “Truy cập Data Storage” để xem phần được chia sẻ. Chưa có quyền thì làm bước ② trước nhé."],
      en: ["① Open Storage", "Tap to fly to the library gate. From there, choose “Go to Data Storage” to see the shared part. No access yet? Do step ② first."] },
    { el: ["#haReg"], mood: "idea",
      vi: ["② Đăng ký", "Lần đầu ghé thì bấm đây, điền họ tên và email. Bạn nhận ngay mã truy cập (chỉ hiện một lần, nhớ lưu lại) và mã QR ủng hộ riêng của bạn."],
      en: ["② Sign up", "First time here? Tap this and enter your name and email. You instantly get an access code (shown only once, so save it) and your own support QR code."] },
    { el: ["#haLogin"], mood: "laptop",
      vi: ["③ Đăng nhập", "Khi Lan Anh đã duyệt, bấm đây và nhập email cùng mã truy cập để vào xem kho. Lần sau trình duyệt tự nhớ, không phải nhập lại."],
      en: ["③ Log in", "Once Lan Anh approves you, tap here and enter your email and access code to browse. Next time your browser remembers you."] },
    { el: ["#haDonate"], mood: "love",
      vi: ["④ Donate", "Xem các bước ủng hộ Lan Anh để được duyệt. Khi chuyển khoản, nhớ giữ nguyên nội dung có mã của bạn để Lan Anh biết là bạn nha."],
      en: ["④ Donate", "See how to support Lan Anh to get approved. When you transfer, keep the note with your code as is so Lan Anh knows it's you."] },
    { el: ['.pill-nav nav a[href="community.html"]', "#burger"], mood: "mega",
      vi: ["Cộng đồng", "Các nhóm, sự kiện và chuyên gia mình đồng hành. Vào chơi, hỏi đáp cùng mọi người nha!"],
      en: ["Community", "The groups, events and experts I work with. Join in and ask away!"] },
    { el: [".pill-nav .btn.dark", "#burger"], mood: "love",
      vi: ["Liên hệ mình", "Có bài toán marketing hay muốn hợp tác? Bấm vào đây để nhắn Lan Anh nhé!"],
      en: ["Contact me", "Got a marketing challenge or want to work together? Tap here to message Lan Anh!"] },
    { el: ["#ranhDock"], mood: "wink",
      vi: ["Cần gì cứ gọi mình", "Bấm vào mình bất cứ lúc nào để xem lại hướng dẫn này. Chúc bạn ghé chơi vui!"],
      en: ["Call me anytime", "Tap me whenever you want this tour again. Enjoy your visit!"] }
  ];
  const UI = {
    vi: { skip: "Bỏ qua", back: "Lùi", next: "Tiếp", done: "Xong rồi!", dock: "Ranh: xem hướng dẫn trang", say: "Cần giúp? Bấm mình nha!" },
    en: { skip: "Skip", back: "Back", next: "Next", done: "Got it!", dock: "Ranh: show the page tour", say: "Need help? Tap me!" }
  };

  /* ---------- nút Ranh nổi ---------- */
  const dock = document.createElement("button");
  dock.type = "button"; dock.id = "ranhDock"; dock.className = "ranh-dock";
  dock.innerHTML = '<img src="assets/img/mascot/ranh-wave.webp" alt="" width="76" height="76"><span class="rd-say"></span>';
  const label = () => { const u = UI[lang()]; dock.setAttribute("aria-label", u.dock); dock.querySelector(".rd-say").textContent = u.say; };
  label(); document.body.appendChild(dock);
  let shown = false, sayT = 0;
  function show(landed) {
    if (shown) return; shown = true;
    dock.classList.add("in"); if (landed && !reduce) dock.classList.add("land");
    clearTimeout(sayT); sayT = setTimeout(() => { if (!box) { dock.classList.add("say"); setTimeout(() => dock.classList.remove("say"), 5000); } }, 1400);
  }
  window.RanhDock = { el: dock, land: () => show(true), show: () => show(false) };
  if (document.documentElement.classList.contains("bb-hold")) document.addEventListener("lm-intro-done", () => show(false), { once: true }); // Ranh chưa kịp rơi (bỏ qua màn mở đầu)
  else setTimeout(() => show(false), 900);
  dock.addEventListener("click", () => { dock.classList.remove("say"); if (!box) start(); });

  /* ---------- tour ---------- */
  let i = 0, box = null, spot = null, target = null;
  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  const find = (s) => (s.el || []).map((q) => document.querySelector(q)).find(visible) || null;

  function place() {
    if (!box) return;
    const pad = 8, gap = 14, vw = document.documentElement.clientWidth, vh = innerHeight, w = box.offsetWidth, h = box.offsetHeight;
    if (!target) { spot.classList.remove("on"); box.style.left = Math.max(12, (vw - w) / 2) + "px"; box.style.top = Math.max(12, (vh - h) / 2) + "px"; box.style.setProperty("--ax", "-99px"); return; }
    const r = target.getBoundingClientRect();
    Object.assign(spot.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px",
      borderRadius: r.height > 52 ? "22px" : "999px" }); // khối và ô (Data Storage) bo góc, nút nhỏ trên thanh menu bo tròn
    spot.classList.add("on");
    const below = r.bottom + pad + gap + h < vh;
    const left = Math.min(vw - w - 12, Math.max(12, r.left + r.width / 2 - w / 2));
    box.style.left = left + "px";
    box.style.top = (below ? r.bottom + pad + gap : Math.max(12, r.top - pad - gap - h)) + "px";
    box.classList.toggle("up", !below);
    box.style.setProperty("--ax", Math.min(w - 24, Math.max(24, r.left + r.width / 2 - left)) + "px");
  }

  function render() {
    const s = STEPS[i], L = lang(), u = UI[L], last = i === STEPS.length - 1;
    target = find(s);
    // khối nằm trong trang (không cố định) mà đang khuất thì cuộn vừa đủ để thấy trọn; place() chạy lại theo sự kiện cuộn
    if (target && getComputedStyle(target).position !== "fixed" && !target.closest(".pill-nav")) {
      const r = target.getBoundingClientRect(), by = r.top < 90 ? r.top - 110 : r.bottom > innerHeight - 100 ? r.bottom - innerHeight + 110 : 0; // chừa đáy cho Ranh và nhãn bầu trời
      if (by) scrollBy({ top: by, behavior: reduce ? "auto" : "smooth" });
    }
    box.innerHTML =
      `<img class="lt-ranh" src="assets/img/mascot/ranh-${s.mood}.webp" alt="" width="64" height="64">` +
      `<div class="lt-body"><p class="lt-step">${i + 1}/${STEPS.length}</p><h3 id="ltTitle">${s[L][0]}</h3><p>${s[L][1]}</p>` +
      `<div class="lt-act">${last ? "" : `<button type="button" class="lt-skip" data-t="skip">${u.skip}</button>`}` +
      (i ? `<button type="button" class="lt-back" data-t="back">${u.back}</button>` : "") +
      `<button type="button" class="lt-next" data-t="next">${last ? u.done : u.next + " →"}</button></div></div>`;
    box.classList.remove("in"); void box.offsetWidth; box.classList.add("in");
    dock.classList.toggle("talk", target === dock);
    place();
    box.querySelector(".lt-next").focus({ preventScroll: true });
  }

  function go(n) { if (n < 0) return; if (n >= STEPS.length) return end(); i = n; render(); }
  function end() {
    try { localStorage.setItem("lm_tour", "done"); } catch {}
    box?.remove(); spot?.remove(); box = spot = target = null;
    dock.classList.remove("talk"); document.documentElement.classList.remove("lt-on");
    removeEventListener("resize", place); removeEventListener("scroll", place);
    document.removeEventListener("keydown", key);
  }
  function key(e) {
    if (e.key === "Escape") end();
    else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
  }
  function start() {
    if (box) return;
    show(false); dock.classList.remove("say");
    document.documentElement.classList.add("lt-on"); // tour.css: giữ chữ ở banner rõ dù trang đã cuộn
    spot = document.createElement("div"); spot.className = "lt-spot"; spot.setAttribute("aria-hidden", "true");
    box = document.createElement("div"); box.className = "lt-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-labelledby", "ltTitle");
    box.addEventListener("click", (e) => { const t = e.target.closest("[data-t]")?.dataset.t; if (t === "skip") end(); else if (t === "back") go(i - 1); else if (t === "next") go(i + 1); });
    document.body.append(spot, box);
    addEventListener("resize", place, { passive: true }); addEventListener("scroll", place, { passive: true });
    document.addEventListener("keydown", key);
    go(0);
  }
  // đổi VI/EN: viết lại bước đang mở và nhãn của Ranh
  document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(() => { label(); if (box) render(); }, 80); });

  window.LMTour = { start };
  let seen = false; try { seen = localStorage.getItem("lm_tour") === "done"; } catch {}
  // có màn Big Bang thì đợi nó xong (Ranh vừa đậu xuống góc); không thì chờ màn mở đầu của cosmos.js
  const go1 = () => document.documentElement.classList.contains("bb-hold") ? document.addEventListener("lm-intro-done", () => setTimeout(start, 700), { once: true }) : setTimeout(start, 2800);
  if (!seen || /[?&]tour\b/.test(location.search)) go1();
})();
