# AI Convert · File → Markdown cho AI

**VI** — Thả PDF, Word, Excel, PowerPoint, HTML hay file code vào trang, nhận **Markdown sạch** để Claude, ChatGPT, Cursor… đọc nhanh hơn và tốn ít token hơn. **Chạy hoàn toàn trong trình duyệt của bạn, file không được gửi đi đâu.** Không cần cài đặt, không cần tài khoản.

**EN** — Drop PDF, Word, Excel, PowerPoint, HTML or code files onto the page and get **clean Markdown** that Claude, ChatGPT and Cursor read faster with fewer tokens. **Runs entirely in your browser; your files are never sent anywhere.** No install, no account.

## Dùng nhanh / Quick start

Chọn một cách / pick one:

1. **Mở thẳng trên máy (offline) / Open locally (offline).** Bấm **Code → Download ZIP**, giải nén, mở file `index.html` bằng Chrome/Edge/Firefox. Các thư viện đọc file đã nằm sẵn trong thư mục `vendor/`, không cần Internet. / Click **Code → Download ZIP**, unzip, open `index.html`. The file-reading libraries are bundled in `vendor/`, so no Internet is needed.
2. **Dùng trên web (GitHub Pages) / Use on the web.** Vào **Settings → Pages**, chọn nhánh `main`, thư mục `/ (root)`, bấm Save. Sau 1–2 phút trang chạy tại `https://<tên-tài-khoản>.github.io/<tên-repo>/`. / Go to **Settings → Pages**, pick branch `main`, folder `/ (root)`, Save. The page goes live in 1–2 minutes at `https://<user>.github.io/<repo>/`.

## Cách dùng / How to use

1. Kéo nhiều file vào ô, chỉnh tuỳ chọn làm sạch nếu cần (bỏ header/footer lặp, giới hạn dòng Excel, chia đoạn theo token…). / Drag several files in, adjust the clean-up options if needed.
2. Xem kết quả từng file: loại file, số trang/slide/sheet, ước tính token. / Check each result: type, page/slide/sheet count, token estimate.
3. Copy tất cả để dán vào chat, tải `context.md`, hoặc tải `.zip` gồm từng file kèm `INDEX.md`. / Copy all to paste into chat, download `context.md`, or a `.zip` with every file plus `INDEX.md`.

## Đọc được những gì / What it reads

| Loại file / Type | Làm gì / What it does |
|---|---|
| PDF | Ghép chữ thành đoạn, nhận tiêu đề theo cỡ chữ, bỏ header/footer lặp và số trang; báo khi là bản scan không có chữ / Joins text into paragraphs, detects headings by font size, drops repeated headers/footers; warns on scanned PDFs |
| Word (.docx) | Giữ tiêu đề, danh sách, bảng; bỏ ảnh / Keeps headings, lists, tables; drops images |
| Excel, CSV | Mỗi sheet thành một bảng Markdown, bỏ dòng/cột trống, giới hạn số dòng / Each sheet becomes a Markdown table, empty rows/columns removed, row limit |
| PowerPoint (.pptx) | Mỗi slide một mục, giữ cấp ý, bảng, ghi chú người thuyết trình / One section per slide, keeps bullet levels, tables, speaker notes |
| HTML, TXT, JSON, code | Bỏ menu/script; file code được bọc đúng ngôn ngữ / Strips menus/scripts; code files fenced with the right language |

Số token chỉ là ước tính thô (ký tự ÷ 4, tiếng Việt có dấu ÷ 3) để so sánh. / Token counts are rough estimates for comparison only.

## Dùng trong vibe code / For vibe coding

Giải nén `.zip` vào `docs/context/` của dự án, rồi thêm vào `CLAUDE.md` (hoặc `.cursorrules`): *"Tài liệu tham khảo ở docs/context/, đọc INDEX.md trước."* / Unzip into your project's `docs/context/` and add to `CLAUDE.md`: *"Reference docs live in docs/context/, read INDEX.md first."*

## Bản dòng lệnh / Command-line version

Chuyển cả thư mục tài liệu cùng lúc / convert a whole folder at once:

```bash
pip install "markitdown[pdf,docx,xlsx,pptx]"
python3 to-md.py tai-lieu/ -o docs/context
python3 to-md.py tai-lieu/ --chunk 8000   # chia file dài / split long files
```

## Quyền riêng tư / Privacy

- Trang không có máy chủ, không tải file của bạn lên đâu, không theo dõi. / No server, no upload, no tracking.
- Thư viện nằm sẵn trong `vendor/`. Nếu một thư viện không tải được, trang thử lấy bản cùng phiên bản từ CDN công khai (cdnjs, jsDelivr); chỉ có mã thư viện được tải về, nội dung file của bạn không đi đâu. / Libraries are bundled in `vendor/`. If one fails to load the page falls back to the same version from a public CDN; only library code is fetched, never your files.
- Phông chữ Montserrat tải từ Google Fonts khi có mạng; offline trang dùng phông hệ thống. / The Montserrat font loads from Google Fonts when online; offline the page uses a system font.

## Giấy phép / License

Mã của AI Convert: **PolyForm Noncommercial 1.0.0** (xem `LICENSE`): dùng tự do cho học tập, nghiên cứu, dự án cá nhân, tổ chức phi lợi nhuận; không dùng thương mại. Thư viện bên thứ ba trong `vendor/` giữ giấy phép riêng, xem `THIRD-PARTY-NOTICES.md`. / AI Convert's own code is under PolyForm Noncommercial 1.0.0 (see `LICENSE`). Third-party libraries in `vendor/` keep their own licenses, see `THIRD-PARTY-NOTICES.md`.

Tác giả / Author: Dương Thị Lan Anh (LANHMAR) · https://lanhmar.id.vn
