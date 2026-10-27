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

## 6. Mở Kho cá nhân trên mọi thiết bị bằng Google (chỉ chủ kho)

Kho vẫn mã hoá bằng mật khẩu ngay trong trình duyệt. Máy chủ chỉ giữ **bản mã** (không có mật khẩu, không đọc được nội dung). Chỉ mail chủ kho đăng nhập Google mới lấy/ghi được bản mã đó. Người lạ vẫn không tạo được kho (cần `kho.html#setup`).

### 6.1 Tạo OAuth Client ID (miễn phí, khoảng 5 phút)
1. Vào https://console.cloud.google.com, đăng nhập bằng `anhduong.talkandshare@gmail.com`.
2. Góc trên trái chọn **Select a project → New Project**, đặt tên `LANHMAR Kho`, bấm **Create**, rồi chọn project đó.
3. Menu **APIs & Services → OAuth consent screen** (hoặc **Google Auth Platform**):
   - User type: **External**. App name: `LANHMAR Kho`. User support email và Developer contact: mail của bạn.
   - Mục **Audience / Test users**: thêm `anhduong.talkandshare@gmail.com`. (Để ở chế độ Testing là đủ, chỉ mình bạn dùng.)
   - Lưu.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**. Name: `LANHMAR Kho web`.
   - **Authorized JavaScript origins** → Add URI: `https://lanhmar.id.vn`
   - Không cần điền Redirect URI. Bấm **Create**.
5. Sao chép **Client ID** (dạng `1234567890-abc...apps.googleusercontent.com`). Client ID là mã công khai, gửi cho Claude được. **Không** gửi Client secret (không cần dùng).

### 6.2 Cập nhật Apps Script
1. Mở Apps Script của dự án **LANHMAR Storage API**. Xoá hết code cũ, dán toàn bộ `Code.gs` mới (thư mục này), bấm **Lưu**.
2. **Cài đặt dự án (bánh răng) → Thuộc tính tập lệnh**, thêm 2 dòng:

| Tên | Giá trị |
|---|---|
| `OWNER_EMAIL` | `anhduong.talkandshare@gmail.com` |
| `GOOGLE_CLIENT_ID` | Client ID ở bước 6.1 |

3. Cấp quyền mới: chạy hàm `setup` một lần trong trình soạn thảo. Khi Google hỏi quyền (gọi dịch vụ ngoài `UrlFetchApp`), bấm cho phép.
4. **Triển khai → Quản lý triển khai → biểu tượng bút chì (Sửa) → Phiên bản: Phiên bản mới → Triển khai.** Giữ nguyên URL `/exec` hiện tại. Không tạo triển khai mới, vì URL sẽ đổi.

### 6.3 Nối vào website
Gửi Client ID cho Claude, hoặc tự mở `storage-config.js` và điền `window.GOOGLE_CLIENT_ID = "…apps.googleusercontent.com";`, lưu rồi đẩy lên GitHub.

### 6.4 Dùng hằng ngày
- **Lần đầu, trên máy đang có kho:** mở `kho.html`, bấm **Đăng nhập Google** (mail chủ kho), nhập mật khẩu để mở kho. Kho tự lưu lên đám mây (dòng trạng thái báo "Đã đồng bộ lên đám mây ✓").
- **Thiết bị mới:** mở `kho.html`, bấm **Đăng nhập Google**, hệ thống tải bản mã về, rồi nhập mật khẩu để mở.
- **Mỗi lần sửa/thêm/xoá:** tự lưu lên đám mây nếu phiên Google còn hạn (khoảng 1 giờ). Hết hạn thì bấm **Đồng bộ đám mây** ở chân trang để đăng nhập lại.
- **Xung đột:** nếu kho đã được sửa ở thiết bị khác, web hỏi giữa dùng bản đám mây hoặc ghi đè bằng bản trên máy. Hãy đọc kỹ trước khi chọn.
- **Dự phòng:** nút **Nhập bản sao lưu (kho.enc.json)** ở màn hình khoá. Vẫn nên bấm **Xuất bản mã** định kỳ để tự giữ một bản.

### Lưu ý bảo mật
- Mất mật khẩu kho thì không khôi phục được, kể cả khi bản mã còn trên đám mây.
- Bản mã nằm trong tab ẩn **Vault** của Sheet "LANHMAR Storage Access". Không sửa tay tab này. Ai có quyền sửa Sheet có thể xoá/ghi đè bản mã (không đọc được nội dung).
- Máy chủ kiểm tra token Google với Google (`tokeninfo`), đúng Client ID, mail đã xác minh và đúng `OWNER_EMAIL`. Không có mật khẩu, token hay khoá nào nằm trong file code.

