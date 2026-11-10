// View 3D: trụ sở công ty dạng tòa tháp cắt lớp mặt trước, mỗi phòng ban một tầng.
// Nhân viên là người có khung xương và hoạt ảnh (Kenney Mini Characters, CC0), nội thất là Kenney Furniture Kit (CC0).
// Kết cấu tòa nhà, biển hiệu và phụ kiện đồng phục dựng bằng hình khối.
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from './vendor/utils/SkeletonUtils.js';
import { RoomEnvironment } from './vendor/environments/RoomEnvironment.js';

const KS = 1.9;               // tỉ lệ phóng nội thất Kenney vào tòa nhà
const PS = 1.9;               // tỉ lệ phóng nhân vật, cùng tỉ lệ với nội thất
const SEAT_LIFT = 0.34;       // nâng người lên mặt ghế khi ngồi (hoạt ảnh gốc ngồi xuống sàn)
const SEAT_BACK = 0.76;       // ghế nằm sau tâm bàn bao xa
const AISLE_Z = 3.75;         // lối đi trước dãy bàn
const WALK_SPEED = 2.3;       // đơn vị mỗi giây
const LIFT_SPEED = 6;         // tốc độ cabin thang máy
const LIFT_SEATS = 4;         // số người tối đa trong cabin
const LIFT_X = [0.9, 2.5];    // hai trục thang máy cạnh nhau trước mặt tiền
const CAR_SPEED = 4.2;        // tốc độ xe trên đường
const STAIR_SPEED = 1.5;      // tốc độ đi trên thang bộ
const CAR_GAP = 3.8;          // khoảng cách tối thiểu giữa hai xe cùng làn (tính từ tâm xe)
const HURRY = 1.6;            // có việc thì đi nhanh hơn
const DODGE = 0.38;           // nép sang phải bao xa khi tránh người đối diện
const PED_SPEED = 1.5;        // tốc độ người đi đường
// Đèn giao thông ở vạch qua đường trước trụ sở (giây): xanh cho xe, vàng, đỏ cho xe (người đi bộ được qua).
const SIGNAL = { green: 14, yellow: 2.5, red: 12, clear: 1.5 }; // clear: đỏ cho tất cả trước khi người đi bộ được qua
// Làn đường, đi bên phải: hai làn đi về phía -x (sát trụ sở) và hai làn đi về phía +x.
// Làn 1 là làn bên phải theo hướng đi, làn 2 là làn vượt.
const LANES = { n1: { dz: 1.05, dir: -1, pass: 'n2' }, n2: { dz: 3.15, dir: -1, keep: 'n1' }, f2: { dz: 5.25, dir: 1, keep: 'f1' }, f1: { dz: 7.35, dir: 1, pass: 'f2' } };
const ROAD_W = 8.4;
const FADE = 0.22;
const PERSON_H = 0.67 * PS;
const CONFETTI = ['#e4572e', '#f2b134', '#3f9a5a', '#3273c4', '#c8497a', '#7c5cbf'];
const FURNITURE = [
  'desk', 'chairDesk', 'computerScreen', 'computerKeyboard', 'laptop', 'kitchenCoffeeMachine', 'kitchenBar',
  'loungeSofa', 'loungeSofaLong', 'loungeChair', 'tableCoffee', 'tableRound', 'stoolBar', 'pottedPlant',
  'bookcaseOpen', 'bookcaseClosedWide', 'rugRound', 'rugRectangle', 'lampRoundFloor', 'lampSquareTable',
  'televisionModern', 'sideTableDrawers', 'coatRackStanding', 'trashcan',
  'table', 'tableCloth', 'chairCushion', 'chairModernCushion', 'kitchenFridge', 'kitchenFridgeLarge', 'kitchenMicrowave',
  'kitchenSink', 'kitchenCabinet', 'kitchenStoveElectric', 'bookcaseClosed', 'cardboardBoxClosed', 'books', 'rugSquare',
  'loungeDesignChair', 'toaster', 'stoolBarSquare',
];
// Mỗi nhân vật dùng vài ô trên bảng màu chung (ô = [cột, hàng], mỗi ô 64x128 điểm ảnh).
// Tô lại ô là đổi màu áo, quần, tóc, da. Chỉ khai báo ô nào nhân vật dùng riêng cho phần đó.
const LOOKS = {
  'female-b': { shirt: [0, 3], pants: [2, 1], hair: [0, 2], skin: [2, 2] },
  'female-c': { shirt: [0, 1], hair: [1, 3], skin: [0, 2] },
  'female-d': { shirt: [1, 3], hair: [0, 2], skin: [2, 2] },                 // mặc vest
  'female-e': { shirt: [7, 3], skin: [2, 2] },
  'female-f': { shirt: [0, 3], pants: [0, 1], hair: [1, 2], skin: [2, 2] },
  'male-a': { shirt: [4, 2], pants: [0, 1], shoes: [0, 3], belt: [0, 2], skin: [1, 2] },
  'male-b': { shirt: [7, 2], pants: [0, 1], hair: [0, 2], skin: [2, 2] },
  'male-d': { shirt: [3, 3], tie: [7, 2], hair: [0, 2], skin: [2, 2] },      // mặc vest, cà vạt
  'male-c': {},                                                               // đồng phục bảo vệ, giữ nguyên màu gốc
};
const CARS = ['sedan', 'sedan-sports', 'suv', 'suv-luxury', 'hatchback-sports', 'taxi', 'van', 'delivery'];
const CAST = {
  staff: { m: ['male-a', 'male-b'], f: ['female-b', 'female-c', 'female-e', 'female-f'] },
  formal: { m: ['male-d'], f: ['female-d'] },   // trưởng phòng và CEO
};
const IDLE_SPOTS = [[-0.9, 0.3], [0.9, 0.5], [0, 1.2], [-0.8, 1.6], [0.9, 1.7], [0.1, -0.1], [-1.6, 0.9], [1.7, 1.1]];
const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function hash(str, n) {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % n;
}

export class View3D {
  // Nạp mô hình xong mới dựng cảnh. Lỗi nạp hoặc không có WebGL thì ném ra để app.js chuyển sang bản 2D.
  static async create(container, roster) {
    const loader = new GLTFLoader();
    const cast = Object.keys(LOOKS);
    const [people, furniture, cars] = await Promise.all([
      Promise.all(cast.map((name) => loader.loadAsync(`assets/people/${name}.glb`))),
      Promise.all(FURNITURE.map((name) => loader.loadAsync(`assets/office/${name}.glb`))),
      Promise.all(CARS.map((name) => loader.loadAsync(`assets/cars/${name}.glb`))),
    ]);
    return new View3D(container, roster, {
      people: Object.fromEntries(cast.map((name, i) => [name, people[i]])),
      models: Object.fromEntries([...FURNITURE.map((name, i) => [name, furniture[i].scene]), ...CARS.map((name, i) => [name, cars[i].scene])]),
    });
  }

