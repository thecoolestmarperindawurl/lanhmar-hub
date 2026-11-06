#!/usr/bin/env python3
"""Recap bài giảng: lời giảng của giảng viên + ảnh slide tương ứng, theo đúng mốc thời gian.

Cách dùng:
  python3 tools/course-recap.py "https://drive.google.com/file/d/<ID>/view" --title "Buổi 3"   # video trên Drive (chia sẻ "Bất kỳ ai có link")
  python3 tools/course-recap.py bai-1.mp4 --title "Bài 1 - SEO cơ bản"
  python3 tools/course-recap.py bai-1.mp4 --transcript bai-1.vtt        # dùng phụ đề có sẵn (khỏi gỡ băng)
  python3 tools/course-recap.py bai-1.mp4 --lang vi --model small        # gỡ băng bằng faster-whisper
  python3 tools/course-recap.py bai-1.mp4 --scene 0.2 --min-gap 6        # nhạy hơn khi slide ít khác nhau
  python3 tools/course-recap.py bai-1.mp4 --crop "iw*0.78:ih:0:0"        # chỉ xét vùng slide, bỏ khung webcam bên phải

Làm sạch lời giảng (khi gỡ băng sai nhiều thuật ngữ/tên riêng) — dùng Claude đọc ảnh slide + lời giảng thô của từng slide:
  pip install anthropic ; đặt biến môi trường ANTHROPIC_API_KEY
  python3 tools/course-recap.py bai-1.mp4 --polish --context "Khoá Performance Marketing, giảng viên nói về Meta Ads, CPA, ROAS" --glossary thuat-ngu.txt
  python3 tools/course-recap.py bai-1.mp4 --polish-only      # chỉ chạy lại bước làm sạch trên recap.json có sẵn (không dò slide/gỡ băng lại)
Mặc định ghi chú CHỈ giữ kiến thức + bài tập thực hành, tự bỏ giới thiệu lớp/nội quy (danh sách slide bị bỏ: recap-notes-skipped.txt;
  chỉnh tay bằng --skip-slides "1-3,9" hoặc --skip-until 05:30).
Ghi chú học tập theo chủ đề (format giống bài recap mẫu: phần <I>/<II>…, mục đánh số, hộp 📌, ảnh slide, SUM UP):
  python3 tools/course-recap.py bai-1.mp4 --notes --lecturer "Ms. ..." --context "..." --glossary thuat-ngu.txt
  python3 tools/course-recap.py bai-1.mp4 --notes-only            # viết lại ghi chú từ recap.json có sẵn (kết quả từng bước được cache)
  -> recap-notes.html (xem), recap-notes.md, recap-notes.zip (Notion: Import → Text & Markdown → chọn file zip, ảnh đi kèm)
Bản gốc chưa chỉnh luôn được giữ (recap.json: "raw"; recap.html: mục "Xem lời giảng gốc"). Chỗ Claude không chắc được đánh dấu "Cần kiểm tra".

Video dài (>2 giờ): dò slide ở 1 khung/giây độ phân giải thấp nên nhanh; gỡ băng là bước lâu nhất (thường ~0.5–1x thời lượng
trên CPU, model `small`). Kết quả gỡ băng được lưu `transcript-<model>-b<beam>.json` trong thư mục xuất — chạy lại sẽ dùng luôn, không gỡ lại.
Chữ gỡ băng sai nhiều: dùng `--model medium` hoặc `large-v3` (đổi model/beam sẽ tự gỡ lại; chậm hơn). Mở `sample.jpg` trong thư mục xuất để chọn --crop nếu khung hình có webcam giảng viên.

Cần: ffmpeg/ffprobe (bắt buộc). Gỡ băng tự động cần `pip install faster-whisper` (chỉ khi không có --transcript).

Cách làm:
  1. ffmpeg dò các thời điểm đổi slide (scene change) -> chia video thành các "đoạn slide".
  2. Mỗi đoạn chụp 1 ảnh ở cuối đoạn (lúc slide đã hiện đủ ý, kể cả khi bullet hiện dần).
  3. Lời giảng (phụ đề / whisper) được ghép vào đoạn có mốc thời gian chứa nó, gom thành đoạn văn.
  4. Xuất recap.md + recap.html (+ recap.json) và thư mục slides/.
Không bịa nội dung: chữ trong recap chính là lời giảng đã gỡ băng, chỉ gom câu và bỏ trùng.
"""
import argparse, base64, concurrent.futures, hashlib, html, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request, wave

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


