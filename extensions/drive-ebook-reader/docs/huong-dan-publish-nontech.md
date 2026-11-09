# Hướng dẫn Publish app miễn phí, cho mọi người dùng — dành cho người không chuyên

> ✅ **Đã hoàn tất ngày 09/11/2026**: scope `drive.file`, Picker API + API key, Search Console, Branding, Publish app; đã thử bằng Gmail ngoài danh sách thử nghiệm và đọc ebook thành công. Giữ tài liệu này để làm lại khi cần (đổi project, thêm logo, hoặc một extension mới).

Extension dùng quyền **`drive.file`** của Google: chỉ đọc được những file người dùng tự chọn trong cửa sổ Google Drive. Google xếp quyền này vào nhóm **không nhạy cảm**, nên:

- **không** phải nộp hồ sơ xác minh scope, **không** cần video demo, **không** cần đánh giá bảo mật CASA, **không tốn phí**;
- bấm **Publish app** xong là ai cũng đăng nhập được, không cần danh sách Test users;
- người dùng không thấy màn hình "ứng dụng chưa được xác minh" (chỉ có với scope nhạy cảm/hạn chế) **[cần xác minh trên màn hình thật: nếu vẫn thấy, chỉ là do logo chưa qua xác minh thương hiệu, xem Bước 6]**.

Mỗi bước ghi **vào đâu → bấm gì → điền gì → thấy gì là đúng**. Tổng cộng khoảng 40 phút.

Những thứ cần điền, chỉ việc copy:

| Cần gì | Copy dòng này |
|---|---|
| Tên app | `Drive Ebook Reader` |
| Trang giới thiệu (homepage) | `https://lanhmar.id.vn/drive-ebook-reader.html` |
| Chính sách quyền riêng tư | `https://lanhmar.id.vn/drive-ebook-reader-privacy.html` |
| Tên miền được uỷ quyền | `lanhmar.id.vn` |
| Giới hạn API key (referrer) | `https://lanhmar.id.vn/*` |
| Logo 120×120 | `https://lanhmar.id.vn/assets/img/drive-ebook-reader-logo-120.png` (chuột phải → Save image as) |
| Scope duy nhất | `https://www.googleapis.com/auth/drive.file` |
| ID extension | `bijcnaofiojlemmbghgcljfekdaoghbf` |

> Màn hình khác mô tả (Google đổi giao diện thường xuyên) thì chụp ảnh gửi mình, đừng đoán.

---

## Bước 1 · Đổi scope sang drive.file (3 phút)

1. Vào https://console.cloud.google.com, kiểm tra ô chọn project ở thanh trên đang là project của extension.
2. Vào https://console.cloud.google.com/auth/scopes (menu **Google Auth Platform → Data Access**).
3. Bấm **Add or remove scopes**. Trong ô lọc gõ `drive.file`, tích dòng `…/auth/drive.file` ("See, edit, create, and delete only the specific Google Drive files you use with this app"). **Bỏ tích** dòng `drive.readonly` nếu có.
4. Bấm **Update** → **Save**. Màn hình xếp scope vào mục **Non-sensitive scopes**. Đúng là vậy.

(Lời Google mô tả có chữ "edit, create, delete" vì đó là mô tả chung của quyền; extension của mình chỉ đọc, chính sách riêng tư đã nói rõ.)

## Bước 2 · Bật Google Picker API và tạo API key (7 phút)

Cửa sổ chọn file là thành phần của Google, cần một "API key" (mã công khai, không bí mật) và số hiệu project.

1. Vào https://console.cloud.google.com/apis/library/picker.googleapis.com → bấm **Enable**. (Kiểm tra luôn **Google Drive API** đã Enable từ trước.)
2. Vào https://console.cloud.google.com/apis/credentials → **Create credentials → API key**. Một hộp hiện ra với chuỗi dài bắt đầu bằng `AIza…` → bấm **Copy** và dán vào chat gửi mình.
3. Trong hộp đó bấm **Edit API key** (hoặc bấm vào tên key trong danh sách):
   - **Name**: `Picker lanhmar.id.vn`
   - **Application restrictions**: chọn **Websites** → **Add** → nhập `https://lanhmar.id.vn/*` → Done
   - **API restrictions**: chọn **Restrict key** → trong danh sách tích **Google Picker API** → OK
   - **Save**
4. Lấy **Project number**: vào https://console.cloud.google.com/iam-admin/settings → dòng **Project number** (toàn chữ số, khoảng 12 số) → copy, gửi mình cùng với API key.

Mình nhận hai thứ đó sẽ điền vào trang `drive-picker.html` trên web (bạn không phải sửa file nào).

## Bước 3 · Chứng minh bạn sở hữu tên miền lanhmar.id.vn (10–30 phút, cần cho homepage/privacy)

