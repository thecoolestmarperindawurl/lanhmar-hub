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
    name: "SG Agent Hub | Hội nuôi AI Agent Sài Gòn",
    name_en: "SG Agent Hub | Hội nuôi AI Agent Sài Gòn", // tên riêng, giữ nguyên
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
    date: "2026-10-17", time: "14:00–18:00", // theo standee sự kiện
    host: "SG Agent Hub × KesFlow", host_en: "SG Agent Hub × KesFlow",
    speakers: ["Hưng Kescy"], speakers_en: ["Hưng Kescy"],
    quote: "Cái gì máy làm tốt thì người đừng làm", quote_en: "What a machine does well, a person shouldn't do",
    topics: ["Thế nào là một \"skill\" tốt?", "6 bước giải quyết vấn đề (nâng cao)"],
    topics_en: ["What makes a good \"skill\"?", "6-step problem solving (advanced)"],
    place: "Bamos Coffee, Bình Thạnh", place_en: "Bamos Coffee, Binh Thanh (Ho Chi Minh City)",
    map: "https://share.google/QRK3a7kzh5mzemacS",
    attendees: 30,
    desc: "Buổi workshop trực tiếp của cộng đồng Đi làm với AI tại Sài Gòn: diễn giả Hưng Kescy nói về cách xây một skill tốt cho AI và quy trình 6 bước giải quyết vấn đề, kèm thực hành ngay tại chỗ.",
    desc_en: "The Đi làm với AI community's in-person workshop in Saigon: speaker Hưng Kescy on what makes a good AI skill and a 6-step problem-solving process, with hands-on practice on the spot.",
    // Ảnh đầu = ảnh bìa/poster. Ảnh chụp tại sự kiện: chạy tools/event-photos.py rồi thêm vào sau standee.
    photos: [
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/01.webp", alt: "Standee workshop Đi làm với AI: diễn giả Hưng Kescy, 14h–18h ngày 17/10", alt_en: "Workshop standee: speaker Hưng Kescy, 2–6 pm on 17 Oct" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/02.webp", alt: "Diễn giả Hưng Kescy mở phần Showcase thực chiến trước màn chiếu", alt_en: "Speaker Hưng Kescy opening the hands-on showcase in front of the screen" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/03.webp", alt: "Diễn giả cầm mic chia sẻ với người tham dự", alt_en: "The speaker sharing with attendees" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/04.webp", alt: "Diễn giả xuống từng bàn trao đổi trực tiếp", alt_en: "The speaker going table to table for direct discussion" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/05.webp", alt: "Người tham dự chăm chú theo dõi phần trình bày", alt_en: "Attendees following the talk closely" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/06.webp", alt: "Khán phòng Bamos Coffee với sơ đồ Known / Unknown trên màn chiếu", alt_en: "The room at Bamos Coffee with the Known / Unknown diagram on screen" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/07.webp", alt: "Người tham dự trình bày bài làm của mình tại laptop", alt_en: "An attendee presenting their own work at the laptop" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/08.webp", alt: "Phần trao đổi và đặt câu hỏi giữa buổi", alt_en: "Discussion and questions during the session" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/09.webp", alt: "Check-in cùng standee và bảng #Sài Gòn", alt_en: "Checking in with the standee and the #Sài Gòn sign" },
      { src: "assets/img/events/workshop-di-lam-voi-ai-2026-10/10.webp", alt: "Phần hỏi đáp sôi nổi cuối buổi", alt_en: "A lively Q&A at the end of the session" }
    ]
  }
];
