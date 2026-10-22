const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safe = (u) => { const v = String(u ?? "").replace(/[\x00-\x1f]/g, "").trim(); return /^(https?:|mailto:|tel:)/i.test(v) || /^[\w./-]+$/.test(v) ? v : ""; };

const I18N = {
  vi: { nav_story: "Hành trình", nav_menu: "Năng lực", nav_work: "Dự án", nav_certs: "Chứng chỉ", nav_contact: "Liên hệ", cta_talk: "Liên hệ mình", cta_work: "Xem dự án",
    badge_open: "Sẵn sàng cho cơ hội mới", badge_school: "Tân cử nhân UFM 2026", h1a: "Mỗi chiến dịch bắt đầu từ một insight.", h1b: "Để “Ranh Ma” tìm ra.", onmenu: "ĐANG CHẠY",
    story_k: "HÀNH TRÌNH", story_h: "Mỗi vai trò là một chiến dịch.", menu_k: "NĂNG LỰC", menu_h: "Marketing toolkit của mình.", about: "Về mình", goal: "Mục tiêu", skills: "Kỹ năng", tools: "Phần mềm",
    after_h: "Ngoài giờ, AI Agent vẫn chạy chiến dịch.", after_p: "Ngoài chiến dịch, mình xây trợ lý AI và chatbot để việc lặp đi lặp lại tự chạy.", after_cta: "Xem AI Agent",
    work_k: "DỰ ÁN", work_h: "9 thư mục dự án mình đã thực hành.", work_p: "Mọi thứ bên dưới đều là việc thật. Bấm vào thư mục để xem đề bài, cách làm và sản phẩm.",
    certs_k: "HỌC & THỰC HÀNH", certs_h: "Chứng chỉ & khoá đào tạo.", contact_h: "Có bài toán marketing? Cùng mình lên chiến lược.", contact_p: "Cảm ơn đã ghé qua! Mình luôn sẵn sàng trò chuyện về cơ hội hợp tác hoặc công việc Digital Marketing.",
    edu: "Học vấn", phone: "Điện thoại / Zalo", reveal: "Bấm để hiện số", copy: "COPY", copied: "ĐÃ COPY", s1: "Khoá luận tốt nghiệp", s2: "Tăng lưu lượng truy cập", s3: "Mảng thực hành", s4: "Chứng chỉ & khoá học", plan: "Xem kế hoạch đầy đủ trên Canva" },
  en: { nav_story: "Journey", nav_menu: "Skills", nav_work: "Projects", nav_certs: "Certificates", nav_contact: "Contact", cta_talk: "Get in touch", cta_work: "See my work",
    badge_open: "Open to new opportunities", badge_school: "UFM graduate 2026", h1a: "Every campaign starts with an insight.", h1b: "Let “Ranh Ma” find it.", onmenu: "NOW RUNNING",
    story_k: "JOURNEY", story_h: "Every role was a campaign.", menu_k: "SKILLS", menu_h: "My marketing toolkit.", about: "About me", goal: "Goal", skills: "Skills", tools: "Software",
    after_h: "Off the clock, AI agents keep the campaigns running.", after_p: "Beyond campaigns, I build AI assistants and chatbots so repetitive work runs itself.", after_cta: "See AI Agent",
    work_k: "PROJECTS", work_h: "9 project folders I've worked on.", work_p: "Everything below is real work. Open a folder to see the brief, approach and output.",
    certs_k: "LEARNING & PRACTICE", certs_h: "Certificates & courses.", contact_h: "Got a marketing challenge? Let's plan the strategy.", contact_p: "Thanks for stopping by! Always happy to chat about collaboration or Digital Marketing opportunities.",
    edu: "Education", phone: "Phone / Zalo", reveal: "Click to show number", copy: "COPY", copied: "COPIED", s1: "Thesis score", s2: "Traffic growth", s3: "Practice areas", s4: "Certificates & courses", plan: "View the full plan on Canva" }
};

