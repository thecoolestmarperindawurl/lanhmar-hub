# Hồ sơ Publish app + xác minh OAuth với Google — Drive Ebook Reader

> **Đường đã chọn (11/2026): miễn phí, công khai cho mọi người.** Extension dùng scope `drive.file` + Google Picker, không cần xác minh scope, không cần CASA. Việc cần làm nằm ở **`docs/huong-dan-publish-nontech.md`** (7 bước, không tốn phí). Phần dưới đây giữ lại cho trường hợp sau này muốn quay về `drive.readonly` (mở thẳng mọi file, liệt kê thư mục) và chấp nhận chi phí xác minh.

Tài liệu này gom mọi thứ cần để bấm **Publish app** và nộp **xác minh OAuth** cho scope `drive.readonly` (nhóm *restricted*). Phần bấm nút phải do chủ project Google Cloud làm; chữ cần điền đã soạn sẵn bên dưới, cứ copy.

> Nguồn: quy trình dựa trên trang **Google Cloud Console → Google Auth Platform** và tài liệu *OAuth App Verification* của Google tính tới thời điểm soạn. Giao diện Google đổi thường xuyên; tên mục có thể lệch đôi chút. Những chỗ ghi **[cần xác minh]** là điểm mình không mở được tài liệu gốc trong lúc soạn, hãy đối chiếu trên màn hình thật.

## 0. Thứ đã có sẵn trong repo

| Google đòi | Đã có |
|---|---|
| App homepage mô tả chức năng, cùng tên miền đã xác minh | https://lanhmar.id.vn/drive-ebook-reader.html |
| Privacy policy URL, cùng tên miền, có câu Limited Use | https://lanhmar.id.vn/drive-ebook-reader-privacy.html |
| Logo 120×120 PNG | `assets/img/drive-ebook-reader-logo-120.png` |
| Link chính sách hiện trong app | Trang chủ của extension (reader.html) có link Chính sách + Trang giới thiệu; `manifest.json` có `homepage_url` |
| Client ID loại Chrome Extension, Item ID cố định | `bijcnaofiojlemmbghgcljfekdaoghbf` |

## 1. Xác minh tên miền `lanhmar.id.vn` (Search Console)

Google chỉ chấp nhận homepage/privacy trên tên miền mà **cùng tài khoản Google sở hữu project** đã xác minh trong Search Console.

1. Vào https://search.google.com/search-console → **Add property** → chọn **Domain** → nhập `lanhmar.id.vn`.
2. Google đưa một bản ghi **TXT**. Thêm bản ghi đó vào DNS của tên miền (nơi bạn mua `lanhmar.id.vn`), chờ vài phút tới vài giờ, bấm **Verify**.
3. Nếu không vào được DNS: chọn kiểu **URL prefix** `https://lanhmar.id.vn/` → phương thức **HTML file** → gửi file `google….html` cho mình, mình commit vào gốc repo là xong.

## 2. Branding (OAuth consent screen)

Google Cloud Console → **APIs & Services → OAuth consent screen** (giao diện mới: **Google Auth Platform → Branding**). Điền:

| Trường | Giá trị |
|---|---|
| App name | `Drive Ebook Reader` |
| User support email | Gmail của bạn |
| App logo | `assets/img/drive-ebook-reader-logo-120.png` (120×120, PNG) |
| App home page | `https://lanhmar.id.vn/drive-ebook-reader.html` |
| App privacy policy link | `https://lanhmar.id.vn/drive-ebook-reader-privacy.html` |
| App terms of service link | để trống (không bắt buộc) |
| Authorized domains | `lanhmar.id.vn` |
| Developer contact email | Gmail của bạn |

Lưu ý: **đổi logo sẽ kích hoạt xác minh thương hiệu** (brand verification), chuyện này là bình thường, mất 2–3 ngày làm việc.

## 3. Data Access (scopes)

**Google Auth Platform → Data Access → Add or remove scopes**: tích đúng một scope
`https://www.googleapis.com/auth/drive.readonly` (See and download all your Google Drive files). Bỏ mọi scope khác nếu lỡ có.

