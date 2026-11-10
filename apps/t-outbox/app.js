// T-outbox: giữ trạng thái văn phòng (ai đang làm gì) từ luồng sự kiện do hook ghi lại,
// rồi giao cho một "view" vẽ ra: 3D (three.js) hoặc 2D (dự phòng khi máy không có WebGL).
import { View2D } from './view2d.js';

const DONE_SHOW_MS = 7000;            // giữ trạng thái "xong" trước khi về pantry
const STALE_MS = 30 * 60 * 1000;      // quá lâu không có tín hiệu thì coi như đã nghỉ
const DEMO_AFTER_IDLE_MS = 10 * 60 * 1000;
const DEMO_LOOP_PAUSE_MS = 6000;
const FEED_MAX = 80;
const TASKS_MAX = 40;
const REAL_EVENTS_MAX = 3000;
const BAND_H = 124;                 // chiều cao mỗi tầng trên sơ đồ 2D
const GUEST_COLORS = ['#6b7a90', '#9a6b4f', '#4f8a6b', '#8a4f7d', '#4f6b9a', '#9a8a4f'];
const FEED_TOOLS = new Set(['Write', 'Edit', 'NotebookEdit', 'WebSearch', 'WebFetch', 'Skill']);
const ASSIST_MS = 6000;               // chế độ sôi nổi: nhân viên hỗ trợ CEO hiện ở bàn bao lâu
const DONE_COLUMN_MAX = 12;
const FOLLOW_GAP_MS = 4500;           // máy quay "theo việc" không đổi cảnh nhanh hơn mức này
const FOLLOW_BACK_MS = 3000;
const SESSION_COLORS = ['#3273c4', '#e4572e', '#3f9a5a', '#7c5cbf', '#c8497a', '#b8860b'];
const FEED_GENERIC = { boss: 'giao việc mới', assign: 'giao việc cho nhân viên', tool: 'đang làm việc', done: 'hoàn thành một việc', wait: 'chờ sếp duyệt' };

const $ = (id) => document.getElementById(id);

const S = {
  roster: null,
  staff: new Map(),
  tasks: [],
  feed: [],
  doneCount: 0,
  animate: false,       // false khi đang diễn lại lịch sử: không chạy hiệu ứng
  ready: false,
  mode: 'live',         // 'live' | 'demo'
  realEvents: [],
  lastRealAt: 0,
  hide: false,
  lively: true,
  follow: true,
  sessions: new Map(),  // sid -> màu, để phân biệt nhiều phiên Claude Code cùng lúc
  openTasks: new Set(),
  taskSeq: 0,
  slots: {},            // số bàn đã xếp trên mỗi tầng
};
let view = null;
// WEB: bản demo tĩnh trên website (không có server local): đọc dữ liệu mẫu từ data/ và chỉ chạy kịch bản diễn thử.
let WEB = false;
let demoTimer = null;
let demoScript = null;
let followAt = 0;
let followTimer = null;

// Máy quay "theo việc": lướt tới người vừa nhận việc, xong lượt thì lùi về toàn cảnh.
function follow(action) {
  if (!S.follow || !S.animate || !view || !view.focusStaff) return;
  clearTimeout(followTimer);
  const wait = Math.max(0, followAt + FOLLOW_GAP_MS - Date.now());
  followTimer = setTimeout(() => { followAt = Date.now(); action(); }, wait);
}

