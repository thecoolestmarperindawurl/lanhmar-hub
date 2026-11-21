#!/usr/bin/env bash
# Cài Source-hub lên VPS Ubuntu (chạy bằng user thường có sudo, KHÔNG chạy bằng root):
#   bash setup.sh
# Cần sẵn: thư mục skill ~/.claude/skills/kes-extract-content (chép từ máy bạn bằng scp, xem README).
set -euo pipefail
cd "$(dirname "$0")"

sudo apt-get update -qq
sudo apt-get install -y -qq ffmpeg python3 curl ca-certificates
command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || {
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y -qq nodejs; }
command -v claude >/dev/null || sudo npm install -g @anthropic-ai/claude-code
command -v uvx >/dev/null || { curl -LsSf https://astral.sh/uv/install.sh | sh; }
export PATH="$HOME/.local/bin:$PATH"

[ -f "$HOME/.claude/skills/kes-extract-content/SKILL.md" ] || { echo "Thiếu skill kes-extract-content trong ~/.claude/skills (xem README)"; exit 1; }
[ -f .env ] || { cp .env.example .env; chmod 600 .env; echo "Đã tạo .env: điền giá trị rồi chạy lại setup.sh"; exit 0; }
chmod 600 .env

python3 test_bot.py
uvx --version && ffmpeg -version | head -1 && claude --version

sed -e "s|__USER__|$USER|g" -e "s|__DIR__|$PWD|g" -e "s|__PATH__|$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin|g" \
  source-hub.service | sudo tee /etc/systemd/system/source-hub.service >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now source-hub
sleep 2; systemctl --no-pager status source-hub | head -5
echo "Xong. Xem log: journalctl -u source-hub -f"
