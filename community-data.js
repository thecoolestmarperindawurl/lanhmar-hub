/* Danh sách nhóm cộng đồng hiển thị ở community.html.
   Thêm nhóm mới: thêm một mục vào mảng bên dưới.
   - url: link tham gia (phải bắt đầu bằng https://). Để trống thì nút hiện "Link đang cập nhật".
   - platform: Facebook, Zalo, Telegram, Discord...
   - members: số thành viên (chữ, ví dụ "2,4 nghìn"). Để trống nếu chưa muốn hiện.
   - topics: tối đa 5 chủ đề ngắn. status: "open" hoặc "soon".
   - feature: true để hiện thêm phần giới thiệu chi tiết (moderator, chuyên gia, thành viên) bên dưới danh sách.
   - experts: danh sách chuyên gia đang hoạt động. Mỗi người: name, role, bio, points (mảng gạch đầu dòng), links [{t,u}].
     Đặt show:false để ẩn một chuyên gia cho tới khi điền xong thông tin. Chỉ ghi những gì đã xác minh. */
window.COMMUNITIES = [
  {
    id: "di-lam-voi-ai",
    name: "Đi làm với AI",
    platform: "Facebook",
    url: "https://www.facebook.com/groups/dilamvoiai",
    members: "",
    status: "open",
    feature: true,
    desc: "Nhóm Facebook cho người đi làm ứng dụng AI vào workflow hằng ngày: có chuyên gia về AI và tự động hoá, chủ doanh nghiệp và người đi làm cùng chia sẻ cách làm thực tế.",
    topics: ["AI trong workflow", "AI Agent", "Tự động hoá", "Vận hành SME với AI", "Hỏi đáp"],
    moderator: { name: "Dương Thị Lan Anh", role: "Moderator của nhóm, Digital Marketer (LANHMAR)", u: "index.html" },
    members_kinds: [
      { t: "Chuyên gia AI và tự động hoá", d: "Những người làm nghề tư vấn, đào tạo và xây hệ thống AI, chia sẻ phương pháp và công cụ." },
      { t: "Chủ doanh nghiệp", d: "Người đang đưa AI vào vận hành doanh nghiệp, kể rõ việc đã làm và kết quả." },
      { t: "Người đi làm", d: "Người dùng AI trong công việc hằng ngày, chia sẻ quy trình, mẫu prompt và bài học." }
    ],
    experts: [
      {
        name: "Hưng Kescy",
        role: "CEO & Founder KesFlow. Tư vấn, đào tạo AI Automation cho doanh nghiệp",
        bio: "Tên thật Đinh Tiến Hưng. Đứng lớp, đào tạo nội bộ và tư vấn vận hành cho doanh nghiệp Việt, theo nguyên tắc chọn đúng việc đáng làm trước, tối ưu công cụ sau.",
        points: [
          "2900+ học viên đã qua các lớp (trong đó 200+ chủ doanh nghiệp); 700+ chủ doanh nghiệp dự workshop, webinar; 10+ doanh nghiệp đã đào tạo nội bộ",
          "Lớp Teamwork với AI: khoá 6 buổi cho chủ doanh nghiệp và quản lý, đã chạy tới khoá 04",
          "Đồng tổ chức AI Agent K1 cùng Vườn Ươm Khu Phố: 6 buổi online, gần 600 học viên, điểm kiến thức giảng viên 4,81/5 (501 phản hồi)",
          "Giảng viên khách mời phần AI Agent, lớp Fullstack Marketing (Vườn Ươm Khu Phố, hơn 1800 học viên): 4,93/5 (349 phản hồi)",
          "Giảng viên workshop Agent Boss: AI Agent cho Marketer",
          "Tác giả bộ skill cho Claude (brainstorm, kf-plan, kes-create-skill, kf-cl-design-init...)"
        ],
        links: [{ t: "hungkescy.com", u: "https://hungkescy.com/" }, { t: "KesFlow", u: "https://kesflow.vn/" }, { t: "Facebook", u: "https://fb.com/kescyz" }]
      },
      {
        name: "Duy Cù",
        role: "Chuyên gia đang hoạt động trong nhóm",
        bio: "",
        points: [],
        links: [{ t: "duycuf.vn", u: "https://www.duycuf.vn/" }]
      }
    ]
  }
];
