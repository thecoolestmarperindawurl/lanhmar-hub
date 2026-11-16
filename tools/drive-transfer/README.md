# LANHMAR Drive Transfer

Chuyển (sao chép) dữ liệu từ Google Drive này sang Google Drive khác bằng Google Apps Script.
*English below.*

- **Google chép hộ, phía máy chủ** (`File.makeCopy`): máy bạn không tải hay tải lên byte nào, file vài GB cũng vậy.
- **Giữ nguyên cây thư mục**, chép mọi loại file: PDF, ảnh, video, Google Docs/Sheets/Slides/Forms…
- **Tự chạy tiếp**: mỗi lượt ~4,5 phút (Apps Script giới hạn 6 phút/lượt), tự hẹn lượt sau 1 phút, chạy cả khi bạn đóng Sheet.
- **Nhật ký từng file** trong sheet `Nhật ký` (OK / LỖI / BỎ QUA), email báo khi xong.
- **Chạy lại an toàn**: "Quét lại và chép bù" chỉ chép file chưa có trong nhật ký (file lỗi, file mới thêm), không chép trùng.

## Cài và chạy (5 phút)

1. **Tài khoản CŨ**: chuột phải thư mục cần chuyển → Chia sẻ → thêm email tài khoản MỚI (quyền *Người xem* là đủ).
   Muốn chuyển cả Drive: tạo một thư mục, kéo mọi thứ vào rồi chia sẻ thư mục đó.
2. **Tài khoản MỚI**: tạo Google Sheet mới → **Tiện ích mở rộng → Apps Script** → xoá code mẫu, dán toàn bộ [`Code.gs`](Code.gs) → **Lưu**.
3. Tải lại Sheet → menu **Chuyển Drive → Bắt đầu chuyển…** → cấp quyền (lần đầu Google báo "chưa xác minh" vì là script của chính bạn: *Nâng cao → Đi tới … (không an toàn)*).
4. Dán link thư mục nguồn; link thư mục đích (để trống = tự tạo thư mục mới trong Drive của tôi). Xong.

Menu: *Xem tiến độ*, *Tạm dừng*, *Tiếp tục*, *Quét lại và chép bù*.

## Giới hạn cần biết

| Giới hạn | Con số | Nguồn |
|---|---|---|
| Thời gian một lượt script | 6 phút (script dừng ở 4,5 phút) | [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas) |
| Tổng thời gian chạy bằng trigger/ngày | 90 phút (Gmail cá nhân), 6 giờ (Workspace) | như trên |
| Dung lượng tải lên + sao chép | 750 GB / 24 giờ / người dùng | [Drive upload limits](https://support.google.com/a/answer/172541) |

- Hết 90 phút/ngày, lượt chạy báo lỗi và script tự thử lại sau 10 phút; hôm sau chạy tiếp. Tốc độ phụ thuộc **số file** hơn dung lượng (mỗi file là một lệnh sao chép).
- Bản chép thuộc sở hữu tài khoản MỚI và tính vào dung lượng của nó. Dữ liệu gốc không bị xoá: kiểm tra xong bạn tự xoá bên cũ.
- Không chép được: file mà chủ file đã tắt *tải xuống/sao chép/in* với người xem; Google Sites, My Maps. Lối tắt (shortcut) được ghi BỎ QUA, chia sẻ thư mục gốc của nó nếu cần.
- Bình luận, lịch sử phiên bản, quyền chia sẻ cũ không đi theo bản chép (giới hạn của Drive khi sao chép).
- Thư mục cùng tên trong cùng một thư mục cha sẽ được gộp làm một bên đích (không mất file).

## Cách hoạt động

Hàng đợi thư mục nằm trong sheet ẩn `_queue` (ID nguồn, ID đích, đường dẫn, đã tạo thư mục con chưa, continuation token của danh sách file). Mỗi lượt lấy thư mục đầu hàng: tạo thư mục con bên đích (dùng lại nếu đã có cùng tên) và đưa vào hàng đợi, rồi chép file; hết giờ thì lưu continuation token và hẹn lượt sau. ID file đã chép thành công đọc lại từ `Nhật ký` nên không chép trùng. Lỗi tạm thời (rate limit, service error) được thử lại 3 lần với backoff.

---

## English

Copy a folder tree from one Google Drive account to another with Google Apps Script. Google copies server-side (`File.makeCopy`), so nothing passes through your computer. The script runs in ~4.5-minute rounds and schedules itself until finished, logs every file to the `Nhật ký` (log) sheet, emails you at the end, and "Rescan and copy missing files" only copies what is not yet in the log.

1. **Old account**: share the folder with the new account (Viewer is enough).
2. **New account**: create a Google Sheet → **Extensions → Apps Script** → paste [`Code.gs`](Code.gs) → **Save**.
3. Reload the Sheet → **Drive Transfer → Start a transfer…** → authorize (the "unverified app" warning is expected for your own script: *Advanced → Go to …*).
4. Paste the source folder link and the destination link (empty = new folder in My Drive).

Limits: 6 min per execution, 90 min/day of trigger runtime on consumer accounts (6 h on Workspace), 750 GB of uploads + copies per user per 24 h. Copies belong to the new account; originals are not deleted. Files whose owner disabled download/copy, Google Sites and My Maps cannot be copied; shortcuts are skipped. Comments, version history and old sharing do not carry over.