## 7. Tin AI News luôn mới (làm mới tự động)

- **Trên web:** khi đang mở Kho (hoặc trang Data Storage), tin AI News và Claude Code tự làm mới mỗi 5 phút, và làm mới ngay khi bạn quay lại tab sau hơn 2 phút hoặc khi mạng kết nối lại. Cửa sổ tin đang mở cập nhật tại chỗ, không nhảy về đầu. Có nút **↻ Làm mới** để làm mới ngay.
- **Máy chủ:** Apps Script giữ cache tin 5 phút (trước đây 30 phút). Muốn áp dụng, dán lại `Code.gs` mới rồi **Triển khai → Quản lý triển khai → Sửa → Phiên bản mới**. Chưa làm bước này thì web vẫn làm mới, nhưng tin có thể trễ tới 30 phút.
- **Giới hạn:** đây là cập nhật gần thời gian thực (độ trễ tối đa khoảng 5 đến 10 phút), không phải đẩy tức thời. Tin phụ thuộc nguồn RSS và Google News của từng hãng. Nếu một nguồn lỗi, web giữ tin cũ thay vì hiện trống.

## 8. Chat "Hỏi Lan Anh" (tin nhắn tới bot Telegram)

Khung chat 💬 hiện ở góc phải của `kho.html` (cả màn hình khoá) và `storage.html`. Khách gõ câu hỏi, tin được lưu ở tab **Chat** của Sheet và gửi tới bot Telegram của bạn. Bạn trả lời ngay trong Telegram, câu trả lời hiện lại trong khung chat của khách.

### Cách cài (làm một lần)
1. Dán `Code.gs` mới vào Apps Script, lưu. Đảm bảo đã có 2 Script property `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` (mục 2). Nếu token cũ từng bị lộ, tạo token mới ở @BotFather rồi cập nhật vào Script property.
2. Chạy hàm **`installChatTrigger`** một lần trong trình soạn code, cấp quyền khi Google hỏi (quyền tạo trigger). Hàm này bật trigger chạy `pollTelegram` mỗi phút để đọc câu trả lời của bạn.
3. **Triển khai → Quản lý triển khai → Sửa → Phiên bản mới.** Giữ nguyên URL.
4. Nhớ nhắn bot một câu để nó gửi được cho bạn (nếu chưa).

### Cách trả lời khách
- Trong Telegram, bấm **Reply** vào đúng tin "💬 Tin nhắn mới trong Kho" của bot rồi gõ câu trả lời.
- Hoặc gõ: `/r <Mã hội thoại> nội dung` (mã dạng `T1A2B3C4D` có trong tin của bot).
- Câu trả lời xuất hiện trong khung chat của khách sau tối đa khoảng 1 đến 2 phút (trigger chạy mỗi phút, khung chat tải lại mỗi 15 giây khi đang mở).

### Bảo mật và chống spam
- Chỉ tin nhắn từ đúng `TELEGRAM_CHAT_ID` của bạn mới được ghi thành câu trả lời.
- Mỗi khách tối đa 5 tin trong 10 phút, toàn hệ thống tối đa 60 tin mỗi giờ. Có ô bẫy bot ẩn. Tin tối đa 1000 ký tự.
- Mã khách là chuỗi ngẫu nhiên lưu trong trình duyệt của khách, người khác không đọc được hội thoại của họ.
- Không dán token vào file code hay vào chat. Tin khách gửi nằm trong tab **Chat** (đừng chia sẻ Sheet cho người khác).
- Khung chat là kênh công khai: ai mở `kho.html` cũng gửi được tin, kể cả khi chưa mở khoá kho.

## 9. Template chung cho các tab của Storage

- Tab **Chat** dùng cùng kiểu với Requests và Items: tiêu đề màu (xanh lá cho Chat), cố định hàng đầu, bộ lọc, đường kẻ, cột **Chiều** có danh sách chọn (Khách / Admin) và tô màu, ngày giờ định dạng `dd/MM/yyyy HH:mm`.
- Khi bạn **thêm một tab mới** vào Sheet Storage (ví dụ "Báo cáo"), mở menu **LANHMAR → Định dạng lại tất cả tab** (hoặc chạy hàm `setup`). Tab mới tự nhận tiêu đề màu xám tím, cố định hàng đầu, bộ lọc và đường kẻ giống các tab còn lại. Tab ẩn **Vault** không bị đụng tới.
- Thứ tự tab cố định: Dashboard, Requests, Items, Chat, rồi các tab khác.
- Lần đầu khách gửi tin trong chat, tab Chat tự được tạo và định dạng sẵn.
