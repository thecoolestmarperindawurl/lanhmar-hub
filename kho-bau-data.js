/* Kho báu: các công cụ mình tự vibe-code và chia sẻ miễn phí.
   Thêm công cụ: thêm một mục vào window.TREASURES, mục MỚI NHẤT đặt ĐẦU danh sách (thẻ "Mới ra lò" ở hero lấy mục đầu). Trường tiếng Anh là x_en cạnh x (desc_en, points_en, note_en, type_en, badge_en…).
   - hook/hook_en: một câu móc ≤ 90 ký tự cho thẻ hero; thiếu thì lấy câu đầu của desc.
   - shelf: id kệ trong TREASURE_SHELVES. featured: true để hiện ở khối "Mới và nổi bật".
   - status: "open" (đã mở, có url) | "soon" (sắp mở, nút bị khoá). url nhận https hoặc trang trong site (vd ai-convert.html).
   - detail: có thì nút chính mở hộp chi tiết trong trang (course-recap dùng mẫu riêng; mục có `sections` dùng nội dung dạng khối callout/h/p/list/steps/table/code giống thẻ Kho Ứng dụng); bỏ trống thì nút chính đi thẳng tới url. direct: true thêm nút mở thẳng công cụ. meta/note/links: thông tin phụ trong hộp chi tiết.
   - demo: ví dụ kết quả hiện trong hộp chi tiết. kind "recap" (slides: [{ n, img (+img_en: ảnh slide mẫu 800×450 trong assets/res/), time, title, bullets[], speech }]) hoặc "convert" (before/after: { label, text }). Chỉ dùng dữ liệu mẫu tự soạn, ghi rõ là mẫu; có cặp x_en cho chữ.
   - video: { src (mp4 trong assets/video/), poster, title, title_en }: thêm nút "▶ Xem video giới thiệu" trên thẻ và trình phát trong hộp chi tiết.
   - thumb: ảnh 960×504 trong assets/res/. install: các dòng lệnh cài (nút Copy lệnh cài).
   Kệ có soon: true hiện "Sắp có" và không có mục nào. */
window.TREASURE_SHELVES = [
  { id: "code", name: "Công cụ & mã nguồn", name_en: "Tools & source code" },
  { id: "online", name: "Công cụ online", name_en: "Online tools" },
  { id: "skill", name: "Skill", name_en: "Skills" },
  { id: "template", name: "Mẫu", name_en: "Templates", soon: true }
];

