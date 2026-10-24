# Bật Data Storage (Google Sheet + Apps Script)

Làm một lần, khoảng 10 phút. Mọi bước bấm trong tài khoản Google của bạn.

## 1. Tạo Sheet và dán mã
1. Vào sheets.new, đặt tên **LANHMAR Storage Access**.
2. Menu **Tiện ích mở rộng → Apps Script**.
3. Xoá nội dung mặc định, dán toàn bộ file `Code.gs` (cùng thư mục này). Bấm **Lưu**.

## 2. Đặt các khoá bí mật
Trong Apps Script: biểu tượng bánh răng **Cài đặt dự án → Thuộc tính tập lệnh → Thêm thuộc tính**:

| Tên | Giá trị |
|---|---|
| `ADMIN_KEY` | một chuỗi dài, khó đoán (≥ 20 ký tự). Bạn nhập khi bấm “Đồng bộ Storage” |
| `TELEGRAM_BOT_TOKEN` | (tuỳ chọn) token bot |
| `TELEGRAM_CHAT_ID` | (tuỳ chọn) chat id của bạn |

Không gửi các giá trị này cho ai, kể cả trong chat.

### Tạo bot Telegram để nhận thông báo
1. Mở Telegram, chat với **@BotFather**, gõ `/newbot`, làm theo hướng dẫn, nhận **token**.
2. Nhắn một câu bất kỳ cho bot vừa tạo.
3. Mở trình duyệt: `https://api.telegram.org/bot<TOKEN>/getUpdates` (thay `<TOKEN>`). Tìm `"chat":{"id":123456789` — số đó là `TELEGRAM_CHAT_ID`.

## 3. Triển khai
1. **Triển khai → Tuỳ chọn triển khai mới → Loại: Ứng dụng web**.
2. **Thực thi dưới tên: Tôi**. **Ai có quyền truy cập: Bất kỳ ai**.
3. **Triển khai**, cấp quyền khi Google hỏi (gửi Telegram, đọc/ghi Sheet).
4. Sao chép **URL ứng dụng web** (kết thúc bằng `/exec`).

## 4. Nối vào website
Mở file `storage-config.js`, dán URL vào `window.STORAGE_API = "...";`, lưu và đẩy lên GitHub.

## 5. Dùng hằng ngày
- **Chia sẻ mục**: trong Kho cá nhân, khi thêm/sửa mục, tích **Chia sẻ mục này trong Data Storage**. Bấm **Đồng bộ Storage** ở chân trang, nhập `ADMIN_KEY` để đẩy các mục đã tích lên Sheet.
- **Duyệt người xem**: mở tab `Requests`, đổi cột **Status** của người đó từ `Pending` sang `Approved`.
- **Thu quyền**: đổi thành `Revoked` (hoặc xoá dòng). Họ mất quyền ngay lần tải sau.
- Người xem vào bằng **email + mã** (mã hiện đúng một lần khi họ đăng ký, bạn cũng thấy mã ở cột `Code`).

## Lưu ý bảo mật
- Chỉ những mục bạn tích “Chia sẻ” và đồng bộ mới nằm trong Sheet. Phần còn lại của Kho cá nhân vẫn mã hoá trong trình duyệt của bạn.
- Người đã được duyệt có thể sao chép nội dung họ xem. Thu quyền không xoá được những gì họ đã chép.
- Mỗi lần bạn sửa code `Code.gs`, phải **Triển khai → Quản lý triển khai → Sửa → Phiên bản mới** thì thay đổi mới có hiệu lực.

## Theo dõi donate (Version 7)

Tab Requests có thêm 5 cột bên phải: **Nội dung CK** (tự điền `LM <mã>`), **Donate** (Chưa nhận / Đã nhận / Miễn), **Số tiền (đ)**, **Ngày nhận**, **Gợi ý** (tự tính: "CÓ THỂ DUYỆT" khi đã nhận donate hoặc được miễn mà chưa Approved).
Quy trình: tìm nội dung CK trong sao kê, chọn Donate = Đã nhận, nhập số tiền, rồi đổi Trạng thái thành Approved. Dashboard có khối "Sẵn sàng duyệt", "Đang chờ donate", tổng tiền và cảnh báo "Duyệt nhưng chưa ghi donate".
