#!/usr/bin/env python3
"""Recap bài giảng: lời giảng của giảng viên + ảnh slide tương ứng, theo đúng mốc thời gian.

Cách dùng:
  python3 tools/course-recap.py "https://drive.google.com/file/d/<ID>/view" --title "Buổi 3"   # video trên Drive (chia sẻ "Bất kỳ ai có link")
  python3 tools/course-recap.py bai-1.mp4 --title "Bài 1 - SEO cơ bản"
  python3 tools/course-recap.py bai-1.mp4 --transcript bai-1.vtt        # dùng phụ đề có sẵn (khỏi gỡ băng)
  python3 tools/course-recap.py bai-1.mp4 --lang vi --model small        # gỡ băng bằng faster-whisper
  python3 tools/course-recap.py bai-1.mp4 --scene 0.2 --min-gap 6        # nhạy hơn khi slide ít khác nhau
  python3 tools/course-recap.py bai-1.mp4 --crop "iw*0.78:ih:0:0"        # chỉ xét vùng slide, bỏ khung webcam bên phải

Video dài (>2 giờ): dò slide ở 1 khung/giây độ phân giải thấp nên nhanh; gỡ băng là bước lâu nhất (thường ~0.5–1x thời lượng
trên CPU, model `small`). Kết quả gỡ băng được lưu `transcript.json` trong thư mục xuất — chạy lại sẽ dùng luôn, không gỡ lại.
Mở `sample.jpg` trong thư mục xuất để chọn --crop nếu khung hình có webcam giảng viên.

Cần: ffmpeg/ffprobe (bắt buộc). Gỡ băng tự động cần `pip install faster-whisper` (chỉ khi không có --transcript).

Cách làm:
  1. ffmpeg dò các thời điểm đổi slide (scene change) -> chia video thành các "đoạn slide".
  2. Mỗi đoạn chụp 1 ảnh ở cuối đoạn (lúc slide đã hiện đủ ý, kể cả khi bullet hiện dần).
  3. Lời giảng (phụ đề / whisper) được ghép vào đoạn có mốc thời gian chứa nó, gom thành đoạn văn.
  4. Xuất recap.md + recap.html (+ recap.json) và thư mục slides/.
Không bịa nội dung: chữ trong recap chính là lời giảng đã gỡ băng, chỉ gom câu và bỏ trùng.
"""
import argparse, html, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request, wave

os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")  # Windows không có symlink: bỏ cảnh báo vô hại
from pathlib import Path


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        sys.exit(f"Lỗi khi chạy {cmd[0]}:\n{p.stderr[-800:]}")
    return p


def duration(video):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=nw=1:nk=1", str(video)]).stdout.strip()
    return float(out)


def drive_id(src):
    m = re.search(r"/d/([\w-]{20,})", src) or re.search(r"[?&]id=([\w-]{20,})", src)
    return m.group(1) if m else (src if re.fullmatch(r"[\w-]{25,}", src) else None)


def fetch_drive(fid, dst):
    """Tải file Drive công khai (có trang xác nhận virus-scan cho file lớn), ghi theo khối, in tiến độ."""
    dst = Path(dst)
    if dst.is_file() and dst.stat().st_size > 1_000_000:
        print(f"Dùng bản đã tải: {dst}")
        return dst
    url = "https://drive.usercontent.google.com/download?" + urllib.parse.urlencode({"id": fid, "export": "download", "confirm": "t"})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (lanhmar-hub course-recap)"})
    tmp = dst.with_suffix(dst.suffix + ".part")
    with urllib.request.urlopen(req, timeout=120) as r, open(tmp, "wb") as f:
        if "text/html" in r.headers.get("content-type", ""):
            sys.exit("Drive trả về trang HTML: file chưa chia sẻ 'Bất kỳ ai có link' hoặc đã hết lượt tải. "
                     "Tải tay về máy rồi truyền đường dẫn file.")
        size, got, t0, last = int(r.headers.get("content-length") or 0), 0, time.time(), 0
        while chunk := r.read(8 << 20):
            f.write(chunk); got += len(chunk)
            if time.time() - last > 5:
                last = time.time()
                print(f"  tải {got / 1e6:,.0f} MB" + (f" / {size / 1e6:,.0f} MB" if size else "") +
                      f" ({got / 1e6 / max(last - t0, 1):.1f} MB/s)", end="\r", flush=True)
    tmp.rename(dst)
    print(f"\nĐã tải {dst} ({dst.stat().st_size / 1e6:,.0f} MB)")
    return dst


