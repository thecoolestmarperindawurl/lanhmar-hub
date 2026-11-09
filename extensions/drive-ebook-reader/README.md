# Drive Ebook Reader — LANHMAR

**VI** — Extension cho Chrome/Edge (Manifest V3) để **đọc PDF/EPUB dung lượng lớn lưu trên Google Drive ngay trong trình duyệt, không cần tải về máy**. Với PDF, extension chỉ nạp **đúng đoạn dữ liệu của trang đang xem** (HTTP Range request qua Drive API) nên file vài trăm MB, cả nghìn trang vẫn mở nhanh dù Drive báo "không xem trước được". Không có máy chủ trung gian: dữ liệu đi thẳng từ Google về trình duyệt của bạn.

**EN** — A Chrome/Edge extension (Manifest V3) to **read large PDF/EPUB files stored on Google Drive right in the browser, with no download to disk**. For PDFs it fetches **only the byte ranges of the pages you are looking at** (HTTP Range requests through the Drive API), so multi-hundred-MB, thousand-page files open quickly even when Drive says it cannot preview them. No middle server: data flows straight from Google to your browser.

## Tính năng / Features

| | VI | EN |
|---|---|---|
| 📄 PDF | Nạp theo đoạn 1 MB, render lười từng trang, phóng to/thu nhỏ, vừa chiều rộng, bôi đen & copy chữ, nhớ trang đang đọc | 1 MB range chunks, lazy page rendering, zoom, fit width, text selection & copy, remembers your page |
| 📚 EPUB | Mục lục, lật trang, đổi cỡ chữ, nhớ vị trí (nạp cả file vào RAM, không ghi xuống đĩa) | Table of contents, page turns, font size, remembers position (whole file loaded in RAM, nothing written to disk) |
| 📝 Google Docs/Slides | Xuất PDF qua Drive API rồi đọc | Exported to PDF through the Drive API, then read |
| 🎨 Giao diện | Sáng / sepia / tối; brand LANHMAR | Light / sepia / dark; LANHMAR brand |
| 🔘 Nút trên Drive | Mở file trên drive.google.com → nút tím "Đọc không cần tải" ở góc dưới phải | Open a file on drive.google.com → purple "Read without downloading" button bottom right |
| 💻 File trên máy | Cũng mở được PDF/EPUB từ máy (PDF đọc theo đoạn bằng `File.slice`) | Also opens local PDF/EPUB (PDF read in slices with `File.slice`) |

## Cài đặt / Install

Extension chưa đưa lên Chrome Web Store, nên cài theo kiểu "Load unpacked". / Not on the Chrome Web Store yet, so install it unpacked.

1. Tải thư mục này về máy (Code → Download ZIP rồi giải nén, hoặc `git clone`). / Get this folder onto your computer.
2. Mở `chrome://extensions` (Edge: `edge://extensions`), bật **Developer mode**. / Open the extensions page and turn on **Developer mode**.
3. Bấm **Load unpacked** → chọn thư mục `extensions/drive-ebook-reader`. / Click **Load unpacked** → pick this folder.
4. Ghi lại **ID** của extension (chuỗi 32 chữ cái dưới tên extension). Cần cho bước OAuth. / Note the extension **ID** (32 letters under its name). Needed for OAuth.

> Giữ nguyên vị trí thư mục sau khi cài: ID extension được tính từ đường dẫn thư mục, đổi chỗ là đổi ID và phải làm lại OAuth. / Keep the folder where it is: the extension ID is derived from the folder path; moving it changes the ID and breaks OAuth.

## Cài đặt OAuth (một lần, ~10 phút) / OAuth setup (once, ~10 min)

Extension gọi Google Drive API bằng tài khoản Google của chính bạn. Google yêu cầu mỗi ứng dụng có **OAuth Client ID** riêng, nên bạn tự tạo một cái (miễn phí). / The extension calls the Drive API as *you*. Google requires every app to have its own **OAuth Client ID**, so you create one (free).

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới (tên tuỳ ý, ví dụ `drive-ebook-reader`). / Create a new project.
2. **APIs & Services → Library** → tìm **Google Drive API** → **Enable**.
3. **APIs & Services → OAuth consent screen** → User type **External** → điền tên app + email → Save. Ở mục **Test users** thêm địa chỉ Gmail bạn sẽ dùng để đọc. Để trạng thái **Testing** là đủ cho dùng cá nhân. / Choose **External**, fill in name + email, add your own Gmail under **Test users**. Leaving it in **Testing** is enough for personal use.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** → Application type **Chrome Extension** → **Item ID** = ID extension ghi ở bước cài đặt → Create. Copy **Client ID** (dạng `xxxx.apps.googleusercontent.com`). / Application type **Chrome Extension**, Item ID = the extension ID, then copy the Client ID.
5. Mở `manifest.json`, thay `PASTE_YOUR_CLIENT_ID.apps.googleusercontent.com` bằng Client ID vừa copy, lưu, rồi bấm **Reload** (↻) ở trang extensions. / Paste the Client ID into `manifest.json` and reload the extension.
6. Lần đầu mở một file, Google hỏi cấp quyền "Xem các tệp trên Google Drive" (scope `drive.readonly`) → Cho phép. / The first time you open a file Google asks for read-only Drive access → Allow.

