/* Open Storage: bấm nút thì hành tinh (cùng kiểu với hành tinh trên nút) từ xa bay tới, lớn dần, tự quay, vành đai lướt qua,
   các vì sao kéo vệt về phía sau (cảm giác lao tới), cuối cùng hành tinh phủ kín màn hình rồi mới hiện phần donate.
   - Mọi trang có nút (trang chủ, Cộng đồng, Kho báu): bay tới xong thì vào trang khoá Kho cá nhân (kho.html); ở đó có nút
     "Truy cập Data Storage" dẫn sang luồng donate/đăng ký.
   - kho.html cũng nạp file này: nếu vừa tới bằng hiệu ứng, bề mặt hành tinh phủ màn hình rồi tan dần để lộ trang khoá.
   Giữ Ctrl/⌘/Shift hoặc bấm chuột giữa thì mở link bình thường. Chọn giảm chuyển động: bỏ hiệu ứng. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let busy = false;

  window.planetWarp = (from) => new Promise((done) => {
    if (reduce || busy || !Element.prototype.animate) return done(() => {});
    busy = true;
    const W = innerWidth, H = innerHeight, D = 240;                      // đường kính gốc của hành tinh (px)
    const r = (from && from.querySelector(".ts-ball") || from || document.body).getBoundingClientRect();
    const sx = r.left + r.width / 2, sy = r.top + r.height / 2, ex = W / 2, ey = H / 2;
    const cover = (Math.hypot(W, H) * 1.25) / D;                         // đủ lớn để phủ kín cả góc màn hình

    const wrap = document.createElement("div"); wrap.className = "pw-wrap"; wrap.setAttribute("aria-hidden", "true");
    const cv = document.createElement("canvas"); cv.className = "pw-stars";
    const pl = document.createElement("div"); pl.className = "pw-planet";
    pl.innerHTML = '<i class="pw-ring back"></i><b class="pw-ball"><i></i></b><i class="pw-ring front"></i>';
    wrap.append(cv, pl); document.body.appendChild(wrap);
    document.documentElement.classList.add("pw-lock");

    // sao kéo vệt: toả ra từ tâm, nhanh dần theo tiến độ bay
    const dpr = Math.min(devicePixelRatio || 1, 2), ctx = cv.getContext("2d");
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const S = Array.from({ length: W < 700 ? 160 : 320 }, () => ({ a: Math.random() * Math.PI * 2, d: Math.random() * 0.9 + 0.05, s: 0.5 + Math.random() * 1.5, c: Math.random() < 0.25 ? "255,176,138" : Math.random() < 0.5 ? "185,176,255" : "255,255,255" }));
    const DUR = 1500, t0 = performance.now(), ease = (k) => k * k * k;    // tới gần thì lao nhanh hơn (phối cảnh)
    let raf = 0;
    const stars = (now) => {
      const k = Math.min(1, (now - t0) / DUR), v = 0.004 + ease(k) * 0.06, R = Math.hypot(W, H) / 2;
      ctx.fillStyle = `rgba(8,6,28,${(0.25 + 0.5 * k).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
      for (const p of S) {
        const d0 = p.d, d1 = p.d = p.d * (1 + v * 2.2) + v * 0.5; if (p.d > 1.2) { p.d = 0.03 + Math.random() * 0.2; p.a = Math.random() * Math.PI * 2; continue; }
        const c = Math.cos(p.a), s = Math.sin(p.a);
        ctx.strokeStyle = `rgba(${p.c},${Math.min(1, 0.3 + d1).toFixed(3)})`; ctx.lineWidth = p.s * (0.6 + d1);
        ctx.beginPath(); ctx.moveTo(ex + c * d0 * R, ey + s * d0 * R); ctx.lineTo(ex + c * d1 * R, ey + s * d1 * R); ctx.stroke();
      }
      if (k < 1) raf = requestAnimationFrame(stars);
    };
    raf = requestAnimationFrame(stars);
    wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: "forwards" });

    // hành tinh: từ chỗ nút (nhỏ xíu, ở xa) bay vào giữa màn hình, phóng to theo phối cảnh, tự quay; vành đai nghiêng dần
    const tf = (x, y, s, rot) => `translate(${(x - D / 2).toFixed(1)}px,${(y - D / 2).toFixed(1)}px) scale(${s.toFixed(4)}) rotate(${rot}deg)`;
    const s0 = Math.max(0.04, r.width / D), mid = 0.55;
    const fly = pl.animate([
      { transform: tf(sx, sy, s0, -22), offset: 0 },
      { transform: tf(sx + (ex - sx) * 0.55, sy + (ey - sy) * 0.55, 0.38, -14), offset: 0.38 },
      { transform: tf(ex, ey, 1.35, -6), offset: 0.72 },
      { transform: tf(ex, ey, cover, 0), offset: 1 },
    ], { duration: DUR, easing: "cubic-bezier(.45,0,.75,.6)", fill: "forwards" });
    pl.querySelector(".pw-ball i").animate([{ backgroundPosition: "0 0" }, { backgroundPosition: `-${D * 1.6}px 0` }], { duration: DUR, easing: "linear", fill: "forwards" });
    // vành đai bay vượt ra ngoài màn hình trước khi bề mặt hành tinh phủ kín
    pl.querySelectorAll(".pw-ring").forEach((el) => el.animate([{ opacity: 1, transform: "rotate(-18deg) scale(1)" }, { opacity: 1, offset: 0.78 }, { opacity: 0, transform: "rotate(-4deg) scale(1.9)" }], { duration: DUR, easing: "ease-in", fill: "forwards" }));

    fly.finished.then(() => new Promise((r) => setTimeout(r, 260))).then(() => {   // giữ khoảnh khắc hành tinh phủ kín màn hình
      cancelAnimationFrame(raf);
      // bề mặt hành tinh phủ kín → mở nội dung, rồi lớp hành tinh tan dần để lộ hộp donate
      const finish = () => {
        wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: "ease-out", fill: "forwards" }).finished.then(() => { wrap.remove(); busy = false; });
        document.documentElement.classList.remove("pw-lock");
      };
      done(finish);
    });
  });

  // bấm Open Storage: bay tới rồi vào kho.html
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a.top-storage"); if (!a) return;
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || reduce) return;
    e.preventDefault();
    window.planetWarp(a).then(() => { try { sessionStorage.setItem("pw-arrive", "1"); } catch {} location.href = a.href; });
  });

  // trang đích: bề mặt hành tinh đang phủ màn hình tan dần (nối liền với hiệu ứng ở trang trước)
  let arrive = false; try { arrive = sessionStorage.getItem("pw-arrive") === "1"; sessionStorage.removeItem("pw-arrive"); } catch {}
  if (arrive && !reduce && Element.prototype.animate) {
    const s = document.createElement("div"); s.setAttribute("aria-hidden", "true");
    s.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;background:" +
      "radial-gradient(120% 90% at 32% 28%,rgba(255,255,255,.35),rgba(255,255,255,0) 40%)," +
      "linear-gradient(158deg,#FFC2A3 0 16%,#FF7A45 16% 30%,#FFA77F 30% 41%,#8F84FF 41% 50%,#B9B0FF 50% 55%,#6A5CFF 55% 66%,#FF8B5C 66% 74%,#2D2FEF 74%)";
    (document.body || document.documentElement).appendChild(s);
    s.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.15)" }], { duration: 900, delay: 80, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished.then(() => s.remove());
  }
})();
