/* Khối donate (VietQR) để mở Data Storage. Có opts.code thì sinh mã QR với nội dung chuyển khoản riêng "<prefix> <mã>". */
window.donateHtml = (opts) => {
  opts = opts || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const D = window.DONATE || {};
  const en = window.LM ? LM.lang() === "en" : (() => { try { return localStorage.getItem("lm_lang") === "en"; } catch { return false; } })();
  const T = (v, e) => (en ? e : v);
  const code = String(opts.code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
  const info = (D.prefix || "LM") + " " + code;
  const amount = Number(D.amount) > 0 ? Math.round(Number(D.amount)) : 0;
  const fmt = (n) => n.toLocaleString("vi-VN") + T("đ", " VND");
  const steps = T(`<ol class="don-steps">
      <li><b>Đăng ký</b> bằng họ tên và email (form ${opts.here ? "bên dưới" : "ở trang kế tiếp"}).</li>
      <li>Bạn nhận <b>mã truy cập</b> và <b>mã QR chuyển khoản riêng</b>, nội dung đã điền sẵn theo mã của bạn.</li>
      <li>Quét QR, ủng hộ Lan Anh${amount ? " " + fmt(amount) : ", số tiền tuỳ tâm"}. <b>Giữ nguyên nội dung chuyển khoản.</b></li>
      <li>Lan Anh đối chiếu và <b>duyệt thủ công</b>, rồi bạn dùng email + mã truy cập để vào xem.</li>
    </ol>`, `<ol class="don-steps">
      <li><b>Sign up</b> with your name and email (form ${opts.here ? "below" : "on the next page"}).</li>
      <li>You get an <b>access code</b> and a <b>personal transfer QR code</b>, with the note already filled in with your code.</li>
      <li>Scan the QR and support Lan Anh${amount ? " with " + fmt(amount) : " with any amount you like"}. <b>Keep the transfer note as is.</b></li>
      <li>Lan Anh checks it and <b>approves you manually</b>, then you enter with your email + access code.</li>
    </ol>`);
  if (!code) return `<div class="don don-one">${steps}</div>`;
  const q = new URLSearchParams();
  if (amount) q.set("amount", String(amount));
  q.set("addInfo", info);
  if (D.accountName) q.set("accountName", D.accountName);
  const img = `https://img.vietqr.io/image/${encodeURIComponent(D.bank || "TPB")}-${encodeURIComponent(D.account || "")}-compact2.png?${q}`;
  return `<div class="don">
    <div class="don-qr"><img src="${esc(img)}" alt="${esc(T("Mã VietQR chuyển khoản", "VietQR transfer code"))} ${esc(D.bankName || "")}" onerror="this.replaceWith(Object.assign(document.createElement('p'),{className:'don-miss',textContent:'${esc(T("Không tải được mã QR. Chuyển khoản thủ công theo thông tin bên cạnh.", "Couldn't load the QR code. Transfer manually using the details alongside."))}'}))">
      <small>${T("Quét bằng app ngân hàng bất kỳ", "Scan with any banking app")}</small></div>
    <div class="don-info">
      <p>${T("<b>Chuyển khoản thủ công</b> (nếu không quét được):", "<b>Manual transfer</b> (if you can't scan):")}</p>
      <dl><div><dt>${T("Ngân hàng", "Bank")}</dt><dd>${esc(D.bankName || D.bank || "")}</dd></div><div><dt>${T("Số tài khoản", "Account number")}</dt><dd>${esc(D.account || "")}</dd></div>${amount ? `<div><dt>${T("Số tiền", "Amount")}</dt><dd>${fmt(amount)}</dd></div>` : ""}<div><dt>${T("Nội dung", "Transfer note")}</dt><dd class="don-memo">${esc(info)}</dd></div></dl>
      <p class="don-note">${T("Nội dung", "The note")} <b>${esc(info)}</b> ${T("là của riêng bạn để Lan Anh biết khoản nào của ai. Đừng sửa.", "is unique to you so Lan Anh can match your transfer. Don't change it.")}</p>
    </div></div>`;
};