def whisper_cues(video, lang, model_name, cache, prompt=None, beam=5):
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
    total, SR = len(audio) / 16000.0, 16000
    # Tiếp tục từ chỗ đã dừng: tiến độ lưu ở file .partial.json (mỗi ~30 giây và khi bấm Ctrl+C)
    part = cache.with_suffix(".partial.json")
    cues, start = [], 0.0
    if part.is_file():
        d = json.loads(part.read_text(encoding="utf-8"))
        cues, start = [tuple(c) for c in d["cues"]], float(d["until"])
        print(f"Tiếp tục gỡ băng từ {hms(start)} (đã có {len(cues)} câu từ lần trước).")
    save = lambda: part.write_text(json.dumps({"until": cues[-1][1] if cues else start, "cues": cues}, ensure_ascii=False), encoding="utf-8")
    segs, info = model.transcribe(audio[int(start * SR):], language=lang, initial_prompt=prompt or None, vad_filter=True,
                                  beam_size=beam, condition_on_previous_text=False)
    t0, last_print, last_save = time.time(), 0, time.time()
    try:
        for s_ in segs:
            if s_.text.strip():
                cues.append((s_.start + start, s_.end + start, s_.text.strip()))
            now = time.time()
            if now - last_save > 30:
                last_save = now; save()
            if now - last_print > 20:
                last_print = now
                print(f"  đã gỡ tới {hms(s_.end + start)} / {hms(total)}  (đã chạy {hms(now - t0)})", end="\r", flush=True)
    except KeyboardInterrupt:
        save()
        print(f"\nĐã dừng và lưu tiến độ tới {hms(cues[-1][1] if cues else start)} / {hms(total)}. Chạy lại đúng lệnh cũ để làm tiếp.")
        sys.exit(130)
    cache.write_text(json.dumps(cues, ensure_ascii=False), encoding="utf-8")
    part.unlink(missing_ok=True)
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
# ---------- Làm sạch lời giảng bằng Claude ----------
POLISH_RULES = """Bạn đang biên tập lời giảng đã gỡ băng tự động (speech-to-text tiếng Việt, hay sai) của một bài giảng. Bạn thấy ảnh slide đang chiếu và lời giảng thô của đúng đoạn đó.

Nhiệm vụ: viết lại lời giảng cho đúng ngữ cảnh, dễ đọc, nhưng KHÔNG đổi nội dung.
- Sửa lỗi nhận dạng giọng nói: tên riêng, thuật ngữ, từ tiếng Anh, tên công cụ/thương hiệu, con số, dấu câu, viết hoa. Dùng chữ trên slide và danh sách thuật ngữ để chuẩn hoá cách viết.
- Bỏ từ đệm và câu lặp (ừ, à, thì là, nói lại...) nhưng GIỮ mọi ý, ví dụ, con số, lời dặn của giảng viên. Giữ giọng giảng viên (xưng hô như trong lời gốc), văn nói tự nhiên, rõ ràng; chia đoạn theo ý.
- TUYỆT ĐỐI không thêm thông tin, số liệu, ví dụ hay kết luận mà lời giảng và slide không có. Không tóm tắt cho ngắn đi.
- Chỗ nghe không ra nghĩa (từ gốc vô nghĩa, tên riêng không đối chiếu được): giữ nguyên từ gốc, KHÔNG đoán nghĩa, và ghi vào "uncertain" kèm trích đoạn ngắn.
- CHỈ ghi vào "uncertain" những chỗ bạn KHÔNG giải quyết được. Chỗ đã sửa chắc chắn nhờ chữ trên slide, thuật ngữ hoặc ngữ cảnh (ví dụ "slime" -> "slide" khi đang chiếu slide) thì sửa luôn và KHÔNG ghi. Nếu không có gì nghi ngờ, để "uncertain" rỗng. Tối đa 3 mục mỗi slide, chọn chỗ ảnh hưởng nội dung nhất.
- Lời nói xã giao/chờ người vào lớp/xử lý kỹ thuật (ví dụ "đợi mình một chút", "mọi người nghe rõ không") không phải nội dung bài: giữ ngắn gọn một câu, không suy diễn thêm.
Chỉ trả về JSON hợp lệ, không thêm chữ nào khác: {"paragraphs": ["..."], "uncertain": ["trích đoạn nghi ngờ + lý do ngắn"]}"""


POLISH_TOOL = {
    "name": "submit_recap",
    "description": "Nộp lời giảng đã biên tập của slide này.",
    "input_schema": {"type": "object", "properties": {
        "paragraphs": {"type": "array", "items": {"type": "string"}, "description": "Các đoạn lời giảng đã sửa, theo đúng thứ tự"},
        "uncertain": {"type": "array", "items": {"type": "string"}, "description": "Đoạn nghi ngờ + lý do ngắn; để trống nếu không có"}},
        "required": ["paragraphs", "uncertain"]},
}


def call_tool(client, model, system, content, tool, max_tokens=8192, label="?", tries=3):
    """Gọi Claude để lấy kết quả đúng khuôn của `tool`. Một số model không cho ép tool_choice nên dùng chế độ tự động:
    dặn bắt buộc gọi công cụ; nếu model vẫn trả chữ thì tách JSON trong chữ. Thử lại khi lỗi; hết lượt trả None."""
    system = system + f"\n\nBạn PHẢI trả kết quả bằng cách gọi công cụ `{tool['name']}`, không trả lời bằng văn bản thường."
    last = None
    for attempt in range(tries):
        try:
            r = client.messages.create(
                model=model, max_tokens=max_tokens, system=system, tools=[tool],
                messages=[{"role": "user", "content": content}])
            if getattr(r, "stop_reason", "") == "max_tokens":
                raise ValueError("bị cắt giữa chừng (max_tokens)")
            blk = next((b for b in r.content if getattr(b, "type", "") == "tool_use"), None)
            if blk is not None:
                return blk.input
            txt = "".join(getattr(b, "text", "") for b in r.content if getattr(b, "type", "") == "text")
            try:
                return json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
            except ValueError:
                raise ValueError(f"không có kết quả (stop_reason={getattr(r, 'stop_reason', '?')}; trả lời: {txt[:120]!r})")
        except Exception as e:
            last = f"{type(e).__name__}: {e}"
            time.sleep(2 * (attempt + 1))
    print(f"\n  ! {label}: không gọi được Claude ({last})")
    return None