// ---- Tiện ích ------------------------------------------------------------------
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function pref(key, fallback) {
  try { return localStorage.getItem('t-outbox.' + key) ?? fallback; } catch { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem('t-outbox.' + key, value); } catch { /* không lưu được cũng không sao */ }
}
function staffId(type) {
  return String(type || 'general-purpose').replace(/^t-outbox:/, '');
}
function glob(pattern) {
  return new RegExp('^' + String(pattern).split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
}
function sessionColor(sid) {
  if (!S.sessions.has(sid)) S.sessions.set(sid, SESSION_COLORS[S.sessions.size % SESSION_COLORS.length]);
  return S.sessions.get(sid);
}
function elapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function clock(t) {
  return new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function duration(ms) {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s} giây` : `${Math.floor(s / 60)} phút${s % 60 ? ' ' + (s % 60) + ' giây' : ''}`;
}
function hashIndex(str, n) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

function describeTool(ev) {
  const d = ev.detail;
  switch (ev.tool) {
    case 'Write': return d ? `Đang viết ${d}` : 'Đang viết tài liệu';
    case 'Edit': case 'NotebookEdit': return d ? `Đang sửa ${d}` : 'Đang chỉnh sửa';
    case 'Read': return d ? `Đang đọc ${d}` : 'Đang đọc tài liệu';
    case 'WebSearch': return d ? `Đang tìm: ${d}` : 'Đang tìm trên web';
    case 'WebFetch': return d ? `Đang xem ${d}` : 'Đang xem trang web';
    case 'Bash': return d || 'Đang chạy lệnh';
    case 'Grep': case 'Glob': return 'Đang lục hồ sơ dự án';
    case 'Skill': return d ? `Đang dùng skill ${d}` : 'Đang dùng skill';
    case 'AskUserQuestion': return 'Đang hỏi ý kiến sếp';
    default: {
      const m = /^mcp__(.+?)__/.exec(ev.tool || '');
      if (m) return `Đang dùng ${m[1].replace(/_/g, ' ')}`;
      return 'Đang xử lý';
    }
  }
}

// ---- Nhân viên -------------------------------------------------------------------
function createStaff(def) {
  const r = S.roster;
  const dept = (r.departments || []).find((d) => d.id === def.dept);
  const s = {
    title: 'Cộng tác viên', ...def,
    name: def.name || def.id,
    deptName: dept ? dept.name : 'Cộng tác viên',
    instances: new Map(), status: 'idle', activity: '', alert: false, assist: false, lastTs: 0, doneAt: 0,
  };
  // Màu nhận diện là màu phòng ban; áo đồng phục thì theo brand (do view vẽ).
  if (!s.color) s.color = dept ? dept.color : GUEST_COLORS[hashIndex(s.id, GUEST_COLORS.length)];
  s.matchers = (Array.isArray(def.match) ? def.match : []).map(glob);
  // Mỗi phòng ban ở một tầng; người chưa thuộc phòng nào (cộng tác viên) ngồi ở sảnh tầng trệt.
  const floors = r.floors || [];
  let floor = floors.findIndex((f) => f.dept && f.dept === s.dept);
  if (floor < 0) floor = Math.max(0, floors.findIndex((f) => f.kind === 'lobby'));
  s.floor = floor;
  s.slot = S.slots[floor] = (S.slots[floor] ?? -1) + 1;
  // Tọa độ cho sơ đồ 2D dự phòng: mỗi tầng là một dải ngang, tầng cao nằm trên.
  const y0 = (floors.length - 1 - floor) * BAND_H;
  s.desk = { x: 250 + s.slot * 165, y: y0 + 92 };
  s.lounge = { x: 990 + (s.slot % 4) * 52, y: y0 + 62 + (hashIndex(s.id, 5) - 2) * 3 };
  S.staff.set(s.id, s);
  if (view) view.addStaff(s);
  return s;
}

// Tên subagent -> nhân viên: đúng id, hoặc khớp mẫu `match` trong roster, nếu không thì là cộng tác viên mới.
function getStaff(type) {
  const id = staffId(type);
  const direct = S.staff.get(id);
  if (direct) return direct;
  for (const s of S.staff.values()) if (s.matchers.some((re) => re.test(id))) return s;
  return createStaff({ id, name: id });
}

// Chế độ sôi nổi: việc CEO tự làm được một nhân viên đúng chuyên môn "hỗ trợ" để cả văn phòng cùng chuyển động.
function pickHelper(ev) {
  const d = String(ev.detail || '').toLowerCase();
  const ext = (d.match(/\.([a-z0-9]+)$/) || [])[1] || '';
  let id = null;
  if (ev.tool === 'WebSearch' || ev.tool === 'WebFetch') id = 'researcher';
  else if (['Write', 'Edit', 'NotebookEdit'].includes(ev.tool)) {
    if (['md', 'txt', 'docx', 'mdx'].includes(ext)) id = 'content-writer';
    else if (['html', 'css', 'js', 'mjs', 'ts', 'tsx', 'jsx', 'py', 'php', 'vue', 'go', 'rs'].includes(ext)) id = 'web-developer';
    else if (['csv', 'xlsx', 'json', 'sql', 'ipynb', 'tsv'].includes(ext)) id = 'data-analyst';
    else if (['svg', 'png', 'jpg', 'jpeg', 'webp', 'fig'].includes(ext)) id = 'designer';
  } else if (ev.tool === 'Bash' && /test|kiểm|lint/.test(d)) id = 'qa-reviewer';
  else if (/^mcp__canva/i.test(ev.tool || '')) id = 'designer';
  const s = id && S.staff.get(id);
  return s && !s.off && s.instances.size === 0 ? s : null;
}

function bubbleText(s) {
  if (s.alert) return 'Chờ sếp duyệt quyền';
  if (s.status === 'working') return S.hide ? 'Đang làm việc' : (s.activity || 'Đang làm việc');
  if (s.status === 'done') return s.fixed ? 'Đã báo cáo sếp' : 'Xong việc';
  return '';
}

function setWorking(s, activity, t) {
  s.status = 'working';
  if (activity) s.activity = activity;
  s.lastTs = t;
}
function setDone(s, t) {
  s.status = 'done';
  s.doneAt = t;
  s.lastTs = t;
}
function addFeed(t, who, text, kind) {
  S.feed.unshift({ t, who, text, kind });
  if (S.feed.length > FEED_MAX) S.feed.length = FEED_MAX;
}

function resetState() {
  for (const s of S.staff.values()) {
    s.instances.clear(); s.status = 'idle'; s.activity = ''; s.alert = false; s.assist = false; s.lastTs = 0; s.doneAt = 0;
  }
  S.tasks = []; S.feed = []; S.doneCount = 0; S.sessions.clear(); S.openTasks.clear();
}

// ---- Xử lý sự kiện -----------------------------------------------------------------
function apply(ev) {
  const t = ev.t || Date.now();
  const manager = S.staff.get('manager');
  // Sự kiện phát sinh bên trong subagent mang agent_id; còn lại là của Claude chính.
  const actor = ev.agent_id ? getStaff(ev.agent_type) : manager;
  if (ev.e !== 'wait') actor.alert = false;

  switch (ev.e) {
    case 'prompt':
      setWorking(manager, 'Nhận việc từ sếp', t);
      addFeed(t, 'Sếp', ev.text || 'giao việc mới', 'boss');
      break;

    case 'assign': {
      const to = getStaff(ev.to);
      setWorking(actor, `Giao việc cho ${to.name}`, t);
      S.tasks.unshift({ id: ++S.taskSeq, sid: ev.sid, staff: to.id, desc: ev.desc || 'Việc mới', by: actor.name, status: 'assigned', t0: t, steps: [] });
      if (S.tasks.length > TASKS_MAX) S.tasks.length = TASKS_MAX;
      addFeed(t, actor.name, `giao cho ${to.name}: ${ev.desc || 'việc mới'}`, 'assign');
      if (S.animate) view.paper(actor, to, sessionColor(ev.sid));
      break;
    }

    case 'agent_start': {
      const task = [...S.tasks].reverse().find((k) => k.staff === actor.id && k.status === 'assigned' && k.sid === ev.sid);
      const desc = task ? task.desc : 'Việc tiếp nối';
      if (task) { task.status = 'working'; task.agent_id = ev.agent_id; task.t0 = t; }
      else S.tasks.unshift({ id: ++S.taskSeq, sid: ev.sid, staff: actor.id, desc, by: manager.name, status: 'working', agent_id: ev.agent_id, t0: t, steps: [] });
      actor.assist = false;
      actor.instances.set(ev.agent_id, { desc, t });
      follow(() => view.focusStaff(actor.id));
      setWorking(actor, desc, t);
      break;
    }

    case 'tool': {
      const text = describeTool(ev);
      if (ev.agent_id && !actor.instances.has(ev.agent_id)) actor.instances.set(ev.agent_id, { desc: '', t });
      setWorking(actor, text, t);
      if (ev.agent_id) {
        const task = S.tasks.find((k) => k.agent_id === ev.agent_id);
        if (task) { task.steps.push({ t, text }); if (task.steps.length > 30) task.steps.shift(); }
      } else if (S.lively && S.animate) {
        const helper = pickHelper(ev);
        if (helper) { helper.assist = true; setWorking(helper, 'Hỗ trợ CEO: ' + text.replace(/^Đang /, ''), t); }
      }
      if (FEED_TOOLS.has(ev.tool) || /^mcp__/.test(ev.tool || '')) addFeed(t, actor.name, text.replace(/^Đang /, ''), 'tool');
      break;
    }

    case 'wait':
      actor.alert = true;
      setWorking(actor, '', t);
      addFeed(t, actor.name, 'chờ sếp duyệt quyền' + (ev.tool ? ` (${ev.tool})` : ''), 'wait');
      break;

    case 'agent_stop': {
      actor.instances.delete(ev.agent_id);
      const task = S.tasks.find((k) => k.agent_id === ev.agent_id);
      if (task && task.status !== 'done') {
        task.status = 'done'; task.t1 = t; task.result = ev.msg;
        S.doneCount++;
        addFeed(t, actor.name, `hoàn thành: ${task.desc}`, 'done');
        if (S.animate) view.celebrate(actor);
      }
      if (actor.instances.size === 0) setDone(actor, t);
      else actor.lastTs = t;
      break;
    }

    case 'stop':
      setDone(manager, t);
      addFeed(t, manager.name, 'đã báo cáo sếp', 'done');
      if (S.animate) view.celebrate(manager);
      if (![...S.staff.values()].some((s) => s.instances.size)) {
        follow(() => { view.focusStaff('manager'); followTimer = setTimeout(() => view.overview(), FOLLOW_BACK_MS); });
      }
      break;

    case 'session_end':
      for (const k of S.tasks) if (k.sid === ev.sid && k.status === 'assigned') k.status = 'cancelled';
      if (manager.status === 'working') manager.status = 'idle';
      break;
  }
}

// Dọn trạng thái theo thời gian: "xong" một lúc rồi về pantry, im quá lâu thì coi như đã nghỉ.
function settle(now) {
  let changed = false;
  for (const s of S.staff.values()) {
    if (s.status === 'done' && now - s.doneAt > DONE_SHOW_MS) { s.status = 'idle'; changed = true; }
    if (s.assist && s.status === 'working' && now - s.lastTs > ASSIST_MS) { s.status = 'idle'; s.assist = false; changed = true; }
    if (s.status === 'working' && now - s.lastTs > STALE_MS) { s.status = 'idle'; s.alert = false; s.instances.clear(); changed = true; }
  }
  return changed;
}

// ---- Vẽ ------------------------------------------------------------------------------
function card(k, now) {
  const s = S.staff.get(k.staff);
  const last = k.steps[k.steps.length - 1];
  const time = k.status === 'done' ? duration(k.t1 - k.t0)
    : k.status === 'working' ? `<span class="clock" data-t0="${k.t0}">${elapsed(now - k.t0)}</span>` : clock(k.t0);
  const dot = S.sessions.size > 1 ? `<i class="session" style="background:${esc(sessionColor(k.sid))}" title="Phiên Claude Code"></i>` : '';
  const steps = k.steps.length && !S.hide
    ? `<ol class="steps">${k.steps.map((x) => `<li><time>${clock(x.t)}</time>${esc(x.text)}</li>`).join('')}</ol>`
    : '<p class="steps none">Chưa ghi nhận bước nào.</p>';
  return `<li class="task ${k.status}" style="--c:${esc(s ? s.color : '#888')}">
    <details data-id="${k.id}"${S.openTasks.has(k.id) ? ' open' : ''}>
      <summary>
        <div class="task-top"><span class="who">${dot}${esc(s ? s.name : k.staff)}</span><span class="time">${time}</span></div>
        <div class="task-dept">${esc(s ? s.deptName : '')}</div>
        <div class="task-desc">${S.hide ? '•••' : esc(k.desc)}</div>
        ${k.status === 'working' && last && !S.hide ? `<div class="task-now">${esc(last.text)}</div>` : ''}
        <div class="task-meta">${esc(k.by)} giao</div>
      </summary>
      ${steps}
    </details>
  </li>`;
}

function render() {
  for (const s of S.staff.values()) view.sync(s, bubbleText(s), S.animate);
  const now = Date.now();
  const staff = [...S.staff.values()];

  $('stat-working').textContent = staff.filter((s) => s.status === 'working').length;
  $('stat-done').textContent = S.doneCount;

  const cols = { assigned: [], working: [], done: [] };
  for (const k of S.tasks) if (cols[k.status]) cols[k.status].push(k);
  cols.done.sort((a, b) => b.t1 - a.t1);
  cols.done.length = Math.min(cols.done.length, DONE_COLUMN_MAX);
  const empty = { assigned: 'Không có việc đang chờ.', working: 'Chưa ai đang làm.', done: 'Chưa có việc nào xong.' };
  for (const key of Object.keys(cols)) {
    $('count-' + key).textContent = cols[key].length;
    $('col-' + key).innerHTML = cols[key].length ? cols[key].map((k) => card(k, now)).join('') : `<li class="empty">${empty[key]}</li>`;
  }

  $('depts').innerHTML = (S.roster.departments || []).map((d) => {
    const team = staff.filter((s) => s.dept === d.id && !s.off);
    const busy = team.filter((s) => s.status === 'working').length;
    return `<li style="--c:${esc(d.color)}" data-dept="${esc(d.id)}" title="Bấm để xem tầng này"><span class="dept-name">${esc(d.name)}</span>
      <span class="dept-dots">${team.map((s) => `<i class="${s.status}" title="${esc(s.name)}"></i>`).join('')}</span>
      <span class="dept-count">${busy}/${team.length}</span></li>`;
  }).join('') + [['meeting', 'Trung tâm hội nghị'], ['canteen', 'Canteen'], ['lobby', 'Sảnh, lễ tân, bảo vệ'], ['parking', 'Hầm đỗ xe B1']].map(([id, name]) =>
    `<li class="place" data-dept="${id}" title="Bấm để xem"><span class="dept-name">${name}</span></li>`).join('');

  $('feed').innerHTML = S.feed.length ? S.feed.map((f) =>
    `<li class="${esc(f.kind)}"><time>${clock(f.t)}</time><span><b>${esc(f.who)}</b> ${esc(S.hide ? FEED_GENERIC[f.kind] || '' : f.text)}</span></li>`
  ).join('') : '<li class="empty">Văn phòng đang yên tĩnh.</li>';
}

function tickClocks() {
  const now = Date.now();
  for (const el of document.querySelectorAll('.clock')) el.textContent = elapsed(now - Number(el.dataset.t0));
}

function setBadge() {
  const live = $('live');
  live.classList.toggle('on', S.ready);
  live.classList.toggle('demo', S.ready && S.mode === 'demo');
  $('live-text').textContent = !S.ready ? 'Đang kết nối' : S.mode === 'demo' ? 'Demo' : 'Đang theo dõi';
  $('demo-note').hidden = !(S.ready && S.mode === 'demo');
}

// ---- Demo: văn phòng tự diễn khi chưa có việc thật ---------------------------------------
async function startDemo() {
  if (S.mode === 'demo') return;
  if (!demoScript) {
    try { demoScript = await (await fetch(WEB ? 'data/demo-script.json' : 'api/demo')).json(); } catch { demoScript = []; }
  }
  if (!demoScript.length || S.mode === 'demo') return;
  S.mode = 'demo';
  resetState();
  S.animate = true;
  setBadge(); render();
  let i = 0;
  const step = () => {
    if (S.mode !== 'demo') return;
    if (i >= demoScript.length) {
      i = 0;
      demoTimer = setTimeout(() => { if (S.mode === 'demo') { resetState(); render(); step(); } }, DEMO_LOOP_PAUSE_MS);
      return;
    }
    const [wait, ev] = demoScript[i++];
    demoTimer = setTimeout(() => {
      if (S.mode !== 'demo') return;
      apply({ t: Date.now(), sid: 'demo', ...ev });
      render();
      step();
    }, wait * 1000);
  };
  step();
}

function stopDemo() {
  clearTimeout(demoTimer);
  S.mode = 'live';
  resetState();
  S.animate = false;
  for (const ev of S.realEvents) apply(ev);
  settle(Date.now());
  render();
  S.animate = true;
  setBadge();
}

function onRealEvent(ev) {
  S.realEvents.push(ev);
  if (S.realEvents.length > REAL_EVENTS_MAX) S.realEvents.shift();
  S.lastRealAt = Math.max(S.lastRealAt, ev.t || Date.now());
  if (!S.ready) return apply(ev);          // đang nạp lịch sử
  if (S.mode === 'demo') return stopDemo(); // việc thật tới: dừng demo, dựng lại từ sự kiện thật
  apply(ev);
  render();
}

function idleLongEnough(now) {
  return now - S.lastRealAt > DEMO_AFTER_IDLE_MS && ![...S.staff.values()].some((s) => s.status === 'working');
}

// Sơ đồ 2D: tòa nhà nhìn theo mặt cắt, mỗi tầng một dải.
function layout2d() {
  const floors = S.roster.floors || [];
  const depts = S.roster.departments || [];
  return {
    floor: { width: 1200, height: floors.length * BAND_H + 8 },
    rooms: floors.map((f, i) => {
      const d = depts.find((k) => k.id === f.dept);
      return { x: 8, y: (floors.length - 1 - i) * BAND_H + 8, w: 1184, h: BAND_H - 8, name: `Tầng ${i + 1} · ${f.name || (d ? d.name : f.id)}` };
    }),
  };
}

// ---- View ---------------------------------------------------------------------------------
async function useView(kind) {
  const stage = $('stage');
  if (view) view.dispose();
  stage.innerHTML = '';
  view = null;
  if (kind === '3d') {
    try {
      const { View3D } = await import('./view3d.js');
      view = await View3D.create(stage, S.roster);
    } catch (err) {
      console.warn('Không dựng được văn phòng 3D, chuyển sang 2D:', err);
      stage.innerHTML = '';
      kind = '2d';
    }
  }
  if (!view) view = new View2D(stage, layout2d());
  stage.dataset.view = kind;
  window.tOutboxView = view; // tiện kiểm thử và gỡ lỗi từ console
  $('btn-view').textContent = kind === '3d' ? 'Xem 2D' : 'Xem 3D';
  $('btn-camera').hidden = kind !== '3d';
  $('btn-night').hidden = kind !== '3d';
  $('btn-follow').hidden = kind !== '3d';
  if (view.setNight) view.setNight(pref('night', '0') === '1');
  savePref('view', kind);
  for (const s of S.staff.values()) view.addStaff(s);
  for (const s of S.staff.values()) view.sync(s, bubbleText(s), false);
}

// ---- Bảng tùy biến: brand và tên nhân viên, lưu vào .t-outbox/ của dự án ------------------------
function setupCustomize() {
  const dlg = $('customize');
  const brand = S.roster.brand || {};
  const colors = brand.colors || {};
  const f = dlg.querySelector('form');
  $('btn-customize').onclick = () => {
    f.elements.name.value = brand.name || '';
    f.elements.tagline.value = brand.tagline || '';
    f.elements.logoText.value = brand.logoText || '';
    for (const key of ['primary', 'secondary', 'accent']) f.elements[key].value = colors[key] || '#888888';
    f.elements.style.value = (brand.uniform && brand.uniform.style) || 'polo';
    $('staff-fields').innerHTML = S.roster.staff.filter((s) => !s.fixed).map((s) =>
      `<label class="staff-row"><span>${esc(s.title || s.id)}</span>
        <input name="staff-name" data-id="${esc(s.id)}" value="${esc(s.name || s.id)}" maxlength="24">
        <span class="off"><input type="checkbox" name="staff-off" data-id="${esc(s.id)}"${s.off ? ' checked' : ''}> Đang tuyển</span></label>`
    ).join('');
    $('customize-error').textContent = '';
    dlg.showModal();
  };
  $('customize-cancel').onclick = () => dlg.close();
  f.onsubmit = async (e) => {
    e.preventDefault();
    const off = new Map([...f.querySelectorAll('[name="staff-off"]')].map((el) => [el.dataset.id, el.checked]));
    const body = {
      brand: {
        name: f.elements.name.value, tagline: f.elements.tagline.value, logoText: f.elements.logoText.value,
        colors: { primary: f.elements.primary.value, secondary: f.elements.secondary.value, accent: f.elements.accent.value },
        uniform: { style: f.elements.style.value },
      },
      staff: [...f.querySelectorAll('[name="staff-name"]')].map((el) => ({ id: el.dataset.id, name: el.value, off: off.get(el.dataset.id) })),
    };
    try {
      const res = await fetch('api/customize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || res.status);
      location.reload();
    } catch (err) {
      $('customize-error').textContent = 'Không lưu được: ' + err.message;
    }
  };
}

// ---- Khởi động ------------------------------------------------------------------------------
// Có server local thì đọc cấu hình qua API; không có (bản demo trên web) thì đọc dữ liệu mẫu đi kèm.
async function loadConfig() {
  // Bản dựng cho website (scripts/build-web-demo.sh) gắn <meta name="t-outbox-mode" content="web">: bỏ qua bước hỏi server.
  const webBuild = document.querySelector('meta[name="t-outbox-mode"]')?.content === 'web';
  if (!webBuild) try {
    const res = await fetch('api/roster', { cache: 'no-store' });
    if (res.ok && /json/.test(res.headers.get('content-type') || '')) return await res.json();
  } catch { /* không có server */ }
  WEB = true;
  const [roster, brand] = await Promise.all(['data/roster.json', 'data/brand.json'].map((u) => fetch(u).then((r) => r.json())));
  return { ...roster, brand, project: 'Demo' };
}

async function start() {
  S.roster = await loadConfig();
  const brand = S.roster.brand || {};
  $('project').textContent = S.roster.project || '';
  $('brand-name').textContent = brand.name || 'T-outbox';
  $('brand-logo').textContent = brand.logoText || '';
  document.title = `${brand.name || 'T-outbox'} · ${S.roster.project || ''}`;
  const root = document.documentElement.style;
  if (brand.colors) {
    root.setProperty('--brand', brand.colors.primary);
    root.setProperty('--accent', brand.colors.accent);
  }
  // Màu nền giao diện theo brand (tùy chọn `theme` trong brand.json).
  for (const [key, value] of Object.entries(brand.theme || {})) {
    if (['bg', 'panel', 'ink', 'muted', 'line'].includes(key) && /^#[0-9a-f]{6}$/i.test(value)) root.setProperty('--' + key, value);
  }
  S.lively = pref('lively', '1') === '1';
  $('btn-lively').setAttribute('aria-pressed', String(S.lively));
  $('btn-night').setAttribute('aria-pressed', String(pref('night', '0') === '1'));
  S.hide = pref('hide', '0') === '1';
  $('btn-hide').setAttribute('aria-pressed', String(S.hide));

  const wanted = new URLSearchParams(location.search).get('view') || pref('view', '3d');
  await useView(wanted === '2d' ? '2d' : '3d');
  for (const def of S.roster.staff) createStaff(def);
  render();

  $('btn-view').onclick = async () => { await useView($('stage').dataset.view === '3d' ? '2d' : '3d'); render(); };
  $('btn-camera').onclick = () => { clearTimeout(followTimer); if (view.overview) view.overview(); };
  $('btn-hide').onclick = () => {
    S.hide = !S.hide;
    savePref('hide', S.hide ? '1' : '0');
    $('btn-hide').setAttribute('aria-pressed', String(S.hide));
    render();
  };

  $('btn-lively').onclick = () => {
    S.lively = !S.lively;
    savePref('lively', S.lively ? '1' : '0');
    $('btn-lively').setAttribute('aria-pressed', String(S.lively));
  };
  S.follow = pref('follow', '1') === '1';
  $('btn-follow').setAttribute('aria-pressed', String(S.follow));
  $('btn-follow').onclick = () => {
    S.follow = !S.follow;
    savePref('follow', S.follow ? '1' : '0');
    $('btn-follow').setAttribute('aria-pressed', String(S.follow));
    if (!S.follow) { clearTimeout(followTimer); if (view.overview) view.overview(); }
  };
  // Bấm tên phòng ban để lướt máy quay tới phòng đó.
  $('depts').addEventListener('click', (e) => {
    const li = e.target.closest('[data-dept]');
    if (li && view.focusFloor) { clearTimeout(followTimer); view.focusFloor(li.dataset.dept); }
  });
  $('btn-night').onclick = () => {
    const on = pref('night', '0') !== '1';
    savePref('night', on ? '1' : '0');
    $('btn-night').setAttribute('aria-pressed', String(on));
    if (view.setNight) view.setNight(on);
  };
  // Nhớ thẻ việc nào đang mở để lần vẽ lại sau không tự đóng.
  $('board').addEventListener('toggle', (e) => {
    const id = Number(e.target.dataset && e.target.dataset.id);
    if (!id) return;
    if (e.target.open) S.openTasks.add(id); else S.openTasks.delete(id);
  }, true);
  if (WEB) { // bản demo trên web: không có sự kiện thật, chỉ diễn thử
    $('btn-customize').hidden = true;
    $('demo-note').textContent = 'Bản demo trên web: đội AI mẫu đang diễn một buổi làm việc. Cài plugin T-outbox vào Claude Code để xem đội của bạn làm việc thật.';
    S.ready = true;
    requestAnimationFrame(() => { S.animate = true; startDemo(); });
    setInterval(() => { if (settle(Date.now())) render(); else tickClocks(); }, 1000);
    window.addEventListener('resize', () => view.resize());
    return;
  }
  setupCustomize();

  const es = new EventSource('api/events');
  es.onmessage = (m) => {
    let ev;
    try { ev = JSON.parse(m.data); } catch { return; }
    onRealEvent(ev);
  };
  es.addEventListener('ready', () => {
    if (S.ready) return; // kết nối lại: trạng thái đã có sẵn
    settle(Date.now());
    render();
    S.ready = true;
    // Bật hiệu ứng sau khi vị trí ban đầu đã được vẽ, để không ai "chạy" từ góc màn hình ra.
    requestAnimationFrame(() => { S.animate = true; });
    setBadge();
    if (idleLongEnough(Date.now())) startDemo();
  });
  es.addEventListener('reset', () => location.reload());
  es.addEventListener('config', () => location.reload()); // brand hoặc roster của dự án vừa đổi
  es.onerror = () => { $('live').classList.remove('on'); $('live-text').textContent = 'Mất kết nối, đang thử lại'; };
  es.onopen = () => { if (S.ready) setBadge(); };

  setInterval(() => {
    const now = Date.now();
    if (settle(now)) render(); else tickClocks();
    if (S.ready && S.mode === 'live' && idleLongEnough(now)) startDemo();
  }, 1000);
  window.addEventListener('resize', () => view.resize());
}

start().catch((err) => {
  $('live-text').textContent = 'Không tải được văn phòng';
  console.error(err);
});
