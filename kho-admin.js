/* Quản trị Storage (kho.html, chỉ chủ kho): thống kê truy cập các kho + quản lý người xem Data Storage.
   Dữ liệu lấy từ Apps Script (action admin_data / admin_set), xác thực bằng ID token Google của chủ kho
   (biến cloud, tokenOk, L, esc, $, featured, items, KHO dùng chung với kho.js). Backend: storage-backend/Code.gs. */
(() => {
  "use strict";
  const box = $("#admin"), dlg = $("#admDlg");
  if (!box) return;
  let data = null, on = false, want = false, flt = "all", aq = "", busy = false, tab = "overview", sort = "status", page = 1, range = "30";
  const ST = {
    Pending: ["Chờ duyệt", "Pending"], Approved: ["Đã duyệt", "Approved"], Revoked: ["Đã thu quyền", "Revoked"], Rejected: ["Từ chối", "Rejected"]
  };
  const DON = { "Chưa nhận": "Not received", "Đã nhận": "Received", "Miễn (khoá KesFlow)": "Waived (KesFlow course)", "Miễn (khác)": "Waived (other)" };
  const st = (s) => (ST[s] ? L(ST[s][0], ST[s][1]) : s || "—");
  const don = (d) => (d ? L(d, DON[d] || d) : L("Chưa ghi", "Not recorded"));
  const money = (n) => (n ? n.toLocaleString("vi-VN") + "đ" : "");
  const day = (iso) => { const t = Date.parse(iso); return t ? new Date(t).toLocaleDateString(L("vi-VN", "en-GB"), { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"; };
  function ago(iso) {
    const t = Date.parse(iso); if (!t) return L("Chưa vào", "Never");
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 60) return L(`${Math.max(1, m)} phút trước`, `${Math.max(1, m)} min ago`);
    if (m < 1440) return L(`${Math.round(m / 60)} giờ trước`, `${Math.round(m / 60)} h ago`);
    if (m < 43200) return L(`${Math.round(m / 1440)} ngày trước`, `${Math.round(m / 1440)} days ago`);
    return day(iso);
  }
  const ymd = (d) => new Date(d.getTime() + 7 * 36e5).toISOString().slice(0, 10); // ngày theo giờ Việt Nam, khớp backend
  const titleOf = (id) => { const it = (featured || []).concat(items || []).find((i) => i.id === id); return it ? it.title : id; };
  const khoName = (id) => { const k = KHO.find((x) => x.id === id); return k ? `${k.icon || ""} ${k.name}` : id; };

  async function api(action, extra) {
    return LMBackend.call(action, { idToken: cloud.token, ...extra }); // backend.js: Supabase hoặc Apps Script
  }
  function msg(html) { box.innerHTML = `<div class="adm-msg">${html}</div>`; }
  // plain = true: chữ thường cho alert(), không có thẻ HTML
  function errText(e, plain) {
    const b = (t) => (plain ? t : `<b>${t}</b>`);
    if (e === "bad_action") return LMBackend.on()
      ? L(`Supabase chưa có các hàm quản trị. Chạy ${b("storage-backend/supabase.sql")} trong SQL Editor (SUPABASE.md bước 2).`, `Supabase doesn't have the admin functions yet. Run ${b("storage-backend/supabase.sql")} in the SQL Editor (SUPABASE.md step 2).`)
      : L(`Máy chủ chưa có tính năng quản trị. Dán ${b("storage-backend/Code.gs")} mới vào Apps Script rồi ${b("Deploy → New version")} (HUONG-DAN.md mục 12).`, `The server doesn't have the admin feature yet. Paste the new ${b("storage-backend/Code.gs")} into Apps Script, then ${b("Deploy → New version")} (HUONG-DAN.md section 12).`);
    if (e === "denied") return L("Phiên Google hết hạn hoặc không phải mail chủ kho. Bấm “Đăng nhập Google” rồi thử lại.", "Your Google session expired or this isn't the owner email. Sign in with Google and try again.");
    const why = e || L("lỗi mạng", "network error");
    return L("Không tải được dữ liệu (", "Couldn't load data (") + (plain ? why : esc(why)) + ").";
  }

  async function load() {
    if (!LMBackend.ready()) { msg(L("Chưa cấu hình Data Storage (storage-config.js).", "Data Storage isn't configured (storage-config.js).")); return; }
    if (!tokenOk() || (LMBackend.on() && !LMBackend.ownerOk())) { want = true; msg(L("Đăng nhập Google bằng mail chủ kho để xem quản trị.", "Sign in with Google using the owner email to see the admin view.") + ` <button class="btn primary" type="button" data-adm="signin">${L("Đăng nhập Google", "Sign in with Google")}</button>`); $("#gDlg").showModal(); return; }
    want = false; if (!data) msg(L("Đang tải số liệu…", "Loading figures…"));
    try {
      const res = await api("admin_data");
      if (!res.ok) { if (!data) msg(errText(res.error)); else alert(errText(res.error, true)); return; }
      data = res; render();
    } catch { if (!data) msg(errText()); }
  }

  function bars(list, cls) { // list: [{label, n, sub?}]
    const max = Math.max(1, ...list.map((x) => x.n));
    return list.length ? `<ul class="adm-bars ${cls || ""}${list.some((x) => x.t) ? " money" : ""}">${list.map((x) => `<li><span class="adm-bl">${esc(x.label)}</span><span class="adm-bt"><i style="width:${(x.n / max * 100).toFixed(1)}%"></i></span><b>${x.t || x.n}</b></li>`).join("")}</ul>`
      : `<p class="adm-empty">${L("Chưa có dữ liệu. Số liệu bắt đầu ghi từ khi cập nhật backend.", "No data yet. Tracking starts once the backend is updated.")}</p>`;
  }
  function chart30() {
    const out = [], now = new Date();
    for (let i = 29; i >= 0; i--) { const d = new Date(now.getTime() - i * 864e5), k = ymd(d), v = data.days[k] || {}; out.push({ k, n: (v.login || 0), u: v.users || 0 }); }
    const max = Math.max(1, ...out.map((x) => x.n)), W = 600, H = 150, bw = W / out.length;
    const rects = out.map((x, i) => { const h = x.n / max * (H - 18); return `<rect x="${(i * bw + 2).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${Math.max(h, x.n ? 2 : 0).toFixed(1)}" rx="3"><title>${x.k}: ${L(`${x.n} lượt vào, ${x.u} người`, `${x.n} visits, ${x.u} people`)}</title></rect>`; }).join("");
    const total = out.reduce((a, x) => a + x.n, 0);
    return `<svg class="adm-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(L(`Lượt vào 30 ngày: tổng ${total}`, `Visits in 30 days: ${total} total`))}"><line x1="0" y1="${H - 0.5}" x2="${W}" y2="${H - 0.5}"/>${rects}</svg>
      <div class="adm-axis"><span>${day(out[0].k)}</span><span>${L("Hôm nay", "Today")}</span></div>`;
  }

  const PER = 25;
  const kpi = (n, t, cls) => `<div class="adm-kpi ${cls || ""}"><b>${n}</b><span>${t}</span></div>`;
  const tabBtn = (k, t, n) => `<button type="button" role="tab" aria-selected="${tab === k}" class="adm-tabb ${tab === k ? "on" : ""}" data-adm-tab="${k}">${t}${n ? ` <small>${n}</small>` : ""}</button>`;
  const actBtns = (p) => {
    const b = (k, t, c) => `<button class="btn ${c || ""}" type="button" data-adm="${k}" data-em="${esc(p.email)}">${t}</button>`;
    if (p.status === "Pending") return b("approve", L("Duyệt", "Approve"), "primary") + b("reject", L("Từ chối", "Reject"));
    if (p.status === "Approved") return b("donate", L("Donate", "Donation")) + b("revoke", L("Thu quyền", "Revoke"), "warn");
    return b("approve", L("Duyệt lại", "Re-approve"));
  };

  function overview(P, U) {
    const now = Date.now(), cnt = (s) => P.filter((p) => p.status === s).length;
    const visits7 = Object.keys(data.days).filter((k) => now - Date.parse(k) < 7 * 864e5).reduce((a, k) => a + (data.days[k].login || 0), 0);
    const active7 = Object.values(U).filter((u) => now - Date.parse(u.last) < 7 * 864e5).length;
    const paid = P.reduce((a, p) => a + (p.donate === "Đã nhận" ? p.amount : 0), 0);
    const ready = P.filter((p) => p.status === "Pending" && /^(Đã nhận|Miễn)/.test(p.donate)).length;
    const khoList = Object.keys(data.kho).map((id) => ({ label: khoName(id), n: data.kho[id] })).sort((a, b) => b.n - a.n);
    const itemList = Object.keys(data.items).map((id) => ({ label: titleOf(id), n: data.items[id] })).sort((a, b) => b.n - a.n).slice(0, 10);
    const waiting = P.filter((p) => p.status === "Pending").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 5);
    return `
      <div class="adm-kpis">
        ${kpi(P.length, L("Người đăng ký", "Sign-ups"))}
        ${kpi(cnt("Pending"), L("Chờ duyệt", "Pending") + (ready ? ` · <em>${ready} ${L("sẵn sàng", "ready")}</em>` : ""), cnt("Pending") ? "warn" : "")}
        ${kpi(cnt("Approved"), L("Đang có quyền", "With access"), "ok")}
        ${kpi(visits7, L("Lượt vào 7 ngày", "Visits, 7 days"))}
        ${kpi(active7, L("Người hoạt động 7 ngày", "Active people, 7 days"))}
        ${kpi(money(paid) || "0đ", L("Donate đã nhận", "Donations received"), "orange")}
      </div>
      ${waiting.length ? `<section class="adm-card adm-wait"><h3>${L("Đang chờ duyệt", "Waiting for approval")}</h3>${waiting.map((p) => `<div class="adm-wrow"><button type="button" class="adm-name" data-adm="user" data-em="${esc(p.email)}"><b>${esc(p.name)}</b><small>${esc(p.email)} · ${esc(don(p.donate))}${p.amount ? " · " + money(p.amount) : ""}</small></button><span class="adm-act">${actBtns(p)}</span></div>`).join("")}</section>` : ""}
      <div class="adm-two">
        <section class="adm-card"><h3>${L("Lượt vào Data Storage, 30 ngày", "Data Storage visits, 30 days")}</h3>${chart30()}</section>
        <section class="adm-card"><h3>${L("Kho được xem nhiều nhất", "Most visited libraries")}</h3>${bars(khoList)}</section>
      </div>
      <section class="adm-card"><h3>${L("Thẻ được mở nhiều nhất", "Most opened cards")}</h3>${bars(itemList, "items")}</section>`;
  }

  function peopleTab(P, U) {
    const order = { Pending: 0, Approved: 1, Revoked: 2, Rejected: 3 }, cnt = (s) => P.filter((p) => p.status === s).length;
    const last = (p) => Date.parse((U[p.email] || {}).last) || 0;
    const SORTS = {
      status: (a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || String(b.at).localeCompare(String(a.at)),
      new: (a, b) => String(b.at).localeCompare(String(a.at)),
      active: (a, b) => last(b) - last(a),
      visits: (a, b) => ((U[b.email] || {}).logins || 0) - ((U[a.email] || {}).logins || 0),
      donate: (a, b) => (b.amount || 0) - (a.amount || 0)
    };
    const needle = aq.trim().toLowerCase();
    const rows = P.filter((p) => flt === "all" || p.status === flt)
      .filter((p) => !needle || [p.name, p.email, p.note, p.code, p.memo].join(" ").toLowerCase().includes(needle))
      .sort(SORTS[sort] || SORTS.status);
    const pages = Math.max(1, Math.ceil(rows.length / PER)); if (page > pages) page = pages;
    const shown = rows.slice((page - 1) * PER, page * PER);
    const chip = (k, t, n) => `<button type="button" class="chip ${flt === k ? "on" : ""}" data-adm-f="${k}">${t} <small>${n}</small></button>`;
    const opt = (k, t) => `<option value="${k}" ${sort === k ? "selected" : ""}>${t}</option>`;
    return `
      <section class="adm-card">
        <div class="adm-ptop">
          <input type="search" id="admQ" value="${esc(aq)}" placeholder="${esc(L("Tìm tên, email, mã, ghi chú…", "Search name, email, code, notes…"))}" aria-label="${esc(L("Tìm người xem", "Search viewers"))}">
          <label class="adm-sort">${L("Sắp xếp", "Sort")} <select id="admSort">${opt("status", L("Chờ duyệt trước", "Pending first"))}${opt("new", L("Mới đăng ký", "Newest sign-ups"))}${opt("active", L("Hoạt động gần nhất", "Recently active"))}${opt("visits", L("Vào nhiều nhất", "Most visits"))}${opt("donate", L("Donate cao nhất", "Largest donation"))}</select></label>
        </div>
        <div class="adm-filters">${chip("all", L("Tất cả", "All"), P.length)}${chip("Pending", st("Pending"), cnt("Pending"))}${chip("Approved", st("Approved"), cnt("Approved"))}${chip("Revoked", st("Revoked"), cnt("Revoked"))}${chip("Rejected", st("Rejected"), cnt("Rejected"))}</div>
        <div class="adm-tbl" role="table">
          <div class="adm-tr adm-th" role="row"><span role="columnheader">${L("Người xem", "Viewer")}</span><span role="columnheader">${L("Trạng thái", "Status")}</span><span role="columnheader">Donate</span><span role="columnheader">${L("Hoạt động", "Activity")}</span><span role="columnheader"></span></div>
          ${shown.map((p) => { const u = U[p.email] || {}; return `
          <div class="adm-tr" role="row">
            <span role="cell"><button type="button" class="adm-name" data-adm="user" data-em="${esc(p.email)}"><b>${esc(p.name)}</b></button><small>${esc(p.email)} · ${L("ĐK", "Joined")} ${day(p.at)} · <code>${esc(p.code)}</code></small>${p.note ? `<small class="adm-note">“${esc(p.note)}”</small>` : ""}${p.memo ? `<small class="adm-memo">✎ ${esc(p.memo)}</small>` : ""}</span>
            <span role="cell"><em class="adm-st s-${esc(p.status)}">${st(p.status)}</em></span>
            <span role="cell">${esc(don(p.donate))}${p.amount ? `<small>${money(p.amount)}</small>` : ""}</span>
            <span role="cell">${ago(u.last)}<small>${L(`${u.logins || 0} lượt vào · ${u.events || 0} lượt xem`, `${u.logins || 0} visits · ${u.events || 0} views`)}</small></span>
            <span role="cell" class="adm-act">${actBtns(p)}</span>
          </div>`; }).join("") || `<p class="adm-empty">${L("Không có ai khớp bộ lọc.", "Nobody matches this filter.")}</p>`}
        </div>
        ${rows.length > PER ? `<div class="adm-pager"><span>${L(`Đang xem ${(page - 1) * PER + 1}–${Math.min(page * PER, rows.length)} / ${rows.length}`, `Showing ${(page - 1) * PER + 1}–${Math.min(page * PER, rows.length)} of ${rows.length}`)}</span><button class="btn" type="button" data-adm-p="${page - 1}" ${page < 2 ? "disabled" : ""}>${L("Trước", "Prev")}</button><b>${page} / ${pages}</b><button class="btn" type="button" data-adm-p="${page + 1}" ${page >= pages ? "disabled" : ""}>${L("Sau", "Next")}</button></div>` : ""}
      </section>`;
  }

  function donateTab(P) {
    const since = range === "all" ? 0 : Date.now() - Number(range) * 864e5, when = (p) => p.paidAt || p.approvedAt || p.at;
    const list = P.filter((p) => p.donate === "Đã nhận" && (Date.parse(when(p)) || 0) >= since).sort((a, b) => String(when(b)).localeCompare(String(when(a))));
    const total = list.reduce((a, p) => a + (p.amount || 0), 0), waived = P.filter((p) => /^Miễn/.test(p.donate)).length;
    const unpaid = P.filter((p) => p.status === "Approved" && (!p.donate || p.donate === "Chưa nhận")).length;
    const months = {}; P.filter((p) => p.donate === "Đã nhận").forEach((p) => { const m = String(when(p)).slice(0, 7); months[m] = (months[m] || 0) + (p.amount || 0); });
    const ml = Object.keys(months).sort().slice(-6).map((m) => ({ label: m.slice(5) + "/" + m.slice(0, 4), n: months[m], t: money(months[m]) }));
    const rc = (k, t) => `<button type="button" class="chip ${range === k ? "on" : ""}" data-adm-r="${k}">${t}</button>`;
    return `
      <div class="adm-kpis">
        ${kpi(money(total) || "0đ", L("Tổng trong khoảng đã chọn", "Total in selected range"), "orange")}
        ${kpi(list.length, L("Lượt donate", "Donations"))}
        ${kpi(waived, L("Được miễn", "Waived"))}
        ${kpi(unpaid, L("Đã duyệt nhưng chưa ghi donate", "Approved without donation record"), unpaid ? "warn" : "")}
      </div>
      <div class="adm-two">
        <section class="adm-card">
          <div class="adm-filters">${rc("7", L("7 ngày", "7 days"))}${rc("30", L("30 ngày", "30 days"))}${rc("90", L("90 ngày", "90 days"))}${rc("all", L("Tất cả", "All time"))}</div>
          <div class="adm-tbl" role="table">
            ${list.map((p) => `<div class="adm-tr adm-dr" role="row"><span role="cell">${day(when(p))}</span><span role="cell"><button type="button" class="adm-name" data-adm="user" data-em="${esc(p.email)}"><b>${esc(p.name)}</b></button><small>LM ${esc(p.code)}</small></span><span role="cell"><b>${money(p.amount) || "—"}</b></span><span role="cell"><small class="adm-note">${esc(p.note)}</small></span></div>`).join("") || `<p class="adm-empty">${L("Chưa có donate nào trong khoảng này.", "No donations in this range.")}</p>`}
          </div>
        </section>
        <section class="adm-card"><h3>${L("Donate theo tháng", "Donations by month")}</h3>${bars(ml, "items")}</section>
      </div>`;
  }

  function render() {
    if (!data) return;
    const P = data.people, U = data.users || {}, pend = P.filter((p) => p.status === "Pending").length;
    box.innerHTML = `
      <div class="adm-head">
        <div class="kicker">★ ${L("Chủ kho", "Owner")}</div>
        <h1>${L("Quản trị <em>Storage</em>", "Storage <em>admin</em>")}</h1>
        <p class="desc">${L("Ai đang xem Data Storage, kho nào được ghé nhiều, duyệt người xem và theo dõi donate ngay tại đây. Số liệu tính từ nhật ký 90 ngày gần nhất.", "Who is using Data Storage, which libraries get the most visits, approve viewers and track donations right here. Figures come from the last 90 days of logs.")}</p>
        <div class="adm-acts">
          <button class="btn" type="button" data-adm="refresh">↻ ${L("Làm mới", "Refresh")}</button>
          <button class="btn" type="button" data-adm="csv">${L("Xuất CSV người xem", "Export viewers CSV")}</button>
          ${data.sheet ? `<a class="btn" href="${esc(data.sheet)}" target="_blank" rel="noopener">${L("Mở Google Sheet ↗", "Open Google Sheet ↗")}</a>` : LMBackend.dashboard() ? `<a class="btn" href="${esc(LMBackend.dashboard())}" target="_blank" rel="noopener">${L("Mở Supabase ↗", "Open Supabase ↗")}</a>` : ""}
          <span class="adm-upd">${L("Cập nhật lúc", "Updated at")} ${new Date(data.now).toLocaleTimeString(L("vi-VN", "en-GB"), { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div class="adm-tabs" role="tablist">${tabBtn("overview", L("Tổng quan", "Overview"))}${tabBtn("people", L("Người xem", "Viewers"), pend ? `${pend} ${L("chờ", "pending")}` : String(P.length))}${tabBtn("donate", "Donate")}</div>
      </div>
      ${tab === "people" ? peopleTab(P, U) : tab === "donate" ? donateTab(P) : overview(P, U)}`;
  }

  // Chi tiết một người xem: thông tin, donate, ghi chú riêng, lịch sử hoạt động (admin_user)
  async function userDlg(p) {
    const d = $("#admUser"), u = (data.users || {})[p.email] || {};
    const evText = (e) => e.ev === "login" ? L("Vào Data Storage", "Entered Data Storage") : e.ev === "kho" ? L("Mở ", "Opened ") + khoName(e.kho) : L("Xem thẻ “", "Viewed card “") + titleOf(e.item) + "”";
    const paint = (evs) => {
      d.innerHTML = `<form method="dialog" class="adm-user">
        <h2>${esc(p.name)} <em class="adm-st s-${esc(p.status)}">${st(p.status)}</em></h2>
        <p class="adm-who">${esc(p.email)} · <code>LM ${esc(p.code)}</code><br>${L("Đăng ký", "Signed up")} ${day(p.at)}${p.approvedAt ? ` · ${L("Duyệt", "Approved")} ${day(p.approvedAt)}` : ""} · Donate: ${esc(don(p.donate))}${p.amount ? " " + money(p.amount) : ""}</p>
        ${p.note ? `<p class="adm-note">“${esc(p.note)}”</p>` : ""}
        <label>${L("Ghi chú của mình (chỉ chủ kho thấy)", "My notes (only the owner sees these)")}</label><textarea name="memo" rows="2" maxlength="300">${esc(p.memo || "")}</textarea>
        <h3>${L("Hoạt động gần đây", "Recent activity")} <small>${L(`${u.logins || 0} lượt vào · ${u.events || 0} lượt xem trong 90 ngày`, `${u.logins || 0} visits · ${u.events || 0} views in 90 days`)}</small></h3>
        <ol class="adm-tl">${evs == null ? `<li>${L("Đang tải…", "Loading…")}</li>` : evs.length ? evs.map((e) => `<li><time>${new Date(e.at).toLocaleString(L("vi-VN", "en-GB"), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time>${esc(evText(e))}</li>`).join("") : `<li>${L("Chưa có hoạt động nào được ghi.", "No activity recorded yet.")}</li>`}</ol>
        <div class="row"><span class="adm-act">${actBtns(p)}</span><button type="button" class="btn" data-x>${L("Đóng", "Close")}</button><button type="submit" class="btn primary">${L("Lưu ghi chú", "Save notes")}</button></div>
      </form>`;
      const f = d.querySelector("form");
      f.querySelector("[data-x]").onclick = () => d.close();
      f.onsubmit = (e) => { e.preventDefault(); d.close(); set(p.email, { memo: f.memo.value }); };
    };
    paint(null); if (!d.open) d.showModal();
    try { const res = await api("admin_user", { email: p.email }); if (d.open) paint(res.ok ? res.events : []); } catch { if (d.open) paint([]); }
  }

  function csv() {
    const U = data.users || {}, q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Họ tên", "Email", "Trạng thái", "Donate", "Số tiền", "Ngày đăng ký", "Lần vào gần nhất", "Số lượt vào", "Lời nhắn"];
    const lines = data.people.map((p) => { const u = U[p.email] || {}; return [p.name, p.email, p.status, p.donate, p.amount || "", p.at.slice(0, 10), (u.last || "").slice(0, 16).replace("T", " "), u.logins || 0, p.note].map(q).join(","); });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + [head.map(q).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.download = `storage-nguoi-xem-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  async function set(email, body) {
    if (busy) return; busy = true;
    try {
      const res = await api("admin_set", { email, ...body });
      if (!res.ok) { alert(errText(res.error, true)); return; }
      const p = data.people.find((x) => x.email === email);
      if (p) { if (body.status) p.status = body.status; if (body.memo != null) p.memo = body.memo; if (body.donate != null) { p.donate = body.donate; p.amount = Number(body.amount) || 0; } }
      render(); load();
    } catch { alert(errText(undefined, true)); } finally { busy = false; }
  }

  function donateDlg(p, approve) {
    const f = dlg.querySelector("form");
    $("#admDlgT").textContent = approve ? L("Duyệt người xem", "Approve viewer") : L("Ghi donate", "Record donation");
    $("#admWho").innerHTML = `<b>${esc(p.name)}</b> · ${esc(p.email)}<br>${L("Nội dung CK cần tìm trong sao kê:", "Transfer note to look for:")} <code>LM ${esc(p.code)}</code>`;
    f.donate.innerHTML = (data.donateOpts || Object.keys(DON)).map((d) => `<option value="${esc(d)}">${esc(don(d))}</option>`).join("");
    f.donate.value = p.donate || (approve ? "Đã nhận" : "Chưa nhận");
    f.amount.value = p.amount || "";
    $("#admOk").textContent = approve ? L("Duyệt", "Approve") : L("Lưu", "Save");
    f.onsubmit = (e) => { e.preventDefault(); dlg.close(); set(p.email, { status: approve ? "Approved" : p.status, donate: f.donate.value, amount: f.amount.value }); };
    dlg.showModal();
  }

  const onClick = (e) => {
    const f = e.target.closest("[data-adm-f]"); if (f) { flt = f.dataset.admF; page = 1; render(); return; }
    const tb = e.target.closest("[data-adm-tab]"); if (tb) { tab = tb.dataset.admTab; render(); return; }
    const pg = e.target.closest("[data-adm-p]"); if (pg) { page = Number(pg.dataset.admP) || 1; render(); box.querySelector(".adm-tabs")?.scrollIntoView({ block: "start" }); return; }
    const rg = e.target.closest("[data-adm-r]"); if (rg) { range = rg.dataset.admR; render(); return; }
    const b = e.target.closest("[data-adm]"); if (!b) return;
    if (b.closest("#admUser")) $("#admUser").close(); // nút Duyệt / Thu quyền… trong hộp chi tiết
    const k = b.dataset.adm, p = data?.people.find((x) => x.email === b.dataset.em);
    if (k === "refresh") load();
    else if (k === "signin") $("#gDlg").showModal();
    else if (k === "csv") csv();
    else if (k === "user" && p) userDlg(p);
    else if (k === "approve" && p) donateDlg(p, true);
    else if (k === "donate" && p) donateDlg(p, false);
    else if (k === "reject" && p && confirm(L(`Từ chối ${p.name}?`, `Reject ${p.name}?`))) set(p.email, { status: "Rejected" });
    else if (k === "revoke" && p && confirm(L(`Thu quyền xem của ${p.name}? Người này sẽ không vào được Data Storage nữa.`, `Revoke ${p.name}'s access? They won't be able to enter Data Storage anymore.`))) set(p.email, { status: "Revoked" });
  };
  box.addEventListener("click", onClick); $("#admUser").addEventListener("click", onClick);
  box.addEventListener("change", (e) => { if (e.target.id === "admSort") { sort = e.target.value; page = 1; render(); } });
  box.addEventListener("input", (e) => { if (e.target.id === "admQ") { aq = e.target.value; page = 1; const pos = e.target.selectionStart; render(); const q = $("#admQ"); q.focus(); q.setSelectionRange(pos, pos); } });
  $("#admCancel").onclick = () => dlg.close();

  const crumb = () => { $("#crumb").innerHTML = `<span>${esc(L("Kho cá nhân", "Personal library"))}</span><i aria-hidden="true">›</i><b>📊 ${esc(L("Quản trị Storage", "Storage admin"))}</b>`; };
  function open() {
    on = true; document.body.classList.add("adm-on"); box.hidden = false;
    crumb();
    document.querySelectorAll("#tabs .tab").forEach((t) => t.classList.remove("on"));
    $("#adminOpen").classList.add("on");
    if (typeof side === "function") side(false); // điện thoại: đóng menu trượt (kho.js)
    scrollTo({ top: 0 });
    if (data) render();
    load();
  }
  function close() { if (!on) return; on = false; document.body.classList.remove("adm-on"); box.hidden = true; $("#adminOpen").classList.remove("on"); }
  $("#adminOpen").addEventListener("click", open);
  document.addEventListener("kho:signed", () => { if (on && (want || !data)) load(); });
  document.addEventListener("lm:lang", () => { if (on) { crumb(); data ? render() : load(); } });
  window.KhoAdmin = { open, close };
})();
