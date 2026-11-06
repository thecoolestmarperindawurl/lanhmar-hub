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

Video trên Google Drive **công khai** — file chia sẻ **"Bất kỳ ai có đường liên kết"** (Anyone with the link):

```bash
python recap.py "https://drive.google.com/file/d/<ID>/view" --title "Buổi 1"
```

**Drive chỉ chia sẻ cho một số email? / Drive shared only with specific people?** → đăng nhập Google một lần, xem mục [Đăng nhập Google](#đăng-nhập-google--sign-in-with-google) bên dưới. / Sign in with Google once, see [Sign in with Google](#đăng-nhập-google--sign-in-with-google) below.

Video đã có trên máy / a local file:

```bash
python recap.py bai-giang.mp4 --title "Buổi 1"
```

Mở `recap-<tên>/recap.html` bằng trình duyệt. Thư mục kết quả gồm `recap.html` (xem), `recap.md`, `recap.json`, `slides/` (ảnh). Muốn chia sẻ kết quả, gửi cả thư mục, không chỉ riêng file html.

## Đăng nhập Google / Sign in with Google

**VI** — Với video Drive chỉ chia sẻ cho một danh sách email, đăng nhập Google **một lần** rồi dán link như thường. Quyền chỉ **đọc Drive** (`drive.readonly`): tool không sửa hay xoá gì. **Mỗi người tự tạo thông tin đăng nhập của mình** (miễn phí, khoảng 10 phút, một lần), vì Google giới hạn và kiểm duyệt quyền đọc Drive nên không thể dùng chung.

**EN** — For Drive videos shared only with specific emails, sign in to Google **once**, then paste links as usual. The permission is **read-only Drive** (`drive.readonly`): the tool never edits or deletes anything. **Everyone creates their own credentials** (free, about 10 minutes, one time), because Google restricts and reviews Drive-read access so one shared credential is not possible.

### 1. Tạo thông tin đăng nhập (một lần) / Create credentials (once)

Tên menu của Google Cloud Console hay đổi; nếu khác, tìm theo từ khoá in đậm. / Menu names change; search by the bold keywords.

1. Vào https://console.cloud.google.com bằng tài khoản **đã được cấp quyền xem video**, tạo một project mới (hoặc dùng lại project cũ). / Sign in with the account **that can view the video** and create a project.
2. **APIs & Services → Library** → **Google Drive API** → **Enable**.
3. **OAuth consent screen** (hoặc **Google Auth Platform**): **External**, điền tên ứng dụng tuỳ ý và email của bạn. Ở **Audience / Test users**, **thêm chính email của bạn**, để chế độ **Testing**. / Choose **External**, add **your own email under Test users**, keep **Testing**.
4. **Clients → Create client** → **Application type: Desktop app** → **Download JSON**. / Choose **Desktop app** and download the JSON.
5. Đổi tên file thành `google-client.json`, đặt cạnh `recap.py` (hoặc dùng `--google-client đường-dẫn`). / Rename it `google-client.json` next to `recap.py` (or use `--google-client path`).

### 2. Đăng nhập (một lần) / Sign in (once)

```bash
python recap.py --google-login
```

Trình duyệt mở ra: chọn **đúng tài khoản được cấp quyền xem video**. Vì ứng dụng ở chế độ Testing, Google hiện **“Google hasn’t verified this app”**: bấm **Advanced → Go to … (unsafe)**, rồi cho phép quyền chỉ đọc Drive. Đây là ứng dụng do chính bạn tạo nên cảnh báo này là bình thường. / The browser opens: pick **the account that can view the video**. Because the app is in Testing, Google shows **“Google hasn’t verified this app”**: click **Advanced → Go to … (unsafe)** and allow read-only Drive access. It is your own app, so this warning is expected.

Sau đó dùng bình thường / Then use it as usual:

```bash
python recap.py "https://drive.google.com/file/d/<ID>/view" --title "Buổi 1"
```

### Lưu ý an toàn / Safety notes

- **Không chia sẻ `google-client.json` và file token**, không đưa lên GitHub (`.gitignore` đã chặn các tên phổ biến). Token lưu ở `~/.course-recap/google-token.json` (Windows: `C:\Users\<tên>\.course-recap\`); ai có file này đọc được Drive của bạn. / Never share `google-client.json` or the token file and never commit them. Anyone with the token file can read your Drive.
- `python recap.py --google-logout` xoá token trên máy; thu hồi hẳn tại https://myaccount.google.com/permissions. / `--google-logout` deletes the local token; revoke fully at that URL.
- **Token hết hạn sau 7 ngày** khi ứng dụng ở chế độ Testing (quy định của Google): chạy lại `--google-login`. / **The token expires after 7 days** while the app is in Testing (Google's rule): rerun `--google-login`.
- Chủ file **tắt quyền tải xuống** thì tool không tải được (giới hạn của Drive): xin chủ file cho phép. / If the owner **disabled downloads**, the tool cannot download it (a Drive limit): ask the owner to allow it.
- Đổi tài khoản: `--google-logout` rồi `--google-login`. Tải đứt mạng thì tự tiếp tục từ chỗ đã tải. / Switch account with logout then login. Interrupted downloads resume automatically.

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

Một lần đo thực tế: video **2 giờ 03 phút**, laptop Windows, model `small` — dò slide ~3 phút, gỡ băng ~51 phút, ra 88 slide. Máy khác sẽ khác. Gỡ băng là bước lâu nhất; bấm `Ctrl+C` bất cứ lúc nào rồi chạy lại **đúng lệnh cũ** để làm tiếp từ chỗ dừng (xem mục “Dừng và chạy tiếp”).

## Dừng và chạy tiếp / Stop and resume

**VI** — Video dài chạy hàng chục phút đến hàng giờ, nên bạn có thể **dừng bất cứ lúc nào rồi chạy tiếp sau**.

- **Dừng:** bấm `Ctrl+C` **một lần** trong cửa sổ dòng lệnh, chờ dòng “Đã dừng”. Nếu lỡ tắt cửa sổ hoặc mất điện, bạn chỉ mất tối đa khoảng 30 giây gỡ băng.
- **Chạy tiếp:** chạy lại **đúng lệnh cũ** (giữ nguyên `--out` nếu bạn có đặt). Tool in dòng “Đã lưu từ lần trước, sẽ dùng lại: …” cho biết nó nhớ những gì.

| Bước | Nếu dừng giữa chừng |
|---|---|
| Tải video từ Drive | Giữ phần đã tải, lần sau tải tiếp (không tải lại từ đầu) |
| Dò slide | Lưu khi xong. Nếu dừng giữa bước này thì làm lại bước này |
| Gỡ băng (lâu nhất) | Lưu mỗi ~30 giây, lần sau tiếp tục từ chỗ dừng |
| Chụp slide, xuất recap | Không lưu dở, làm lại mỗi lần chạy |

**Khi nào tool làm lại từ đầu (cố ý):** đổi sang **video khác** trong cùng thư mục (tool tự phát hiện, không dùng nhầm lời giảng cũ); đổi `--model`, `--beam` hoặc `--lang` (gỡ băng lại); đổi `--scene`, `--crop` hoặc `--min-gap` (dò slide lại). Đổi `--context` / `--glossary` **không** gỡ băng lại; muốn áp dụng cho lời giảng thì xoá file `transcript-*.json` trong thư mục kết quả.

**EN** — Long videos take tens of minutes to hours, so you can **stop any time and resume later**.

- **Stop:** press `Ctrl+C` **once** and wait for “Đã dừng” (stopped). If you close the window or lose power you lose at most ~30 seconds of transcription.
- **Resume:** rerun the **exact same command** (keep `--out` if you used it). The tool prints “Đã lưu từ lần trước, sẽ dùng lại: …” (saved from last time, will reuse) to show what it remembers.

| Step | If interrupted |
|---|---|
| Downloading from Drive | The partial file is kept and the download continues next time |
| Slide detection | Saved when finished. If interrupted midway, this step is redone |
| Transcription (the slowest) | Saved about every 30 s, resumes where it stopped |
| Slide images, writing the recap | Not saved midway, redone on every run |

**When it deliberately starts over:** a **different video** in the same folder (detected automatically, so an old transcript is never reused by mistake); a changed `--model`, `--beam` or `--lang` (retranscribes); a changed `--scene`, `--crop` or `--min-gap` (redoes slide detection). Changing `--context` / `--glossary` does **not** retranscribe; delete the `transcript-*.json` file in the output folder to apply it.

## Giới hạn / Limits

- **Chữ là gỡ băng tự động** nên có thể sai thuật ngữ, tên riêng, số liệu. Hãy đọc lại trước khi dùng; dùng `--glossary` và `--model medium` để giảm lỗi.
- Link Drive công khai ("Bất kỳ ai có link") dùng được ngay. File riêng tư cần **đăng nhập Google một lần** (mục trên) và chủ file không tắt quyền tải. Drive đôi khi tạm khoá file có quá nhiều lượt tải. / Public links work immediately. Private files need a **one-time Google sign-in** (above) and downloads must not be disabled by the owner.
- Slide được nhận biết khi hình đổi mạnh. Video có webcam chiếm khung, hoặc slide chỉ đổi chữ, cần chỉnh `--crop` / `--scene`.
- Recap giữ nguyên lời giảng, **không tóm tắt hay viết lại**.
- Chỉ dùng với video bạn có quyền sử dụng (khoá học của bạn, hoặc được người sở hữu cho phép).

## Quyền riêng tư / Privacy

Gỡ băng chạy bằng `faster-whisper` ngay trên máy bạn. Mạng chỉ dùng để tải video từ Drive (và đăng nhập Google nếu bạn chọn) và tải model whisper về lần đầu. Không có gì được gửi đi đâu khác; token đăng nhập chỉ nằm trên máy bạn. / The network is only used to download the video from Drive (and for Google sign-in if you choose it) and to fetch the whisper model once. Nothing else is sent anywhere; the sign-in token stays on your machine.

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