// Mạng xã hội hiển thị ở cột Follow và phần Liên hệ. Thêm tài khoản mới: điền url vào đây.
const SOCIALS = [
  { name: "Facebook", icon: "svg:facebook", key: "facebook_url" },
  { name: "TikTok", icon: "svg:tiktok", url: "https://www.tiktok.com/@hynone101" },
  { name: "Telegram", icon: "svg:telegram", url: "https://t.me/LANHMAR" },
  { name: "GitHub", icon: "svg:github", url: "https://github.com/thecoolestmarperindawurl" },
  { name: "Behance", icon: "svg:behance", url: "https://www.behance.net/lanhmarwurl" },
];
let D, lang = "vi";
try { lang = localStorage.getItem("lm_lang") || "vi"; } catch {}
const T = (k) => I18N[lang][k] ?? k;
const L = (o, k) => o[k + "_" + lang] || o[k + "_vi"] || o[k] || "";

fetch("assets/content.json").then((r) => r.json()).then((d) => { D = d; render(); }).catch(() => {
  document.body.insertAdjacentHTML("beforeend", "<p style='padding:20px'>Không tải được nội dung. Hãy mở trang qua máy chủ web thay vì mở thẳng file.</p>");
});

function renderStatic() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i]").forEach((e) => { e.textContent = T(e.dataset.i); });
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
}

