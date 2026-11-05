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
     Bản tiếng Anh: thêm trường cùng tên có đuôi _en (desc_en, topics_en, role_en, bio_en, points_en, tags_en, t_en, d_en); thiếu thì dùng bản tiếng Việt.
     Nguồn: hungkescy.com và www.duycuf.vn (đọc ngày 04/11/2026). */
window.COMMUNITIES = [
  {
    id: "di-lam-voi-ai",
    name: "Đi làm với AI",
    name_en: "Đi làm với AI", // tên riêng, giữ nguyên
    platform: "Facebook",
    url: "https://www.facebook.com/groups/dilamvoiai",
    members: "",
    status: "open",
    feature: true,
    desc: "Nhóm Facebook cho người đi làm ứng dụng AI vào workflow hằng ngày: có chuyên gia về AI và tự động hoá, chủ doanh nghiệp và người đi làm cùng chia sẻ cách làm thực tế.",
    desc_en: "A Facebook group for working professionals bringing AI into their daily workflow: AI and automation experts, business owners and employees share what actually works.",
    topics: ["AI trong workflow", "AI Agent", "Tự động hoá", "Vận hành SME với AI", "Hỏi đáp"],
    topics_en: ["AI in your workflow", "AI Agents", "Automation", "Running an SME with AI", "Q&A"],
    moderator: { name: "Dương Thị Lan Anh", name_en: "Lana Duong", alias: "LANHMAR", role: "Moderator nhóm Đi làm với AI · Digital Marketer", role_en: "Moderator of Đi làm với AI · Digital Marketer", photo: "assets/img/experts/lan-anh.webp", org: { name: "", logo: "assets/img/logo-lanhmar.png", logoOnly: true }, u: "index.html" },
    members_kinds: [
      { t: "Chuyên gia AI và tự động hoá", d: "Những người làm nghề tư vấn, đào tạo và xây hệ thống AI, chia sẻ phương pháp và công cụ.",
        t_en: "AI and automation experts", d_en: "People who consult, train and build AI systems, sharing their methods and tools." },
      { t: "Chủ doanh nghiệp", d: "Người đang đưa AI vào vận hành doanh nghiệp, kể rõ việc đã làm và kết quả.",
        t_en: "Business owners", d_en: "Owners bringing AI into how their business runs, sharing what they did and the results." },
      { t: "Người đi làm", d: "Người dùng AI trong công việc hằng ngày, chia sẻ quy trình, mẫu prompt và bài học.",
        t_en: "Working professionals", d_en: "People using AI in their everyday work, sharing workflows, prompt templates and lessons." }
    ],
    experts: [
      {
        name: "Hưng Kescy",
        alias: "Đinh Tiến Hưng",
        role: "CEO & Founder KesFlow · Tư vấn và đào tạo AI Automation cho doanh nghiệp",
        role_en: "CEO & Founder of KesFlow · AI Automation consulting and training for businesses",
        photo: "assets/img/experts/hung-kescy.webp",
        org: { name: "KesFlow", logo: "assets/img/logo-kesflow.svg" },
        bio: "Đứng lớp, đào tạo nội bộ và tư vấn vận hành cho doanh nghiệp Việt. Chọn đúng việc đáng làm trước, tối ưu công cụ sau.",
        bio_en: "Teaches classes, runs in-house training and advises Vietnamese businesses on operations. Pick the work worth doing first, optimise the tools later.",
        stats: [
          { n: "2900+", t: "học viên qua các lớp", t_en: "students across his classes" },
          { n: "700+", t: "chủ doanh nghiệp dự chia sẻ, workshop", t_en: "business owners at talks and workshops" },
          { n: "10+", t: "doanh nghiệp đào tạo nội bộ", t_en: "companies trained in-house" }
        ],
        tags: ["AI Automation", "Đào tạo nội bộ", "Tư vấn vận hành", "Coaching 1:1"],
        tags_en: ["AI Automation", "In-house training", "Operations consulting", "1:1 coaching"],
        points: [
          "Lớp Teamwork với AI: 6 buổi cho chủ doanh nghiệp và quản lý, đã chạy tới khoá 04",
          "Đồng tổ chức AI Agent K1 cùng Vườn Ươm Khu Phố: gần 600 học viên, điểm kiến thức giảng viên 4,81/5 (501 phản hồi)",
          "Giảng viên workshop Agent Boss: AI Agent cho Marketer",
          "Tác giả các bộ skill cho Claude, như brainstorm và kf-plan"
        ],
        points_en: [
          "Teamwork with AI: a 6-session class for business owners and managers, now on cohort 04",
          "Co-organised AI Agent K1 with Vườn Ươm Khu Phố: nearly 600 students, instructor knowledge score 4.81/5 (501 responses)",
          "Instructor of the Agent Boss workshop: AI Agents for Marketers",
          "Author of Claude skill packs such as brainstorm and kf-plan"
        ],
        links: [{ t: "hungkescy.com", u: "https://hungkescy.com/" }, { t: "KesFlow", u: "https://kesflow.vn/" }]
      },
      {
        name: "Cù Đức Duy",
        alias: "duycuf",
        role: "Full-stack AI Creator tại Hà Nội, đang làm việc cùng KesFlow",
        role_en: "Full-stack AI Creator in Hanoi, working with KesFlow",
        photo: "assets/img/experts/duy-cu.webp",
        org: { name: "KesFlow", logo: "assets/img/logo-kesflow.svg" },
        bio: "Dạy người đi làm và đội nhóm làm việc với AI, đồng thời xây các công cụ AI chạy thật: agent, tự động hoá, video và website.",
        bio_en: "Teaches professionals and teams to work with AI, and builds AI tools that really run: agents, automations, videos and websites.",
        stats: [
          { n: "800+", t: "học viên được trợ lý Nimrod hỗ trợ", t_en: "students supported by the Nimrod assistant" },
          { n: "24/7", t: "trợ lý AI trực trả lời", t_en: "AI assistant on duty" },
          { n: "6", t: "sản phẩm AI đang chạy thật", t_en: "AI products running for real" }
        ],
        tags: ["AI Agent", "Tự động hoá", "Video AI", "Landing page", "Đào tạo AI"],
        tags_en: ["AI Agents", "Automation", "AI video", "Landing pages", "AI training"],
        points: [
          "Dạy AI: lớp cho người mới bắt đầu và workshop theo việc thật của từng đội nhóm",
          "Nimrod: trợ lý AI trả lời học viên 24/7 từ tài liệu khoá học, đang chạy tại KesFlow",
          "Argus: phần mềm quản lý đa kênh và SEO, gửi bản tin AI lúc 7 giờ sáng mỗi ngày",
          "Video bằng AI: từ kịch bản thành video hoàn chỉnh, video đào tạo, motion graphics viết bằng code cùng Claude"
        ],
        points_en: [
          "Teaching AI: beginner classes and workshops built around each team's real tasks",
          "Nimrod: an AI assistant answering students 24/7 from course material, running at KesFlow",
          "Argus: multi-channel management and SEO software that sends an AI brief at 7 a.m. every day",
          "AI video: script to finished video, training videos, and motion graphics written in code with Claude"
        ],
        links: [
          { t: "duycuf.vn", u: "https://www.duycuf.vn/" },
          { t: "Facebook", u: "https://www.facebook.com/duycudaya/" },
          { t: "GitHub", u: "https://github.com/duycuf" }
        ]
      }
    ]
  },
  {
    // Mô tả và chủ đề viết dựa trên tên nhóm (chủ nhóm chưa gửi mô tả chính thức, 05/11/2026) — cập nhật khi có. Không ghi số thành viên vì chưa xác minh.
    id: "ai-agent-hub-sai-gon",
    name: "AI Agent Hub | Hội nuôi AI Sài Gòn",
    name_en: "AI Agent Hub | Hội nuôi AI Sài Gòn", // tên riêng, giữ nguyên
    platform: "Zalo",
    url: "https://zalo.me/g/eu82fyffympy6gnevcxe",
    members: "",
    status: "open",
    feature: false,
    desc: "Nhóm Zalo của cộng đồng AI Agent tại Sài Gòn: nơi trao đổi cách dựng, \"nuôi\" và vận hành AI Agent trong công việc hằng ngày, hỏi đáp nhanh và hẹn gặp offline.",
    desc_en: "The Zalo group of the Saigon AI Agent community: a place to share how to build, \"raise\" and run AI agents in daily work, get quick answers and meet up offline.",
    topics: ["AI Agent", "Tự động hoá", "Hỏi đáp nhanh", "Gặp mặt Sài Gòn"],
    topics_en: ["AI Agents", "Automation", "Quick Q&A", "Saigon meetups"]
  }
];

