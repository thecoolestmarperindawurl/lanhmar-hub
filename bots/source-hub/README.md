# Source-hub — bot lưu bài hay

Gửi link → bot bóc tách bằng skill **kes-extract-content** (Claude Code) → phân tích (tóm tắt, ý chính, cách áp dụng, quy trình, trích dẫn, ý tưởng bài viết) → lưu vào Supabase `public.sources` → xem ở **lanhmar.id.vn/source-hub.html**.

Nhận việc từ 2 nơi:
- **Telegram:** nhắn link thẳng cho bot Source-hub (chỉ `TELEGRAM_OWNER_ID` dùng được).
- **Nomad (Zalo):** chị gõ `/luubai <link>` → Nomad ghi việc vào bảng `public.agent_tasks` → bot này nhận (kiểm 10 giây/lần), làm xong ghi kết quả → Nomad báo lại trên Zalo. Content Creator / Performance sau này nhận việc cùng cách (`agent` = tên bot).

```
Zalo ──/luubai──> Nomad (VPS 1GB) ──insert──> agent_tasks <──poll── Source-hub (VPS 4GB) ──> sources ──> source-hub.html
   <──báo kết quả── Nomad <──done──┘                            Telegram ──link──┘
```

## Cài lần đầu (theo thứ tự)

1. **Supabase → SQL Editor:** dán `storage-backend/source-hub.sql` → Run (sau `supabase.sql` đã chạy từ trước).
2. **Telegram:** @BotFather → `/newbot` → đặt tên Source-hub → lấy token. Nhắn @userinfobot để biết ID số của mình.
3. **Khoá:** Supabase → Project Settings → API Keys → *Secret key*. Anthropic Console → API Keys (nên đặt hạn mức chi tiêu tháng).
4. **VPS 4GB (Ubuntu, user thường có sudo):**
   ```bash
   git clone https://github.com/thecoolestmarperindawurl/lanhmar-hub.git && cd lanhmar-hub/bots/source-hub
   ```
   Từ máy Windows chép skill lên VPS:
   ```bash
   scp -r ~/.claude/skills/kes-extract-content <host>:~/.claude/skills/
   ```
   Trên VPS: `bash setup.sh` (lần đầu tạo `.env`) → điền `.env` bằng `nano .env` → `bash setup.sh` lần nữa → bot chạy dưới systemd.
5. **Nomad:** thêm `SUPABASE_URL` + `SUPABASE_SECRET_KEY` vào `~/zalo-bot/.env` trên VPS 1GB, deploy `src/agents.js`, `src/zalo-commands.js`, `src/index.js` (xem `Nomad Lanhmar/CLAUDE.md`).
6. **Cấp quyền xem:** người được duyệt ở Data Storage (Kho cá nhân → Quản trị Storage) vào Source-hub bằng cùng email + mã. Chị tự đăng ký một mã cho mình rồi duyệt.

## Dùng hằng ngày

- Log: `journalctl -u source-hub -f` · Khởi động lại: `sudo systemctl restart source-hub`
- Cập nhật mã: `cd ~/lanhmar-hub && git pull && sudo systemctl restart source-hub`
- Test phần thuần: `python3 test_bot.py`

## Giới hạn trên VPS

- Không có màn hình nên **không đăng nhập CloakBrowser được**: bài Facebook/Instagram/X cần đăng nhập sẽ ra `partial` (chỉ phần công khai). Trang web, YouTube, TikTok, PDF chạy bình thường.
- Không có `agy` (Gemini): video đi đường phụ đề → speech-to-text. Muốn xem hình trong video thì cài `agy` lên VPS sau.
- Mỗi link tốn tiền API Anthropic (Claude đọc + phân tích); video dài tốn hơn. `CLAUDE_TIMEOUT` mặc định 25 phút.
- Claude chạy với Bash trên VPS và đọc nội dung web lạ: bot chỉ đưa cho nó `ANTHROPIC_API_KEY`, không đưa token Telegram/khoá Supabase. Chạy bằng user thường, không chạy bằng root.