def detect_changes(video, thr, crop=None):
    """Mốc (giây) hình đổi mạnh = sang slide mới. Dò ở 1 khung/giây, thu nhỏ -> nhanh với video nhiều giờ."""
    vf = ([f"crop={crop}"] if crop else []) + ["fps=1", "scale=480:-2", f"select='gt(scene,{thr})'", "showinfo"]
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-an", "-sn", "-vf", ",".join(vf), "-f", "null", "-"],
                       capture_output=True, text=True)
    return [float(m.group(1)) for m in re.finditer(r"pts_time:([\d.]+)", p.stderr)]


def sample_frame(video, total, dst, crop=None):
    vf = (f"crop={crop}," if crop else "") + "scale=960:-2"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{total * 0.1:.1f}", "-i", str(video),
         "-frames:v", "1", "-vf", vf, "-q:v", "3", str(dst)])


def signature(path):
    """Chữ ký ảnh 24x24 thang xám để so slide giống nhau (cần Pillow; không có thì bỏ qua bước gộp)."""
    try:
        from PIL import Image
    except ImportError:
        return None
    return list(Image.open(path).convert("L").resize((24, 24)).tobytes())


def similar(a, b, tol=4.0):
    return a is not None and b is not None and sum(abs(x - y) for x, y in zip(a, b)) / len(a) < tol


def build_segments(changes, total, min_gap):
    """Chia [0,total] thành các đoạn; gộp đoạn quá ngắn (animation, nháy hình) vào đoạn trước."""
    marks = [0.0]
    for t in sorted(changes):
        if t - marks[-1] >= min_gap and total - t >= min_gap / 2:
            marks.append(t)
    return [(a, b) for a, b in zip(marks, marks[1:] + [total])]


def grab(video, t, dst, width, crop=None):
    vf = (f"crop={crop}," if crop else "") + f"scale={width}:-2"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-ss", f"{max(t, 0):.2f}",
         "-i", str(video), "-frames:v", "1", "-vf", vf, "-q:v", "3", str(dst)])


# ---------- Lời giảng ----------
TS = re.compile(r"(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})")


def ts(s):
    m = TS.search(s)
    h, mi, se, ms = (int(m.group(1) or 0), int(m.group(2)), int(m.group(3)), m.group(4).ljust(3, "0"))
    return h * 3600 + mi * 60 + se + int(ms) / 1000


def parse_subs(path):
    """Đọc .srt / .vtt -> [(start, end, text)]."""
    raw = Path(path).read_text(encoding="utf-8-sig", errors="replace").replace("\r", "")
    cues = []
    for block in re.split(r"\n\s*\n", raw):
        lines = [l for l in block.strip().split("\n") if l.strip()]
        i = next((k for k, l in enumerate(lines) if "-->" in l), None)
        if i is None:
            continue
        a, b = lines[i].split("-->")[:2]
        text = " ".join(re.sub(r"<[^>]+>", "", l).strip() for l in lines[i + 1:])
        text = html.unescape(re.sub(r"\s+", " ", text)).strip()
        if text:
            cues.append((ts(a), ts(b.split()[0]), text))
    return cues


def whisper_cues(video, lang, model_name, cache):
    cache = Path(cache)
    if cache.is_file():
        print(f"Dùng lời giảng đã gỡ băng: {cache}")
        return [tuple(c) for c in json.loads(cache.read_text(encoding="utf-8"))]
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Chưa có phụ đề. Cài `pip install faster-whisper` để gỡ băng tự động, "
                 "hoặc đưa file phụ đề bằng --transcript.")
    wav = cache.with_suffix(".wav")
    if not wav.is_file():
        print("Tách âm thanh (16 kHz mono)…")
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(wav)])
    print(f"Gỡ băng bằng faster-whisper ({model_name}) — bài dài có thể mất hàng chục phút; lần đầu còn tải model.")
    model = WhisperModel(model_name, compute_type="int8")
    # condition_on_previous_text=False: tránh lặp câu / trôi chữ khi bài rất dài
    # Tự đọc wav thành mảng số rồi đưa thẳng cho whisper -> không phụ thuộc phiên bản PyAV (`av`) của máy
    import numpy as np
    with wave.open(str(wav), "rb") as w:
        audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    segs, info = model.transcribe(audio, language=lang, vad_filter=True, beam_size=1, condition_on_previous_text=False)
    cues, t0, last = [], time.time(), 0
    for s_ in segs:
        if s_.text.strip():
            cues.append((s_.start, s_.end, s_.text.strip()))
        if time.time() - last > 20:
            last = time.time()
            print(f"  đã gỡ tới {hms(s_.end)} / {hms(info.duration)}  (đã chạy {hms(last - t0)})", end="\r", flush=True)
    cache.write_text(json.dumps(cues, ensure_ascii=False), encoding="utf-8")
    wav.unlink(missing_ok=True)
    print(f"\nXong gỡ băng: {len(cues)} câu")
    return cues


