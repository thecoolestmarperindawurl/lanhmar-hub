# Bảo mật — lanhmar-hub

## Báo lỗi bảo mật
Nếu bạn phát hiện lỗ hổng (lộ dữ liệu, vượt quyền Data Storage, XSS…), **đừng mở issue công khai**. Hãy nhắn riêng qua mục Liên hệ trên https://lanhmar.id.vn hoặc Telegram https://t.me/LANHMAR. Mình phản hồi trong 7 ngày và ghi nhận người báo khi vá xong (nếu bạn muốn).

## Phạm vi
- **Website tĩnh** (GitHub Pages): HTML/CSS/JS, không có máy chủ riêng, không lưu dữ liệu người xem. GoatCounter đếm lượt xem ẩn danh, không cookie.
- **Kho cá nhân** (`kho.html`): dữ liệu mã hoá AES-GCM 256 bằng mật khẩu ngay trong trình duyệt (PBKDF2 250.000 vòng); máy chủ chỉ giữ bản mã. Mất mật khẩu = mất dữ liệu, không khôi phục được.
- **Data Storage** (`storage.html`) và backend Apps Script (`storage-backend/Code.gs`): mọi khoá (`ADMIN_KEY`, `OWNER_EMAIL`, `TELEGRAM_BOT_TOKEN`…) nằm trong *Script Properties* của Apps Script, **không có trong repo**. `GOOGLE_CLIENT_ID` và URL `/exec` trong `storage-config.js` là giá trị công khai theo thiết kế của Google.

## Quy tắc khi đóng góp / dùng Claude Code
- Không commit `.env`, khoá API, token, mật khẩu, file `.pem/.key` (đã chặn trong `.gitignore`; bật *Secret scanning + Push protection* trên GitHub để chặn thêm một lớp).
- Mọi link mở tab mới phải có `rel="noopener"`; nội dung từ dữ liệu luôn đi qua `esc()` trước khi chèn vào HTML.
- Thư viện ngoài (cdnjs/jsdelivr) ghim phiên bản cố định; không tải script từ nguồn khác.
- Workflow GitHub Actions dùng quyền tối thiểu (`permissions:`), Dependabot theo dõi bản mới của các action.
- Thay đổi vào `main` chỉ qua Pull Request.
