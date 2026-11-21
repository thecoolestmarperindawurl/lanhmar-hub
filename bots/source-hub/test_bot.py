"""Tự kiểm phần thuần của bot (không gọi mạng): python3 test_bot.py"""
from bot import clean_analysis, first_url

assert first_url("xem cái này https://x.com/a/status/1). hay") == "https://x.com/a/status/1"
assert first_url("không có link") is None
assert first_url("https://youtu.be/abc?t=3") == "https://youtu.be/abc?t=3"

row = clean_analysis({"title": " Bài A ", "status": "FULL", "tags": ["AI", ""], "key_ideas": "không phải mảng",
                      "apply": ["làm X"], "platform": "YouTube"}, "https://e.com")
assert row["title"] == "Bài A" and row["status"] == "full" and row["platform"] == "youtube"
assert row["tags"] == ["ai"] and row["key_ideas"] == [] and row["apply"] == ["làm X"] and row["quotes"] == []
assert clean_analysis({"title": "B", "status": "lạ"}, "u")["status"] == "partial"

for bad in ({}, {"title": "  "}, []):
    try:
        clean_analysis(bad, "u")
        raise AssertionError("phải báo lỗi")
    except ValueError:
        pass

import os, tempfile
from pathlib import Path
from bot import load_env
with tempfile.TemporaryDirectory() as d:
    p = Path(d) / ".env"
    p.write_text("T_TOK=123:abc   # @BotFather\nT_EMPTY=   # ghi chú\n# T_SKIP=1\nT_Q=\"x y\"\n", encoding="utf-8")
    load_env(p)
assert os.environ["T_TOK"] == "123:abc" and os.environ["T_EMPTY"] == "" and "T_SKIP" not in os.environ and os.environ["T_Q"] == "x y"

print("OK")