window.TREASURES = [
  {
    "id": "qc-content-fb-group",
    "shelf": "skill",
    "featured": true,
    "status": "open",
    "url": "https://drive.google.com/file/d/1tNSLdJTUBCnRubFTgk0Tjhke_TQdD307/view?usp=drivesdk",
    "thumb": "assets/res/skill-qc-content-fb-group.jpg",
    "name": "qc-content-fb-group",
    "hook": "Duyệt bài group Facebook đúng nội quy, chặn lỗi chính sách trước.",
    "hook_en": "Approve Facebook group posts by your rules, catch policy issues first.",
    "type": "Skill cho Claude",
    "type_en": "Claude skill",
    "badge": "Miễn phí",
    "badge_en": "Free",
    "desc": "Admin duyệt hay tự đăng bài vi phạm thì Facebook tính lỗi cho cả group: giảm hiển thị, có khi bị gỡ. Skill này giúp mod chấm bài nhất quán, chặn lỗi chính sách từ trước, và canh bình luận khi drama nổi lên.",
    "desc_en": "When an admin approves or publishes a violating post, Facebook counts it against the whole group: less reach, sometimes removal. This skill helps moderators score posts consistently, catch policy issues up front, and watch the comments when drama breaks out.",
    "points": [
      "Mỗi bài qua 2 cổng: chính sách Facebook rồi luật cứng của group, sau đó mới chấm điểm",
      "Mỗi kết luận kèm câu trích làm căn cứ và lời nhắn sẵn gửi tác giả",
      "Bài admin có lỗi thì nhận bản sửa, giữ nguyên giọng văn người viết",
      "Bình luận căng: Mức nhiệt 0-10, nhãn từng bình luận, bình luận ghim soạn sẵn"
    ],
    "points_en": [
      "Each post passes 2 gates, Facebook policy then the group's hard rules, before scoring",
      "Every verdict comes with a supporting quote and a ready message for the author",
      "Admin drafts with issues get a fixed version in the author's own voice",
      "Heated threads: a 0-10 heat score, a label per comment, a ready pinned comment"
    ],
    "cta": "Tải file .zip →",
    "cta_en": "Download the .zip →",
    "video": {
      "src": "assets/video/qc-content-fb-group-intro.mp4",
      "poster": "assets/res/qc-content-fb-group-intro-poster.jpg",
      "title": "qc-content-fb-group: video demo 41 giây",
      "title_en": "qc-content-fb-group: 41-second demo video"
    },
    "detail": "qc-content-fb-group",
    "direct": true,
    "links": [
      {
        "t": "Thư mục Skill-Hub trên Drive ↗",
        "t_en": "Skill-Hub folder on Drive ↗",
        "u": "https://drive.google.com/drive/folders/1uSMhaYH0IX1y2raSnAPLB3ssJlOShP0C"
      }
    ],
    "sections": [
      {
        "k": "callout",
        "t": "Duyệt bài group: đừng để một cú bấm \"Duyệt\" kéo cả group bị phạt",
        "t_en": "Approving posts: don't let one \"Approve\" click get the whole group penalised"
      },
      {
        "k": "list",
        "items": [
          "Khai vấn một lần ra hồ sơ group",
          "Chấm bài theo rubric, chặn trước bằng chính sách Facebook",
          "Soát bài admin kèm bản sửa, canh bình luận căng"
        ],
        "items_en": [
          "One interview builds the group profile",
          "Posts scored on a rubric, with a Facebook policy check first",
          "Admin drafts checked with a fixed version, heated comments watched"
        ]
      },
      {
        "k": "h",
        "t": "Một bộ thước chung cho cả đội mod",
        "t_en": "One shared yardstick for the whole mod team"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Khai vấn một lần ra hồ sơ group",
            "d": "AI hỏi lần lượt 6 cụm: thông tin group, nội quy (chia luật cứng và mềm), chân dung thành viên, rubric chấm điểm, cách xử lý bình luận, đội quản trị. Bạn dán sẵn nội quy thì AI tự rút ra, chỉ hỏi phần còn thiếu. Kết quả là file group-profile.md dùng cho mọi lần sau."
          },
          {
            "t": "Chấm bài theo rubric, chặn trước bằng chính sách Facebook",
            "d": "Mỗi bài qua 2 cổng: chính sách Facebook (mức ĐỎ là từ chối ngay) rồi luật cứng của group. Qua cổng mới chấm rubric 100 điểm, mỗi tiêu chí kèm câu trích làm căn cứ. Kết luận có 4 mức, kèm lời nhắn lịch sự gửi tác giả."
          },
          {
            "t": "Soát bài admin kèm bản sửa",
            "d": "Bài của admin, mod, BTC, đối tác không chấm rubric mà soát những lỗi hay gặp: mồi tương tác, minigame bắt share/tag, bài tài trợ không ghi hợp tác, cam kết kết quả, bóc phốt lộ thông tin. Có lỗi thì AI viết lại đúng những câu đó, giữ giọng văn của người viết."
          },
          {
            "t": "Canh bình luận ở bài đang căng",
            "d": "AI chấm Mức nhiệt 0-10, gắn nhãn từng bình luận (phản biện, spam, khiếm nhã, công kích, vi phạm ĐỎ) kèm hành động đề xuất, soạn sẵn bình luận ghim để hạ nhiệt và ghi lịch sử vi phạm vào watchlist."
          }
        ],
        "items_en": [
          {
            "t": "One interview builds the group profile",
            "d": "The AI asks 6 rounds of questions: group info, rules (split into hard and soft), member persona, scoring rubric, how to handle comments, and the admin team. Paste your existing rules and it extracts them, asking only what is missing. The result is a group-profile.md file reused every time."
          },
          {
            "t": "Posts scored on a rubric, with a Facebook policy check first",
            "d": "Each post passes 2 gates: Facebook policy (RED means decline right away), then the group's hard rules. Only then is it scored on a 100-point rubric, each criterion backed by a quote. The verdict has 4 levels and comes with a polite message for the author."
          },
          {
            "t": "Admin drafts checked, with a fixed version",
            "d": "Posts by admins, mods, organisers and partners skip the rubric and get checked for the usual slips: engagement bait, giveaways that require shares or tags, sponsored posts without disclosure, guaranteed results, call-out posts that expose personal data. The AI rewrites only the problem sentences and keeps the author's voice."
          },
          {
            "t": "Comments watched on heated posts",
            "d": "The AI scores a 0-10 heat level, labels each comment (fair pushback, spam, rude, personal attack, RED violation) with a proposed action, drafts a pinned comment to calm things down, and logs strikes in a watchlist."
          }
        ]
      },
      {
        "k": "h",
        "t": "Group nào có người duyệt bài là dùng được",
        "t_en": "Any group that approves posts can use it"
      },
      {
        "k": "table",
        "head": [
          "Tình huống",
          "Trước",
          "Sau"
        ],
        "head_en": [
          "Situation",
          "Before",
          "After"
        ],
        "rows": [
          [
            "Group cộng đồng có hàng chục bài chờ duyệt mỗi ngày",
            "Mỗi mod duyệt theo cảm tính, bài giống nhau người duyệt người từ chối, thành viên thắc mắc vì sao bài mình bị loại.",
            "Cả đội chấm theo cùng một rubric, mỗi kết luận có câu trích làm căn cứ và lời nhắn sẵn để gửi tác giả."
          ],
          [
            "Group thương hiệu chuẩn bị chạy minigame",
            "Bài viết \"Like, share, tag 3 bạn bè\" đăng lên thì bị Facebook giảm hiển thị, group tích thêm lỗi.",
            "Soát trước khi đăng, nhận bản sửa dùng câu hỏi thật làm điều kiện, có thể lệ và câu miễn trừ đầy đủ."
          ],
          [
            "Bài bóc phốt hay so sánh thương hiệu kéo theo hàng trăm bình luận",
            "Mod thức khuya đọc từng bình luận, không biết nên ẩn, xoá hay khoá bài, người vi phạm lần thứ mấy cũng không nhớ.",
            "Có Mức nhiệt, danh sách bình luận cần xử lý kèm hành động, bình luận ghim soạn sẵn và lịch hẹn quét lại."
          ],
          [
            "Mod mới vào đội",
            "Phải hỏi lại admin nội quy, chưa biết lỗi chính sách Facebook nào là nặng.",
            "Đọc hồ sơ group và báo cáo của AI là nắm được cách đội đang duyệt, lỗi nào ĐỎ, lỗi nào VÀNG."
          ]
        ],
        "rows_en": [
          [
            "A community group with dozens of pending posts a day",
            "Each mod judges by feel, similar posts get approved by one and declined by another, and members ask why theirs was rejected.",
            "The whole team scores on the same rubric; every verdict has a supporting quote and a ready message for the author."
          ],
          [
            "A brand group about to run a giveaway",
            "A \"Like, share, tag 3 friends\" post goes up, Facebook cuts its reach and the group collects another strike.",
            "Checked before publishing, with a fixed version that uses a real question as the entry condition, plus full rules and a disclaimer."
          ],
          [
            "A call-out or brand-comparison post pulls hundreds of comments",
            "Mods stay up late reading every comment, unsure whether to hide, delete or lock, and nobody remembers who has offended before.",
            "A heat score, a list of comments to act on with proposed actions, a ready pinned comment, and a re-scan time."
          ],
          [
            "A new mod joins the team",
            "They have to ask the admin about the rules again and don't know which Facebook policy breaches are serious.",
            "Reading the group profile and the AI's reports shows how the team moderates, and what counts as RED or YELLOW."
          ]
        ]
      },
      {
        "k": "h",
        "t": "Xem thử: đầu vào → xử lý → đầu ra",
        "t_en": "Preview: input → process → output"
      },
      {
        "k": "p",
        "t": "Soát bài minigame của BTC trước khi đăng",
        "t_en": "Checking an organiser's giveaway post before it goes live"
      },
      {
        "k": "p",
        "t": "Bạn đưa vào: Bài nháp: \"MINIGAME NHẬN 5 VÉ NIGHT RUN. Like + Share bài này, tag 3 người bạn, comment 'Tôi muốn chạy' để nhận link. Giải chạy giúp bạn giảm 5kg trong 1 tháng, đảm bảo 100%!\" kèm câu: \"Kiểm tra bài admin này trước khi đăng.\"",
        "t_en": "You give it: Draft (Vietnamese): \"MINIGAME NHẬN 5 VÉ NIGHT RUN. Like + Share bài này, tag 3 người bạn, comment 'Tôi muốn chạy' để nhận link. Giải chạy giúp bạn giảm 5kg trong 1 tháng, đảm bảo 100%!\" plus: \"Check this admin post before publishing.\""
      },
      {
        "k": "list",
        "items": [
          "Nhận diện tác giả là BTC trong đội quản trị → soát theo nhánh bài admin.",
          "Quét chính sách Facebook, đặc biệt bảng lỗi hay gặp ở bài admin, rồi đối chiếu nội quy group.",
          "Mỗi vấn đề ghi câu trích, mục chính sách, mức ĐỎ hoặc VÀNG và cách sửa.",
          "Viết bản sửa giữ ý và giọng của BTC, chỉ đổi những câu có vấn đề.",
          "Soát lại bản sửa: không còn lỗi thì giao, thiếu thông tin thì để ô [cần điền]."
        ],
        "items_en": [
          "Recognise the author as an organiser on the admin team → use the admin-draft branch.",
          "Sweep Facebook policy, especially the common slips in admin posts, then check the group's rules.",
          "For each issue: the quote, the policy item, RED or YELLOW, and the fix.",
          "Write a fixed version that keeps the organiser's ideas and voice, changing only the problem sentences.",
          "Re-check the fixed version: deliver if clean, leave a [to fill in] slot where facts are missing."
        ]
      },
      {
        "k": "code",
        "cap": "Báo cáo soát bài",
        "cap_en": "Check report",
        "t": "🛡 Kết quả soát: SỬA RỒI ĐĂNG\nLý do: không có lỗi ĐỎ, nhưng dùng mồi tương tác làm điều kiện tham gia.\n\nVấn đề:\n1. \"Like + Share bài này\" → Mồi tương tác → VÀNG → bỏ điều kiện like/share\n2. \"Tag 3 người bạn\" → Mồi tương tác → VÀNG → đổi thành trả lời câu hỏi\n3. \"giảm 5kg trong 1 tháng, đảm bảo 100%\" → Tuyên bố nhạy cảm → VÀNG → bỏ cam kết\n4. Thiếu thể lệ chọn người thắng → Minigame → VÀNG → ghi rõ cách chọn, thời gian\n\n✍️ Bản đề xuất đã sửa (câu đổi nằm trong ⟦ ⟧):\n⟦Trả lời dưới bài: Lần chạy đêm đáng nhớ nhất của bạn là ở đâu?⟧\n⟦BTC chọn 5 câu trả lời hay nhất, công bố ngày [cần điền].⟧\n⟦Bài hợp tác với hãng giày XYZ. Chương trình không liên quan tới Facebook.⟧",
        "t_en": "🛡 Kết quả soát: SỬA RỒI ĐĂNG (fix, then publish)\nWhy: no RED issue, but engagement bait is used as the entry condition.\n\nIssues:\n1. \"Like + Share bài này\" → Engagement bait → YELLOW → drop the like/share condition\n2. \"Tag 3 người bạn\" → Engagement bait → YELLOW → replace with answering a question\n3. \"giảm 5kg trong 1 tháng, đảm bảo 100%\" → Sensitive claim → YELLOW → drop the promise\n4. No rules for picking winners → Giveaway → YELLOW → state how and when\n\n✍️ Proposed fixed draft (changed sentences in ⟦ ⟧):\n⟦Answer below: where was your most memorable night run?⟧\n⟦The organisers pick the 5 best answers, announced on [to fill in].⟧\n⟦In partnership with shoe brand XYZ. This giveaway is not associated with Facebook.⟧"
      },
      {
        "k": "p",
        "t": "Ví dụ minh hoạ với dữ liệu tự soạn. Skill chỉ đề xuất, mod là người bấm duyệt, xoá hay chặn.",
        "t_en": "Illustrative example with made-up data. The skill only proposes; the moderator clicks approve, delete or block."
      },
      {
        "k": "h",
        "t": "Cách dùng",
        "t_en": "How to use"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Bước 1",
            "d": "Tải file zip. Trên claude.ai: Cài đặt → Capabilities → Skills → tải file zip lên. Trên Claude Code: giải nén vào thư mục ~/.claude/skills/."
          },
          {
            "t": "Bước 2",
            "d": "Mở cuộc trò chuyện mới và gõ: \"Lập nội quy và rubric cho group của mình\". Trả lời 6 cụm câu hỏi, hoặc dán sẵn nội quy hiện có để AI tự rút ra."
          },
          {
            "t": "Bước 3",
            "d": "Dán bài chờ duyệt, bài admin sắp đăng hoặc chuỗi bình luận đang căng rồi nhờ AI chấm. Đọc báo cáo, sau đó tự bấm duyệt, sửa hoặc xoá trên Facebook."
          }
        ],
        "items_en": [
          {
            "t": "Step 1",
            "d": "Download the zip. On claude.ai: Settings → Capabilities → Skills → upload the zip. In Claude Code: unzip it into ~/.claude/skills/."
          },
          {
            "t": "Step 2",
            "d": "Open a new chat and type: \"Set up rules and a rubric for my group\". Answer the 6 rounds of questions, or paste your current rules and let the AI extract them."
          },
          {
            "t": "Step 3",
            "d": "Paste a pending post, an admin draft or a heated comment thread and ask the AI to check it. Read the report, then approve, edit or delete on Facebook yourself."
          }
        ]
      },
      {
        "k": "h",
        "t": "Câu hỏi thường gặp",
        "t_en": "FAQ"
      },
      {
        "k": "table",
        "head": [
          "Câu hỏi",
          "Trả lời"
        ],
        "head_en": [
          "Question",
          "Answer"
        ],
        "rows": [
          [
            "Skill có tự đăng nhập Facebook và tự duyệt, xoá bài không?",
            "Không. Skill không nhập mật khẩu và không bấm nút. Nó chỉ đọc nội dung bạn dán vào (hoặc mở link bằng phiên Facebook bạn đã đăng nhập, nếu bạn cho phép) rồi đề xuất; mod là người quyết định."
          ],
          [
            "Group của mình chưa có rubric thì sao?",
            "Skill có sẵn rubric mặc định 100 điểm với 7 tiêu chí: đúng chủ đề, giá trị cho thành viên, rõ ràng, đúng định dạng, mức quảng cáo, giọng điệu, độ tin cậy. Bạn giữ nguyên hoặc đổi trọng số trong lúc khai vấn."
          ],
          [
            "Phần chính sách Facebook có luôn đúng không?",
            "Đó là bản tóm tắt Tiêu chuẩn cộng đồng của Meta. Meta thay đổi chính sách theo thời gian, nên khi một kết luận phụ thuộc vào đúng một điều khoản, skill được dặn mở trang chính sách gốc để kiểm tra trước."
          ],
          [
            "Thông tin cá nhân của thành viên có bị lưu lại không?",
            "Số điện thoại, địa chỉ, số giấy tờ và link cá nhân trong câu trích đều được che. Watchlist chỉ ghi tên hiển thị để mod áp thang xử lý."
          ],
          [
            "Mình đang dùng bot QC cho group Đi làm với AI, skill này có thay thế không?",
            "Không. Skill này dùng chung cho mọi group. Group Đi làm với AI có skill và bot Telegram riêng, nên dùng đúng bộ đó."
          ]
        ],
        "rows_en": [
          [
            "Does the skill log into Facebook and approve or delete posts by itself?",
            "No. It never types a password or clicks a button. It reads what you paste (or opens a link in the Facebook session you are already logged into, if you allow it) and proposes; the moderator decides."
          ],
          [
            "My group has no rubric yet. What then?",
            "The skill ships a default 100-point rubric with 7 criteria: on topic, value for members, clarity, format, amount of promotion, tone, credibility. Keep it or change the weights during the interview."
          ],
          [
            "Is the Facebook policy part always right?",
            "It is a summary of Meta's Community Standards. Meta changes its policies over time, so when a verdict hinges on one exact rule, the skill is told to check the live policy page first."
          ],
          [
            "Does it store members' personal data?",
            "Phone numbers, addresses, ID numbers and profile links are masked in quotes. The watchlist records display names only, so mods can apply the penalty ladder."
          ],
          [
            "I use the QC bot for the Đi làm với AI group. Does this replace it?",
            "No. This skill works for any group. The Đi làm với AI group has its own skill and Telegram bot; keep using that set there."
          ]
        ]
      },
      {
        "k": "callout",
        "t": "Để AI lo phần soi lỗi, đội mod giữ phần quyết định. Tải file zip, cài một lần, khai vấn group một lần, sau đó mỗi lần duyệt chỉ cần dán bài vào.",
        "t_en": "Let AI catch the issues while the mod team keeps the decisions. Download the zip, install once, interview your group once; after that, each review is just pasting the post in."
      }
    ]
  },
  {
    "id": "drive-transfer",
    "shelf": "code",
    "featured": true,
    "status": "open",
    "url": "https://github.com/thecoolestmarperindawurl/drive-transfer/blob/main/Code.gs",
    "thumb": "assets/res/tool-drive-transfer.jpg",
    "name": "Drive Transfer",
    "hook": "Chép cả thư mục sang tài khoản Google mới, máy bạn không tải gì.",
    "hook_en": "Copy whole folders to a new Google account, nothing passes your computer.",
    "type": "Google Apps Script",
    "type_en": "Google Apps Script",
    "badge": "Miễn phí · Mã nguồn mở",
    "badge_en": "Free · Open source",
    "desc": "Chuyển dữ liệu từ Google Drive này sang Google Drive khác, giữ nguyên cây thư mục. Dán một đoạn Apps Script vào Google Sheet của tài khoản mới, dán link thư mục cũ, Google tự chép trên máy chủ của họ.",
    "desc_en": "Move data from one Google Drive to another with the folder tree intact. Paste one Apps Script file into a Google Sheet on the new account, paste the old folder link, and Google copies everything on its own servers.",
    "points": [
      "Google chép phía máy chủ: máy bạn không tải hay tải lên byte nào",
      "Giữ nguyên cây thư mục, chép cả Google Docs/Sheets/Slides",
      "Tự chạy tiếp từng lượt tới khi xong, kể cả khi đã đóng Sheet",
      "Nhật ký từng file; quét lại chỉ chép bù file còn thiếu, không chép trùng"
    ],
    "points_en": [
      "Google copies server-side: not a byte through your computer",
      "Folder tree kept, Google Docs/Sheets/Slides included",
      "Keeps running round after round until done, even with the Sheet closed",
      "Per-file log; a rescan only copies missing files, never duplicates"
    ],
    "cta": "Mở Code.gs trên GitHub →",
    "cta_en": "Open Code.gs on GitHub →",
    "meta": [
      {
        "l": "Cài đặt",
        "l_en": "Install",
        "v": "Dán Code.gs vào Apps Script của một Google Sheet trên tài khoản mới",
        "v_en": "Paste Code.gs into the Apps Script of a Google Sheet on the new account"
      },
      {
        "l": "Dữ liệu",
        "l_en": "Your data",
        "v": "Chạy trong tài khoản Google của bạn, không qua máy chủ nào khác",
        "v_en": "Runs inside your own Google account, through no other server"
      },
      {
        "l": "Giấy phép",
        "l_en": "License",
        "v": "MIT: dùng, sửa, chia sẻ, dùng thương mại thoải mái",
        "v_en": "MIT: use, modify, share and use commercially"
      }
    ],
    "note": "Giới hạn của Google: mỗi lượt script chạy tối đa 6 phút; chạy nền tối đa 90 phút/ngày với Gmail cá nhân (6 giờ với Workspace); tải lên và sao chép tối đa 750 GB mỗi 24 giờ. Hết hạn mức thì hôm sau script chạy tiếp.",
    "note_en": "Google's limits: each script run lasts at most 6 minutes; background runtime is capped at 90 minutes/day on personal Gmail (6 hours on Workspace); uploads and copies are capped at 750 GB per 24 hours. When a quota runs out, the script continues the next day.",
    "detail": "drive-transfer",
    "direct": true,
    "demo": {
      "kind": "convert",
      "before": {
        "label": "Drive cũ: thư mục bạn chia sẻ",
        "label_en": "Old Drive: the folder you shared",
        "text": "Khach-hang/\n├─ Hop-dong/\n│  ├─ A.pdf      2.1 MB\n│  └─ B.pdf      1.8 MB\n├─ Bao-cao/\n│  └─ doanh-thu  (Sheets)\n├─ intro.mp4     1.4 GB\n└─ goc.pdf       🔒"
      },
      "after": {
        "label": "Sheet Nhật ký sau khi chạy",
        "label_en": "Log sheet after the run",
        "text": "OK   Hop-dong/A.pdf      2.1 MB\nOK   Hop-dong/B.pdf      1.8 MB\nOK   Bao-cao/doanh-thu   Sheets\nOK   intro.mp4           1.4 GB\nLỖI  goc.pdf  Access denied"
      }
    },
    "links": [
      {
        "t": "README: cách hoạt động và giới hạn ↗",
        "t_en": "README: how it works and its limits ↗",
        "u": "https://github.com/thecoolestmarperindawurl/drive-transfer#readme"
      },
      {
        "t": "Mã nguồn trên GitHub ↗",
        "t_en": "Source code on GitHub ↗",
        "u": "https://github.com/thecoolestmarperindawurl/drive-transfer"
      }
    ],
    "sections": [
      {
        "k": "callout",
        "t": "Cách thường làm là tải cả Drive về máy rồi tải lên tài khoản mới: chậm, tốn ổ cứng, đứt mạng là làm lại. Tool này để Google tự chép từ Drive cũ sang Drive mới ngay trên máy chủ của Google, bạn chỉ dán hai đường link.",
        "t_en": "The usual way is to download the whole Drive and upload it to the new account: slow, eats disk space, and a dropped connection means starting over. This tool lets Google copy from the old Drive to the new one on its own servers; you only paste two links."
      },
      {
        "k": "h",
        "t": "Làm được gì",
        "t_en": "What it handles"
      },
      {
        "k": "table",
        "head": [
          "Loại dữ liệu",
          "Tool xử lý thế nào"
        ],
        "head_en": [
          "Data",
          "How the tool handles it"
        ],
        "rows": [
          [
            "PDF, ảnh, video, Office, ZIP…",
            "Chép nguyên file, giữ tên và thư mục"
          ],
          [
            "Google Docs, Sheets, Slides, Forms",
            "Chép thành file Google mới thuộc tài khoản mới"
          ],
          [
            "Thư mục con nhiều cấp",
            "Tạo lại đúng cây thư mục"
          ],
          [
            "Lối tắt (shortcut)",
            "Ghi BỎ QUA; muốn chép thì chia sẻ thư mục gốc của nó"
          ],
          [
            "File chủ đã tắt tải/sao chép, Google Sites, My Maps",
            "Không chép được, ghi LỖI kèm lý do"
          ]
        ],
        "rows_en": [
          [
            "PDF, images, video, Office, ZIP…",
            "Copied as-is, name and folder kept"
          ],
          [
            "Google Docs, Sheets, Slides, Forms",
            "Copied as new Google files owned by the new account"
          ],
          [
            "Nested subfolders",
            "Folder tree recreated"
          ],
          [
            "Shortcuts",
            "Logged as skipped; share their target folder if you need it"
          ],
          [
            "Files whose owner disabled download/copy, Google Sites, My Maps",
            "Cannot be copied; logged as an error with the reason"
          ]
        ]
      },
      {
        "k": "h",
        "t": "Cài và chạy",
        "t_en": "Set up and run"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Chia sẻ từ tài khoản cũ",
            "d": "Chuột phải thư mục cần chuyển → Chia sẻ → thêm email tài khoản mới, quyền Người xem là đủ. Muốn chuyển cả Drive: gom mọi thứ vào một thư mục rồi chia sẻ thư mục đó."
          },
          {
            "t": "Dán script vào Sheet của tài khoản mới",
            "d": "Tạo Google Sheet mới → Tiện ích mở rộng → Apps Script → xoá code mẫu, dán toàn bộ Code.gs → Lưu."
          },
          {
            "t": "Bắt đầu",
            "d": "Tải lại Sheet → menu Chuyển Drive → Bắt đầu chuyển… → cấp quyền. Dán link thư mục nguồn và link thư mục đích (để trống để tự tạo). Xong thì script gửi email cho bạn."
          }
        ],
        "items_en": [
          {
            "t": "Share from the old account",
            "d": "Right-click the folder → Share → add the new account's email; Viewer is enough. To move a whole Drive, gather everything into one folder and share that."
          },
          {
            "t": "Paste the script into a Sheet on the new account",
            "d": "Create a new Google Sheet → Extensions → Apps Script → delete the sample code, paste all of Code.gs → Save."
          },
          {
            "t": "Start",
            "d": "Reload the Sheet → Drive Transfer menu → Start a transfer… → authorize. Paste the source folder link and the destination link (leave empty to create one). The script emails you when it is done."
          }
        ]
      },
      {
        "k": "callout",
        "t": "Lần đầu cấp quyền, Google báo \"Google chưa xác minh ứng dụng này\" vì đây là script của chính bạn, chạy trong tài khoản của bạn. Bấm Nâng cao → Đi tới … (không an toàn).",
        "t_en": "The first time you authorize, Google says \"Google hasn't verified this app\" because this is your own script running in your own account. Click Advanced → Go to … (unsafe)."
      },
      {
        "k": "h",
        "t": "Lưu ý",
        "t_en": "Good to know"
      },
      {
        "k": "list",
        "items": [
          "Đây là sao chép: bản chép thuộc tài khoản mới và tính vào dung lượng của nó, dữ liệu gốc không bị xoá.",
          "Bình luận, lịch sử phiên bản và quyền chia sẻ cũ không đi theo bản chép.",
          "Có file lỗi thì lọc cột Trạng thái theo LỖI, xử lý nguyên nhân rồi chọn Quét lại và chép bù."
        ],
        "items_en": [
          "This is a copy: copies belong to the new account and use its storage; originals are not deleted.",
          "Comments, version history and old sharing settings do not carry over.",
          "If some files fail, filter the Status column by LỖI, fix the cause, then choose Rescan and copy missing files."
        ]
      }
    ]
  },
  {
    "id": "mograph",
    "shelf": "code",
    "featured": true,
    "status": "open",
    "url": "https://github.com/thecoolestmarperindawurl/mograph",
    "thumb": "assets/res/tool-mograph.jpg",
    "name": "mograph",
    "hook": "Giao kịch bản cho Claude Code, nhận video motion graphic có nhạc khớp beat.",
    "hook_en": "Hand Claude Code a script, get a motion graphic video with beat-synced music.",
    "type": "Plugin Claude Code",
    "type_en": "Claude Code plugin",
    "badge": "Miễn phí · Mã nguồn mở",
    "badge_en": "Free · Open source",
    "desc": "Plugin cho Claude Code: agent chỉ viết một file kịch bản ngắn, engine lo bố cục, chữ động, chuyển cảnh, nhạc khớp beat, giọng đọc kèm phụ đề rồi xuất MP4 ngay trên máy bạn. Đổi cả phong cách video chỉ bằng một từ.",
    "desc_en": "A Claude Code plugin: the agent only writes a short script file, and the engine handles layout, animated text, transitions, beat-synced music, voiceover with captions, then exports an MP4 on your own machine. Change the whole style with one word.",
    "points": [
      "7 phong cách (bold, cinematic, editorial…): engine tự biến tấu chữ động và chuyển cảnh từng cảnh, nên hai video không giống nhau",
      "28 kiểu cảnh, có cả 3D: kinetic typography, thẻ sản phẩm 3D, mockup điện thoại, chia đôi khung hình, logo sting, timeline, lower third, footage",
      "Nhạc gốc 5 phong cách, cắt cảnh khớp beat, âm lượng chuẩn mạng xã hội; lồng tiếng kèm phụ đề, xuất file .srt",
      "Một ảnh so sánh nhiều phong cách để chọn trước khi render; một kịch bản xuất được cả 9:16 và 16:9"
    ],
    "points_en": [
      "7 styles (bold, cinematic, editorial…): the engine varies animated text and transitions per scene, so two videos never look the same",
      "28 scene types, 3D included: kinetic typography, 3D product cards, phone mockups, split screen, logo sting, timeline, lower third, footage",
      "Original music in 5 styles, cuts on the beat, social-ready loudness; voiceover with captions, exported as .srt",
      "One image compares several styles before rendering; one script exports both 9:16 and 16:9"
    ],
    "cta": "Xem trên GitHub →",
    "cta_en": "View on GitHub →",
    "install": [
      "/plugin marketplace add thecoolestmarperindawurl/mograph",
      "/plugin install mograph@mograph"
    ],
    "meta": [
      {
        "l": "Cài đặt",
        "l_en": "Install",
        "v": "Hai lệnh /plugin trong Claude Code; máy cần Node.js 18+, Chrome hoặc Edge, ffmpeg",
        "v_en": "Two /plugin commands in Claude Code; your machine needs Node.js 18+, Chrome or Edge, and ffmpeg"
      },
      {
        "l": "Dữ liệu",
        "l_en": "Your data",
        "v": "Video render ngay trên máy bạn; ảnh, footage và file thu âm không tải lên máy chủ nào",
        "v_en": "Videos render on your machine; images, footage and recordings are not uploaded to any server"
      },
      {
        "l": "Mã nguồn",
        "l_en": "Source code",
        "v": "MIT trên GitHub; font Montserrat (SIL OFL)",
        "v_en": "MIT on GitHub; Montserrat font (SIL OFL)"
      }
    ],
    "note": "Video giới thiệu trong thẻ này được dựng bằng chính mograph, phong cách bold, nhạc upbeat. Engine chạy trên máy bạn; tốc độ render tuỳ máy và phong cách.",
    "note_en": "The intro video on this card was made with mograph itself, bold look, upbeat music. The engine runs on your machine; render speed depends on your computer and the style.",
    "video": {
      "src": "assets/video/mograph-intro.mp4",
      "poster": "assets/res/mograph-intro-poster.jpg",
      "title": "mograph: video giới thiệu 41 giây",
      "title_en": "mograph: 41-second intro video"
    },
    "detail": "mograph",
    "direct": true,
    "links": [
      {
        "t": "Mã nguồn và README trên GitHub ↗",
        "t_en": "Source code and README on GitHub ↗",
        "u": "https://github.com/thecoolestmarperindawurl/mograph"
      }
    ],
    "sections": [
      {
        "k": "callout",
        "t": "Bạn nói với Claude Code \"làm video 30 giây giới thiệu sản phẩm X\". Agent chốt kịch bản với bạn, chọn ảnh, chọn kiểu cảnh, viết một file kịch bản ngắn rồi tự kiểm tra và xuất MP4. Phần chuyển động, nhạc và khớp beat do engine lo, nên agent không phải viết code dựng hình.",
        "t_en": "You tell Claude Code \"make a 30-second video introducing product X\". The agent agrees the script with you, picks images and scene types, writes a short script file, then checks it and exports an MP4. The engine handles motion, music and beat sync, so the agent never writes animation code."
      },
      {
        "k": "h",
        "t": "Cài và dùng",
        "t_en": "Install and use"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Cài plugin",
            "d": "Trong Claude Code, chạy hai lệnh cài ở dưới."
          },
          {
            "t": "Giao việc",
            "d": "Nói bạn muốn video gì, dài bao lâu, dọc hay ngang, kèm thư mục ảnh hoặc footage nếu có."
          },
          {
            "t": "Duyệt và xuất",
            "d": "Agent gửi một ảnh tổng hợp các cảnh để bạn duyệt, rồi xuất file MP4."
          }
        ],
        "items_en": [
          {
            "t": "Install the plugin",
            "d": "In Claude Code, run the two install commands below."
          },
          {
            "t": "Assign the work",
            "d": "Say what video you want, how long, vertical or horizontal, plus a folder of images or footage if you have one."
          },
          {
            "t": "Review and export",
            "d": "The agent sends one contact sheet of all scenes for you to review, then exports the MP4."
          }
        ]
      },
      {
        "k": "code",
        "cap": "Lệnh cài trong Claude Code",
        "cap_en": "Install commands in Claude Code",
        "t": "/plugin marketplace add thecoolestmarperindawurl/mograph\n/plugin install mograph@mograph"
      },
      {
        "k": "h",
        "t": "Vì sao tốn ít token",
        "t_en": "Why it uses few tokens"
      },
      {
        "k": "list",
        "items": [
          "Agent chỉ viết kịch bản dạng YAML, không viết HTML, CSS hay code chuyển động.",
          "Bước kiểm tra trả về chữ, không phải ảnh; cả video được duyệt bằng một ảnh tổng hợp.",
          "Chọn phong cách bằng một ảnh so sánh thay vì render thử nhiều lần."
        ],
        "items_en": [
          "The agent only writes a YAML script, never HTML, CSS or animation code.",
          "Checks return text, not images; the whole video is reviewed from one contact sheet.",
          "Styles are chosen from one comparison image instead of several trial renders."
        ]
      }
    ]
  },
  {
    "id": "t-outbox",
    "shelf": "code",
    "featured": true,
    "status": "open",
    "url": "https://lanhmar.id.vn/apps/t-outbox/",
    "thumb": "assets/res/app-t-outbox.jpg",
    "name": "T-outbox",
    "hook": "Biến Claude Code thành công ty AI, xem cả đội làm việc trong văn phòng 3D.",
    "hook_en": "Turn Claude Code into an AI company and watch the team work in a 3D office.",
    "type": "Plugin Claude Code",
    "type_en": "Claude Code plugin",
    "badge": "Miễn phí · Mã nguồn mở",
    "badge_en": "Free · Open source",
    "desc": "Plugin cho Claude Code: CEO, 5 phòng ban, 17 nhân viên AI. Bạn giao việc, đội chia việc, họp, soát chéo rồi báo cáo; văn phòng 3D trên trình duyệt cho thấy ai đang làm gì.",
    "desc_en": "A plugin for Claude Code: a CEO, 5 departments, 17 AI staff. You assign the work; the team splits it, meets, cross-checks and reports, while a 3D office in your browser shows who is doing what.",
    "points": [
      "Giao một đầu việc lớn bằng /t-outbox:brief, CEO tự chia theo phòng ban và tổng hợp báo cáo",
      "Tòa nhà 9 tầng: mỗi phòng ban một tầng, phòng họp, canteen, sảnh lễ tân, hầm xe",
      "Mỗi phòng một bộ skill; bảng kỹ năng trên từng tầng sáng lên khi nhân viên chạy skill",
      "Đồng phục và văn phòng đổi theo brand bạn nạp vào",
      "Dữ liệu chỉ nằm trên máy bạn, server local không gửi đi đâu"
    ],
    "points_en": [
      "Hand over a big job with /t-outbox:brief; the CEO splits it by department and compiles the report",
      "A 9-floor tower: one floor per department, meeting rooms, canteen, reception lobby, car park",
      "Every department has its own skills; the skill board on each floor lights up when staff run one",
      "Uniforms and office follow the brand you load",
      "Your data stays on your machine; the local server sends nothing anywhere"
    ],
    "cta": "Xem demo 3D →",
    "cta_en": "See the 3D demo →",
    "install": [
      "/plugin marketplace add thecoolestmarperindawurl/t-outbox-office",
      "/plugin install t-outbox@t-outbox"
    ],
    "meta": [
      {
        "l": "Cài đặt",
        "l_en": "Install",
        "v": "Hai lệnh /plugin trong Claude Code, cần Node.js 18+",
        "v_en": "Two /plugin commands in Claude Code, needs Node.js 18+"
      },
      {
        "l": "Dữ liệu",
        "l_en": "Your data",
        "v": "Sự kiện ghi trong thư mục .t-outbox của dự án, không gửi lên máy chủ nào",
        "v_en": "Events are written to the project's .t-outbox folder, never sent to any server"
      },
      {
        "l": "Mã nguồn",
        "l_en": "Source code",
        "v": "MIT trên GitHub; mô hình 3D của Kenney (CC0)",
        "v_en": "MIT on GitHub; 3D models by Kenney (CC0)"
      }
    ],
    "note": "Bản demo trên web chỉ diễn một buổi làm việc mẫu. Cài plugin để xem đội của bạn làm việc thật.",
    "note_en": "The web demo only plays a sample work session. Install the plugin to watch your own team work for real.",
    "video": {
      "src": "assets/video/t-outbox-intro.mp4",
      "poster": "assets/res/t-outbox-intro-poster.jpg",
      "title": "T-outbox: video giới thiệu 40 giây",
      "title_en": "T-outbox: 40-second intro video"
    },
    "detail": "t-outbox",
    "direct": true,
    "links": [
      {
        "t": "Mã nguồn và README trên GitHub ↗",
        "t_en": "Source code and README on GitHub ↗",
        "u": "https://github.com/thecoolestmarperindawurl/t-outbox-office"
      }
    ],
    "sections": [
      {
        "k": "callout",
        "t": "Bạn giao một đầu việc lớn, ví dụ \"lập kế hoạch ra mắt sản phẩm trong 30 ngày\". CEO chia việc theo phòng ban, trưởng phòng giao người, QA soát lại, rồi CEO báo cáo cho bạn. Mỗi nhân viên là một subagent của Claude Code; văn phòng 3D chạy trên trình duyệt để bạn nhìn cả đội làm việc theo thời gian thực.",
        "t_en": "You hand over one big job, for example \"plan a product launch in 30 days\". The CEO splits it by department, leads assign people, QA reviews, and the CEO reports back to you. Each staff member is a Claude Code subagent; the 3D office runs in your browser so you can watch the whole team work in real time."
      },
      {
        "k": "h",
        "t": "Cài và dùng",
        "t_en": "Install and use"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Cài plugin",
            "d": "Trong Claude Code, chạy hai lệnh cài ở dưới."
          },
          {
            "t": "Mở trụ sở",
            "d": "Gõ /t-outbox:open, mở http://127.0.0.1:4747 trên trình duyệt."
          },
          {
            "t": "Giao việc",
            "d": "Gõ /t-outbox:brief kèm yêu cầu. Xem cả đội chia việc, họp, làm và báo cáo."
          }
        ],
        "items_en": [
          {
            "t": "Install the plugin",
            "d": "In Claude Code, run the two install commands below."
          },
          {
            "t": "Open the HQ",
            "d": "Type /t-outbox:open, then open http://127.0.0.1:4747 in your browser."
          },
          {
            "t": "Assign work",
            "d": "Type /t-outbox:brief with your request. Watch the team split the work, meet, do it and report."
          }
        ]
      },
      {
        "k": "code",
        "cap": "Lệnh cài trong Claude Code",
        "cap_en": "Install commands in Claude Code",
        "t": "/plugin marketplace add thecoolestmarperindawurl/t-outbox-office\n/plugin install t-outbox@t-outbox"
      },
      {
        "k": "h",
        "t": "Văn phòng 3D cho thấy gì",
        "t_en": "What the 3D office shows"
      },
      {
        "k": "list",
        "items": [
          "Tòa nhà 9 tầng, mỗi phòng ban một tầng với nội thất riêng; canteen và trung tâm hội nghị ở tầng riêng; sảnh có lễ tân, bảo vệ; hầm đỗ xe B1.",
          "Nhân viên mặc đồng phục theo màu brand bạn nạp vào (mặc định LanhMar). Đổi brand bằng lệnh /t-outbox:brand.",
          "Nhân viên đi thang máy, thang bộ, vào phòng họp khi được giao việc, xuống canteen nghỉ, lái xe vào hầm.",
          "Mỗi phòng có bộ skill riêng (21 skill). Mỗi tầng treo một bảng kỹ năng: skill đang chạy sáng màu phòng kèm tên người chạy, thẻ skill bay tới người gọi, bong bóng có nhãn ⚡/tên-skill.",
          "Bảng công việc, nhật ký văn phòng, chế độ Sôi nổi, Theo việc, Ẩn chi tiết, Buổi tối, xem 2D trên điện thoại.",
          "Dữ liệu chỉ nằm trên máy bạn: hook ghi sự kiện vào thư mục .t-outbox của dự án, server local không gửi đi đâu."
        ],
        "items_en": [
          "A 9-floor tower, one floor per department with its own interior; canteen and conference centre on their own floors; a lobby with reception and security; B1 car park.",
          "Staff wear uniforms in the brand colours you load (LanhMar by default). Change the brand with /t-outbox:brand.",
          "Staff take the lifts and stairs, go to meeting rooms when given work, take breaks in the canteen and drive into the car park.",
          "Every department has its own skill set (21 skills). Each floor has a skill board: a running skill lights up in the department colour with who is running it, a skill card flies to that person, and their bubble shows a ⚡/skill-name tag.",
          "Task board, office log, Lively, Follow work, Hide details and Evening modes, and a 2D view on phones.",
          "Your data stays on your machine: a hook writes events to the project's .t-outbox folder and the local server sends nothing anywhere."
        ]
      }
    ]
  },
  {
    "id": "pdf-editor",
    "shelf": "online",
    "featured": true,
    "status": "open",
    "url": "https://thecoolestmarperindawurl.github.io/lanhmar-pdf-editor/",
    "thumb": "assets/res/tool-pdf-editor.jpg",
    "name": "LANHMAR PDF Editor",
    "hook": "Bấm vào dòng chữ trong PDF, gõ lại, giữ nguyên phông và bố cục.",
    "hook_en": "Click a line in a PDF, retype it, keep the font and layout.",
    "type": "Công cụ online",
    "type_en": "Online tool",
    "badge": "Miễn phí · Mã nguồn mở",
    "badge_en": "Free · Open source",
    "desc": "Sửa chữ gốc trong PDF ngay trên trình duyệt: bấm vào dòng, gõ lại, nhấn Enter. Giữ phông, cỡ, màu, kiểu căn; chữ dài ra tự dàn xuống dòng sau. File không rời máy bạn.",
    "desc_en": "Edit the original text of a PDF right in your browser: click a line, retype, press Enter. Font, size, colour and alignment are kept; longer text flows to the next lines. Your file never leaves your device.",
    "points": [
      "Dùng lại phông gốc, hoặc nhận dạng phông cùng họ và độ đậm đủ dấu tiếng Việt",
      "Xoá thật chữ cũ; tìm kiếm và copy thấy đúng chữ mới",
      "Dàn lại đoạn, giữ căn đều, căn giữa, gạch chân",
      "Mở và lưu bản sao về Google Drive; hoàn tác, tải về"
    ],
    "points_en": [
      "Reuses the original font, or detects a same-family font and weight with full Vietnamese support",
      "Truly removes old text; search and copy return the new text",
      "Reflows paragraphs, keeps justification, centring and underlines",
      "Open from and save a copy to Google Drive; undo, download"
    ],
    "cta": "Mở công cụ →",
    "cta_en": "Open tool →",
    "meta": [
      {
        "l": "Truy cập",
        "l_en": "Access",
        "v": "Mở ngay trên web, không cần đăng nhập (Google chỉ khi dùng Drive)",
        "v_en": "Opens right on the web, no sign-in (Google only for Drive)"
      },
      {
        "l": "Dữ liệu",
        "l_en": "Your data",
        "v": "Xử lý trên máy bạn bằng WebAssembly, không tải file lên máy chủ",
        "v_en": "Processed on your device with WebAssembly, no upload to any server"
      },
      {
        "l": "Mã nguồn",
        "l_en": "Source code",
        "v": "AGPL-3.0 trên GitHub, kèm báo cáo thử chất lượng",
        "v_en": "AGPL-3.0 on GitHub, with the quality test report"
      }
    ],
    "note": "Đã thử 26/26 ca sửa trên PDF thật (Notion, Word, Canva). Chưa sửa được bản scan và nền tô màu sau chữ.",
    "note_en": "Tested 26/26 edits on real PDFs (Notion, Word, Canva). Scans and background highlights are not supported yet.",
    "detail": "pdf-editor",
    "direct": true,
    "links": [
      {
        "t": "Mã nguồn trên GitHub ↗",
        "t_en": "Source code on GitHub ↗",
        "u": "https://github.com/thecoolestmarperindawurl/lanhmar-pdf-editor"
      }
    ],
    "sections": [
      {
        "k": "callout",
        "t": "Sửa một con số trong báo cáo, đổi tên người nhận thư mời, cập nhật mốc thời gian trong CV mà không cần file gốc.",
        "t_en": "Fix a figure in a report, change an invitation's recipient, update dates in a CV without the original file."
      },
      {
        "k": "h",
        "t": "Cách dùng",
        "t_en": "How to use"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Mở file",
            "d": "Kéo thả PDF, chọn file hoặc mở từ Google Drive."
          },
          {
            "t": "Bấm vào dòng",
            "d": "Gõ lại, Enter lưu, Esc huỷ, Ctrl+Z hoàn tác."
          },
          {
            "t": "Tải về",
            "d": "Tải PDF hoặc lưu bản sao vào Drive."
          }
        ],
        "items_en": [
          {
            "t": "Open a file",
            "d": "Drop a PDF, pick a file or open from Google Drive."
          },
          {
            "t": "Click a line",
            "d": "Retype, Enter saves, Esc cancels, Ctrl+Z undoes."
          },
          {
            "t": "Download",
            "d": "Download the PDF or save a copy to Drive."
          }
        ]
      }
    ]
  },
  {
    "id": "drive-ebook-reader",
    "shelf": "code",
    "featured": true,
    "status": "open",
    "url": "https://lanhmar.id.vn/assets/dl/drive-ebook-reader.zip",
    "thumb": "assets/res/tool-drive-ebook-reader.jpg",
    "name": "Drive Ebook Reader",
    "hook": "Đọc PDF/EPUB vài trăm MB trên Drive ngay trong tab, không tải về.",
    "hook_en": "Read multi-hundred-MB PDF/EPUB from Drive in a tab, no download.",
    "type": "Extension Chrome/Edge",
    "type_en": "Chrome/Edge extension",
    "badge": "Miễn phí · Mã nguồn mở",
    "badge_en": "Free · Open source",
    "desc": "Đọc PDF/EPUB dung lượng lớn trên Google Drive ngay trong trình duyệt, không cần tải về. Extension chỉ nạp đúng phần đang đọc qua Drive API, nên file vài trăm MB mở ngay dù Drive báo không xem trước được.",
    "desc_en": "Read large PDF/EPUB files on Google Drive right in the browser, with no download. The extension fetches only the part you are reading through the Drive API, so multi-hundred-MB files open at once even when Drive cannot preview them.",
    "points": [
      "PDF nạp theo đoạn 1 MB (HTTP Range), render lười, bôi đen copy chữ, nhớ trang đang đọc",
      "EPUB có mục lục, đổi cỡ chữ, nhớ vị trí; Google Docs/Slides xuất PDF rồi đọc",
      "Tủ sách nhớ những cuốn đã chọn; nút tím ngay trên trang Drive",
      "Không máy chủ trung gian: dữ liệu đi thẳng từ Google về trình duyệt, quyền chỉ đọc"
    ],
    "points_en": [
      "PDF fetched in 1 MB chunks (HTTP Range), lazy rendering, text selection and copy, remembers your page",
      "EPUB with table of contents, font size and saved position; Google Docs/Slides exported to PDF",
      "A Library remembers picked books; purple button right on the Drive page",
      "No middle server: data flows straight from Google to your browser, read-only access"
    ],
    "cta": "Tải ZIP cho Chrome/Edge →",
    "cta_en": "Download ZIP for Chrome/Edge →",
    "meta": [
      {
        "l": "Cài đặt",
        "l_en": "Install",
        "v": "Giải nén ZIP, Load unpacked trong chrome://extensions (Developer mode)",
        "v_en": "Unzip, then Load unpacked in chrome://extensions (Developer mode)"
      },
      {
        "l": "Dữ liệu",
        "l_en": "Your data",
        "v": "Chỉ nói chuyện với www.googleapis.com bằng token của bạn, không ghi file xuống đĩa",
        "v_en": "Talks only to www.googleapis.com with your own token, writes nothing to disk"
      },
      {
        "l": "Mã nguồn",
        "l_en": "Source code",
        "v": "Thư mục extensions/drive-ebook-reader trong repo lanhmar-hub trên GitHub",
        "v_en": "Folder extensions/drive-ebook-reader in the lanhmar-hub repo on GitHub"
      }
    ],
    "note": "Quyền truy cập: extension chỉ xin quyền drive.file của Google, nên chỉ đọc được đúng những cuốn bạn tự chọn trong cửa sổ Google Drive, không gì khác. Chọn một lần, sách vào Tủ sách và mở thẳng từ đó, kể cả từ nút tím trên trang Drive. Ai cũng đăng nhập được, không cần danh sách thử nghiệm.",
    "note_en": "Access: the extension only requests Google's drive.file scope, so it can read exactly the books you pick in the Google Drive window and nothing else. Pick once, the book joins your Library and opens directly from then on, including from the purple button on the Drive page. Anyone can sign in, no test-user list.",
    "detail": "drive-ebook-reader",
    "direct": true,
    "links": [
      {
        "t": "Trang giới thiệu và chính sách quyền riêng tư ↗",
        "t_en": "Homepage and privacy policy ↗",
        "u": "https://lanhmar.id.vn/drive-ebook-reader.html"
      },
      {
        "t": "README: cài đặt, tạo OAuth Client ID, giới hạn ↗",
        "t_en": "README: install, create an OAuth Client ID, limitations ↗",
        "u": "https://github.com/thecoolestmarperindawurl/lanhmar-hub/tree/main/extensions/drive-ebook-reader#readme"
      },
      {
        "t": "Mã nguồn trên GitHub ↗",
        "t_en": "Source code on GitHub ↗",
        "u": "https://github.com/thecoolestmarperindawurl/lanhmar-hub/tree/main/extensions/drive-ebook-reader"
      }
    ],
    "sections": [
      {
        "k": "callout",
        "t": "Drive hay báo \"không xem trước được\" với PDF dày và không mở nổi EPUB, buộc bạn tải cả file về máy. Extension này mở sách ngay trong tab trình duyệt: PDF được xin theo từng đoạn 1 MB đúng chỗ bạn đang đọc, nên ổ cứng không nhận thêm byte nào.",
        "t_en": "Drive often says \"preview unavailable\" for thick PDFs and cannot open EPUB at all, forcing you to download the whole file. This extension opens the book right in a browser tab: the PDF is requested in 1 MB pieces exactly where you are reading, so not a single byte lands on your disk."
      },
      {
        "k": "h",
        "t": "Làm được gì",
        "t_en": "What it does"
      },
      {
        "k": "table",
        "head": [
          "Loại",
          "Extension làm gì"
        ],
        "head_en": [
          "Type",
          "What the extension does"
        ],
        "rows": [
          [
            "PDF",
            "Nạp theo đoạn qua HTTP Range, render lười từng trang, phóng to, vừa chiều rộng, bôi đen và copy chữ, nhớ trang đang đọc"
          ],
          [
            "EPUB",
            "Mục lục, lật trang, đổi cỡ chữ, nhớ vị trí; file nạp vào bộ nhớ, không ghi xuống đĩa"
          ],
          [
            "Google Docs, Slides",
            "Xuất PDF qua Drive API rồi đọc"
          ],
          [
            "Tủ sách",
            "Sách đã chọn được nhớ lại trên máy bạn; chọn nhiều cuốn một lúc trong cửa sổ Drive"
          ],
          [
            "File trên máy",
            "Mở PDF/EPUB trong máy, PDF cũng đọc theo đoạn"
          ]
        ],
        "rows_en": [
          [
            "PDF",
            "Fetched in chunks over HTTP Range, lazy page rendering, zoom, fit width, text selection and copy, remembers your page"
          ],
          [
            "EPUB",
            "Table of contents, page turns, font size, remembers position; loaded in memory, never written to disk"
          ],
          [
            "Google Docs, Slides",
            "Exported to PDF through the Drive API, then read"
          ],
          [
            "Library",
            "Picked books are remembered on your device; select several at once in the Drive window"
          ],
          [
            "Local files",
            "Opens PDF/EPUB from your computer; PDFs are read in slices too"
          ]
        ]
      },
      {
        "k": "h",
        "t": "Cài đặt",
        "t_en": "Install"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Tải và giải nén",
            "d": "Tải ZIP ở nút bên dưới, giải nén vào một thư mục cố định (ví dụ D:\\lanhmar\\drive-ebook-reader)."
          },
          {
            "t": "Nạp vào trình duyệt",
            "d": "Mở chrome://extensions (Edge: edge://extensions), bật Developer mode, bấm Load unpacked, chọn thư mục vừa giải nén. ID extension luôn là bijcnaofiojlemmbghgcljfekdaoghbf."
          },
          {
            "t": "Chọn sách",
            "d": "Bấm icon extension → “Chọn sách từ Google Drive”, đăng nhập và chọn một hay nhiều cuốn trong cửa sổ Drive. Sách vào Tủ sách và mở ngay; lần sau bấm nút tím “Đọc không cần tải” trên trang Drive của cuốn đó là đọc luôn."
          }
        ],
        "items_en": [
          {
            "t": "Download and unzip",
            "d": "Download the ZIP with the button below and unzip it into a permanent folder (for example D:\\lanhmar\\drive-ebook-reader)."
          },
          {
            "t": "Load into the browser",
            "d": "Open chrome://extensions (Edge: edge://extensions), turn on Developer mode, click Load unpacked and pick the unzipped folder. The extension ID is always bijcnaofiojlemmbghgcljfekdaoghbf."
          },
          {
            "t": "Pick your books",
            "d": "Click the extension icon → “Pick books from Google Drive”, sign in and select one or more books in the Drive window. They land in your Library and open at once; next time the purple “Read without downloading” button on that book's Drive page opens it directly."
          }
        ]
      },
      {
        "k": "h",
        "t": "Cách hoạt động",
        "t_en": "How it works"
      },
      {
        "k": "list",
        "items": [
          "Đăng nhập bằng chrome.identity với quyền drive.file: Google chỉ cấp quyền với file bạn chọn trong Google Picker (đặt tại lanhmar.id.vn/drive-picker.html), không gì khác; extension chỉ nói chuyện với www.googleapis.com.",
          "PDF.js nhận một PDFDataRangeTransport tuỳ biến: mỗi lần cần dữ liệu nó gửi header Range tới Drive API và nhận 206 Partial Content, đoạn 1 MB, tắt tự tải nốt phần còn lại.",
          "Chỉ render trang gần vùng nhìn, trang ở xa được giải phóng để tiết kiệm RAM; thanh trên cùng hiện đúng lượng dữ liệu đã nạp.",
          "Thử nghiệm với PDF 24 MB: mở lấy khoảng 3 MB, nhảy tới trang 20 lấy thêm khoảng 4 MB. PDF có từ điển trang rải khắp file có thể phải chạm gần hết file ngay lần mở."
        ],
        "items_en": [
          "Signs in with chrome.identity using the drive.file scope: Google grants access only to the files you pick in the Google Picker (hosted at lanhmar.id.vn/drive-picker.html), nothing else; the extension only talks to www.googleapis.com.",
          "PDF.js gets a custom PDFDataRangeTransport: whenever it needs data it sends a Range header to the Drive API and receives 206 Partial Content, 1 MB at a time, with background auto-fetch turned off.",
          "Only pages near the viewport are rendered and far pages are released to save RAM; the top bar shows exactly how much data has been fetched.",
          "Tested with a 24 MB PDF: opening fetched about 3 MB, jumping to page 20 another 4 MB. PDFs whose page dictionaries are scattered through the file may need most of the file on first open."
        ]
      }
    ]
  },
  {
    id: "course-recap",
    shelf: "code",
    featured: true,
    status: "open",
    url: "https://github.com/thecoolestmarperindawurl/course-recap-in-detailed",
    detail: "course-recap",
    thumb: "assets/res/tool-course-recap-free.jpg",
    name: "Course Recap",
    hook: "Biến video bài giảng thành trang recap từng slide kèm lời giảng.",
    hook_en: "Turn a lecture video into a slide-by-slide recap with what was said.",
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
    demo: {
      kind: "recap",
      slides: [
        { n: 3, img: "assets/res/demo-recap-1-vi.webp", img_en: "assets/res/demo-recap-1-en.webp", time: "00:12:40",
          title: "Phễu marketing", title_en: "Marketing funnel",
          bullets: ["Nhận biết", "Cân nhắc", "Mua hàng"], bullets_en: ["Awareness", "Consideration", "Purchase"],
          speech: "Ở slide này, phễu có ba tầng. Tầng trên cùng là nhận biết: người ta mới biết đến thương hiệu. Tầng giữa là cân nhắc: họ so sánh với lựa chọn khác. Tầng cuối mới là mua hàng. Mỗi tầng cần một loại nội dung khác nhau.",
          speech_en: "On this slide the funnel has three layers. The top is awareness: people have just heard of the brand. The middle is consideration: they compare it with other options. Only the bottom is purchase. Each layer needs a different kind of content." },
        { n: 4, img: "assets/res/demo-recap-2-vi.webp", img_en: "assets/res/demo-recap-2-en.webp", time: "00:15:05",
          title: "Bài tập: vẽ phễu của bạn", title_en: "Exercise: draw your own funnel",
          bullets: ["Chọn một sản phẩm", "Ghi nội dung cho từng tầng"], bullets_en: ["Pick one product", "Write the content for each layer"],
          speech: "Bây giờ các bạn chọn một sản phẩm của mình và vẽ phễu ra giấy. Mỗi tầng ghi một ý nội dung. Mười phút nhé, xong thì chụp ảnh gửi lên nhóm.",
          speech_en: "Now pick one of your own products and draw its funnel on paper. Write one content idea for each layer. You have ten minutes, then post a photo to the group." }
      ]
    },
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
    hook: "Thả PDF, Word, Excel… nhận Markdown sạch cho AI đọc ít token hơn.",
    hook_en: "Drop PDF, Word, Excel… get clean Markdown that AI reads with fewer tokens.",
    type: "Công cụ online",
    type_en: "Online tool",
    badge: "Chạy ngay trên web",
    badge_en: "Runs in your browser",
    desc: "Kéo thả PDF, Word, Excel, PowerPoint, nhận Markdown sạch để Claude, ChatGPT, Cursor đọc nhanh hơn và tốn ít token hơn. Xử lý ngay trong trình duyệt, file không rời máy.",
    desc_en: "Drag in PDF, Word, Excel or PowerPoint files and get clean Markdown that Claude, ChatGPT and Cursor read faster with fewer tokens. Runs in your browser, files never leave your device.",
    cta: "Mở công cụ →",
    cta_en: "Open tool →",
    meta: [
      { l: "Truy cập", l_en: "Access", v: "Mở ngay trên web, không cần đăng nhập", v_en: "Opens right on the web, no sign-in needed" },
      { l: "Dữ liệu", l_en: "Your data", v: "Xử lý ngay trong trình duyệt, file không rời máy", v_en: "Processed in your browser, files never leave your device" },
      { l: "Mã nguồn", l_en: "Source code", v: "Có trên GitHub: tải về, mở index.html là chạy, không cần Internet", v_en: "On GitHub: download, open index.html and it runs, no Internet needed" }
    ],
    note: "Trình duyệt tải các thư viện đọc file (pdf.js, mammoth, SheetJS…) từ CDN công khai. Nội dung file của bạn không được gửi đi đâu.",
    note_en: "Your browser loads the file-reading libraries (pdf.js, mammoth, SheetJS…) from public CDNs. The contents of your files are not sent anywhere.",
    demo: {
      kind: "convert",
      before: { label: "Chữ copy ra từ PDF (rối)", label_en: "Text copied out of a PDF (messy)",
        text: "BÁO CÁO QUÝ 3\nTrang 1\nDoanh thu   tăng 12%   so với quý 2\nKênh | Chi phí | Đơn\nFacebook | 20 | 140\nGoogle | 15 | 90\nTrang 1" },
      after: { label: "Markdown sau khi chuyển", label_en: "Markdown after converting",
        text: "# Báo cáo quý 3\n\nDoanh thu tăng 12% so với quý 2.\n\n| Kênh | Chi phí | Đơn |\n| --- | --- | --- |\n| Facebook | 20 | 140 |\n| Google | 15 | 90 |" }
    },
    detail: "ai-convert",
    direct: true,
    links: [{ t: "Tải về chạy offline (GitHub) ↗", t_en: "Download to run offline (GitHub) ↗", u: "https://github.com/thecoolestmarperindawurl/ai-convert" }, { t: "Bản dòng lệnh trên GitHub ↗", t_en: "Command-line version on GitHub ↗", u: "https://github.com/thecoolestmarperindawurl/ai-convert/blob/main/to-md.py" }],
    sections: [
      {
        "k": "callout",
        "t": "AI đọc Markdown tốt hơn PDF hay Word: giữ được tiêu đề, danh sách, bảng mà không kèm rác định dạng. Công cụ này chuyển tài liệu sang Markdown ngay trong trình duyệt, không tải file lên máy chủ nào.",
        "t_en": "AI reads Markdown better than PDF or Word: headings, lists and tables survive without formatting junk. This tool converts documents to Markdown right in the browser, with no upload to any server."
      },
      {
        "k": "h",
        "t": "Đọc được những gì",
        "t_en": "What it reads"
      },
      {
        "k": "table",
        "head": [
          "Loại file",
          "Công cụ làm gì"
        ],
        "head_en": [
          "File type",
          "What the tool does"
        ],
        "rows": [
          [
            "PDF",
            "Ghép chữ thành đoạn, nhận tiêu đề theo cỡ chữ, bỏ header/footer lặp lại và số trang. Báo khi PDF là bản scan không có chữ"
          ],
          [
            "Word (.docx)",
            "Giữ tiêu đề, danh sách, bảng; bỏ ảnh"
          ],
          [
            "Excel, CSV",
            "Mỗi sheet thành một bảng Markdown, bỏ dòng/cột trống, giới hạn số dòng"
          ],
          [
            "PowerPoint (.pptx)",
            "Mỗi slide một mục, giữ cấp ý, bảng và ghi chú người thuyết trình"
          ],
          [
            "HTML, TXT, JSON, code",
            "Bỏ menu/script của trang web; file code được bọc đúng ngôn ngữ"
          ]
        ],
        "rows_en": [
          [
            "PDF",
            "Joins text into paragraphs, detects headings by font size, removes repeated headers/footers and page numbers. Warns when the PDF is a scan with no text"
          ],
          [
            "Word (.docx)",
            "Keeps headings, lists and tables; drops images"
          ],
          [
            "Excel, CSV",
            "Each sheet becomes a Markdown table, empty rows/columns removed, row limit"
          ],
          [
            "PowerPoint (.pptx)",
            "One section per slide, keeps bullet levels, tables and speaker notes"
          ],
          [
            "HTML, TXT, JSON, code",
            "Strips web menus/scripts; code files are fenced with the right language"
          ]
        ]
      },
      {
        "k": "h",
        "t": "Cách dùng",
        "t_en": "How to use"
      },
      {
        "k": "steps",
        "items": [
          {
            "t": "Thả file",
            "d": "Kéo nhiều file một lúc vào ô, chỉnh tuỳ chọn làm sạch nếu cần."
          },
          {
            "t": "Xem kết quả",
            "d": "Mỗi file hiện loại, số trang/slide/sheet và ước tính token. Bấm Xem để kiểm tra nhanh."
          },
          {
            "t": "Lấy ra",
            "d": "Copy tất cả để dán vào chat, tải context.md, hoặc tải .zip gồm từng file kèm INDEX.md."
          }
        ],
        "items_en": [
          {
            "t": "Drop files",
            "d": "Drag several files into the box at once, adjust clean-up options if needed."
          },
          {
            "t": "Check results",
            "d": "Each file shows its type, page/slide/sheet count and token estimate. Click View for a quick look."
          },
          {
            "t": "Export",
            "d": "Copy all to paste into chat, download context.md, or download a .zip with every file plus INDEX.md."
          }
        ]
      },
      {
        "k": "h",
        "t": "Dùng trong vibe code",
        "t_en": "Using it for vibe coding"
      },
      {
        "k": "list",
        "items": [
          "Giải nén .zip vào docs/context/ của dự án.",
          "Thêm vào CLAUDE.md (hoặc .cursorrules): \"Tài liệu tham khảo ở docs/context/, đọc INDEX.md trước.\" Agent sẽ chỉ mở đúng file cần.",
          "Tài liệu dài: bật Chia đoạn để mỗi phần vừa cửa sổ ngữ cảnh.",
          "Ảnh, sơ đồ, bản scan: gửi thẳng ảnh cho AI sẽ chính xác hơn."
        ],
        "items_en": [
          "Unzip the .zip into your project's docs/context/.",
          "Add to CLAUDE.md (or .cursorrules): \"Reference docs live in docs/context/, read INDEX.md first.\" The agent then opens only the file it needs.",
          "Long documents: turn on Split so each part fits the context window.",
          "Images, diagrams, scans: sending the image itself to the AI is more accurate."
        ]
      },
      {
        "k": "code",
        "t": "pip install 'markitdown[pdf,docx,xlsx,pptx]'\npython3 tools/to-md.py tai-lieu/ -o docs/context",
        "cap": "Bản dòng lệnh để chuyển cả thư mục (trong repo lanhmar-hub)",
        "cap_en": "Command-line version to convert a whole folder (in the lanhmar-hub repo)"
      },
      {
        "k": "callout",
        "t": "Số token chỉ là ước tính thô (ký tự ÷ 4, tiếng Việt có dấu ÷ 3) để so sánh; số thật tuỳ tokenizer của từng model.",
        "t_en": "Token counts are rough estimates (characters ÷ 4, accented Vietnamese ÷ 3) for comparison only; real counts depend on each model's tokenizer."
      }
    ]
  }
];