def dedupe(cues):
    """Phụ đề tự động hay lặp câu (cuốn chiếu) — bỏ cue trùng/nằm trọn trong cue trước."""
    out = []
    for a, b, t in cues:
        if out:
            pt = out[-1][2]
            if t == pt or pt.endswith(t):
                continue
            if t.startswith(pt):
                out[-1] = (out[-1][0], b, t)
                continue
        out.append((a, b, t))
    return out


def paragraphs(cues, pause=2.5, maxlen=420):
    paras, cur, last_end = [], [], None
    for a, b, t in cues:
        size = sum(len(x) + 1 for x in cur)
        if cur and ((last_end is not None and a - last_end > pause) or size + len(t) > maxlen):
            paras.append(" ".join(cur)); cur = []
        cur.append(t); last_end = b
    if cur:
        paras.append(" ".join(cur))
    return paras


# ---------- Xuất ----------
def hms(t):
    t = int(t)
    return f"{t // 3600:02d}:{t % 3600 // 60:02d}:{t % 60:02d}" if t >= 3600 else f"{t // 60:02d}:{t % 60:02d}"


CSS = """:root{--p:#2D2FEF;--o:#FF7A45;--ink:#1c1d3a;--mut:#6b6d8f;--bg:#f6f6ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 Montserrat,system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px 80px}h1{color:var(--p);font-size:1.7rem;margin:0 0 4px}
.meta{color:var(--mut);margin:0 0 28px}.card{background:#fff;border-radius:20px;padding:18px;margin:0 0 22px;box-shadow:0 8px 28px rgba(45,47,239,.10)}
.card img{width:100%;height:auto;border-radius:12px;display:block;border:1px solid #e6e6fb}
.tag{display:inline-block;background:var(--o);color:#fff;border-radius:999px;padding:2px 12px;font-size:.78rem;font-weight:700;margin:0 0 10px}
.card p{margin:12px 0 0}.empty{color:var(--mut);font-style:italic}nav.toc{margin:0 0 28px;display:flex;flex-wrap:wrap;gap:8px}
nav.toc a{background:#fff;color:var(--p);border-radius:999px;padding:4px 12px;font-size:.82rem;font-weight:600;text-decoration:none}"""


