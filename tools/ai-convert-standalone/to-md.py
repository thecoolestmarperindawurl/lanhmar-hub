#!/usr/bin/env python3
"""Chuyển cả thư mục tài liệu (PDF, Word, Excel, PowerPoint, HTML, CSV...) sang Markdown để AI Agent đọc nhanh.

Bản dòng lệnh của AI Convert (index.html), dùng khi vibe code: gom tài liệu dự án vào docs/context/
để Claude Code / Cursor chỉ mở đúng file cần, thay vì nhai cả PDF.

Cài một lần:
  pip install 'markitdown[pdf,docx,xlsx,pptx]'

Cách dùng:
  python3 to-md.py tai-lieu/                  # ghi ra docs/context/
  python3 to-md.py brief.pdf kpi.xlsx -o docs/context
  python3 to-md.py tai-lieu/ --chunk 8000     # chia file dài thành phần ~8000 token

Kết quả: mỗi tài liệu một file .md (có metadata đầu file) + INDEX.md liệt kê tất cả.
Gợi ý ghi vào CLAUDE.md: "Tài liệu tham khảo ở docs/context/, đọc INDEX.md trước."
Ước tính token chỉ là con số thô (ký tự ÷ 4, tiếng Việt có dấu ÷ 3).
"""
import argparse, datetime, re, sys, unicodedata
from pathlib import Path

EXTS = {".pdf", ".docx", ".xlsx", ".xls", ".csv", ".pptx", ".html", ".htm", ".txt", ".md", ".json", ".xml", ".epub"}
VI = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def slug(s):
    s = unicodedata.normalize("NFD", s).replace("đ", "d").replace("Đ", "D")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^\w.-]+", "-", s).strip("-") or "file"


def est_tokens(t):
    ratio = 3 if len(VI.findall(t)) / max(1, len(t)) > 0.03 else 4
    return -(-len(t) // ratio)


def chunks(md, max_tok):
    if not max_tok or est_tokens(md) <= max_tok:
        return [md]
    out, cur = [], ""
    for b in re.split(r"\n(?=#{1,3} )|\n\n", md):
        nxt = cur + "\n\n" + b if cur else b
        if cur and est_tokens(nxt) > max_tok:
            out.append(cur)
            cur = b
        else:
            cur = nxt
    return out + ([cur] if cur else [])


def collect(paths):
    for p in map(Path, paths):
        if p.is_dir():
            yield from sorted(f for f in p.rglob("*") if f.is_file() and f.suffix.lower() in EXTS)
        elif p.is_file():
            yield p
        else:
            print(f"! Không thấy: {p}", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("inputs", nargs="+", help="file hoặc thư mục")
    ap.add_argument("-o", "--out", default="docs/context", help="thư mục ghi kết quả (mặc định docs/context)")
    ap.add_argument("--chunk", type=int, default=0, help="chia file dài khi vượt N token (0 = không chia)")
    a = ap.parse_args()

    try:
        from markitdown import MarkItDown
    except ImportError:
        sys.exit("Thiếu thư viện. Chạy: pip install 'markitdown[pdf,docx,xlsx,pptx]'")

    md_conv, out = MarkItDown(), Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    today, rows, used = datetime.date.today().isoformat(), [], set()

    for f in collect(a.inputs):
        try:
            text = md_conv.convert(str(f)).text_content or ""
        except Exception as e:  # file hỏng, có mật khẩu, định dạng lạ...
            print(f"✗ {f}: {e}", file=sys.stderr)
            continue
        text = re.sub(r"\n{3,}", "\n\n", re.sub(r"[ \t]+$", "", text, flags=re.M)).strip()
        if not text:
            print(f"✗ {f}: không có chữ (bản scan/ảnh?) — gửi thẳng file cho AI hoặc OCR trước", file=sys.stderr)
            continue
        base = slug(f.stem)
        if base in used:
            base = f"{base}-{slug(f.suffix.lstrip('.'))}"
        used.add(base)
        parts = chunks(text, a.chunk)
        for i, part in enumerate(parts, 1):
            name = f"{base}-phan-{i:02d}.md" if len(parts) > 1 else f"{base}.md"
            head = ["---", f'source: "{f.name}"', f"type: {f.suffix.lstrip('.').lower()}"]
            if len(parts) > 1:
                head.append(f"part: {i}/{len(parts)}")
            head += [f"est_tokens: {est_tokens(part)}", f"converted: {today}", "---", ""]
            (out / name).write_text("\n".join(head) + part.strip() + "\n", encoding="utf-8")
            rows.append((name, f.name, est_tokens(part)))
            print(f"✓ {f} → {out / name} (≈ {est_tokens(part):,} token)")

    if not rows:
        sys.exit("Không có file nào được chuyển.")
    index = ["# INDEX — tài liệu tham khảo cho AI", "",
             "Mỗi file dưới đây là bản Markdown của một tài liệu gốc. Đọc file này trước, rồi chỉ mở file liên quan.", "",
             "| File | Nguồn gốc | ≈ Token |", "| --- | --- | --- |"]
    index += [f"| [{n}]({n}) | {src.replace('|', '/')} | {tok:,} |" for n, src, tok in rows]
    (out / "INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")
    print(f"\nXong {len(rows)} file · tổng ≈ {sum(r[2] for r in rows):,} token · {out / 'INDEX.md'}")


if __name__ == "__main__":
    main()
