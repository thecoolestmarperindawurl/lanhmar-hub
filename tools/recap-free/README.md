# Course Recap (free) · Recap bài giảng miễn phí

**VI** — Biến video bài giảng (có chiếu slide) thành một trang recap: **ảnh từng slide + lời giảng của giảng viên ở đúng slide đó**, theo mốc thời gian. Chạy hoàn toàn trên máy bạn, **không cần tài khoản, không cần API trả phí**; video chỉ được tải từ Google Drive về máy bạn.

**EN** — Turns a lecture video (with slides on screen) into a recap page: **each slide image + what the lecturer said during it**, in time order. Runs entirely on your computer — no account, no paid API. The video is only downloaded from Google Drive to your machine.

## Cài đặt / Setup (một lần / once)

1. Cài Python 3.9+ và [ffmpeg](https://ffmpeg.org/download.html) (Windows: `winget install Gyan.FFmpeg` · macOS: `brew install ffmpeg`).
2. Cài thư viện / install libraries:

```bash
pip install -r requirements.txt
```

## Dùng / Usage

Video trên Google Drive — file phải chia sẻ **"Bất kỳ ai có đường liên kết" – Người xem** (Anyone with the link – Viewer):

```bash
python recap.py "https://drive.google.com/file/d/<ID>/view" --title "Buổi 1"
```

Video đã có trên máy / a local file:

```bash
python recap.py bai-giang.mp4 --title "Buổi 1"
```

Mở `recap-<tên>/recap.html` bằng trình duyệt. Thư mục kết quả gồm `recap.html` (xem), `recap.md`, `recap.json`, `slides/` (ảnh). Muốn chia sẻ kết quả, gửi cả thư mục, không chỉ riêng file html.

## Tuỳ chọn hay dùng / Handy options

| Tuỳ chọn | Tác dụng |
|---|---|
| `--skip-until 05:30` | Bỏ mọi slide trước mốc này (giới thiệu, nội quy) |
| `--skip-slides "1-3,9"` | Bỏ slide cụ thể theo số |
| `--glossary thuat-ngu.txt` + `--context "Khoá Photoshop"` | Cho gỡ băng biết thuật ngữ/tên riêng (mỗi dòng một từ) để ít sai hơn |
| `--model medium` | Gỡ băng kỹ hơn, chậm hơn (mặc định `small`) |
| `--transcript file.srt` | Dùng phụ đề có sẵn, khỏi gỡ băng |
| `--crop "iw*0.78:ih:0:0"` | Chỉ xét vùng slide, bỏ khung webcam. Xem `sample.jpg` để chọn vùng |
| `--scene 0.1` | Nhạy hơn khi các slide chung một mẫu nền (mặc định 0.3) |
| `--min-gap 10` | Mỗi slide tối thiểu 10 giây, giảm slide thừa |

## Thời gian / How long it takes

Một lần đo thực tế: video **2 giờ 03 phút**, laptop Windows, model `small` — dò slide ~3 phút, gỡ băng ~51 phút, ra 88 slide. Máy khác sẽ khác. Gỡ băng là bước lâu nhất; bấm `Ctrl+C` bất cứ lúc nào rồi chạy lại **đúng lệnh cũ** để làm tiếp từ chỗ dừng.

## Giới hạn / Limits

- **Chữ là gỡ băng tự động** nên có thể sai thuật ngữ, tên riêng, số liệu. Hãy đọc lại trước khi dùng; dùng `--glossary` và `--model medium` để giảm lỗi.
- Link Drive phải công khai ở mức "Bất kỳ ai có link". File giới hạn người xem theo email thì **không tải được** — hãy tải về máy rồi dùng đường dẫn file. Drive đôi khi tạm khoá file có quá nhiều lượt tải.
- Slide được nhận biết khi hình đổi mạnh. Video có webcam chiếm khung, hoặc slide chỉ đổi chữ, cần chỉnh `--crop` / `--scene`.
- Recap giữ nguyên lời giảng, **không tóm tắt hay viết lại**.
- Chỉ dùng với video bạn có quyền sử dụng (khoá học của bạn, hoặc được người sở hữu cho phép).

## Quyền riêng tư / Privacy

Gỡ băng chạy bằng `faster-whisper` ngay trên máy bạn. Mạng chỉ dùng để tải video từ Drive và tải model whisper về lần đầu. Không có gì được gửi đi đâu khác.

## Giấy phép / License

**VI** — [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) (xem file `LICENSE`). Tóm tắt dễ hiểu, **văn bản giấy phép mới là bản chuẩn**:

- **Được dùng** cho mục đích phi thương mại: học tập, nghiên cứu, dự án cá nhân, trường học, tổ chức nghiên cứu và tổ chức phi lợi nhuận. Được chỉnh sửa và chia sẻ lại, miễn là giữ nguyên giấy phép và dòng `Required Notice`.
- **Không được dùng** cho mục đích thương mại (kinh doanh, bán dịch vụ, đưa vào sản phẩm thu phí). Cần dùng thương mại: liên hệ tác giả để xin phép riêng.
- Đây **không phải** giấy phép mã nguồn mở theo định nghĩa của OSI vì có giới hạn phi thương mại. Đây không phải tư vấn pháp lý.

**EN** — [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) (see `LICENSE`). Plain-language summary; **the license text is authoritative**:

- **Allowed** for noncommercial purposes: study, research, personal projects, schools, research bodies and non-profits. You may modify and share it as long as you keep the license and the `Required Notice` line.
- **Not allowed** for commercial purposes (business use, selling services, building it into a paid product). For commercial use, contact the author for separate permission.
- It is **not** an OSI-approved open-source license because of the noncommercial limit. This is not legal advice.

Copyright 2026 Dương Thị Lan Anh (LANHMAR) · https://lanhmar.id.vn
