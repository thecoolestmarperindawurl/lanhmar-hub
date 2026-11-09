#!/usr/bin/env bash
# Đóng gói extension Drive Ebook Reader thành ZIP để tải từ lanhmar.id.vn/assets/dl/
# Chạy lại sau mỗi lần sửa extensions/drive-ebook-reader/ rồi commit cả ZIP.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -f assets/dl/drive-ebook-reader.zip
(cd extensions && zip -qr -X ../assets/dl/drive-ebook-reader.zip drive-ebook-reader -x '*.DS_Store')
ls -la assets/dl/drive-ebook-reader.zip
