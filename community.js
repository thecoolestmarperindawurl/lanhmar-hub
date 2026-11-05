(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => (/^https:\/\/[^\s"'<>]+$/i.test(String(u || "")) ? u : "");
  const list = Array.isArray(window.COMMUNITIES) ? window.COMMUNITIES : [];

  /* ---------- song ngữ: dùng chung lựa chọn với trang chủ (localStorage "lm_lang") ---------- */
  const I18N = {
    vi: {
      title: "Cộng đồng | LANHMAR",
      nav_story: "Hành trình", nav_work: "Dự án", nav_services: "Dịch vụ", nav_community: "Cộng đồng", nav_contact: "Liên hệ", cta_talk: "Liên hệ mình",
      hero_k: "★ CỘNG ĐỒNG · LANHMAR", hero_h: "Cùng nhau <em>đi làm với AI.</em>",
      hero_p: "Nơi những người đi làm trao đổi cách dùng AI vào công việc thật: công cụ, quy trình, bài học và cả những lần làm chưa ra. Chọn một nhóm bên dưới để tham gia.",
      hero_cta1: "Xem các nhóm →", hero_cta2: "Đề xuất nhóm mới", pill1: "★ Chia sẻ <b>thực tế</b>", pill2: "★ Hỏi đáp <b>thân thiện</b>",
      count: (n) => `<b>${n}</b> nhóm đang mở`,
      groups_k: "NHÓM ĐANG MỞ", groups_h: "Chọn nhóm của bạn.",
      community: "Cộng đồng", open: "Đang mở", soon: "Sắp mở", platform: "Nền tảng", members: "Thành viên", updating: "Đang cập nhật",
      join: "Tham gia nhóm →", copy: "Sao chép link", nolink: "Link đang cập nhật",
      add_h: "Bạn muốn một nhóm mới?", add_p: "Gợi ý chủ đề nhóm bạn muốn tham gia, hoặc mời mình vào cộng đồng của bạn.", msg_me: "Nhắn cho mình →",
      spot_k: "NHÓM NỔI BẬT", spot_h: (n) => `Giới thiệu nhóm ${n}.`, moderator: "Moderator", topics: "Chủ đề", join_on: (p) => `Vào nhóm trên ${p} →`,
      kinds_h: "Ai đang ở trong nhóm", experts_h: "Chuyên gia đang hoạt động trong nhóm", mod_h: "Người điều hành",
      badge_expert: "Chuyên gia", badge_mod: "Moderator", portrait: "Chân dung", expertise: "Chuyên môn", profile: "Xem trang cá nhân",
      steps_k: "CÁCH THAM GIA", steps_h: "Ba bước để vào nhóm.",
      s1_h: "Chọn nhóm", s1_p: "Đọc mô tả và chủ đề của nhóm để biết nhóm có hợp với bạn không.",
      s2_h: "Bấm tham gia", s2_p: "Nút sẽ mở nhóm trên nền tảng của nhóm. Bạn có thể cần trả lời vài câu hỏi để được duyệt.",
      s3_h: "Giới thiệu và hỏi", s3_p: "Chào mọi người một câu, nói bạn đang làm gì và muốn dùng AI vào việc nào.",
      rules_k: "NỘI QUY CHUNG", rules_h: "Để nhóm luôn dễ chịu.",
      r1: "Tôn trọng nhau, góp ý vào việc chứ không vào người.", r2: "Không spam, không quảng cáo khi chưa được phép.",
      r3: "Không đăng thông tin cá nhân, khách hàng hay khoá API, mật khẩu.", r4: "Nêu rõ nguồn khi chia sẻ số liệu hoặc nội dung của người khác.",
      r5: "Hỏi rõ bối cảnh, nêu công cụ đang dùng để mọi người giúp đúng chỗ.",
      rules_note: "Mỗi nhóm có thêm nội quy riêng trên trang nhóm. Bạn đọc qua trước khi đăng bài nhé.",
      cta_h: "Chưa thấy nhóm bạn cần?", cta_p: "Nói với mình chủ đề bạn muốn trao đổi, mình sẽ cân nhắc mở thêm nhóm hoặc giới thiệu nơi phù hợp.",
      back_home: "← Về trang chủ", copied: "Đã sao chép link nhóm", copy_fail: "Không sao chép được, hãy bấm giữ vào link"
    },
    en: {
      title: "Community | LANHMAR",
      nav_story: "Journey", nav_work: "Projects", nav_services: "Services", nav_community: "Community", nav_contact: "Contact", cta_talk: "Get in touch",
      hero_k: "★ COMMUNITY · LANHMAR", hero_h: "Working with <em>AI, together.</em>",
      hero_p: "A place where working professionals swap how they use AI in real work: tools, workflows, lessons, and the attempts that didn't pan out. Pick a group below to join.",
      hero_cta1: "See the groups →", hero_cta2: "Suggest a new group", pill1: "★ Real-world <b>sharing</b>", pill2: "★ Friendly <b>Q&amp;A</b>",
      count: (n) => `<b>${n}</b> ${n === 1 ? "group" : "groups"} open`,
      groups_k: "OPEN GROUPS", groups_h: "Pick your group.",
      community: "Community", open: "Open", soon: "Coming soon", platform: "Platform", members: "Members", updating: "Coming soon",
      join: "Join the group →", copy: "Copy link", nolink: "Link coming soon",
      add_h: "Want a new group?", add_p: "Suggest a topic you'd like a group for, or invite me into your community.", msg_me: "Message me →",
      spot_k: "FEATURED GROUP", spot_h: (n) => `Meet the ${n} group.`, moderator: "Moderator", topics: "Topics", join_on: (p) => `Join on ${p} →`,
      kinds_h: "Who's in the group", experts_h: "Experts active in the group", mod_h: "Run by",
      badge_expert: "Expert", badge_mod: "Moderator", portrait: "Portrait of", expertise: "Expertise", profile: "View profile",
      steps_k: "HOW TO JOIN", steps_h: "Three steps to get in.",
      s1_h: "Pick a group", s1_p: "Read the group's description and topics to see if it's a good fit.",
      s2_h: "Hit join", s2_p: "The button opens the group on its platform. You may need to answer a few questions to be approved.",
      s3_h: "Say hi and ask", s3_p: "Greet everyone, say what you do and where you'd like to use AI.",
      rules_k: "GROUND RULES", rules_h: "Keeping the group a good place.",
      r1: "Be respectful: critique the work, not the person.", r2: "No spam, and no ads without permission.",
      r3: "Don't post personal or client information, API keys or passwords.", r4: "Credit your sources when sharing data or other people's content.",
      r5: "Give context and name the tools you use, so people can help in the right place.",
      rules_note: "Each group also has its own rules on its page. Please read them before posting.",
      cta_h: "Can't find the group you need?", cta_p: "Tell me the topic you'd like to discuss, and I'll consider opening a group or point you to the right place.",
      back_home: "← Back to home", copied: "Group link copied", copy_fail: "Couldn't copy, press and hold the link instead"
    }
  };
  let lang = "vi";
  try { lang = localStorage.getItem("lm_lang") === "en" ? "en" : "vi"; } catch {}
  const T = (k) => I18N[lang][k] ?? I18N.vi[k] ?? k;
  // trường dữ liệu theo ngôn ngữ: ưu tiên k_en khi xem tiếng Anh, thiếu thì dùng bản tiếng Việt
  const L = (o, k) => (lang === "en" && o && o[k + "_en"] != null ? o[k + "_en"] : o ? o[k] : "");

  const initials = (n) => String(n).split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();
  const okImg = (u) => (/^(assets\/[\w\-./]+|https:\/\/[^\s"'<>]+)$/i.test(String(u || "")) ? u : "");

  const card = (g) => {
    const url = okUrl(g.url), soon = g.status === "soon", topics = L(g, "topics") || [];
    return `<article class="cm-card reveal" id="${esc(g.id)}">
      <div class="cm-top"><span class="cm-plat">${esc(g.platform || T("community"))}</span><span class="cm-state ${soon ? "soon" : ""}"><i></i>${soon ? T("soon") : T("open")}</span></div>
      <h3>${esc(L(g, "name"))}</h3>
      <p>${esc(L(g, "desc"))}</p>
      ${topics.length ? `<ul class="cm-topics">${topics.slice(0, 5).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <dl class="cm-meta"><dt>${T("platform")}</dt><dd>${esc(g.platform || T("updating"))}</dd>${g.members ? `<dt>${T("members")}</dt><dd>${esc(L(g, "members"))}</dd>` : ""}</dl>
      <div class="cm-act">
        ${url ? `<a class="cm-join" href="${esc(url)}" target="_blank" rel="noopener">${T("join")}</a><button class="cm-copy" type="button" data-copy="${esc(url)}">${T("copy")}</button>`
              : `<span class="cm-join" aria-disabled="true">${T("nolink")}</span>`}
      </div></article>`;
  };

  // thẻ hồ sơ chuyên gia: KV (ảnh, nhãn, logo đơn vị) + thân (tên, vai trò, chỉ số, chuyên môn, điểm nổi bật, link)
  const proCard = (x, badge, wide) => {
    const photo = okImg(x.photo), logo = x.org && okImg(x.org.logo);
    const links = (x.links || []).filter((l) => okUrl(l.u) || /^[\w\-]+\.html(#[\w\-]*)?$/.test(l.u || ""));
    const stats = x.stats || [], tags = L(x, "tags") || [], points = L(x, "points") || [];
    return `<article class="cm-pro reveal${wide ? " wide" : ""}">
      <div class="cm-kv">
        <span class="cm-kv-mark" aria-hidden="true">${esc(x.alias || x.name)}</span>
        <div class="cm-kv-top"><span class="cm-badge">★ ${esc(badge)}</span>${x.org ? `<span class="cm-org${x.org.logoOnly ? " logo-only" : ""}">${logo ? `<img src="${esc(logo)}" alt="${x.org.logoOnly ? esc(x.alias || "") : ""}">` : ""}${esc(x.org.name || "")}</span>` : ""}</div>
        ${photo ? `<figure class="cm-photo"><img src="${esc(photo)}" alt="${T("portrait")} ${esc(L(x, "name"))}" width="480" height="600"></figure>`
                : `<div class="cm-av big" aria-hidden="true">${esc(initials(x.name))}</div>`}
      </div>
      <div class="cm-pro-b">
        <h3>${esc(L(x, "name"))}${x.alias ? ` <small>${esc(x.alias)}</small>` : ""}</h3>
        ${x.role ? `<p class="cm-role">${esc(L(x, "role"))}</p>` : ""}
        ${x.bio ? `<p class="cm-bio">${esc(L(x, "bio"))}</p>` : ""}
        ${stats.length ? `<dl class="cm-stats">${stats.slice(0, 3).map((s) => `<div><dt>${esc(s.n)}</dt><dd>${esc(L(s, "t"))}</dd></div>`).join("")}</dl>` : ""}
        ${tags.length ? `<ul class="cm-tags" aria-label="${T("expertise")}">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        ${points.length ? `<ul class="cm-pts">${points.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        ${links.length ? `<div class="cm-lk">${links.map((l) => /^https:/.test(l.u) ? `<a href="${esc(l.u)}" target="_blank" rel="noopener">${esc(L(l, "t"))} ↗</a>` : `<a href="${esc(l.u)}">${esc(L(l, "t"))} →</a>`).join("")}</div>` : ""}
      </div></article>`;
  };

  function renderStatic() {
    document.documentElement.lang = lang;
    document.title = T("title");
    document.querySelectorAll("[data-i]").forEach((e) => { e.textContent = T(e.dataset.i); });
    document.querySelectorAll("[data-ih]").forEach((e) => { e.innerHTML = T(e.dataset.ih); }); // chuỗi cố định trong I18N, không lấy từ người dùng
    document.querySelectorAll(".lang button").forEach((b) => { const on = b.dataset.lang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
  }

  function renderGroups() {
    const add = `<article class="cm-card add reveal"><div class="cm-plus">+</div><h3>${T("add_h")}</h3><p>${T("add_p")}</p><a class="btn dark" href="index.html#contact">${T("msg_me")}</a></article>`;
    $("#cmGrid").innerHTML = list.map(card).join("") + add;
    $("#cmCount").innerHTML = T("count")(list.filter((g) => g.status !== "soon").length);

    // phần giới thiệu chi tiết cho nhóm nổi bật
    const f = list.find((g) => g.feature);
    if (!f) return;
    // (mô tả, nền tảng, chủ đề, nút tham gia đã có trên thẻ nhóm ở trên nên không lặp lại ở đây)
    const ex = (f.experts || []).filter((x) => x.show !== false && x.name), mod = f.moderator, kinds = f.members_kinds || [];
    $("#spotBody").innerHTML = `
      <p class="kicker">${T("spot_k")}</p>
      <h2>${esc(T("spot_h")(L(f, "name")))}</h2>
      ${kinds.length ? `<h3 class="cm-sub">${T("kinds_h")}</h3><div class="cm-kinds">${kinds.map((k, i) => `<div class="cm-kind reveal"><b class="n">${i + 1}</b><h4>${esc(L(k, "t"))}</h4><p>${esc(L(k, "d"))}</p></div>`).join("")}</div>` : ""}
      ${ex.length ? `<h3 class="cm-sub">${T("experts_h")}</h3><div class="cm-exs">${ex.map((x) => proCard(x, T("badge_expert"))).join("")}</div>` : ""}
      ${mod ? `<h3 class="cm-sub">${T("mod_h")}</h3>${proCard({ ...mod, links: [{ t: I18N.vi.profile, t_en: I18N.en.profile, u: mod.u || "index.html" }] }, T("badge_mod"), true)}` : ""}`;
    $("#spot").hidden = false;
  }

  // hiện dần khi cuộn (lần đầu); khi đổi ngôn ngữ thì hiện ngay, không chạy lại hiệu ứng
  let io = null;
  function reveal(instant) {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (instant || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { els.forEach((x) => x.classList.add("in")); return; }
    io = io || new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.08 });
    els.forEach((x, i) => { x.style.setProperty("--d", (i % 4) * 80 + "ms"); io.observe(x); });
  }

  renderStatic(); renderGroups(); reveal(false);

  document.addEventListener("click", async (e) => {
    const lb = e.target.closest(".lang button");
    if (lb) {
      const next = lb.dataset.lang === "en" ? "en" : "vi"; if (next === lang) return;
      lang = next; try { localStorage.setItem("lm_lang", lang); } catch {}
      renderStatic(); renderGroups(); reveal(true);
      return;
    }
    // sao chép link
    const b = e.target.closest("[data-copy]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copy); toast(T("copied")); } catch { toast(T("copy_fail")); }
  });
  const toast = (m) => { const t = $("#cmToast"); t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2200); };

  // menu điện thoại
  const burger = $("#burger"), nav = $("#navlinks");
  const setMenu = (o) => { nav.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "✕" : "☰"; };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
})();
