/* Mascot LANHMAR: "Ranh", bé lông tròn màu tím, ngôi sao cam trên đầu (★ của brand).
   Ảnh 3D tạo riêng cho LANHMAR bằng Canva AI theo bảng nhận diện của Ranh, nền trong suốt (assets/img/mascot/).
   Dùng: <span class="lm-mascot" data-pose="wave|mega|yeah" style="--size:140px"></span>
   Tư thế: wave = vẫy tay chào, mega = cầm loa, yeah = giơ tay ăn mừng. */
(() => {
  "use strict";
  const POSES = { wave: "Ranh vẫy tay chào", mega: "Ranh cầm loa", yeah: "Ranh giơ tay ăn mừng" };
  const html = (pose) => {
    const p = POSES[pose] ? pose : "wave";
    const spark = p === "yeah" ? '<i class="lm-sp s1">★</i><i class="lm-sp s2">★</i><i class="lm-sp s3">★</i>' : "";
    return `<span class="lm-bob"><img src="assets/img/mascot/ranh-${p}.webp" alt="" width="560" height="560" loading="lazy" decoding="async" draggable="false"></span>${spark}<span class="lm-shadow"></span>`;
  };
  const paint = (root = document) => root.querySelectorAll(".lm-mascot:not([data-on])").forEach((el) => {
    el.dataset.on = "1"; el.innerHTML = html(el.dataset.pose);
    if (!el.hasAttribute("aria-hidden")) { el.setAttribute("role", "img"); el.setAttribute("aria-label", "Mascot LANHMAR: " + (POSES[el.dataset.pose] || POSES.wave)); }
  });
  window.LMMascot = { html, paint };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => paint()); else paint();
  new MutationObserver(() => paint()).observe(document.documentElement, { childList: true, subtree: true });
})();