/* Sự kiện đã tổ chức trong nhóm — mục "Sự kiện trong nhóm" của community.html (thẻ → bấm mở bộ ảnh).
   Ảnh nằm trong repo (assets/img/events/<id>/NN.webp), KHÔNG nhúng/liên kết tới Drive hay nguồn ngoài.
   Chuẩn bị ảnh: python3 tools/event-photos.py <thư mục ảnh gốc> --id <id> --write --pick <ảnh sáng, rõ…>
   Ảnh đầu tiên là ảnh bìa. Sự kiện mới nhất tự xếp lên đầu (theo date). Mỗi mục cần name_en, desc_en, place_en, alt_en. */
window.EVENTS = [
  {
    id: "workshop-di-lam-voi-ai-2026-10",
    group: "di-lam-voi-ai",
    name: "Workshop \"Đi làm với AI\"",
    name_en: "\"Đi làm với AI\" Workshop",
    date: "2026-10-17", // theo dấu thời gian ảnh chụp
    host: "AI Agent Hub × KesFlow", host_en: "AI Agent Hub × KesFlow",
    place: "Bamos Coffee, Bình Thạnh", place_en: "Bamos Coffee, Binh Thanh (Ho Chi Minh City)",
    map: "https://share.google/QRK3a7kzh5mzemacS",
    attendees: 30,
    desc: "Buổi gặp mặt trực tiếp đầu tiên của nhóm: chia sẻ cách dùng AI Agent và skill cho Claude Code vào việc hằng ngày, kèm phần thực hành ngay tại chỗ.",
    desc_en: "The group's first in-person meetup: how to put AI agents and Claude Code skills to work day to day, with hands-on practice on the spot.",
    // Điền sau khi chạy tools/event-photos.py (ảnh sáng, rõ; ảnh đầu = ảnh bìa). Đang chờ ảnh từ chủ nhóm.
    photos: []
  }
];
