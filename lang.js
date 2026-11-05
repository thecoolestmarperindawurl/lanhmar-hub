/* Song ngữ VI/EN dùng chung cho Data Storage / Kho (cùng khoá "lm_lang" với trang chủ và Cộng đồng).
   LM.lang()            -> "vi" | "en"
   LM.t(vi, en)         -> chuỗi theo ngôn ngữ đang chọn
   LM.set(l)            -> đổi ngôn ngữ, lưu lại, phát sự kiện "lm:lang"
   LM.localizeKho()     -> áp tên/mô tả kho, nhóm, kệ từ KHO_EN (kho-en.js) lên window.KHO (giữ bản gốc để quay lại VI)
   LM.localizeItem(i)   -> bản sao của một thẻ nổi bật với tiêu đề/mô tả tiếng Anh nếu có
   Nút chuyển: <div class="lang" data-lm-lang></div> sẽ được vẽ tự động. */
(() => {
  const get = () => { try { return localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch { return "vi"; } };
  let cur = get();
  const LM = {
    lang: () => cur,
    t: (vi, en) => (cur === "en" && en != null ? en : vi),
    set(l) {
      l = l === "en" ? "en" : "vi"; if (l === cur) return;
      cur = l; try { localStorage.setItem("lm_lang", l); } catch {}
      document.documentElement.lang = l; LM.localizeKho(); paintToggles();
      document.dispatchEvent(new CustomEvent("lm:lang", { detail: l }));
      LM.loadFull();
    },
    localizeKho() {
      const E = (window.KHO_EN || {}).kho || {};
      (window.KHO || []).forEach((k) => {
        k._vi = k._vi || { name: k.name, desc: k.desc, headline: k.headline };
        const e = cur === "en" ? E[k.id] || {} : {};
        k.name = e.name || k._vi.name; k.desc = e.desc || k._vi.desc; if (k._vi.headline) k.headline = e.headline || k._vi.headline;
        (k.groups || []).forEach((g) => {
          g._vi = g._vi || { name: g.name };
          g.name = (e.groups || {})[g.id] || g._vi.name;
          if (g.intro) {
            g.intro._vi = g.intro._vi || { text: g.intro.text, rows: g.intro.rows.map((r) => r[0]), btn: g.intro.btn };
            const ie = cur === "en" ? e.intro : null;
            g.intro.text = ie ? ie.text : g.intro._vi.text;
            g.intro.rows.forEach((r, n) => { r[0] = ie && ie.rows[n] ? ie.rows[n] : g.intro._vi.rows[n]; });
            g.intro.btn = ie ? ie.btn : g.intro._vi.btn;
            g.intro.head = ie ? ie.head : ["Tình huống", "Dùng skill"];
          }
        });
        (k.shelves || []).forEach((s) => {
          s._vi = s._vi || { name: s.name, sub: s.sub };
          const se = cur === "en" ? (e.shelves || {})[s.id] : null;
          s.name = se ? se[0] : s._vi.name; s.sub = se ? se[1] : s._vi.sub;
        });
      });
    },
    localizeItem(i) {
      if (cur !== "en") return i;
      const E = window.KHO_EN || {}, e = (E.items || {})[i.id], tm = E.tags || {};
      const full = (LM._full || {})[i.id]; // bản dịch đầy đủ nội dung chi tiết (i18n/featured-en.json)
      const tags = (i.tags || []).map((t) => tm[t] || t);
      return { ...i, ...(full || {}), ...(e || {}), tags, featured: true, _en: !!e, _full: !!full };
    },
    // tải bản dịch nội dung chi tiết khi cần (chỉ khi đang xem EN); xong thì phát "lm:content" để trang vẽ lại
    loadFull() {
      if (cur !== "en" || LM._full || LM._loading) return LM._loading || Promise.resolve();
      LM._loading = fetch("i18n/featured-en.json?v=" + (window.__khoEnV || "1")).then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
        .then((j) => { LM._full = j || {}; LM._loading = null; document.dispatchEvent(new CustomEvent("lm:content")); });
      return LM._loading;
    }
  };
  function paintToggles() {
    document.querySelectorAll("[data-lm-lang]").forEach((box) => {
      if (!box.dataset.on) {
        box.dataset.on = "1"; box.classList.add("lang");
        box.innerHTML = '<button type="button" data-lang="vi">VI</button><span>/</span><button type="button" data-lang="en">EN</button>';
        box.addEventListener("click", (e) => { const b = e.target.closest("[data-lang]"); if (b) LM.set(b.dataset.lang); });
      }
      box.querySelectorAll("[data-lang]").forEach((b) => { const on = b.dataset.lang === cur; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    });
  }
  window.LM = LM;
  document.documentElement.lang = cur;
  LM.localizeKho();
  LM.loadFull();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paintToggles); else paintToggles();
})();
