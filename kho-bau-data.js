/* Kho báu: các công cụ mình tự vibe-code và chia sẻ miễn phí.
   Thêm công cụ: thêm một mục vào window.TREASURES, mục MỚI NHẤT đặt ĐẦU danh sách (thẻ "Mới ra lò" ở hero lấy mục đầu). Trường tiếng Anh là x_en cạnh x (desc_en, points_en, note_en, type_en, badge_en…).
   - hook/hook_en: một câu móc ≤ 90 ký tự cho thẻ hero; thiếu thì lấy câu đầu của desc.
   - shelf: id kệ trong TREASURE_SHELVES. featured: true để hiện ở khối "Mới và nổi bật".
   - status: "open" (đã mở, có url) | "soon" (sắp mở, nút bị khoá). url nhận https hoặc trang trong site (vd ai-convert.html).
   - detail: có thì nút chính mở hộp chi tiết trong trang (course-recap dùng mẫu riêng; mục có `sections` dùng nội dung dạng khối callout/h/p/list/steps/table/code giống thẻ Kho Ứng dụng); bỏ trống thì nút chính đi thẳng tới url. direct: true thêm nút mở thẳng công cụ. meta/note/links: thông tin phụ trong hộp chi tiết.
   - demo: ví dụ kết quả hiện trong hộp chi tiết. kind "recap" (slides: [{ n, img (+img_en: ảnh slide mẫu 800×450 trong assets/res/), time, title, bullets[], speech }]) hoặc "convert" (before/after: { label, text }). Chỉ dùng dữ liệu mẫu tự soạn, ghi rõ là mẫu; có cặp x_en cho chữ.
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