def img_block(path):
    return {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg",
                                         "data": base64.standard_b64encode(Path(path).read_bytes()).decode()}}


def polish_slide(client, model, img_path, raw, context, glossary, label="?"):
    extra = (f"Bối cảnh bài giảng: {context}\n" if context else "") + (f"Thuật ngữ/tên riêng chuẩn: {', '.join(glossary)}\n" if glossary else "")
    text = f"{extra}\nLời giảng thô của slide này:\n" + "\n\n".join(raw)
    data = call_tool(client, model, POLISH_RULES.split("Chỉ trả về JSON")[0].rstrip(),
                     [img_block(img_path), {"type": "text", "text": text}], POLISH_TOOL, 8192, f"Slide {label}")
    paras = [str(x).strip() for x in (data or {}).get("paragraphs", []) if str(x).strip()]
    if paras:
        return paras, [str(x) for x in data.get("uncertain", [])]
    print(f"  (giữ lời giảng gốc cho slide {label}; chạy lại --polish-only để thử lại riêng slide này)")
    return raw, []


def polish_all(slides, out, model, context, glossary, workers=4):
    try:
        import anthropic
    except ImportError:
        sys.exit("Cần `pip install anthropic` để dùng --polish.")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("Chưa đặt ANTHROPIC_API_KEY. PowerShell: $env:ANTHROPIC_API_KEY=\"sk-ant-...\"")
    client = anthropic.Anthropic()
    cache_f = out / "polished.json"
    cache = json.loads(cache_f.read_text(encoding="utf-8")) if cache_f.is_file() else {}
    key = lambda s: hashlib.sha1(("|".join(s["raw"]) + model + (context or "") + ",".join(glossary)).encode()).hexdigest()
    todo = [s for s in slides if s["raw"] and key(s) not in cache]
    print(f"Làm sạch lời giảng bằng {model}: {len(todo)} slide cần xử lý ({sum(1 for s in slides if s['raw']) - len(todo)} đã làm sạch từ trước, dùng lại)")
    done = 0
    with concurrent.futures.ThreadPoolExecutor(workers) as ex:
        futs = {ex.submit(polish_slide, client, model, out / s["image"], s["raw"], context, glossary, s["n"]): s for s in todo}
        for f in concurrent.futures.as_completed(futs):
            s = futs[f]
            paras, unsure = f.result()
            if paras is not s["raw"]:
                cache[key(s)] = {"paras": paras, "uncertain": unsure}
                cache_f.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
            done += 1
            print(f"  {done}/{len(todo)}", end="\r", flush=True)
    for s in slides:
        c = cache.get(key(s))
        if c:
            s["paras"], s["notes"] = c["paras"], c["uncertain"]
    print()


# ---------- Ghi chú học tập theo chủ đề (format giống bài recap mẫu trên Notion) ----------
NOTES_STYLE = """Phong cách (theo bài recap mẫu của khoá học):
- Là GHI CHÚ HỌC TẬP viết mạch lạc, văn viết trung tính (không dùng "mình/bạn" của lời nói; dùng "người làm marketing", "học viên", "thương hiệu"... theo ngữ cảnh), giải thích theo kiểu "Hiểu đơn giản, X là...", "Điểm cốt lõi là...", "Nói cách khác, ...".
- In đậm **thuật ngữ/khái niệm chính** ở lần xuất hiện đầu. Liệt kê ý bằng gạch đầu dòng dạng "- **Khái niệm:** giải thích". Dùng "→" để nối hệ quả/ý nghĩa.
- Khi giảng viên chốt ý hoặc có bộ ba/bộ bốn ý cần nhớ: thêm hộp ghi nhớ dạng
  > 📌 **Có thể ghi nhớ ngắn gọn:**
  >
  > - **...** ...
  (tối đa 1–2 hộp mỗi mục, chỉ khi thật sự có ý chốt trong lời giảng).
- Câu hỏi dẫn dắt/checklist giảng viên đưa ra: trình bày bằng khối trích dẫn "> - ...". So sánh nhiều khái niệm/đối tượng: dùng bảng Markdown.
- Ví dụ, case study, con số, ngày tháng, tên riêng: GIỮ ĐẦY ĐỦ như giảng viên và slide nêu.
- Ảnh slide: chèn bằng đúng cú pháp {{slide:N}} (N là số slide có trong ảnh được cung cấp) trên một dòng riêng, đặt NGAY SAU đoạn giải thích slide đó. Chỉ chèn slide thật sự có thông tin (sơ đồ, bảng, khung, ví dụ); bỏ slide chỉ có tiêu đề/trang trí. Không chèn trùng.
- Dùng tiêu đề nhỏ (### ...) khi mục dài; KHÔNG viết tiêu đề cấp # hoặc ## (tool đã tự thêm tên phần/mục)."""

