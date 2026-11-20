/* Màn mở đầu "Big Bang": một điểm sáng nổ tung thành hàng nghìn hạt, hạt bay xa rồi xoáy ngược về ghép thành logo LANHMAR,
   ánh sáng lướt qua chữ, màn tan ra để lộ trang (học từ intro "vỡ mảnh" của GZA).
   Chạy 1 lần mỗi phiên trình duyệt (sessionStorage lm_intro); máy bật "giảm chuyển động" thì bỏ qua; xem lại: thêm ?intro.
   <head> có đoạn nhỏ đặt class bb-hold (giấu trang, dừng hiệu ứng CSS) trước khi vẽ để không chớp; xong thì phát sự kiện "lm-intro-done". */
(() => {
  "use strict";
  const root = document.documentElement;
  if (!root.classList.contains("bb-hold")) return;
  clearTimeout(window.__bbT); // hẹn giờ dự phòng ở <head> chỉ dành cho lúc file này không tải được
  try { sessionStorage.setItem("lm_intro", "1"); } catch {}
  const lang = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };

  const wrap = document.createElement("div"); wrap.className = "bb";
  const cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true");
  const skip = document.createElement("button"); skip.type = "button"; skip.className = "bb-skip"; skip.textContent = lang() === "en" ? "Skip ›" : "Bỏ qua ›";
  wrap.append(cv, skip); document.body.appendChild(wrap);
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; };
  size(); addEventListener("resize", size);

  // mốc thời gian (ms)
  const BANG = 550, GATHER = 1750, HOLD = 3450, OUT = 4250, END = 5050;
  const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const outQ = (t) => 1 - Math.pow(1 - ease(t), 3);
  const inOut = (t) => { t = ease(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  let parts = [], dust = [], gap = 3, ready = false, t0 = 0, ended = false, revealed = false;

  // lấy điểm ảnh của logo làm đích cho các hạt; chữ màu tối được làm sáng lên để nổi trên nền đêm
  const logo = new Image();
  logo.onload = () => {
    const lw = Math.min(520, W * 0.82), lh = lw * logo.height / logo.width;
    const oc = document.createElement("canvas"); oc.width = Math.ceil(lw); oc.height = Math.ceil(lh);
    const ox = oc.getContext("2d"); ox.drawImage(logo, 0, 0, lw, lh);
    const px = ox.getImageData(0, 0, oc.width, oc.height).data;
    let pts;
    for (gap = 2; ; gap++) {
      pts = [];
      for (let y = 0; y < oc.height; y += gap) for (let x = 0; x < oc.width; x += gap) {
        const k = (y * oc.width + x) * 4; if (px[k + 3] < 140) continue;
        let r = px[k], g = px[k + 1], b = px[k + 2];
        if ((0.3 * r + 0.59 * g + 0.11 * b) / 255 < 0.4) { r = r * 0.35 + 178 * 0.65; g = g * 0.35 + 164 * 0.65; b = b * 0.35 + 239 * 0.65; }
        pts.push([x, y, `rgb(${r | 0},${g | 0},${b | 0})`]);
      }
      if (pts.length <= 2600 || gap > 8) break;
    }
    const ox0 = (W - lw) / 2, oy0 = (H - lh) / 2;
    parts = pts.map(([x, y, c]) => {
      const a = Math.random() * Math.PI * 2, sp = (0.15 + Math.pow(Math.random(), 1.8)) * Math.max(W, H) * 0.55;
      return { tx: ox0 + x, ty: oy0 + y, c, a, sp, d: Math.random() * 380, sw: (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 120) };
    });
    dust = Array.from({ length: 420 }, () => ({ a: Math.random() * Math.PI * 2, sp: (0.4 + Math.random()) * Math.max(W, H) * 0.75, s: 0.6 + Math.random() * 1.6, c: Math.random() < 0.5 ? "#B2A4EF" : Math.random() < 0.5 ? "#FF7A45" : "#fff" }));
    ready = true;
  };
  logo.onerror = () => finish();
  logo.src = "assets/img/logo-lanhmar.webp";

  function reveal() {
    if (revealed) return; revealed = true;
    root.classList.remove("bb-hold");
    wrap.classList.add("out");
  }
  function finish() {
    if (ended) return; ended = true;
    reveal(); removeEventListener("resize", size);
    setTimeout(() => { wrap.remove(); document.dispatchEvent(new Event("lm-intro-done")); }, 800);
  }
  // bấm bất kỳ đâu / phím bất kỳ để bỏ qua
  wrap.addEventListener("click", finish);
  addEventListener("keydown", function k(e) { if (e.key === "Tab") return; removeEventListener("keydown", k); finish(); });

  function frame(now) {
    if (ended) return;
    if (!t0) t0 = now;
    let t = now - t0;
    // logo chưa tải xong thì giữ ở pha nổ
    if (!ready && t > GATHER - 50) { t0 += now - t0 - (GATHER - 50); t = GATHER - 50; }
    const cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // vệt mờ: xoá dần khung cũ thay vì xoá sạch
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = t > HOLD ? "rgba(0,0,0,.5)" : "rgba(0,0,0,.3)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";

    if (t < BANG) {
      // điểm kỳ dị: chấm sáng phồng lên, rung nhẹ
      const k = t / BANG, r = 3 + 22 * k * k, j = k * 2.5;
      const x = cx + (Math.random() - 0.5) * j, y = cy + (Math.random() - 0.5) * j;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(255,190,150,.9)"); g.addColorStop(0.6, "rgba(106,92,255,.35)"); g.addColorStop(1, "rgba(45,47,239,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
    } else {
      const tb = t - BANG;
      // chớp sáng + sóng xung kích + rung màn
      if (tb < 420) { ctx.fillStyle = `rgba(255,236,220,${0.9 * (1 - tb / 420)})`; ctx.fillRect(0, 0, W, H); }
      if (tb < 1100) {
        const k = tb / 1100;
        ctx.lineWidth = 2 + 10 * (1 - k);
        ctx.strokeStyle = `rgba(255,122,69,${0.7 * (1 - k)})`; ctx.beginPath(); ctx.arc(cx, cy, R * outQ(k), 0, 7); ctx.stroke();
        ctx.strokeStyle = `rgba(106,92,255,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.arc(cx, cy, R * 0.7 * outQ(k), 0, 7); ctx.stroke();
      }
      if (tb < 320) { const s = 7 * (1 - tb / 320); ctx.setTransform(dpr, 0, 0, dpr, (Math.random() - 0.5) * s * dpr, (Math.random() - 0.5) * s * dpr); }

      // bụi sao: bay xa và tắt dần, không quay về
      const kd = Math.min(1, tb / 2600);
      if (kd < 1) for (const p of dust) {
        const d = p.sp * outQ(tb / 2600);
        ctx.globalAlpha = 1 - kd; ctx.fillStyle = p.c; ctx.fillRect(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d, p.s, p.s);
      }
      ctx.globalAlpha = 1;

      // hạt logo: nổ ra (BANG→GATHER) rồi xoáy về đúng chỗ (GATHER→HOLD)
      const hot = tb < 380, sz = Math.max(1.2, gap * 0.92), sweep = t > HOLD - 250 ? (t - HOLD + 250) / 900 : -1;
      const bandX = W * (-0.2 + 1.4 * sweep);
      for (const p of parts) {
        const ex = cx + Math.cos(p.a) * p.sp * outQ((t - BANG) / (GATHER - BANG));
        const ey = cy + Math.sin(p.a) * p.sp * outQ((t - BANG) / (GATHER - BANG));
        let x = ex, y = ey;
        if (t > GATHER) {
          const k = inOut((t - GATHER - p.d) / (HOLD - GATHER - 380));
          // đi theo đường cong: lệch vuông góc, lớn nhất ở giữa đường
          const dx = p.tx - ex, dy = p.ty - ey, L = Math.hypot(dx, dy) || 1, bend = Math.sin(Math.PI * k) * p.sw;
          x = ex + dx * k - (dy / L) * bend; y = ey + dy * k + (dx / L) * bend;
        }
        ctx.fillStyle = hot ? "#fff" : p.c;
        // ánh sáng lướt qua chữ khi logo vừa ghép xong
        if (sweep >= 0 && Math.abs(x - bandX) < 40) ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, sz, sz);
      }
    }
    if (t > OUT) reveal();
    if (t > END) return finish();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
