/* Chân trang: đồng hồ giờ Sài Gòn (GMT+7), chạy mỗi giây. Không gửi dữ liệu đi đâu. */
(() => {
  const el = document.getElementById("footTime"); if (!el) return;
  let fmt;
  try { fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }); } catch { fmt = null; }
  const tick = () => {
    if (fmt) { el.textContent = "GMT+7 " + fmt.format(new Date()); return; }
    const d = new Date(Date.now() + new Date().getTimezoneOffset() * 60000 + 7 * 3600000), z = (n) => String(n).padStart(2, "0");
    el.textContent = "GMT+7 " + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
  };
  tick(); setInterval(tick, 1000);
})();
