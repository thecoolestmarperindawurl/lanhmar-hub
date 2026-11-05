# lanhmar-hub — ghi chú cho Claude Code

Website tĩnh (GitHub Pages, nhánh `main` → https://lanhmar.id.vn). Không có bước build: sửa file là xong, merge vào `main` là lên web (1–2 phút).
Thiết kế theo brand LANHMAR (skill `lanhmar-brand-guideline`): màu tím `#2D2FEF` / cam `#FF7A45`, font Montserrat, bo tròn, bóng ngả tím, xưng "mình".

## Trước khi push: kiểm tra PR của nhánh đã merge chưa

Nếu PR của nhánh đã merge, **không push thêm commit vào nhánh đó** (PR đã merge không nhận thêm). Gộp `origin/main` vào nhánh, kiểm tra xung đột, rồi mở PR mới.

## Song ngữ VI/EN — BẮT BUỘC khi thêm hoặc sửa dữ liệu

Người xem chọn VI/EN một lần (localStorage `lm_lang`), mọi trang đổi theo (`lang.js` cho Kho/Storage, `site.js`/`community.js` cho trang chủ/Cộng đồng). **Mỗi dữ liệu mới phải có bản tiếng Anh trong cùng commit.**

| Thêm/sửa ở (VI) | Thì thêm bản EN ở | Ghi chú |
|---|---|---|
| `kho-featured.json` (thẻ nổi bật, Kho Ứng dụng) | `kho-en.js` → `KHO_EN.items["<id>"] = { title, note, type, status? }` **và** `i18n/featured-en.json["<id>"]` = bản sao thẻ đã dịch toàn bộ (`sections`, `cta`…, cùng cấu trúc, giữ nguyên link/ảnh/lệnh/tên riêng) | Không đặt `_en` trong `kho-featured.json` — hệ không đọc. Mẫu: `tool-ai-convert` |
| `kho-data.js` (`KHO`: tên kho, mục con, kệ, intro) | `kho-en.js` → `KHO_EN.kho[<id>]` (`name`, `desc`, `headline`, `groups{}`, `shelves{id:[name, sub]}`, `intro{text, rows[], head, btn}`) | |
| Tag tiếng Việt mới | `kho-en.js` → `KHO_EN.tags` | tag đã là tiếng Anh thì không cần |
| `community-data.js` | trường `x_en` cạnh `x` (`desc_en`, `topics_en`, `role_en`, `bio_en`, `points_en`, `tags_en`, `t_en`, `d_en`, `name_en` cho người nếu muốn tên khác) | |
| `assets/content.json` (trang chủ) | cặp `x_vi` / `x_en` | |
| Chữ cố định của khung trang | từ điển trong `storage.js` (`STR`), `kho.js`, `resource.js` (`T(vi, en)`), `site.js`/`community.js`/`ai-convert.js` (`I18N`) | thêm chữ mới thì thêm cả hai ngôn ngữ |

Quy trình: viết VI → viết EN (dịch tự nhiên, tên riêng giữ nguyên) → `node tools/i18n-check.mjs` phải báo "Song ngữ đủ" (GitHub Actions cũng chạy ở mỗi PR; thiếu là PR đỏ) → tăng `?v=` của file `.js`/`.css`/`.json` vừa sửa trong HTML.

Tồn đọng cũ (nếu có) nằm trong `tools/i18n-baseline.json`; `--all` để xem, dịch xong chạy `--baseline` để thu nhỏ.

## Thêm thẻ vào Kho Ứng dụng

Mục trong `kho-featured.json` với `kho: "idea"`, `shelf` (id kệ trong `KHO.idea.shelves`), `status`, `thumb` (ảnh 960×504 trong `assets/res/`), `sections` (khối `callout`, `h`, `p`, `table`, `steps`, `list`, `cards`, `code`, `links`), `cta`. Rồi thêm EN theo bảng trên.

## Khoá học LMS

`python3 tools/lms-to-card.py file.html --url … --add` sinh thẻ khoá học vào `kho-featured.json`; sau đó thêm EN vào `kho-en.js` và `i18n/featured-en.json`.

## Kiểm tra trước khi push

- `node --check` cho file JS đã sửa; `node tools/i18n-check.mjs`.
- Mở thử bằng Playwright/Chromium khi đổi giao diện. Kho/Storage cần đăng nhập nên test qua trang thử gọi `Res.appShelf` / `Res.open`, hoặc mở `#app` bằng `evaluate`.
- Favicon dùng chung: `assets/img/favicon.svg` (+ PNG 32/192, apple-touch 180).
