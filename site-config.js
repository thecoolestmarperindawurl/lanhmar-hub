// Cấu hình khoá học giới thiệu (affiliate). Để url trống thì mục "Khoá học" bị ẩn.
// url: link giới thiệu của bạn (có mã/ref). discount: ví dụ "Giảm 10%" nếu link có ưu đãi, để trống nếu không.
window.AFFILIATE = {
  url: "https://kesflow.vn/khoa-hoc/teamwork-voi-ai-ta06?a=YA5E5",
  discount: ""
};

// Donate để mở Data Storage (VietQR, nội dung chuyển khoản riêng cho từng người = prefix + mã truy cập của họ).
window.DONATE = {
  bank: "TPB", bankName: "TPBank", account: "70384017195",
  accountName: "",   // tên chủ tài khoản (không dấu, viết hoa) nếu muốn hiện trên mã QR, ví dụ "DUONG THI LAN ANH"
  amount: 0,         // số tiền gợi ý (VNĐ). 0 = người chuyển tự nhập
  prefix: "LM"       // nội dung CK sẽ là "LM <MÃ>"
};
