/* Mascot LANHMAR: "Ranh", bé lông tròn màu tím, ngôi sao cam trên đầu (★ của brand).
   13 ảnh 3D tạo riêng cho LANHMAR bằng Canva AI theo bảng nhận diện của Ranh, nền trong suốt (assets/img/mascot/ranh-<mood>.webp).

   Dùng: <span class="lm-mascot" data-pose="wave" data-say="community" style="--size:140px"></span>
   - data-pose : biểu cảm ban đầu (xem MOODS)
   - data-say  : bộ câu thoại theo vị trí (xem SPOT); bỏ trống thì dùng câu chung
   - data-moods: (tuỳ chọn) danh sách biểu cảm được dùng ở vị trí này, cách nhau dấu phẩy
   - data-still: chỉ trang trí, không bấm, không tự đổi

   Hành vi:
   - Bấm / Enter / Space: đổi sang biểu cảm ngẫu nhiên khác (không lặp lại liền kề), mỗi biểu cảm có kiểu nảy và câu thoại riêng.
   - Tự đổi biểu cảm mỗi 9–15 giây khi mascot đang trong khung nhìn và tab đang mở; thỉnh thoảng nói một câu.
   - Rê chuột: nghiêng nhẹ theo con trỏ. Tắt chuyển động khi bật "giảm chuyển động" (vẫn đổi biểu cảm khi bấm). */
