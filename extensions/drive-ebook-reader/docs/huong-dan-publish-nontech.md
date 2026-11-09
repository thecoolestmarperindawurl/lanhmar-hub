# Hướng dẫn Publish app và xin Google xác minh — dành cho người không chuyên

Đây là bản "cầm tay chỉ việc" cho chủ tài khoản Google đang giữ project **Drive Ebook Reader**. Mỗi bước ghi rõ **vào đâu → bấm gì → điền gì → thấy gì là đúng**. Làm theo thứ tự, mỗi bước 5–15 phút, tổng cộng khoảng 1,5 giờ chia làm vài buổi cũng được.

Những thứ cần điền đã nằm sẵn ở đây, chỉ việc copy:

| Cần gì | Copy dòng này |
|---|---|
| Tên app | `Drive Ebook Reader` |
| Trang giới thiệu (homepage) | `https://lanhmar.id.vn/drive-ebook-reader.html` |
| Chính sách quyền riêng tư | `https://lanhmar.id.vn/drive-ebook-reader-privacy.html` |
| Tên miền được uỷ quyền | `lanhmar.id.vn` |
| Logo 120×120 | tải tại `https://lanhmar.id.vn/assets/img/drive-ebook-reader-logo-120.png` (bấm chuột phải → Save image as) |
| Scope duy nhất | `https://www.googleapis.com/auth/drive.readonly` |
| ID extension | `bijcnaofiojlemmbghgcljfekdaoghbf` |

> Nếu màn hình của bạn khác mô tả (Google đổi giao diện khá thường xuyên), chụp ảnh màn hình gửi mình, đừng đoán.

---

## Bước 1 · Chứng minh bạn sở hữu tên miền lanhmar.id.vn (10–30 phút)

Google chỉ chấp nhận trang giới thiệu và chính sách nằm trên tên miền **do chính tài khoản Google của bạn** xác nhận sở hữu. Việc này làm trong Google Search Console.

1. Vào https://search.google.com/search-console, đăng nhập **đúng Gmail đang giữ project Drive Ebook Reader**.
2. Bấm ô chọn ở góc trên trái (hoặc nút **Add property / Thêm tài sản**). Hiện hai cột:
   - Cột trái **Domain / Miền**: gõ `lanhmar.id.vn` → **Continue**.
3. Google hiện một đoạn chữ bắt đầu bằng `google-site-verification=…` kèm nút **Copy**. Đây là "bản ghi TXT". Giữ nguyên cửa sổ này.
4. Mở tab mới, đăng nhập vào **nơi bạn đã đăng ký tên miền lanhmar.id.vn** (ví dụ iNET, Tenten, Mắt Bão, PA Vietnam, Nhân Hoà… nơi bạn nhận được email lúc đăng ký tên miền). Tìm mục **Quản lý DNS / DNS Records / Bản ghi DNS**.
5. Bấm **Thêm bản ghi** và điền:
   - Loại (Type): **TXT**
   - Tên / Host: `@` (hoặc để trống, hoặc `lanhmar.id.vn` tuỳ giao diện)
   - Giá trị (Value): dán đoạn `google-site-verification=…` ở bước 3
   - TTL: để mặc định
   Bấm Lưu.
6. Quay lại Search Console, bấm **Verify / Xác minh**. Nếu báo chưa thấy, chờ 10–60 phút rồi bấm lại (DNS cần thời gian lan truyền, có khi tới vài giờ).
7. Thấy **Ownership verified / Đã xác minh quyền sở hữu** là xong.

**Không vào được chỗ quản lý DNS?** Làm cách B: ở bước 2 chọn cột phải **URL prefix**, gõ `https://lanhmar.id.vn/` → chọn phương thức **HTML file** → tải file `google…….html` về → gửi file đó cho mình (dán nội dung vào chat cũng được). Mình đưa file lên web, bạn bấm Verify.

---

## Bước 2 · Điền thông tin thương hiệu (Branding) (10 phút)

1. Vào https://console.cloud.google.com, kiểm tra ô chọn project ở thanh trên cùng đang là project bạn đã tạo cho extension (tên gợi ý lúc trước: `drive-ebook-reader`).
2. Vào https://console.cloud.google.com/auth/branding (menu trái: **APIs & Services → OAuth consent screen**, hoặc **Google Auth Platform → Branding**).
3. Điền lần lượt:
   - **App name**: `Drive Ebook Reader`
   - **User support email**: chọn Gmail của bạn trong danh sách
   - **App logo**: bấm Browse, chọn file logo 120×120 đã tải về
   - **App home page**: `https://lanhmar.id.vn/drive-ebook-reader.html`
   - **App privacy policy link**: `https://lanhmar.id.vn/drive-ebook-reader-privacy.html`
   - **App terms of service link**: để trống
   - **Authorized domains**: bấm **Add domain**, gõ `lanhmar.id.vn`
   - **Developer contact information**: Gmail của bạn
