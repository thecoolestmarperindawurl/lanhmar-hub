/* Kho báu: các công cụ mình tự vibe-code và chia sẻ miễn phí.
   Thêm công cụ: thêm một mục vào window.TREASURES. Trường tiếng Anh là x_en cạnh x (desc_en, points_en, note_en, type_en, badge_en…).
   - shelf: id kệ trong TREASURE_SHELVES. featured: true để hiện ở khối "Mới và nổi bật".
   - status: "open" (đã mở, có url) | "soon" (sắp mở, nút bị khoá). url nhận https hoặc trang trong site (vd ai-convert.html).
   - detail: "course-recap" mở hộp chi tiết trong trang; bỏ trống thì nút chính đi thẳng tới url.
   - thumb: ảnh 960×504 trong assets/res/. install: các dòng lệnh cài (nút Copy lệnh cài).
   Kệ có soon: true hiện "Sắp có" và không có mục nào. */
window.TREASURE_SHELVES = [
  { id: "code", name: "Công cụ & mã nguồn", name_en: "Tools & source code" },
  { id: "online", name: "Công cụ online", name_en: "Online tools" },
  { id: "skill", name: "Skill", name_en: "Skills", soon: true },
  { id: "template", name: "Mẫu", name_en: "Templates", soon: true }
];

window.TREASURES = [
  {
    id: "course-recap",
    shelf: "code",
    featured: true,
    status: "open",
    url: "https://github.com/thecoolestmarperindawurl/course-recap-in-detailed",
    detail: "course-recap",
    thumb: "assets/res/tool-course-recap-free.jpg",
    name: "Course Recap",
    type: "Công cụ & mã nguồn",
    type_en: "Tool & source code",
    badge: "Miễn phí · Phi thương mại",
    badge_en: "Free · Noncommercial",
    desc: "Biến video bài giảng có chiếu slide thành một trang recap: ảnh từng slide kèm lời giảng của giảng viên ở đúng slide đó. Dán link Drive hoặc chọn file video là chạy.",
    desc_en: "Turns a lecture video with slides on screen into a recap page: each slide image with what the lecturer said during it. Paste a Drive link or pick a video file and go.",
    points: [
      "Nhận link Google Drive, kể cả file chia sẻ theo email (đăng nhập Google một lần, chỉ đọc), hoặc file video trên máy",
      "Chạy trên máy bạn, không cần API trả phí, không gửi dữ liệu đi đâu khác",
      "Bỏ phần giới thiệu và nội quy bằng một tuỳ chọn",
      "Dừng giữa chừng rồi chạy tiếp được, hợp video dài hàng giờ"
    ],
    points_en: [
      "Takes a Google Drive link, including files shared by email (one-time Google sign-in, read-only), or a local video file",
      "Runs on your computer, no paid API, nothing sent anywhere else",
      "Skip the intro and class rules with one option",
      "Stop midway and resume later, built for multi-hour videos"
    ],
    license: "PolyForm Noncommercial 1.0.0",
    note: "Thực đo trên laptop của mình: video 2 giờ 03 phút, gỡ băng khoảng 51 phút, ra 88 slide. Máy khác sẽ khác.",
    note_en: "Measured on my own laptop: a 2h03 video took about 51 minutes to transcribe and produced 88 slides. Your machine will differ.",
    install: [
      "git clone https://github.com/thecoolestmarperindawurl/course-recap-in-detailed.git",
      "cd course-recap-in-detailed",
      "pip install -r requirements.txt"
    ]
  },
  {
    id: "ai-convert",
    shelf: "online",
    featured: true,
    status: "open",
    url: "ai-convert.html",
    thumb: "assets/res/tool-ai-convert.jpg",
    name: "AI Convert",
    type: "Công cụ online",
    type_en: "Online tool",
    badge: "Chạy ngay trên web",
    badge_en: "Runs in your browser",
    desc: "Kéo thả PDF, Word, Excel, PowerPoint, nhận Markdown sạch để Claude, ChatGPT, Cursor đọc nhanh hơn và tốn ít token hơn. Xử lý ngay trong trình duyệt, file không rời máy.",
    desc_en: "Drag in PDF, Word, Excel or PowerPoint files and get clean Markdown that Claude, ChatGPT and Cursor read faster with fewer tokens. Runs in your browser, files never leave your device.",
    cta: "Mở công cụ →",
    cta_en: "Open tool →"
  }
];
