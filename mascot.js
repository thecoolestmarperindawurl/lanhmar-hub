/* Mascot LANHMAR: "Ranh", bé lông tròn màu tím, ngôi sao cam trên đầu (★ của brand).
   Nhân vật vẽ riêng cho LANHMAR bằng SVG, không dùng hình của bên khác.
   Dùng: <span class="lm-mascot" data-pose="wave|mega|yeah" style="--size:140px"></span>
   Tư thế: wave = vẫy tay chào, mega = cầm loa, yeah = giơ tay ăn mừng. */
(() => {
  "use strict";
  const C = { body: "#6A5CFF", deep: "#2D2FEF", belly: "#E7E2FB", ink: "#241F45", orange: "#FF7A45", soft: "#FFD8C2", white: "#FFFFFF" };
  let n = 0;
  const star = (cx, cy, r, fill, cls = "") => {
    const p = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + "," + (cy + rr * Math.sin(a)).toFixed(1)); }
    return `<polygon class="${cls}" points="${p.join(" ")}" fill="${fill}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
  };
  // tay: gốc ở vai (x, y), góc rot tính theo chiều kim đồng hồ từ hướng thẳng xuống
  const arm = (x, y, rot, cls = "") => `<g class="${cls}" style="transform-origin:${x}px ${y}px"><rect x="${x - 10}" y="${y - 8}" width="20" height="40" rx="10" fill="${C.body}" stroke="${C.ink}" stroke-width="3" transform="rotate(${rot} ${x} ${y})"/></g>`;

  function svg(pose) {
    const id = "lmf" + ++n;
    const open = pose !== "wave";
    const mouth = open
      ? `<path d="M90 121 Q100 136 110 121 Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/><path d="M95 128 Q100 133 105 128" fill="${C.orange}"/>`
      : `<path d="M91 122 Q100 131 109 122" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    const arms = {
      wave: arm(44, 126, 28) + arm(152, 100, -145, "lm-wave"),
      mega: arm(156, 126, -28),
      yeah: arm(48, 100, 145, "lm-up l") + arm(152, 100, -145, "lm-up r")
    }[pose];
    const extra = {
      wave: "",
      mega: `<g class="lm-mega"><path d="M70 116 L26 94 Q20 117 26 140 L70 126 Z" fill="${C.orange}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
             <ellipse cx="25" cy="117" rx="7" ry="23" fill="${C.soft}" stroke="${C.ink}" stroke-width="3"/>
             <rect x="66" y="112" width="12" height="18" rx="4" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>
             <path d="M48 128 L46 146" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>${arm(58, 150, 120)}
             <g class="lm-sound" fill="none" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"><path d="M8 96 L-2 88"/><path d="M6 117 L-6 117"/><path d="M8 138 L-2 146"/></g></g>`,
      yeah: `<g class="lm-spark">${star(30, 62, 9, C.orange)}${star(172, 58, 7, C.soft)}${star(160, 30, 5, C.orange)}</g>`
    }[pose];
    return `<svg viewBox="-8 0 216 200" role="img" aria-label="Mascot LANHMAR" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="1" seed="7"/><feDisplacementMap in="SourceGraphic" scale="4.5"/></filter></defs>
      <ellipse cx="100" cy="186" rx="52" ry="7" fill="${C.ink}" opacity=".12" class="lm-shadow"/>
      <g class="lm-bob">
        <ellipse cx="80" cy="172" rx="15" ry="9" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>
        <ellipse cx="120" cy="172" rx="15" ry="9" fill="${C.deep}" stroke="${C.ink}" stroke-width="3"/>
        <g class="lm-tuft"><path d="M100 52 Q98 38 106 30" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round"/>${star(108, 26, 12, C.orange)}</g>
        <circle cx="100" cy="112" r="62.5" fill="${C.ink}" filter="url(#${id})"/>
        <circle cx="100" cy="112" r="60" fill="${C.body}" filter="url(#${id})"/>
        <ellipse cx="100" cy="142" rx="36" ry="24" fill="${C.belly}" opacity=".55"/>
        <ellipse cx="62" cy="122" rx="9" ry="6" fill="${C.soft}" opacity=".9"/>
        <ellipse cx="138" cy="122" rx="9" ry="6" fill="${C.soft}" opacity=".9"/>
        <g class="lm-eyes">
          <ellipse cx="78" cy="98" rx="17" ry="20" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
          <ellipse cx="122" cy="98" rx="17" ry="20" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
          <circle cx="80" cy="102" r="11" fill="${C.ink}"/><circle cx="120" cy="102" r="11" fill="${C.ink}"/>
          <circle cx="84" cy="97" r="4" fill="${C.white}"/><circle cx="124" cy="97" r="4" fill="${C.white}"/>
          <circle cx="77" cy="107" r="1.8" fill="${C.white}"/><circle cx="117" cy="107" r="1.8" fill="${C.white}"/>
        </g>
        ${mouth}
        ${arms}
        ${extra}
      </g></svg>`;
  }
  const paint = (root = document) => root.querySelectorAll(".lm-mascot:not([data-on])").forEach((el) => { el.dataset.on = "1"; el.innerHTML = svg(el.dataset.pose || "wave"); });
  window.LMMascot = { svg, paint };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => paint()); else paint();
  new MutationObserver(() => paint()).observe(document.documentElement, { childList: true, subtree: true });
})();
