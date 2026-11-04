/* Danh sách nhóm cộng đồng hiển thị ở community.html.
   Thêm nhóm mới: thêm một mục vào mảng bên dưới.
   - url: link tham gia (phải bắt đầu bằng https://). Để trống thì nút hiện "Link đang cập nhật".
   - platform: Facebook, Zalo, Telegram, Discord...
   - members: số thành viên (chữ, ví dụ "2,4 nghìn"). Để trống nếu chưa muốn hiện.
   - topics: tối đa 5 chủ đề ngắn. status: "open" hoặc "soon".
   - feature: true để hiện thêm phần giới thiệu chi tiết (moderator, chuyên gia, thành viên) bên dưới danh sách.
   - experts: danh sách chuyên gia đang hoạt động. Mỗi người: name, role, bio, points (mảng gạch đầu dòng), links [{t,u}].
     Thêm (tuỳ chọn): alias, photo (ảnh dọc 4:5, đặt trong assets/img/experts/), org {name, logo}, stats [{n,t}] tối đa 3, tags.
     Đặt show:false để ẩn một chuyên gia cho tới khi điền xong thông tin. Chỉ ghi những gì đã xác minh.
     Nguồn: hungkescy.com và www.duycuf.vn (đọc ngày 04/11/2026). */
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
    moderator: { name: "Dương Thị Lan Anh", alias: "LANHMAR", role: "Moderator nhóm Đi làm với AI · Digital Marketer", photo: "assets/img/experts/lan-anh.webp", org: { name: "", logo: "assets/img/logo-lanhmar.png", logoOnly: true }, u: "index.html" },
    members_kinds: [
      { t: "Chuyên gia AI và tự động hoá", d: "Những người làm nghề tư vấn, đào tạo và xây hệ thống AI, chia sẻ phương pháp và công cụ." },
      { t: "Chủ doanh nghiệp", d: "Người đang đưa AI vào vận hành doanh nghiệp, kể rõ việc đã làm và kết quả." },
      { t: "Người đi làm", d: "Người dùng AI trong công việc hằng ngày, chia sẻ quy trình, mẫu prompt và bài học." }
    ],
    experts: [
      {
        name: "Hưng Kescy",
        alias: "Đinh Tiến Hưng",
        role: "CEO & Founder KesFlow · Tư vấn và đào tạo AI Automation cho doanh nghiệp",
        photo: "assets/img/experts/hung-kescy.webp",
        org: { name: "KesFlow", logo: "assets/img/logo-kesflow.svg" },
        bio: "Đứng lớp, đào tạo nội bộ và tư vấn vận hành cho doanh nghiệp Việt. Chọn đúng việc đáng làm trước, tối ưu công cụ sau.",
        stats: [
          { n: "2900+", t: "học viên qua các lớp" },
          { n: "700+", t: "chủ doanh nghiệp dự chia sẻ, workshop" },
          { n: "10+", t: "doanh nghiệp đào tạo nội bộ" }
        ],
        tags: ["AI Automation", "Đào tạo nội bộ", "Tư vấn vận hành", "Coaching 1:1"],
        points: [
          "Lớp Teamwork với AI: 6 buổi cho chủ doanh nghiệp và quản lý, đã chạy tới khoá 04",
          "Đồng tổ chức AI Agent K1 cùng Vườn Ươm Khu Phố: gần 600 học viên, điểm kiến thức giảng viên 4,81/5 (501 phản hồi)",
          "Giảng viên workshop Agent Boss: AI Agent cho Marketer",
          "Tác giả các bộ skill cho Claude, như brainstorm và kf-plan"
        ],
        links: [{ t: "hungkescy.com", u: "https://hungkescy.com/" }, { t: "KesFlow", u: "https://kesflow.vn/" }]
      },
      {
        name: "Cù Đức Duy",
        alias: "duycuf",
        role: "Full-stack AI Creator tại Hà Nội, đang làm việc cùng KesFlow",
        photo: "assets/img/experts/duy-cu.webp",
        org: { name: "KesFlow", logo: "assets/img/logo-kesflow.svg" },
        bio: "Dạy người đi làm và đội nhóm làm việc với AI, đồng thời xây các công cụ AI chạy thật: agent, tự động hoá, video và website.",
        stats: [
          { n: "800+", t: "học viên được trợ lý Nimrod hỗ trợ" },
          { n: "24/7", t: "trợ lý AI trực trả lời" },
          { n: "6", t: "sản phẩm AI đang chạy thật" }
        ],
        tags: ["AI Agent", "Tự động hoá", "Video AI", "Landing page", "Đào tạo AI"],
        points: [
          "Dạy AI: lớp cho người mới bắt đầu và workshop theo việc thật của từng đội nhóm",
          "Nimrod: trợ lý AI trả lời học viên 24/7 từ tài liệu khoá học, đang chạy tại KesFlow",
          "Argus: phần mềm quản lý đa kênh và SEO, gửi bản tin AI lúc 7 giờ sáng mỗi ngày",
          "Video bằng AI: từ kịch bản thành video hoàn chỉnh, video đào tạo, motion graphics viết bằng code cùng Claude"
        ],
        links: [
          { t: "duycuf.vn", u: "https://www.duycuf.vn/" },
          { t: "Facebook", u: "https://www.facebook.com/duycudaya/" },
          { t: "GitHub", u: "https://github.com/duycuf" }
        ]
      }
    ]
  }
];