1. Vào https://search.google.com/search-console, đăng nhập **đúng Gmail đang giữ project**.
2. Bấm **Add property** → cột **Domain** → gõ `lanhmar.id.vn` → Continue.
3. Google hiện đoạn `google-site-verification=…` kèm nút Copy. Giữ cửa sổ này.
4. Mở tab mới, đăng nhập **nơi bạn đăng ký tên miền** (iNET, Tenten, Mắt Bão, PA Vietnam, Nhân Hoà…), tìm **Quản lý DNS / DNS Records**.
5. **Thêm bản ghi**: Type **TXT**, Host `@` (hoặc để trống), Value dán đoạn ở bước 3, TTL mặc định → Lưu.
6. Quay lại Search Console bấm **Verify**. Chưa được thì chờ 10–60 phút bấm lại.
7. Thấy **Ownership verified** là xong.

Không vào được DNS? Chọn cột **URL prefix** `https://lanhmar.id.vn/` → phương thức **HTML file** → tải file `google….html` → gửi mình, mình đưa lên web rồi bạn bấm Verify.

## Bước 4 · Điền Branding (10 phút)

Vào https://console.cloud.google.com/auth/branding và điền:

| Trường | Giá trị |
|---|---|
| App name | `Drive Ebook Reader` |
| User support email | Gmail của bạn |
| App logo | file logo 120×120 (tuỳ chọn, xem lưu ý dưới) |
| App home page | `https://lanhmar.id.vn/drive-ebook-reader.html` |
| App privacy policy link | `https://lanhmar.id.vn/drive-ebook-reader-privacy.html` |
| App terms of service | để trống |
| Authorized domains | `lanhmar.id.vn` |
| Developer contact | Gmail của bạn |

Bấm **Save**. Báo đỏ "domain not verified" nghĩa là Bước 3 chưa xong hoặc đang đăng nhập Gmail khác.

**Lưu ý về logo**: tải logo lên sẽ kích hoạt **xác minh thương hiệu** (miễn phí, 2–3 ngày làm việc, Google chỉ kiểm tra tên app/homepage/privacy khớp nhau). Trong lúc chờ, màn hình đăng nhập có thể hiện cảnh báo. Muốn chắc chắn không có cảnh báo nào ngay từ đầu thì **để trống logo** lúc này, thêm sau cũng được.

## Bước 5 · Publish app (2 phút)

1. Vào https://console.cloud.google.com/auth/audience.
2. **Publishing status: Testing → Publish app → Confirm**. Trạng thái thành **In production**.

Từ đây mọi tài khoản Google đều đăng nhập được, không cần Test users, không hết hạn sau 7 ngày.

## Bước 6 · (Tuỳ chọn) Xác minh thương hiệu nếu có logo

Nếu Bước 4 có tải logo, vào https://console.cloud.google.com/auth/verification → **Prepare for verification** → Google kiểm tra homepage và privacy → **Submit**. Không có câu hỏi về scope, không cần video. Email trả lời trong 2–3 ngày làm việc; có yêu cầu gì thì chuyển cho mình.

## Bước 7 · Thử lại từ đầu như một người lạ (5 phút)

1. Mở Chrome bằng **hồ sơ (profile) khác** hoặc nhờ một người bạn chưa từng nằm trong Test users.
2. Tải ZIP từ https://lanhmar.id.vn/drive-ebook-reader.html, Load unpacked như hướng dẫn.
3. Bấm icon extension → **Chọn sách từ Google Drive** → đăng nhập Google. Màn hình xin quyền phải ghi tên **Drive Ebook Reader** và quyền "chỉ các tệp Google Drive cụ thể mà bạn dùng với ứng dụng này".
4. Chọn một PDF trong cửa sổ Drive → sách mở, dòng "Đã nạp x MB / y MB" nhỏ hơn tổng.
5. Mở lại trang Drive của cuốn đó, bấm nút tím → mở thẳng, không hỏi gì thêm.

Kẹt ở đâu, chụp màn hình kèm số bước gửi mình.

---

## Tóm tắt một trang

| Bước | Ở đâu | Mất | Kết quả cần thấy |
|---|---|---|---|
| 1 | Data Access | 3 phút | Chỉ còn `drive.file`, nhóm Non-sensitive |
| 2 | Library + Credentials | 7 phút | API key `AIza…` và Project number gửi cho mình |
| 3 | Search Console + DNS | 10–30 phút + chờ | "Ownership verified" |
| 4 | Branding | 10 phút | Save không báo đỏ |
| 5 | Audience → Publish app | 2 phút | "In production" |
| 6 | Verification Center (nếu có logo) | 5 phút + 2–3 ngày | Email duyệt thương hiệu |
| 7 | Chrome profile khác | 5 phút | Người lạ chọn sách và đọc được |

Việc mình làm sau khi nhận API key + Project number: điền vào `drive-picker.html`, đưa lên web, thử lại cửa sổ chọn, báo bạn.
