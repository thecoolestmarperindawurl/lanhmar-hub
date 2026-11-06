/* Kho báu: các công cụ mình tự vibe-code và chia sẻ miễn phí.
   Thêm công cụ: thêm một mục vào window.TREASURES. Trường tiếng Anh là x_en cạnh x (desc_en, points_en, note_en…).
   status: "open" (đã mở, có url) | "soon" (sắp mở, nút bị khoá). url chỉ nhận https. */
window.TREASURES = [
  {
    id: "course-recap",
    name: "Course Recap",
    status: "soon",
    url: "https://github.com/thecoolestmarperindawurl/course-recap-in-detailed",
    kind: "Python · CLI",
    desc: "Biến video bài giảng có chiếu slide thành một trang recap: ảnh từng slide kèm lời giảng của giảng viên ở đúng slide đó. Dán link Drive công khai hoặc chọn file video là chạy.",
    desc_en: "Turns a lecture video with slides on screen into a recap page: each slide image with what the lecturer said during it. Paste a public Drive link or pick a video file and go.",
    points: [
      "Nhận link Google Drive công khai hoặc file video trên máy (Drive chia sẻ theo email: tải về trước)",
      "Chạy hoàn toàn trên máy bạn, không cần tài khoản hay API trả phí",
      "Bỏ phần giới thiệu và nội quy bằng một tuỳ chọn",
      "Dừng giữa chừng rồi chạy tiếp được, hợp video dài hàng giờ"
    ],
    points_en: [
      "Takes a public Google Drive link or a local video file (Drive shared by email: download it first)",
      "Runs entirely on your computer, no account or paid API needed",
      "Skip the intro and class rules with one option",
      "Stop midway and resume later, built for multi-hour videos"
    ],
    tags: ["Python", "ffmpeg", "Whisper", "Google Drive"],
    license: "PolyForm Noncommercial 1.0.0",
    note: "Thực đo trên laptop của mình: video 2 giờ 03 phút, gỡ băng khoảng 51 phút, ra 88 slide. Máy khác sẽ khác.",
    note_en: "Measured on my own laptop: a 2h03 video took about 51 minutes to transcribe and produced 88 slides. Your machine will differ."
  }
];
