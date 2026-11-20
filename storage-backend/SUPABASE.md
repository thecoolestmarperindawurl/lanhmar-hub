# Chuyển dữ liệu Data Storage sang Supabase

Làm một lần, khoảng 30 phút. Mọi bước bấm trong tài khoản của bạn; không gửi mật khẩu hay khoá bí mật cho ai, kể cả trong chat.

**Chuyển gì:** người xem (đăng ký, duyệt, donate, ghi chú), mục chia sẻ, nhật ký truy cập, kho mã hoá của Kho cá nhân.
**Giữ ở Apps Script:** chat "Hỏi Lan Anh", tin AI News, bảng xếp hạng, khoá học. Vì vậy **không xoá** bản triển khai Apps Script.
**An toàn khi chuyển:** website chỉ dùng Supabase khi bạn điền xong bước 6. Trước đó mọi thứ vẫn chạy bằng Google Sheet như cũ. Muốn quay lại thì xoá 2 dòng cấu hình ở bước 6.

## 1. Tạo project
1. Vào supabase.com → **New project**. Tên: `lanhmar-storage`. Region: bấm **Need a specific region?** → **Southeast Asia (Singapore)**.
   - **Enable Data API**: bật (website gọi hàm qua API này).
   - **Grant API access to new tables automatically**: tắt (website chỉ gọi qua hàm, không cần mở thẳng bảng).
   - **Enable RLS on new tables automatically**: bật.
2. Đặt mật khẩu cơ sở dữ liệu thật dài, lưu vào trình quản lý mật khẩu (website không cần mật khẩu này).

## 2. Tạo bảng và quyền
**SQL Editor → New query** → dán toàn bộ file `storage-backend/supabase.sql` → **Run**. Thấy "Success" là xong. Chạy lại lần nữa cũng không sao.

## 3. Cấu hình riêng (chỉ nằm trong cơ sở dữ liệu, website không đọc được)
SQL Editor → New query, sửa phần trong dấu nháy rồi Run:

```sql
insert into private.config values ('owner_email', 'MAIL-GOOGLE-CHU-KHO@gmail.com')
on conflict (key) do update set value = excluded.value;
-- Tuỳ chọn: báo Telegram khi có người đăng ký (giá trị giống trong Apps Script)
insert into private.config values ('telegram_bot_token', 'TOKEN-BOT'), ('telegram_chat_id', 'CHAT-ID')
on conflict (key) do update set value = excluded.value;
```

Muốn báo Telegram: **Database → Extensions** → bật `pg_net` (file SQL ở bước 2 đã tự bật nếu có sẵn).

## 4. Bật đăng nhập Google cho chủ kho
1. Google Cloud Console → **APIs & Services → Credentials** → mở OAuth client đang dùng cho `GOOGLE_CLIENT_ID` (trong `storage-config.js`). Chép **Client secret**.
2. Supabase → **Authentication → Sign In / Providers → Google** → bật:
   - **Client IDs**: dán `GOOGLE_CLIENT_ID`.
   - **Client Secret**: dán secret vừa chép.
   - Bật **Skip nonce checks** (website dùng nút Google Sign-In, không gửi nonce).
3. **Authentication → URL Configuration → Site URL**: `https://lanhmar.id.vn`.

Người khác đăng nhập Google vào được Supabase cũng **không thấy gì**: mọi bảng chỉ mở cho đúng `owner_email`. Sau khi bạn đã đăng nhập thành công lần đầu (bước 7), có thể tắt **Allow new users to sign up** cho gọn.

## 5. Chuyển dữ liệu cũ từ Google Sheet
1. Mở Apps Script của Sheet "LANHMAR Storage Access", dán **toàn bộ** `storage-backend/Code.gs` mới, **Lưu**.
2. Chọn hàm `exportForSupabase` → **Run** → cấp quyền Drive nếu được hỏi. Nhật ký thực thi ghi đường dẫn file `lanhmar-supabase-import.sql` trong Drive và số người xem đã xuất.
3. Mở file đó, chép toàn bộ, dán vào Supabase **SQL Editor → Run**.
4. **Table Editor → viewers**: kiểm tra đủ người, đúng trạng thái. Chạy lại bước này cũng không bị trùng.

## 6. Nối website
Mở `storage-config.js`, điền:

```js
window.SUPABASE_URL = "https://<mã-project>.supabase.co";   // Project Settings → API
window.SUPABASE_ANON_KEY = "<khoá anon hoặc publishable>";   // Project Settings → API Keys
```

Hai giá trị này công khai được (giống `GOOGLE_CLIENT_ID`). **Không** dán khoá `service_role` / `secret` vào website. Lưu, đẩy lên GitHub, đợi 1–2 phút.

## 7. Bước cuối trong Kho cá nhân
1. Mở `kho.html` → **Đăng nhập Google** bằng mail chủ kho → nhập mật khẩu kho. Kho mã hoá tự được đẩy lên Supabase (dòng trạng thái báo "Đã đồng bộ lên đám mây ✓").
2. Bấm **Đồng bộ Storage** ở thanh bên: mục chia sẻ lên Supabase. Không cần nhập ADMIN_KEY nữa; đăng nhập Google là đủ.
3. Mở **📊 Quản trị Storage**: thấy danh sách người xem và nút **Mở Supabase ↗** là xong.
4. Mở `storage.html` ở cửa sổ ẩn danh, vào bằng email + mã của một người đã duyệt để chắc người xem cũ vẫn vào được.

## Dùng hằng ngày
- Duyệt, thu quyền, ghi donate, xem thống kê: **Kho cá nhân → Quản trị Storage**.
- Sửa nhanh hàng loạt hoặc xem dữ liệu gốc: **Supabase → Table Editor** (bảng `viewers`, `items`, `events`, `vault`).
- Nhật ký truy cập tự xoá dòng cũ hơn 180 ngày.
- Gói miễn phí của Supabase **tạm dừng project nếu 7 ngày liền không có ai gọi**. Storage có người vào thường xuyên thì không sao; nếu bị dừng, vào supabase.com bấm **Restore**.
- Google Sheet cũ giữ nguyên làm bản lưu. Từ khi chuyển, người đăng ký mới chỉ nằm trên Supabase.
