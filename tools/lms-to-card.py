#!/usr/bin/env python3
"""Đổi file HTML đã lưu từ trang khoá học LMS (dạng JOBVUI / Vườn Ươm Khu Phố) thành thẻ khoá học cho Kho Knowledge.

Cách dùng:
  python3 tools/lms-to-card.py khoa-hoc.html --url https://.../learn/8 --org JOBVUI --status "Đã học" --add

Không có --add thì chỉ in JSON ra màn hình. Có --add thì ghi vào kho-featured.json (cùng id thì ghi đè).
Script chỉ lấy tên khoá, mục "Bạn sẽ học được gì", các phần/module và bài kèm thời lượng. Email tài khoản, đường dẫn video không được đưa vào.
"""
import argparse, html, json, re, sys, unicodedata

DUR = re.compile(r"^\d{1,2}:\d{2}(:\d{2})?$")
LESSON = re.compile(r"^(\d+)\.\s+(.*)$")
PART = re.compile(r"^Phần\s+\d+\s*:?$")
STAT = re.compile(r"^(\d+)\s*/\s*(\d+)\s*·\s*(.+)$")

def slug(s):
    s = unicodedata.normalize("NFD", s).replace("đ", "d").replace("Đ", "D")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def read_lines(path):
    s = open(path, encoding="utf-8", errors="replace").read()
    s = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", s)
    s = html.unescape(re.sub(r"<[^>]+>", "\n", s))
    return [l.strip() for l in s.split("\n") if l.strip()]

def parse(lines):
    title = next((lines[i + 1] for i, l in enumerate(lines) if l == "Trang chủ" and i + 1 < len(lines)), "Khoá học")
    learn, i = [], 0
    if "Bạn sẽ học được gì" in lines:
        i = lines.index("Bạn sẽ học được gì") + 1
        while i < len(lines) and lines[i] not in ("Yêu cầu", "Mô tả"):
            if lines[i] != "✓": learn.append(lines[i])
            i += 1
    updated = next((l for l in lines if l.startswith("Cập nhật")), "")
    total = next((l for l in lines if re.match(r"^\d+ bài học$", l)), "")
    parts, cur = [], None
    for k, l in enumerate(lines):
        if PART.match(l) and k + 2 < len(lines):
            cur = {"t": lines[k + 1], "sub": "", "lessons": []}
            parts.append(cur)
        elif cur is not None:
            m = STAT.match(l)
            if m and not cur["sub"]: cur["sub"] = f"{m.group(2)} bài · {m.group(3)}"; continue
            m = LESSON.match(l)
            if m and k + 1 < len(lines) and DUR.match(lines[k + 1]):
                cur["lessons"].append((m.group(2), lines[k + 1]))
    return title, learn, updated, total, parts

def build(path, url, org, status):
    title, learn, updated, total, parts = parse(read_lines(path))
    if not parts: sys.exit("Không tìm thấy phần/bài nào: file có thể thiếu nội dung (trang dựng bằng JavaScript). Hãy lưu lại sau khi trang tải xong.")
    n = sum(len(p["lessons"]) for p in parts)
    sec = [{"k": "callout", "t": f"{title}{' · ' + org if org else ''}. {n} bài học chia thành {len(parts)} phần." + (f" {updated}." if updated else "")}]
    if learn:
        sec += [{"k": "h", "t": "Bạn sẽ học được gì"}, {"k": "list", "items": learn}]
    sec.append({"k": "h", "t": f"Nội dung {len(parts)} phần"})
    for p in parts:
        sec.append({"k": "h", "t": p["t"] + (f" ({p['sub']})" if p["sub"] else "")})
        sec.append({"k": "steps", "items": [{"t": a, "d": d} for a, d in p["lessons"]]})
    item = {"id": "knowledge-" + slug(title), "kho": "knowledge", "group": "course", "guide": True,
            "date": __import__("datetime").date.today().isoformat(), "title": title, "type": "Khoá học",
            "badge": status or "Khoá học", "tags": ["khoá học"] + ([slug(org)] if org else []),
            "thumb": "assets/res/knowledge-courses.jpg",
            "note": f"{len(parts)} phần, {n} bài." + (f" Đơn vị: {org}." if org else ""), "sections": sec}
    if url: item["cta"] = {"title": title, "url": url, "btn": "Mở khoá học (cần đăng nhập)"}
    return item

if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("html"); a.add_argument("--url", default=""); a.add_argument("--org", default="")
    a.add_argument("--status", default="Đã học"); a.add_argument("--add", action="store_true")
    a.add_argument("--featured", default="kho-featured.json")
    o = a.parse_args()
    item = build(o.html, o.url, o.org, o.status)
    if not o.add:
        print(json.dumps(item, ensure_ascii=False, indent=2)); sys.exit()
    d = json.load(open(o.featured, encoding="utf-8"))
    d["items"] = [i for i in d["items"] if i["id"] != item["id"]] + [item]
    json.dump(d, open(o.featured, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("Đã ghi", item["id"], "vào", o.featured)