## 4. Publish app

**Google Auth Platform → Audience** → **Publishing status: Testing → Publish app** → xác nhận.

Sau khi publish:
- Ai cũng đăng nhập được, không cần nằm trong Test users; token không còn hết hạn sau 7 ngày như ở chế độ Testing.
- Cho tới khi xác minh xong, người dùng thấy màn hình **"Google hasn't verified this app"** và phải bấm Advanced → Go to Drive Ebook Reader; app chưa xác minh bị giới hạn 100 người dùng mới **[cần xác minh con số và việc giới hạn có áp cho scope restricted không]**.

## 5. Nộp xác minh (Verification Center)

**Google Auth Platform → Verification Center** (hoặc nút *Prepare for verification* ngay trên trang Branding). Google hỏi lần lượt; chữ điền sẵn:

### 5a. Scope justification (tiếng Anh, dán nguyên)

```
Drive Ebook Reader is a free, open-source Chrome/Edge extension (source: https://github.com/thecoolestmarperindawurl/lanhmar-hub/tree/main/extensions/drive-ebook-reader) that lets a user read large PDF and EPUB files, and Google Docs/Slides, that are stored in their own Google Drive, directly in the browser without downloading the whole file.

Why drive.readonly is required:
1. The user opens an EXISTING file that the extension did not create, by clicking a button on the Drive web page of that file, by pasting a Drive link, or by picking it from a folder listing. The extension then calls files.get (metadata: name, mimeType, size, parents, webViewLink) and files.get?alt=media with an HTTP Range header to fetch only the byte ranges PDF.js needs for the pages currently on screen. For EPUB the file is loaded into memory; for Google Docs/Slides files.export to PDF is used.
2. When the user opens a folder link, files.list with "'<folderId>' in parents" is called once so the user can pick a book.
3. drive.file is not sufficient: it only grants access to files created or explicitly opened through the app via the Google Picker, and the Google Picker JavaScript (apis.google.com) cannot be loaded inside a Manifest V3 extension page because remote code is prohibited. drive.metadata.readonly cannot download file content. drive.readonly is therefore the narrowest scope that allows reading the content of a user-selected existing file.

Data handling: file bytes are kept only in the memory of the browser tab while reading and are never written to disk, never sent to any server (there is no backend), never shared with third parties, and never used for advertising or model training. Only the file ID with the last reading position, font size and theme are stored locally in chrome.storage.local. The extension never creates, modifies, deletes or shares files. Privacy policy: https://lanhmar.id.vn/drive-ebook-reader-privacy.html
```

### 5b. Demo video (YouTube, để chế độ *Unlisted*)

Google yêu cầu video cho thấy **toàn bộ luồng OAuth và cách dùng từng scope**, tiếng Anh (lời nói hoặc phụ đề). Quay màn hình 1080p, 2–4 phút, theo kịch bản:

| # | Cảnh | Phải thấy rõ |
|---|---|---|
| 1 | `chrome://extensions` | Thẻ *Drive Ebook Reader*, ID `bijcnaofiojlemmbghgcljfekdaoghbf`, bật Developer mode |
| 2 | drive.google.com, mở một PDF lớn mà Drive báo không xem trước được | URL `drive.google.com/file/d/…`, nút tím **Read without downloading** góc dưới phải |
| 3 | Bấm nút → màn hình đăng nhập Google | **Màn hình consent**: tên app *Drive Ebook Reader*, scope "See and download all your Google Drive files", nút Allow. Nếu còn cảnh báo "unverified", để nguyên trong video |
| 4 | Trang đọc mở | Tên file, số trang, dòng **"Fetched x MB / y MB"** nhỏ hơn tổng; cuộn vài trang, số tăng dần |
| 5 | Dán link **thư mục** vào trang chủ extension | Danh sách file trong thư mục, bấm một cuốn để mở (minh hoạ files.list) |
| 6 | Mở một Google Docs | Xuất PDF rồi đọc (minh hoạ files.export) |
| 7 | Thư mục Downloads của máy | Không có file nào mới được tải về |
| 8 | Trang https://lanhmar.id.vn/drive-ebook-reader-privacy.html?lang=en | Kéo tới đoạn Limited Use |
| 9 | https://myaccount.google.com/permissions | Mục Drive Ebook Reader, cho thấy có thể thu hồi |