SKIP_RULES = """QUY TẮC LOẠI BỎ (bắt buộc): recap CHỈ tập trung vào kiến thức và bài tập thực hành. Đưa vào "skipped" (kèm lý do ngắn) các slide thuộc:
(a) chào hỏi, giới thiệu lớp/giảng viên/học viên/khoá học/lộ trình/chương trình, điểm danh, ôn lại buổi trước chỉ để nhắc lịch;
(b) nội quy, quy định lớp, cách học/nộp bài/chấm điểm, hướng dẫn kỹ thuật (Zoom, link, nhóm chat), thông báo lịch học;
(c) quảng bá/tư vấn khoá khác, cảm ơn và chào kết thúc xã giao, thời gian chờ.
GIỮ LẠI: kiến thức, khái niệm, ví dụ/case, và bài tập thực hành (đề bài, hướng dẫn làm, chữa bài, nhận xét) — kể cả khi nằm cuối buổi. Slide trộn lẫn (vừa nội quy vừa kiến thức) thì GIỮ. Không chắc thì GIỮ."""

NOTES_PRACTICE = """Mục THỰC HÀNH: trình bày theo khuôn sau (bỏ khối nào mà lời giảng không có):
- **Yêu cầu bài tập:** đề bài, đầu vào/tư liệu, thời lượng/tiêu chí nếu giảng viên nêu.
- **Các bước thực hiện:** đánh số 1., 2., 3.… theo đúng thao tác giảng viên làm hoặc hướng dẫn; GIỮ nguyên tên công cụ/menu/phím tắt/thông số/giá trị.
- **Lưu ý / lỗi thường gặp:** chỉ những gì giảng viên nói.
- **Nhận xét, chữa bài:** nếu có chữa bài hoặc nhận xét bài học viên.
Chèn ảnh slide/màn hình minh hoạ từng bước khi có."""

NOTES_FAITHFUL = """Nguyên tắc trung thực (bắt buộc):
- Chỉ dùng thông tin có trong lời giảng và chữ/hình trên slide. TUYỆT ĐỐI không thêm kiến thức bên ngoài, số liệu, ví dụ, lời khuyên hay kết luận giảng viên không nói.
- Lời giảng đến từ gỡ băng tự động nên có thể sai tên riêng/thuật ngữ: sửa theo chữ trên slide, thuật ngữ cho trước và ngữ cảnh khi chắc chắn; nếu không chắc thì giữ nguyên từ gốc và ghi vào "uncertain" (tối đa 3 mục, kèm trích đoạn ngắn).
- Bỏ lời xã giao, chờ vào lớp, xử lý kỹ thuật, nói lặp; không bỏ ý nội dung."""

OUTLINE_TOOL = {
    "name": "submit_outline",
    "description": "Nộp dàn ý recap của buổi học.",
    "input_schema": {"type": "object", "properties": {
        "objectives": {"type": "array", "items": {"type": "string"}, "description": "3–5 gạch đầu dòng 'Nội dung buổi học', động từ đầu câu"},
        "parts": {"type": "array", "items": {"type": "object", "properties": {
            "title": {"type": "string"},
            "sections": {"type": "array", "items": {"type": "object", "properties": {
                "title": {"type": "string"},
                "kind": {"type": "string", "enum": ["kien_thuc", "thuc_hanh"], "description": "thuc_hanh = bài tập/thực hành (đề bài, hướng dẫn làm, chữa bài); còn lại là kien_thuc"},
                "slides": {"type": "array", "items": {"type": "integer"}}},
                "required": ["title", "kind", "slides"]}}},
            "required": ["title", "sections"]}},
        "skipped": {"type": "array", "items": {"type": "object", "properties": {
            "slide": {"type": "integer"}, "reason": {"type": "string", "description": "Lý do ngắn, vd: giới thiệu lớp, nội quy"}},
            "required": ["slide", "reason"]}, "description": "Slide bị loại theo quy tắc loại bỏ"}},
        "required": ["objectives", "parts", "skipped"]},
}
SECTION_TOOL = {
    "name": "submit_section",
    "description": "Nộp ghi chú của một mục.",
    "input_schema": {"type": "object", "properties": {
        "markdown": {"type": "string", "description": "Nội dung mục bằng Markdown (không có tiêu đề # hoặc ##)"},
        "uncertain": {"type": "array", "items": {"type": "string"}}},
        "required": ["markdown", "uncertain"]},
}
SUMUP_TOOL = {
    "name": "submit_sumup",
    "description": "Nộp phần SUM UP.",
    "input_schema": {"type": "object", "properties": {"markdown": {"type": "string"}}, "required": ["markdown"]},
}
ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]


def slide_text(s):
    return "\n\n".join(s["paras"])


def normalize_outline(outline, slides):
    """Mỗi slide có lời giảng thuộc đúng một mục (hoặc bị bỏ): khử trùng, gán slide sót vào mục liền trước."""
    have = {s["n"] for s in slides if s["paras"]}
    info = {}
    for x in outline.get("skipped", []):
        n, why = (x.get("slide"), x.get("reason", "")) if isinstance(x, dict) else (x, "")
        if n in have:
            info[n] = why
    skipped = set(info)
    seen, parts = set(), []
    for p in outline.get("parts", []):
        secs = []
        for sec in p.get("sections", []):
            ns = sorted({n for n in sec.get("slides", []) if n in have and n not in seen and n not in skipped})
            seen.update(ns)
            if ns:
                secs.append({"title": sec["title"].strip(), "slides": ns, "kind": sec.get("kind", "kien_thuc")})
        if secs:
            parts.append({"title": p["title"].strip(), "sections": secs})
    if not parts:
        parts = [{"title": "NỘI DUNG BUỔI HỌC", "sections": [{"title": "Nội dung chính", "slides": []}]}]
    for n in sorted(have - seen - skipped):
        best = max((sec for p in parts for sec in p["sections"] if sec["slides"] and sec["slides"][0] <= n), key=lambda x: x["slides"][0], default=None) \
            or parts[0]["sections"][0]
        best["slides"] = sorted(best["slides"] + [n])
    return {"objectives": outline.get("objectives", []), "parts": parts, "skipped": sorted(skipped), "skipped_info": info}


