/* Trang Kho báu: song ngữ VI/EN (localStorage lm_lang), dữ liệu ở kho-bau-data.js */
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || "")) ? u : "");
  const list = (window.TREASURES || []).filter((x) => x.id && x.name);

  const I18N = {
    vi: {
      title: "Kho báu | LANHMAR",
      nav_story: "Hành trình", nav_work: "Dự án", nav_services: "Dịch vụ", nav_community: "Cộng đồng", nav_treasure: "Kho báu", nav_contact: "Liên hệ", cta_talk: "Liên hệ mình",
      hero_k: "★ KHO BÁU · LANHMAR",
      hero_h: "Kho báu <em>của mình.</em>",
      hero_p: "Những công cụ mình tự vibe-code rồi chia sẻ miễn phí để hỗ trợ việc học. Dùng thoải mái cho học tập và nghiên cứu, không dùng để kiếm tiền.",
      hero_cta1: "Xem công cụ →", hero_cta2: "Bản mình đang dùng",
      pill1: "★ <b>Miễn phí</b> cho học tập", pill2: "★ Chạy <b>trên máy bạn</b>", count: (n) => `★ <b>${n}</b> công cụ`,
      tools_k: "CÔNG CỤ", tools_h: "Công cụ miễn phí",
      tools_p: "Mỗi công cụ có repo công khai trên GitHub, kèm hướng dẫn cài và dùng.",
      free: "Miễn phí", soon: "Sắp mở", open: "Đã mở", repo: "Xem trên GitHub ↗", nolink: "Sắp mở trên GitHub",
      m_lic: "Giấy phép", m_cost: "Chi phí", m_kind: "Loại",
      how_k: "DÙNG NHANH", how_h: "Ba bước để có recap",
      s1_h: "Cài một lần", s1_p: "Cần Python và ffmpeg, rồi cài thư viện theo file requirements trong repo.",
      s2_h: "Dán link Drive", s2_p: "Dán link Drive công khai (“Bất kỳ ai có link”). Drive chia sẻ theo email thì tải video về máy trước, rồi đưa đường dẫn file.",
      s3_h: "Mở recap.html", s3_p: "Mỗi slide kèm lời giảng ở đúng slide đó. Dừng giữa chừng được, chạy lại là làm tiếp.",
      how_more: "Hướng dẫn đầy đủ, tuỳ chọn và giới hạn nằm trong README của repo.",
      lic_k: "GIẤY PHÉP", lic_h: "Dùng thế nào được?",
      yes_h: "Được dùng", no_h: "Không được dùng",
      yes1: "Học tập và nghiên cứu", yes2: "Dự án cá nhân, tự học", yes3: "Trường học, tổ chức nghiên cứu, tổ chức phi lợi nhuận", yes4: "Chỉnh sửa và chia sẻ lại, miễn là giữ nguyên giấy phép và ghi công",
      no1: "Kinh doanh, bán dịch vụ", no2: "Đưa vào sản phẩm hay khoá học thu phí",
      lic_note: "Giấy phép PolyForm Noncommercial 1.0.0. Đây là tóm tắt dễ hiểu, văn bản giấy phép trong repo mới là bản chuẩn. Cần dùng thương mại?",
      lic_ask: "Nhắn mình xin phép riêng →", lic_full: "Đọc văn bản giấy phép ↗",
      full_k: "★ BẢN ĐẦY ĐỦ", full_h: "Muốn dùng bản mình đang dùng?",
      full_p: "Bản mình dùng cá nhân có thêm bước nối Claude API, giúp recap sát bài giảng hơn:",
      f1: "Làm sạch lời giảng theo ngữ cảnh, sửa thuật ngữ và tên riêng bằng cách đọc cả ảnh slide",
      f2: "Viết ghi chú theo chủ đề: phần, mục, hộp ghi nhớ, ảnh slide, phần tổng kết",
      f3: "Tự bỏ phần giới thiệu và nội quy, chỉ giữ kiến thức và bài tập thực hành",
      full_p2: "Bản này nằm trong Data Storage. Để mở truy cập, mình rất mong nhận một khoản ủng hộ nhỏ (số tiền tuỳ tâm). Bạn đăng ký, nhận mã QR chuyển khoản riêng, mình duyệt thủ công rồi bạn vào xem.",
      full_small: "Bản này cần API key Claude của riêng bạn và bạn tự chịu chi phí API.",
      full_btn: "Ủng hộ để mở Storage →",
      foot: "© 2026 Dương Thị Lan Anh — LANHMAR", back_home: "← Về trang chủ"
    },
    en: {
      title: "Treasure | LANHMAR",
      nav_story: "Journey", nav_work: "Projects", nav_services: "Services", nav_community: "Community", nav_treasure: "Treasure", nav_contact: "Contact", cta_talk: "Get in touch",
      hero_k: "★ TREASURE · LANHMAR",
      hero_h: "My <em>treasure chest.</em>",
      hero_p: "Tools I vibe-code and share for free to support learning. Use them freely for study and research, not to make money.",
      hero_cta1: "See the tools →", hero_cta2: "The version I use",
      pill1: "★ <b>Free</b> for learning", pill2: "★ Runs <b>on your computer</b>", count: (n) => `★ <b>${n}</b> ${n === 1 ? "tool" : "tools"}`,
      tools_k: "TOOLS", tools_h: "Free tools",
      tools_p: "Each tool has a public GitHub repo with install and usage instructions.",
      free: "Free", soon: "Coming soon", open: "Open", repo: "View on GitHub ↗", nolink: "Coming soon on GitHub",
      m_lic: "License", m_cost: "Cost", m_kind: "Type",
      how_k: "QUICK START", how_h: "Three steps to a recap",
      s1_h: "Install once", s1_p: "You need Python and ffmpeg, then install the libraries from the requirements file in the repo.",
      s2_h: "Paste a Drive link", s2_p: "Paste a public Drive link (“Anyone with the link”). If the Drive is shared only with specific emails, download the video first, then give the file path.",
      s3_h: "Open recap.html", s3_p: "Each slide comes with what was said during it. Stop midway and rerun to continue.",
      how_more: "Full instructions, options and limits are in the repo README.",
      lic_k: "LICENSE", lic_h: "What you can do",
      yes_h: "Allowed", no_h: "Not allowed",
      yes1: "Study and research", yes2: "Personal and self-study projects", yes3: "Schools, research bodies and non-profits", yes4: "Modify and share it, as long as you keep the license and credit",
      no1: "Business use, selling services", no2: "Building it into a paid product or course",
      lic_note: "PolyForm Noncommercial 1.0.0. This is a plain-language summary; the license text in the repo is authoritative. Need commercial use?",
      lic_ask: "Message me for separate permission →", lic_full: "Read the license text ↗",
      full_k: "★ FULL VERSION", full_h: "Want the version I use?",
      full_p: "The version I use personally adds a Claude API step that keeps the recap closer to the lecture:",
      f1: "Cleans up the speech in context, fixing terms and names by also reading the slide images",
      f2: "Writes topic-based notes: parts, sections, key-takeaway boxes, slide images and a wrap-up",
      f3: "Skips the intro and class rules automatically, keeping only knowledge and hands-on exercises",
      full_p2: "This version lives in Data Storage. To open access I'd be very grateful for a small donation (any amount). You sign up, get your own transfer QR code, I approve it manually, then you can get in.",
      full_small: "This version needs your own Claude API key, and you pay the API costs yourself.",
      full_btn: "Donate to open Storage →",
      foot: "© 2026 Dương Thị Lan Anh — LANHMAR", back_home: "← Back to home"
    }
  };
  let lang = "vi";
  try { lang = localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch {}
  const T = (k) => I18N[lang][k] ?? I18N.vi[k] ?? k;
  const L = (o, k) => (lang === "en" && o && o[k + "_en"] != null ? o[k + "_en"] : o ? o[k] : "");

  const card = (x) => {
    const url = okUrl(x.url), soon = x.status !== "open" || !url, pts = L(x, "points") || [], tags = x.tags || [];
    return `<article class="kb-card reveal" id="${esc(x.id)}">
      <div class="kb-top"><span class="kb-chip">${esc(T("free"))}</span><span class="kb-state ${soon ? "soon" : ""}"><i></i>${esc(soon ? T("soon") : T("open"))}</span></div>
      <h3>${esc(x.name)}</h3>
      <p>${esc(L(x, "desc"))}</p>
      ${pts.length ? `<ul class="kb-pts">${pts.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${tags.length ? `<ul class="kb-tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <dl class="kb-meta">${x.kind ? `<dt>${esc(T("m_kind"))}</dt><dd>${esc(x.kind)}</dd>` : ""}${x.license ? `<dt>${esc(T("m_lic"))}</dt><dd>${esc(x.license)}</dd>` : ""}<dt>${esc(T("m_cost"))}</dt><dd>${esc(T("free"))}</dd></dl>
      ${L(x, "note") ? `<p class="kb-note">${esc(L(x, "note"))}</p>` : ""}
      <div class="kb-act">${soon ? `<span class="kb-join" aria-disabled="true">${esc(T("nolink"))}</span>` : `<a class="kb-join" href="${esc(url)}" target="_blank" rel="noopener">${esc(T("repo"))}</a>`}</div>
    </article>`;
  };

  function render() {
    document.documentElement.lang = lang;
    document.title = T("title");
    document.querySelectorAll("[data-i]").forEach((e) => { e.textContent = T(e.dataset.i); });
    document.querySelectorAll("[data-ih]").forEach((e) => { e.innerHTML = T(e.dataset.ih); }); // chuỗi cố định trong I18N, không lấy từ người dùng
    document.querySelectorAll(".lang button").forEach((b) => { const on = b.dataset.lang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $("#kbGrid").innerHTML = list.map(card).join("");
    $("#kbCount").innerHTML = T("count")(list.length);
  }

  let io = null;
  function reveal(instant) {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (instant || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((x) => x.classList.add("in")); return; }
    io = io || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.08 });
    els.forEach((x, i) => { x.style.setProperty("--d", (i % 4) * 80 + "ms"); io.observe(x); });
  }

  render(); reveal(false);

  document.addEventListener("click", (e) => {
    const lb = e.target.closest(".lang button"); if (!lb) return;
    const next = lb.dataset.lang === "en" ? "en" : "vi"; if (next === lang) return;
    lang = next; try { localStorage.setItem("lm_lang", lang); } catch {}
    render(); reveal(true);
  });

  // menu điện thoại
  const burger = $("#burger"), nav = $("#navlinks");
  const setMenu = (o) => { nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "✕" : "☰"; };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
})();
