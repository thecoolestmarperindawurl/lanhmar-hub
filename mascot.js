/* Mascot LANHMAR: "Ranh", bé lông tròn màu tím, ngôi sao cam trên đầu (★ của brand).
   Ảnh 3D tạo riêng cho LANHMAR bằng Canva AI theo bảng nhận diện của Ranh, nền trong suốt (assets/img/mascot/).
   Dùng: <span class="lm-mascot" data-pose="wave|mega|yeah" data-say="community" style="--size:140px"></span>
   - data-pose: tư thế ban đầu (wave = vẫy tay, mega = cầm loa, yeah = ăn mừng)
   - data-say: bộ câu thoại theo vị trí (xem LINES); bỏ trống thì dùng câu chung
   - data-still: không cho bấm (chỉ trang trí)
   Bấm (hoặc Enter/Space) vào mascot: đổi tư thế + nảy + hiện bong bóng thoại; rê chuột thì mascot nghiêng theo. */
(() => {
  "use strict";
  const POSES = ["wave", "mega", "yeah"];
  const NAME = { vi: { wave: "vẫy tay chào", mega: "cầm loa", yeah: "ăn mừng" }, en: { wave: "waving hello", mega: "with a megaphone", yeah: "celebrating" } };
  const LINES = {
    vi: {
      base: ["Chào bạn, mình là Ranh!", "Bấm nữa là mình nhảy đó nha!", "Hôm nay bạn giao việc gì cho AI rồi?", "Mỗi chiến dịch bắt đầu từ một insight ★"],
      community: ["Vào nhóm chơi với tụi mình nha!", "Hỏi gì cứ hỏi, nhóm thân thiện lắm!", "Khoe cách bạn dùng AI đi!"],
      expert: ["Các chuyên gia đang chờ câu hỏi của bạn!", "Chưa thấy nhóm hợp? Nhắn Lan Anh nhé!"],
      apps: ["Ứng dụng mới đang lên kệ!", "Bấm vào thẻ để xem chi tiết nha!"],
      empty: ["Kệ này sắp có hàng, chờ mình chút nha!", "Đang chuẩn bị, sắp xong rồi!"],
      agent: ["Mình chạy 24/7, không cần ngủ!", "Việc lặp lại cứ để AI lo!"],
      work: ["Mở thư mục ra xem đi, toàn việc thật đó!", "9 thư mục, mỗi cái một câu chuyện!"],
      storage: ["Đăng ký xong là xem được kho nha!", "Kho chia sẻ có nhiều đồ hay lắm!"]
    },
    en: {
      base: ["Hi, I'm Ranh!", "Poke me again and I'll dance!", "What did you hand off to AI today?", "Every campaign starts with an insight ★"],
      community: ["Come hang out in the group!", "Ask anything, everyone's friendly!", "Show us how you use AI!"],
      expert: ["The experts are waiting for your questions!", "No group fits yet? Message Lan Anh!"],
      apps: ["New apps landing on the shelf!", "Tap a card for the details!"],
      empty: ["This shelf is filling up soon!", "Getting it ready, almost there!"],
      agent: ["I run 24/7, no sleep needed!", "Leave the repetitive stuff to AI!"],
      work: ["Open a folder, it's all real work!", "9 folders, 9 stories!"],
      storage: ["Sign up and the library is yours to browse!", "Lots of good stuff in the shared library!"]
    }
  };
  const lang = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = (p) => `assets/img/mascot/ranh-${p}.webp`;
  POSES.forEach((p) => { const i = new Image(); i.src = src(p); }); // tải sẵn để đổi tư thế không bị chớp

  const html = (pose) => {
    const p = POSES.includes(pose) ? pose : "wave";
    return `<span class="lm-bob"><span class="lm-tilt"><img src="${src(p)}" alt="" width="560" height="560" loading="lazy" decoding="async" draggable="false"></span></span>` +
      `<i class="lm-sp s1" aria-hidden="true">★</i><i class="lm-sp s2" aria-hidden="true">★</i><i class="lm-sp s3" aria-hidden="true">★</i><span class="lm-shadow"></span><span class="lm-say" role="status" aria-live="polite"></span>`;
  };
  const label = (el) => {
    const L = lang(), p = el.dataset.pose;
    el.setAttribute("aria-label", L === "en" ? `Ranh, the LANHMAR mascot, ${NAME.en[p]}. Click to chat.` : `Ranh, mascot LANHMAR, đang ${NAME.vi[p]}. Bấm để trò chuyện.`);
  };
  const paint = (root = document) => root.querySelectorAll(".lm-mascot:not([data-on])").forEach((el) => {
    el.dataset.on = "1";
    if (!POSES.includes(el.dataset.pose)) el.dataset.pose = "wave";
    el.innerHTML = html(el.dataset.pose);
    el.classList.toggle("is-yeah", el.dataset.pose === "yeah");
    if (el.hasAttribute("data-still")) { el.setAttribute("aria-hidden", "true"); return; }
    el.removeAttribute("aria-hidden");
    el.setAttribute("role", "button"); el.tabIndex = 0; el.classList.add("lm-live");
    label(el);
  });

  // bấm: đổi tư thế, nảy, hiện câu thoại (lần lượt theo bộ câu của vị trí, rồi tới câu chung)
  function poke(el) {
    const cur = POSES.indexOf(el.dataset.pose), next = POSES[(cur + 1) % POSES.length];
    el.dataset.pose = next; el.classList.toggle("is-yeah", next === "yeah");
    const img = el.querySelector("img"); if (img) img.src = src(next);
    if (!reduce) { el.classList.remove("poke"); void el.offsetWidth; el.classList.add("poke"); }
    const L = LINES[lang()], pool = [...(L[el.dataset.say] || []), ...L.base];
    const n = Number(el.dataset.n || 0); el.dataset.n = n + 1;
    const say = el.querySelector(".lm-say");
    say.textContent = pool[n % pool.length]; say.classList.add("on");
    clearTimeout(el._t); el._t = setTimeout(() => say.classList.remove("on"), 2800);
    label(el);
  }
  document.addEventListener("click", (e) => { const el = e.target.closest(".lm-mascot.lm-live"); if (el) { e.preventDefault(); poke(el); } });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("lm-live")) { e.preventDefault(); poke(e.target); } });

  // rê chuột: mascot nghiêng nhẹ về phía con trỏ (chỉ máy có chuột)
  if (!reduce && matchMedia("(hover: hover)").matches) {
    let raf = 0, last = null;
    document.addEventListener("pointermove", (e) => {
      last = e; if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.querySelectorAll(".lm-mascot.lm-live").forEach((el) => {
          const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
          const dx = (last.clientX - (r.left + r.width / 2)) / innerWidth, dy = (last.clientY - (r.top + r.height / 2)) / innerHeight;
          el.style.setProperty("--rx", Math.max(-1, Math.min(1, dx * 3)).toFixed(3));
          el.style.setProperty("--ry", Math.max(-1, Math.min(1, dy * 3)).toFixed(3));
        });
      });
    }, { passive: true });
  }

  window.LMMascot = { html, paint, poke };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => paint()); else paint();
  new MutationObserver(() => paint()).observe(document.documentElement, { childList: true, subtree: true });
  // đổi ngôn ngữ ở trang: cập nhật nhãn đọc màn hình
  document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(() => document.querySelectorAll(".lm-mascot.lm-live").forEach(label), 80); });
})();