4. Bấm **Save**. Nếu Google báo lỗi ở dòng Authorized domains "domain not verified", nghĩa là bước 1 chưa xong hoặc bạn đang đăng nhập Gmail khác với Gmail đã xác minh Search Console.

Lưu ý: vừa thêm logo, Google có thể hiện thông báo *"Your app will require verification"*. Đúng rồi, đó là việc ta sắp làm.

---

## Bước 3 · Kiểm tra quyền truy cập dữ liệu (Data Access) (3 phút)

1. Vào https://console.cloud.google.com/auth/scopes (menu **Google Auth Platform → Data Access**).
2. Bấm **Add or remove scopes**. Trong ô lọc gõ `drive.readonly`. Tích đúng dòng
   `…/auth/drive.readonly` — mô tả "See and download all your Google Drive files".
3. Bỏ tích mọi dòng khác nếu có. Bấm **Update** rồi **Save**.
4. Màn hình sẽ xếp scope này vào mục **Restricted scopes**. Đúng như mong đợi.

---

## Bước 4 · Bấm Publish app (2 phút)

1. Vào https://console.cloud.google.com/auth/audience (menu **Google Auth Platform → Audience**).
2. Dòng **Publishing status** đang là **Testing**. Bấm **Publish app** → hộp thoại hiện danh sách những việc cần xác minh → bấm **Confirm**.
3. Trạng thái đổi thành **In production**.

Từ lúc này: bạn bè tải ZIP về đều đăng nhập được, không cần nằm trong danh sách Test users nữa, và không còn bị hết hạn đăng nhập sau 7 ngày. Họ vẫn thấy một màn hình cảnh báo "Google hasn't verified this app" cho tới khi Google duyệt xong; họ bấm **Advanced** → **Go to Drive Ebook Reader (unsafe)** là vào được. Cảnh báo này không có nghĩa là extension nguy hiểm, chỉ là Google chưa xem hồ sơ.

---

## Bước 5 · Quay video demo (30–45 phút, quay thử 1–2 lần)

Google đòi một video cho thấy toàn bộ luồng đăng nhập và cách extension dùng dữ liệu. Không cần đẹp, cần **rõ và đủ cảnh**.

### Chuẩn bị
- Dùng Chrome. Vào `chrome://settings/languages`, đưa **English (United States)** lên đầu và chọn "Display Google Chrome in this language", khởi động lại Chrome. Mọi chữ của extension và của Google sẽ thành tiếng Anh, Google dễ chấm.
- Vào https://myaccount.google.com/permissions, nếu đã có mục Drive Ebook Reader thì bấm **Remove access**, để lúc quay sẽ hiện lại màn hình xin quyền.
- Chuẩn bị trên Drive: một PDF lớn (trên 100 MB càng tốt), một thư mục có vài PDF/EPUB, một Google Docs.
- Công cụ quay màn hình trên Windows: bấm **Windows + Alt + R** (Xbox Game Bar) để bắt đầu/dừng; hoặc dùng OBS. Trên Mac: **Shift + Command + 5**. Bật micro nếu bạn đọc lời dẫn; không thích nói thì để im, sau đó thêm phụ đề trên YouTube hoặc đơn giản là gõ lời dẫn vào Notepad hiện bên cạnh.

### 9 cảnh, đọc đúng câu tiếng Anh (bên phải là nghĩa, không cần đọc)