NOTES_VERSION = 3  # tăng khi đổi prompt/format để bỏ cache cũ


def parse_skips(spec, until, slides):
    """--skip-slides "1-3,9" và --skip-until "05:30" -> tập số slide bị loại thủ công."""
    out = set()
    for part in (spec or "").split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-", 1); out.update(range(int(a), int(b) + 1))
        elif part:
            out.add(int(part))
    if until:
        sec = sum(int(x) * 60 ** i for i, x in enumerate(reversed(until.split(":"))))
        out.update(s["n"] for s in slides if s["start"] < sec)
    return out


def make_notes(slides, out, title, model, context, glossary, lecturer=None, background=None, skip=(), workers=4, max_imgs=10):
    try:
        import anthropic
    except ImportError:
        sys.exit("Cần `pip install anthropic` để dùng --notes.")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("Chưa đặt ANTHROPIC_API_KEY. PowerShell: $env:ANTHROPIC_API_KEY=\"sk-ant-...\"")
    client = anthropic.Anthropic()
    by_n = {s["n"]: s for s in slides}
    cache_f = out / "notes-cache.json"
    cache = json.loads(cache_f.read_text(encoding="utf-8")) if cache_f.is_file() else {}
    ctx = (f"Bối cảnh bài giảng: {context}\n" if context else "") + (f"Thuật ngữ/tên riêng chuẩn: {', '.join(glossary)}\n" if glossary else "")
    h = lambda *a: hashlib.sha1("|".join(map(str, (NOTES_VERSION,) + a)).encode()).hexdigest()
    forced = {n for n in skip if n in by_n}
    slides = [dict(s, paras=[]) if s["n"] in forced else s for s in slides]   # slide bị loại thủ công coi như không có lời giảng
    by_n = {s["n"]: s for s in slides}

    # B1. Dàn ý: đọc lời giảng cả buổi (mỗi slide cắt 900 ký tự) -> phần / mục / slide
    body = "\n\n".join(f"[Slide {s['n']} · {hms(s['start'])}] {slide_text(s)[:900]}" for s in slides if s["paras"])
    k = "outline-" + h(body, model, ctx)
    if k not in cache:
        print("Lập dàn ý recap…")
        sysmsg = ("Bạn là biên tập viên ghi chú học tập. Bên dưới là lời giảng (gỡ băng tự động, có thể sai chữ) của từng slide trong một buổi học. "
                  "Hãy lập dàn ý bài recap:\n- Chia thành 3–8 PHẦN lớn theo mạch nội dung, mỗi phần gồm các MỤC; mỗi mục gồm 1–10 slide liên quan. "
                  "Giữ đúng thứ tự giảng. Tiêu đề phần/mục ngắn, nêu đúng chủ đề, tiếng Việt, giữ thuật ngữ như giảng viên dùng.\n"
                  "- Mỗi slide có lời giảng thuộc đúng một mục hoặc nằm trong skipped. Gán kind: thuc_hanh cho mục bài tập/thực hành, kien_thuc cho các mục còn lại.\n" + SKIP_RULES + "\n"
                  "- objectives: 3–5 gạch đầu dòng 'Nội dung buổi học' dựa đúng trên nội dung đã giảng, không thêm.\n" + NOTES_FAITHFUL)
        data = call_tool(client, model, sysmsg, [{"type": "text", "text": ctx + "\n" + body}], OUTLINE_TOOL, 8192, "Dàn ý")
        if not data:
            sys.exit("Không lập được dàn ý (xem lỗi ở trên). Chạy lại: kết quả các bước trước được lưu, không tốn lại.")
        cache[k] = data
        cache_f.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    outline = normalize_outline(cache[k], slides)
    secs = [(pi, sec) for pi, p in enumerate(outline["parts"]) for sec in p["sections"]]
    print(f"  {len(outline['parts'])} phần, {len(secs)} mục ({sum(1 for _, x in secs if x.get('kind') == 'thuc_hanh')} mục thực hành)")
    skipped = [(n, outline["skipped_info"].get(n, "")) for n in outline["skipped"]] + [(n, "bỏ thủ công") for n in sorted(forced)]
    if skipped:
        lines = [f"Slide {n} ({hms(by_n[n]['start'])}): {why or 'không có nội dung bài'}" for n, why in sorted(skipped)]
        (out / "recap-notes-skipped.txt").write_text("\n".join(lines), encoding="utf-8")
        print(f"  Bỏ qua {len(skipped)} slide (giới thiệu/nội quy…) — xem danh sách: {out / 'recap-notes-skipped.txt'}")

    # B2. Viết từng mục (lời giảng đầy đủ + ảnh slide của mục)
    def write_section(sec):
        ns = sec["slides"]
        shown = ns if len(ns) <= max_imgs else [ns[round(i * (len(ns) - 1) / (max_imgs - 1))] for i in range(max_imgs)]
        text = "\n\n".join(f"[Slide {n} · {hms(by_n[n]['start'])}]\n{slide_text(by_n[n])}" for n in ns)
        key = "sec-" + h(sec["title"], text, shown, model, ctx)
        if key in cache:
            return key, cache[key]
        kind = sec.get("kind", "kien_thuc")
        content = [{"type": "text", "text": f"{ctx}\nMục cần viết: {sec['title']} (loại: {'thực hành' if kind == 'thuc_hanh' else 'kiến thức'})\nSlide có ảnh kèm theo (được phép chèn {{{{slide:N}}}}): {', '.join(map(str, shown))}\n\nLời giảng theo slide:\n{text}"}]
        for n in shown:
            content += [{"type": "text", "text": f"Ảnh slide {n}:"}, img_block(out / by_n[n]["image"])]
        sysmsg = ("Bạn viết một mục trong bài recap buổi học từ lời giảng và ảnh slide.\n\n" + NOTES_STYLE + "\n\n"
                  + (NOTES_PRACTICE + "\n\n" if kind == "thuc_hanh" else "") + NOTES_FAITHFUL)
        data = call_tool(client, model, sysmsg, content, SECTION_TOOL, 12000, f"Mục \"{sec['title']}\"")
        if not data:
            data = {"markdown": "\n\n".join(p for n in ns for p in by_n[n]["paras"]) + "\n\n" + "\n".join(f"{{{{slide:{n}}}}}" for n in shown),
                    "uncertain": ["Không viết được mục này bằng Claude; đang hiện lời giảng gốc"], "_failed": True}
            return None, data
        return key, data

    done, results = 0, {}
    with concurrent.futures.ThreadPoolExecutor(workers) as ex:
        futs = {ex.submit(write_section, sec): i for i, (_, sec) in enumerate(secs)}
        for f in concurrent.futures.as_completed(futs):
            i = futs[f]; key, data = f.result(); results[i] = data
            if key and key not in cache:
                cache[key] = data
                cache_f.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
            done += 1
            print(f"  viết mục {done}/{len(secs)}", end="\r", flush=True)
    print()

    # B3. SUM UP từ các mục đã viết
    digest = "\n\n".join(f"## {sec['title']}\n{results[i]['markdown'][:700]}" for i, (_, sec) in enumerate(secs))
    k = "sumup-" + h(digest, model)
    if k not in cache:
        data = call_tool(client, model, "Viết phần SUM UP cuối bài recap: nhắc lại mạch logic của cả buổi học (2–4 đoạn ngắn hoặc gạch đầu dòng, in đậm ý chính, có thể dùng 'Qua ... có thể thấy'). "
                         "Chỉ dựa trên các mục bên dưới; không thêm kiến thức mới. KHÔNG chèn {{slide:N}}.\n\n" + NOTES_FAITHFUL,
                         [{"type": "text", "text": digest}], SUMUP_TOOL, 4096, "SUM UP")
        cache[k] = data or {"markdown": ""}
        if data:
            cache_f.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
    sumup = cache[k].get("markdown", "").strip()

    # B4. Ghép tài liệu
    md = [f"# {title}", ""]
    if lecturer: md += [f"**Giảng viên:** {lecturer}", ""]
    if background: md += [f"**Chi tiết background:** {background}", ""]
    if outline["objectives"]:
        md += ["**Nội dung buổi học**", ""] + [f"- {o.strip().lstrip('-•· ').strip()}" for o in outline["objectives"]] + [""]
    md += ["---", ""]
    used, notes_unsure, si = [], [], 0
    for pi, p in enumerate(outline["parts"]):
        md += [f"# \\<{ROMAN[pi] if pi < len(ROMAN) else pi + 1}> {p['title'].upper()}", ""]
        for j, sec in enumerate(p["sections"], 1):
            data = results[si]; si += 1
            md += [f"## {j}. {sec['title'].upper()}", ""]
            valid = set(sec["slides"])
            def sub(m):
                n = int(m.group(1))
                if n in valid and n not in used:
                    used.append(n)
                    return f"![Slide {n}]({by_n[n]['image']})"
                return ""
            body_md = re.sub(r"\{\{slide:(\d+)\}\}", sub, data["markdown"]).strip()
            md += [body_md, ""]
            for u in data.get("uncertain", []):
                md += [f"> ⚠ Cần kiểm tra: {u}", ""]
    if sumup:
        md += [f"# \\<{ROMAN[len(outline['parts'])] if len(outline['parts']) < len(ROMAN) else len(outline['parts']) + 1}> SUM UP", "", sumup, ""]
    text = "\n".join(md)
    text = re.sub(r"\n{3,}", "\n\n", text)
    (out / "recap-notes.md").write_text(text, encoding="utf-8")
    (out / "recap-notes.html").write_text(notes_html(title, text), encoding="utf-8")
    import zipfile
    with zipfile.ZipFile(out / "recap-notes.zip", "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("recap-notes.md", text)
        for n in used:
            z.write(out / by_n[n]["image"], by_n[n]["image"])
    print(f"Xong ghi chú -> {out}/recap-notes.html (xem), recap-notes.md, recap-notes.zip (import vào Notion)")


def inline_md(t):
    t = html.escape(t).replace("\\&lt;", "&lt;")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", r"<img loading='lazy' src='\2' alt='\1'>", t)
    return t


def md_to_html(md):
    lines, out, i = md.split("\n"), [], 0
    while i < len(lines):
        l = lines[i]
        if not l.strip():
            i += 1
        elif l.startswith("#"):
            n = len(l) - len(l.lstrip("#")); out.append(f"<h{min(n, 4)}>{inline_md(l[n:].strip())}</h{min(n, 4)}>"); i += 1
        elif l.strip() == "---":
            out.append("<hr>"); i += 1
        elif l.startswith(">"):
            blk = []
            while i < len(lines) and lines[i].startswith(">"):
                blk.append(lines[i][1:].lstrip(" ") if lines[i][1:2] == " " else lines[i][1:]); i += 1
            inner = "\n".join(blk)
            cls = "callout" if re.match(r"\s*(📌|⭐|💡|✅)", inner) else ("warn" if inner.lstrip().startswith("⚠") else "quote")
            out.append(f"<div class='{cls}'>{md_to_html(inner)}</div>")
        elif l.lstrip().startswith("- "):
            items = []
            while i < len(lines) and lines[i].lstrip().startswith("- "):
                items.append(f"<li>{inline_md(lines[i].lstrip()[2:])}</li>"); i += 1
            out.append("<ul>" + "".join(items) + "</ul>")
        elif l.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                if not re.fullmatch(r"\|[\s:\-|]+\|?", lines[i]):
                    rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            t = "".join("<tr>" + "".join(f"<{'th' if r is rows[0] else 'td'}>{inline_md(c)}</{'th' if r is rows[0] else 'td'}>" for c in r) + "</tr>" for r in rows)
            out.append(f"<table>{t}</table>")
        elif l.startswith("!["):
            out.append(f"<p>{inline_md(l)}</p>"); i += 1
        else:
            para = []
            while i < len(lines) and lines[i].strip() and not re.match(r"(#|>|- |\||!\[|---$)", lines[i].lstrip() if lines[i].lstrip().startswith("- ") else lines[i]):
                para.append(lines[i]); i += 1
            out.append(f"<p>{inline_md(' '.join(para))}</p>")
    return "\n".join(out)


NOTES_CSS_EXTRA = """
main{max-width:820px}h1{margin:36px 0 8px;font-size:1.45rem}h2{color:var(--ink);font-size:1.15rem;margin:28px 0 8px}h3,h4{font-size:1rem;margin:18px 0 6px}
main>p,main>ul,main>div,main>table{background:none}ul{padding-left:22px}li{margin:4px 0}img{max-width:100%;height:auto;border-radius:12px;border:1px solid #e6e6fb;margin:8px 0;display:block}
.callout{background:#fff8d6;border-radius:12px;padding:6px 16px;margin:14px 0}.quote{border-left:4px solid var(--p);padding:2px 14px;margin:14px 0;color:var(--ink)}
.warn{background:#fff3ec;border-left:4px solid var(--o);border-radius:8px;padding:2px 12px;margin:12px 0;font-size:.88rem}
table{border-collapse:collapse;width:100%;margin:14px 0;background:#fff}td,th{border:1px solid #dcdcf5;padding:8px 10px;vertical-align:top;font-size:.92rem}th{background:#eeeeff}hr{border:0;border-top:1px solid #dcdcf5;margin:24px 0}"""


def notes_html(title, md):
    return ("<!doctype html><html lang='vi'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>{html.escape(title)}</title><style>{CSS + NOTES_CSS_EXTRA}</style><main>{md_to_html(md)}</main></html>")


def hms(t):
    t = int(t)
    return f"{t // 3600:02d}:{t % 3600 // 60:02d}:{t % 60:02d}" if t >= 3600 else f"{t // 60:02d}:{t % 60:02d}"


CSS = """:root{--p:#2D2FEF;--o:#FF7A45;--ink:#1c1d3a;--mut:#6b6d8f;--bg:#f6f6ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 Montserrat,system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 16px 80px}h1{color:var(--p);font-size:1.7rem;margin:0 0 4px}
.meta{color:var(--mut);margin:0 0 28px}.card{background:#fff;border-radius:20px;padding:18px;margin:0 0 22px;box-shadow:0 8px 28px rgba(45,47,239,.10)}
.card img{width:100%;height:auto;border-radius:12px;display:block;border:1px solid #e6e6fb}
.tag{display:inline-block;background:var(--o);color:#fff;border-radius:999px;padding:2px 12px;font-size:.78rem;font-weight:700;margin:0 0 10px}
.card p{margin:12px 0 0}.empty{color:var(--mut);font-style:italic}details{margin:12px 0 0;color:var(--mut);font-size:.9rem}details p{margin:8px 0 0}.warn{background:#fff3ec;border-left:4px solid var(--o);border-radius:8px;padding:8px 12px;margin:12px 0 0;font-size:.88rem}nav.toc{margin:0 0 28px;display:flex;flex-wrap:wrap;gap:8px}
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
        for n_ in s.get("notes", []):
            md += [f"> ⚠ Cần kiểm tra: {n_}", ""]; h.append(f"<div class='warn'>⚠ Cần kiểm tra: {html.escape(n_)}</div>")
        if s.get("raw") and s["raw"] != s["paras"]:
            h.append("<details><summary>Xem lời giảng gốc (chưa chỉnh)</summary>" + "".join(f"<p>{html.escape(p)}</p>" for p in s["raw"]) + "</details>")
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
    ap.add_argument("--beam", type=int, default=5, help="Độ kỹ khi gỡ băng (1 = nhanh nhưng dễ sai; 5 = chính xác hơn, mặc định)")
    ap.add_argument("--scene", type=float, default=0.3, help="Ngưỡng dò đổi slide 0–1; nhỏ hơn = nhạy hơn (mặc định 0.3)")
    ap.add_argument("--min-gap", type=float, default=5.0, help="Mỗi slide tối thiểu bao nhiêu giây (mặc định 5)")
    ap.add_argument("--crop", help="Chỉ xét vùng slide khi dò/chụp, cú pháp ffmpeg w:h:x:y, vd \"iw*0.78:ih:0:0\" (bỏ webcam)")
    ap.add_argument("--polish", action="store_true", help="Làm sạch/viết lại lời giảng đúng ngữ cảnh bằng Claude (cần ANTHROPIC_API_KEY)")
    ap.add_argument("--polish-only", action="store_true", help="Chỉ chạy bước làm sạch trên recap.json có sẵn trong thư mục --out")
    ap.add_argument("--notes", action="store_true", help="Xuất thêm ghi chú học tập theo chủ đề (phần/mục, hộp ghi nhớ, ảnh slide) + zip import Notion; cần ANTHROPIC_API_KEY")
    ap.add_argument("--notes-only", action="store_true", help="Chỉ chạy bước ghi chú trên recap.json có sẵn trong thư mục --out")
    ap.add_argument("--skip-slides", help="Loại thủ công khỏi ghi chú, vd \"1-3,9\" (số slide trong recap.html)")
    ap.add_argument("--skip-until", help="Loại mọi slide bắt đầu trước mốc này, vd 05:30 (bỏ phần mở đầu)")
    ap.add_argument("--lecturer", help="Tên giảng viên (hiện ở đầu ghi chú)")
    ap.add_argument("--background", help="Giới thiệu ngắn về giảng viên (hiện ở đầu ghi chú)")
    ap.add_argument("--polish-model", default="claude-sonnet-5-5", help="Model Claude dùng để làm sạch (mặc định claude-sonnet-5-5)")
    ap.add_argument("--context", help="Mô tả bài giảng + thuật ngữ chính; dùng gợi ý cho gỡ băng và cho bước làm sạch")
    ap.add_argument("--glossary", help="File .txt: mỗi dòng một thuật ngữ/tên riêng cần viết đúng")
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
    glossary = [l.strip() for l in Path(a.glossary).read_text(encoding="utf-8-sig").splitlines() if l.strip()] if a.glossary else []
    prompt = " ".join(x for x in [a.context, ", ".join(glossary)] if x)[:600] or None
    title = a.title or video.stem.replace("-", " ").replace("_", " ")

    if a.polish_only or a.notes_only:
        data = json.loads((out / "recap.json").read_text(encoding="utf-8"))
        slides = data["slides"]
        for sl in slides:
            sl["raw"] = sl.get("raw") or sl["paras"]
        if a.polish_only:
            polish_all(slides, out, a.polish_model, a.context, glossary)
            write_outputs(out, a.title or data["title"], Path(data["video"]), slides)
        if a.notes or a.notes_only:
            make_notes(slides, out, a.title or data["title"], a.polish_model, a.context, glossary, a.lecturer, a.background, parse_skips(a.skip_slides, a.skip_until, slides))
        print(f"Xong -> {out}/")
        return

    total = duration(video)
    print(f"Video dài {hms(total)} — dò đổi slide (1 khung/giây)…")
    t0 = time.time()
    sample_frame(video, total, out / "sample.jpg", a.crop)
    seg_f, seg_key = out / "segments.json", f"{video.stat().st_size}|{a.scene}|{a.crop}|{a.min_gap}"
    if seg_f.is_file() and json.loads(seg_f.read_text(encoding="utf-8")).get("key") == seg_key:
        segments = [tuple(x) for x in json.loads(seg_f.read_text(encoding="utf-8"))["segments"]]
        print("  Dùng kết quả dò slide đã lưu.")
    else:
        segments = build_segments(detect_changes(video, a.scene, a.crop), total, a.min_gap)
        seg_f.write_text(json.dumps({"key": seg_key, "segments": segments}), encoding="utf-8")
    print(f"  {len(segments)} đoạn slide (mất {hms(time.time() - t0)}). Xem khung đang xét: {out}/sample.jpg")

    cues = parse_subs(a.transcript) if a.transcript else whisper_cues(video, a.lang, a.model, out / f"transcript-{a.model}-b{a.beam}.json", prompt, a.beam)
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
        slides[-1]["raw"] = list(slides[-1]["paras"])
    print(f"\n  {len(slides)} slide sau khi gộp trùng")

    if a.polish:
        polish_all(slides, out, a.polish_model, a.context, glossary)
    write_outputs(out, title, video, slides)
    if a.notes:
        make_notes(slides, out, title, a.polish_model, a.context, glossary, a.lecturer, a.background, parse_skips(a.skip_slides, a.skip_until, slides))
    print(f"Xong -> {out}/recap.html (mở bằng trình duyệt), recap.md, recap.json")


if __name__ == "__main__":
    main()