function render() {
  renderStatic();
  const p = D.profile, edu = p.education;
  $("#heroLine").textContent = L(p, "heroLine");
  const soc = SOCIALS.map((s) => ({ ...s, url: s.url || safe(p[s.key]) })).filter((s) => s.url);
  soc.push({ name: "Email", icon: "✉", url: "mailto:" + p.email });
  const sa = (s) => `<a href="${esc(s.url)}" ${s.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""} aria-label="${esc(s.name)}" title="${esc(s.name)}">${s.icon.startsWith("svg:") ? `<i class="ic" style="--i:url(assets/icons/${s.icon.slice(4)}.svg)"></i>` : s.icon}</a>`;
  $("#followList").innerHTML = soc.map(sa).join("");
  $("#socialsRow").innerHTML = soc.map(sa).join("");
  $("#bio").textContent = L(p, "bio");
  $("#goal").textContent = L(p, "goal");
  $("#skills").innerHTML = p.skills.map((s) => `<span class="chip">${esc(s[lang] || s.vi)}</span>`).join("");
  $("#software").innerHTML = p.software.map((g) => `<div class="sw"><b>${esc(g["group_" + lang] || g.group_vi)}</b><div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join("")}</div></div>`).join("");
  $("#stats").innerHTML = [["9.0/10", T("s1")], ["+20%", T("s2")], [D.projects.length, T("s3")], [D.certificates.length, T("s4")]].map(([n, l]) => `<div class="stat"><b>${n}</b><span>${esc(l)}</span></div>`).join("");

  const chapters = [{ no: T("edu"), title: L(edu, "major"), org: L(edu, "school"), period: `${edu.years} · GPA ${edu.gpa}`, logo: "assets/img/mascot-work.jpg", tasks: [], ach: [L(edu, "thesis")] },
    ...D.experience.map((e) => ({ no: e["period_" + lang] || e.period, title: L(e, "title"), org: L(e, "org"), period: e["period_" + lang] || e.period, logo: e.logo, initials: e.initials, ctx: L(e, "context"), tasks: e["tasks_" + lang]?.length ? e["tasks_" + lang] : e.tasks_vi, ach: e["achievements_" + lang]?.length ? e["achievements_" + lang] : e.achievements_vi, img: e.workImage }))];
  $("#chapT").textContent = String(chapters.length).padStart(2, "0");
  $("#chapters").innerHTML = chapters.map((c, i) => `<article class="chapter" data-n="${i + 1}">
    <div class="no">${String(i + 1).padStart(2, "0")} / ${esc(c.no)}</div>
    <div class="head">${c.logo ? `<img src="${esc(safe(c.logo))}" alt="" onerror="this.remove()">` : c.initials ? `<span class="ini">${esc(c.initials)}</span>` : ""}<div><h3>${esc(c.title)}</h3><div class="org">${esc(c.org)}${c.period && c.period !== c.no ? " · " + esc(c.period) : ""}</div></div></div>
    ${c.ctx ? `<p>${esc(c.ctx)}</p>` : ""}
    ${c.tasks?.length ? `<ul>${c.tasks.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    ${(c.ach || []).map((a) => `<div class="ach">★ ${esc(a)}</div>`).join("")}
    ${c.img ? `<img class="work-img" loading="lazy" src="${esc(safe(c.img))}" alt="" onerror="this.remove()">` : ""}</article>`).join("");
  observeChapters(chapters.length);

  $("#projects").innerHTML = D.projects.map((pr, i) => `<button class="pcard" data-proj="${i}"><div class="ph${pr.image ? "" : " thumbs"}">${pr.image ? `<img loading="lazy" src="${esc(safe(pr.image))}" alt="">` : pr.videos.slice(0, 3).map((v) => `<img loading="lazy" src="${esc(safe(v.thumb))}" alt="">`).join("")}<span class="num">${String(i + 1).padStart(2, "0")}</span></div><div class="tx"><h3>${esc(L(pr, "title"))}</h3><p>${esc(L(pr, "desc"))}</p></div></button>`).join("");
  $("#certList").innerHTML = D.certificates.map((c, i) => `<button class="ccard" data-cert="${i}"><img loading="lazy" src="${esc(safe(c.images[0]))}" alt=""><div><b>${esc(L(c, "name"))}</b><small>${esc(c.org)}</small></div></button>`).join("");
  requestAnimationFrame(railBtns);
  // Email hiện sẵn + COPY; số điện thoại chỉ hiện khi bấm (không nằm trong HTML/JSON công khai).
  $("#contacts").innerHTML = `
    <li><span class="lbl">Email</span><a href="mailto:${esc(p.email)}">${esc(p.email)}</a><button class="btn" data-copy="${esc(p.email)}">${T("copy")}</button></li>
    <li><span class="lbl">${T("phone")}</span><button class="reveal" data-phone>${T("reveal")}</button></li>
    <li><span class="lbl">LinkedIn</span><a href="https://www.linkedin.com/in/lanhmar" target="_blank" rel="noopener">linkedin.com/in/lanhmar ↗</a></li>`;
}
const PH = "MDM4NCAwMTcgMTk1"; // chuỗi mã hoá nhẹ, chỉ giải mã khi người xem bấm
function revealPhone(btn) {
  const num = atob(PH);
  const li = btn.parentElement;
  li.innerHTML = `<span class="lbl">${T("phone")}</span><a href="tel:+84${num.replace(/\s/g, "").slice(1)}">${esc(num)}</a><button class="btn" data-copy="${esc(num)}">${T("copy")}</button>`;
}

let io;
function observeChapters(total) {
  io?.disconnect();
  io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const n = +e.target.dataset.n;
    $("#chapN").textContent = String(n).padStart(2, "0");
    $("#prog").style.width = (n / total) * 100 + "%";
  }), { rootMargin: "-40% 0px -50% 0px" });
  document.querySelectorAll(".chapter").forEach((c) => io.observe(c));
}

// rotating "today's menu"
const ROT = ["SEO", "PERFORMANCE", "DESIGN & EDIT", "AI AGENT", "E-COMMERCE"];
let ri = 0;
setInterval(() => { ri = (ri + 1) % ROT.length; $("#rotator").textContent = ROT[ri]; }, 2200);

// certificate rail: nút ‹ › + kéo chuột / vuốt tay
const rail = $("#certList");
const railBtns = () => {
  const max = rail.scrollWidth - rail.clientWidth - 2;
  document.querySelector(".rail-btn.p").disabled = rail.scrollLeft <= 2;
  document.querySelector(".rail-btn.n").disabled = rail.scrollLeft >= max;
};
rail.addEventListener("scroll", () => requestAnimationFrame(railBtns));
window.addEventListener("resize", railBtns);
let dragX = null, moved = false;
rail.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { dragX = e.clientX; moved = false; } });
window.addEventListener("pointermove", (e) => {
  if (dragX === null) return;
  const dx = e.clientX - dragX;
  if (Math.abs(dx) > 4) { moved = true; rail.classList.add("drag"); }
  if (moved) { rail.scrollLeft -= dx; dragX = e.clientX; }
});
window.addEventListener("pointerup", () => { dragX = null; setTimeout(() => rail.classList.remove("drag"), 0); });
rail.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

// dialog + carousel
const dlg = $("#dlg"), body = $("#dlgBody");
function carousel(slides) {
  return `<div class="car"><div class="track">${slides.map((s) => `<div class="slide"><img src="${esc(safe(s.src))}" alt="" onerror="this.style.opacity=.2">${s.url ? `<a class="vid" href="${esc(safe(s.url))}" target="_blank" rel="noopener" aria-label="video">▶</a>` : ""}</div>`).join("")}</div>
    ${slides.length > 1 ? `<button class="nb p" data-nav="-1" aria-label="prev">‹</button><button class="nb n" data-nav="1" aria-label="next">›</button>` : ""}</div>
    <div class="cnt" id="cnt"></div><div class="cap" id="cap"></div>`;
}
function wire(slides, caps, canva) {
  const tr = $(".track", body); if (!tr) return;
  const upd = () => {
    const i = tr.clientWidth ? Math.round(tr.scrollLeft / tr.clientWidth) : 0;
    $("#cnt").textContent = slides.length > 1 ? `${i + 1} / ${slides.length}` : "";
    const link = canva?.[i] ? ` <a href="${esc(safe(canva[i]))}" target="_blank" rel="noopener">${esc(T("plan"))} ↗</a>` : "";
    $("#cap").innerHTML = esc(caps[i] || "") + link;
  };
  tr.addEventListener("scroll", () => requestAnimationFrame(upd));
  body.onclick = (e) => { const n = e.target.closest("[data-nav]"); if (n) tr.scrollBy({ left: n.dataset.nav * tr.clientWidth, behavior: "smooth" }); };
  tr.setAttribute("tabindex", "0");
  tr.onkeydown = (e) => { if (e.key === "ArrowRight") tr.scrollBy({ left: tr.clientWidth, behavior: "smooth" }); if (e.key === "ArrowLeft") tr.scrollBy({ left: -tr.clientWidth, behavior: "smooth" }); };
  upd();
}
function briefHTML(t) {
  return `<div class="brief">${String(t || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const m = l.match(/^([^:]{2,20}):\s*(.*)$/);
    return `<p>${m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(l)}</p>`;
  }).join("")}</div>`;
}
function openProject(i) {
  const pr = D.projects[i];
  const slides = [...pr.images.map((src) => ({ src })), ...pr.videos.map((v) => ({ src: v.thumb || pr.images[0], url: v.url }))];
  body.innerHTML = `<div class="dbody"><p class="kicker">${String(i + 1).padStart(2, "0")} / ${esc(pr.key)}</p><h2>${esc(L(pr, "title"))}</h2>${carousel(slides)}${briefHTML(L(pr, "brief") || L(pr, "desc"))}</div>`;
  const caps = pr["slideCaptions_" + lang] || [];
  wire(slides, slides.map((_, k) => caps[k] || (k >= pr.images.length ? L(pr.videos[k - pr.images.length], "label") : "")), pr.canvaUrls);
  dlg.showModal();
}
function openCert(i) {
  const c = D.certificates[i];
  const slides = c.images.map((src) => ({ src }));
  body.innerHTML = `<div class="dbody"><p class="kicker">${esc(c.org)}</p><h2>${esc(L(c, "name"))}</h2>${carousel(slides)}</div>`;
  wire(slides, c["slideCaptions_" + lang] || [L(c, "project")], null);
  dlg.showModal();
}
$("#dlgX").onclick = () => dlg.close();
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

document.addEventListener("click", (e) => {
  const t = e.target.closest("button,a"); if (!t) return;
  if (t.dataset.lang) { lang = t.dataset.lang; try { localStorage.setItem("lm_lang", lang); } catch {} D && render(); }
  else if ("phone" in t.dataset) revealPhone(t);
  else if (t.dataset.rail) rail.scrollBy({ left: t.dataset.rail * rail.clientWidth * 0.8, behavior: "smooth" });
  else if (t.dataset.proj) openProject(+t.dataset.proj);
  else if (t.dataset.cert) openCert(+t.dataset.cert);
  else if (t.dataset.open && D) openProject(D.projects.findIndex((p) => p.key === t.dataset.open));
  else if (t.dataset.copy) { navigator.clipboard?.writeText(t.dataset.copy); t.textContent = T("copied"); setTimeout(() => (t.textContent = T("copy")), 1500); }
});

// mobile menu
const burger = $("#burger"), navLinks = $("#navlinks");
const setMenu = (open) => { navLinks.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); burger.textContent = open ? "✕" : "☰"; };
burger.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
document.addEventListener("click", (e) => { if (!e.target.closest(".pill-nav")) setMenu(false); });
renderStatic();
