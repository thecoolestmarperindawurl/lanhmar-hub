/* Kho báu: các công cụ mình tự vibe-code và chia sẻ miễn phí.
   Thêm công cụ: thêm một mục vào window.TREASURES. Trường tiếng Anh là x_en cạnh x (desc_en, points_en, note_en, type_en, badge_en…).
   - shelf: id kệ trong TREASURE_SHELVES. featured: true để hiện ở khối "Mới và nổi bật".
   - status: "open" (đã mở, có url) | "soon" (sắp mở, nút bị khoá). url nhận https hoặc trang trong site (vd ai-convert.html).
   - detail: có thì nút chính mở hộp chi tiết trong trang (course-recap dùng mẫu riêng; mục có `sections` dùng nội dung dạng khối callout/h/p/list/steps/table/code giống thẻ Kho Ứng dụng); bỏ trống thì nút chính đi thẳng tới url. direct: true thêm nút mở thẳng công cụ. meta/note/links: thông tin phụ trong hộp chi tiết.
   - demo: ví dụ kết quả hiện trong hộp chi tiết. kind "recap" (slides: [{ n, time, title, bullets[], speech }]) hoặc "convert" (before/after: { label, text }). Chỉ dùng dữ liệu mẫu tự soạn, ghi rõ là mẫu; có cặp x_en cho chữ.
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
    demo: {
      kind: "recap",
      slides: [
        { n: 3, time: "00:12:40",
          title: "Phễu marketing", title_en: "Marketing funnel",
          bullets: ["Nhận biết", "Cân nhắc", "Mua hàng"], bullets_en: ["Awareness", "Consideration", "Purchase"],
          speech: "Ở slide này, phễu có ba tầng. Tầng trên cùng là nhận biết: người ta mới biết đến thương hiệu. Tầng giữa là cân nhắc: họ so sánh với lựa chọn khác. Tầng cuối mới là mua hàng. Mỗi tầng cần một loại nội dung khác nhau.",
          speech_en: "On this slide the funnel has three layers. The top is awareness: people have just heard of the brand. The middle is consideration: they compare it with other options. Only the bottom is purchase. Each layer needs a different kind of content." },
        { n: 4, time: "00:15:05",
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
      { l: "Dữ liệu", l_en: "Your data", v: "Xử lý ngay trong trình duyệt, file không rời máy", v_en: "Processed in your browser, files never leave your device" }
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
    links: [{ t: "Bản dòng lệnh trên GitHub ↗", t_en: "Command-line version on GitHub ↗", u: "https://github.com/thecoolestmarperindawurl/lanhmar-hub/blob/main/tools/to-md.py" }],
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