(() => {
  "use strict";
  // fx: kiểu chuyển động khi đổi sang biểu cảm này (xem mascot.css: .fx-*)
  const MOODS = {
    wave:   { fx: "hop",    vi: ["Chào bạn, mình là Ranh!", "Hi hi, ghé chơi nha!"],                       en: ["Hi, I'm Ranh!", "Hey there, welcome in!"] },
    mega:   { fx: "shout",  vi: ["Loa loa! Có tin hay nè!", "Mỗi chiến dịch bắt đầu từ một insight ★"],     en: ["Announcement time!", "Every campaign starts with an insight ★"] },
    yeah:   { fx: "jump",   vi: ["Yeah! Làm được rồi!", "Ăn mừng cái nào!"],                              en: ["Yes! We did it!", "Time to celebrate!"] },
    wow:    { fx: "pop",    vi: ["Ủa, thật hả?!", "Wow, cái này hay ghê!"],                               en: ["Wait, really?!", "Whoa, that's cool!"] },
    wink:   { fx: "tilt",   vi: ["Tin mình đi, ổn áp!", "Chuẩn không cần chỉnh 😉"],                       en: ["Trust me, it's good!", "Nailed it 😉"] },
    think:  { fx: "sway",   vi: ["Hmm… insight nằm đâu ta?", "Để mình nghĩ chút đã…"],                     en: ["Hmm… where's the insight?", "Let me think about it…"] },
    laugh:  { fx: "shake",  vi: ["Haha, vui quá trời!", "Cười xỉu luôn á!"],                              en: ["Haha, that's hilarious!", "Can't stop laughing!"] },
    laptop: { fx: "type",   vi: ["Đang giao việc cho AI…", "Gõ gõ gõ, sắp xong rồi!"],                     en: ["Handing tasks to AI…", "Tap tap tap, almost done!"] },
    idea:   { fx: "pop",    vi: ["Á! Có ý tưởng rồi!", "Ting! Ý tưởng mới tới!"],                          en: ["Aha! Got an idea!", "Ding! New idea incoming!"] },
    love:   { fx: "beat",   vi: ["Cảm ơn bạn đã ghé nha ♥", "Thương người đọc tới đây ghê!"],              en: ["Thanks for stopping by ♥", "Love that you scrolled this far!"] },
    coffee: { fx: "sway",   vi: ["Cà phê trước, chiến dịch sau ☕", "Nghỉ một chút rồi làm tiếp nha!"],     en: ["Coffee first, campaigns later ☕", "Quick break, then back to it!"] },
    chart:  { fx: "jump",   vi: ["Nhìn nè, traffic đang lên!", "Số liệu đẹp quá trời!"],                   en: ["Look, traffic's going up!", "Those numbers look great!"] },
    dance:  { fx: "dance",  vi: ["Nhảy cái cho vui nào!", "Bấm nữa đi, mình nhảy tiếp!"],                  en: ["Dance break!", "Tap again, I'll keep dancing!"] }
  };
  const ALL = Object.keys(MOODS);
  // câu thoại theo vị trí và bộ biểu cảm hợp ngữ cảnh (ưu tiên khi tự đổi)
  const SPOT = {
    community: { moods: ["wave", "mega", "yeah", "love", "laugh", "wink", "dance"],
      vi: ["Vào nhóm chơi với tụi mình nha!", "Hỏi gì cứ hỏi, nhóm thân thiện lắm!", "Khoe cách bạn dùng AI đi!"],
      en: ["Come hang out in the group!", "Ask anything, everyone's friendly!", "Show us how you use AI!"] },
    expert: { moods: ["think", "idea", "wink", "wave", "love"],
      vi: ["Các chuyên gia đang chờ câu hỏi của bạn!", "Chưa thấy nhóm hợp? Nhắn Lan Anh nhé!"],
      en: ["The experts are waiting for your questions!", "No group fits yet? Message Lan Anh!"] },
    apps: { moods: ["laptop", "yeah", "idea", "chart", "wow", "dance"],
      vi: ["Ứng dụng mới đang lên kệ!", "Bấm vào thẻ để xem chi tiết nha!"],
      en: ["New apps landing on the shelf!", "Tap a card for the details!"] },
    empty: { moods: ["coffee", "think", "laptop", "wave"],
      vi: ["Kệ này sắp có hàng, chờ mình chút nha!", "Đang chuẩn bị, sắp xong rồi!"],
      en: ["This shelf is filling up soon!", "Getting it ready, almost there!"] },
    agent: { moods: ["mega", "laptop", "coffee", "chart", "idea", "wink"],
      vi: ["Mình chạy 24/7, không cần ngủ!", "Việc lặp lại cứ để AI lo!"],
      en: ["I run 24/7, no sleep needed!", "Leave the repetitive stuff to AI!"] },
    work: { moods: ["chart", "idea", "think", "wow", "yeah", "wave"],
      vi: ["Mở thư mục ra xem đi, toàn việc thật đó!", "9 thư mục, mỗi cái một câu chuyện!"],
      en: ["Open a folder, it's all real work!", "9 folders, 9 stories!"] },
    storage: { moods: ["wave", "love", "coffee", "wink", "laptop"],
      vi: ["Đăng ký xong là xem được kho nha!", "Kho chia sẻ có nhiều đồ hay lắm!"],
      en: ["Sign up and the library is yours to browse!", "Lots of good stuff in the shared library!"] }
  };
  const BASE = { vi: ["Bấm nữa là mình đổi mood đó!", "Hôm nay bạn giao việc gì cho AI rồi?"], en: ["Poke me again for a new mood!", "What did you hand off to AI today?"] };
  const NAME = {
    vi: { wave: "vẫy tay chào", mega: "cầm loa", yeah: "ăn mừng", wow: "ngạc nhiên", wink: "nháy mắt", think: "suy nghĩ", laugh: "cười lớn", laptop: "gõ laptop", idea: "có ý tưởng", love: "ôm trái tim", coffee: "uống cà phê", chart: "khoe biểu đồ", dance: "nhảy múa" },
    en: { wave: "waving hello", mega: "with a megaphone", yeah: "celebrating", wow: "surprised", wink: "winking", think: "thinking", laugh: "laughing", laptop: "typing on a laptop", idea: "with a bright idea", love: "hugging a heart", coffee: "sipping coffee", chart: "showing a chart", dance: "dancing" }
  };

  const lang = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const src = (m) => `assets/img/mascot/ranh-${m}.webp`;
  const pick = (arr, not) => { const a = arr.filter((x) => x !== not); return a[Math.floor(Math.random() * a.length)] || arr[0]; };
  const moodsOf = (el) => {
    const own = (el.dataset.moods || "").split(",").map((s) => s.trim()).filter((m) => MOODS[m]);
    return own.length ? own : (SPOT[el.dataset.say] || {}).moods || ALL;
  };

  // tải trước ảnh khi trình duyệt rảnh, để đổi biểu cảm không bị chớp
  const preload = () => ALL.forEach((m) => { const i = new Image(); i.decoding = "async"; i.src = src(m); });
  ("requestIdleCallback" in window ? requestIdleCallback : (f) => setTimeout(f, 1500))(preload);

  const html = (m) => `<span class="lm-bob"><span class="lm-tilt"><span class="lm-fx"><img src="${src(m)}" alt="" width="560" height="560" loading="lazy" decoding="async" draggable="false"></span></span></span>` +
    `<i class="lm-sp s1" aria-hidden="true">★</i><i class="lm-sp s2" aria-hidden="true">★</i><i class="lm-sp s3" aria-hidden="true">★</i><span class="lm-shadow"></span><span class="lm-say" role="status" aria-live="polite"></span>`;
  const label = (el) => {
    const L = lang(), m = el.dataset.pose;
    el.setAttribute("aria-label", L === "en" ? `Ranh, the LANHMAR mascot, ${NAME.en[m]}. Click for a new mood.` : `Ranh, mascot LANHMAR, đang ${NAME.vi[m]}. Bấm để đổi biểu cảm.`);
  };

  const live = new Set();
  const paint = (root = document) => root.querySelectorAll(".lm-mascot:not([data-on])").forEach((el) => {
    el.dataset.on = "1";
    if (!MOODS[el.dataset.pose]) el.dataset.pose = "wave";
    el.innerHTML = html(el.dataset.pose);
    el.classList.toggle("is-yeah", el.dataset.pose === "yeah");
    if (el.hasAttribute("data-still")) { el.setAttribute("aria-hidden", "true"); return; }
    el.removeAttribute("aria-hidden");
    el.setAttribute("role", "button"); el.tabIndex = 0; el.classList.add("lm-live");
    label(el); live.add(el); if (io) io.observe(el);
  });

  function say(el, text, ms = 2800) {
    const b = el.querySelector(".lm-say"); if (!b) return;
    b.textContent = text; b.classList.add("on");
    clearTimeout(el._t); el._t = setTimeout(() => b.classList.remove("on"), ms);
  }
  // đổi biểu cảm: ảnh mới đã tải xong mới thay để không chớp trắng
  function setMood(el, m) {
    const img = el.querySelector("img"); if (!img) return;
    el.dataset.pose = m; el.classList.toggle("is-yeah", m === "yeah" || m === "chart" || m === "dance");
    const pre = new Image(); pre.src = src(m);
    const swap = () => { img.src = pre.src; };
    (pre.decode ? pre.decode().then(swap, swap) : (pre.onload = swap));
    const fx = el.querySelector(".lm-fx");
    if (!reduce && fx) { fx.className = "lm-fx"; void fx.offsetWidth; fx.classList.add("fx-" + MOODS[m].fx); }
    label(el);
  }
  function poke(el) {
    const L = lang(), m = pick(ALL, el.dataset.pose);
    setMood(el, m);
    // xen kẽ: câu theo biểu cảm, câu theo vị trí, câu chung
    const n = Number(el.dataset.n || 0); el.dataset.n = n + 1;
    const spot = (SPOT[el.dataset.say] || {})[L] || [];
    const pools = [MOODS[m][L], spot.length ? spot : MOODS[m][L], MOODS[m][L], BASE[L]];
    const pool = pools[n % pools.length];
    say(el, pool[Math.floor(Math.random() * pool.length)]);
    el._last = Date.now();
  }
  document.addEventListener("click", (e) => { const el = e.target.closest(".lm-mascot.lm-live"); if (el) { e.preventDefault(); poke(el); } });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("lm-live")) { e.preventDefault(); poke(e.target); } });

  // tự đổi biểu cảm khi mascot đang trong khung nhìn (mỗi mascot lệch nhịp nhau, không đổi cùng lúc)
  const seen = new Set();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target))), { threshold: 0.4 }) : null;
  live.forEach((el) => io && io.observe(el));
  if (!reduce) {
    const tick = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        seen.forEach((el) => {
          if (!el.isConnected) { seen.delete(el); return; }
          el._next = el._next || now + 4000 + Math.random() * 6000;
          if (now < el._next || now - (el._last || 0) < 6000) return;
          const L = lang(), m = pick(moodsOf(el), el.dataset.pose);
          setMood(el, m);
          if (Math.random() < 0.35) say(el, MOODS[m][L][Math.floor(Math.random() * MOODS[m][L].length)], 2400);
          el._next = now + 9000 + Math.random() * 6000;
        });
      }
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 2500);
  }

  // rê chuột: mascot nghiêng nhẹ về phía con trỏ (chỉ máy có chuột)
  if (!reduce && matchMedia("(hover: hover)").matches) {
    let raf = 0, last = null;
    document.addEventListener("pointermove", (e) => {
      last = e; if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        seen.forEach((el) => {
          const r = el.getBoundingClientRect();
          const dx = (last.clientX - (r.left + r.width / 2)) / innerWidth, dy = (last.clientY - (r.top + r.height / 2)) / innerHeight;
          el.style.setProperty("--rx", Math.max(-1, Math.min(1, dx * 3)).toFixed(3));
          el.style.setProperty("--ry", Math.max(-1, Math.min(1, dy * 3)).toFixed(3));
        });
      });
    }, { passive: true });
  }

  window.LMMascot = { html, paint, poke, setMood, moods: ALL };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => paint()); else paint();
  new MutationObserver(() => paint()).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("click", (e) => { if (e.target.closest(".lang button")) setTimeout(() => live.forEach((el) => el.isConnected && label(el)), 80); });
})();
