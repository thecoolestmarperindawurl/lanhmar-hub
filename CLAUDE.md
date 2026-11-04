# lanhmar-hub — ghi chú cho Claude Code

Website tĩnh (GitHub Pages, nhánh `main` → https://lanhmar.id.vn). Không có bước build: sửa file là xong, merge vào `main` là lên web.
Thiết kế theo brand LANHMAR (skill `lanhmar-brand-guideline`): màu tím `#2D2FEF` / cam `#FF7A45`, font Montserrat, bo tròn, bóng ngả tím, xưng "mình".

## Song ngữ VI/EN — BẮT BUỘC khi thêm hoặc sửa dữ liệu

Người xem chọn VI/EN một lần (localStorage `lm_lang`), mọi trang đổi theo. Vì vậy **mỗi dữ liệu mới đưa lên web phải có sẵn bản tiếng Anh** ngay trong cùng commit.

| File dữ liệu | Hiển thị ở | Quy ước |
|---|---|---|
| `kho-featured.json` | Kho cá nhân, Data Storage (thẻ nổi bật, Kho Ứng dụng) | trường `x` → thêm `x_en` cạnh nó, ở mọi độ sâu (`title_en`, `note_en`, `sections[].t_en`, `rows_en`, `items_en`, `cta.btn_en`…) |
| `kho-data.js` (`window.KHO`) | tên kho, mục con, kệ, intro | `name_en`, `desc_en`, `sub_en`, `headline_en`, `intro.text_en/rows_en/btn_en` |
| `community-data.js` | trang Cộng đồng | `desc_en`, `topics_en`, `role_en`, `bio_en`, `points_en`, `tags_en`, `t_en`, `d_en` |
| `assets/content.json` | trang chủ | cặp `x_vi` / `x_en` |

Cơ chế: `resource.js` (hàm `loc`) thay `x` bằng `x_en` khi chọn EN; thiếu `_en` thì rơi về tiếng Việt (không lỗi, nhưng trang bị lẫn ngôn ngữ).
Chữ cố định của khung trang nằm trong từ điển: `resource.js` (`UI`), `kho.js` (`KHO_UI`), `ai-convert.js` (`I18N`), `community.js` / `site.js` (`I18N`). Thêm chữ mới thì thêm cả hai ngôn ngữ.

Quy trình mỗi lần thêm dữ liệu:
1. Viết bản tiếng Việt, rồi viết luôn bản `_en` tương ứng (dịch tự nhiên, không máy móc; tên riêng giữ nguyên).
2. Chạy `node tools/i18n-check.mjs` — phải báo "Song ngữ đủ". Lệnh này cũng chạy trên GitHub Actions ở mỗi PR; thiếu `_en` là PR đỏ.
3. Nếu sửa file `.js`/`.css` có `?v=` trong HTML, tăng số phiên bản để trình duyệt không dùng bản cũ.

Dịch tồn đọng cũ: `node tools/i18n-check.mjs --all` liệt kê; `--todo i18n-todo.json` xuất danh sách để điền `en`, `--apply i18n-todo.json` ghi vào file `.json`; dịch xong chạy `--baseline` để thu nhỏ `tools/i18n-baseline.json`.

## Thêm thẻ vào Kho Ứng dụng

Mục trong `kho-featured.json` với `kho: "idea"`, `shelf` (id kệ trong `KHO.idea.shelves`), `status`, `thumb` (ảnh 960×504 trong `assets/res/`), `sections` (các khối `callout`, `h`, `p`, `table`, `steps`, `list`, `cards`, `code`, `links`), `cta`. Mẫu đầy đủ song ngữ: thẻ `tool-ai-convert`.

## Khoá học LMS

`python3 tools/lms-to-card.py file.html --url … --add` sinh thẻ khoá học (đã có `_en` cho phần cố định; tiêu đề/nội dung khoá cần dịch tay rồi chạy kiểm tra).

## Kiểm tra trước khi push

- `node --check` cho file JS đã sửa; `node tools/i18n-check.mjs`.
- Mở thử bằng Playwright/Chromium khi đổi giao diện (Kho cần đăng nhập Google của chủ kho nên test qua trang thử gọi `Res.appShelf` / `Res.open`).