| # | Làm gì trên màn hình | Câu đọc (tiếng Anh) | Nghĩa |
|---|---|---|---|
| 1 | Mở `chrome://extensions`, rê chuột vào thẻ Drive Ebook Reader cho thấy ID `bijcnaofiojlemmbghgcljfekdaoghbf` | "This is the Drive Ebook Reader extension. Its ID matches the OAuth client." | Đây là extension, ID khớp với client OAuth |
| 2 | Mở drive.google.com, bấm vào PDF lớn. Drive báo không xem trước được. Chỉ vào nút tím góc dưới phải | "Drive cannot preview this large PDF. The extension adds a button: Read without downloading." | Drive không xem trước được, extension thêm nút |
| 3 | Bấm nút. Màn hình Google hiện ra: chọn tài khoản → (nếu có) cảnh báo unverified, bấm Advanced → Go to… → màn hình xin quyền "See and download all your Google Drive files" → bấm **Allow**. Quay chậm, đừng cắt | "The extension asks for read-only access to Drive. This is the only scope it requests." | Extension xin quyền chỉ đọc, scope duy nhất |
| 4 | Trang đọc mở. Chỉ vào dòng "Fetched x MB / y MB" ở thanh trên. Cuộn vài trang, nhảy tới trang xa, con số tăng từ từ | "The file opens immediately. The top bar shows how much data was actually fetched: only the pages being viewed, requested with HTTP Range headers. Nothing is downloaded to disk." | Chỉ nạp phần đang xem, không tải xuống đĩa |
| 5 | Bấm nút ⧉ (Mở file khác), dán link **thư mục** Drive, bấm Open. Danh sách hiện ra, bấm một cuốn | "Pasting a folder link lists the files in that folder, using files.list once, so the user can pick a book." | Dán link thư mục để chọn sách |
| 6 | Dán link một Google Docs | "Google Docs are exported to PDF through the Drive API and displayed." | Google Docs xuất PDF rồi hiển thị |
| 7 | Mở thư mục Downloads của máy, sắp xếp theo ngày | "The Downloads folder has no new files. The extension never writes file content to disk and has no server." | Không có file mới, không máy chủ |
| 8 | Mở `https://lanhmar.id.vn/drive-ebook-reader-privacy.html?lang=en`, cuộn tới khung cam Limited Use | "This is the privacy policy linked from the consent screen and the homepage, including the Limited Use disclosure." | Chính sách riêng tư, có Limited Use |
| 9 | Mở https://myaccount.google.com/permissions, chỉ vào mục Drive Ebook Reader | "Users can revoke access at any time here." | Người dùng thu hồi quyền ở đây |

Độ dài khoảng 3–5 phút. Quay xong, xem lại một lần: cảnh 3 phải thấy rõ tên app và dòng scope.

### Đưa lên YouTube
1. Vào https://studio.youtube.com → **Create → Upload videos** → chọn file.
2. Tiêu đề: `Drive Ebook Reader – OAuth verification demo`. Mục **Audience**: chọn *No, it's not made for kids*.
3. Ở bước **Visibility** chọn **Unlisted** (không công khai, ai có link mới xem). Bấm Save, copy link video.

---

## Bước 6 · Nộp hồ sơ xác minh (15 phút)

1. Vào https://console.cloud.google.com/auth/verification (menu **Google Auth Platform → Verification Center**). Bấm **Prepare for verification** hoặc **Start verification**.
2. Google kiểm tra lại Branding; thiếu gì sẽ báo đỏ, quay lại Bước 2 sửa.
3. Tới phần **Scopes justification** (giải trình scope): dán nguyên đoạn tiếng Anh dưới đây.

```
Drive Ebook Reader is a free, open-source Chrome/Edge extension (source: https://github.com/thecoolestmarperindawurl/lanhmar-hub/tree/main/extensions/drive-ebook-reader) that lets a user read large PDF and EPUB files, and Google Docs/Slides, that are stored in their own Google Drive, directly in the browser without downloading the whole file.

Why drive.readonly is required:
1. The user opens an EXISTING file that the extension did not create, by clicking a button on the Drive web page of that file, by pasting a Drive link, or by picking it from a folder listing. The extension then calls files.get (metadata: name, mimeType, size, parents, webViewLink) and files.get?alt=media with an HTTP Range header to fetch only the byte ranges PDF.js needs for the pages currently on screen. For EPUB the file is loaded into memory; for Google Docs/Slides files.export to PDF is used.
2. When the user opens a folder link, files.list with "'<folderId>' in parents" is called once so the user can pick a book.
3. drive.file is not sufficient: it only grants access to files created or explicitly opened through the app via the Google Picker, and the Google Picker JavaScript (apis.google.com) cannot be loaded inside a Manifest V3 extension page because remote code is prohibited. drive.metadata.readonly cannot download file content. drive.readonly is therefore the narrowest scope that allows reading the content of a user-selected existing file.

Data handling: file bytes are kept only in the memory of the browser tab while reading and are never written to disk, never sent to any server (there is no backend), never shared with third parties, and never used for advertising or model training. Only the file ID with the last reading position, font size and theme are stored locally in chrome.storage.local. The extension never creates, modifies, deletes or shares files. Privacy policy: https://lanhmar.id.vn/drive-ebook-reader-privacy.html
```