  constructor(container, roster, assets) {
    this.roster = roster;
    this.assets = assets;
    const b = roster.brand || {};
    this.brand = {
      name: b.name || 'T-outbox', logoText: b.logoText || '',
      primary: (b.colors && b.colors.primary) || '#1f3a8a',
      secondary: (b.colors && b.colors.secondary) || '#1b2238',
      accent: (b.colors && b.colors.accent) || '#ff8a1f',
      trousers: (b.uniform && b.uniform.trousers) || '#2a3042',
    };
    const g = roster.building || {};
    this.FW = g.floorWidth || 16;
    this.FD = g.floorDepth || 7;
    this.FH = g.floorHeight || 3;
    this.floors = roster.floors || [];
    this.H = this.floors.length * this.FH;
    this.actors = new Map();
    this.vacant = [];
    this.effects = [];
    this.mats = new Map();
    this.textures = new Map();
    this.npcs = [];
    this.traffic = [];
    this.parked = [];   // xe trong hầm, nhân viên mượn để ra ngoài
    this.rooms = [];    // phòng họp có thể đặt
    this.pending = [];  // các lần giao việc đang chờ gom thành cuộc họp
    this.peds = [];     // người đi đường
    this.drives = [];   // các chuyến xe đang chạy
    this.center = new THREE.Vector3(this.FW / 2, (this.H - this.FH) / 2 + 0.6, this.FD / 2 + 1.5);
    this.userMoved = false;
    this.fitDist = 40;

    this.el = document.createElement('div');
    this.el.className = 'stage3d';
    this.labels = document.createElement('div');
    this.labels.className = 'labels3d';
    container.appendChild(this.el);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.el.append(this.renderer.domElement, this.labels);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.6;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(30, 1.4, 0.5, 220);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, minDistance: 3, maxDistance: 110,
      maxPolarAngle: Math.PI * 0.5, minPolarAngle: 0.2,
    });
    this.controls.target.copy(this.center);
    this.controls.addEventListener('start', () => { this.userMoved = true; this.goal = null; });

    this.buildLights();
    this.buildSite();
    this.floors.forEach((f, i) => this.buildFloor(i, f));
    this.buildBasement();
    this.buildRoof();
    this.buildElevator();
    this.buildStairs();
    this.buildPeopleOfTheHouse();

    this.clock = new THREE.Clock();
    this.resize();
    this.resetCamera();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  // ---- Dựng hình cơ bản ---------------------------------------------------------
  mat(color, opts) {
    const key = color + (opts ? JSON.stringify(opts) : '');
    if (!this.mats.has(key)) this.mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
    return this.mats.get(key);
  }

  box(w, h, d, color, x, y, z, parent = this.scene, opts) {
    const o = opts || {};
    const material = o.material || this.mat(color, o.mat);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = !(o.transparent || o.noShadow);
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Đặt một món nội thất, canh tâm theo mặt bằng và đặt đáy xuống sàn. tint = { tênVậtLiệu: màu }.
  prop(name, x, y, z, { ry = 0, scale = KS, length, tint, parent = this.scene } = {}) {
    const src = this.assets.models[name];
    if (!src.userData.fit) {
      const bb = new THREE.Box3().setFromObject(src);
      src.userData.fit = { cx: (bb.min.x + bb.max.x) / 2, cz: (bb.min.z + bb.max.z) / 2, y: bb.min.y, len: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) };
    }
    const fit = src.userData.fit;
    const colors = { wood: '#dcb98f', woodDark: '#b98c60', ...tint }; // gỗ ấm hơn màu gốc của bộ mô hình
    const inner = src.clone(true);
    inner.position.set(-fit.cx, -fit.y, -fit.cz);
    inner.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      {
        const swap = (mt) => (colors[mt.name] ? this.mat(colors[mt.name], { roughness: mt.roughness }) : mt);
        m.material = Array.isArray(m.material) ? m.material.map(swap) : swap(m.material);
      }
    });
    const o = new THREE.Group();
    o.add(inner);
    o.position.set(x, y, z);
    o.rotation.y = ry;
    o.scale.setScalar(length ? length / fit.len : scale); // length: phóng theo chiều dài mong muốn (dùng cho xe)
    parent.add(o);
    return o;
  }

  // Chiều cao một món nội thất sau khi phóng, để đặt đồ lên mặt bàn, mặt quầy.
  topOf(name, scale = KS) {
    const src = this.assets.models[name];
    if (!src.userData.h) src.userData.h = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3()).y;
    return src.userData.h * scale;
  }

  text(str, { w, h, color = '#3a3226' }) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = Math.round(1024 * h / w);
    const g = c.getContext('2d');
    let size = c.height * 0.66;
    do { g.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`; size -= 2; }
    while (g.measureText(str).width > c.width - 24 && size > 10);
    g.fillStyle = color;
    g.textBaseline = 'middle';
    g.fillText(str, 12, c.height / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  }

  // Biển tên công ty: logo chữ trên nền màu chính, bên cạnh là tên.
  brandSign(x, y, z, width) {
    const { brand } = this;
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 1024, 256);
    g.fillStyle = brand.primary;
    g.beginPath(); g.roundRect(28, 28, 200, 200, 44); g.fill();
    g.fillStyle = brand.accent;
    g.beginPath(); g.arc(196, 60, 22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '800 132px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    g.fillText(brand.logoText.slice(0, 2), 128, 136);
    g.fillStyle = brand.secondary;
    g.textAlign = 'left';
    let size = 112;
    do { g.font = `800 ${size}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`; size -= 6; }
    while (g.measureText(brand.name).width > 730 && size > 40);
    g.fillText(brand.name, 262, 136);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const h = width / 4;
    this.box(width + 0.12, h + 0.12, 0.06, brand.secondary, x, y, z - 0.035);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.set(x, y, z);
    this.scene.add(m);
  }

  buildLights() {
    this.hemi = new THREE.HemisphereLight('#fff6e6', '#b7a688', 0.85);
    this.sun = new THREE.DirectionalLight('#ffe9c9', 2.4);
    const sun = this.sun, R = Math.max(this.H, this.FW) * 0.75 + 4;
    sun.position.set(this.FW / 2 + 14, this.H + 16, this.FD / 2 + 22);
    sun.target.position.set(this.FW / 2, this.H / 2, this.FD / 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 120 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 4;
    this.scene.add(this.hemi, sun, sun.target);
    this.lamps = [];
    this.glass = new THREE.MeshStandardMaterial({ color: '#a8d4ee', transparent: true, opacity: 0.34, roughness: 0.08, metalness: 0.1 });
  }

  setNight(on) {
    this.hemi.intensity = on ? 0.14 : 0.85;
    this.sun.intensity = on ? 0.25 : 2.4;
    this.sun.color.set(on ? '#8fa6ff' : '#ffe9c9');
    this.scene.environmentIntensity = on ? 0.1 : 0.6;
    for (const lamp of this.lamps) lamp.intensity = on ? 9 : 0;
    this.glass.color.set(on ? '#1d2a55' : '#a8d4ee');
    this.glass.opacity = on ? 0.6 : 0.34;
    if (this.skyline) this.skyline.color.set(on ? '#1b2444' : '#c9d6e4');
    this.el.classList.toggle('night', on);
  }

  // ---- Khuôn viên, tầng, mái ----------------------------------------------------------
  tree(x, z, s = 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.16 * s, 1.1 * s, 8), this.mat('#8a6a4a'));
    trunk.position.set(x, 0.55 * s - 0.3, z);
    trunk.castShadow = true;
    this.scene.add(trunk);
    for (const [dy, r] of [[1.4, 0.85], [2.1, 0.62], [2.7, 0.4]]) {
      const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 1), this.mat('#57a866', { flatShading: true }));
      leaf.position.set(x, dy * s - 0.3, z);
      leaf.castShadow = true;
      this.scene.add(leaf);
    }
  }

  flag(x, z, color) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 4.4, 8), this.mat('#c9ced3', { metalness: 0.6, roughness: 0.3 }));
    pole.position.set(x, 2.2, z);
    pole.castShadow = true;
    this.scene.add(pole);
    this.box(1.0, 0.6, 0.02, color, x + 0.54, 4.0, z);
  }

  // Khuôn viên: quảng trường ngang tầng trệt, sân trũng trước hầm xe, cầu dẫn vào sảnh, ram dốc, đường phố.
  buildSite() {
    const { FW, FD, FH, brand } = this;
    const yB = -FH;                       // cao độ sàn hầm
    const zCourt = FD + 6.3;              // mép ngoài sân trũng
    const zStreet = FD + 12.6;            // mép đường
    const rx0 = FW - 4.7, rx1 = FW - 0.5; // ram dốc nằm giữa hai mốc này
    const ground = (x0, x1, z0, z1) => this.box(x1 - x0, FH + 0.48, z1 - z0, '#d9d2c4', (x0 + x1) / 2, (yB - 0.5 - 0.02) / 2, (z0 + z1) / 2);
    ground(-11, -0.47, -7, zStreet);
    ground(FW + 0.47, FW + 11, -7, zStreet);
    ground(-0.47, FW + 0.47, -7, -0.25);
    ground(-0.47, rx0, zCourt, zStreet);
    ground(rx1, FW + 0.47, zCourt, zStreet);
    // Sân trũng trước hầm và ram dốc từ đường xuống.
    this.box(FW + 0.94, 0.3, zCourt - FD - 0.2, '#63666d', FW / 2, yB - 0.15, (FD + 0.2 + zCourt) / 2);
    const dz = zStreet - zCourt, dy = FH - 0.02;
    const ramp = this.box(rx1 - rx0, 0.22, Math.hypot(dz, dy), '#6e7178', (rx0 + rx1) / 2, yB + dy / 2 - 0.11, (zCourt + zStreet) / 2);
    ramp.rotation.x = -Math.atan2(dy, dz);
    for (let i = 0; i < 5; i++) { // vạch mũi tên trên ram
      const k = (i + 0.5) / 5;
      const stripe = this.box(0.9, 0.02, 0.28, '#f2c14e', (rx0 + rx1) / 2, yB + dy * k + 0.03, zCourt + dz * k, this.scene, { noShadow: true });
      stripe.rotation.x = ramp.rotation.x;
    }
    // Cầu dẫn từ quảng trường vào sảnh, trải thảm màu thương hiệu.
    this.box(3.6, 0.3, zCourt - FD - 0.2, '#ebe5d8', FW / 2, -0.17, (FD + 0.2 + zCourt) / 2);
    this.box(2.6, 0.02, zCourt - FD + 3.2, brand.primary, FW / 2, -0.005, (FD + zCourt + 3.4) / 2, this.scene, { noShadow: true });
    for (const dx of [-1.77, 1.77]) this.box(0.05, 0.55, zCourt - FD - 0.2, null, FW / 2 + dx, 0.26, (FD + 0.2 + zCourt) / 2, this.scene, { material: this.glass, transparent: true });
    for (const z of [FD + 2.2, FD + 4.6]) this.box(0.4, FH - 0.3, 0.4, '#f7f4ee', FW / 2, yB + (FH - 0.3) / 2, z);
    // Chốt bảo vệ và barie ở chân ram.
    const bx = rx0 - 0.9, bz = zCourt - 0.9;
    this.box(1.2, 1.5, 1.2, '#f4f1ea', bx, yB + 0.75, bz);
    this.box(1.24, 0.6, 0.9, null, bx, yB + 1.1, bz + 0.2, this.scene, { material: this.glass, transparent: true });
    this.box(1.5, 0.12, 1.5, brand.primary, bx, yB + 1.56, bz);
    this.box(0.16, 1.0, 0.16, '#f2c14e', rx0 + 0.15, yB + 0.5, zCourt - 0.5);
    this.barrier = new THREE.Group(); // cần barie xoay quanh trụ, tự nâng khi có xe tới
    this.barrier.position.set(rx0 + 0.15, yB + 0.95, zCourt - 0.5);
    this.scene.add(this.barrier);
    for (let i = 0; i < 6; i++) this.box(0.6, 0.09, 0.09, i % 2 ? '#ffffff' : '#e0352b', 0.35 + i * 0.6, 0, 0, this.barrier, { noShadow: true });
    this.gate = { x: (rx0 + rx1) / 2, zCourt, zStreet, nearZ: zStreet + LANES.n1.dz, mid: FW / 2, span: FW / 2 + 16, barrierZ: zCourt - 0.5, cwX: FW / 2 };
    // Vạch dừng ở đầu ram: xe ra phải dừng nhường đường trước khi rẽ vào làn.
    this.box(rx1 - rx0 - 0.3, 0.012, 0.16, '#f3f0e6', (rx0 + rx1) / 2, 0.002, zStreet - 0.12, this.scene, { noShadow: true });
    // Đường phố trước trụ sở: bốn làn, hai làn mỗi chiều, vạch đôi vàng ở giữa.
    const road = (w, h, d, color, x, y, z) => this.box(w, h, d, color, x, y, z, this.scene, { noShadow: true });
    this.box(FW + 22, 0.1, ROAD_W, '#4e5157', FW / 2, -0.07, zStreet + ROAD_W / 2);
    for (const dz of [ROAD_W / 2 - 0.09, ROAD_W / 2 + 0.09]) road(FW + 22, 0.012, 0.07, '#f2c14e', FW / 2, -0.014, zStreet + dz);
    for (const dz of [2.1, 6.3]) for (let x = -10; x < FW + 11; x += 2.4) {
      if (Math.abs(x + 0.6 - this.gate.cwX) > 2.2) road(1.2, 0.012, 0.08, '#f3f0e6', x + 0.6, -0.014, zStreet + dz);
    }
    this.box(FW + 22, 0.24, 1.6, '#d9d2c4', FW / 2, -0.14, zStreet + ROAD_W + 0.8);
    // Vạch qua đường cho người đi bộ, vạch dừng hai phía.
    const cw = this.gate.cwX;
    for (let k = 0; k < 9; k++) road(2.2, 0.012, 0.45, '#f3f0e6', cw, -0.013, zStreet + 0.45 + k * 0.94);
    road(0.14, 0.012, ROAD_W / 2, '#f3f0e6', cw + 1.6, -0.013, zStreet + ROAD_W / 4);
    road(0.14, 0.012, ROAD_W / 2, '#f3f0e6', cw - 1.6, -0.013, zStreet + ROAD_W * 3 / 4);
    this.buildSignals();
    // Xe chạy bên phải đường. Mỗi làn vài xe, xe tải chạy chậm hơn nên hay bị vượt.
    const fleet = [['n1', 'sedan', 4], ['n1', 'van', 22], ['n2', 'taxi', 12], ['f1', 'suv', -6], ['f1', 'delivery', 10], ['f2', 'hatchback-sports', 2]];
    for (const [lane, model, x] of fleet) {
      const L = LANES[lane], slow = model === 'van' || model === 'delivery';
      const car = this.prop(model, x, -0.02, zStreet + L.dz, { length: 3.4, ry: L.dir * Math.PI / 2 });
      this.traffic.push({ car, lane, dir: L.dir, v: 0, vmax: slow ? 2.6 + Math.random() * 0.5 : 3.8 + Math.random() * 1.4, change: null, cool: 2 + Math.random() * 3 });
    }
    // Cây, cột cờ.
    for (const x of [-4.5, -2.2, FW + 2.2, FW + 4.5]) for (const z of [FD + 2.5, FD + 8]) this.tree(x, z, 1 + hash(x + ':' + z, 4) * 0.12);
    for (const x of [1.8, 9.8]) this.tree(x, zCourt + 5.2, 0.9);
    this.hydrant(FW + 2.4, zStreet - 0.7);
    this.hydrant(-2.4, zStreet - 0.7);
    this.board('ĐIỂM TẬP KẾT', -5.6, zCourt + 4.2, '#1fa35b');
    [brand.primary, brand.accent, '#ffffff'].forEach((c, i) => this.flag(0.5 + i * 1.3, zCourt + 0.9, c));
    // Vài khối nhà xa phía sau cho cảm giác khu trung tâm.
    this.skyline = new THREE.MeshBasicMaterial({ color: '#c9d6e4' });
    [[-9, -12, 6, 16], [-2, -16, 7, 27], [7, -14, 6, 20], [15, -17, 8, 31], [24, -12, 6, 14]].forEach(([x, z, w, h]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), this.skyline);
      m.position.set(x, h / 2 - 0.3, z);
      this.scene.add(m);
    });
  }

  // Hầm B1: bãi đỗ xe có vạch ô, cột, đèn, biển chỉ dẫn.
  buildBasement() {
    const { FW, FD, FH, brand } = this;
    const y = -FH, wallH = FH - 0.3;
    this.box(FW + 0.7, 0.3, FD + 0.5, '#8d8f94', FW / 2, y - 0.15, FD / 2 - 0.05);
    this.box(FW - 0.1, 0.02, FD - 0.2, '#63666d', FW / 2, y + 0.01, FD / 2, this.scene, { noShadow: true });
    this.box(FW, wallH, 0.2, '#b9b6ae', FW / 2, y + wallH / 2, -0.1);
    this.box(0.2, wallH, FD, '#b9b6ae', FW + 0.1, y + wallH / 2, FD / 2);
    this.box(0.24, wallH, FD + 0.2, '#c6c2b8', -0.12, y + wallH / 2, FD / 2);
    this.box(FW, 0.5, 0.03, '#f2c14e', FW / 2, y + 0.9, 0.012, this.scene, { noShadow: true }); // dải sơn vàng quanh tường
    // Cửa thang máy xuống hầm.
    this.box(0.05, 1.7, 1.5, '#8f9aa3', 0.02, y + 0.85, 5.2, this.scene, { mat: { roughness: 0.3, metalness: 0.7 } });
    this.box(0.06, 1.7, 0.03, '#59636b', 0.03, y + 0.85, 5.2);
    // Ô đỗ xe sát tường sau, xe quay đầu ra lối chạy.
    const cars = ['suv-luxury', 'sedan', 'hatchback-sports', null, 'van', 'sedan-sports', 'suv'];
    const step = (FW - 1.6) / cars.length;
    for (let i = 0; i <= cars.length; i++) this.box(0.07, 0.012, 3.6, '#f3f0e6', 0.9 + i * step, y + 0.025, 2.1, this.scene, { noShadow: true });
    cars.forEach((model, i) => {
      const x = 0.9 + (i + 0.5) * step;
      if (model) { const car = this.prop(model, x, y + 0.02, 2.0, { length: 3.3 }); this.parked.push({ car, x, bay: car.position.clone(), busy: false }); }
      this.box(1.2, 0.012, 0.07, '#f3f0e6', x, y + 0.025, 3.9, this.scene, { noShadow: true });
    });
    const ceo = this.text('CEO', { w: 1.2, h: 0.4, color: '#f2c14e' });
    ceo.rotation.x = -Math.PI / 2;
    ceo.position.set(0.9 + 0.5 * step, y + 0.03, 4.3);
    this.scene.add(ceo);
    // Cột có sơn cảnh báo, đèn trần, biển chỉ dẫn.
    for (const x of [FW * 0.3, FW * 0.62]) {
      this.box(0.4, wallH, 0.4, '#d6d3cb', x, y + wallH / 2, 4.6);
      this.box(0.42, 0.5, 0.42, '#f2c14e', x, y + 0.25, 4.6);
      this.box(0.43, 0.1, 0.43, '#2a2a30', x, y + 0.3, 4.6);
    }
    for (const x of [FW * 0.2, FW * 0.5, FW * 0.8]) {
      this.box(2.2, 0.05, 0.16, null, x, y + wallH - 0.04, 3.2, this.scene, { material: new THREE.MeshBasicMaterial({ color: '#fff6dc', toneMapped: false }), noShadow: true });
    }
    this.box(FW - 0.8, 0.06, 0.06, '#c92a22', FW / 2, y + wallH - 0.12, 4.9, this.scene, { noShadow: true }); // ống chữa cháy
    for (let x = 1.6; x < FW - 0.6; x += 2.6) this.cyl(0.05, 0.06, '#c9ced3', x, y + wallH - 0.18, 4.9, { metalness: 0.7, roughness: 0.3 });
    for (const x of [FW * 0.3, FW * 0.62]) this.extinguisher(x + 0.3, y, 4.6);
    this.box(0.07, 0.72, 0.56, '#d62a22', 0.04, y + 0.95, 3.9, this.scene, { mat: { roughness: 0.4 } });
    this.exitSign(FW - 1.1, y + wallH - 0.34, FD - 0.5);
    this.box(0.16, 0.12, 0.26, '#f4f1ea', FW - 0.5, y + wallH - 0.2, 0.3);
    this.box(4.4, 0.42, 0.08, '#24449c', 3.2, y + wallH - 0.36, FD - 0.1);
    const sign = this.text('B1  ·  HẦM ĐỖ XE', { w: 4.0, h: 0.26, color: '#ffffff' });
    sign.position.set(3.2, y + wallH - 0.36, FD - 0.055);
    this.scene.add(sign);
    this.box(0.7, 0.7, 0.06, '#24449c', FW - 1.2, y + 1.7, 0.04);
    const pSign = this.text('P', { w: 0.5, h: 0.5, color: '#ffffff' });
    pSign.position.set(FW - 1.2 + 0.06, y + 1.7, 0.08);
    this.scene.add(pSign);
    const lamp = new THREE.PointLight('#fff1d0', 0, 18, 1.1);
    lamp.position.set(FW / 2, y + wallH - 0.4, FD / 2 + 1);
    this.scene.add(lamp);
    this.lamps.push(lamp);
  }

  // Người của tòa nhà (không phải subagent): lễ tân sau quầy, bảo vệ ở sảnh và ở chốt hầm xe.
  buildPeopleOfTheHouse() {
    const { FW, FD, FH } = this;
    const lobby = Math.max(0, this.floors.findIndex((f) => f.kind === 'lobby')) * FH;
    const add = (def, name, x, y, z, heading, gestures) => {
      const body = this.buildCharacter(def);
      body.g.position.set(x, y, z);
      body.g.rotation.y = heading;
      body.mixer.setTime(Math.random() * 3);
      const label = this.label('name3', esc(name));
      this.npcs.push({ body, heading, gestures, next: 3 + Math.random() * 8, until: 0, label, pos: new THREE.Vector3(x, y, z + 0.12), phase: Math.random() * 6 });
    };
    add({ id: 'receptionist', model: 'female-b', gender: 'f', slot: 0, color: this.brand.accent, hair: '#3d2b22', skin: '#f2c8a2' }, 'Lễ tân', 6.2, lobby, 1.75, 0, ['interact-right', 'emote-yes']);
    add({ id: 'guard-lobby', model: 'male-c', slot: 0, color: '#24449c' }, 'Bảo vệ', 1.9, lobby, 4.0, 0.9, ['emote-yes']);
    const canteen = this.floors.findIndex((f) => f.kind === 'canteen');
    if (canteen >= 0) add({ id: 'chef', model: 'female-e', raw: true, slot: 0, color: '#ffffff' }, 'Bếp', 6.9, canteen * FH, 0.6, 0, ['interact-right', 'emote-yes']);
    add({ id: 'guard-parking', model: 'male-c', slot: 0, color: '#24449c' }, 'Bảo vệ', FW - 6.9, -FH, FD + 5.2, 0.5, ['interact-right']);
    // Người đi đường: đi vỉa hè, chờ đèn rồi qua đường ở vạch, có người vào sảnh làm khách.
    ['female-c', 'male-b', 'female-f', 'male-a', 'female-b'].forEach((model, k) => {
      const body = this.buildCharacter({ id: 'ped-' + k, model, raw: true, slot: k, color: '#888888' });
      body.mixer.setTime(Math.random() * 3);
      // lane: lệch thêm về bên phải riêng của mỗi người (không lấn sang lối người đi ngược chiều), để không đi trùng nhau.
      const ped = { body, route: [], i: 0, x: 0, z: 0, heading: 0, dodge: 0, lane: (k % 3) * 0.16, right: { x: 1, z: 0 }, wait: 1 + k * 3.5, phase: Math.random() * 6 };
      body.g.visible = false;
      this.peds.push(ped);
    });
  }

  // Các tuyến đi bộ: ped.route là danh sách điểm; điểm có curb: true là mép đường, phải chờ đèn cho người đi bộ.
  pedRoute(k) {
    // Đi bên phải: trên vỉa hè người đi về phía -x đi sát mép trong, người đi về phía +x đi sát mép ngoài;
    // qua đường thì người đi về phía trụ sở đi bên phải vạch (x lớn), người đi ra đi bên trái (x nhỏ).
    const g = this.gate, zs = g.zStreet, cw = g.cwX, far0 = -14, far1 = this.FW + 14;
    const nearW = zs - 1.05, nearE = zs - 0.45, farW = zs + ROAD_W + 0.5, farE = zs + ROAD_W + 1.1;
    const inX = cw + 0.45, outX = cw - 0.45, curbN = zs - 0.3, curbF = zs + ROAD_W + 0.25;
    const routes = [
      [{ x: far1, z: farW }, { x: inX, z: farW }, { x: inX, z: curbF, curb: true }, { x: inX, z: curbN }, { x: inX, z: nearW }, { x: far0, z: nearW }],
      [{ x: far0, z: nearE }, { x: outX, z: nearE }, { x: outX, z: curbN, curb: true }, { x: outX, z: curbF }, { x: outX, z: farE }, { x: far1, z: farE }],
      [{ x: far0, z: farE }, { x: inX, z: farE }, { x: inX, z: curbF, curb: true }, { x: inX, z: curbN }, { x: inX, z: this.FD + 0.5, enter: true }],
      [{ x: outX, z: this.FD + 0.5 }, { x: outX, z: curbN, curb: true }, { x: outX, z: curbF }, { x: outX, z: farW }, { x: far0, z: farW }],
      [{ x: far1, z: farW }, { x: far0, z: farW }],
    ];
    return routes[(k + Math.floor(Math.random() * 5)) % routes.length];
  }

  updatePeds(dt, time) {
    for (const ped of this.peds) {
      const b = ped.body;
      if (!ped.route.length) { // chờ xuất hiện rồi nhận một tuyến mới
        ped.wait -= dt;
        if (ped.wait > 0) continue;
        const route = this.pedRoute(this.peds.indexOf(ped));
        if (this.peds.some((o) => o !== ped && o.body.g.visible && Math.hypot(o.x - route[0].x, o.z - route[0].z) < 1.5)) { ped.wait = 1; continue; } // đầu tuyến đang có người: chờ chút
        ped.route = route;
        ped.i = 1; ped.x = ped.route[0].x; ped.z = ped.route[0].z; b.g.visible = true;
      }
      const t = ped.route[ped.i];
      let anim = 'walk', speed = PED_SPEED;
      const prev = ped.route[ped.i - 1];
      if (prev && prev.curb && !ped.crossing) { // đứng ở mép đường chờ đèn đi bộ xanh và còn đủ thời gian để qua
        if (!this.canCross()) {
          anim = 'idle'; speed = 0;
          // Xếp hàng chờ: người đến trước đứng sát mép, người đến sau lùi dần về phía vỉa hè.
          if (ped.waitSince === undefined) ped.waitSince = time;
          const queue = this.peds.filter((o) => o.body.g.visible && o.route[o.i - 1] && o.route[o.i - 1].curb && !o.crossing
            && Math.abs(o.route[o.i - 1].x - prev.x) < 0.01 && Math.abs(o.route[o.i - 1].z - prev.z) < 0.01).sort((a, c) => a.waitSince - c.waitSince);
          const slot = queue.indexOf(ped), fx = t.x - prev.x, fz = t.z - prev.z, fl = Math.hypot(fx, fz) || 1;
          const qx = prev.x - fx / fl * 0.55 * slot, qz = prev.z - fz / fl * 0.55 * slot, qd = Math.hypot(qx - ped.x, qz - ped.z);
          if (qd > 0.02) { const mv = Math.min(qd, PED_SPEED * dt); ped.x += (qx - ped.x) / qd * mv; ped.z += (qz - ped.z) / qd * mv; anim = 'walk'; }
          ped.heading = Math.atan2(fx, fz);
        } else { ped.crossing = true; ped.waitSince = undefined; }
      }
      if (speed > 0) {
        speed *= this.yieldFactor(ped, ped.x + ped.right.x * ped.lane, ped.z + ped.right.z * ped.lane, 0);
        const dx = t.x - ped.x, dz = t.z - ped.z, d = Math.hypot(dx, dz), step = speed * dt;
        if (d > 0.01) { ped.heading = Math.atan2(dx, dz); ped.right = { x: -dz / d, z: dx / d }; }
        if (d <= step) {
          ped.x = t.x; ped.z = t.z; ped.i++; ped.crossing = false;
          if (ped.i >= ped.route.length) { ped.route = []; b.g.visible = false; ped.wait = 3 + Math.random() * 8; continue; }
        } else { ped.x += dx / d * step; ped.z += dz / d * step; }
      }
      ped.moving = speed > 0;
      ped.dodge += ((ped.dodgeWant || 0) - ped.dodge) * Math.min(1, dt * 8);
      const off = ped.lane + ped.dodge;
      b.g.position.set(ped.x + ped.right.x * off, 0, ped.z + ped.right.z * off);
      let dh = ped.heading - b.g.rotation.y;
      dh = Math.atan2(Math.sin(dh), Math.cos(dh));
      b.g.rotation.y += dh * Math.min(1, dt * 9);
      this.play({ body: b }, anim);
      b.mixer.update(dt);
    }
  }

  // ---- Đèn giao thông -------------------------------------------------------------------
  buildSignals() {
    const g = this.gate, zs = g.zStreet, cw = g.cwX;
    const lamp = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
    this.signalHeads = [];
    // Mỗi hướng xe một cột đèn đặt bên phải, trước vạch qua đường; mỗi đầu vạch có đèn cho người đi bộ.
    for (const [x, z, ry] of [[cw + 2.0, zs - 0.45, -Math.PI / 2], [cw - 2.0, zs + ROAD_W + 0.45, Math.PI / 2]]) {
      this.cyl(0.06, 2.6, '#3a3f47', x, 1.3, z, { metalness: 0.5, roughness: 0.4 });
      const head = new THREE.Group();
      head.position.set(x, 2.35, z);
      head.rotation.y = ry;
      this.scene.add(head);
      this.box(0.3, 0.85, 0.24, '#2a2d33', 0, 0, 0, head);
      const set = { red: lamp('#3a1414'), yellow: lamp('#3a3014'), green: lamp('#123a1c') };
      [['red', 0.27], ['yellow', 0], ['green', -0.27]].forEach(([k, dy]) => {
        const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), set[k]);
        bulb.position.set(0, dy, 0.125);
        head.add(bulb);
      });
      this.signalHeads.push(set);
    }
    this.walkLights = [];
    for (const [x, z, ry] of [[cw - 1.35, zs - 0.45, 0], [cw + 1.35, zs + ROAD_W + 0.45, Math.PI]]) {
      this.cyl(0.04, 1.7, '#3a3f47', x, 0.85, z, { metalness: 0.5, roughness: 0.4 });
      const m = lamp('#7a1a1a');
      const box = this.box(0.22, 0.3, 0.06, null, x, 1.75, z, this.scene, { material: m, noShadow: true });
      box.rotation.y = ry;
      this.walkLights.push(m);
    }
    this.signal = { phase: 'green', t: SIGNAL.green };
    this.paintSignals();
  }

  paintSignals() {
    const on = { red: '#ff3b30', yellow: '#ffc21a', green: '#2fd35c' }, off = { red: '#3a1414', yellow: '#3a3014', green: '#123a1c' };
    for (const set of this.signalHeads) for (const k of ['red', 'yellow', 'green']) set[k].color.set(this.signal.phase === k ? on[k] : off[k]);
    for (const m of this.walkLights) m.color.set(this.signal.phase === 'red' ? '#2fd35c' : '#d93025');
  }

  updateSignal(dt) {
    const S = this.signal;
    if (!S) return;
    S.t -= dt;
    if (S.t > 0) return;
    S.phase = S.phase === 'green' ? 'yellow' : S.phase === 'yellow' ? 'red' : 'green';
    S.t = SIGNAL[S.phase];
    this.paintSignals();
  }

  // Người đi bộ chỉ bắt đầu qua đường khi đèn xe đỏ và còn đủ thời gian đi hết vạch.
  canCross() {
    const S = this.signal;
    return S && S.phase === 'red' && SIGNAL.red - S.t > SIGNAL.clear && S.t > ROAD_W / PED_SPEED + 1;
  }

  // Khoảng còn lại tới vạch dừng nếu xe phải dừng đèn (đèn đỏ, hoặc đèn vàng mà còn đủ xa để phanh); không phải dừng thì Infinity.
  signalGap(dir, x) {
    const S = this.signal;
    if (!S || S.phase === 'green') return Infinity;
    const stopX = this.gate.cwX - dir * (1.6 + 1.8); // tâm xe dừng sau vạch dừng nửa thân xe
    const d = (stopX - x) * dir;
    if (d < -0.2) return Infinity;            // đã qua vạch dừng
    if (S.phase === 'yellow' && d < 2.2) return Infinity; // đèn vàng mà đã sát vạch thì đi tiếp
    return Math.max(0, d);
  }

  // ---- Phòng cháy chữa cháy ---------------------------------------------------------
  cyl(r, h, color, x, y, z, opts) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), this.mat(color, opts));
    m.position.set(x, y, z);
    m.castShadow = true;
    this.scene.add(m);
    return m;
  }

  extinguisher(x, y, z) {
    this.cyl(0.075, 0.36, '#d62a22', x, y + 0.18, z, { roughness: 0.4 });
    this.cyl(0.03, 0.08, '#2a2a30', x, y + 0.4, z);
    this.box(0.1, 0.03, 0.03, '#2a2a30', x + 0.05, y + 0.43, z);
  }

  hydrant(x, z) {
    this.cyl(0.13, 0.6, '#d62a22', x, 0.3, z, { roughness: 0.4 });
    this.cyl(0.17, 0.07, '#b71f19', x, 0.63, z);
    this.box(0.5, 0.11, 0.11, '#b71f19', x, 0.4, z);
  }

  board(textStr, x, z, color) {
    this.cyl(0.035, 2.0, '#c9ced3', x, 1.0, z, { metalness: 0.6, roughness: 0.3 });
    this.box(2.3, 0.6, 0.05, color, x, 2.1, z);
    const t = this.text(textStr, { w: 2.1, h: 0.36, color: '#ffffff' });
    t.position.set(x, 2.1, z + 0.03);
    this.scene.add(t);
  }

  exitSign(x, y, z) {
    this.box(0.78, 0.26, 0.05, null, x, y, z, this.scene, { material: new THREE.MeshBasicMaterial({ color: '#1fa35b', toneMapped: false }), noShadow: true });
    const t = this.text('EXIT', { w: 0.62, h: 0.2, color: '#ffffff' });
    t.position.set(x + 0.06, y, z + 0.03);
    this.scene.add(t);
  }

  // Bộ PCCC của một tầng: tủ vòi và bình chữa cháy cạnh thang máy, chuông báo, đường ống sprinkler, biển thoát hiểm.
  fireKit(y, wallH) {
    const { FW, FD } = this;
    this.box(0.07, 0.72, 0.56, '#d62a22', 0.04, y + 0.95, 3.75, this.scene, { mat: { roughness: 0.4 } });
    this.box(0.02, 0.2, 0.36, '#ffffff', 0.08, y + 1.08, 3.75, this.scene, { noShadow: true });
    this.extinguisher(0.2, y, 4.2);
    this.extinguisher(0.2, y, 4.42);
    const bell = this.cyl(0.1, 0.05, '#d62a22', 0.05, y + 1.95, 3.75);
    bell.rotation.z = Math.PI / 2;
    this.box(FW - 0.8, 0.05, 0.05, '#c92a22', FW / 2, y + wallH - 0.1, FD * 0.52, this.scene, { noShadow: true });
    for (let x = 1.6; x < FW - 0.6; x += 2.6) this.cyl(0.05, 0.06, '#c9ced3', x, y + wallH - 0.15, FD * 0.52, { metalness: 0.7, roughness: 0.3 });
    this.exitSign(FW - 1.1, y + wallH - 0.34, FD - 0.5);
  }

  // ---- Hai thang máy kính trước mặt tiền, bên trái: đón trả người thật giữa các tầng, kể cả hầm B1 ----
  buildElevator() {
    const { FD, FH, H, brand } = this;
    const cz = FD + 0.95, w = 1.36, y0 = -FH, tall = H + FH + 0.5;
    const steel = '#8f9aa3';
    this.lifts = [];
    this.calls = [];
    for (const cx of LIFT_X) {
      for (const dx of [-w / 2, w / 2]) for (const dz of [-w / 2, w / 2]) this.box(0.09, tall, 0.09, steel, cx + dx, y0 + tall / 2, cz + dz, this.scene, { mat: { metalness: 0.6, roughness: 0.35 } });
      for (let i = -1; i <= this.floors.length; i++) {
        const y = i * FH - 0.15;
        this.box(w + 0.09, 0.07, 0.07, steel, cx, y, cz + w / 2);
        this.box(0.07, 0.07, w + 0.09, steel, cx - w / 2, y, cz);
        this.box(0.07, 0.07, w + 0.09, steel, cx + w / 2, y, cz);
      }
      this.box(w, tall - 0.3, 0.03, null, cx, y0 + (tall - 0.3) / 2, cz + w / 2, this.scene, { material: this.glass, transparent: true });
      for (const dx of [-w / 2, w / 2]) this.box(0.03, tall - 0.3, w, null, cx + dx, y0 + (tall - 0.3) / 2, cz, this.scene, { material: this.glass, transparent: true });
      this.box(w + 0.3, 0.5, w + 0.3, '#d7d2c7', cx, H + 0.75, cz);                 // buồng máy trên mái
      this.box(w + 0.34, 0.08, w + 0.34, brand.primary, cx, H + 1.04, cz);
      // Cabin: sàn, trần có đèn, viền màu thương hiệu, tay vịn.
      const cabin = new THREE.Group();
      this.box(w - 0.2, 0.08, w - 0.2, '#59636b', 0, 0.04, 0, cabin);
      this.box(w - 0.2, 0.08, w - 0.2, '#e9edf0', 0, 2.3, 0, cabin);
      this.box(w - 0.5, 0.03, w - 0.5, null, 0, 2.25, 0, cabin, { material: new THREE.MeshBasicMaterial({ color: '#fff3d6', toneMapped: false }), noShadow: true });
      this.box(w - 0.18, 0.1, w - 0.18, brand.primary, 0, 2.39, 0, cabin);
      this.box(w - 0.3, 0.05, 0.05, '#c9ced3', 0, 1.0, w / 2 - 0.2, cabin, { mat: { metalness: 0.7, roughness: 0.3 } });
      const light = new THREE.PointLight('#ffe9c0', 0.6, 4, 1.5);
      light.position.set(0, 2.0, 0);
      cabin.add(light);
      cabin.position.set(cx, 0, cz);
      this.scene.add(cabin);
      this.lifts.push({ cabin, cx, cz, y: 0, floor: 0, target: null, wait: 0, riders: [] });
    }
  }

  // Sảnh thang của mỗi tầng: điểm đứng chờ giữa hai cabin.
  liftSpot() {
    return { x: (LIFT_X[0] + LIFT_X[1]) / 2, z: this.FD - 0.2 };
  }

  rideOf(a) {
    for (const L of this.lifts) { const r = L.riders.find((k) => k.a === a); if (r) return r; }
    return null;
  }

  leaveLifts(a) {
    for (const L of this.lifts) L.riders = L.riders.filter((r) => r.a !== a);
    this.calls = this.calls.filter((c) => c.a !== a);
  }

  // Mỗi thang phục vụ theo lượt gọi chung: tới tầng có người chờ mà chưa thang nào nhận,
  // đón tối đa LIFT_SEATS người, trả ở tầng gần nhất trước.
  updateLift(L, dt) {
    const seat = () => L.riders.forEach((r, i) => {
      r.a.body.g.position.set(L.cx + (i % 2 ? 0.27 : -0.27), L.y + 0.08, L.cz + (i < 2 ? -0.22 : 0.22));
    });
    const leave = () => { // người tới tầng bước ra lần lượt, mỗi người cách nhau một nhịp, không đi trùng nhau
      L.riders = L.riders.filter((r) => {
        if (r.exitAt === undefined || r.exitAt > this.simTime) return true;
        const a = r.a;
        a.riding = false; a.floor = L.floor; a.x = L.cx; a.z = this.FD - 0.2;
        if (a.steps[0] && a.steps[0].k === 'lift') a.steps.shift();
        return false;
      });
    };
    if (L.wait > 0) { L.wait -= dt; leave(); seat(); return; }
    if (L.riders.some((r) => r.exitAt !== undefined)) { leave(); seat(); return; }
    if (L.target === null) {
      if (L.riders.length) L.target = L.riders.reduce((best, r) => (Math.abs(r.to - L.floor) < Math.abs(best - L.floor) ? r.to : best), L.riders[0].to);
      else {
        const taken = this.lifts.filter((k) => k !== L && k.target !== null && !k.riders.length).map((k) => k.target);
        const call = this.calls.find((c) => !taken.includes(c.from));
        if (!call) return;
        L.target = call.from;
      }
    }
    const ty = L.target * this.FH, d = ty - L.y, step = LIFT_SPEED * dt;
    if (Math.abs(d) <= step) {
      L.y = ty; L.floor = L.target; L.target = null;
      let k = 0;
      for (const r of L.riders) if (r.to === L.floor) r.exitAt = this.simTime + 0.25 + 0.6 * k++;
      L.wait = 0.7 + 0.6 * Math.max(0, k - 1);
      this.calls = this.calls.filter((c) => {
        if (c.from !== L.floor || L.riders.length >= LIFT_SEATS) return true;
        c.a.riding = true;
        L.riders.push(c);
        return false;
      });
    } else L.y += Math.sign(d) * step;
    L.cabin.position.y = L.y;
    seat();
  }

  // ---- Thang bộ thoát hiểm bằng thép ở hông phải ------------------------------------------
  buildStairs() {
    const { FW, FH } = this;
    const x = FW + 1.02, zA = 5.3, zB = 1.5, wide = 1.1;
    const steel = '#7d858c', tread = '#a7b0b7';
    const n = this.floors.length;
    for (let i = 0; i < n; i++) {
      const y0 = i * FH, y1 = y0 + FH;
      const from = i % 2 ? zB : zA, to = i % 2 ? zA : zB;
      const len = Math.hypot(to - from, FH), ang = Math.atan2(FH, Math.abs(to - from)) * (to > from ? -1 : 1);
      for (const dx of [-wide / 2, wide / 2]) { // cốn thang và tay vịn
        const beam = this.box(0.05, 0.16, len, steel, x + dx, (y0 + y1) / 2 - 0.04, (from + to) / 2);
        beam.rotation.x = ang;
        const rail = this.box(0.035, 0.035, len, steel, x + dx, (y0 + y1) / 2 + 0.85, (from + to) / 2);
        rail.rotation.x = ang;
      }
      for (let k = 1; k <= 9; k++) { // bậc thang
        const t = k / 10;
        this.box(wide, 0.045, 0.34, tread, x, y0 + FH * t, from + (to - from) * t);
      }
      // Chiếu nghỉ ở đầu trên của vế thang, nối vào sàn tầng.
      const lz = to + (to > from ? 0.55 : -0.55);
      this.box(wide + 0.3, 0.07, 1.1, tread, x - 0.12, y1 - 0.02, lz);
      this.box(0.035, 0.9, 1.1, steel, x + wide / 2, y1 + 0.45, lz);
      this.box(wide, 0.035, 0.035, steel, x, y1 + 0.88, lz + (to > from ? 0.55 : -0.55));
      for (const dz of [-0.5, 0.5]) this.box(0.05, y1, 0.05, steel, x + wide / 2, y1 / 2, lz + dz);
    }
    this.box(wide + 0.3, 0.07, 1.1, tread, x - 0.12, 0.02, zA + 0.55); // chiếu tới ở mặt đất
  }

  buildFloor(i, f) {
    const { FW, FD, FH, brand } = this;
    const y = i * FH;
    const dept = (this.roster.departments || []).find((d) => d.id === f.dept);
    const color = dept ? dept.color : brand.primary;
    const name = f.name || (dept ? dept.name : f.id);
    const wallH = FH - 0.3;

    // Sàn bê tông, thảm, và dầm mặt trước mang biển tầng.
    this.box(FW + 0.7, 0.3, FD + 0.5, '#e7e2d8', FW / 2, y - 0.15, FD / 2 - 0.05);
    const carpet = f.kind === 'lobby' ? '#efe9de' : f.dept === 'executive' ? '#cdb596' : mix('#f1ece2', color, 0.3);
    this.box(FW - 0.1, 0.02, FD - 0.2, carpet, FW / 2, y + 0.01, FD / 2, this.scene, { noShadow: true });
    this.box(FW + 0.7, 0.07, 0.1, color, FW / 2, y - 0.265, FD + 0.21, this.scene, { noShadow: true });
    const sign = this.text(`TẦNG ${i + 1}  ·  ${name.toUpperCase()}`, { w: 7.4, h: 0.25, color: '#3f362a' });
    sign.position.set(7.3, y - 0.115, FD + 0.206);
    this.scene.add(sign);

    // Vách kính phía sau và bên phải, lõi thang máy bên trái, cột trước.
    this.box(FW, wallH, 0.06, null, FW / 2, y + wallH / 2, -0.03, this.scene, { material: this.glass, transparent: true });
    for (let x = 0; x <= FW + 0.01; x += 2) this.box(0.08, wallH, 0.12, '#f4f1ea', x, y + wallH / 2, -0.03);
    this.box(FW, 0.08, 0.12, '#f4f1ea', FW / 2, y + wallH * 0.5, -0.03);
    this.box(0.06, wallH, FD, null, FW + 0.03, y + wallH / 2, FD / 2, this.scene, { material: this.glass, transparent: true });
    this.box(0.24, wallH, FD + 0.2, '#f2ece1', -0.12, y + wallH / 2, FD / 2);
    this.box(0.02, 0.16, FD, color, 0.012, y + wallH - 0.2, FD / 2, this.scene, { noShadow: true });
    for (const x of [0.16, FW - 0.14]) this.box(0.3, wallH, 0.3, '#f7f4ee', x, y + wallH / 2, FD - 0.2);
    // Cửa thang máy trên lõi bên trái.
    this.box(0.05, 1.7, 1.5, '#8f9aa3', 0.02, y + 0.85, 2.4, this.scene, { mat: { roughness: 0.3, metalness: 0.7 } });
    this.box(0.06, 1.7, 0.03, '#59636b', 0.03, y + 0.85, 2.4);
    this.box(0.06, 0.08, 1.7, '#59636b', 0.03, y + 1.75, 2.4);
    this.box(0.03, 0.1, 0.22, null, 0.03, y + 1.95, 2.4, this.scene, { material: new THREE.MeshBasicMaterial({ color: brand.accent, toneMapped: false }) });

    this.box(0.02, 0.34, 0.5, '#ffffff', 0.014, y + 1.55, 4.7, this.scene, { noShadow: true });
    const wc = this.text('WC', { w: 0.42, h: 0.24, color: '#3f362a' });
    wc.rotation.y = Math.PI / 2;
    wc.position.set(0.03, y + 1.55, 4.7);
    this.scene.add(wc);
    this.fireKit(y, wallH);
    // Cửa ra thang bộ thoát hiểm trên vách phải, ngay chiếu nghỉ của tầng.
    const sz = this.stairDoor(i).z;
    for (const dz of [-0.48, 0.48]) this.box(0.1, 2.1, 0.08, '#59636b', FW + 0.03, y + 1.05, sz + dz);
    this.box(0.1, 0.1, 1.04, '#59636b', FW + 0.03, y + 2.1, sz);
    this.box(0.04, 0.2, 0.5, null, FW + 0.06, y + 2.3, sz, this.scene, { material: new THREE.MeshBasicMaterial({ color: '#1fa35b', toneMapped: false }), noShadow: true });
    const lamp = new THREE.PointLight('#ffd9a8', 0, 16, 1.2);
    lamp.position.set(FW / 2, y + wallH - 0.3, FD / 2 + 0.5);
    this.scene.add(lamp);
    this.lamps.push(lamp);

    const sofaTint = { carpet: mix('#ffffff', brand.primary, 0.75) };
    const lounge = (cx, cz) => { // góc tiếp khách: thảm tròn, sofa, bàn trà, ghế, đèn
      this.prop('rugRound', cx, y + 0.02, cz, { scale: KS * 1.7, tint: { carpet: mix('#ffffff', color, 0.5), carpetDarker: mix('#ffffff', color, 0.75) } });
      this.prop('loungeSofa', cx, y, cz - 2.2, { tint: sofaTint });
      this.prop('tableCoffee', cx, y, cz - 1.05);
      this.prop('loungeChair', cx + 2.0, y, cz - 0.3, { ry: -Math.PI / 2, tint: sofaTint });
      this.prop('lampRoundFloor', cx - 1.5, y, cz - 2.3);
    };

    if (f.kind === 'lobby') {
      // Sảnh: tường thương hiệu, quầy lễ tân, khu chờ; bàn cho cộng tác viên ở bên phải.
      this.box(5.4, 2.3, 0.14, '#b8946a', 6.2, y + 1.15, 0.16);
      this.brandSign(6.2, y + 1.55, 0.26, 4.2);
      for (const dx of [-0.82, 0, 0.82]) this.prop('kitchenBar', 6.2 + dx, y, 2.6, { tint: { wood: '#fbf7ef', woodDark: brand.primary } });
      this.prop('laptop', 6.2, y + this.topOf('kitchenBar'), 2.6, { ry: Math.PI });
      this.prop('pottedPlant', 4.5, y, 2.6);
      this.prop('pottedPlant', 7.9, y, 2.6);
      lounge(3.0, 4.6);
      this.prop('pottedPlant', FW - 0.8, y, 0.7);
      this.prop('coatRackStanding', 0.9, y, 5.6);
      // Cổng kiểm soát ra vào trước thang máy.
      for (const z of [1.5, 2.4, 3.3]) {
        this.box(0.9, 0.62, 0.22, '#dfe5e8', 1.25, y + 0.31, z, this.scene, { mat: { roughness: 0.3, metalness: 0.5 } });
        this.box(0.3, 0.04, 0.24, brand.accent, 1.5, y + 0.64, z, this.scene, { noShadow: true });
      }
      for (const z of [1.95, 2.85]) this.box(0.04, 0.4, 0.5, null, 1.25, y + 0.42, z, this.scene, { material: this.glass, transparent: true });
      // Tủ trung tâm báo cháy cạnh chốt bảo vệ, camera an ninh ở góc trần.
      this.box(0.06, 0.6, 0.5, '#c9ced3', 0.04, y + 1.25, 5.6, this.scene, { mat: { metalness: 0.5, roughness: 0.4 } });
      this.box(0.02, 0.12, 0.3, '#d62a22', 0.08, y + 1.42, 5.6, this.scene, { noShadow: true });
      this.box(0.16, 0.12, 0.26, '#f4f1ea', FW - 0.5, y + wallH - 0.2, 0.3);
      this.box(0.08, 0.08, 0.08, '#2a2a30', FW - 0.5, y + wallH - 0.22, 0.46);
    } else if (f.dept === 'executive') {
      // Tầng điều hành: tường gỗ với biển công ty sau bàn CEO, tủ sách, khu tiếp khách, bàn họp.
      this.box(6.4, 2.3, 0.14, '#9c7a55', FW / 2, y + 1.15, 0.16);
      this.brandSign(FW / 2, y + 1.6, 0.26, 4.6);
      this.prop('rugRectangle', FW / 2, y + 0.02, 3.0, { scale: KS * 1.9, tint: { carpet: mix('#ffffff', brand.primary, 0.55), carpetDarker: brand.primary } });
      for (const x of [1.4, 3.0]) this.prop('bookcaseClosedWide', x, y, 0.55);
      this.prop('pottedPlant', 4.3, y, 0.7);
      this.prop('pottedPlant', FW - 4.3, y, 0.7);
      lounge(13.2, 4.4);
      // Phòng họp hội đồng vách kính, có máy chiếu.
      this.glassRoom(0.8, 4.0, 5.7, 6.7, y);
      this.meetingTable(3.3, y, 5.35, 3.2, 6, color);
      this.presentation(0.1, y, 5.35, Math.PI / 2, 'dash', 'BÁO CÁO QUÝ', color, 3.3);
      const strip = FD - 0.2, front = [2.23, 3.3, 4.37];
      this.rooms.push({
        id: 'board', kind: 'board', floor: i, busy: false,
        presenter: { x: 1.25, z: 5.35, heading: Math.PI / 2, via: [{ x: 1.25, z: strip }] },
        seats: front.map((x) => ({ x, z: 6.3, heading: Math.PI, via: [{ x, z: strip }] }))
          .concat(front.slice().reverse().map((x) => ({ x, z: 4.4, heading: 0, via: [{ x: 5.3, z: strip }, { x: 5.3, z: 4.4 }] }))),
      });
    } else if (f.kind === 'canteen') {
      this.furnishCanteen(y);
    } else if (f.kind === 'meeting') {
      this.furnishMeeting(y);
    } else {
      // Tầng phòng ban: góc tiếp khách chung, phần còn lại bố trí theo đặc thù công việc của phòng.
      lounge(13.4, 4.4);
      this.prop('pottedPlant', FW - 0.8, y, 0.7);
      (this['furnish_' + f.dept] || this.furnish_default).call(this, y, color, wallH);
    }
  }

  // ---- Đồ dùng chung cho các kiểu tầng ------------------------------------------------
  chairAt(model, x, y, z, faceX, faceZ, tint) {
    return this.prop(model, x, y, z, { ry: Math.atan2(faceX - x, faceZ - z), tint });
  }

  // Bàn họp dài với ghế hai bên.
  meetingTable(cx, y, cz, len, seats, color) {
    const t = this.prop('table', cx, y, cz);
    t.scale.set(len / 0.84, KS, KS * 1.25);
    const n = seats / 2;
    for (let i = 0; i < n; i++) {
      const x = cx - len / 2 + len * (i + 0.5) / n;
      for (const side of [-1, 1]) this.chairAt('chairModernCushion', x, y, cz + side * 0.95, x, cz, { carpetBlue: color });
    }
    this.prop('laptop', cx - 0.5, y + this.topOf('table'), cz, { ry: Math.PI / 2, scale: KS * 0.8 });
  }

  // Phòng vách kính: kính ba mặt, mở về phía mặt tiền để nhìn vào. door = { x, w }: chừa cửa trên vách sau.
  glassRoom(x0, z0, x1, z1, y, h = 2.25, door) {
    const steel = '#8f9aa3', w = x1 - x0, d = z1 - z0;
    const pane = (a, b, y0, hh) => this.box(b - a, hh, 0.04, null, (a + b) / 2, y + y0 + hh / 2, z0, this.scene, { material: this.glass, transparent: true });
    if (z0 > 0.4) {
      if (door) {
        const a = door.x - door.w / 2, b = door.x + door.w / 2;
        if (a > x0) pane(x0, a, 0, h);
        if (x1 > b) pane(b, x1, 0, h);
        pane(a, b, 2.05, h - 2.05);
        for (const x of [a, b]) this.box(0.06, h, 0.08, steel, x, y + h / 2, z0);
      } else pane(x0, x1, 0, h);
    }
    for (const x of [x0, x1]) {
      this.box(0.04, h, d, null, x, y + h / 2, (z0 + z1) / 2, this.scene, { material: this.glass, transparent: true });
      for (const z of [z0, z1]) this.box(0.08, h, 0.08, steel, x, y + h / 2, z);
      this.box(0.08, 0.06, d, steel, x, y + h, (z0 + z1) / 2);
    }
    for (const z of [z0, z1]) this.box(w, 0.06, 0.08, steel, (x0 + x1) / 2, y + h, z);
  }

  // Trang chiếu vẽ sẵn cho màn hình và máy chiếu.
  slide(kind, title, color) {
    const c = document.createElement('canvas');
    c.width = 640; c.height = 400;
    const g = c.getContext('2d');
    g.fillStyle = kind === 'dash' ? '#141a2e' : '#ffffff';
    g.fillRect(0, 0, 640, 400);
    g.fillStyle = color;
    g.fillRect(0, 0, 640, 14);
    g.fillStyle = kind === 'dash' ? '#ffffff' : '#241f45';
    g.font = '800 40px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    g.fillText(title, 28, 70);
    const tones = [color, '#f2b134', '#3f9a5a', '#7c5cbf', '#e4572e', '#3273c4'];
    if (kind === 'bars') {
      [0.45, 0.7, 0.55, 0.9, 0.75, 1].forEach((v, i) => { g.fillStyle = tones[i % 2 ? 1 : 0]; g.fillRect(40 + i * 96, 360 - v * 250, 64, v * 250); });
    } else if (kind === 'kanban') {
      for (let col = 0; col < 3; col++) {
        g.fillStyle = '#eeeaf6'; g.fillRect(28 + col * 200, 100, 184, 280);
        for (let r = 0; r < 3 - col % 2; r++) { g.fillStyle = tones[(col * 2 + r) % 6]; g.fillRect(42 + col * 200, 116 + r * 86, 156, 68); }
      }
    } else if (kind === 'menu') {
      for (let r = 0; r < 5; r++) { g.fillStyle = tones[r % 6]; g.fillRect(34, 104 + r * 56, 30, 30); g.fillStyle = '#55507a'; g.fillRect(84, 112 + r * 56, 300 + (r % 3) * 60, 14); g.fillRect(520, 112 + r * 56, 80, 14); }
    } else { // dash: đường xu hướng và vài thẻ số
      g.strokeStyle = color; g.lineWidth = 8; g.beginPath();
      [300, 250, 270, 200, 220, 150, 120].forEach((yy, i) => (i ? g.lineTo(40 + i * 60, yy) : g.moveTo(40, yy)));
      g.stroke();
      for (let r = 0; r < 3; r++) { g.fillStyle = tones[r + 1]; g.fillRect(450, 110 + r * 90, 160, 70); }
      g.fillStyle = '#2a3354'; g.fillRect(40, 330, 380, 40);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  // Màn hình hoặc bảng dựng đứng, mặt hướng theo ry (0 = quay ra mặt tiền).
  screen(x, y, z, w, ry, tex, frame = '#2b2e35') {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.scene.add(g);
    const h = w * 0.625;
    this.box(w + 0.1, h + 0.1, 0.05, frame, 0, 0, 0, g);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    m.position.z = 0.03;
    g.add(m);
    return g;
  }

  // Bảng đứng trên chân (bảng trắng, bảng tin): đặt giữa phòng mà không cần tường.
  standBoard(x, y, z, w, tex, frame = '#d9d2c3') {
    for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) this.box(0.06, 0.6, 0.4, '#8f9aa3', x + dx, y + 0.3, z);
    this.screen(x, y + 0.6 + w * 0.3125 + 0.05, z, w, 0, tex, frame);
  }

  // Màn chiếu trên tường kèm máy chiếu treo trần và chùm sáng.
  presentation(x, y, z, ry, kind, title, color, throwDist) {
    const sy = y + 1.4, wallH = this.FH - 0.3;
    this.screen(x, sy, z, 1.9, ry, this.slide(kind, title, color), '#f4f1ea');
    const px = x + Math.sin(ry) * throwDist, pz = z + Math.cos(ry) * throwDist, py = y + wallH - 0.2;
    this.box(0.34, 0.14, 0.4, '#3a3f47', px, py, pz, this.scene, { mat: { roughness: 0.4, metalness: 0.3 } });
    this.box(0.05, 0.2, 0.05, '#8f9aa3', px, py + 0.14, pz);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, throwDist, 4, 1, true), new THREE.MeshBasicMaterial({ color: '#fff7d6', transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
    beam.position.set((x + px) / 2, (sy + py) / 2, (z + pz) / 2);
    beam.lookAt(px, py, pz);
    beam.rotateX(Math.PI / 2);
    this.scene.add(beam);
  }

  rack(x, y, z) {
    this.box(0.56, 1.7, 0.6, '#2b2f37', x, y + 0.85, z, this.scene, { mat: { roughness: 0.5, metalness: 0.4 } });
    for (let i = 0; i < 7; i++) {
      this.box(0.4, 0.035, 0.012, null, x, y + 0.25 + i * 0.2, z + 0.305, this.scene, { material: new THREE.MeshBasicMaterial({ color: i % 3 ? '#6fe39a' : '#5ab0ff', toneMapped: false }), noShadow: true });
    }
  }

  coffeeBar(x, y, color) {
    this.prop('kitchenBar', x, y, 0.55, { tint: { woodDark: color } });
    this.prop('kitchenCoffeeMachine', x, y + this.topOf('kitchenBar'), 0.55);
    this.prop('trashcan', x - 0.8, y, 0.55, { scale: KS * 0.7 });
  }

  // ---- Bố trí riêng từng phòng ban ------------------------------------------------------
  furnish_default(y, color) {
    this.prop('bookcaseClosedWide', 1.4, y, 0.55);
    this.prop('bookcaseOpen', 2.75, y, 0.55);
    this.coffeeBar(10.6, y, color);
    this.prop('tableRound', 2.2, y, 5.2);
    for (const [dx, dz] of [[-0.85, 0], [0.85, 0], [0, 0.85]]) this.prop('stoolBar', 2.2 + dx, y, 5.2 + dz, { scale: KS * 0.85 });
  }

  // Marketing: bảng ý tưởng, bảng mood, góc brainstorm có máy chiếu, góc chụp hình.
  furnish_marketing(y, color) {
    this.standBoard(2.5, y, 0.6, 2.4, this.slide('kanban', 'Ý TƯỞNG CAMPAIGN', color));
    this.standBoard(8.6, y, 0.6, 2.2, this.slide('bars', 'HIỆU QUẢ KÊNH', color), '#c9a577');
    this.coffeeBar(11.2, y, color);
    this.presentation(0.1, y, 5.6, Math.PI / 2, 'bars', 'KẾ HOẠCH CAMPAIGN', color, 3.0);
    this.prop('rugSquare', 2.5, y + 0.02, 5.6, { scale: KS * 1.5, tint: { carpet: mix('#ffffff', color, 0.45), carpetDarker: mix('#ffffff', color, 0.7) } });
    for (const z of [5.0, 6.1]) this.chairAt('loungeDesignChair', 3.3, y, z, 0, z, { carpetBlue: color });
    this.prop('tableCoffee', 2.0, y, 5.6, { ry: Math.PI / 2 });
    // Góc chụp hình sản phẩm: máy ảnh trên chân, đèn softbox.
    for (const a of [0, 2.1, 4.2]) { const leg = this.cyl(0.02, 1.0, '#2a2a30', 10.6 + Math.cos(a) * 0.18, y + 0.5, 5.9 + Math.sin(a) * 0.18); leg.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); }
    this.box(0.26, 0.18, 0.2, '#2a2a30', 10.6, y + 1.08, 5.9);
    this.cyl(0.06, 0.1, '#59636b', 10.6, y + 1.08, 5.76).rotation.x = Math.PI / 2;
    this.cyl(0.03, 1.1, '#8f9aa3', 9.7, y + 0.55, 6.1);
    this.box(0.42, 0.42, 0.1, null, 9.7, y + 1.2, 6.1, this.scene, { material: new THREE.MeshBasicMaterial({ color: '#fffbe8', toneMapped: false }) });
  }

  // Sản phẩm & Thiết kế: bảng kanban, kệ mẫu, bàn phác thảo lớn, máy in 3D.
  furnish_product(y, color) {
    this.standBoard(2.5, y, 0.6, 2.4, this.slide('kanban', 'LỘ TRÌNH SẢN PHẨM', color));
    for (const x of [8.4, 9.3]) this.prop('bookcaseOpen', x, y, 0.55);
    for (const [x, z] of [[8.4, 1.3], [8.9, 1.25]]) this.prop('cardboardBoxClosed', x, y, z);
    this.prop('sideTableDrawers', 11.0, y, 0.55);
    const top = y + this.topOf('sideTableDrawers');
    for (const dx of [-0.24, 0.24]) for (const dz of [-0.2, 0.2]) this.box(0.035, 0.6, 0.035, '#59636b', 11.0 + dx, top + 0.3, 0.55 + dz);
    this.box(0.56, 0.04, 0.48, '#59636b', 11.0, top + 0.6, 0.55);
    this.box(0.2, 0.16, 0.2, color, 11.0, top + 0.1, 0.55);
    const t = this.prop('table', 2.6, y, 5.4);
    t.scale.set(KS * 1.5, KS, KS * 1.5);
    const tt = y + this.topOf('table');
    this.prop('laptop', 2.0, tt, 5.4, { scale: KS * 0.8 });
    for (const [dx, dz, c] of [[0.5, -0.2, '#ffffff'], [0.9, 0.15, mix('#ffffff', color, 0.4)], [0.3, 0.3, '#fff3c4']]) this.box(0.42, 0.012, 0.3, c, 2.6 + dx, tt + 0.01, 5.4 + dz, this.scene, { noShadow: true });
    this.prop('books', 3.5, tt, 5.1);
    for (const [dx, dz] of [[-0.9, 0.95], [0.3, 0.95], [1.5, 0.3]]) this.prop('stoolBar', 2.6 + dx, y, 5.4 + dz, { scale: KS * 0.85, tint: { carpet: color } });
  }

  // Kỹ thuật & Dữ liệu: tường màn hình giám sát, phòng máy chủ vách kính, bàn đứng.
  furnish_engineering(y, color) {
    this.box(3.6, 1.5, 0.1, '#20242c', 2.6, y + 1.2, 0.45);
    ['HỆ THỐNG', 'LƯU LƯỢNG', 'TRIỂN KHAI'].forEach((t, i) => this.screen(1.45 + i * 1.15, y + 1.2, 0.51, 1.0, 0, this.slide('dash', t, [color, '#3f9a5a', '#f2b134'][i]), '#20242c'));
    this.glassRoom(8.9, 0.2, 12.1, 1.75, y);
    for (const x of [9.5, 10.5, 11.5]) this.rack(x, y, 0.8);
    const t = this.prop('table', 2.4, y, 5.5);
    t.scale.set(KS * 1.2, KS * 1.55, KS);
    this.prop('laptop', 2.4, y + this.topOf('table', KS * 1.55), 5.5, { scale: KS * 0.8 });
    this.standBoard(4.0, y, 6.2, 1.6, this.slide('kanban', 'SPRINT', color));
    this.prop('kitchenCoffeeMachine', 7.6, y + this.topOf('sideTableDrawers'), 0.55);
    this.prop('sideTableDrawers', 7.6, y, 0.55);
  }

  // Kinh doanh & CSKH: bảng doanh số, cồng mừng chốt đơn, phòng tiếp khách vách kính.
  furnish_sales(y, color) {
    this.box(2.6, 1.6, 0.1, '#20242c', 2.5, y + 1.2, 0.45);
    this.screen(2.5, y + 1.2, 0.51, 2.3, 0, this.slide('bars', 'DOANH SỐ THÁNG', color), '#20242c');
    for (const dx of [-0.45, 0.45]) this.box(0.06, 1.3, 0.06, '#7a5a3a', 9.0 + dx, y + 0.65, 0.7);
    this.box(1.0, 0.06, 0.06, '#7a5a3a', 9.0, y + 1.3, 0.7);
    const gong = this.cyl(0.36, 0.05, '#d9a441', 9.0, y + 0.82, 0.7, { metalness: 0.8, roughness: 0.3 });
    gong.rotation.x = Math.PI / 2;
    this.coffeeBar(11.2, y, color);
    this.glassRoom(0.8, 4.2, 4.6, 6.6, y);
    this.prop('tableRound', 2.7, y, 5.4);
    for (const [dx, dz] of [[-1.0, 0], [1.0, 0], [0, -0.95]]) this.chairAt('chairCushion', 2.7 + dx, y, 5.4 + dz, 2.7, 5.4, { carpet: color });
    this.prop('pottedPlant', 4.1, y, 4.6, { scale: KS * 0.8 });
  }

  // Vận hành: dãy tủ hồ sơ, két sắt, máy photocopy, bảng thông báo, bàn lưu trữ.
  furnish_operations(y, color) {
    for (const x of [1.4, 2.95, 4.5]) this.prop('bookcaseClosedWide', x, y, 0.55);
    this.box(0.8, 1.0, 0.7, '#3a3f47', 8.3, y + 0.5, 0.6, this.scene, { mat: { roughness: 0.4, metalness: 0.5 } });
    this.cyl(0.1, 0.04, '#c9ced3', 8.3, y + 0.6, 0.97, { metalness: 0.8, roughness: 0.3 }).rotation.x = Math.PI / 2;
    this.box(0.9, 0.95, 0.7, '#e3e6e8', 9.6, y + 0.475, 0.6);
    this.box(0.94, 0.08, 0.74, '#59636b', 9.6, y + 0.99, 0.6);
    this.box(0.5, 0.03, 0.4, '#ffffff', 10.15, y + 0.6, 0.6);
    this.standBoard(11.5, y, 0.6, 1.6, this.slide('menu', 'THÔNG BÁO', color), '#c9a577');
    const t = this.prop('table', 2.6, y, 5.4);
    t.scale.set(KS * 1.4, KS, KS * 1.2);
    const tt = y + this.topOf('table');
    for (const [dx, dz] of [[-0.6, 0], [0.1, 0.1]]) this.prop('cardboardBoxClosed', 2.6 + dx, tt, 5.4 + dz);
    for (const [x, z] of [[1.3, 5.9], [1.75, 5.5], [4.1, 5.9]]) this.prop('cardboardBoxClosed', x, y, z);
    this.prop('cardboardBoxClosed', 1.5, y + this.topOf('cardboardBoxClosed'), 5.75, { ry: 0.3 });
    this.prop('books', 3.3, tt, 5.5);
  }

  // Tầng canteen: bếp sát tường sau, quầy phục vụ, khu bàn ăn, góc cà phê.
  furnishCanteen(y) {
    const { FW, brand } = this;
    const cloth = { carpet: mix('#ffffff', brand.accent, 0.55) };
    this.prop('kitchenFridgeLarge', 1.3, y, 0.6);
    this.prop('kitchenSink', 2.35, y, 0.6);
    this.prop('kitchenStoveElectric', 3.2, y, 0.6);
    this.prop('kitchenCabinet', 4.05, y, 0.6);
    this.prop('kitchenMicrowave', 4.05, y + this.topOf('kitchenCabinet'), 0.6);
    for (let i = 0; i < 5; i++) this.prop('kitchenBar', 5.3 + i * 0.82, y, 1.45, { tint: { woodDark: brand.primary } }); // quầy phục vụ
    const bar = y + this.topOf('kitchenBar');
    this.prop('kitchenCoffeeMachine', 5.3, bar, 1.45);
    this.prop('toaster', 6.1, bar, 1.45);
    for (let i = 0; i < 5; i++) this.cyl(0.05, 0.1, i % 2 ? brand.accent : '#ffffff', 7.6 + i * 0.16, bar + 0.05, 1.45);
    for (let i = 0; i < 3; i++) this.box(0.5, 0.03, 0.34, '#d9d2c3', 8.0 + i * 0.05, bar + 0.02 + i * 0.035, 1.75);          // chồng khay
    this.prop('kitchenFridge', 9.9, y, 0.6);
    this.prop('kitchenFridge', 10.75, y, 0.6);
    this.standBoard(12.2, y, 0.6, 1.6, this.slide('menu', 'THỰC ĐƠN HÔM NAY', brand.accent), '#2b2e35');
    // Khu bàn ăn: hai dãy bàn bốn chỗ.
    for (const z of [3.5, 5.5]) for (const x of [1.9, 4.5, 7.1, 9.7]) {
      const t = this.prop('tableCloth', x, y, z, { tint: cloth });
      t.scale.set(KS * 1.15, KS, KS * 1.15);
      for (const dx of [-0.45, 0.45]) for (const side of [-1, 1]) this.chairAt('chairCushion', x + dx, y, z + side * 0.8, x + dx, z, cloth);
      this.cyl(0.05, 0.14, '#4f9a5a', x, y + this.topOf('tableCloth') + 0.07, z);
    }
    // Góc cà phê: sofa, bàn trà, bàn đứng.
    this.prop('rugRound', 13.6, y + 0.02, 4.6, { scale: KS * 1.6, tint: { carpet: mix('#ffffff', brand.primary, 0.5), carpetDarker: mix('#ffffff', brand.primary, 0.75) } });
    this.prop('loungeSofa', 13.6, y, 2.6, { tint: { carpet: mix('#ffffff', brand.primary, 0.75) } });
    this.prop('tableCoffee', 13.6, y, 3.7);
    this.prop('tableRound', 13.6, y, 5.6);
    for (const [dx, dz] of [[-0.95, 0], [0.95, 0], [0, 0.9]]) this.prop('stoolBar', 13.6 + dx, y, 5.6 + dz, { scale: KS * 0.85, tint: { carpet: brand.accent } });
    this.prop('pottedPlant', FW - 0.8, y, 0.7);
    this.prop('pottedPlant', 0.9, y, 6.3);
    this.prop('trashcan', 11.9, y, 1.0, { scale: KS * 0.8 });
  }

  // Tầng hội nghị: sảnh chờ, phòng họp lớn và vừa có máy chiếu, hai phòng họp nhỏ, khu đào tạo.
  // Mỗi phòng đăng ký chỗ ngồi kèm lối vào (via) để người đi vào không xuyên qua bàn ghế, vách kính.
  furnishMeeting(y) {
    const { FW, brand } = this;
    const c1 = brand.primary, c2 = brand.accent;
    const floor = Math.round(y / this.FH), zc = this.corridor(floor).zc;
    // Sảnh chờ cạnh thang máy, có bảng lịch phòng.
    this.prop('loungeSofa', 2.2, y, 0.8, { tint: { carpet: mix('#ffffff', c1, 0.75) } });
    this.prop('tableCoffee', 2.2, y, 1.9);
    this.prop('pottedPlant', 3.6, y, 0.7);
    this.standBoard(2.2, y, 6.2, 1.7, this.slide('menu', 'LỊCH PHÒNG HỌP', c1));
    // Phòng họp lớn 10 chỗ: hàng trước vào thẳng từ hành lang, hàng sau đi vòng đầu bàn.
    this.glassRoom(4.4, 0.2, 10.4, 3.6, y);
    this.meetingTable(7.6, y, 1.9, 4.4, 10, c1);
    this.presentation(4.5, y, 1.9, Math.PI / 2, 'bars', 'HỌP GIAO BAN', c1, 1.4);
    const bigX = [0, 1, 2, 3, 4].map((i) => 5.84 + 0.88 * i);
    this.rooms.push({
      id: 'big', kind: 'meeting', floor, busy: false,
      presenter: { x: 4.95, z: 1.9, heading: Math.PI / 2 },
      seats: bigX.map((x) => ({ x, z: 2.85, heading: Math.PI }))
        .concat(bigX.slice().reverse().map((x) => ({ x, z: 0.95, heading: 0, via: [{ x: 10.05, z: zc }, { x: 10.05, z: 0.35 }, { x, z: 0.35 }] }))),
    });
    // Phòng họp vừa 6 chỗ.
    this.glassRoom(10.9, 0.2, FW - 0.35, 3.6, y);
    this.meetingTable(13.0, y, 1.9, 3.0, 6, c2);
    this.presentation(FW - 0.45, y, 1.9, -Math.PI / 2, 'dash', 'KẾ HOẠCH QUÝ', c2, 1.2);
    const medX = [12.0, 13.0, 14.0];
    this.rooms.push({
      id: 'medium', kind: 'meeting', floor, busy: false,
      presenter: { x: 15.05, z: 1.9, heading: -Math.PI / 2 },
      seats: medX.map((x) => ({ x, z: 2.85, heading: Math.PI }))
        .concat(medX.map((x) => ({ x, z: 0.95, heading: 0, via: [{ x: 11.15, z: zc }, { x: 11.15, z: 0.35 }, { x, z: 0.35 }] }))),
    });
    // Hai phòng họp nhỏ cho họp một-một, cửa ở vách sau.
    for (const x0 of [4.4, 7.6]) {
      this.glassRoom(x0, 4.7, x0 + 2.8, 6.7, y, 2.25, { x: x0 + 0.55, w: 0.8 });
      this.prop('tableRound', x0 + 1.4, y, 5.75, { scale: KS * 0.9 });
      for (const [dx, dz] of [[-0.85, 0], [0.85, 0], [0, -0.85]]) this.chairAt('chairModernCushion', x0 + 1.4 + dx, y, 5.75 + dz, x0 + 1.4, 5.75, { carpetBlue: c2 });
      const door = [{ x: x0 + 0.55, z: zc }, { x: x0 + 0.55, z: 5.2 }];
      this.rooms.push({
        id: 'small' + x0, kind: 'meeting', floor, busy: false,
        seats: [{ x: x0 + 1.4, z: 4.9, heading: 0, via: door }, { x: x0 + 0.55, z: 5.75, heading: Math.PI / 2, via: door }],
      });
    }
    // Khu đào tạo: ghế xếp hàng nhìn lên màn chiếu; người vào chỗ theo khe giữa hai hàng ghế.
    this.presentation(FW - 0.45, y, 5.6, -Math.PI / 2, 'kanban', 'ĐÀO TẠO NỘI BỘ', c1, 2.6);
    this.trainSeats = [];
    for (const x of [11.4, 12.3, 13.2]) for (const z of [4.9, 5.6, 6.3]) {
      this.chairAt('chairCushion', x, y, z, FW, z, { carpet: mix('#ffffff', c1, 0.6) });
      this.trainSeats.push({ floor, x, z, taken: false, via: [{ x: 10.85, z: zc }, { x: 10.85, z: z + 0.35 }, { x, z: z + 0.35 }] });
    }
  }

  buildRoof() {
    const { FW, FD, H, brand } = this;
    this.box(FW + 0.7, 0.3, FD + 0.5, '#e7e2d8', FW / 2, H - 0.15, FD / 2 - 0.05);
    this.box(FW + 0.7, 0.5, 0.14, '#f4f1ea', FW / 2, H + 0.25, FD + 0.13);
    this.box(FW + 0.7, 0.5, 0.14, '#f4f1ea', FW / 2, H + 0.25, -0.23);
    this.box(0.14, 0.5, FD + 0.5, '#f4f1ea', -0.28, H + 0.25, FD / 2 - 0.05);
    this.box(0.14, 0.5, FD + 0.5, '#f4f1ea', FW + 0.28, H + 0.25, FD / 2 - 0.05);
    this.box(FW + 0.7, 0.1, 0.16, brand.primary, FW / 2, H + 0.55, FD + 0.13);
    // Biển công ty trên mái.
    for (const x of [FW / 2 - 2.6, FW / 2 + 2.6]) this.box(0.14, 1.0, 0.14, '#7d858c', x, H + 0.5, FD - 1.2);
    this.brandSign(FW / 2, H + 1.75, FD - 1.1, 7.2);
    this.box(2.2, 0.9, 1.6, '#d7d2c7', 2.4, H + 0.45, 1.6);
    // Sân đỗ trực thăng và chậu cây trên mái.
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.06, 40), this.mat('#6f737a'));
    pad.position.set(FW - 3.6, H + 0.03, 3.1);
    pad.receiveShadow = true;
    this.scene.add(pad);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.07, 8, 48), this.mat('#f2c14e'));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(FW - 3.6, H + 0.07, 3.1);
    this.scene.add(ring);
    const hMark = this.text('H', { w: 1.5, h: 1.5, color: '#ffffff' });
    hMark.rotation.x = -Math.PI / 2;
    hMark.position.set(FW - 3.6 + 0.35, H + 0.075, 3.1);
    this.scene.add(hMark);
    for (const x of [5.2, 6.6, 8.0]) this.prop('pottedPlant', x, H, 1.2, { scale: KS * 1.2 });
  }

  // ---- Nhân viên ------------------------------------------------------------------------
  // Tô lại một ô trên bảng màu, giữ nguyên độ đậm nhạt gốc của từng điểm ảnh.
  recolor(ctx, [col, row], hex) {
    const x0 = col * 64, y0 = row * 128;
    const img = ctx.getImageData(x0, y0, 64, 128), d = img.data;
    const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    let max = 1;
    for (let i = 0; i < d.length; i += 4) max = Math.max(max, d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
    for (let i = 0; i < d.length; i += 4) {
      const k = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / max;
      d[i] = base[0] * k; d[i + 1] = base[1] * k; d[i + 2] = base[2] * k;
    }
    ctx.putImageData(img, x0, y0);
  }

  outfit(s) {
    const { brand } = this;
    const hex = (v) => (/^#[0-9a-f]{6}$/i.test(v) ? v : null);
    const gender = s.gender === 'f' || s.gender === 'm' ? s.gender : hash(s.id, 2) ? 'f' : 'm';
    const formal = Boolean(s.lead || s.fixed);
    const pool = CAST[formal ? 'formal' : 'staff'][gender];
    const model = LOOKS[s.model] ? s.model : pool[(s.slot + hash(s.id, 7)) % pool.length];
    const cells = LOOKS[model];
    const colors = s.raw ? {} : { // raw: giữ trang phục gốc của mô hình (ví dụ áo trắng của đầu bếp)
      shirt: hex(formal ? brand.secondary : brand.primary), pants: hex(brand.trousers), tie: hex(brand.accent),
      shoes: '#2a2a30', belt: '#2a2a30', hair: hex(s.hair), skin: hex(s.skin),
    };
    const key = model + JSON.stringify(colors);
    if (!this.textures.has(key)) {
      const gltf = this.assets.people[model];
      let src = null;
      gltf.scene.traverse((o) => { if (o.isMesh && o.material.map && !src) src = o.material.map; });
      const c = document.createElement('canvas');
      c.width = src.image.width; c.height = src.image.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(src.image, 0, 0);
      for (const part of Object.keys(colors)) if (colors[part] && cells[part]) this.recolor(ctx, cells[part], colors[part]);
      const tex = new THREE.CanvasTexture(c);
      tex.flipY = src.flipY;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = src.magFilter; tex.minFilter = src.minFilter;
      tex.wrapS = src.wrapS; tex.wrapT = src.wrapT;
      this.textures.set(key, tex);
    }
    return { model, map: this.textures.get(key), formal };
  }

  // Đồng phục: áo màu chính của brand, dây thẻ màu nhấn, thẻ có vạch màu phòng ban.
  // Trưởng phòng và CEO mặc áo màu phụ (như áo khoác), cổ trắng, cà vạt màu nhấn.
  buildCharacter(s) {
    const { brand } = this;
    const look = this.outfit(s);
    const gltf = this.assets.people[look.model];
    const root = cloneSkinned(gltf.scene);
    let torso = null;
    const arms = [];
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // khung xương đưa lưới ra ngoài hộp bao gốc
        o.material = o.material.clone();
        o.material.map = look.map;
        o.material.roughness = 0.8;
      }
      if (o.isBone && o.name === 'torso') torso = o;
      if (o.isBone && (o.name === 'arm-left' || o.name === 'arm-right')) arms.push(o);
    });
    if (torso) {
      const kit = new THREE.Group();
      const piece = (w, h, color, x, y, rz = 0, dz = 0) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), this.mat(color, { roughness: 0.6 }));
        m.position.set(x, y, 0.092 + dz);
        m.rotation.z = rz;
        kit.add(m);
      };
      if (!look.formal) { // người mặc vest đã có sẵn cổ áo, cà vạt trong mô hình
        piece(0.01, 0.09, brand.accent, -0.018, 0.315, -0.38);
        piece(0.01, 0.09, brand.accent, 0.018, 0.315, 0.38);
        piece(0.05, 0.046, '#ffffff', 0, 0.252, 0, 0.003);
        piece(0.05, 0.014, s.color, 0, 0.268, 0, 0.006);
      }
      root.add(kit);
      root.updateMatrixWorld(true);
      torso.attach(kit);
    }

    const g = new THREE.Group();
    root.scale.setScalar(PS);
    g.add(root);
    // Dấu chấm than đỏ: nhân viên đang chờ sếp duyệt quyền.
    const alert = new THREE.Group();
    const red = new THREE.MeshBasicMaterial({ color: '#e0352b', toneMapped: false });
    alert.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), red));
    const dot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), red);
    dot.position.y = -0.19;
    alert.add(dot);
    alert.position.y = PERSON_H + 0.42; alert.visible = false;
    g.add(alert);
    this.scene.add(g);

    const mixer = new THREE.AnimationMixer(root);
    const actions = {};
    for (const clip of gltf.animations) actions[clip.name] = mixer.clipAction(clip);
    if (actions.walk) actions.walk.timeScale = 1.5;
    return { g, root, mixer, actions, arms, alert, current: null };
  }

  // Chuyển hoạt ảnh có hòa trộn, không khởi động lại nếu đang chạy đúng hoạt ảnh đó.
  play(a, name) {
    const b = a.body;
    const next = b.actions[name];
    if (!next || b.current === name) return;
    const prev = b.actions[b.current];
    next.reset().fadeIn(FADE).play();
    if (prev) prev.fadeOut(FADE);
    b.current = name;
  }

  // Vị trí bàn trên tầng theo thứ tự xếp chỗ.
  deskSpot(s) {
    const f = this.floors[s.floor] || {};
    const row = Math.floor(s.slot / 4), k = s.slot % 4;
    if (f.dept === 'executive') return { x: this.FW / 2 + 0.4 + s.slot * 2.6, z: 3.0 };
    if (f.kind === 'lobby') return { x: 10.4 + k * 1.8, z: 2.7 + row * 2.4 };
    return { x: 5.4 + k * 2.05, z: 2.7 + row * 2.4 };
  }

  buildDesk(s, x, y, z) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = Math.PI / 2; // bàn xoay ngang: người ngồi nhìn sang phải, máy quay thấy nghiêng mặt
    this.scene.add(g);
    const big = s.fixed ? 1.35 : s.lead ? 1.15 : 1;
    const top = this.topOf('desk');
    const desk = this.prop('desk', 0, 0, 0, { parent: g });
    desk.scale.set(KS * big, KS, KS);
    this.prop('chairDesk', 0, 0, -SEAT_BACK, { parent: g, tint: { carpet: s.off ? '#b9b9b9' : s.color } });
    this.prop('computerScreen', 0, top, 0.16, { parent: g, ry: Math.PI });
    this.prop('computerKeyboard', 0, top, -0.16, { parent: g, ry: Math.PI, scale: KS * 0.9 });
    // Vạch sáng sau màn hình: sáng màu phòng ban khi người ngồi bàn đang làm việc.
    const strip = new THREE.MeshBasicMaterial({ color: '#59636b', toneMapped: false });
    this.box(0.4, 0.06, 0.012, null, 0, top + 0.32, 0.215, g, { material: strip, noShadow: true });
    if (s.lead || s.fixed) {
      this.prop('lampSquareTable', 0.36 * big * KS - 0.18, top, 0.12, { parent: g }); // góc bàn phía tường sau, không che mặt
      this.box(0.3, 0.09, 0.05, this.brand.accent, -0.22 * big * KS, top + 0.045, -0.2, g);
    }
    return { strip, half: 0.36 * big };
  }

  label(cls, html) {
    const el = document.createElement('div');
    el.className = cls;
    el.innerHTML = html;
    this.labels.appendChild(el);
    return el;
  }

  addStaff(s) {
    const f = this.floors[s.floor] || {};
    const y = s.floor * this.FH;
    const desk = this.deskSpot(s);
    const built = this.buildDesk(s, desk.x, y, desk.z);
    const platePos = new THREE.Vector3(desk.x, y + 0.2, desk.z + built.half * KS + 0.25);
    if (s.off) { // vị trí đang trống: chỉ có bàn và biển "Đang tuyển"
      const plate = this.label('plate3 vacant', 'Đang tuyển');
      plate.title = s.title || '';
      this.vacant.push({ plate, pos: platePos });
      return;
    }
    const cx = f.kind === 'lobby' ? 3.0 : 13.4, cz = f.kind === 'lobby' ? 4.6 : 4.4;
    const o = IDLE_SPOTS[s.slot % IDLE_SPOTS.length];
    const seat = { x: desk.x - SEAT_BACK, z: desk.z };
    const home = s.fixed ? seat : { x: cx + o[0], z: cz + o[1] };   // chỗ đứng lúc rảnh ở góc tiếp khách
    const a = {
      s, home: { floor: s.floor, ...home }, seat, visitor: { x: desk.x + 0.95, z: desk.z },
      floor: s.floor, x: home.x, z: home.z, steps: [{ k: s.fixed ? 'sit' : 'idle' }], errands: [], riding: false,
      wantDesk: Boolean(s.fixed), status: 'idle', alert: false,
      phase: Math.random() * 6, cheer: 0, gesture: 4 + Math.random() * 14, gestureEnd: 0, heading: 0, seated: false,
      rest: 14 + Math.random() * 30,
      desk: built, body: this.buildCharacter(s),
      bubble: this.label('bubble3', '<span></span>'),
      plate: this.label('plate3', esc(s.name)),
      name: this.label('name3', esc(s.name)),
      deskPos: platePos,
    };
    a.bubble.style.setProperty('--c', s.color);
    a.plate.style.setProperty('--c', s.color);
    a.plate.title = s.title || '';
    a.body.g.position.set(a.x, y, a.z);
    a.body.mixer.setTime(Math.random() * 3); // lệch nhịp để cả tầng không cử động đồng loạt
    this.actors.set(s.id, a);
  }

  // ---- Dẫn đường trong tòa nhà -----------------------------------------------------------
  // Mỗi tầng có một hành lang ngang (zc) và một lối dọc (xr) nối hành lang với dải trống sát mặt tiền,
  // nơi có sảnh thang máy. Đường đi luôn bám theo các trục này để không xuyên qua bàn ghế, phòng kính.
  corridor(i) {
    if (i < 0) return { zc: 5.3, xr: 4.0 };             // hầm B1: lối xe chạy trước dãy ô đỗ
    const f = this.floors[i] || {};
    if (f.kind === 'canteen') return { zc: this.FD - 0.2, xr: 0.9 };
    if (f.kind === 'meeting') return { zc: 4.15, xr: 3.7 };
    if (f.dept === 'executive') return { zc: 4.3, xr: 6.3 };
    if (f.kind === 'lobby') return { zc: 4.3, xr: 5.2 };
    return { zc: AISLE_Z, xr: 5.2 };
  }

  // Cửa ra thang bộ của tầng k (chiếu nghỉ đổi bên theo tầng chẵn lẻ, khớp với các vế thang).
  stairDoor(k) {
    return { x: this.FW - 0.15, z: k % 2 ? 0.95 : 5.85 };
  }

  // Các điểm 3D đi từ cửa thang tầng f0 tới cửa thang tầng f1: chiếu nghỉ, chân vế, đầu vế, chiếu nghỉ...
  stairPath(f0, f1) {
    const { FW, FH } = this, xs = FW + 1.02, xl = FW + 0.85;
    const lz = (k) => (k % 2 ? 0.95 : 5.85);
    const foot = (k) => (k % 2 ? 1.5 : 5.3);   // chân vế thang đi lên từ tầng k
    const head = (k) => (k % 2 ? 5.3 : 1.5);   // đầu vế thang đó, ở tầng k + 1
    const dir = Math.sign(f1 - f0);
    const pts = [{ x: xl, y: f0 * FH, z: lz(f0) }];
    for (let k = f0; k !== f1; k += dir) {
      if (dir > 0) pts.push({ x: xs, y: k * FH, z: foot(k) }, { x: xs, y: (k + 1) * FH, z: head(k) });
      else pts.push({ x: xs, y: k * FH, z: head(k - 1) }, { x: xs, y: (k - 1) * FH, z: foot(k - 1) });
      pts.push({ x: xl, y: (k + dir) * FH, z: lz(k + dir) });
    }
    const door = this.stairDoor(f1);
    pts.push({ x: door.x, y: f1 * FH, z: door.z });
    return pts;
  }

  pathOnFloor(i, A, B) {
    const { zc, xr } = this.corridor(i);
    const strip = this.FD - 0.2;
    const onStrip = (p) => zc !== strip && Math.abs(p.z - strip) < 0.06;
    const pts = [];
    if (onStrip(A)) pts.push({ x: xr, z: strip }, { x: xr, z: zc }); else pts.push({ x: A.x, z: zc });
    if (onStrip(B)) pts.push({ x: xr, z: zc }, { x: xr, z: strip }); else pts.push({ x: B.x, z: zc });
    pts.push({ x: B.x, z: B.z });
    let last = A;
    return pts.filter((p) => { const keep = Math.hypot(p.x - last.x, p.z - last.z) > 0.02; if (keep) last = p; return keep; });
  }

  // Lập lại lộ trình: làm hết việc vặt (đi nhận việc, họp, nghỉ ở canteen) rồi về bàn hoặc về góc chờ.
  replan(a) {
    let floor = a.floor, at = { x: a.x, z: a.z };
    const steps = [];
    const out = a.errands.find((e) => e.kind === 'out' && e.phase);
    if (a.steps[0] && a.steps[0].k === 'climb') { // đang trên thang bộ: đi hết vế thang rồi mới theo lộ trình mới
      let j = 0;
      while (a.steps[j] && a.steps[j].k === 'climb') steps.push(a.steps[j++]);
      const last = steps[steps.length - 1];
      floor = Math.round(last.y / this.FH); at = { x: last.x, z: last.z };
    } else if (out) { // đang lái xe: chạy nốt chuyến (có việc thì quay về ngay) rồi mới theo lộ trình mới
      steps.push({ k: 'drive', errand: out });
      floor = -1; at = { x: out.slot.x, z: 4.3 };
    } else if (a.riding) { // đang trong cabin: đi nốt chặng này rồi mới theo lộ trình mới
      const ride = this.rideOf(a);
      steps.push({ k: 'lift', to: ride.to, called: true });
      floor = ride.to; at = this.liftSpot();
    } else {
      this.calls = this.calls.filter((c) => c.a !== a);
      if (a.at && a.at.back && Math.abs(a.at.x - a.x) < 0.05 && Math.abs(a.at.z - a.z) < 0.05) at = a.at; // đang ngồi trong phòng: ra theo lối đã vào
    }
    const go = (dest) => {
      if (at.back) { for (const p of at.back) steps.push({ k: 'walk', x: p.x, z: p.z }); at = at.back[at.back.length - 1]; }
      if (dest.floor !== floor) {
        // Cách một tầng thì đi thang bộ; cách hai tầng mà thang máy đang đông cũng đi bộ; xa hơn hoặc xuống hầm thì đi thang máy.
        const span = Math.abs(dest.floor - floor);
        const stairs = floor >= 0 && dest.floor >= 0 && (span === 1 || (span === 2 && this.calls.length >= 3));
        if (stairs) {
          for (const p of this.pathOnFloor(floor, at, this.stairDoor(floor))) steps.push({ k: 'walk', ...p });
          for (const p of this.stairPath(floor, dest.floor)) steps.push({ k: 'climb', ...p });
          floor = dest.floor; at = this.stairDoor(floor);
        } else {
          for (const p of this.pathOnFloor(floor, at, this.liftSpot())) steps.push({ k: 'walk', ...p });
          steps.push({ k: 'lift', to: dest.floor });
          floor = dest.floor; at = this.liftSpot();
        }
      }
      const via = dest.via || [];
      for (const p of this.pathOnFloor(floor, at, via[0] || dest)) steps.push({ k: 'walk', ...p });
      for (const p of via.length ? via.slice(1).concat([dest]) : []) steps.push({ k: 'walk', x: p.x, z: p.z });
      at = { x: dest.x, z: dest.z, back: via.length ? via.slice().reverse() : null };
      return at;
    };
    for (const e of a.errands) {
      if (e === out) continue;
      const here = go(e.dest);
      steps.push(e.kind === 'out' ? { k: 'drive', errand: e } : { k: 'dwell', t: e.dwell, heading: e.heading, sit: e.sit, errand: e, at: here });
    }
    if (a.wantDesk && !a.skipDesk) { go({ floor: a.home.floor, ...a.seat }); steps.push({ k: 'sit' }); }
    else { go(a.home); steps.push({ k: 'idle' }); }
    a.steps = steps;
  }

  // Lúc rảnh, thỉnh thoảng xuống hầm lấy xe ra ngoài một lúc rồi lái về.
  sendOut(a) {
    const slot = this.parked.find((k) => !k.busy);
    if (!slot || this.drives.length >= 2) return;
    slot.busy = true;
    a.errands.push({ kind: 'out', dest: { floor: -1, x: slot.x, z: 4.3 }, slot, away: 7 + Math.random() * 7, release: () => { slot.busy = false; } });
    this.replan(a);
  }

  // ---- Giao thông ------------------------------------------------------------------------
  laneZ(lane) {
    return this.gate.zStreet + LANES[lane].dz;
  }

  // Mọi xe đang chiếm làn: xe trên đường (xe đang chuyển làn chiếm cả hai làn) và xe của nhân viên khi đã vào làn.
  laneOccupants() {
    const list = [];
    for (const t of this.traffic) {
      list.push({ lane: t.lane, x: t.car.position.x, v: t.v, ref: t });
      if (t.change) list.push({ lane: t.change.to, x: t.car.position.x, v: t.v, ref: t });
    }
    for (const e of this.drives) {
      const c = e.slot.car;
      if (!c.visible || c.position.y < -0.3) continue;
      // Xe đang rẽ vào hoặc ra khỏi làn vẫn chiếm làn tới khi cả thân xe rời làn.
      for (const lane of Object.keys(LANES)) if (Math.abs(c.position.z - this.laneZ(lane)) < 1.7) list.push({ lane, x: c.position.x, v: e.v, ref: e });
    }
    return list;
  }

  // Xe gần nhất phía trước trên cùng làn: { gap, v }.
  leader(occ, lane, x, dir, self) {
    let best = { gap: Infinity, v: Infinity };
    for (const o of occ) {
      const d = (o.x - x) * dir;
      if (o.lane === lane && o.ref !== self && d > 0.01 && d < best.gap) best = { gap: d, v: o.v };
    }
    return best;
  }

  gapAhead(occ, lane, x, dir, self) {
    return this.leader(occ, lane, x, dir, self).gap;
  }

  // Làn có trống quanh vị trí x không (phía sau và phía trước theo hướng chạy).
  laneFree(occ, lane, x, self, behind, ahead) {
    const dir = LANES[lane].dir;
    return !occ.some((o) => o.lane === lane && o.ref !== self && (o.x - x) * dir > -behind && (o.x - x) * dir < ahead);
  }

  // Tốc độ cho phép trên làn: giữ khoảng cách với xe trước và dừng đèn đỏ ở vạch.
  laneSpeed(occ, lane, x, self, vmax) {
    const dir = LANES[lane].dir, g = this.gate;
    let gap = Math.min(this.gapAhead(occ, lane, x, dir, self) - CAR_GAP, this.signalGap(dir, x));
    // Không dừng chắn lối ra vào hầm: nếu chỗ sẽ dừng rơi vào ô trước lối ra vào thì dừng trước ô.
    // (Xe nhân viên được miễn vì chính nó cần rẽ vào lối này.)
    if (lane === 'n1' && !(self && self.slot) && gap < Infinity) {
      const hi = g.x + 2.4 + 1.8, lo = g.x - 2.4 - 1.8, stop = x - gap;
      if (x > hi && stop < hi && stop > lo) gap = x - hi;
    }
    return Math.min(vmax, Math.max(0, gap * 1.3));
  }

  // Làn sát trụ sở trống ở đoạn xe ra sắp rẽ vào (xe trên làn này chạy từ phía +x tới).
  roadClear(self) {
    const g = this.gate;
    return !this.laneOccupants().some((o) => o.ref !== self && o.lane === 'n1' && o.x > g.x - 3 && o.x < g.x + 12);
  }

  updateTraffic(dt) {
    const g = this.gate, occ = this.laneOccupants();
    for (const t of this.traffic) {
      const x = t.car.position.x, L = LANES[t.lane];
      // Chuyển làn: bị xe chậm chặn thì sang làn vượt nếu đủ trống; đang ở làn vượt thì về làn phải khi đủ trống.
      t.cool -= dt;
      // Không chuyển làn gần vạch qua đường (vạch liền) và không nhập vào làn sát trụ sở ngay trước lối ra hầm.
      const noChange = Math.abs(x - g.cwX) < 7;
      if (!t.change && t.cool <= 0 && !noChange) {
        const lead = this.leader(occ, t.lane, x, t.dir, t);
        if (L.pass && lead.gap < 9 && lead.v < t.vmax - 0.4 && this.laneFree(occ, L.pass, x, t, 7, 9)) t.change = { to: L.pass, k: 0 };
        else if (L.keep && !(L.keep === 'n1' && Math.abs(x - g.x) < 6) && this.laneFree(occ, L.keep, x, t, 6, 10)) t.change = { to: L.keep, k: 0 };
        if (t.change) occ.push({ lane: t.change.to, x, v: t.v, ref: t }); // xe xét sau trong cùng khung hình thấy ngay
      }
      let want = this.laneSpeed(occ, t.lane, x, t, t.vmax);
      if (t.change) want = Math.min(want, this.laneSpeed(occ, t.change.to, x, t, t.vmax));
      t.v += THREE.MathUtils.clamp(want - t.v, -10 * dt, 3 * dt);
      const dx = t.dir * Math.max(0, t.v) * dt;
      t.car.position.x += dx;
      let dz = 0;
      if (t.change) {
        const k0 = t.change.k;
        t.change.k = Math.min(1, k0 + dt / 1.6);
        const z0 = this.laneZ(t.lane), z1 = this.laneZ(t.change.to), ease = (k) => k * k * (3 - 2 * k);
        const z = z0 + (z1 - z0) * ease(t.change.k);
        dz = z - t.car.position.z;
        t.car.position.z = z;
        if (t.change.k >= 1) { t.lane = t.change.to; t.change = null; t.cool = 4 + Math.random() * 3; }
      }
      if (Math.abs(dx) + Math.abs(dz) > 1e-5) t.car.rotation.y = Math.atan2(dx, dz); // mũi xe theo hướng chạy, nghiêng khi chuyển làn
      if ((t.car.position.x - g.mid) * t.dir > g.span) { // ra khỏi khung hình: vòng lại đầu đường khi đầu đường đang trống
        const start = g.mid - t.dir * g.span;
        if (!t.change && this.gapAhead(occ, t.lane, start - t.dir * 4, t.dir, t) > 9) { t.car.position.x = start; occ.push({ lane: t.lane, x: start, v: t.v, ref: t }); }
      }
    }
  }

  // Tuyến ra: chạy thẳng khỏi ô (xe đỗ quay đầu ra), dừng trước barie, lên ram, dừng ở vạch nhường đường, rẽ phải vào làn gần.
  routeOut(slot) {
    const g = this.gate, yb = -this.FH + 0.02, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const rampY = (z) => -this.FH + this.FH * (z - g.zCourt) / (g.zStreet - g.zCourt);
    return [
      { p: V(slot.x, yb, 5.3), v: 1.8 },
      { p: V(g.x, yb, 5.3), v: 2.6 },
      { p: V(g.x, yb, g.barrierZ - 1.8), v: 2.2, hold: () => this.barrier.rotation.z < 1.1 },
      { p: V(g.x, yb, g.zCourt), v: 2.4 },
      { p: V(g.x, rampY(g.zStreet - 1.7), g.zStreet - 1.7), v: 2.8, hold: (e) => !this.roadClear(e) },
      { p: V(g.x - 0.4, -0.02, g.zStreet + 0.5), v: 2.2 },
      { p: V(g.x - 1.8, -0.02, g.nearZ), v: 2.8, lane: 'n1' },
      { p: V(g.mid - g.span - 4, -0.02, g.nearZ), v: CAR_SPEED, lane: 'n1' },
    ];
  }

  // Tuyến về: chạy theo làn gần, giảm tốc rẽ phải vào ram, dừng chờ barie, chạy qua ô của mình rồi lùi vào ô.
  routeBack(slot) {
    const g = this.gate, yb = -this.FH + 0.02, V = (x, y, z) => new THREE.Vector3(x, y, z);
    const rampY = (z) => -this.FH + this.FH * (z - g.zCourt) / (g.zStreet - g.zCourt);
    const side = Math.sign(slot.x - g.x) || -1;
    return [
      { p: V(g.mid + g.span + 4, -0.02, g.nearZ), lane: 'n1' },
      { p: V(g.x + 1.9, -0.02, g.nearZ), v: CAR_SPEED, lane: 'n1' },
      { p: V(g.x + 0.5, -0.02, g.zStreet + 0.5), v: 1.8 },
      { p: V(g.x, rampY(g.zStreet - 0.3), g.zStreet - 0.3), v: 2.0 },
      { p: V(g.x, rampY(g.barrierZ + 1.8), g.barrierZ + 1.8), v: 2.4, hold: () => this.barrier.rotation.z < 1.1 },
      { p: V(g.x, yb, g.zCourt), v: 2.0 },
      { p: V(g.x, yb, g.barrierZ - 1.2), v: 2.0 },
      { p: V(g.x, yb, 5.3), v: 2.6 },
      { p: V(slot.x + side * 1.5, yb, 5.3), v: 2.0 },
      { p: V(slot.x, yb, 3.8), v: 1.0, rev: true },
      { p: V(slot.x, yb, 2.0), v: 0.9, rev: true },
    ];
  }

  // Chạy xe theo tuyến: tôn trọng điểm dừng (barie, nhường đường) và giữ khoảng cách khi đã vào làn.
  steerCar(e, dt) {
    const car = e.slot.car, pos = car.position;
    if (e.i >= e.path.length) return true;
    const t = e.path[e.i];
    let want = t.v || CAR_SPEED;
    if (t.hold && t.hold(e)) want = Math.min(want, Math.max(0, pos.distanceTo(t.p) - 0.02) * 1.6);
    if (t.lane) want = Math.min(want, this.laneSpeed(this.laneOccupants(), t.lane, pos.x, e, want));
    // Trong hầm và trên ram: giữ khoảng cách với xe nhân viên khác chạy phía trước.
    const fwd = t.p.clone().sub(pos);
    if (fwd.lengthSq() > 1e-6) {
      fwd.normalize();
      if (t.rev) fwd.negate();
      for (const o of this.drives) {
        if (o === e || !o.slot.car.visible) continue;
        const rel = o.slot.car.position.clone().sub(pos);
        const ahead = rel.dot(fwd), side = rel.clone().addScaledVector(fwd, -ahead).length();
        if (ahead > 0 && side < 1.3) want = Math.min(want, Math.max(0, (ahead - CAR_GAP) * 1.3));
      }
    }
    e.v += THREE.MathUtils.clamp(want - e.v, -10 * dt, 3.5 * dt);
    const before = pos.clone();
    let step = Math.max(0, e.v) * dt;
    while (step > 1e-5 && e.i < e.path.length) {
      const tt = e.path[e.i], d = pos.distanceTo(tt.p);
      if (step < d) { pos.lerp(tt.p, step / d); step = 0; }
      else { pos.copy(tt.p); step -= d; if (tt.hold && tt.hold(e)) { e.v = 0; break; } e.i++; }
    }
    const delta = pos.clone().sub(before);
    if (delta.lengthSq() > 1e-8) { // mũi xe theo hướng chạy; đoạn lùi thì mũi xe ngược hướng chạy
      if (e.path[Math.min(e.i, e.path.length - 1)].rev) delta.negate();
      const yaw = Math.atan2(delta.x, delta.z), pitch = -Math.atan2(delta.y, Math.hypot(delta.x, delta.z));
      car.rotation.order = 'YXZ';
      let d = yaw - car.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      car.rotation.y += d * Math.min(1, dt * 7);
      car.rotation.x += (pitch - car.rotation.x) * Math.min(1, dt * 7);
    }
    return e.i >= e.path.length;
  }

  // Một bước lái xe của nhân viên: ra khỏi hầm, vắng mặt một lúc, lái về và lùi vào ô đỗ.
  drive(a, e, dt) {
    const car = e.slot.car;
    if (!e.phase) { // lên xe
      e.phase = 'out'; e.path = this.routeOut(e.slot); e.i = 0; e.v = 0;
      a.body.g.visible = false;
      this.drives.push(e);
    }
    if (a.wantDesk) e.recall = true; // có việc: quay xe về ngay
    if (e.phase === 'away') {
      e.away -= dt;
      const g = this.gate;
      const spawnClear = !this.laneOccupants().some((o) => o.lane === 'n1' && o.x > g.mid + g.span - 6);
      if ((e.away <= 0 || e.recall) && spawnClear) {
        e.phase = 'back'; e.path = this.routeBack(e.slot); e.i = 1; e.v = CAR_SPEED;
        car.position.copy(e.path[0].p); car.rotation.set(0, -Math.PI / 2, 0); car.visible = true;
      }
      return;
    }
    const finished = this.steerCar(e, dt);
    a.body.g.position.copy(car.position); // bong bóng việc (nếu có) đi theo xe
    if (!finished) return;
    if (e.phase === 'out') { e.phase = 'away'; car.visible = false; if (e.recall) e.away = 0; return; }
    // Đã lùi vào ô: xuống xe.
    car.position.copy(e.slot.bay); car.rotation.set(0, 0, 0);
    this.drives = this.drives.filter((k) => k !== e);
    a.body.g.visible = true;
    a.floor = -1; a.x = e.slot.x; a.z = 4.3;
    a.body.g.position.set(a.x, -this.FH, a.z);
    e.phase = null;
    if (e.release) e.release();
    a.errands = a.errands.filter((k) => k !== e);
    a.steps.shift();
  }

  dropErrands(a, kind) {
    a.errands = a.errands.filter((e) => { if (e.kind !== kind) return true; if (e.release) e.release(); return false; });
  }

  // Lúc rảnh, thỉnh thoảng lên khu đào tạo ngồi nghe một lúc.
  sendToTraining(a) {
    const seat = (this.trainSeats || []).find((k) => !k.taken);
    if (!seat) return;
    seat.taken = true;
    a.errands.push({ kind: 'break', dest: { floor: seat.floor, x: seat.x, z: seat.z, via: seat.via }, dwell: 12 + Math.random() * 10, heading: Math.PI / 2, sit: true, release: () => { seat.taken = false; } });
    this.replan(a);
  }

  // Lúc rảnh, thỉnh thoảng xuống canteen đứng quầy hoặc ngồi góc cà phê một lúc.
  sendToCanteen(a) {
    const floor = this.floors.findIndex((f) => f.kind === 'canteen');
    if (floor < 0) return;
    this.canteenSpots = this.canteenSpots || [[5.8, 2.25, Math.PI], [8.4, 2.25, Math.PI], [11.2, 2.2, Math.PI], [12.2, 4.6, Math.PI / 2], [15.0, 4.5, -Math.PI / 2]].map(([x, z, heading]) => ({ x, z, heading, taken: false }));
    const spot = this.canteenSpots.find((k) => !k.taken);
    if (!spot) return;
    spot.taken = true;
    a.errands.push({ kind: 'break', dest: { floor, x: spot.x, z: spot.z }, dwell: 9 + Math.random() * 8, heading: spot.heading, release: () => { spot.taken = false; } });
    this.replan(a);
  }

  sync(s, text, animate) {
    const a = this.actors.get(s.id);
    if (!a) return;
    const want = Boolean(s.fixed) || s.status !== 'idle';
    const changed = want !== a.wantDesk;
    // Việc đã xong trước khi kịp họp hoặc lên nhận việc: bỏ buổi họp, buổi nhận việc chưa bắt đầu.
    const finished = animate && s.status === 'done' && a.status !== 'done' && !s.fixed;
    if (finished) {
      const now = a.steps[0] && a.steps[0].k === 'dwell' ? a.steps[0].errand : null;
      const before = a.errands.length;
      a.errands = a.errands.filter((e) => {
        if (e === now || (e.kind !== 'meet' && e.kind !== 'brief') || (e.meeting && e.meeting.endAt)) return true;
        if (e.release) e.release();
        return false;
      });
      if (a.errands.length !== before) this.replan(a);
      // Chưa kịp ngồi vào bàn mà việc đã xong: không đi về bàn nữa, về chỗ chờ luôn để không hiện trạng thái cũ.
      if (!(a.steps[0] && a.steps[0].k === 'sit')) { a.skipDesk = true; this.replan(a); }
    }
    if (a.skipDesk && (s.status === 'working' || s.status === 'idle')) { // có việc mới (hoặc hết hiện chữ Xong): quay lại lộ trình bình thường
      a.skipDesk = false;
      if (animate && s.status === 'working' && !changed) this.replan(a);
    }
    a.wantDesk = want;
    a.status = s.status;
    a.alert = s.alert;
    if (!animate) { // dựng lại từ lịch sử: đặt thẳng vào chỗ, không diễn cảnh đi lại
      this.leaveLifts(a);
      for (const e of a.errands) if (e.kind === 'out' && e.phase) { // đang lái xe: trả xe về ô ngay
        e.slot.car.position.copy(e.slot.bay); e.slot.car.rotation.set(0, 0, 0); e.slot.car.visible = true;
        this.drives = this.drives.filter((k) => k !== e);
        a.body.g.visible = true;
      }
      for (const kind of ['break', 'brief', 'out', 'meet']) this.dropErrands(a, kind);
      a.riding = false; a.floor = a.home.floor; a.yAbs = null; a.at = null;
      const p = want ? a.seat : a.home;
      a.x = p.x; a.z = p.z;
      a.steps = [{ k: want ? 'sit' : 'idle' }];
      a.body.g.position.set(a.x, a.floor * this.FH, a.z);
    } else if (changed) {
      if (want) { // có việc thì bỏ dở giờ nghỉ; chuyến xe chưa khởi hành cũng hủy
        this.dropErrands(a, 'break');
        a.errands = a.errands.filter((e) => { if (e.kind !== 'out' || e.phase) return true; e.release(); return false; });
      }
      this.replan(a);
    }
    const n = s.instances.size;
    a.bubble.firstChild.textContent = text ? (n > 1 ? `×${n} · ` : '') + text : '';
    a.bubble.classList.toggle('show', Boolean(text));
    a.bubble.classList.toggle('done', s.status === 'done' && !s.alert);
    a.bubble.classList.toggle('alert', s.alert);
    a.desk.strip.color.set(s.status === 'working' ? s.color : '#59636b');
    a.body.alert.visible = s.alert;
  }

  // ---- Tránh người -----------------------------------------------------------------------
  // Mọi người đang đứng hoặc đi trên cùng tầng (kể cả người đi đường ở mặt đất).
  walkers() {
    const list = [];
    for (const a of this.actors.values()) {
      if (a.riding || !a.body.g.visible || a.seated) continue;
      list.push({ ref: a, x: a.x, z: a.z, y: a.body.g.position.y, moving: a.moving, dx: a.dirX || 0, dz: a.dirZ || 0 });
    }
    for (const p of this.peds) if (p.body.g.visible) list.push({ ref: p, x: p.x + p.right.x * p.lane, z: p.z + p.right.z * p.lane, y: 0, moving: p.moving, queue: !p.moving, dx: Math.sin(p.heading), dz: Math.cos(p.heading) });
    return list;
  }

  // Người đi đối diện hoặc đứng chắn phía trước: nép sang phải (cả hai cùng nép nên đi qua nhau);
  // người phía trước đi cùng chiều mà chậm hơn: giảm tốc theo. Trả về hệ số tốc độ, đặt w.dodgeWant.
  yieldFactor(w, x, z, y) {
    const list = this.walkerCache || [];
    // Dùng hướng đi thật (không phải hướng quay mặt đã làm mượt) để vừa rẽ góc đã thấy người đối diện.
    const fx = w.dirX ?? Math.sin(w.heading ?? 0), fz = w.dirZ ?? Math.cos(w.heading ?? 0);
    let factor = 1, dodge = 0;
    for (const o of list) {
      if (o.ref === w || Math.abs(o.y - y) > 1.2) continue;
      const rx = o.x - x, rz = o.z - z;
      if (rx * rx + rz * rz > 7) continue;
      const ahead = rx * fx + rz * fz, side = rx * -fz + rz * fx;
      const dot = o.moving || o.queue ? o.dx * fx + o.dz * fz : 0;
      if (ahead > 0 && ahead <= 2.6 && Math.abs(side) <= 0.6) { // người ngay phía trước: nhìn đủ xa để kịp nép khi cả hai cùng đi nhanh
        if ((o.moving || o.queue) && dot > 0.5) factor = Math.min(factor, THREE.MathUtils.clamp((ahead - 0.55) / 0.6, 0, 1)); // sát người trước (kể cả người đang đứng chờ đèn cùng hướng) thì dừng hẳn, xếp hàng
        else dodge = DODGE;
        continue;
      }
      // Người đi cắt ngang (ví dụ gặp nhau ở góc hành lang): dự đoán điểm gần nhau nhất; nếu sẽ va
      // thì người thấy đối phương ở bên phải dừng nhường (nhường bên phải), người kia đi tiếp.
      if (!o.moving || Math.abs(dot) > 0.5) continue;
      const vx = o.dx - fx, vz = o.dz - fz, v2 = vx * vx + vz * vz;
      const tc = -(rx * vx + rz * vz) / v2;
      if (tc > 0 && tc < 2 && Math.hypot(rx + vx * tc, rz + vz * tc) < 0.75 && side > 0) factor = Math.min(factor, 0.05);
    }
    w.dodgeWant = dodge;
    return factor;
  }

  // ---- Giao việc ------------------------------------------------------------------------
  // Tùy quan hệ giữa hai người mà diễn khác nhau:
  //  - trưởng phòng giao cho người trong phòng, hoặc CEO giao cho trưởng phòng: các lần giao liền nhau
  //    được gom thành một cuộc họp, rồi chọn phòng vừa đủ chỗ;
  //  - người giao ở tầng khác: người nhận đi tới bàn người giao nhận việc;
  //  - còn lại: tờ giấy bay từ người giao sang bàn người nhận.
  paper(from, to, color) {
    const A = this.actors.get(from.id), B = this.actors.get(to.id);
    if (!A || !B || A === B) return;
    if (B.s.fixed) return this.paperFlight(A, B, color);
    if (A.s.fixed || (A.s.lead && A.s.dept === B.s.dept)) {
      let p = this.pending.find((k) => k.host === A);
      if (!p) this.pending.push(p = { host: A, people: [], t: performance.now(), color }); // gom theo đồng hồ thật: sự kiện tới theo thời gian thật
      if (!p.people.includes(B)) p.people.push(B);
      return;
    }
    this.visit(A, B, color);
  }

  // Chốt cuộc họp sau khi đã gom xong: CEO họp từ hai trưởng phòng trở lên ở phòng họp hội đồng;
  // trưởng phòng họp ở phòng nhỏ nhất đủ chỗ. Hết phòng thì quay về cách giao từng người.
  book(p) {
    const A = p.host, n = p.people.length;
    const fits = (r) => !r.busy && r.seats.length + (r.presenter ? 1 : 0) >= n + 1;
    const room = A.s.fixed
      ? (n >= 2 ? this.rooms.find((r) => r.kind === 'board' && fits(r)) : null)
      : this.rooms.filter((r) => r.kind === 'meeting' && fits(r)).sort((x, y) => x.seats.length - y.seats.length)[0];
    if (room) return this.startMeeting(A, p.people, room);
    for (const B of p.people) this.visit(A, B, p.color);
  }

  startMeeting(host, people, room) {
    room.busy = true;
    const members = [host, ...people];
    const m = { members: new Set(members), here: new Set(), created: this.simTime, length: 3.5 + 1 * people.length, room };
    const spots = room.presenter ? [room.presenter, ...room.seats] : room.seats;
    members.forEach((a, i) => {
      const spot = spots[i];
      a.errands.push({
        kind: 'meet', meeting: m, host: a === host && Boolean(room.presenter),
        dest: { floor: room.floor, x: spot.x, z: spot.z, via: spot.via }, heading: spot.heading, sit: !(room.presenter && i === 0),
        release: () => { m.members.delete(a); m.here.delete(a); if (!m.members.size) room.busy = false; },
      });
      this.replan(a);
    });
  }

  visit(A, B, color) {
    if (B.s.fixed || A.home.floor === B.home.floor) return this.paperFlight(A, B, color);
    if (B.errands.some((e) => e.kind === 'brief')) return;
    B.errands.push({ kind: 'brief', dest: { floor: A.home.floor, x: A.visitor.x, z: A.visitor.z }, dwell: 2.5, heading: -Math.PI / 2 });
    this.replan(B);
  }

  // ---- Hiệu ứng ------------------------------------------------------------------------
  // Tờ giấy giao việc bay từ người giao sang bàn người nhận (vòng ra mặt tiền nếu khác tầng).
  paperFlight(A, B, color) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.016, 0.4), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }));
    if (color) { // viền màu của phiên Claude Code
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.018, 0.08), new THREE.MeshBasicMaterial({ color, toneMapped: false }));
      edge.position.z = -0.16;
      m.add(edge);
    }
    this.scene.add(m);
    const p0 = A.body.g.position.clone(); p0.y += 1.1;
    const p1 = new THREE.Vector3(B.deskPos.x, B.home.floor * this.FH + 0.75, B.deskPos.z - 0.9);
    const sameFloor = A.home.floor === B.home.floor;
    const out = sameFloor ? 0 : this.FD - Math.min(p0.z, p1.z) + 1.2;
    this.effects.push({
      t: 0, dur: sameFloor ? 1.0 : 1.5,
      step: (k) => {
        m.position.lerpVectors(p0, p1, k);
        const arc = Math.sin(Math.PI * k);
        m.position.z += arc * out;
        m.position.y += arc * (sameFloor ? 1.0 : 0.4);
        m.rotation.set(k * 5, k * 7, 0);
      },
      end: () => { this.scene.remove(m); m.geometry.dispose(); },
    });
  }

  celebrate(s) {
    const a = this.actors.get(s.id);
    if (!a) return;
    a.cheer = 1.8;
    const floorY = a.body.g.position.y;
    const origin = a.body.g.position.clone(); origin.y += PERSON_H + 0.1;
    const bits = [];
    for (let i = 0; i < 30; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), new THREE.MeshBasicMaterial({ color: CONFETTI[i % CONFETTI.length], side: THREE.DoubleSide, toneMapped: false }));
      m.position.copy(origin);
      this.scene.add(m);
      const ang = Math.random() * Math.PI * 2, sp = 0.5 + Math.random() * 1.0;
      bits.push({ m, v: new THREE.Vector3(Math.cos(ang) * sp, 1.6 + Math.random() * 1.3, Math.sin(ang) * sp), r: Math.random() * 8 });
    }
    let last = 0;
    this.effects.push({
      t: 0, dur: 1.8,
      step: (k) => {
        const dt = (k - last) * 1.8; last = k;
        for (const b of bits) {
          b.v.y -= 4.2 * dt;
          b.m.position.addScaledVector(b.v, dt);
          if (b.m.position.y < floorY + 0.05) { b.m.position.y = floorY + 0.05; b.v.set(0, 0, 0); }
          b.m.rotation.set(b.r + k * 9, b.r * 2 + k * 7, 0);
        }
      },
      end: () => bits.forEach((b) => { this.scene.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); }),
    });
  }

  // ---- Vòng lặp vẽ -----------------------------------------------------------------------
  animate(a, dt, time) {
    const { body } = a;
    const g = body.g.position;
    const step = a.steps[0];
    let heading = a.heading, anim = 'idle', typing = false, lift = 0, seated = false, moving = false;
    a.cheer = Math.max(0, a.cheer - dt);

    const sitAtDesk = () => { // ngồi bàn: xong việc thì gật đầu, chờ duyệt thì giơ tay gọi sếp, đang làm thì gõ phím
      heading = Math.PI / 2; lift = SEAT_LIFT; seated = true;
      if (a.alert) anim = 'interact-right';
      else if (a.cheer > 0) anim = 'emote-yes';
      else { anim = 'sit'; typing = a.status === 'working'; }
    };

    if (a.riding) {
      heading = Math.PI;                                  // trong cabin: quay mặt về phía tòa nhà
    } else if (!step) {
      heading = 0;
    } else if (step.k === 'walk') {
      a.at = null;
      const dx = step.x - a.x, dz = step.z - a.z, dist = Math.hypot(dx, dz);
      if (dist > 0.01) { heading = Math.atan2(dx, dz); a.dirX = dx / dist; a.dirZ = dz / dist; }
      const move = WALK_SPEED * (a.wantDesk ? HURRY : 1) * this.yieldFactor(a, a.x, a.z, a.body.g.position.y) * dt;
      if (dist <= move) { a.x = step.x; a.z = step.z; a.steps.shift(); }
      else { a.x += dx / dist * move; a.z += dz / dist * move; }
      moving = true;
      anim = 'walk';
    } else if (step.k === 'climb') { // trên thang bộ: đi theo 3 chiều, chậm hơn đi bộ thường
      const y0 = a.yAbs ?? a.floor * this.FH;
      const dx = step.x - a.x, dy = step.y - y0, dz = step.z - a.z, dist = Math.hypot(dx, dy, dz);
      const flat = Math.hypot(dx, dz);
      if (flat > 0.01) { a.dirX = dx / flat; a.dirZ = dz / flat; }
      const move = STAIR_SPEED * this.yieldFactor(a, a.x, a.z, y0) * dt; // người lên, người xuống cùng vế thang thì nép sang phải
      if (dist <= move) {
        a.x = step.x; a.z = step.z; a.yAbs = step.y; a.steps.shift();
        if (!a.steps[0] || a.steps[0].k !== 'climb') { a.floor = Math.round(step.y / this.FH); a.yAbs = null; }
      } else { a.x += dx / dist * move; a.z += dz / dist * move; a.yAbs = y0 + dy / dist * move; }
      if (Math.hypot(dx, dz) > 0.01) { heading = Math.atan2(dx, dz); a.dirX = dx / Math.hypot(dx, dz); a.dirZ = dz / Math.hypot(dx, dz); }
      moving = true;
      anim = 'walk';
    } else if (step.k === 'lift') {
      if (step.to === a.floor) a.steps.shift();
      else if (!step.called) { step.called = true; this.calls.push({ a, from: a.floor, to: step.to }); }
      // Xếp hàng chờ thang: mỗi người một chỗ trước cửa cabin, không đứng chồng lên nhau.
      const queue = this.calls.filter((c) => c.from === a.floor);
      const k = Math.max(0, queue.findIndex((c) => c.a === a)), spot = this.liftSpot();
      const qx = spot.x + ((k % 4) - 1.5) * 0.5, qz = spot.z - Math.floor(k / 4) * 0.5;
      const qd = Math.hypot(qx - a.x, qz - a.z);
      if (qd > 0.03) { const mv = Math.min(qd, WALK_SPEED * dt); a.x += (qx - a.x) / qd * mv; a.z += (qz - a.z) / qd * mv; anim = 'walk'; heading = Math.atan2(qx - a.x, qz - a.z); }
      else heading = 0;                                   // đứng chờ thang, quay mặt ra cabin
    } else if (step.k === 'dwell') {
      heading = step.heading ?? 0;
      a.at = step.at;
      if (step.sit) { anim = 'sit'; lift = SEAT_LIFT; seated = true; }
      else if (step.errand && step.errand.host) anim = Math.sin(time * 0.9 + a.phase) > 0.1 ? 'interact-right' : 'idle'; // người chủ trì đứng trình bày
      else anim = Math.sin(time * 1.1 + a.phase) > 0.55 ? 'emote-yes' : 'idle';
      const m = step.errand && step.errand.meeting;
      let done;
      if (m) { // họp: chờ đủ người mới bắt đầu, họp xong cả phòng cùng ra
        m.here.add(a);
        if (!m.endAt && m.members.size <= 1) m.endAt = this.simTime;   // người dự đã rút hết: chủ trì rời phòng
        if (!m.endAt && ([...m.members].every((x) => m.here.has(x)) || this.simTime - m.created > 30)) m.endAt = this.simTime + m.length;
        if (!m.order) m.order = new Map();
        if (!m.order.has(a)) m.order.set(a, m.order.size);
        done = m.endAt && this.simTime >= m.endAt + 0.6 * m.order.get(a); // họp xong, mọi người rời phòng lần lượt
      } else { step.t -= dt; done = step.t <= 0; }
      if (done) {
        if (step.errand && step.errand.release) step.errand.release();
        a.errands = a.errands.filter((e) => e !== step.errand);
        a.steps.shift();
      }
    } else if (step.k === 'drive') {
      this.drive(a, step.errand, dt);
    } else if (step.k === 'sit') {
      sitAtDesk();
    } else { // 'idle': đứng ở góc tiếp khách, nhìn quanh, thỉnh thoảng ra hiệu, rồi có lúc xuống canteen
      heading = Math.sin(time * 0.3 + a.phase) * 0.9 + (a.home.x > this.FW / 2 ? -0.5 : 0.5);
      if (a.cheer > 0) anim = 'jump';
      else {
        a.gesture -= dt;
        if (a.gesture < 0) { a.gesture = 8 + Math.random() * 16; a.gestureEnd = time + 1.6; a.gestureAnim = Math.random() < 0.5 ? 'emote-yes' : 'interact-left'; }
        if (time < a.gestureEnd) anim = a.gestureAnim;
      }
      a.rest -= dt;
      if (a.rest < 0) { // hết đứng chờ: xuống canteen, lấy xe ra ngoài, hoặc đứng tiếp
        a.rest = 25 + Math.random() * 40;
        const pick = Math.random();
        if (pick < 0.4) this.sendToCanteen(a); else if (pick < 0.6) this.sendToTraining(a); else if (pick < 0.85) this.sendOut(a);
      }
    }

    this.play(a, anim);
    body.mixer.update(dt);
    if (typing) { // gõ phím: hai tay nhấp nhô sau khi hoạt ảnh ngồi đã áp vào xương
      a.phase += dt * 14;
      body.arms.forEach((bone, i) => { bone.rotation.x += Math.sin(a.phase + i * 2.3) * 0.2; });
    }
    if (a.alert) body.alert.position.y = PERSON_H + 0.42 + Math.sin(time * 6) * 0.05;

    const driving = step && step.k === 'drive' && step.errand.phase;
    if (!a.riding && !driving) { // trong cabin hoặc trên xe thì vị trí do thang máy, xe đặt
      a.dodge = (a.dodge || 0) + ((moving ? a.dodgeWant || 0 : 0) - (a.dodge || 0)) * Math.min(1, dt * 8);
      g.x = a.x - (a.dirZ || 0) * a.dodge; g.z = a.z + (a.dirX || 0) * a.dodge; // nép sang phải theo hướng đi
      if (a.yAbs != null) g.y = a.yAbs;
      else g.y += (a.floor * this.FH + lift - g.y) * Math.min(1, dt * 8);
    }
    // Quay người theo đường ngắn nhất.
    let d = heading - a.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    a.heading += d * Math.min(1, dt * 9);
    body.g.rotation.y = a.heading;
    a.seated = seated;
    a.moving = moving;
  }

  project(v, el, dy = 0) {
    this.tmp = this.tmp || new THREE.Vector3();
    const p = this.tmp.copy(v).project(this.camera);
    if (p.z > 1) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.style.transform = `translate(${((p.x * 0.5 + 0.5) * this.w).toFixed(1)}px, ${((-p.y * 0.5 + 0.5) * this.h + dy).toFixed(1)}px)`;
  }

  // Một bước mô phỏng: người, xe, thang máy, đèn. Gọi nhiều lần mỗi khung hình nếu khung hình dài.
  simulate(dt) {
    this.simTime = (this.simTime || 0) + dt;
    const time = this.simTime;
    if (this.pending.length) this.pending = this.pending.filter((p) => { if (performance.now() - p.t < 1200) return true; this.book(p); return false; });
    this.walkerCache = this.walkers();
    for (const a of this.actors.values()) this.animate(a, dt, time);
    this.updatePeds(dt, time);
    this.updateSignal(dt);
    for (const n of this.npcs) { // lễ tân, bảo vệ: đứng trực, thỉnh thoảng ra hiệu
      n.next -= dt;
      if (n.next < 0) {
        n.next = 7 + Math.random() * 12;
        n.until = time + 1.6;
        this.play({ body: n.body }, n.gestures[Math.floor(Math.random() * n.gestures.length)]);
      } else if (time > n.until) this.play({ body: n.body }, 'idle');
      n.body.mixer.update(dt);
      n.body.g.rotation.y = n.heading + Math.sin(time * 0.4 + n.phase) * 0.45;
    }
    for (const L of this.lifts) this.updateLift(L, dt);
    if (this.barrier) { // barie tự nâng khi có xe ở gần chân ram
      const g = this.gate;
      const near = this.drives.some((e) => { const p = e.slot.car.position; return e.phase !== 'away' && p.y < -0.8 && Math.abs(p.x - g.x) < 2.2 && Math.abs(p.z - g.barrierZ) < 3.2; });
      this.barrier.rotation.z += ((near ? 1.25 : 0) - this.barrier.rotation.z) * Math.min(1, dt * 5);
    }
    this.updateTraffic(dt);
  }

  frame() {
    const raw = Math.min(this.clock.getDelta(), 0.25);
    const dt = raw * (this.timeScale || 1); // timeScale: tua nhanh khi kiểm thử
    // Máy chậm (khung hình dài): chia mô phỏng thành các bước nhỏ để người không đi xuyên qua nhau, xe không vượt nhau.
    const n = Math.min(24, Math.max(1, Math.ceil(dt / 0.04)));
    for (let k = 0; k < n; k++) this.simulate(dt / n);
    this.effects = this.effects.filter((e) => {
      e.t += dt;
      const k = Math.min(1, e.t / e.dur);
      e.step(k);
      if (k >= 1) { e.end(); return false; }
      return true;
    });
    if (this.goal) { // máy quay lướt mượt tới điểm cần xem
      const k = 1 - Math.exp(-raw * 3.0);
      this.controls.target.lerp(this.goal.target, k);
      this.camera.position.lerp(this.goal.pos, k);
      if (this.camera.position.distanceTo(this.goal.pos) < 0.03) this.goal = null;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const head = this.head || (this.head = new THREE.Vector3());
    // Biển tên bàn và tên dưới chân chỉ hiện khi tới gần; ở toàn cảnh chỉ còn bong bóng việc và biển tầng.
    this.labels.classList.toggle('near', this.camera.position.distanceTo(this.controls.target) < this.fitDist * 0.62);
    for (const a of this.actors.values()) {
      const g = a.body.g.position;
      const top = (a.seated ? PERSON_H * 0.98 : PERSON_H + 0.1) + (a.alert ? 0.5 : 0);
      this.project(head.set(g.x, g.y + top - (a.seated ? SEAT_LIFT : 0), g.z), a.bubble);
      this.project(a.deskPos, a.plate);
      a.name.classList.toggle('show', !a.seated);
      if (!a.seated) this.project(head.set(g.x, g.y, g.z + 0.12), a.name, 4);
    }
    for (const v of this.vacant) this.project(v.pos, v.plate);
    for (const n of this.npcs) { n.label.classList.add('show'); this.project(n.pos, n.label, 4); }
  }

  // ---- Khung nhìn ---------------------------------------------------------------------------
  // Lùi máy quay cho tới khi cả tòa nhà, biển trên mái và thềm trước nằm gọn trong khung.
  fitCamera(dir) {
    const { FW, FD, H } = this;
    const pts = [];
    for (const x of [-2.0, FW + 2.0]) for (const z of [-0.4, FD + 1.6]) for (const y of [-this.FH - 0.5, H + 2.9]) pts.push(new THREE.Vector3(x, y, z));
    pts.push(new THREE.Vector3(-0.8, -this.FH - 0.5, FD + 7), new THREE.Vector3(FW + 0.8, -this.FH - 0.5, FD + 7));
    const v = new THREE.Vector3();
    for (let dist = 12; dist < 110; dist += 0.5) {
      this.camera.position.copy(this.center).addScaledVector(dir, dist);
      this.camera.lookAt(this.center);
      this.camera.updateMatrixWorld();
      this.fitDist = dist;
      if (pts.every((p) => { v.copy(p).project(this.camera); return Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.95; })) return;
    }
  }

  // Lướt tới gần một nhân viên (góc thấp, nhìn rõ mặt).
  focusStaff(id) {
    const a = this.actors.get(id);
    if (!a) return;
    const target = new THREE.Vector3(a.deskPos.x - 0.2, a.home.floor * this.FH + 0.95, a.deskPos.z - 0.9);
    this.goal = { target, pos: target.clone().add(new THREE.Vector3(3.0, 0.9, 4.6)) };
    this.userMoved = true;
  }

  // Lướt tới một tầng: nhận mã phòng ban, mã tầng hoặc số thứ tự tầng.
  focusFloor(id) {
    const i = id === 'parking' ? -1 : typeof id === 'number' ? id : this.floors.findIndex((f) => f.dept === id || f.id === id);
    if (id !== 'parking' && (i < 0 || i >= this.floors.length)) return;
    if (id === 'parking') { // hầm nằm dưới mặt đất: đặt máy quay trong sân trũng, nhìn chéo vào dãy xe
      this.goal = {
        target: new THREE.Vector3(this.FW * 0.56, -this.FH + 0.9, 2.4),
        pos: new THREE.Vector3(this.FW * 0.2, -this.FH + 2.1, this.FD + 5.7),
      };
      this.userMoved = true;
      return;
    }
    const target = new THREE.Vector3(this.FW / 2, i * this.FH + 1.0, this.FD / 2 - 0.4);
    const back = (this.FW / 2 + 1.2) / Math.tan(Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect));
    this.goal = { target, pos: target.clone().add(new THREE.Vector3(back * 0.2, 2.3, back)) };
    this.userMoved = true;
  }

  overview() {
    const pos = this.camera.position.clone(), target = this.controls.target.clone();
    this.resetCamera();
    this.goal = { target: this.controls.target.clone(), pos: this.camera.position.clone() };
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
  }

  resetCamera() {
    const yaw = THREE.MathUtils.degToRad(24), pitch = THREE.MathUtils.degToRad(11);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    this.fitCamera(dir);
    this.controls.target.copy(this.center);
    this.controls.update();
    this.userMoved = false;
    this.goal = null;
  }

  resize() {
    const width = this.el.parentElement.clientWidth || 800;
    this.w = width;
    this.h = Math.round(Math.min(Math.max(width * 0.78, 420), Math.max(420, window.innerHeight * 0.86)));
    this.el.style.height = this.h + 'px';
    this.renderer.setSize(this.w, this.h);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    if (!this.userMoved) this.resetCamera();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    for (const t of this.textures.values()) t.dispose();
    this.renderer.dispose();
    this.el.remove();
  }
}
