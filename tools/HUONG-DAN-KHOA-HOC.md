# Quy trình lưu khoá học vào Kho Knowledge

Mỗi khoá học là một thẻ trong `kho-featured.json` (nhóm Academy của Kho Knowledge, mặc định `vuonuom`, đổi bằng `--group`) với cấu trúc: tổng quan, “Bạn sẽ học được gì”, các phần/module, từng bài kèm thời lượng.

## Cách nhanh: từ trang LMS
1. Mở khoá học trên LMS đã đăng nhập, cuộn tới mục **Nội dung khoá học** cho trang tải đủ, rồi **Lưu trang (Ctrl+S → Webpage, HTML only/Complete)**.
2. Chạy:
   ```
   python3 tools/lms-to-card.py khoa-hoc.html --url https://.../learn/8 --org "TÊN ĐƠN VỊ" --status "Đã học" --add
   ```
   Bỏ `--add` để chỉ xem trước JSON.
3. Tăng `?v=` trong `index.html`, `kho.html`, `storage.html`, rồi commit và push.
4. Script chỉ lấy tên khoá, mục “Bạn sẽ học được gì”, các phần và bài. Email tài khoản, link video không được đưa vào.

Nếu script báo “Không tìm thấy phần/bài nào”, trang dựng bằng JavaScript và file lưu bị trống: hãy lưu lại sau khi trang tải xong, hoặc gửi ảnh chụp mục lục để nhập tay.

## Cách thủ công (mẫu thẻ)
```json
{
  "id": "knowledge-ten-khoa-hoc",
  "kho": "knowledge", "group": "vuonuom", "guide": true,
  "date": "YYYY-MM-DD",
  "title": "Tên khoá (đơn vị)", "type": "Khoá học", "badge": "Đã học",
  "tags": ["khoá học"],
  "thumb": "assets/res/knowledge-courses.jpg",
  "note": "Một dòng tóm tắt: số phần, số bài, thời lượng.",
  "cta": { "title": "Tên khoá · LMS", "url": "https://...", "btn": "Mở khoá học (cần đăng nhập)" },
  "sections": [
    { "k": "callout", "t": "Đơn vị, số bài, tiến độ." },
    { "k": "h", "t": "Bạn sẽ học được gì" },
    { "k": "list", "items": ["..."] },
    { "k": "h", "t": "PHẦN 1 · Tên (8 bài · 20 giờ 31 phút)" },
    { "k": "steps", "items": [ { "t": "Buổi 1 · Tên bài", "d": "2:07:51" } ] }
  ]
}
```
Các kiểu mục dùng được: `callout`, `h`, `p`, `list`, `steps`, `table`, `cards`, `links`, `code`, `swatches`, `fontdemo`.

## Lưu ý
- Chỉ ghi dữ liệu có trong trang. Tổng thời lượng tự cộng thì phải ghi chú là tự tính.
- Không đưa email, mật khẩu, token, đường dẫn video riêng tư vào file.