Chưa làm bước này thì trang đọc hiện hộp cam hướng dẫn, vẫn mở được file trên máy. / Until this is done the reader shows an orange setup box but still opens local files.

## Cách dùng / How to use

- Trên Drive, mở file PDF/EPUB (kể cả khi Drive báo không xem trước được) → bấm nút tím **Đọc không cần tải** góc dưới phải. / On Drive open the file (even when preview fails) → click the purple **Read without downloading** button.
- Hoặc bấm icon extension trên thanh công cụ: nếu tab hiện tại là một file Drive thì mở luôn, không thì hiện ô dán link. / Or click the toolbar icon: it opens the current Drive file, or shows a paste-link box.
- Phím tắt / keys: `←` `→` chuyển trang, `+` `−` phóng to/thu nhỏ (PDF), `Space`/`→` lật trang (EPUB).
- Thanh trên cùng hiện **"Đã nạp x MB / y MB"**: đó là lượng dữ liệu thật sự đã lấy về bộ nhớ, để bạn thấy mình không tải cả file. / The top bar shows how much has actually been fetched, so you can see the whole file is not downloaded.

## Cách hoạt động / How it works

```
drive.google.com  ──nút/button──▶  reader.html  ──Range: bytes=a-b──▶  www.googleapis.com/drive/v3/files/{id}?alt=media
                                        │
                                  PDF.js (PDFDataRangeTransport): chỉ xin đúng đoạn mà trang đang xem cần
```

- Đăng nhập qua `chrome.identity.getAuthToken` (tài khoản Chrome của bạn), scope chỉ đọc `drive.readonly`. / Sign-in through `chrome.identity`, read-only scope.
- PDF: `PDF.js` dùng một `PDFDataRangeTransport` tuỳ biến; mỗi lần cần dữ liệu nó gọi `fetch` với header `Range` tới Drive API và nhận `206 Partial Content`. Đoạn mặc định 1 MiB, `disableAutoFetch` bật nên không âm thầm tải nốt phần còn lại. / Custom `PDFDataRangeTransport`; each request sends a `Range` header and gets `206 Partial Content`. 1 MiB chunks, `disableAutoFetch` on so the rest is never fetched in the background.
- Chỉ render các trang gần vùng nhìn thấy; trang ở xa được giải phóng để tiết kiệm RAM. / Only pages near the viewport are rendered; far pages are released.
- EPUB là file zip nên phải nạp trọn vào bộ nhớ (thường vài MB), sau đó `epub.js` dựng sách. / EPUB is a zip, so it is loaded fully in memory (usually a few MB) and rendered with `epub.js`.
- Vị trí đọc, cỡ chữ, giao diện lưu trong `chrome.storage.local` của máy bạn. / Reading position, font size and theme live in `chrome.storage.local` on your machine.

## Giới hạn / Limitations

- Chỉ Chrome, Edge, Brave và các trình duyệt Chromium khác (Firefox dùng API đăng nhập khác). / Chromium browsers only.
- PDF có mật khẩu chưa hỗ trợ. / Password-protected PDFs are not supported.
- Lượng dữ liệu cần nạp lúc mở tuỳ cấu trúc PDF: thử nghiệm với PDF 24 MB do Chromium xuất, lần mở lấy ~3 MB và nhảy tới trang 20 lấy thêm ~4 MB; PDF "web-optimized" (linearized) còn nhẹ hơn. PDF mà từ điển trang rải khắp file (một số công cụ sinh PDF đơn giản) có thể phải chạm gần hết file ngay lần mở, dù vẫn không ghi xuống đĩa. / How much is fetched on open depends on the PDF's structure: with a 24 MB Chromium-made PDF, opening fetched ~3 MB and jumping to page 20 another ~4 MB; linearized PDFs need even less. PDFs whose page dictionaries are scattered through the file may need most of the file on first open, still without writing to disk.
- Google Docs xuất PDF qua Drive API bị Google giới hạn kích thước xuất; tài liệu quá dài có thể lỗi. / Docs export is size-limited by Google; very long documents may fail.
- OAuth ở trạng thái Testing chỉ cho tài khoản trong danh sách Test user dùng. Muốn chia sẻ rộng cần xác minh app với Google (scope `drive.readonly` thuộc nhóm restricted). / In Testing only listed test users can sign in; wider distribution needs Google app verification.

## Quyền riêng tư / Privacy

Không có máy chủ của LANHMAR ở giữa, không theo dõi, không gửi nội dung đi đâu. Extension chỉ nói chuyện với `www.googleapis.com` bằng token của bạn. / No LANHMAR server, no tracking, nothing is sent anywhere. The extension only talks to `www.googleapis.com` with your own token.

## Phát triển / Development

```bash
node --check reader.js background.js content.js
```

Thư viện trong `vendor/`: PDF.js 6.5.438 (Apache-2.0), epub.js 0.3.93 (BSD-2-Clause), JSZip 3.10.1 (MIT). Xem `THIRD-PARTY-NOTICES.md`. / Third-party libraries and licenses are listed in `THIRD-PARTY-NOTICES.md`.

Tác giả / Author: Dương Thị Lan Anh (LANHMAR) · https://lanhmar.id.vn
