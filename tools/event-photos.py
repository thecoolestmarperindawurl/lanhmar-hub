#!/usr/bin/env python3
"""Chuẩn bị ảnh sự kiện cho mục "Sự kiện trong nhóm" (community.html).

Đầu vào: một thư mục ảnh gốc (JPG/PNG/HEIC đã đổi sang JPG). Đầu ra: assets/img/events/<id-sự-kiện>/NN.webp
(cạnh dài tối đa 1600px, WebP chất lượng 82, bỏ EXIF/GPS), kèm bảng độ sáng để chọn ảnh sáng, rõ.

Cách dùng:
  python3 tools/event-photos.py anh-goc/ --id workshop-di-lam-voi-ai-2026-10            # chỉ chấm điểm, không ghi
  python3 tools/event-photos.py anh-goc/ --id workshop-di-lam-voi-ai-2026-10 --write    # ghi toàn bộ
  python3 tools/event-photos.py anh-goc/ --id ... --write --pick DSCF1080.jpg DSCF1042.jpg   # chỉ ghi các ảnh chọn, theo thứ tự này

Rồi khai báo trong community-data.js → EVENTS[].photos: [{ src: "assets/img/events/<id>/01.webp", alt: "…", alt_en: "…" }, …]
(ảnh đầu tiên là ảnh bìa). Cần Pillow: pip install pillow
"""
import argparse, sys
from pathlib import Path

try:
    from PIL import Image, ImageOps, ImageStat
except ImportError:
    sys.exit("Thiếu Pillow. Chạy: pip install pillow")

EXT = {".jpg", ".jpeg", ".png", ".webp"}


def score(im):
    """Độ sáng trung bình (0–255) và độ tương phản (độ lệch chuẩn) trên bản thu nhỏ, để xếp ảnh sáng lên trước."""
    g = ImageOps.exif_transpose(im).convert("L").resize((160, 160))
    st = ImageStat.Stat(g)
    return st.mean[0], st.stddev[0]


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("src", help="thư mục ảnh gốc")
    ap.add_argument("--id", required=True, help="id sự kiện (tên thư mục đích trong assets/img/events/)")
    ap.add_argument("--write", action="store_true", help="ghi file WebP (mặc định chỉ chấm điểm)")
    ap.add_argument("--pick", nargs="*", help="chỉ xử lý các file này, theo đúng thứ tự (ảnh đầu = ảnh bìa)")
    ap.add_argument("--max", type=int, default=1600, help="cạnh dài tối đa (px), mặc định 1600")
    ap.add_argument("--quality", type=int, default=82)
    a = ap.parse_args()

    root = Path(__file__).resolve().parent.parent
    src = Path(a.src)
    files = [src / n for n in a.pick] if a.pick else sorted(f for f in src.iterdir() if f.suffix.lower() in EXT)
    missing = [f for f in files if not f.exists()]
    if missing:
        sys.exit("Không thấy: " + ", ".join(str(m) for m in missing))
    if not files:
        sys.exit("Thư mục không có ảnh JPG/PNG/WebP.")

    rows = []
    for f in files:
        with Image.open(f) as im:
            b, c = score(im)
            rows.append((f, b, c, im.size))
    print(f"{'ảnh':28} {'sáng':>6} {'tương phản':>11}  kích thước   gợi ý")
    for f, b, c, (w, h) in (rows if a.pick else sorted(rows, key=lambda r: -r[1])):
        hint = "sáng, nên dùng" if b >= 120 and c >= 40 else ("tối" if b < 90 else "tạm được")
        print(f"{f.name:28} {b:6.0f} {c:11.0f}  {w}×{h}   {hint}")

    if not a.write:
        print("\nChưa ghi gì. Thêm --write (và --pick ... để chọn ảnh) để xuất WebP.")
        return
    out = root / "assets" / "img" / "events" / a.id
    out.mkdir(parents=True, exist_ok=True)
    for n, (f, b, c, _) in enumerate(rows, 1):
        with Image.open(f) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")  # xoay đúng chiều, bỏ EXIF (kể cả GPS)
            im.thumbnail((a.max, a.max), Image.LANCZOS)
            dest = out / f"{n:02d}.webp"
            im.save(dest, "WEBP", quality=a.quality, method=6)
            print(f"✓ {dest.relative_to(root)}  {im.size[0]}×{im.size[1]}  {dest.stat().st_size // 1024} KB  (từ {f.name})")
    print(f"\nKhai báo trong community-data.js → EVENTS[].photos với src: \"assets/img/events/{a.id}/01.webp\" …")


if __name__ == "__main__":
    main()
