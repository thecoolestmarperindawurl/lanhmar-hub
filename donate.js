/* Khối donate (VietQR) để mở Data Storage. Có opts.code thì sinh mã QR với nội dung chuyển khoản riêng "<prefix> <mã>". */
window.donateHtml = (opts) => {
  opts = opts || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const D = window.DONATE || {};
  const code = String(opts.code || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
  const info = (D.prefix || "LM") + " " + code;
  const amount = Number(D.amount) > 0 ? Math.round(Number(D.amount)) : 0;
  const fmt = (n) => n.toLocaleString("vi-VN") + "đ";
  const steps = `<ol class="don-steps">
      <li><b>Đăng ký</b> bằng họ tên và email (form ${opts.here ? "bên dưới" : "ở trang kế tiếp"}).</li>
      <li>Bạn nhận <b>mã truy cập</b> và <b>mã QR chuyển khoản riêng</b>, nội dung đã điền sẵn theo mã của bạn.</li>
      <li>Quét QR, ủng hộ Lan Anh${amount ? " " + fmt(amount) : ", số tiền tuỳ tâm"}. <b>Giữ nguyên nội dung chuyển khoản.</b></li>
      <li>Lan Anh đối chiếu và <b>duyệt thủ công</b>, rồi bạn dùng email + mã truy cập để vào xem.</li>
    </ol>`;
  if (!code) return `<div class="don don-one">${steps}</div>`;
  const q = new URLSearchParams();
  if (amount) q.set("amount", String(amount));
  q.set("addInfo", info);
  if (D.accountName) q.set("accountName", D.accountName);
  const img = `https://img.vietqr.io/image/${encodeURIComponent(D.bank || "TPB")}-${encodeURIComponent(D.account || "")}-compact2.png?${q}`;
  return `<div class="don">
    <div class="don-qr"><img src="${esc(img)}" alt="Mã VietQR chuyển khoản ${esc(D.bankName || "")}" onerror="this.replaceWith(Object.assign(document.createElement('p'),{className:'don-miss',textContent:'Không tải được mã QR. Chuyển khoản thủ công theo thông tin bên cạnh.'}))">
      <small>Quét bằng app ngân hàng bất kỳ</small></div>
    <div class="don-info">
      <p><b>Chuyển khoản thủ công</b> (nếu không quét được):</p>
      <dl><div><dt>Ngân hàng</dt><dd>${esc(D.bankName || D.bank || "")}</dd></div><div><dt>Số tài khoản</dt><dd>${esc(D.account || "")}</dd></div>${amount ? `<div><dt>Số tiền</dt><dd>${fmt(amount)}</dd></div>` : ""}<div><dt>Nội dung</dt><dd class="don-memo">${esc(info)}</dd></div></dl>
      <p class="don-note">Nội dung <b>${esc(info)}</b> là của riêng bạn để Lan Anh biết khoản nào của ai. Đừng sửa.</p>
    </div></div>`;
};
