/* Ranh dẫn khách đi một vòng trang chủ: Kho báu, Storage, Cộng đồng, Liên hệ (học từ tour Mimi của GZA).
   Tự chạy một lần cho khách mới (localStorage lm_tour = "done"); xem lại: thêm ?tour vào địa chỉ, hoặc gọi LMTour.start().
   Phím: → / Enter tiếp, ← lùi, Esc đóng. Mục bị ẩn trên điện thoại thì chỉ vào nút menu. */
(() => {
  "use strict";
  const lang = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };
  const STEPS = [
    { mood: "wave",
      vi: ["Chào bạn, mình là Ranh!", "Để mình dẫn bạn đi một vòng xem trang này có gì hay nha. Mất chưa tới 30 giây thôi!"],
      en: ["Hi, I'm Ranh!", "Let me show you around real quick. It takes less than 30 seconds!"] },
    { el: [".nav-treasure", "#burger"], mood: "idea",
      vi: ["Kho báu", "Nơi Lan Anh cất các công cụ, mẫu và ứng dụng AI dùng miễn phí. Ghé lấy đồ nghề nè!"],
      en: ["Treasure", "Free AI tools, templates and apps Lan Anh has collected. Come grab some gear!"] },
    { el: ["#openStorage"], mood: "laptop",
      vi: ["Storage", "Kho tài liệu chia sẻ: khoá học, tài liệu marketing, file mẫu. Đăng ký là xem được ngay."],
      en: ["Storage", "The shared library: courses, marketing docs and templates. Sign up and browse right away."] },
    { el: ['.pill-nav nav a[href="community.html"]', "#burger"], mood: "mega",
      vi: ["Cộng đồng", "Các nhóm, sự kiện và chuyên gia mình đồng hành. Vào chơi, hỏi đáp cùng mọi người nha!"],
      en: ["Community", "The groups, events and experts I work with. Join in and ask away!"] },
    { el: [".pill-nav .btn.dark", "#burger"], mood: "love",
      vi: ["Liên hệ mình", "Có bài toán marketing hay muốn hợp tác? Bấm vào đây để nhắn Lan Anh nhé!"],
      en: ["Contact me", "Got a marketing challenge or want to work together? Tap here to message Lan Anh!"] }
  ];
  const UI = { vi: { skip: "Bỏ qua", back: "Lùi", next: "Tiếp", done: "Xong rồi!" }, en: { skip: "Skip", back: "Back", next: "Next", done: "Got it!" } };

  let i = 0, box = null, spot = null, target = null;
  const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden"; };
  const find = (s) => (s.el || []).map((q) => document.querySelector(q)).find(visible) || null;

  function place() {
    if (!box) return;
    const pad = 8, gap = 14, vw = document.documentElement.clientWidth, vh = innerHeight, w = box.offsetWidth, h = box.offsetHeight;
    if (!target) { spot.classList.remove("on"); box.style.left = Math.max(12, (vw - w) / 2) + "px"; box.style.top = Math.max(12, (vh - h) / 2) + "px"; box.style.setProperty("--ax", "-99px"); return; }
    const r = target.getBoundingClientRect();
    Object.assign(spot.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
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
    box.innerHTML =
      `<img class="lt-ranh" src="assets/img/mascot/ranh-${s.mood}.webp" alt="" width="64" height="64">` +
      `<div class="lt-body"><p class="lt-step">${i + 1}/${STEPS.length}</p><h3 id="ltTitle">${s[L][0]}</h3><p>${s[L][1]}</p>` +
      `<div class="lt-act"><button type="button" class="lt-skip" data-t="skip">${u.skip}</button>` +
      (i ? `<button type="button" class="lt-back" data-t="back">${u.back}</button>` : "") +
      `<button type="button" class="lt-next" data-t="next">${last ? u.done : u.next + " →"}</button></div></div>`;
    box.classList.remove("in"); void box.offsetWidth; box.classList.add("in");
    place();
    box.querySelector(".lt-next").focus({ preventScroll: true });
  }

  function go(n) { if (n < 0) return; if (n >= STEPS.length) return end(); i = n; render(); }
  function end() {
    try { localStorage.setItem("lm_tour", "done"); } catch {}
    box?.remove(); spot?.remove(); box = spot = target = null;
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
    spot = document.createElement("div"); spot.className = "lt-spot"; spot.setAttribute("aria-hidden", "true");
    box = document.createElement("div"); box.className = "lt-box"; box.setAttribute("role", "dialog"); box.setAttribute("aria-labelledby", "ltTitle");
    box.addEventListener("click", (e) => { const t = e.target.closest("[data-t]")?.dataset.t; if (t === "skip") end(); else if (t === "back") go(i - 1); else if (t === "next") go(i + 1); });
    document.body.append(spot, box);
    addEventListener("resize", place, { passive: true }); addEventListener("scroll", place, { passive: true });
    document.addEventListener("keydown", key);
    go(0);
  }
  // đổi VI/EN khi đang mở thì viết lại bước hiện tại
  document.addEventListener("click", (e) => { if (box && e.target.closest(".lang button")) setTimeout(render, 80); });

  window.LMTour = { start };
  let seen = false; try { seen = localStorage.getItem("lm_tour") === "done"; } catch {}
  // chờ màn mở đầu (cosmos.js) chạy xong rồi mới hiện
  // có màn Big Bang (bigbang.js) thì đợi nó xong; không thì chờ màn mở đầu của cosmos.js
  const go1 = () => document.documentElement.classList.contains("bb-hold") ? document.addEventListener("lm-intro-done", () => setTimeout(start, 900), { once: true }) : setTimeout(start, 2800);
  if (!seen || /[?&]tour\b/.test(location.search)) go1();
})();