def write_outputs(out, title, video, segs):
    md = [f"# {title}", "", f"Nguồn: `{video.name}` · {len(segs)} slide · {hms(segs[-1]['end'])}", ""]
    h = [f"<!doctype html><html lang='vi'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
         f"<title>{html.escape(title)}</title><style>{CSS}</style><main><h1>{html.escape(title)}</h1>"
         f"<p class='meta'>Nguồn: {html.escape(video.name)} · {len(segs)} slide · {hms(segs[-1]['end'])}</p><nav class='toc'>"
         + "".join(f"<a href='#s{s['n']}'>{s['n']} · {hms(s['start'])}</a>" for s in segs) + "</nav>"]
    for s in segs:
        md += [f"## Slide {s['n']} · {hms(s['start'])}–{hms(s['end'])}", "", f"![Slide {s['n']}]({s['image']})", ""]
        h.append(f"<section class='card' id='s{s['n']}'><span class='tag'>Slide {s['n']} · {hms(s['start'])}–{hms(s['end'])}</span>"
                 f"<img loading='lazy' src='{s['image']}' alt='Slide {s['n']}'>")
        if s["paras"]:
            for p in s["paras"]:
                md += [p, ""]; h.append(f"<p>{html.escape(p)}</p>")
        else:
            md += ["_(không có lời giảng ở đoạn này)_", ""]; h.append("<p class='empty'>(không có lời giảng ở đoạn này)</p>")
        h.append("</section>")
    (out / "recap.md").write_text("\n".join(md), encoding="utf-8")
    (out / "recap.html").write_text("".join(h) + "</main></html>", encoding="utf-8")
    (out / "recap.json").write_text(json.dumps(
        {"title": title, "video": video.name, "slides": segs}, ensure_ascii=False, indent=2), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description="Recap bài giảng: lời giảng + ảnh slide theo mốc thời gian")
    ap.add_argument("video", help="Đường dẫn file video HOẶC link/ID Google Drive (chia sẻ 'Bất kỳ ai có link')")
    ap.add_argument("--title", help="Tiêu đề recap (mặc định: tên file)")
    ap.add_argument("--transcript", help="File phụ đề .srt/.vtt (không có thì gỡ băng bằng faster-whisper)")
    ap.add_argument("--out", help="Thư mục xuất (mặc định: recap-<tên file>)")
    ap.add_argument("--lang", default="vi", help="Ngôn ngữ lời giảng khi gỡ băng (mặc định vi)")
    ap.add_argument("--model", default="small", help="Model whisper: tiny/base/small/medium/large-v3")
    ap.add_argument("--scene", type=float, default=0.3, help="Ngưỡng dò đổi slide 0–1; nhỏ hơn = nhạy hơn (mặc định 0.3)")
    ap.add_argument("--min-gap", type=float, default=5.0, help="Mỗi slide tối thiểu bao nhiêu giây (mặc định 5)")
    ap.add_argument("--crop", help="Chỉ xét vùng slide khi dò/chụp, cú pháp ffmpeg w:h:x:y, vd \"iw*0.78:ih:0:0\" (bỏ webcam)")
    ap.add_argument("--width", type=int, default=1280, help="Chiều rộng ảnh slide (mặc định 1280)")
    a = ap.parse_args()

    if not (shutil.which("ffmpeg") and shutil.which("ffprobe")):
        sys.exit("Cần cài ffmpeg (gồm ffprobe).")
    fid = drive_id(a.video) if re.match(r"https?://|^[\w-]{25,}$", a.video) else None
    if fid:
        wd = Path(a.out or f"recap-drive-{fid[:8]}")
        wd.mkdir(parents=True, exist_ok=True)
        video = fetch_drive(fid, wd / "video.mp4")
        out = wd
    else:
        video = Path(a.video)
        if not video.is_file():
            sys.exit(f"Không thấy file {video}")
        out = Path(a.out or f"recap-{video.stem}")
    (out / "slides").mkdir(parents=True, exist_ok=True)

    total = duration(video)
    print(f"Video dài {hms(total)} — dò đổi slide (1 khung/giây)…")
    t0 = time.time()
    sample_frame(video, total, out / "sample.jpg", a.crop)
    segments = build_segments(detect_changes(video, a.scene, a.crop), total, a.min_gap)
    print(f"  {len(segments)} đoạn slide (mất {hms(time.time() - t0)}). Xem khung đang xét: {out}/sample.jpg")

    cues = parse_subs(a.transcript) if a.transcript else whisper_cues(video, a.lang, a.model, out / "transcript.json")
    cues = dedupe(sorted(cues))
    print(f"  {len(cues)} câu lời giảng")

    # chụp ảnh cuối mỗi đoạn, gộp đoạn kề nhau nếu ảnh gần như y hệt (webcam/con trỏ làm "đổi hình" giả)
    merged = []  # [t0, t1, tmp_path, signature]
    for n, (t0, t1) in enumerate(segments, 1):
        tmp = out / "slides" / f".tmp{n:04d}.jpg"
        grab(video, t1 - min(1.0, (t1 - t0) / 2), tmp, a.width, a.crop)
        sig = signature(tmp)
        if merged and similar(merged[-1][3], sig):
            merged[-1][1] = t1; merged[-1][2].unlink(missing_ok=True); merged[-1][2] = tmp; merged[-1][3] = sig
        else:
            merged.append([t0, t1, tmp, sig])
        if n % 20 == 0:
            print(f"  chụp {n}/{len(segments)} slide", end="\r", flush=True)
    for f in (out / "slides").glob("[0-9]*.jpg"):
        f.unlink()
    slides = []
    for n, (t0, t1, tmp, _) in enumerate(merged, 1):
        name = f"slides/{n:03d}.jpg"
        tmp.rename(out / name)
        mine = [c for c in cues if t0 <= (c[0] + c[1]) / 2 < t1 or (n == len(merged) and c[0] >= t1)]
        slides.append({"n": n, "start": round(t0, 2), "end": round(t1, 2), "image": name, "paras": paragraphs(mine)})
    print(f"\n  {len(slides)} slide sau khi gộp trùng")

    write_outputs(out, a.title or video.stem.replace("-", " ").replace("_", " "), video, slides)
    print(f"Xong -> {out}/recap.html (mở bằng trình duyệt), recap.md, recap.json")


if __name__ == "__main__":
    main()
