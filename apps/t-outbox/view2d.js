// View 2D: sơ đồ văn phòng phẳng bằng HTML/CSS. Dùng khi máy không có WebGL hoặc người dùng chọn "Xem 2D".
const MIN_SCALE = 0.62;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function avatarSvg(s) {
  const hairColor = /^#[0-9a-f]{6}$/i.test(s.hair) ? s.hair : '#3a2a20';
  const hair = s.gender === 'f'
    ? '<path d="M7 30V18a15 15 0 0 1 30 0v12h-4V19c-3-4-7-6-11-6s-8 2-11 6v11z"/>'
    : '<path d="M8 19a14 14 0 0 1 28 0c-4-5-9-7-14-7s-10 2-14 7z"/>';
  return `<svg viewBox="0 -2 44 60" width="44" height="60" aria-hidden="true">
    <rect x="5" y="31" width="34" height="27" rx="11" fill="${esc(s.color)}"/>
    <circle cx="22" cy="19" r="13" fill="${esc(s.skin || '#f1c9a5')}"/>
    <g fill="${esc(hairColor)}">${hair}</g>
    <circle cx="17" cy="21" r="1.6" fill="#2a2a2a"/><circle cx="27" cy="21" r="1.6" fill="#2a2a2a"/>
    <path d="M18.5 26.5q3.5 2.5 7 0" fill="none" stroke="#2a2a2a" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
}

export class View2D {
  constructor(container, roster) {
    this.roster = roster;
    this.nodes = new Map();
    this.wrap = document.createElement('div');
    this.wrap.className = 'floor-wrap';
    this.floor = document.createElement('div');
    this.floor.className = 'floor';
    this.sizer = document.createElement('div');
    this.sizer.className = 'floor-sizer';
    this.wrap.append(this.floor, this.sizer);
    container.appendChild(this.wrap);

    this.floor.style.width = roster.floor.width + 'px';
    this.floor.style.height = roster.floor.height + 'px';
    for (const room of roster.rooms) {
      const el = document.createElement('div');
      el.className = 'room ' + (room.kind || '');
      Object.assign(el.style, { left: room.x + 'px', top: room.y + 'px', width: room.w + 'px', height: room.h + 'px' });
      el.innerHTML = `<span class="room-name">${esc(room.name)}</span>`;
      this.floor.appendChild(el);
    }
    this.resize();
  }

  addStaff(s) {
    if (s.off) { // vị trí đang trống
      const vacant = document.createElement('div');
      vacant.className = 'desk';
      vacant.style.left = s.desk.x + 'px';
      vacant.style.top = s.desk.y + 'px';
      vacant.style.setProperty('--c', '#9a9a9a');
      vacant.innerHTML = '<div class="monitor"><i></i><i></i><i></i></div><div class="plate">Đang tuyển</div>';
      this.floor.appendChild(vacant);
      return;
    }
    const desk = document.createElement('div');
    desk.className = 'desk';
    desk.style.left = s.desk.x + 'px';
    desk.style.top = s.desk.y + 'px';
    desk.style.setProperty('--c', s.color);
    desk.innerHTML = `<div class="monitor"><i></i><i></i><i></i></div><div class="plate" title="${esc(s.title)}">${esc(s.name)}</div>`;

    const el = document.createElement('div');
    el.className = 'person';
    el.style.setProperty('--c', s.color);
    el.innerHTML = `<div class="bubble"><span></span></div><div class="avatar">${avatarSvg(s)}</div><div class="count"></div><div class="label">${esc(s.name)}</div>`;
    this.floor.append(desk, el);
    this.nodes.set(s.id, { el, desk, bubble: el.querySelector('.bubble span'), count: el.querySelector('.count') });
  }

  sync(s, text, animate) {
    const n = this.nodes.get(s.id);
    if (!n) return;
    const atDesk = s.fixed || s.status !== 'idle';
    const pos = atDesk ? { x: s.desk.x, y: s.desk.y - 46 } : s.lounge;
    const { el } = n;
    this.floor.classList.toggle('live', animate);
    if (el.dataset.x !== String(pos.x) || el.dataset.y !== String(pos.y)) {
      el.dataset.x = pos.x; el.dataset.y = pos.y;
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      if (animate) {
        el.classList.add('walking');
        setTimeout(() => el.classList.remove('walking'), 1200);
      }
    }
    el.classList.toggle('at-desk', atDesk);
    el.classList.toggle('working', s.status === 'working');
    el.classList.toggle('done', s.status === 'done');
    el.classList.toggle('alert', s.alert);
    el.classList.toggle('talking', Boolean(text));
    n.desk.classList.toggle('on', s.status === 'working');
    n.bubble.textContent = text;
    n.count.textContent = s.instances.size > 1 ? '×' + s.instances.size : '';
  }

  paper(from, to) {
    if (from === to) return;
    const p = document.createElement('div');
    p.className = 'paper';
    p.style.left = from.desk.x + 'px';
    p.style.top = from.desk.y - 20 + 'px';
    this.floor.appendChild(p);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      p.style.left = to.desk.x + 'px';
      p.style.top = to.desk.y - 20 + 'px';
    }));
    setTimeout(() => p.remove(), 1300);
  }

  celebrate() { /* bản 2D không có pháo giấy */ }

  resize() {
    // Màn hình hẹp: giữ sơ đồ đủ lớn để đọc được và cho cuộn ngang trong khung.
    const scale = Math.max(this.wrap.clientWidth / this.roster.floor.width, MIN_SCALE);
    this.floor.style.transform = `scale(${scale})`;
    this.wrap.style.height = this.roster.floor.height * scale + 'px';
    this.sizer.style.width = this.roster.floor.width * scale + 'px';
  }

  dispose() { this.wrap.remove(); }
}