4. **Demo video**: dán link YouTube Unlisted.
5. Các câu hỏi dạng Có/Không, trả lời đúng như sau:
   - Dùng dữ liệu Google cho quảng cáo? **No**
   - Bán hoặc chuyển dữ liệu cho bên thứ ba? **No**
   - Có người (nhân viên) đọc dữ liệu người dùng? **No**
   - App chỉ dùng nội bộ/cá nhân? **No** (đã công bố trên lanhmar.id.vn)
   - Có lưu dữ liệu Google trên máy chủ? **No** (không có máy chủ)
6. Bấm **Submit for verification**. Bạn nhận email xác nhận ở Gmail đã khai là Developer contact.

---

## Bước 7 · Sau khi nộp: đọc email của Google và trả lời

Google trả lời bằng email từ địa chỉ có đuôi `@google.com`, tiêu đề thường có "OAuth verification". Luôn **trả lời ngay trong email đó** (Reply), không tạo yêu cầu mới. Các tình huống hay gặp và mẫu trả lời (tiếng Anh, chỉ cần dán):

**a) Họ yêu cầu video rõ hơn ở màn hình consent**
```
Hello, thank you for the review. I have re-recorded the demo so that the OAuth consent screen (app name "Drive Ebook Reader" and the drive.readonly scope) is shown in full, followed by how the extension uses the scope. New video: <link>. Best regards, Lan Anh
```

**b) Họ hỏi vì sao không dùng drive.file**
```
Hello, drive.file only covers files created by the app or chosen through the Google Picker. Our users open existing files directly from their Drive web page or a Drive link, and the Google Picker script (apis.google.com) cannot be loaded in a Manifest V3 extension page because remote code is not allowed. The extension only reads the single file the user selected (and a folder listing when the user opens a folder). Full justification is in our submission. Best regards, Lan Anh
```

**c) Họ yêu cầu homepage hoặc privacy policy chỉnh sửa**
→ chuyển email cho mình, mình sửa trang trong ngày, bạn trả lời: `Hello, the page has been updated as requested: <link>. Best regards, Lan Anh`

**d) Họ báo cần Security Assessment (CASA)**
→ đây là bước cuối cho scope hạn chế, xem Bước 8.

Thời gian: xác minh thương hiệu 2–3 ngày làm việc; xác minh scope thường 1–3 tuần, có thể qua lại email 2–3 lần.

---

## Bước 8 · Đánh giá bảo mật CASA (chỉ khi Google yêu cầu)

Vì `drive.readonly` là scope hạn chế, Google sẽ yêu cầu một bản **đánh giá bảo mật (CASA Tier 2)**, làm lại mỗi năm. Email của Google sẽ dẫn tới trang chọn đơn vị đánh giá.

- Có đơn vị cho tự quét miễn phí hoặc phí thấp với ứng dụng nhỏ, có đơn vị tính vài trăm tới vài nghìn USD. Con số chính xác thay đổi theo năm, nên khi nhận email **hãy chuyển cho mình** để cùng chọn phương án rẻ nhất.
- Ứng dụng của mình không có máy chủ, không lưu dữ liệu, mã mở: đây là trường hợp dễ qua nhất.
- Nếu chi phí không hợp lý: có phương án đổi sang quyền `drive.file` (không cần CASA, không cần xác minh scope). Đổi lại, người dùng phải chọn lại file qua cửa sổ Google Picker một lần cho mỗi cuốn, và mất tính năng dán link thư mục. Mình làm được trong một PR, bạn chỉ cần quyết định.

---

## Tóm tắt một trang

| Bước | Ở đâu | Mất | Kết quả cần thấy |
|---|---|---|---|
| 1 | Search Console + chỗ quản lý tên miền | 10–30 phút + chờ DNS | "Ownership verified" |
| 2 | Cloud Console → Branding | 10 phút | Save thành công, không báo đỏ |
| 3 | Cloud Console → Data Access | 3 phút | Chỉ còn `drive.readonly` |
| 4 | Cloud Console → Audience → Publish app | 2 phút | "In production" |
| 5 | Quay video 9 cảnh, YouTube Unlisted | 30–45 phút | Link video |
| 6 | Cloud Console → Verification Center | 15 phút | Email xác nhận đã nộp |
| 7 | Gmail | theo email | Trả lời theo mẫu |
| 8 | Theo email của Google | khi được yêu cầu | Quyết định CASA hay drive.file |

Kẹt ở đâu, chụp màn hình gửi mình kèm số bước.
