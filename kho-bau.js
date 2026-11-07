/* Trang Kho báu: song ngữ VI/EN (localStorage lm_lang). Dữ liệu: kho-bau-data.js (công cụ), community-data.js (nhóm), site-config.js (khoá học, donate) */
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // chỉ nhận https hoặc trang trong site (vd ai-convert.html)
  const okUrl = (u) => (/^(https:\/\/[^\s"'<>]+|[\w\-]+\.html(#[\w\-]*)?)$/i.test(String(u || "")) ? u : "");
  const external = (u) => /^https:/i.test(u);
  const shelves = window.TREASURE_SHELVES || [];
  const list = (window.TREASURES || []).filter((x) => x.id && x.name);

  const I18N = {
    vi: {
      title: "Kho báu | LANHMAR",
      nav_story: "Hành trình", nav_work: "Dự án", nav_services: "Dịch vụ", nav_community: "Cộng đồng", nav_treasure: "Kho báu", nav_contact: "Liên hệ", cta_talk: "Liên hệ mình",
      hero_k: "★ KHO BÁU · LANHMAR",
      hero_h: "Kho báu của mình<em>Học và làm cùng AI</em>",
      hero_p: "Những công cụ mình tự vibe-code và chia sẻ miễn phí, cùng kho tài nguyên mình dùng hằng ngày để học và làm việc.",
      hero_cta1: "Xem công cụ", hero_cta2: "Tài nguyên mình đang dùng", hero_cta3: "Khoá học mình giới thiệu", hero_donate: "Ủng hộ mình",
      ribbon: "★ KHO BÁU ★ CÔNG CỤ MIỄN PHÍ ★ VIBE CODE ★ DÀNH CHO NGƯỜI ĐI HỌC ★ CHẠY TRÊN MÁY BẠN ", stamp: "Nổi bật",
      pill2: "★ Chạy <b>trên máy bạn</b>", count: (n) => `★ <b>${n}</b> công cụ`, free: "★ <b>Miễn phí</b> để dùng",
      feat_k: "NỔI BẬT", feat_h: "Mới và nổi bật",
      lib_k: "THƯ VIỆN", lib_h: "Tất cả công cụ", tab_all: "Tất cả", tab_soon: "Sắp có", shelf_label: "Kệ",
      soon_h: "Kệ này đang được chuẩn bị", soon_p: "Mình sẽ thêm khi sẵn sàng. Tham gia cộng đồng để nhận tin khi có đồ mới.", soon_btn: "Xem cộng đồng →",
      st_open: "Đã mở", st_soon: "Sắp mở", nolink: "Sắp mở trên GitHub", open_btn: "Mở →",
      detail_btn: "Xem & cách cài →", detail_more: "Xem chi tiết →", d_open: "Mở công cụ →", copy_install: "Copy lệnh cài", copied: "Đã copy lệnh", copy_fail: "Không copy được, bấm giữ vào lệnh để chép tay",
      m_lic: "Giấy phép", m_cost: "Chi phí", free_w: "Miễn phí",
      d_points: "Điểm chính", d_how: "Cài và dùng", d_how_more: "Hướng dẫn đầy đủ, tuỳ chọn và giới hạn nằm trong README của repo.",
      demo_h: "Ví dụ kết quả", demo_note: "Nội dung mẫu tự soạn cho dễ hình dung, không phải khoá học hay tài liệu thật.", demo_slide: "Slide", demo_speech: "Lời giảng ở slide này",
      d_install: "Lệnh cài", d_run: "Lệnh chạy", d_repo: "Xem trên GitHub ↗", d_close: "Đóng",
      s1_h: "Cài một lần", s1_p: "Cần Python và ffmpeg, rồi cài thư viện theo file requirements trong repo.",
      s2_h: "Dán link Drive", s2_p: "Dán link Drive. Link công khai chạy ngay; file chia sẻ theo email thì đăng nhập Google một lần (chỉ đọc Drive). Hoặc đưa đường dẫn file trên máy.",
      s3_h: "Mở recap.html", s3_p: "Mỗi slide kèm lời giảng ở đúng slide đó. Dừng giữa chừng được, chạy lại là làm tiếp.",
      lic_h: "Dùng thế nào được?", yes_h: "Được dùng", no_h: "Không được dùng",
      yes1: "Học tập và nghiên cứu", yes2: "Dự án cá nhân, tự học", yes3: "Trường học, tổ chức nghiên cứu, tổ chức phi lợi nhuận", yes4: "Chỉnh sửa và chia sẻ lại, miễn là giữ nguyên giấy phép và ghi công",
      no1: "Kinh doanh, bán dịch vụ", no2: "Đưa vào sản phẩm hay khoá học thu phí",
      lic_note: "Giấy phép PolyForm Noncommercial 1.0.0. Đây là tóm tắt dễ hiểu, văn bản giấy phép trong repo mới là bản chuẩn. Cần dùng thương mại?",
      lic_ask: "Nhắn mình xin phép riêng →", lic_full: "Đọc văn bản giấy phép ↗",
      full_k: "★ TÀI NGUYÊN · ỦNG HỘ", full_h: "Xem toàn bộ tài nguyên mình dùng để học và làm việc",
      full_p: "Ngoài các công cụ miễn phí ở trên, mình lưu trong Data Storage những tài nguyên mình đã sử dụng, xây dựng và phát triển trong quá trình học và làm việc.",
      f1: "Xem được toàn bộ danh mục tài nguyên trong Storage",
      f2: "Là quyền xem để học hỏi và tham khảo cách mình làm",
      full_scope: "Đây là quyền xem tài nguyên, không phải quyền dùng bản tool đầy đủ.",
      full_p2: "Để mở quyền xem, mình rất mong nhận một khoản ủng hộ nhỏ (số tiền tuỳ tâm). Các công cụ miễn phí ở trên luôn dùng được, không cần ủng hộ.",
      hc_res_h: "Tài nguyên học và làm việc", hc_res_p: "Kho mình dùng hằng ngày. Xem toàn bộ khi ủng hộ mình.", hc_go: "Xem →",
      full_btn: "Đăng ký và nhận mã QR →", full_open: "Đã có quyền? Mở Storage ↗",
      comm_k: "CỘNG ĐỒNG", comm_h: "Cùng nhau đi làm với AI",
      comm_p: "Hỏi đáp về công cụ, báo lỗi, xin tính năng mới và xem mọi người đang dùng ra sao ở các nhóm bên dưới.",
      join: "Tham gia", comm_all: "Xem trang cộng đồng →",
      course_k: "★ KHOÁ HỌC MÌNH GIỚI THIỆU", course_h: "Biết dùng AI là một chuyện. Biết giao việc cho AI mới ra kết quả.",
      course_p: "Mình giới thiệu lớp “Teamwork với AI” của KesFlow, nơi mình cũng đang làm cộng tác viên cộng đồng. Bạn học cách chia việc cho một đội AI, có AI kiểm tra, rồi bạn duyệt.",
      course_scan: "Quét bằng camera điện thoại", course_btn: "Xem khoá học", course_ref: "Link giới thiệu",
      course_note: "Khi đăng ký khoá học qua trang này, bạn sẽ được cấp quyền truy cập Storage lưu trữ các tài nguyên mình đã sử dụng, xây dựng và phát triển.",
      course_storage: "Đăng ký truy cập Storage →",
      course_name: "Teamwork với AI · KesFlow",
      course_pts: ["6 buổi học online, 2 buổi mỗi tuần (tối thứ 3 và thứ 6)", "Không cần biết code, không cần kinh nghiệm dùng AI", "Có video, tài liệu và trợ giảng đồng hành"],
      foot: "© 2026 Dương Thị Lan Anh — LANHMAR"
    },
    en: {
      title: "Treasure | LANHMAR",
      nav_story: "Journey", nav_work: "Projects", nav_services: "Services", nav_community: "Community", nav_treasure: "Treasure", nav_contact: "Contact", cta_talk: "Get in touch",
      hero_k: "★ TREASURE · LANHMAR",
      hero_h: "My treasure chest<em>Learn and work with AI</em>",
      hero_p: "Tools I vibe-code and share for free, plus the resources I use every day to learn and work.",
      hero_cta1: "See the tools", hero_cta2: "Resources I use", hero_cta3: "A course I recommend", hero_donate: "Support me",
      ribbon: "★ TREASURE ★ FREE TOOLS ★ VIBE CODE ★ MADE FOR LEARNERS ★ RUNS ON YOUR COMPUTER ", stamp: "Featured",
      pill2: "★ Runs <b>on your computer</b>", count: (n) => `★ <b>${n}</b> ${n === 1 ? "tool" : "tools"}`, free: "★ <b>Free</b> to use",
      feat_k: "FEATURED", feat_h: "New and featured",
      lib_k: "LIBRARY", lib_h: "All tools", tab_all: "All", tab_soon: "Coming soon", shelf_label: "Shelf",
      soon_h: "This shelf is being prepared", soon_p: "I'll add things when they're ready. Join the community to hear when something new lands.", soon_btn: "See the community →",
      st_open: "Open", st_soon: "Coming soon", nolink: "Coming soon on GitHub", open_btn: "Open →",
      detail_btn: "Details & install →", detail_more: "See details →", d_open: "Open tool →", copy_install: "Copy install command", copied: "Command copied", copy_fail: "Couldn't copy, press and hold the command to copy by hand",
      m_lic: "License", m_cost: "Cost", free_w: "Free",
      d_points: "Highlights", d_how: "Install and use", d_how_more: "Full instructions, options and limits are in the repo README.",
      demo_h: "Example result", demo_note: "Sample content written for illustration, not a real course or document.", demo_slide: "Slide", demo_speech: "What was said on this slide",
      d_install: "Install command", d_run: "Run command", d_repo: "View on GitHub ↗", d_close: "Close",
      s1_h: "Install once", s1_p: "You need Python and ffmpeg, then install the libraries from the requirements file in the repo.",
      s2_h: "Paste a Drive link", s2_p: "Paste a Drive link. Public links work right away; files shared by email need a one-time Google sign-in (read-only Drive). Or give a path to a file on your computer.",
      s3_h: "Open recap.html", s3_p: "Each slide comes with what was said during it. Stop midway and rerun to continue.",
      lic_h: "What you can do", yes_h: "Allowed", no_h: "Not allowed",
      yes1: "Study and research", yes2: "Personal and self-study projects", yes3: "Schools, research bodies and non-profits", yes4: "Modify and share it, as long as you keep the license and credit",
      no1: "Business use, selling services", no2: "Building it into a paid product or course",
      lic_note: "PolyForm Noncommercial 1.0.0. This is a plain-language summary; the license text in the repo is authoritative. Need commercial use?",
      lic_ask: "Message me for separate permission →", lic_full: "Read the license text ↗",
      full_k: "★ RESOURCES · SUPPORT", full_h: "See every resource I use to learn and work",
      full_p: "Beyond the free tools above, I keep the resources I have used, built and developed while learning and working in Data Storage.",
      f1: "See the full catalogue of resources in Storage",
      f2: "View access, to learn from and reference how I work",
      full_scope: "This is view access to resources, not access to the full version of the tool.",
      full_p2: "To open view access I'd be very grateful for a small donation (any amount). The free tools above always work and never need a donation.",
      hc_res_h: "Learning & work resources", hc_res_p: "The collection I use every day. See all of it when you support me.", hc_go: "See →",
      full_btn: "Sign up and get your QR code →", full_open: "Already approved? Open Storage ↗",
      comm_k: "COMMUNITY", comm_h: "Using AI at work, together",
      comm_p: "Ask about the tools, report bugs, request features and see how others use them in the groups below.",
      join: "Join", comm_all: "See the community page →",
      course_k: "★ A COURSE I RECOMMEND", course_h: "Using AI is one thing. Knowing how to brief it is what gets results.",
      course_p: "I'm recommending KesFlow's “Teamwork with AI” class, where I also help run the community. You learn to split work across a team of AIs, have one check it, then you approve.",
      course_scan: "Scan with your phone camera", course_btn: "See the course", course_ref: "Referral link",
      course_note: "When you sign up for the course through this page, you get access to the Storage that holds the resources I have used, built and developed.",
      course_storage: "Request Storage access →",
      course_name: "Teamwork with AI · KesFlow",
      course_pts: ["6 online sessions, 2 a week (Tuesday and Friday evenings)", "No coding and no prior AI experience needed", "Videos, materials and teaching assistants stay with you"],
      foot: "© 2026 Dương Thị Lan Anh — LANHMAR"
    }
  };
  let lang = "vi", shelf = "all";
  try { lang = localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch {}
  const T = (k) => I18N[lang][k] ?? I18N.vi[k] ?? k;
  const L = (o, k) => (lang === "en" && o && o[k + "_en"] != null ? o[k + "_en"] : o ? o[k] : "");
  const byId = (id) => list.find((x) => x.id === id);

  // ---- thẻ ----
  const chips = (x) => `<div class="kb-top"><span class="kb-chip">${esc(L(x, "type"))}</span>${x.badge ? `<span class="kb-badge">${esc(L(x, "badge"))}</span>` : ""}</div>`;
  const actions = (x) => {
    const url = okUrl(x.url), soon = x.status !== "open" || !url;
    if (soon) return `<span class="kb-join" aria-disabled="true">${esc(T("nolink"))}</span>`;
    const main = x.detail
      ? `<button class="btn dark" type="button" data-detail="${esc(x.id)}">${esc(T(x.install ? "detail_btn" : "detail_more"))}</button>`
      : `<a class="btn dark" href="${esc(url)}"${external(url) ? ' target="_blank" rel="noopener"' : ""}>${esc(L(x, "cta") || T("open_btn"))}</a>`;
    const copy = x.install ? `<button class="btn" type="button" data-copy="${esc(x.id)}">${esc(T("copy_install"))}</button>` : "";
    const direct = x.detail && x.direct ? `<a class="btn" href="${esc(url)}"${external(url) ? ' target="_blank" rel="noopener"' : ""}>${esc(L(x, "cta") || T("d_open"))}</a>` : "";
    return main + direct + copy;
  };
  const thumb = (x) => (x.thumb && /^assets\/[\w\-./]+$/.test(x.thumb) ? `<img src="${esc(x.thumb)}" alt="" width="960" height="504" loading="lazy">` : `<span class="kb-blank" aria-hidden="true">★</span>`);
  const featCard = (x) => `<article class="kb-fcard reveal"><div class="kb-fimg">${thumb(x)}<span class="kb-stamp">★ ${esc(T("stamp"))}</span></div><div class="kb-fbody">${chips(x)}<h3>${esc(x.name)}</h3><p>${esc(L(x, "desc"))}</p><div class="kb-act">${actions(x)}</div></div></article>`;
  const card = (x) => `<article class="kb-card reveal" id="${esc(x.id)}"><div class="kb-cimg">${thumb(x)}</div><div class="kb-cbody">${chips(x)}<h3>${esc(x.name)}</h3><p>${esc(L(x, "desc"))}</p><div class="kb-act">${actions(x)}</div></div></article>`;

  // ---- hộp chi tiết dựng từ dữ liệu: khối callout / h / p / list / steps / table / code (giống thẻ Kho Ứng dụng) ----
  const blocks = (list_) => (list_ || []).map((b) => {
    const t = L(b, "t");
    if (b.k === "callout") return `<div class="kb-callout">${esc(t)}</div>`;
    if (b.k === "h") return `<h3>${esc(t)}</h3>`;
    if (b.k === "p") return `<p>${esc(t)}</p>`;
    if (b.k === "list") return `<ul class="kb-dpts">${(L(b, "items") || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
    if (b.k === "steps") return `<div class="kb-steps">${(L(b, "items") || []).map((i, n) => `<div class="kb-step"><b class="n">${n + 1}</b><h4>${esc(i.t)}</h4><p>${esc(i.d)}</p></div>`).join("")}</div>`;
    if (b.k === "table") return `<div class="kb-tbl"><table><thead><tr>${(L(b, "head") || []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${(L(b, "rows") || []).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if (b.k === "code") return `${L(b, "cap") ? `<p class="kb-lab">${esc(L(b, "cap"))}</p>` : ""}<pre class="kb-code" tabindex="0">${esc(b.t)}</pre>`;
    return "";
  }).join("");
  // ví dụ kết quả: dữ liệu mẫu (demo) hiện ngay dưới phần giới thiệu trong hộp chi tiết
  function demoHtml(x) {
    const d = x.demo; if (!d) return "";
    let body = "";
    if (d.kind === "recap") {
      body = `<div class="kb-rcp">${(d.slides || []).map((sl) => `<div class="kb-rc"><figure class="kb-slide"><img src="${esc(L(sl, "img"))}" alt="${esc(T("demo_slide"))} ${esc(sl.n)}: ${esc(L(sl, "title"))}" width="800" height="450" loading="lazy"><figcaption>${esc(T("demo_slide"))} ${esc(sl.n)}</figcaption></figure><div class="kb-rt"><span class="kb-time">${esc(sl.time)}</span><p>${esc(L(sl, "speech"))}</p></div></div>`).join("")}</div>`;
    } else if (d.kind === "convert") {
      body = `<div class="kb-ba"><div><p class="kb-lab">${esc(L(d.before, "label"))}</p><pre class="kb-code kb-before" tabindex="0">${esc(d.before.text)}</pre></div><span class="kb-arrow" aria-hidden="true">→</span><div><p class="kb-lab">${esc(L(d.after, "label"))}</p><pre class="kb-code" tabindex="0">${esc(d.after.text)}</pre></div></div>`;
    }
    return body ? `<div class="kb-demo"><h3>★ ${esc(T("demo_h"))}</h3>${body}<p class="kb-dnote">${esc(T("demo_note"))}</p></div>` : "";
  }
  function genericDetail(x) {
    const url = okUrl(x.url), meta = x.meta || [], links = (x.links || []).filter((l) => okUrl(l.u));
    return `<div class="kb-dtop">${chips(x)}<h2 id="kbDlgT">${esc(x.name)}</h2><p>${esc(L(x, "desc"))}</p></div>
      ${demoHtml(x)}
      ${meta.length ? `<dl class="kb-meta">${meta.map((m) => `<dt>${esc(L(m, "l"))}</dt><dd>${esc(L(m, "v"))}</dd>`).join("")}</dl>` : ""}
      ${L(x, "note") ? `<p class="kb-dnote">${esc(L(x, "note"))}</p>` : ""}
      ${blocks(x.sections)}
      <div class="kb-act kb-dact">${url ? `<a class="btn dark" href="${esc(url)}"${external(url) ? ' target="_blank" rel="noopener"' : ""}>${esc(L(x, "cta") || T("d_open"))}</a>` : ""}${links.map((l) => `<a class="btn" href="${esc(l.u)}"${external(l.u) ? ' target="_blank" rel="noopener"' : ""}>${esc(L(l, "t"))}</a>`).join("")}</div>`;
  }

  // ---- hộp chi tiết (Course Recap: mẫu riêng có hộp giấy phép) ----
  function detailHtml(x) {
    if (x.sections) return genericDetail(x);
    const url = okUrl(x.url), pts = L(x, "points") || [];
    const code = 'python recap.py "https://drive.google.com/file/d/<ID>/view" --title "Buổi 1"';
    return `<div class="kb-dtop">${chips(x)}<h2 id="kbDlgT">${esc(x.name)}</h2><p>${esc(L(x, "desc"))}</p></div>
      ${demoHtml(x)}
      ${pts.length ? `<h3>${esc(T("d_points"))}</h3><ul class="kb-dpts">${pts.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <dl class="kb-meta">${x.license ? `<dt>${esc(T("m_lic"))}</dt><dd>${esc(x.license)}</dd>` : ""}<dt>${esc(T("m_cost"))}</dt><dd>${esc(T("free_w"))}</dd></dl>
      ${L(x, "note") ? `<p class="kb-dnote">${esc(L(x, "note"))}</p>` : ""}
      <h3>${esc(T("d_how"))}</h3>
      <div class="kb-steps">${[1, 2, 3].map((n) => `<div class="kb-step"><b class="n">${n}</b><h4>${esc(T("s" + n + "_h"))}</h4><p>${esc(T("s" + n + "_p"))}</p></div>`).join("")}</div>
      ${x.install ? `<p class="kb-lab">${esc(T("d_install"))}</p><pre class="kb-code" tabindex="0">${esc(x.install.join("\n"))}</pre>` : ""}
      <p class="kb-lab">${esc(T("d_run"))}</p><pre class="kb-code" tabindex="0">${esc(code)}</pre>
      <p class="kb-dnote">${esc(T("d_how_more"))}</p>
      <h3>${esc(T("lic_h"))}</h3>
      <div class="kb-lic">
        <div class="kb-lbox yes"><h4><i aria-hidden="true">✓</i>${esc(T("yes_h"))}</h4><ul>${[1, 2, 3, 4].map((n) => `<li>${esc(T("yes" + n))}</li>`).join("")}</ul></div>
        <div class="kb-lbox no"><h4><i aria-hidden="true">✕</i>${esc(T("no_h"))}</h4><ul>${[1, 2].map((n) => `<li>${esc(T("no" + n))}</li>`).join("")}</ul></div>
      </div>
      <p class="kb-lnote">${esc(T("lic_note"))} <a href="index.html#contact">${esc(T("lic_ask"))}</a> · <a href="https://polyformproject.org/licenses/noncommercial/1.0.0" target="_blank" rel="noopener">${esc(T("lic_full"))}</a></p>
      <div class="kb-act kb-dact">${url ? `<a class="btn dark" href="${esc(url)}" target="_blank" rel="noopener">${esc(T("d_repo"))}</a>` : ""}${x.install ? `<button class="btn" type="button" data-copy="${esc(x.id)}">${esc(T("copy_install"))}</button>` : ""}</div>`;
  }
  function openDetail(id) {
    const x = byId(id), dlg = $("#kbDlg"); if (!x || !dlg) return;
    $("#kbDlgBody").innerHTML = detailHtml(x);
    $("#kbDlgX").setAttribute("aria-label", T("d_close"));
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }

  // ---- tab lọc ----
  const counts = () => { const c = { all: list.length }; shelves.forEach((s) => { c[s.id] = list.filter((x) => x.shelf === s.id).length; }); return c; };
  function renderTabs() {
    const c = counts(), all = [{ id: "all", name: T("tab_all") }].concat(shelves.map((s) => ({ id: s.id, name: L(s, "name"), soon: s.soon && !c[s.id] })));
    $("#kbTabs").innerHTML = all.map((s) => `<button class="kb-tab${s.id === shelf ? " on" : ""}${s.soon ? " soon" : ""}" type="button" role="tab" aria-selected="${s.id === shelf}" tabindex="${s.id === shelf ? 0 : -1}" data-shelf="${esc(s.id)}">${esc(s.name)}<small>${c[s.id] ?? 0}</small>${s.soon ? `<i>${esc(T("tab_soon"))}</i>` : ""}</button>`).join("");
  }
  function renderGrid() {
    const items = shelf === "all" ? list : list.filter((x) => x.shelf === shelf);
    $("#kbGrid").innerHTML = items.map(card).join("");
    $("#kbGrid").hidden = !items.length; $("#kbSoon").hidden = !!items.length;
  }

  // ---- cộng đồng, khoá học, ủng hộ ----
  function renderCommunity() {
    const gs = (window.COMMUNITIES || []).filter((g) => g.status !== "soon" && okUrl(g.url) && external(g.url)).slice(0, 3);
    $("#kbComm").innerHTML = gs.map((g) => `<a class="btn dark" href="${esc(g.url)}" target="_blank" rel="noopener">${esc(T("join"))} ${esc(g.platform || "")}: ${esc(L(g, "name"))} ↗</a>`).join("") + `<a class="btn" href="community.html">${esc(T("comm_all"))}</a>`;
  }
  // ---- khoá học giới thiệu (chuyển từ trang chủ sang đây): link affiliate, QR, điểm nổi bật, huy hiệu giảm giá,
  //      và tự lấy khoá mới nhất của KesFlow (TA06 → TA07…) qua Apps Script để link luôn đúng ----
  const courseUrl = (base, slug) => { try { const u = new URL(base); const ref = u.searchParams.get("a"); return "https://kesflow.vn/khoa-hoc/" + slug + (ref ? "?a=" + encodeURIComponent(ref) : ""); } catch { return base; } };
  function setCourseLink(url) {
    $("#kbCourseBtn").href = url;
    const box = $("#kbQr"); if (box.dataset.url === url) return;
    try { const qr = qrcode(0, "M"); qr.addData(url); qr.make(); box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); box.dataset.url = url; } catch { box.textContent = ""; }
  }
  async function loadCourseInfo(baseUrl) {
    const api = String(window.STORAGE_API || "").trim(); if (!api) return;
    let info = null;
    try { const c = JSON.parse(sessionStorage.getItem("lm-course")); if (c && Date.now() - c.t < 6 * 3600e3) info = c.v; } catch {}
    if (!info) {
      try {
        const r = await fetch(api, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "course" }) });
        const j = await r.json();
        if (j.ok && /^[a-z0-9-]+$/.test(j.slug || "")) { info = j; try { sessionStorage.setItem("lm-course", JSON.stringify({ t: Date.now(), v: j })); } catch {} }
      } catch {}
    }
    if (!info) return;
    courseInfo = info; applyCourseInfo(baseUrl);
  }
  let courseInfo = null;
  function applyCourseInfo(baseUrl) {
    const info = courseInfo, el = $("#kbCourseInfo"); if (!info) return;
    setCourseLink(courseUrl(baseUrl, info.slug));
    if (lang === "en") {
      // Trang KesFlow chỉ có tiếng Việt: bản tiếng Anh dựng lại tên khoá và ngày khai giảng, không dùng nguyên văn
      const no = (String(info.slug).match(/ta-?0*(\d+)$/i) || [])[1];
      $("#kbCourseName").textContent = "Teamwork with AI" + (no ? " (cohort " + String(no).padStart(2, "0") + ")" : "") + " · KesFlow";
      const d = String(info.description || "").match(/khai giảng[^0-9]*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/i);
      if (d) {
        const dt = new Date(Number(d[3] || new Date().getFullYear()), Number(d[2]) - 1, Number(d[1]));
        el.textContent = "📅 Next cohort starts " + dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + "."; el.hidden = false;
      } else el.hidden = true;
      return;
    }
    const nm = String(info.title || "").split("·")[0].trim();
    if (nm) $("#kbCourseName").textContent = nm + " · KesFlow";
    if (info.description) { el.textContent = "📅 " + info.description; el.hidden = false; } else el.hidden = true;
  }
  function renderCourse() {
    const cfg = window.AFFILIATE || {}, url = String(cfg.url || ""), sec = $("#course");
    const ok = /^https:\/\/[^\s"'<>]+$/i.test(url);
    sec.hidden = !ok; $("#kbHeroCourse").hidden = !ok;
    if (!ok) return;
    setCourseLink(url);
    $("#kbCourseName").textContent = T("course_name");
    $("#kbCourseInfo").hidden = true;
    $("#kbCoursePts").innerHTML = (T("course_pts") || []).map((x) => `<li>${esc(x)}</li>`).join("");
    const bd = $("#kbCourseBadge"); bd.hidden = !cfg.discount; bd.textContent = cfg.discount || "";
    if (courseInfo) applyCourseInfo(url); else loadCourseInfo(url);
  }

  // ba thẻ nổi ở hero: hai công cụ đầu (lấy từ dữ liệu) và thẻ giữa dẫn tới khối tài nguyên/ủng hộ
  function renderHeroCards() {
    const tools = list.slice(0, 2), glyph = ["▶", "⇄"];
    const tc = (x, i) => `<a class="kb-hc" href="#${esc(x.id)}"><span class="kb-hc-ic" aria-hidden="true">${glyph[i]}</span><h3>${esc(x.name)}</h3><p>${esc(L(x, "desc"))}</p><span class="kb-hc-go">${esc(T("hc_go"))}</span></a>`;
    const res = `<a class="kb-hc" href="#donate"><span class="kb-hc-ic" aria-hidden="true">★</span><h3>${esc(T("hc_res_h"))}</h3><p>${esc(T("hc_res_p"))}</p><span class="kb-hc-go">${esc(T("hc_go"))}</span></a>`;
    $("#kbHCards").innerHTML = [tools[0] && tc(tools[0], 0), res, tools[1] && tc(tools[1], 1)].filter(Boolean).join("");
  }
  // hiệu ứng chuyển động ở hero: đèn theo chuột và thẻ trượt theo cuộn (tắt khi người dùng chọn giảm chuyển động)
  function heroMotion() {
    const hero = $("#kbHero"); if (!hero || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hero.addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%"); hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%"); });
    let raf = 0;
    addEventListener("scroll", () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; hero.style.setProperty("--sy", Math.min(scrollY, 700)); }); }, { passive: true });
  }
  // ruy băng chạy: hai bản giống hệt nhau để vòng lặp liền mạch (CSS dịch -50%)
  function renderRibbon() {
    const unit = (T("ribbon") + " ").repeat(3).split("★").filter((t) => t.trim()).map((t) => `<span>★ ${esc(t.trim())}</span>`).join("");
    $("#kbRibbon").innerHTML = unit + unit;
  }
  function render() {
    document.documentElement.lang = lang;
    document.title = T("title");
    document.querySelectorAll("[data-i]").forEach((e) => { e.textContent = T(e.dataset.i); });
    document.querySelectorAll("[data-ih]").forEach((e) => { e.innerHTML = T(e.dataset.ih); }); // chuỗi cố định trong I18N, không lấy từ người dùng
    document.querySelectorAll(".lang button").forEach((b) => { const on = b.dataset.lang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    $("#kbFeat").innerHTML = list.filter((x) => x.featured).slice(0, 2).map(featCard).join("");
    $("#featured").hidden = !list.some((x) => x.featured);
    $("#kbTabs").setAttribute("aria-label", T("shelf_label"));
    renderTabs(); renderGrid(); renderCommunity(); renderCourse(); renderHeroCards(); renderRibbon();
    $("#kbDon").innerHTML = typeof window.donateHtml === "function" ? window.donateHtml({}) : "";
  }

  // ---- hiện dần khi cuộn ----
  let io = null;
  function reveal(instant) {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (instant || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((x) => x.classList.add("in")); return; }
    io = io || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.08 });
    els.forEach((x, i) => { x.style.setProperty("--d", (i % 4) * 80 + "ms"); io.observe(x); });
  }

  const toast = (m) => { const t = $("#kbToast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2400); };
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch { return false; }
  }

  render(); reveal(false); heroMotion();

  document.addEventListener("click", async (e) => {
    const lb = e.target.closest(".lang button");
    if (lb) { const next = lb.dataset.lang === "en" ? "en" : "vi"; if (next === lang) return; lang = next; try { localStorage.setItem("lm_lang", lang); } catch {} render(); reveal(true); return; }
    const tab = e.target.closest("[data-shelf]");
    if (tab) { shelf = tab.dataset.shelf; renderTabs(); renderGrid(); reveal(true); return; }
    const dt = e.target.closest("[data-detail]");
    if (dt) { openDetail(dt.dataset.detail); return; }
    const cp = e.target.closest("[data-copy]");
    if (cp) { const x = byId(cp.dataset.copy); if (x && x.install) toast((await copyText(x.install.join("\n"))) ? T("copied") : T("copy_fail")); return; }
    if (e.target.closest("#kbDlgX") || e.target === $("#kbDlg")) $("#kbDlg").close();
  });
  // bàn phím cho tab: mũi tên trái/phải
  $("#kbTabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = [...document.querySelectorAll("#kbTabs .kb-tab")], i = tabs.findIndex((t) => t.classList.contains("on"));
    const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; n.click(); $("#kbTabs .kb-tab.on").focus(); e.preventDefault();
  });

  // menu điện thoại
  const burger = $("#burger"), nav = $("#navlinks");
  const setMenu = (o) => { nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "✕" : "☰"; };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
})();