Mẹo: đặt ngôn ngữ trình duyệt là English để giao diện extension và Google đều tiếng Anh; đọc lời dẫn ngắn mỗi cảnh ("Now the extension requests only the byte range for page 20…").

### 5c. Các câu hỏi khác trong form

- *How will the scopes be used?* → dán 5a.
- *Does your app use Google user data for ads / sell data / allow humans to read?* → **No** cho tất cả.
- *Is your app for personal/internal use only?* → **No** (đã công bố trên lanhmar.id.vn).
- *Link to app homepage / privacy* → hai URL ở mục 0.
- Email xác nhận gửi tới **Developer contact email**; Google trả lời trong 3–5 ngày làm việc với yêu cầu bổ sung (thường là video thiếu cảnh consent hoặc homepage chưa cùng tên miền). Trả lời email đó, đừng tạo yêu cầu mới.

## 6. Đánh giá bảo mật (CASA) cho scope restricted

`drive.readonly` thuộc nhóm **restricted**, nên sau khi qua bước xác minh thương hiệu và scope, Google yêu cầu **security assessment theo khung CASA (Cloud Application Security Assessment)**, Tier 2, làm lại **hằng năm**. Google sẽ gửi email hướng dẫn chọn đơn vị đánh giá sau khi duyệt hồ sơ.

- Tier 2 thường là quét tự động (SAST/DAST) qua một lab được Google uỷ quyền; có lab cung cấp gói tự quét miễn phí hoặc phí thấp cho app nhỏ, có lab tính phí vài trăm tới vài nghìn USD. Chi phí và danh sách lab hiện hành: **[cần xác minh]** tại trang *CASA* của App Defense Alliance mà email của Google dẫn tới.
- Lợi thế của mình: không có backend, không lưu dữ liệu, mã nguồn mở, scope duy nhất. Hồ sơ như vậy thường qua nhanh.
- Thời gian tổng cộng (brand + scope + CASA): tính bằng **tuần**, không phải ngày.

## 7. Nếu không muốn CASA: đường `drive.file` + Google Picker

Google không bắt xác minh scope và không đòi CASA với `drive.file` (chỉ truy cập file người dùng mở qua Picker). Đổi lại:

- Phải thêm một trang web trên lanhmar.id.vn chứa **Google Picker** (nút tím trên Drive và ô dán link sẽ dẫn qua trang này để người dùng chọn lại đúng file đó, thêm 1 cú bấm); sau khi chọn, trang chuyển file ID về extension và extension đọc bằng token `drive.file` cùng project.
- Mất tính năng dán link thư mục để liệt kê (Picker có sẵn giao diện duyệt thư mục nên vẫn chọn được sách).
- Mỗi file chỉ cần chọn qua Picker một lần; lần sau mở lại không cần.

Nếu CASA quá tốn kém, mình có thể làm đường này trong một PR riêng; hãy báo mình.

## 8. Việc của chủ project, theo thứ tự

1. Search Console: xác minh `lanhmar.id.vn` (mục 1).
2. Branding: điền bảng ở mục 2, tải logo.
3. Data Access: chỉ giữ `drive.readonly`.
4. Audience → **Publish app**.
5. Quay video theo 5b, tải lên YouTube Unlisted.
6. Verification Center: dán 5a, dán link video, trả lời 5c, Submit.
7. Theo dõi email của Google; chuyển cho mình nếu có yêu cầu kỹ thuật.
8. Khi Google yêu cầu CASA: quyết định đi tiếp (mục 6) hay chuyển sang `drive.file` (mục 7).
