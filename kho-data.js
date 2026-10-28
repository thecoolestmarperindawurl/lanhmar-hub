// Dữ liệu mẫu — sửa trực tiếp file này hoặc thêm bằng nút "+ Thêm" trên web (lưu trong trình duyệt, có Xuất/Nhập JSON).
window.KHO = [
  { id: "ai", name: "Kho AI", icon: "✦", desc: "Tài khoản, skill cho AI Agent, bài cập nhật tính năng",
    groups: [{ id: "news", name: "AI News", icon: "📰" }, { id: "agent", name: "AI Agent", icon: "🤖" }, { id: "buy", name: "Nơi mua AI", icon: "🛒" }, { id: "skill", name: "Skill", icon: "🧩" }, { id: "other", name: "Khác", icon: "📁" }] },
  { id: "design", name: "Kho Design", icon: "◐", desc: "Tài nguyên cho Adobe, Canva, Figma..." },
  { id: "edit", name: "Kho Edit", icon: "▶", desc: "Tài nguyên cho CapCut, Premiere, After Effects..." },
  { id: "tool", name: "Kho Tool", icon: "⚙", desc: "Repo GitHub và công cụ hữu ích" },
  { id: "knowledge", name: "Kho Knowledge", icon: "✎", desc: "Kho ebook, khoá học theo Academy, Marketing Project",
    groups: [{ id: "web", name: "Web tự học", icon: "🌐" }, { id: "ebook", name: "Kho Ebook", icon: "📚" }, { id: "vuonuom", name: "Vườn Ươm Khu Phố", icon: "🌱" }, { id: "htxchiem", name: "Hợp tác xã Chị Em", icon: "🤝" }, { id: "seongon", name: "SEONGON Academy", icon: "🔎" }, { id: "queue", name: "Khoá chờ học", icon: "📥" }, { id: "mkproject", name: "Marketing Project", icon: "🎓" }], strictGroups: true },
  { id: "idea", name: "Kho Idea", icon: "★", desc: "Ý tưởng content, sản phẩm, dự án muốn thử" }
];

window.ITEMS = [
  { id: "s1", kho: "ai", title: "Claude Code – tài liệu chính thức", url: "https://docs.claude.com/en/docs/claude-code", note: "Skill, hook, MCP, subagent cho AI Agent.", tags: ["agent", "docs"], type: "Tài liệu", date: "2026-10-22" },
  { id: "s2", kho: "ai", title: "Anthropic News", url: "https://www.anthropic.com/news", note: "Theo dõi cập nhật tính năng của Claude.", tags: ["cập nhật", "claude"], type: "Bài viết", date: "2026-10-22" },
  { id: "s3", kho: "ai", title: "Mua tài khoản AI (ghi chú nơi mua)", url: "", note: "Điền nhà cung cấp, giá, hạn dùng vào đây.", tags: ["tài khoản"], type: "Tài khoản", date: "2026-10-22" },
  { id: "s4", kho: "design", title: "Canva – Brand Kit", url: "https://www.canva.com", note: "Lưu bảng màu, font, logo thương hiệu.", tags: ["canva", "brand"], type: "Template", date: "2026-10-22" },
  { id: "s5", kho: "design", title: "Adobe Fonts", url: "https://fonts.adobe.com", note: "Font có hỗ trợ tiếng Việt, kiểm tra trước khi dùng.", tags: ["adobe", "font"], type: "Font", date: "2026-10-22" },
  { id: "s6", kho: "edit", title: "CapCut – hiệu ứng & template", url: "https://www.capcut.com", note: "Gom template trend, âm thanh, preset màu.", tags: ["capcut", "template"], type: "Template", date: "2026-10-22" },
  { id: "s7", kho: "edit", title: "Premiere Pro – phím tắt", url: "https://helpx.adobe.com/premiere-pro/using/keyboard-shortcuts.html", note: "Bảng phím tắt tăng tốc dựng.", tags: ["premiere", "phím tắt"], type: "Tài liệu", date: "2026-10-22" },
  { id: "s8", kho: "tool", title: "awesome (GitHub topic)", url: "https://github.com/topics/awesome", note: "Danh sách tuyển chọn repo hay theo chủ đề.", tags: ["github", "danh sách"], type: "Repo", date: "2026-10-22" },
  { id: "s11", kho: "idea", title: "Ý tưởng mẫu – (đặt tên ý tưởng)", url: "", note: "Ghi nhanh ý tưởng, bước đầu tiên và trạng thái (mới / đang thử / xong).", tags: ["mới"], type: "Ý tưởng", date: "2026-10-22" }
];
