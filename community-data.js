/* Danh sách nhóm cộng đồng hiển thị ở community.html.
   Thêm nhóm mới: thêm một mục vào mảng bên dưới.
   - url: link tham gia (phải bắt đầu bằng https://). Để trống thì nút hiện "Link đang cập nhật".
   - platform: Facebook, Zalo, Telegram, Discord...
   - members: số thành viên (chữ, ví dụ "2,4 nghìn"). Để trống nếu chưa muốn hiện.
   - topics: tối đa 5 chủ đề ngắn.
   - status: "open" (đang mở) hoặc "soon" (sắp mở).
   Mô tả và chủ đề của nhóm "Đi làm với AI" bên dưới là bản nháp, hãy sửa theo nội dung nhóm thật. */
window.COMMUNITIES = [
  {
    id: "di-lam-voi-ai",
    name: "Đi làm với AI",
    platform: "Facebook",
    url: "",
    members: "",
    status: "open",
    desc: "Nhóm cho người đi làm muốn dùng AI vào công việc hằng ngày: chia sẻ cách làm, công cụ, mẫu prompt và kinh nghiệm thực tế.",
    topics: ["Dùng AI trong công việc", "Công cụ và prompt", "AI Agent", "Hỏi đáp"]
  }
];
