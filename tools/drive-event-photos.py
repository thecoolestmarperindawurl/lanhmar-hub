#!/usr/bin/env python3
"""Chạy trên GitHub Actions (.github/workflows/event-photos.yml): tải ảnh Drive công khai, chuyển WebP, chấm độ sáng.

Biến môi trường: EVENT_ID, MODE (review|final), FOLDER_ID (review), FILE_IDS (final, cách nhau bằng dấu cách), MAX_PX.
  review → tools/.event-review/<EVENT_ID>/report.json + contact-N.jpg (ảnh ghép có tên, độ sáng) + thumbs/<id>.jpg
  final  → assets/img/events/<EVENT_ID>/NN.webp theo thứ tự FILE_IDS (bỏ EXIF/GPS)
Không dùng khoá API: chỉ hoạt động với file/thư mục ở chế độ "Bất kỳ ai có link".
"""
import io, json, os, re, sys
from pathlib import Path

import requests
from PIL import Image, ImageDraw, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parent.parent
EVENT_ID = re.sub(r"[^\w\-]", "", os.environ.get("EVENT_ID", ""))
MODE = os.environ.get("MODE", "review").strip()
MAX_PX = int(os.environ.get("MAX_PX") or 1600)
S = requests.Session()
S.headers["User-Agent"] = "Mozilla/5.0 (lanhmar-hub event photos)"


def list_folder(folder_id):
    """Danh sách (id, tên) trong thư mục công khai, qua trang embeddedfolderview (không cần API)."""
    r = S.get(f"https://drive.google.com/embeddedfolderview?id={folder_id}#list", timeout=60)
    r.raise_for_status()
    items = re.findall(r'<div class="flip-entry" id="entry-([\w-]+)".*?<div class="flip-entry-title">(.*?)</div>', r.text, re.S)
    seen, out = set(), []
    for fid, name in items:
        if fid not in seen:
            seen.add(fid); out.append((fid, re.sub(r"<.*?>", "", name).strip()))
    return out


def download(fid):
    r = S.get("https://drive.google.com/uc", params={"export": "download", "id": fid, "confirm": "t"}, timeout=120, allow_redirects=True)
    if "text/html" in r.headers.get("content-type", ""):
        m = re.search(r'href="(/uc\?export=download[^"]+)"', r.text)  # trang xác nhận với file lớn
        if m:
            r = S.get("https://drive.google.com" + m.group(1).replace("&amp;", "&"), timeout=120)
    r.raise_for_status()
    if "text/html" in r.headers.get("content-type", ""):
        raise RuntimeError("Drive trả về trang HTML (file không công khai?)")
    return r.content


def brightness(im):
    g = ImageOps.exif_transpose(im).convert("L").resize((160, 160))
    st = ImageStat.Stat(g)
    return round(st.mean[0]), round(st.stddev[0])


def to_webp(data, dest, max_px):
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
    im.thumbnail((max_px, max_px), Image.LANCZOS)
    im.save(dest, "WEBP", quality=82, method=6)
    return im.size


def review(folder_id):
    out = ROOT / "tools" / ".event-review" / EVENT_ID
    thumbs = out / "thumbs"; thumbs.mkdir(parents=True, exist_ok=True)
    files = [(f, n) for f, n in list_folder(folder_id) if re.search(r"\.(jpe?g|png|webp)$", n, re.I) or "." not in n]
    print(f"Thư mục có {len(files)} ảnh")
    rows = []
    for fid, name in files:
        try:
            data = download(fid)
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")
            b, c = brightness(im)
            t = im.copy(); t.thumbnail((480, 480)); t.save(thumbs / f"{fid}.jpg", "JPEG", quality=80)
            rows.append({"id": fid, "name": name, "w": im.size[0], "h": im.size[1], "bright": b, "contrast": c, "bytes": len(data)})
            print(f"✓ {name} {im.size} sáng={b} tương phản={c}")
        except Exception as e:
            rows.append({"id": fid, "name": name, "error": str(e)}); print(f"✗ {name}: {e}")
    rows_ok = sorted([r for r in rows if "error" not in r], key=lambda r: -r["bright"])
    (out / "report.json").write_text(json.dumps({"folder": folder_id, "files": rows_ok, "errors": [r for r in rows if "error" in r]}, ensure_ascii=False, indent=1))
    # ảnh ghép: 4 cột, mỗi ô 300×225 + nhãn, 20 ảnh một tờ, xếp theo độ sáng giảm dần
    per, cols, cw, ch = 20, 4, 300, 250
    for s in range(0, len(rows_ok), per):
        chunk = rows_ok[s:s + per]
        sheet = Image.new("RGB", (cols * cw, ((len(chunk) + cols - 1) // cols) * ch), "white")
        d = ImageDraw.Draw(sheet)
        for i, r in enumerate(chunk):
            t = Image.open(thumbs / f"{r['id']}.jpg"); t.thumbnail((cw - 10, ch - 40))
            x, y = (i % cols) * cw + 5, (i // cols) * ch + 5
            sheet.paste(t, (x, y))
            d.text((x, y + ch - 32), f"{s + i + 1}. {r['name']}  sáng {r['bright']} / tp {r['contrast']}", fill="black")
        sheet.save(out / f"contact-{s // per + 1}.jpg", "JPEG", quality=80)
    print(f"Đã ghi {out.relative_to(ROOT)}: report.json, {(len(rows_ok) + per - 1) // per} contact sheet")


def final(file_ids):
    out = ROOT / "assets" / "img" / "events" / EVENT_ID
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.webp"):
        old.unlink()
    for n, fid in enumerate(file_ids, 1):
        data = download(fid)
        dest = out / f"{n:02d}.webp"
        size = to_webp(data, dest, MAX_PX)
        print(f"✓ {dest.relative_to(ROOT)} {size} {dest.stat().st_size // 1024} KB (từ {fid})")


if __name__ == "__main__":
    if not EVENT_ID:
        sys.exit("Thiếu EVENT_ID")
    if MODE == "review":
        fid = os.environ.get("FOLDER_ID", "").strip()
        if not fid:
            sys.exit("mode review cần FOLDER_ID")
        review(fid)
    elif MODE == "final":
        ids = [x for x in re.split(r"[\s,]+", os.environ.get("FILE_IDS", "")) if x]
        if not ids:
            sys.exit("mode final cần FILE_IDS")
        final(ids)
    else:
        sys.exit("MODE phải là review hoặc final")
