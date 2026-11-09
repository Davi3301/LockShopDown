'use strict';
/* =========================================================
   LOCKSHOPDOWN — FASE 1: 3 minutos de saque
   Mapa em grade, câmera, prateleiras para revistar,
   persianas que fecham em etapas, Calmos com IA, iluminação.
   ========================================================= */

const TILE = 40, COLS = 52, ROWS = 32, WW = COLS * TILE, WH = ROWS * TILE;
let VW = 960, VH = 600;
/* a visão se adapta ao formato da tela, para o mapa ocupar a tela inteira */
function fitView() {
  if (!S.cv) return;
  const r = S.cv.parentElement.getBoundingClientRect();
  const asp = clamp((r.width || 960) / Math.max(1, r.height || 600), .45, 2.8);
  VH = 640; VW = Math.round(VH * asp);
  if (VW > WW) { VW = WW; VH = Math.round(WW / asp); }
  if (S.cv.width !== VW || S.cv.height !== VH) { S.cv.width = VW; S.cv.height = VH; }
  if (S.light && (S.light.width !== VW || S.light.height !== VH)) { S.light.width = VW; S.light.height = VH; }
}
addEventListener('resize', () => { if (Screen.cur === 'run') fitView(); });
const T_WALL = 0, T_FLOOR = 1, T_GLASS = 2, T_DOOR = 3, T_FURN = 4;
const DIR8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/* ---------------- lojas ---------------- */
const ZONES = {
  super: { name: 'SUPERMERCADO BOM PREÇO', x: 0, y: 0, w: 15, h: 12, door: [6, 3], color: '#4ade80', closeAt: 0 },
  farm:  { name: 'DROGARIA VIDA+', x: 14, y: 0, w: 9, h: 12, door: [17, 3], color: '#f472b6', closeAt: 55 },
  ferr:  { name: 'FERRAGENS DO ZÉ', x: 22, y: 0, w: 9, h: 12, door: [25, 3], color: '#fb923c', closeAt: 105 },
  elet:  { name: 'ELETRO MEGA', x: 30, y: 0, w: 11, h: 12, door: [34, 3], color: '#60a5fa', closeAt: 80 },
  cine:  { name: 'CINE LOCKSHOP', x: 40, y: 0, w: 12, h: 12, door: [44, 3], color: '#f43f5e', sealed: true },
  pet:   { name: 'PET MANIA', x: 0, y: 20, w: 9, h: 12, door: [3, 3], color: '#facc15', closeAt: 0 },
  moda:  { name: 'MODA FASHION', x: 8, y: 20, w: 11, h: 12, door: [12, 3], color: '#c084fc', closeAt: 0 },
  depot: { name: 'DEPÓSITO 3B', x: 18, y: 20, w: 8, h: 12, door: [20, 3], color: '#ef4444', depot: true, closeAt: 0 },
  brinq: { name: 'BRINQUEDOLÂNDIA', x: 25, y: 20, w: 9, h: 12, door: [28, 3], color: '#38bdf8', closeAt: 135 },
  praca: { name: 'PRAÇA DE ALIMENTAÇÃO', x: 33, y: 20, w: 19, h: 12, door: [36, 13], color: '#2dd4bf', closeAt: 0 },
};
Object.entries(ZONES).forEach(([id, z]) => { z.id = id; z.north = z.y === 0; z.frontRow = z.north ? z.y + z.h - 1 : z.y; });

/* ---------------- móveis ----------------
   pool: itens possíveis (null = vazio), n: [min,max], fixed: sempre, maybe: {k,p}
------------------------------------------ */
const LAYOUT = [
  // Supermercado
  { z: 'super', k: 'fridge', x: 2, y: 1, w: 3, h: 1, pool: ['agua', 'agua'], n: [1, 2], time: 1.1 },
  { z: 'super', k: 'fridge', x: 6, y: 1, w: 3, h: 1, pool: ['agua', 'agua', 'comida'], n: [1, 2], time: 1.1 },
  { z: 'super', k: 'fridge', x: 10, y: 1, w: 3, h: 1, pool: ['agua', 'agua', null], n: [1, 1], time: 1.1, freezer: true },
  { z: 'super', k: 'shelf', x: 2, y: 3, w: 4, h: 1, pool: ['comida', 'comida', null], n: [1, 2], time: 1.1 },
  { z: 'super', k: 'shelf', x: 8, y: 3, w: 5, h: 1, pool: ['comida', null], n: [1, 2], time: 1.1 },
  { z: 'super', k: 'shelf', x: 2, y: 5, w: 4, h: 1, pool: ['comida', 'remedio', null], n: [1, 1], time: 1.1 },
  { z: 'super', k: 'shelf', x: 8, y: 5, w: 5, h: 1, pool: ['comida', 'comida', 'pilhas'], n: [1, 2], time: 1.1 },
  { z: 'super', k: 'shelf', x: 2, y: 7, w: 4, h: 1, pool: ['agua', 'agua', 'comida'], n: [1, 1], time: 1.1 },
  { z: 'super', k: 'shelf', x: 8, y: 7, w: 5, h: 1, pool: ['comida', null], n: [1, 1], time: 1.1 },
  { z: 'super', k: 'counter', x: 2, y: 9, w: 2, h: 1, pool: ['pilhas', 'cafe', null], n: [1, 1], time: .7 },
  { z: 'super', k: 'counter', x: 10, y: 9, w: 2, h: 1, pool: ['comida', null], n: [1, 1], time: .7 },
  // Drogaria
  { z: 'farm', k: 'shelf', x: 15, y: 1, w: 3, h: 1, pool: ['remedio', 'mascara'], n: [1, 2], time: 1, tint: '#f8c8dc' },
  { z: 'farm', k: 'shelf', x: 19, y: 1, w: 3, h: 1, pool: ['remedio', 'mascara', 'cafe'], n: [1, 1], time: 1, tint: '#f8c8dc' },
  { z: 'farm', k: 'counter', x: 16, y: 4, w: 5, h: 1, fixed: ['termometro'], pool: ['remedio', null], n: [0, 1], time: 1.2 },
  { z: 'farm', k: 'fridge', x: 21, y: 6, w: 1, h: 2, maybe: { k: 'kit', p: .7 }, pool: ['remedio', 'agua'], n: [1, 1], time: 1 },
  { z: 'farm', k: 'shelf', x: 15, y: 6, w: 1, h: 3, pool: ['mascara', 'remedio', null], n: [1, 1], time: 1, tint: '#f8c8dc' },
  // Ferragens
  { z: 'ferr', k: 'tools', x: 23, y: 1, w: 7, h: 1, fixed: ['marreta'], pool: ['pilhas', null], n: [0, 1], time: 1.3 },
  { z: 'ferr', k: 'shelf', x: 23, y: 3, w: 1, h: 5, maybe: { k: 'extintor', p: .6 }, pool: ['tabuas', 'pilhas', 'fita'], n: [1, 1], time: 1, tint: '#f4c08a' },
  { z: 'ferr', k: 'shelf', x: 29, y: 3, w: 1, h: 5, pool: ['tabuas', null, 'pilhas'], n: [1, 1], time: 1, tint: '#f4c08a' },
  { z: 'ferr', k: 'lumber', x: 25, y: 4, w: 3, h: 2, fixed: ['tabuas'], pool: ['tabuas', null], n: [0, 1], time: 1.4 },
  // Eletro Mega
  { z: 'elet', k: 'shelf', x: 31, y: 1, w: 4, h: 1, pool: ['pilhas', 'pilhas', null], n: [1, 1], time: 1, tint: '#a8c8ff' },
  { z: 'elet', k: 'shelf', x: 36, y: 1, w: 4, h: 1, maybe: { k: 'walkie', p: .6 }, pool: ['pilhas', null], n: [1, 1], time: 1, tint: '#a8c8ff' },
  { z: 'elet', k: 'tvtable', x: 32, y: 4, w: 2, h: 1, maybe: { k: 'lanterna', p: .85 }, pool: [null], n: [0, 0], time: 1.1 },
  { z: 'elet', k: 'tvtable', x: 37, y: 4, w: 2, h: 1, maybe: { k: 'videogame', p: .8 }, pool: ['pilhas', null], n: [0, 1], time: 1.1 },
  { z: 'elet', k: 'counter', x: 33, y: 7, w: 4, h: 1, maybe: { k: 'radio', p: .75 }, pool: ['pilhas', null], n: [0, 1], time: 1.4 },
  // Pet Mania
  { z: 'pet', k: 'cage', x: 1, y: 29, w: 3, h: 2, dog: true, pool: [null], n: [0, 0], time: 1 },
  { z: 'pet', k: 'cage', x: 5, y: 29, w: 3, h: 2, pool: ['racao', null], n: [1, 1], time: 1 },
  { z: 'pet', k: 'shelf', x: 1, y: 23, w: 1, h: 4, pool: ['racao', 'racao', null], n: [1, 1], time: 1, tint: '#ffe08a' },
  { z: 'pet', k: 'shelf', x: 7, y: 23, w: 1, h: 4, pool: ['racao', 'agua', 'agua'], n: [1, 1], time: 1, tint: '#ffe08a' },
  { z: 'pet', k: 'aquarium', x: 3, y: 25, w: 3, h: 1, deco: true },
  // Moda
  { z: 'moda', k: 'rack', x: 10, y: 24, w: 1, h: 1, pool: ['cobertor', null], n: [1, 1], time: .8 },
  { z: 'moda', k: 'rack', x: 16, y: 24, w: 1, h: 1, pool: ['mascara', null], n: [1, 1], time: .8 },
  { z: 'moda', k: 'rack', x: 10, y: 27, w: 1, h: 1, pool: ['cobertor', 'mascara', null], n: [1, 1], time: .8 },
  { z: 'moda', k: 'rack', x: 13, y: 27, w: 1, h: 1, pool: [null, 'cobertor'], n: [1, 1], time: .8 },
  { z: 'moda', k: 'rack', x: 16, y: 27, w: 1, h: 1, pool: ['cobertor', null], n: [1, 1], time: .8 },
  { z: 'moda', k: 'provador', x: 14, y: 29, w: 4, h: 2, hide: true, pool: ['cobertor', null], n: [0, 1], time: 1.2 },
  { z: 'moda', k: 'counter', x: 9, y: 30, w: 3, h: 1, pool: ['pilhas', 'comida', null], n: [1, 1], time: .8 },
  { z: 'moda', k: 'mannequin', x: 10, y: 22, w: 1, h: 1, deco: true },
  { z: 'moda', k: 'mannequin', x: 16, y: 22, w: 1, h: 1, deco: true },
  // Depósito
  { z: 'depot', k: 'crates', x: 19, y: 29, w: 2, h: 2, deco: true },
  { z: 'depot', k: 'crates', x: 23, y: 29, w: 2, h: 2, deco: true },
  // Brinquedolândia
  { z: 'brinq', k: 'shelf', x: 26, y: 23, w: 1, h: 4, pool: ['comida', 'pilhas', null], n: [1, 1], time: 1, tint: '#ffb3d9' },
  { z: 'brinq', k: 'shelf', x: 32, y: 23, w: 1, h: 4, maybe: { k: 'baralho', p: .6 }, pool: ['videogame', 'comida', null], n: [1, 1], time: 1, tint: '#ffb3d9' },
  { z: 'brinq', k: 'mascot', x: 28, y: 26, w: 3, h: 2, note: 'diario', pool: [null], n: [0, 0], time: 1.2 },
  { z: 'brinq', k: 'ballpit', x: 27, y: 29, w: 5, h: 2, deco: true },
  // Praça de alimentação
  { z: 'praca', k: 'kiosk', x: 34, y: 29, w: 4, h: 2, label: 'BURGÃO', kc: '#e74c3c', pool: ['comida', 'agua', 'agua'], n: [2, 2], time: 1.3 },
  { z: 'praca', k: 'kiosk', x: 39, y: 29, w: 4, h: 2, label: 'PASTEL DO TONHÃO', kc: '#f39c12', pool: ['comida', 'comida', 'agua', 'agua'], n: [1, 2], time: 1.3 },
  { z: 'praca', k: 'serenita', x: 45, y: 29, w: 5, h: 2, note: 'memo', fixed: ['amostra'], pool: ['agua'], n: [1, 1], time: 1.5 },
  ...[[36, 23], [39, 23], [42, 23], [45, 23], [48, 23], [37, 26], [41, 26], [44, 26], [48, 26]].map(([x, y]) => ({ z: 'praca', k: 'table', x, y, w: 1, h: 1, pool: ['comida', 'agua', null, null], n: [1, 1], time: .6 })),
  // Corredor
  { z: 'corr', k: 'fountain', x: 24, y: 14, w: 4, h: 4, deco: true },
  { z: 'corr', k: 'capinhas', x: 9, y: 15, w: 2, h: 2, pool: ['pilhas', 'fita', null], n: [1, 1], time: .9 },
  { z: 'corr', k: 'info', x: 31, y: 15, w: 3, h: 2, pool: ['remedio', 'pilhas', 'cafe', 'walkie'], n: [1, 1], time: 1 },
  { z: 'corr', k: 'escalator', x: 40, y: 14, w: 3, h: 3, deco: true },
  { z: 'corr', k: 'bench', x: 3, y: 13, w: 2, h: 1, deco: true },
  { z: 'corr', k: 'bench', x: 12, y: 18, w: 2, h: 1, deco: true },
  { z: 'corr', k: 'bench', x: 35, y: 13, w: 2, h: 1, deco: true },
  { z: 'corr', k: 'bench', x: 45, y: 18, w: 2, h: 1, deco: true },
  ...[[1, 12], [1, 19], [50, 12], [50, 19], [17, 15], [47, 15]].map(([x, y]) => ({ z: 'corr', k: 'plant', x, y, w: 1, h: 1, deco: true })),
  ...[[7, 13], [21, 18], [30, 13], [38, 18]].map(([x, y]) => ({ z: 'corr', k: 'trash', x, y, w: 1, h: 1, pool: ['comida', 'agua', null, 'pilhas'], n: [1, 1], time: .6 })),
];

const SURV_SPOTS = [[7, 8], [19, 8], [27, 9], [37, 9], [4, 27], [12, 25], [29, 23], [41, 27], [14, 16], [46, 13]];
const CALMO_STATUES = [[44, 27], [49, 25], [31, 28]];
const RUN_TIME = 180;
const PA = [
  [180, 'Senhores clientes: emergência sanitária. Mantenham a calma. Principalmente a calma.'],
  [170, 'Aqui é o gerente Lacerda. As portas de segurança vão baixar EM ETAPAS. Fiquem atentos.'],
  [150, 'Lembramos que a LIQUIDAÇÃO FINAL continua! Até 70% off em todo o shopping.'],
  [128, 'Clientes sorridentes: por favor, não abracem os funcionários.'],
  [100, '...e o cliente que está dentro do freezer do Bom Preço, favor sair. Com calma.'],
  [72, 'A Serenitá informa: a degustação foi encerrada. Os efeitos, não.'],
  [45, 'Pedimos ao cliente que cantarola na praça que... continue. Está tudo bem. Está tudo bem.'],
  [20, 'Últimos 20 segundos. Dirijam-se às saídas. Ou ao que sobrou delas.'],
  [10, 'Se você está ouvindo isto: CORRA.'],
];
const SPAWNS = [165, 150, 135, 118, 102, 88, 74, 60, 46, 32, 18];
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/* =========================================================
   ESTADO
   ========================================================= */
const S = {
  active: false, grid: null, zgrid: null, ogrid: null, objs: [], world: null,
  cv: null, ctx: null, light: null, lctx: null, mini: null, mctx: null,
};
const SKeys = {};

function zoneAt(tx, ty) { return (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) ? null : S.zgrid[ty][tx]; }
function tileAt(tx, ty) { return (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) ? T_WALL : S.grid[ty][tx]; }
function doorZone(tx, ty) { return S.dgrid[ty] && S.dgrid[ty][tx]; }
function solidFor(tx, ty, who) {
  const t = tileAt(tx, ty);
  if (t === T_WALL || t === T_GLASS || t === T_FURN) return true;
  if (t === T_DOOR) {
    const z = ZONES[doorZone(tx, ty)];
    if (S.shut[z.id].prog >= .6) return true;
    if (who === 'calmo' && z.depot) return true;
  }
  if (who === 'calmo' && zoneAt(tx, ty) === 'depot') return true;
  return false;
}
function blocked(x, y, r, who) {
  const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE), y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidFor(tx, ty, who)) return true;
  return false;
}
function moveEnt(e, dx, dy, r, who) {
  let mx = false, my = false;
  if (!blocked(e.x + dx, e.y, r, who)) { e.x += dx; mx = true; }
  if (!blocked(e.x, e.y + dy, r, who)) { e.y += dy; my = true; }
  return mx || my;
}
const tOf = v => Math.floor(v / TILE);
const cOf = t => t * TILE + TILE / 2;

function bfs(sx, sy, who) {
  const N = COLS * ROWS, D = new Int16Array(N).fill(-1), q = new Int32Array(N);
  let h = 0, t = 0;
  if (sx < 0 || sy < 0 || sx >= COLS || sy >= ROWS) return D;
  D[sy * COLS + sx] = 0; q[t++] = sy * COLS + sx;
  while (h < t) {
    const i = q[h++], x = i % COLS, y = (i / COLS) | 0;
    for (const [dx, dy] of DIR8) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const ni = ny * COLS + nx;
      if (D[ni] >= 0 || solidFor(nx, ny, who)) continue;
      if (dx && dy && (solidFor(x + dx, y, who) || solidFor(x, y + dy, who))) continue;
      D[ni] = D[i] + 1; q[t++] = ni;
    }
  }
  return D;
}
function stepDown(D, tx, ty, who) {
  const cur = D[ty * COLS + tx]; let best = null, bv = cur < 0 ? 9999 : cur;
  for (const [dx, dy] of DIR8) {
    const nx = tx + dx, ny = ty + dy;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
    const v = D[ny * COLS + nx];
    if (v < 0 || v >= bv) continue;
    if (dx && dy && (solidFor(tx + dx, ty, who) || solidFor(tx, ty + dy, who))) continue;
    bv = v; best = [nx, ny];
  }
  return best;
}
function los(ax, ay, bx, by) {
  const d = dist(ax, ay, bx, by), n = Math.ceil(d / 14);
  for (let i = 1; i < n; i++) {
    const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n;
    const tx = tOf(x), ty = tOf(y), t = tileAt(tx, ty);
    if (t === T_WALL) return false;
    if (t === T_DOOR && S.shut[doorZone(tx, ty)].prog >= .6) return false;
  }
  return true;
}

/* =========================================================
   CONSTRUÇÃO DO MAPA
   ========================================================= */
function buildMap() {
  S.grid = Array.from({ length: ROWS }, () => Array(COLS).fill(T_WALL));
  S.zgrid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  S.dgrid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  S.ogrid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let y = 12; y <= 19; y++) for (let x = 1; x <= 50; x++) { S.grid[y][x] = T_FLOOR; S.zgrid[y][x] = 'corr'; }
  Object.values(ZONES).forEach(z => {
    for (let y = z.y + 1; y <= z.y + z.h - 2; y++) for (let x = z.x + 1; x <= z.x + z.w - 2; x++) { S.grid[y][x] = T_FLOOR; S.zgrid[y][x] = z.id; }
    for (let x = z.x + 1; x <= z.x + z.w - 2; x++) S.grid[z.frontRow][x] = z.sealed ? T_WALL : T_GLASS;
    for (let x = z.door[0]; x < z.door[0] + z.door[1]; x++) { S.grid[z.frontRow][x] = T_DOOR; S.dgrid[z.frontRow][x] = z.id; S.zgrid[z.frontRow][x] = z.id; }
  });
  S.objs = LAYOUT.map((o, i) => Object.assign({ id: i, searched: false, loot: [] }, o));
  S.objs.forEach(o => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) { S.grid[y][x] = T_FURN; S.ogrid[y][x] = o; } });
}

function rollLoot(proto) {
  S.objs.forEach(o => {
    if (o.deco) return;
    const loot = [...(o.fixed || [])];
    if (o.maybe && chance(o.maybe.p)) loot.push(o.maybe.k);
    const n = rnd(o.n[0], o.n[1]);
    for (let i = 0; i < n; i++) { const it = pick(o.pool); if (it) loot.push(it); }
    if (proto === 'dani') { const i = loot.indexOf('lanterna'); if (i >= 0) loot[i] = 'pilhas'; }
    o.loot = loot;
  });
}

/* ---------- pré-render do mundo ---------- */
const FLOORS = {
  corr: (c, X, Y, i, j) => { c.fillStyle = (i + j) % 2 ? '#d6cdbd' : '#cbc1b0'; c.fillRect(X, Y, TILE, TILE); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + 3, Y + 3, TILE * .45, 3); },
  super: (c, X, Y) => { c.fillStyle = '#e9ecef'; c.fillRect(X, Y, TILE, TILE); c.strokeStyle = '#cfd4da'; c.lineWidth = 1; c.strokeRect(X + .5, Y + .5, TILE / 2, TILE / 2); c.strokeRect(X + TILE / 2 + .5, Y + TILE / 2 + .5, TILE / 2, TILE / 2); },
  farm: (c, X, Y, i, j) => { c.fillStyle = (i + j) % 2 ? '#cdeee3' : '#bde5d6'; c.fillRect(X, Y, TILE, TILE); },
  ferr: (c, X, Y, i, j, r) => { c.fillStyle = '#a19d94'; c.fillRect(X, Y, TILE, TILE); c.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < 6; k++) c.fillRect(X + r() * TILE, Y + r() * TILE, 2, 2); },
  elet: (c, X, Y, i, j, r) => { c.fillStyle = '#34416e'; c.fillRect(X, Y, TILE, TILE); c.fillStyle = 'rgba(255,255,255,.04)'; for (let k = 0; k < 8; k++) c.fillRect(X + r() * TILE, Y + r() * TILE, 2, 2); },
  cine: (c, X, Y) => { c.fillStyle = '#3a0d19'; c.fillRect(X, Y, TILE, TILE); },
  pet: (c, X, Y, i, j) => { c.fillStyle = '#b98a5a'; c.fillRect(X, Y, TILE, TILE); c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(X, Y + ((i % 2) ? 12 : 26), TILE, 1.5); c.fillRect(X + ((j * 13) % TILE), Y, 1.5, TILE); },
  moda: (c, X, Y) => { c.fillStyle = '#e8cdd6'; c.fillRect(X, Y, TILE, TILE); },
  depot: (c, X, Y, i, j, r) => { c.fillStyle = '#8f897b'; c.fillRect(X, Y, TILE, TILE); c.fillStyle = 'rgba(0,0,0,.07)'; for (let k = 0; k < 5; k++) c.fillRect(X + r() * TILE, Y + r() * TILE, 3, 2); },
  brinq: (c, X, Y, i, j) => { c.fillStyle = ['#ffd6e8', '#d6f0ff', '#fff3c4', '#d9f7d6'][(i + j * 2) % 4]; c.fillRect(X, Y, TILE, TILE); },
  praca: (c, X, Y, i, j) => { c.fillStyle = (i + j) % 2 ? '#c9805a' : '#bd7450'; c.fillRect(X, Y, TILE, TILE); c.strokeStyle = 'rgba(0,0,0,.1)'; c.strokeRect(X + .5, Y + .5, TILE - 1, TILE - 1); },
};

function boxObj(c, X, Y, W, H, top, front, fh = 10) {
  rr(c, X + 2, Y + 2, W - 4, H - 4, 5); paint(c, front);
  rr(c, X + 2, Y + 2, W - 4, H - 4 - fh, 5); paint(c, top);
}

function drawFurniture(c, o) {
  const X = o.x * TILE, Y = o.y * TILE, W = o.w * TILE, H = o.h * TILE;
  const r = seeded(o.id * 97 + 13);
  c.lineWidth = 2; c.strokeStyle = OUT; c.lineJoin = 'round';
  const prodColors = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#e67e22', '#9b59b6', '#ecf0f1', '#1abc9c'];
  switch (o.k) {
    case 'shelf': {
      boxObj(c, X, Y, W, H, o.tint ? shade(o.tint, -.35) : '#8a95a3', '#4f5763');
      const vertical = o.h > o.w, n = Math.max(o.w, o.h) * 3;
      for (let i = 0; i < n; i++) {
        c.fillStyle = prodColors[Math.floor(r() * prodColors.length)];
        if (vertical) { const yy = Y + 6 + i * ((H - 22) / n); c.fillRect(X + 8, yy, W - 16, (H - 22) / n - 2); }
        else { const xx = X + 6 + i * ((W - 12) / n); c.fillRect(xx, Y + 6, (W - 12) / n - 2, H - 22); }
      }
      break;
    }
    case 'fridge': {
      boxObj(c, X, Y, W, H, '#e8eef5', '#9fb3c8', 14);
      rr(c, X + 6, Y + H - 15, W - 12, 10, 2); paint(c, 'rgba(140,200,240,.8)');
      for (let i = 0; i < W / 9 - 1; i++) { c.fillStyle = prodColors[Math.floor(r() * 4) + 2]; c.fillRect(X + 9 + i * 9, Y + H - 13, 4, 7); }
      break;
    }
    case 'counter': {
      boxObj(c, X, Y, W, H, '#b07a52', '#7a4f33');
      rr(c, X + W - 26, Y + 5, 18, 14, 3); paint(c, '#2d3436');
      c.fillStyle = '#7dffb0'; c.fillRect(X + W - 23, Y + 8, 12, 5);
      break;
    }
    case 'tools': {
      boxObj(c, X, Y, W, H, '#c49a6c', '#8a6542');
      c.fillStyle = '#7f8c8d';
      for (let i = 0; i < o.w * 2; i++) { const xx = X + 10 + i * 19; if (i % 3 === 0) { c.fillRect(xx, Y + 6, 3, 14); c.fillRect(xx - 4, Y + 6, 11, 5); } else if (i % 3 === 1) { c.beginPath(); c.moveTo(xx, Y + 6); c.lineTo(xx + 10, Y + 10); c.lineTo(xx, Y + 18); c.fill(); } else { circ(c, xx + 3, Y + 12, 5); c.fill(); } }
      break;
    }
    case 'lumber': {
      for (let i = 0; i < 5; i++) { rr(c, X + 4, Y + 6 + i * 13, W - 8, 12, 2); paint(c, i % 2 ? '#c08a52' : '#b07b45'); }
      break;
    }
    case 'tvtable': {
      boxObj(c, X, Y, W, H, '#565668', '#34343f');
      for (let i = 0; i < o.w; i++) { rr(c, X + 8 + i * 38, Y + 4, 28, 18, 2); paint(c, '#111'); c.fillStyle = 'rgba(120,200,255,.6)'; c.fillRect(X + 11 + i * 38, Y + 7, 22, 12); }
      break;
    }
    case 'cage': {
      boxObj(c, X, Y, W, H, '#e9d58a', '#9aa0a6');
      c.strokeStyle = 'rgba(60,60,60,.8)'; c.lineWidth = 2;
      for (let xx = X + 10; xx < X + W - 6; xx += 10) { c.beginPath(); c.moveTo(xx, Y + 4); c.lineTo(xx, Y + H - 14); c.stroke(); }
      c.strokeStyle = OUT;
      break;
    }
    case 'aquarium': { boxObj(c, X, Y, W, H, '#5fb8ec', '#2f6f99'); c.fillStyle = '#ff9f43'; for (let i = 0; i < 4; i++) { ell(c, X + 15 + r() * (W - 30), Y + 8 + r() * 10, 4, 2.5); c.fill(); } break; }
    case 'rack': {
      circ(c, X + 20, Y + 20, 16); paint(c, '#d9d9d9');
      for (let a = 0; a < 6; a++) { c.fillStyle = prodColors[Math.floor(r() * prodColors.length)]; c.beginPath(); c.arc(X + 20, Y + 20, 15, a, a + .8); c.lineTo(X + 20, Y + 20); c.fill(); }
      circ(c, X + 20, Y + 20, 5); paint(c, '#666');
      break;
    }
    case 'mannequin': { ell(c, X + 20, Y + 24, 10, 12); paint(c, '#f1dfc8'); circ(c, X + 20, Y + 10, 7); paint(c, '#f1dfc8'); break; }
    case 'provador': {
      boxObj(c, X, Y, W, H, '#6c5f7a', '#4a405a');
      for (let i = 0; i < o.w; i++) { rr(c, X + 6 + i * 40, Y + 10, 30, H - 26, 2); paint(c, i % 2 ? '#c0392b' : '#8e44ad'); c.strokeStyle = 'rgba(0,0,0,.25)'; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(X + 6 + i * 40 + k * 6, Y + 12); c.lineTo(X + 6 + i * 40 + k * 6, Y + H - 18); c.stroke(); } c.strokeStyle = OUT; }
      break;
    }
    case 'crates': { for (let i = 0; i < 4; i++) { const xx = X + (i % 2) * 40, yy = Y + Math.floor(i / 2) * 40; boxObj(c, xx, yy, 40, 40, '#c49a6c', '#8a6542', 8); c.beginPath(); c.moveTo(xx + 8, yy + 8); c.lineTo(xx + 32, yy + 26); c.moveTo(xx + 32, yy + 8); c.lineTo(xx + 8, yy + 26); c.stroke(); } break; }
    case 'mascot': { boxObj(c, X, Y, W, H, '#5f4b8b', '#3e3160'); drawMascotHead(c, X + W / 2, Y + H / 2 - 6, 26, 0); break; }
    case 'ballpit': { boxObj(c, X, Y, W, H, '#ffffff', '#3498db', 12); for (let i = 0; i < 60; i++) { c.fillStyle = prodColors[Math.floor(r() * 6)]; circ(c, X + 8 + r() * (W - 16), Y + 8 + r() * (H - 30), 4); c.fill(); } break; }
    case 'kiosk': case 'serenita': {
      const kc = o.k === 'serenita' ? '#2f9e63' : o.kc;
      boxObj(c, X, Y, W, H, shade(kc, .55), shade(kc, -.25), 16);
      for (let i = 0; i < W / 16; i++) { c.fillStyle = i % 2 ? kc : '#fff'; c.fillRect(X + 4 + i * 16, Y + 4, 16, 10); }
      c.strokeRect(X + 4, Y + 4, W - 8, 10);
      c.fillStyle = '#fff'; c.font = 'bold 11px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(o.k === 'serenita' ? 'SERENITÁ · BEBA A CALMA' : o.label, X + W / 2, Y + H - 9);
      if (o.k === 'serenita') for (let i = 0; i < 6; i++) drawItem(c, 'amostra', X + 22 + i * 30, Y + 34, 18);
      break;
    }
    case 'table': {
      [[-13, 0], [13, 0], [0, -13]].forEach(([dx, dy]) => { rr(c, X + 20 + dx - 6, Y + 20 + dy - 6, 12, 12, 3); paint(c, '#e84a5f'); });
      circ(c, X + 20, Y + 22, 11); paint(c, '#f3e9dc');
      break;
    }
    case 'bench': { boxObj(c, X, Y + 8, W, H - 16, '#b07b45', '#7a4f33', 6); c.strokeStyle = 'rgba(0,0,0,.3)'; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(X + 6, Y + 8 + i * 4); c.lineTo(X + W - 6, Y + 8 + i * 4); c.stroke(); } c.strokeStyle = OUT; break; }
    case 'plant': { rr(c, X + 10, Y + 18, 20, 18, 4); paint(c, '#a0522d'); for (let i = 0; i < 6; i++) { circ(c, X + 20 + Math.cos(i) * 9, Y + 14 + Math.sin(i) * 7, 8); paint(c, i % 2 ? '#2e8b57' : '#3cb371'); } break; }
    case 'trash': { circ(c, X + 20, Y + 22, 12); paint(c, '#7f8c8d'); circ(c, X + 20, Y + 20, 9); paint(c, '#95a5a6'); break; }
    case 'fountain': {
      circ(c, X + W / 2, Y + H / 2, W / 2 - 4); paint(c, '#bfb6a5');
      circ(c, X + W / 2, Y + H / 2, W / 2 - 14); paint(c, '#2f8fbf');
      circ(c, X + W / 2, Y + H / 2, 14); paint(c, '#d8d0c0');
      break;
    }
    case 'escalator': {
      boxObj(c, X, Y, W, H, '#8d99a6', '#5d6773', 14);
      c.fillStyle = 'rgba(0,0,0,.25)'; for (let yy = Y + 10; yy < Y + H - 16; yy += 7) c.fillRect(X + 14, yy, W - 28, 3);
      c.fillStyle = '#2d3436'; c.fillRect(X + 6, Y + 4, 6, H - 20); c.fillRect(X + W - 12, Y + 4, 6, H - 20);
      c.fillStyle = '#fff'; c.font = 'bold 10px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('2º PISO', X + W / 2, Y + H - 6);
      break;
    }
    case 'info': {
      boxObj(c, X, Y, W, H, '#dfe6e9', '#2d3436', 14);
      circ(c, X + W / 2, Y + 24, 11); paint(c, '#0984e3');
      c.fillStyle = '#fff'; c.font = 'bold 15px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('i', X + W / 2, Y + 25);
      break;
    }
    case 'capinhas': {
      boxObj(c, X, Y, W, H, '#ffd1e3', '#e84393', 14);
      for (let i = 0; i < 8; i++) { rr(c, X + 8 + (i % 4) * 16, Y + 8 + Math.floor(i / 4) * 22, 10, 16, 3); paint(c, prodColors[i % prodColors.length]); }
      break;
    }
  }
}

function drawSign(c, z) {
  const cx = (z.door[0] + z.door[1] / 2) * TILE;
  const y = z.north ? z.frontRow * TILE - 2 : z.frontRow * TILE + TILE + 2;
  c.font = 'bold 13px Inter, sans-serif';
  const w = c.measureText(z.name).width + 22;
  const sy = z.north ? y - 20 : y - 2;
  rr(c, cx - w / 2, sy - 2, w, 22, 5); c.fillStyle = '#14121b'; c.fill(); c.lineWidth = 2; c.strokeStyle = z.color; c.stroke();
  c.fillStyle = z.color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(z.name, cx, sy + 9);
  z.signPos = { x: cx, y: sy + 9, w };
}

function prerender() {
  const c = S.world.getContext('2d');
  c.clearRect(0, 0, WW, WH);
  c.fillStyle = '#100f16'; c.fillRect(0, 0, WW, WH);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const X = i * TILE, Y = j * TILE, t = S.grid[j][i];
    const zid = S.zgrid[j][i];
    const r = seeded(i * 131 + j * 71);
    if (t === T_FLOOR || t === T_FURN || t === T_DOOR) {
      const f = FLOORS[t === T_DOOR ? 'corr' : (zid || 'corr')] || FLOORS.corr;
      f(c, X, Y, i, j, r);
    }
  }
  // listras de segurança no depósito
  const dz = ZONES.depot;
  c.save(); c.beginPath(); c.rect((dz.x + 1) * TILE, (dz.y + 1) * TILE, (dz.w - 2) * TILE, (dz.h - 2) * TILE); c.clip();
  c.strokeStyle = '#f1c40f'; c.lineWidth = 6; c.setLineDash([12, 12]);
  c.strokeRect((dz.x + 1) * TILE + 6, (dz.y + 1) * TILE + 6, (dz.w - 2) * TILE - 12, (dz.h - 2) * TILE - 12);
  c.setLineDash([]);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.font = '28px Bungee, Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('3B', (dz.x + dz.w / 2) * TILE, (dz.y + 5) * TILE);
  c.restore();

  // paredes e vidro
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const X = i * TILE, Y = j * TILE, t = S.grid[j][i];
    if (t === T_WALL) {
      c.fillStyle = '#2a2833'; c.fillRect(X, Y, TILE, TILE);
      const below = j + 1 < ROWS ? S.grid[j + 1][i] : T_WALL;
      if (below !== T_WALL && below !== T_GLASS) { c.fillStyle = '#1c1a24'; c.fillRect(X, Y + TILE - 12, TILE, 12); c.fillStyle = '#3c3947'; c.fillRect(X, Y + TILE - 13, TILE, 2); }
      c.fillStyle = 'rgba(255,255,255,.03)'; c.fillRect(X, Y, TILE, 2);
    } else if (t === T_GLASS) {
      const zid = S.zgrid[j][i] || (j < 12 ? null : null);
      c.fillStyle = '#20303a'; c.fillRect(X, Y, TILE, TILE);
      c.fillStyle = 'rgba(160,220,255,.35)'; c.fillRect(X + 2, Y + 8, TILE - 4, TILE - 16);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X + 8, Y + TILE - 10); c.lineTo(X + 20, Y + 10); c.stroke();
      c.fillStyle = '#596775'; c.fillRect(X, Y + 6, TILE, 3); c.fillRect(X, Y + TILE - 9, TILE, 3); c.fillRect(X + TILE - 2, Y, 2, TILE);
    } else if (t === T_DOOR) {
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(X, Y + TILE / 2 - 2, TILE, 4);
    }
  }
  // cinema: pôsteres e fita
  const cz = ZONES.cine;
  for (let x = cz.x + 1; x <= cz.x + cz.w - 2; x++) {
    if (x >= cz.door[0] && x < cz.door[0] + cz.door[1]) continue;
    const X = x * TILE, Y = cz.frontRow * TILE;
    rr(c, X + 6, Y + 4, TILE - 12, TILE - 10, 2); c.fillStyle = ['#7b2cbf', '#e63946', '#1d3557', '#f4a261'][x % 4]; c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke();
  }
  // sombra de contato junto às paredes
  const solidish = t => t === T_WALL || t === T_GLASS;
  for (let j = 1; j < ROWS; j++) for (let i = 1; i < COLS; i++) {
    const t = S.grid[j][i]; if (!(t === T_FLOOR || t === T_FURN || t === T_DOOR)) continue;
    const X = i * TILE, Y = j * TILE;
    if (solidish(S.grid[j - 1][i])) { const g = c.createLinearGradient(0, Y, 0, Y + 16); g.addColorStop(0, 'rgba(10,8,20,.42)'); g.addColorStop(1, 'rgba(10,8,20,0)'); c.fillStyle = g; c.fillRect(X, Y, TILE, 16); }
    if (solidish(S.grid[j][i - 1])) { const g = c.createLinearGradient(X, 0, X + 10, 0); g.addColorStop(0, 'rgba(10,8,20,.3)'); g.addColorStop(1, 'rgba(10,8,20,0)'); c.fillStyle = g; c.fillRect(X, Y, 10, TILE); }
    if (i + 1 < COLS && solidish(S.grid[j][i + 1])) { const g = c.createLinearGradient(X + TILE, 0, X + TILE - 10, 0); g.addColorStop(0, 'rgba(10,8,20,.3)'); g.addColorStop(1, 'rgba(10,8,20,0)'); c.fillStyle = g; c.fillRect(X + TILE - 10, Y, 10, TILE); }
  }
  // textura no topo das paredes
  c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (S.grid[j][i] === T_WALL) { const X = i * TILE, Y = j * TILE; c.beginPath(); c.moveTo(X, Y + 14); c.lineTo(X + TILE, Y + 14); c.moveTo(X + (j % 2 ? 20 : 0), Y); c.lineTo(X + (j % 2 ? 20 : 0), Y + 14); c.stroke(); }
  // sombras projetadas dos móveis
  S.objs.forEach(o => {
    if (o.k === 'fountain' || o.k === 'plant' || o.k === 'trash') { c.fillStyle = 'rgba(10,8,20,.28)'; ell(c, (o.x + o.w / 2) * TILE + 4, (o.y + o.h) * TILE - 4, o.w * TILE * .45, 7); c.fill(); return; }
    c.fillStyle = 'rgba(10,8,20,.26)'; rr(c, o.x * TILE + 6, o.y * TILE + 10, o.w * TILE - 4, o.h * TILE - 4, 6); c.fill();
  });
  S.objs.forEach(o => drawFurniture(c, o));
  Object.values(ZONES).forEach(z => drawSign(c, z));
}

/* =========================================================
   INÍCIO DA FASE
   ========================================================= */
const Scav = {
  start(proto, onDone) {
    S.cv = $('#cv'); S.ctx = S.cv.getContext('2d');
    if (!S.world) { S.world = document.createElement('canvas'); S.world.width = WW; S.world.height = WH; }
    if (!S.light) { S.light = document.createElement('canvas'); S.light.width = VW; S.light.height = VH; S.lctx = S.light.getContext('2d'); }
    S.mini = $('#minimap'); S.mctx = S.mini.getContext('2d');
    buildMap(); rollLoot(proto);
    S.shut = {}; Object.values(ZONES).forEach(z => S.shut[z.id] = { prog: z.sealed ? 1 : 0, warned: false, slammed: !!z.sealed });
    prerender();
    const dz = ZONES.depot;
    Object.assign(S, {
      active: false, phase: 'overview', overT: 0, count: 3.99, time: RUN_TIME, proto, onDone,
      p: { x: (dz.x + dz.w / 2) * TILE, y: (dz.y + 4) * TILE, stun: 0, invul: 0, stam: 1, face: 1, walkT: 0, moving: false, sprint: false, infected: false, hugs: 0 },
      cam: { x: 0, y: 0 }, shake: 0, carried: [], cart: false, followers: [], items: [], npcs: [], calmos: [], parts: [], floats: [],
      path: [], pathGoal: null, autoSearch: null, search: null, target: null, trail: [], skipOverview: false,
      stash: {}, saved: [], dogSaved: false, notes: [], paIdx: 0, spawnIdx: 0, stepT: 0, field: null, fieldT: 0,
      lastTick: RUN_TIME, tscale: RUN_TIME / D().run, dirty: true, confirmClose: false, sprintToggle: false, blackout: 0, frame: 0, freezerDone: false,
      lightsOut: false, skipped: false, confirmSkip: false,
    });
    S.cam.x = clamp(S.p.x - VW / 2, 0, WW - VW); S.cam.y = clamp(S.p.y - VH / 2, 0, WH - VH);
    // carrinho de compras na entrada do supermercado
    S.items.push({ k: 'carrinho', x: cOf(7), y: cOf(9) + 6, t: 0, z: 0, vz: 0 });
    // alguns itens soltos pelo corredor
    [['comida', 15, 13], ['agua', 34, 18], ['remedio', 44, 16], ['agua', 5, 17], ['agua', 47, 13]].forEach(([k, x, y]) => S.items.push({ k, x: cOf(x), y: cOf(y), t: Math.random() * 6, z: 0, vz: 0 }));
    // sobreviventes
    const cast = shuffle(REGULARS).slice(0, 3);
    let infUsed = false;
    const spots = shuffle(SURV_SPOTS);
    cast.forEach((key, i) => {
      const inf = !infUsed && chance(D().pool * .7); if (inf) infUsed = true;
      const n = { kind: 'person', key, c: CHARACTERS[key], infected: inf, x: 0, y: 0, t: Math.random() * 5, hidden: false, following: false, saved: false, bubble: null };
      if (i === 0) { const prov = S.objs.find(o => o.hide); prov.survivor = n; n.hidden = true; }
      else { n.x = cOf(spots[i][0]); n.y = cOf(spots[i][1]); }
      S.npcs.push(n);
    });
    S.cast = cast;
    CALMO_STATUES.forEach(([x, y]) => S.calmos.push(makeCalmo(cOf(x), cOf(y), 'statue')));
    S.toastEl = $('#scavToast');
    $('#paText').textContent = '...';
    Screen.show('run');
    fitView();
    S.cam.x = clamp(S.p.x - VW / 2, 0, WW - VW); S.cam.y = clamp(S.p.y - VH / 2, 0, WH - VH);
    S.active = true;
    Sound.startMuzak(false); Sound.detune = 0;
    renderSlots(); updateStashHUD();
    if (!S.loopOn) { S.loopOn = true; S.last = performance.now(); requestAnimationFrame(scavLoop); }
  },
};

function makeCalmo(x, y, type) {
  const looks = Object.values(CHARACTERS).filter(c => !c.special).map(c => c.look);
  const base = pick(looks);
  const look = Object.assign({}, base, { shirt: pick(['#7f8c8d', '#95a5a6', '#6c5ce7', '#00b894', '#e17055', '#fdcb6e', '#74b9ff']), acc: [], seed: rnd(1, 999) });
  return { x, y, type, state: type === 'statue' ? 'idle' : 'wander', t: Math.random() * 10, look, dir: Math.random() * 6.28, wT: 0, lostT: 0, pause: 0, next: null, home: { x, y }, glassy: chance(.5) };
}

/* =========================================================
   ATUALIZAÇÃO
   ========================================================= */
function toastS(msg, throttle) {
  const now = performance.now();
  if (throttle && S.lastToast === msg && now - S.lastToastAt < 1800) return;
  S.lastToast = msg; S.lastToastAt = now;
  const el = S.toastEl; el.textContent = msg; el.classList.add('show');
  clearTimeout(S.toastTimer); S.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}
function floatText(x, y, text, color = '#fff') { S.floats.push({ x, y, text, color, t: 0 }); }
function slotsUsed() { return S.carried.reduce((a, k) => a + ITEMS[k].w, 0) + S.followers.reduce((a, f) => a + (f.kind === 'dog' ? 1 : 2), 0); }
function capacity() { return S.cart ? 7 : 4; }
const pInDepot = () => zoneAt(tOf(S.p.x), tOf(S.p.y)) === 'depot' && tileAt(tOf(S.p.x), tOf(S.p.y)) !== T_DOOR;

function setPA(text) { const el = $('#paText'); el.textContent = text; el.parentElement.classList.remove('flash'); void el.offsetWidth; el.parentElement.classList.add('flash'); Sound.play('chime'); }

function nearestSearchable() {
  const p = S.p; let best = null, bd = 1e9;
  S.objs.forEach(o => {
    if (o.deco || o.searched) return;
    const cx = clamp(p.x, o.x * TILE, (o.x + o.w) * TILE), cy = clamp(p.y, o.y * TILE, (o.y + o.h) * TILE);
    const d = dist(p.x, p.y, cx, cy);
    if (d < 36 && d < bd) { bd = d; best = o; }
  });
  return best;
}

function startSearch(o) {
  if (!o || o.searched || S.search) return;
  const t = o.time * (S.proto === 'rafa' ? .6 : 1);
  S.search = { o, t: 0, need: t, sndT: 0 };
}

function finishSearch() {
  const o = S.search.o; S.search = null; o.searched = true;
  const p = S.p;
  let found = 0;
  const pop = (k) => {
    const a = Math.random() * Math.PI * 2;
    S.items.push({ k, x: p.x + Math.cos(a) * 6, y: p.y + Math.sin(a) * 6, t: 0, z: 0, vz: 140, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, fresh: .35 });
    found++;
  };
  o.loot.forEach(pop);
  if (o.note) { S.notes.push(o.note); floatText(p.x, p.y - 50, 'Documento: ' + NOTES[o.note].t, '#ffe58a'); found++; }
  if (o.dog) {
    S.npcs.push({ kind: 'dog', x: cOf(o.x + 1), y: (o.y + o.h) * TILE + 14, t: 0, following: false, saved: false, bubble: 'Au!' });
    toastS('O Caramelo pulou da jaula abanando o rabo!'); Sound.play('bark'); found++;
  }
  if (o.survivor) {
    const n = o.survivor; n.hidden = false; n.x = clamp(p.x + 30, o.x * TILE, (o.x + o.w) * TILE); n.y = (o.y) * TILE - 20;
    n.bubble = 'AAAH! Ah, é você. Me tira daqui!'; n.bubbleT = 3;
    toastS(`${n.c.name} estava escondido no provador!`); found++;
  }
  Sound.play(found ? 'found' : 'empty');
  if (!found) floatText(p.x, p.y - 46, 'Vazio', '#aaa');
}

function update(dt) {
  const p = S.p;
  S.frame++;
  if (S.phase === 'overview') {
    S.overT += dt;
    if (S.overT > 6 || S.skipOverview) { S.phase = 'count'; S.count = 3; Sound.play('alarm'); }
    return;
  }
  if (S.phase === 'count') {
    const before = Math.ceil(S.count); S.count -= dt;
    if (Math.ceil(S.count) !== before && S.count > 0) Sound.play('alarm');
    if (before > 0 && S.count <= 0) Sound.play('chime');
    if (S.count <= -.45) S.phase = 'play';
    return;
  }
  S.time -= dt * S.tscale;
  Sound.detune = clamp((RUN_TIME - S.time) / RUN_TIME * 90, 0, 90);

  while (S.paIdx < PA.length && S.time <= PA[S.paIdx][0]) { setPA(PA[S.paIdx][1]); S.paIdx++; }
  Object.values(ZONES).forEach(z => {
    const sh = S.shut[z.id];
    if (z.sealed || !z.closeAt) return;
    if (!sh.warned && S.time <= z.closeAt + 6) { sh.warned = true; setPA(`Atenção: a ${titleCase(z.name)} fecha em 5 segundos.`); Sound.play('alarm'); }
    if (S.time <= z.closeAt && sh.prog < 1) {
      if (sh.prog === 0) Sound.play('shutter');
      sh.prog = Math.min(1, sh.prog + dt / 2.6);
      if (sh.prog >= .6 && !sh.slammed) {
        sh.slammed = true; Sound.play('slam'); S.shake = Math.max(S.shake, 6);
        if (zoneAt(tOf(p.x), tOf(p.y)) === z.id) return trapRun(z);
        S.followers.filter(f => zoneAt(tOf(f.x), tOf(f.y)) === z.id).forEach(f => { f.following = false; f.lost = true; });
        S.followers = S.followers.filter(f => !f.lost);
      }
    }
  });
  if (!S.active) return;
  while (S.spawnIdx < SPAWNS.length && S.time <= SPAWNS[S.spawnIdx]) {
    const sk = D().spawnK;
    if (sk >= 1 || chance(sk)) S.calmos.push(makeCalmo(cOf(41), cOf(17) + 10, 'wander'));
    if (sk > 1 && chance(sk - 1)) S.calmos.push(makeCalmo(pick([cOf(2), cOf(49)]), cOf(16), 'wander'));
    S.spawnIdx++;
    toastS('Alguém desceu a escada rolante. Sorrindo.', true);
  }
  if (!S.freezerDone && S.time <= 100) { S.freezerDone = true; S.calmos.push(makeCalmo(cOf(11), cOf(2) + 12, 'wander')); }
  if ((S.time < 135.4 && S.time > 134.8) || (S.time < 90.6 && S.time > 89.8) || (S.time < 40.6 && S.time > 39.8)) S.blackout = 1; else S.blackout = 0;
  if (S.time <= 10 && Math.ceil(S.time) !== S.lastTick) { S.lastTick = Math.ceil(S.time); Sound.play('alarm'); }

  /* ---- jogador ---- */
  p.invul = Math.max(0, p.invul - dt);
  let dx = 0, dy = 0;
  if (SKeys.left) dx -= 1; if (SKeys.right) dx += 1; if (SKeys.up) dy -= 1; if (SKeys.down) dy += 1;
  if (dx || dy) { S.path = []; S.autoSearch = null; if (S.search) S.search = null; }
  else if (S.path.length) {
    const t = S.path[0], ddx = t.x - p.x, ddy = t.y - p.y, d = Math.hypot(ddx, ddy);
    if (d < 6) S.path.shift(); else { dx = ddx / d; dy = ddy / d; }
    if (!S.path.length && S.autoSearch) { startSearch(S.autoSearch); S.autoSearch = null; }
  }
  const wantSprint = (SKeys.shift || S.sprintToggle) && (dx || dy);
  const drain = S.proto === 'jo' ? 22 : 32;
  if (wantSprint && p.stam > .02) { p.stam = Math.max(0, p.stam - drain / 100 * dt); p.sprint = true; }
  else { p.stam = Math.min(1, p.stam + .2 * dt); p.sprint = false; }
  p.moving = false;
  if (p.stun > 0) p.stun -= dt;
  else if ((dx || dy) && !S.search) {
    const len = Math.hypot(dx, dy); dx /= len; dy /= len;
    const sp = (p.sprint ? 240 : 150) * (S.cart ? .82 : 1);
    const ox = p.x, oy = p.y;
    moveEnt(p, dx * sp * dt, dy * sp * dt, 13, 'player');
    const moved = Math.hypot(p.x - ox, p.y - oy);
    if (S.path.length && moved < sp * dt * .2) { S.stuck = (S.stuck || 0) + dt; if (S.stuck > .4) { S.path.shift(); S.stuck = 0; } } else S.stuck = 0;
    if (moved > .1) {
      p.moving = true; p.walkT += dt; if (Math.abs(dx) > .2) p.face = dx > 0 ? 1 : -1;
      S.stepT -= dt; if (S.stepT <= 0) { S.stepT = p.sprint ? .2 : .3; Sound.play('step'); if (p.sprint) S.parts.push({ x: p.x - dx * 10, y: p.y + 2, t: 0, life: .5, r: 4, c: 'rgba(200,190,170,' }); }
      const lt = S.trail[S.trail.length - 1];
      if (!lt || dist(lt.x, lt.y, p.x, p.y) > 5) { S.trail.push({ x: p.x, y: p.y }); if (S.trail.length > 400) S.trail.shift(); }
    }
  }

  /* ---- revistar ---- */
  S.target = S.search ? S.search.o : nearestSearchable();
  if (S.search) {
    S.search.t += dt; S.search.sndT -= dt;
    if (S.search.sndT <= 0) { S.search.sndT = .3; Sound.play('search'); }
    if (S.search.t >= S.search.need) finishSearch();
  }

  /* ---- itens no chão ---- */
  for (let i = S.items.length - 1; i >= 0; i--) {
    const it = S.items[i];
    it.t += dt;
    if (it.vz || it.z > 0) { it.vz -= 520 * dt; it.z = Math.max(0, it.z + it.vz * dt); if (it.vx) { const e = { x: it.x, y: it.y }; moveEnt(e, it.vx * dt, it.vy * dt, 6, 'player'); it.x = e.x; it.y = e.y; } if (it.z === 0) { it.vz = 0; it.vx = it.vy = 0; } }
    if (it.fresh > 0) { it.fresh -= dt; continue; }
    const dd = dist(it.x, it.y, p.x, p.y);
    if (dd < 80 && dd > 4 && it.z === 0 && it.k !== 'carrinho' && slotsUsed() + ITEMS[it.k].w <= capacity()) {
      const k = Math.min(1, 260 * dt / dd); it.x += (p.x - it.x) * k; it.y += (p.y - it.y) * k;
    }
    if (dist(it.x, it.y, p.x, p.y) < 26 && it.z < 8) {
      if (it.k === 'carrinho') {
        if (!S.cart) { S.cart = true; S.items.splice(i, 1); Sound.play('pick'); toastS('Carrinho de compras! Mais espaço (7), porém mais lento.'); S.dirty = true; }
        continue;
      }
      const w = ITEMS[it.k].w;
      if (slotsUsed() + w <= capacity()) { S.carried.push(it.k); S.items.splice(i, 1); Sound.play('pick'); floatText(p.x, p.y - 44, '+ ' + ITEMS[it.k].n, '#9fffcf'); S.dirty = true; }
      else toastS(`Sem espaço: ${ITEMS[it.k].n} ocupa ${w}. Volte ao depósito!`, true);
    }
  }

  /* ---- sobreviventes e cachorro ---- */
  S.npcs.forEach(n => {
    n.t += dt;
    if (n.bubbleT > 0) n.bubbleT -= dt;
    if (n.hidden || n.saved) return;
    if (!n.following && dist(n.x, n.y, p.x, p.y) < 40) {
      const w = n.kind === 'dog' ? 1 : 2;
      if (slotsUsed() + w <= capacity()) {
        n.following = true; S.followers.push(n); S.dirty = true; Sound.play('pick');
        n.bubble = n.kind === 'dog' ? 'Au! Au!' : pick(['Me leva junto!', 'Graças a Deus, alguém com plano!', 'Tô contigo. Pra onde?', 'Não me deixa aqui!']); n.bubbleT = 2.2;
      } else if (!n.bubbleT || n.bubbleT <= 0) { n.bubble = n.kind === 'dog' ? 'Au?' : 'Tá cheio aí? Volta pra me buscar!'; n.bubbleT = 2; }
    }
  });
  S.followers.forEach((f, i) => {
    const tp = S.trail[Math.max(0, S.trail.length - 1 - (i + 1) * 8)];
    if (tp) { const ox = f.x; const k = Math.min(1, dt * 9); f.x += (tp.x - f.x) * k; f.y += (tp.y - f.y) * k; f.moving = Math.abs(f.x - ox) > .2 || p.moving; f.flip = tp.x < f.x; }
  });

  /* ---- depósito ---- */
  if (pInDepot() && (S.carried.length || S.followers.length)) {
    S.carried.forEach(k => { const key = ITEMS[k].as || k; S.stash[key] = (S.stash[key] || 0) + (ITEMS[k].u ? 1 : (ITEMS[k].pick || 1)); });
    const dz = ZONES.depot;
    S.followers.forEach(f => {
      f.following = false; f.saved = true;
      if (f.kind === 'dog') S.dogSaved = true; else S.saved.push(f);
      const idx = S.saved.length + (S.dogSaved ? 1 : 0);
      f.x = (dz.x + 1.6 + (idx % 3) * 1.6) * TILE; f.y = (dz.y + 7.2 + Math.floor(idx / 3) * .9) * TILE;
    });
    floatText(p.x, p.y - 50, 'Guardado!', '#ffe58a');
    S.carried = []; S.followers = []; Sound.play('deposit'); S.dirty = true;
  }

  /* ---- Calmos ---- */
  S.fieldT -= dt;
  const pT = [tOf(p.x), tOf(p.y)];
  if (S.fieldT <= 0) { S.fieldT = .3; S.field = pInDepot() ? null : bfs(pT[0], pT[1], 'calmo'); }
  const chaseSp = (86 + (RUN_TIME - S.time) / RUN_TIME * 33) * D().calmoSpd;
  S.calmos.forEach(c => {
    c.t += dt;
    if (c.pause > 0) { c.pause -= dt; return; }
    const d = dist(c.x, c.y, p.x, p.y);
    const sees = !pInDepot() && d < (c.type === 'statue' && c.state === 'idle' ? 150 : 290) && los(c.x, c.y, p.x, p.y);
    if (sees) { if (c.state !== 'chase') { S.parts.push({ x: c.x, y: c.y - 46, t: 0, life: .8, bang: true }); Sound.play('giggle'); } c.state = 'chase'; c.lostT = 0; }
    else if (c.state === 'chase') { c.lostT += dt; if (c.lostT > 3) c.state = c.type === 'statue' ? 'return' : 'wander'; }
    let vx = 0, vy = 0, sp = 46 * D().calmoSpd;
    if (c.state === 'chase' && S.field) {
      sp = chaseSp;
      const ct = [tOf(c.x), tOf(c.y)];
      if (ct[0] === pT[0] && ct[1] === pT[1]) { vx = p.x - c.x; vy = p.y - c.y; }
      else { const nx = stepDown(S.field, ct[0], ct[1], 'calmo'); if (nx) { vx = cOf(nx[0]) - c.x; vy = cOf(nx[1]) - c.y; } else { vx = p.x - c.x; vy = p.y - c.y; } }
    } else if (c.state === 'wander') {
      c.wT -= dt;
      if (c.wT <= 0 || !c.next) {
        const ct = [tOf(c.x), tOf(c.y)];
        const opts = DIR8.slice(0, 4).filter(([ddx, ddy]) => !solidFor(ct[0] + ddx, ct[1] + ddy, 'calmo'));
        if (opts.length) { const prefer = opts.find(o => o[0] === Math.sign(Math.cos(c.dir)) && o[1] === 0); const o = (prefer && chance(.6)) ? prefer : pick(opts); c.next = { x: cOf(ct[0] + o[0]), y: cOf(ct[1] + o[1]) }; c.dir = Math.atan2(o[1], o[0]); }
        c.wT = .9;
      }
      if (c.next) { vx = c.next.x - c.x; vy = c.next.y - c.y; if (Math.hypot(vx, vy) < 4) c.wT = 0; }
    } else if (c.state === 'return') {
      vx = c.home.x - c.x; vy = c.home.y - c.y; if (Math.hypot(vx, vy) < 6) { c.state = 'idle'; vx = vy = 0; }
    }
    const l = Math.hypot(vx, vy);
    c.moving = false;
    if (l > .5) { const ox = c.x; moveEnt(c, vx / l * sp * dt, vy / l * sp * dt, 12, 'calmo'); c.moving = Math.abs(c.x - ox) > .05 || true; c.flip = vx < 0; }
    if (d < 25 && p.invul <= 0 && !pInDepot()) hug(c);
  });
  // separação simples
  for (let i = 0; i < S.calmos.length; i++) for (let j = i + 1; j < S.calmos.length; j++) {
    const a = S.calmos[i], b = S.calmos[j], d = dist(a.x, a.y, b.x, b.y);
    if (d < 22 && d > 0) { const k = (22 - d) / 2 / d; moveEnt(a, (a.x - b.x) * k, (a.y - b.y) * k, 12, 'calmo'); moveEnt(b, (b.x - a.x) * k, (b.y - a.y) * k, 12, 'calmo'); }
  }

  /* ---- partículas e textos ---- */
  S.parts = S.parts.filter(q => (q.t += dt) < q.life);
  S.floats = S.floats.filter(f => (f.t += dt) < 1.3);
  S.shake = Math.max(0, S.shake - dt * 25);

  /* ---- câmera ---- */
  const tx = clamp(p.x - VW / 2, 0, WW - VW), ty = clamp(p.y - VH / 2, 0, WH - VH);
  S.cam.x = lerp(S.cam.x, tx, Math.min(1, dt * 6)); S.cam.y = lerp(S.cam.y, ty, Math.min(1, dt * 6));

  if (S.time <= 0) { S.time = 0; finishRun(); }
}

function titleCase(s) { return s.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase()).replace(' Do ', ' do ').replace(' De ', ' de '); }

function hug(c) {
  const p = S.p;
  Sound.play('hug'); S.shake = 12;
  const lost = S.carried.slice(); S.carried = []; S.dirty = true;
  lost.forEach((k, i) => { const a = (i / Math.max(1, lost.length)) * Math.PI * 2 + Math.random(); S.items.push({ k, x: p.x, y: p.y, t: 0, z: 0, vz: 160, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, fresh: .9 }); });
  p.stun = S.proto === 'jo' ? .45 : 1.0; p.invul = 2.2; c.pause = 1.8; p.hugs++;
  const d = dist(p.x, p.y, c.x, c.y) || 1;
  moveEnt(p, (p.x - c.x) / d * 26, (p.y - c.y) / d * 26, 13, 'player');
  if (chance(.12)) p.infected = true;
  toastS(lost.length ? `"Relaxa..." Um abraço longo. Você deixou cair ${lost.length} ${lost.length > 1 ? 'itens' : 'item'}!` : '"Fica mais um pouquinho..." Você se soltou do abraço.');
  S.parts.push({ x: p.x, y: p.y - 30, t: 0, life: 1, heart: true });
}

function trapRun(z) {
  S.active = false;
  Sound.stopMuzak();
  S.onDone({ ok: false, reason: 'trapped', store: z.name });
}

function finishRun() {
  if (!S.active) return;
  S.active = false;
  Sound.stopMuzak();
  if (!pInDepot()) { Sound.play('slam'); S.onDone({ ok: false, reason: 'outside' }); return; }
  const res = {
    ok: true, stash: S.stash,
    saved: S.saved.map(n => ({ key: n.key, infected: n.infected })),
    dog: S.dogSaved, notes: S.notes.slice(), playerInfected: S.p.infected, hugs: S.p.hugs, skipped: !!S.skipped,
  };
  Cut.play('slam', { proto: S.proto, saved: S.saved.map(n => n.c.look), dog: S.dogSaved }, 'A porta de aço desceu de uma vez. Do lado de dentro, só respiração ofegante. Do lado de fora, alguém começou a bater. Educadamente.').then(() => S.onDone(res));
}

/* pular o resto da exploração: corre de volta ao depósito com o que estiver carregando */
function skipRun() {
  if (!S.active || S.phase !== 'play') return;
  if (!S.confirmSkip) {
    S.confirmSkip = true; toastS('Pular a exploração? Você volta ao depósito com o que carrega. Clique de novo para confirmar.');
    setTimeout(() => { S.confirmSkip = false; }, 3500);
    return;
  }
  S.carried.forEach(k => { const key = ITEMS[k].as || k; S.stash[key] = (S.stash[key] || 0) + (ITEMS[k].u ? 1 : (ITEMS[k].pick || 1)); });
  S.followers.forEach(f => { f.saved = true; if (f.kind === 'dog') S.dogSaved = true; else S.saved.push(f); });
  S.carried = []; S.followers = [];
  const dz = ZONES.depot; S.p.x = (dz.x + dz.w / 2) * TILE; S.p.y = (dz.y + 4) * TILE;
  S.skipped = true; S.time = 0; finishRun();
}

function tryCloseDoor() {
  if (!S.active || S.phase !== 'play' || !pInDepot()) return;
  const empty = !Object.keys(S.stash).length && !S.saved.length && !S.dogSaved;
  if (empty && !S.confirmClose) { S.confirmClose = true; toastS('O depósito está vazio! Clique de novo para baixar mesmo assim.'); return; }
  S.time = 0; finishRun();
}

/* clique / toque no mapa */
function scavPointer(e) {
  if (!S.active) return;
  if (S.phase === 'overview') { S.skipOverview = true; return; }
  if (S.phase !== 'play') return;
  const r = S.cv.getBoundingClientRect();
  const wx = (e.clientX - r.left) * VW / r.width + S.cam.x, wy = (e.clientY - r.top) * VH / r.height + S.cam.y;
  const tx = tOf(wx), ty = tOf(wy);
  const o = S.ogrid[ty] && S.ogrid[ty][tx];
  const p = S.p;
  if (o && !o.deco && !o.searched) {
    const cx = clamp(p.x, o.x * TILE, (o.x + o.w) * TILE), cy = clamp(p.y, o.y * TILE, (o.y + o.h) * TILE);
    if (dist(p.x, p.y, cx, cy) < 36) { S.path = []; startSearch(o); return; }
    // anda até uma casa vizinha livre
    let best = null, bd = 1e9;
    for (let y = o.y - 1; y <= o.y + o.h; y++) for (let x = o.x - 1; x <= o.x + o.w; x++) {
      if (solidFor(x, y, 'player')) continue;
      const d = dist(cOf(x), cOf(y), p.x, p.y); if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) { planPath(best[0], best[1]); S.autoSearch = o; }
    return;
  }
  if (solidFor(tx, ty, 'player')) return;
  S.autoSearch = null;
  planPath(tx, ty, wx, wy);
}
function planPath(tx, ty, fx, fy) {
  const D = bfs(tx, ty, 'player');
  let cx = tOf(S.p.x), cy = tOf(S.p.y);
  if (D[cy * COLS + cx] < 0) { S.path = [{ x: fx || cOf(tx), y: fy || cOf(ty) }]; return; }
  const path = [];
  let guard = 0;
  while (!(cx === tx && cy === ty) && guard++ < 300) { const n = stepDown(D, cx, cy, 'player'); if (!n) break; cx = n[0]; cy = n[1]; path.push({ x: cOf(cx), y: cOf(cy) }); }
  if (fx !== undefined && path.length) path[path.length - 1] = { x: fx, y: fy };
  S.path = path;
}

/* =========================================================
   DESENHO
   ========================================================= */
function lightAt(lx, x, y, r, a) {
  const sx = x - S.cam.x, sy = y - S.cam.y;
  if (sx < -r || sy < -r || sx > VW + r || sy > VH + r) return;
  const g = lx.createRadialGradient(sx, sy, 0, sx, sy, r);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(.55, `rgba(0,0,0,${a * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  lx.fillStyle = g; lx.fillRect(sx - r, sy - r, r * 2, r * 2);
}
function glowAt(ctx, x, y, r, color, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a)); g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function drawShutter(ctx, z, now) {
  const sh = S.shut[z.id]; const X = z.door[0] * TILE, Y = z.frontRow * TILE, W = z.door[1] * TILE;
  if (sh.prog > 0) {
    const h = TILE * Math.min(1, sh.prog / .6);
    ctx.save(); ctx.beginPath(); ctx.rect(X, Y, W, TILE); ctx.clip();
    const top = z.north ? Y : Y;
    ctx.fillStyle = '#8b939c'; ctx.fillRect(X, top, W, h);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let yy = top + 4; yy < top + h; yy += 6) ctx.fillRect(X, yy, W, 1.5);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(X + 1, top + 1, W - 2, h - 2);
    if (z.sealed) {
      ctx.fillStyle = '#f1c40f'; ctx.save(); ctx.translate(X + W / 2, Y + TILE / 2); ctx.rotate(-.12); ctx.fillRect(-W / 2 - 10, -7, W + 20, 14);
      ctx.fillStyle = '#111'; ctx.font = 'bold 10px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('INTERDITADO · INTERDITADO', 0, 1); ctx.restore();
    }
    ctx.restore();
  }
  if (!z.sealed && z.closeAt && S.time <= z.closeAt + 6 && sh.prog < 1) {
    if (Math.floor(now / 250) % 2) { ctx.fillStyle = '#ff2d2d'; circ(ctx, X - 6, Y + TILE / 2, 5); ctx.fill(); circ(ctx, X + W + 6, Y + TILE / 2, 5); ctx.fill(); }
  }
}

function render(now) {
  const ctx = S.ctx, p = S.p;
  const shx = (Math.random() - .5) * S.shake, shy = (Math.random() - .5) * S.shake;
  const camX = S.phase === 'overview' ? 0 : S.cam.x, camY = S.phase === 'overview' ? 0 : S.cam.y;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0a10'; ctx.fillRect(0, 0, VW, VH);

  if (S.phase === 'overview') return renderOverview(ctx, now);

  ctx.save(); ctx.translate(-Math.round(camX) + shx, -Math.round(camY) + shy);
  ctx.drawImage(S.world, Math.max(0, camX - 20), Math.max(0, camY - 20), VW + 40, VH + 40, Math.max(0, camX - 20), Math.max(0, camY - 20), VW + 40, VH + 40);

  // água da fonte
  const f = ZONES && LAYOUT.find(o => o.k === 'fountain');
  const fx = (f.x + f.w / 2) * TILE, fy = (f.y + f.h / 2) * TILE;
  ctx.strokeStyle = 'rgba(200,240,255,.5)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const r = ((now / 30 + i * 20) % 60) + 16; ctx.globalAlpha = 1 - (r - 16) / 60; circ(ctx, fx, fy, r); ctx.stroke(); }
  ctx.globalAlpha = 1;

  // persianas
  Object.values(ZONES).forEach(z => drawShutter(ctx, z, now));

  // marcadores de móveis revistados / dicas
  S.objs.forEach(o => {
    if (o.deco) return;
    const cx = (o.x + o.w / 2) * TILE, cy = (o.y + o.h / 2) * TILE;
    if (o.searched) { ctx.fillStyle = 'rgba(10,10,15,.35)'; ctx.fillRect(o.x * TILE + 3, o.y * TILE + 3, o.w * TILE - 6, o.h * TILE - 6); return; }
    const d = dist(cx, cy, p.x, p.y);
    if (d < 260) { const tw = (Math.sin(now / 200 + o.id) + 1) / 2; ctx.fillStyle = `rgba(255,240,170,${.25 + tw * .5})`; drawSpark(ctx, cx + Math.sin(o.id) * o.w * 12, cy - 8, 4 + tw * 3); }
  });
  if (S.target && !S.target.searched) {
    const o = S.target;
    ctx.strokeStyle = '#ffe58a'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now / 40;
    rr(ctx, o.x * TILE, o.y * TILE, o.w * TILE, o.h * TILE, 6); ctx.stroke(); ctx.setLineDash([]);
  }

  // entidades ordenadas por y
  const ents = [];
  S.items.forEach(it => ents.push({ y: it.y, d: () => drawFloorItem(ctx, it, now) }));
  S.npcs.forEach(n => { if (!n.hidden) ents.push({ y: n.y, d: () => drawNpc(ctx, n, now) }); });
  S.calmos.forEach(c => ents.push({ y: c.y, d: () => drawCalmo(ctx, c, now) }));
  ents.push({ y: p.y, d: () => drawPlayer(ctx, now) });
  ents.sort((a, b) => a.y - b.y).forEach(e => e.d());

  // partículas
  S.parts.forEach(q => {
    const k = q.t / q.life;
    if (q.bang) { drawItem(ctx, 'bang', q.x, q.y - k * 10, 22); return; }
    if (q.heart) { ctx.globalAlpha = 1 - k; drawItem(ctx, 'heart', q.x, q.y - k * 30, 20); ctx.globalAlpha = 1; return; }
    ctx.fillStyle = q.c + (1 - k) * .5 + ')'; circ(ctx, q.x, q.y - k * 6, q.r * (1 + k)); ctx.fill();
  });
  ctx.restore();

  /* ---- iluminação ---- */
  const lx = S.lctx;
  const dark = S.blackout ? .93 : clamp(.32 + (RUN_TIME - S.time) / RUN_TIME * .46, .32, .8);
  lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, VW, VH);
  lx.fillStyle = `rgba(6,7,16,${dark})`; lx.fillRect(0, 0, VW, VH);
  lx.globalCompositeOperation = 'destination-out';
  lx.save(); lx.translate(shx, shy);
  lightAt(lx, p.x, p.y, 230, 1);
  const late = S.time < 20;
  if (!S.blackout) {
    Object.values(ZONES).forEach(z => {
      if (z.sealed) return;
      const fl = z.id === 'farm' ? (Math.sin(now / 70) > .6 ? .2 : .7) : .7;
      if (late && !z.depot) return;
      const cx = (z.x + z.w / 2) * TILE, cy = (z.y + z.h / 2) * TILE;
      lightAt(lx, cx, cy, Math.max(z.w, z.h) * TILE * .55, z.depot ? .95 : fl);
    });
    if (!late) for (let x = 3; x < COLS; x += 6) lightAt(lx, cOf(x), cOf(15.5), 150, .55);
    lightAt(lx, (24 + 2) * TILE, (14 + 2) * TILE, 140, .5);
    lightAt(lx, cOf(47), cOf(29), 130, .6);
  } else lightAt(lx, (ZONES.depot.x + 4) * TILE, (ZONES.depot.y + 6) * TILE, 200, .9);
  S.followers.forEach(fw => lightAt(lx, fw.x, fw.y, 60, .4));
  lx.restore();
  ctx.drawImage(S.light, 0, 0);

  /* ---- brilhos aditivos ---- */
  ctx.save(); ctx.translate(-Math.round(camX) + shx, -Math.round(camY) + shy);
  ctx.globalCompositeOperation = 'lighter';
  Object.values(ZONES).forEach(z => { if (z.signPos && !(S.blackout && !z.depot)) glowAt(ctx, z.signPos.x, z.signPos.y, z.signPos.w * .7, z.color, z.sealed ? .08 : .22); });
  glowAt(ctx, cOf(47), cOf(29), 110, '#3cff8f', .18 + Math.sin(now / 300) * .05);
  if (late) {
    const pulse = (Math.sin(now / 160) + 1) / 2;
    for (let x = 4; x < COLS; x += 8) glowAt(ctx, cOf(x), cOf(12), 120, '#ff1a1a', .12 + pulse * .12);
  }
  S.calmos.forEach(c => glowAt(ctx, c.x, c.y - 20, 34, '#9dff8a', .12));
  ctx.globalCompositeOperation = 'source-over';

  // textos flutuantes e balões (acima da luz)
  S.floats.forEach(fl => { const k = fl.t / 1.3; ctx.globalAlpha = 1 - k; outlineText(ctx, fl.text, fl.x, fl.y - k * 30, fl.color, 14); ctx.globalAlpha = 1; });
  S.npcs.forEach(n => { if (!n.hidden && n.bubbleT > 0) bubble(ctx, n.x, n.y - 52, n.bubble); else if (!n.hidden && !n.following && !n.saved) { const bob = Math.sin(now / 200) * 3; drawItem(ctx, 'bang', n.x + 14, n.y - 52 + bob, 16); outlineText(ctx, n.kind === 'dog' ? 'Caramelo' : n.c.name, n.x, n.y - 38, '#fff', 11); } });
  if (S.target && !S.search) { const o = S.target; bubble(ctx, (o.x + o.w / 2) * TILE, o.y * TILE - 6, (Input.touch ? 'Toque: ' : 'E · ') + 'Revistar'); }
  if (S.search) {
    const k = S.search.t / S.search.need;
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; circ(ctx, p.x, p.y - 62, 13); ctx.stroke();
    ctx.strokeStyle = '#ffe58a'; ctx.beginPath(); ctx.arc(p.x, p.y - 62, 13, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  if (S.phase === 'count') {
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, VW, VH);
    const n = Math.ceil(S.count);
    outlineText(ctx, n > 0 ? String(n) : 'VAI!', VW / 2, VH / 2, '#fff', 110, 'Bungee');
    outlineText(ctx, 'Pegue o que puder e volte ao DEPÓSITO 3B', VW / 2, VH / 2 + 90, '#ffe58a', 20);
  }
}

function drawSpark(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * .3, y - s * .3); ctx.lineTo(x + s, y); ctx.lineTo(x + s * .3, y + s * .3); ctx.lineTo(x, y + s); ctx.lineTo(x - s * .3, y + s * .3); ctx.lineTo(x - s, y); ctx.lineTo(x - s * .3, y - s * .3); ctx.closePath(); ctx.fill(); }
function outlineText(ctx, text, x, y, color, size, font = 'Inter') {
  ctx.font = `${font === 'Bungee' ? '' : 'bold '}${size}px ${font}, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = 'rgba(10,8,16,.9)'; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function bubble(ctx, x, y, text) {
  ctx.font = 'bold 12px Inter, sans-serif';
  const w = Math.min(260, ctx.measureText(text).width + 18);
  rr(ctx, x - w / 2, y - 24, w, 22, 8); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = OUT; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y - 3); ctx.lineTo(x, y + 4); ctx.lineTo(x + 5, y - 3); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fffdf5'; ctx.fillRect(x - 6, y - 5, 12, 3);
  ctx.fillStyle = OUT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 13);
}
function drawFloorItem(ctx, it, now) {
  const b = it.z > 0 ? it.z : Math.sin(now / 300 + it.t) * 2 + 2;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(ctx, it.x, it.y + 10, 11, 3.5); ctx.fill();
  if (it.k === 'carrinho') { drawItem(ctx, 'carrinho', it.x, it.y - 4, 40); return; }
  ctx.fillStyle = 'rgba(255,240,170,.18)'; circ(ctx, it.x, it.y - b, 16); ctx.fill();
  drawItem(ctx, it.k, it.x, it.y - b, 26);
}
function drawNpc(ctx, n, now) {
  if (n.kind === 'dog') { drawDog(ctx, n.x, n.y + 10, .5, { t: now / 1000, walk: n.following && S.p.moving, happy: n.following || n.saved, flip: n.flip }); return; }
  const pose = n.following && n.moving ? 'walk' : (n.saved ? 'idle' : 'idle');
  drawChar(ctx, n.x, n.y + 12, .7, n.c.look, { t: now / 1000 + n.t, pose, flip: n.flip, expr: n.saved ? 'grin' : (n.following ? 'normal' : 'scared') });
}
function drawCalmo(ctx, c, now) {
  const pose = c.state === 'chase' ? 'reach' : (c.moving && c.state !== 'idle' ? 'walk' : 'idle');
  drawChar(ctx, c.x, c.y + 12, .7, c.look, { t: now / 1000 + c.t, pose, flip: c.flip, expr: 'smile', pale: .95, glassy: c.glassy });
}
function drawPlayer(ctx, now) {
  const p = S.p;
  ctx.save();
  if (p.invul > 0 && Math.floor(now / 90) % 2) ctx.globalAlpha = .45;
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ell(ctx, p.x, p.y + 12, 16, 5); ctx.stroke();
  if (S.cart) { ctx.save(); ctx.translate(p.x + p.face * 22, p.y + 2); ctx.scale(p.face, 1); drawItem(ctx, 'carrinho', 0, 0, 34); ctx.restore(); }
  const look = PROTAGONISTS.find(q => q.key === S.proto).look;
  drawChar(ctx, p.x, p.y + 12, .72, look, { t: p.walkT + now / 4000, pose: p.stun > 0 ? 'up' : (p.moving ? (p.sprint ? 'run' : 'walk') : 'idle'), flip: p.face < 0, expr: p.stun > 0 ? 'scared' : (S.time < 15 ? 'scared' : 'normal') });
  if (S.carried.length) { S.carried.slice(0, 3).forEach((k, i) => drawItem(ctx, k, p.x - 12 + i * 12, p.y - 58 - i * 2, 16)); }
  ctx.restore();
}

function renderOverview(ctx, now) {
  const sc = Math.min(VW / WW, VH / WH);
  const ox = (VW - WW * sc) / 2, oy = (VH - WH * sc) / 2;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(sc, sc);
  ctx.drawImage(S.world, 0, 0);
  Object.values(ZONES).forEach(z => drawShutter(ctx, z, now));
  ctx.restore();
  ctx.fillStyle = 'rgba(5,5,12,.35)'; ctx.fillRect(0, 0, VW, VH);
  Object.values(ZONES).forEach(z => {
    const cx = ox + (z.x + z.w / 2) * TILE * sc, cy = oy + (z.y + z.h / 2) * TILE * sc;
    if (z.sealed) { outlineText(ctx, 'LACRADO', cx, cy, '#ff6b81', 15); return; }
    if (z.depot) {
      const pulse = 1 + Math.sin(now / 200) * .08;
      outlineText(ctx, 'VOCÊ ESTÁ AQUI', cx, cy - 12, '#ffe58a', 14 * pulse);
      outlineText(ctx, 'DEPÓSITO', cx, cy + 8, '#fff', 12);
      return;
    }
    if (z.closeAt) outlineText(ctx, `fecha em ${fmtTime((RUN_TIME - z.closeAt) / S.tscale)}`, cx, cy + 14, '#ff9f9f', 12);
  });
  outlineText(ctx, 'MAPA DO PISO TÉRREO', VW / 2, 110, '#fff', 20, 'Bungee');
  outlineText(ctx, 'Algumas lojas fecham antes. Quem ficar dentro, fica preso. · Clique para começar', VW / 2, VH - 110, '#ffe58a', 14);
}

function renderMini() {
  const m = S.mctx, k = S.mini.width / COLS;
  m.setTransform(1, 0, 0, 1, 0, 0);
  m.fillStyle = '#0d0c13'; m.fillRect(0, 0, S.mini.width, S.mini.height);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const t = S.grid[j][i];
    if (t === T_WALL) continue;
    const z = S.zgrid[j][i];
    m.fillStyle = t === T_FURN ? '#3a3a48' : t === T_GLASS ? '#2f4a5a' : t === T_DOOR ? (S.shut[S.dgrid[j][i]].prog >= .6 ? '#ff3b3b' : '#9aa') : (z === 'corr' ? '#54525e' : z === 'depot' ? '#8a6a20' : rgba(ZONES[z] ? ZONES[z].color : '#555', .35));
    m.fillRect(i * k, j * k, k, k);
  }
  const dz = ZONES.depot;
  if (Math.floor(performance.now() / 400) % 2) { m.strokeStyle = '#ffe58a'; m.lineWidth = 1.5; m.strokeRect((dz.x + 1) * k, (dz.y + 1) * k, (dz.w - 2) * k, (dz.h - 2) * k); }
  S.npcs.forEach(n => { if (!n.hidden && !n.saved) { m.fillStyle = n.kind === 'dog' ? '#ffb347' : '#5ad1ff'; m.fillRect(n.x / TILE * k - 1.5, n.y / TILE * k - 1.5, 3, 3); } });
  S.calmos.forEach(c => { m.fillStyle = '#9dff8a'; m.fillRect(c.x / TILE * k - 1.5, c.y / TILE * k - 1.5, 3, 3); });
  m.fillStyle = '#fff'; m.beginPath(); m.arc(S.p.x / TILE * k, S.p.y / TILE * k, 2.6, 0, 7); m.fill();
  m.strokeStyle = 'rgba(255,255,255,.5)'; m.lineWidth = 1; m.strokeRect(S.cam.x / TILE * k, S.cam.y / TILE * k, VW / TILE * k, VH / TILE * k);
}

/* ---------------- HUD ---------------- */
function renderSlots() {
  const cap = capacity(); let h = '';
  S.carried.forEach(k => h += `<span class="slot full w${ITEMS[k].w}" title="${ITEMS[k].n}">${icon(k, 28)}</span>`);
  S.followers.forEach(f => {
    const w = f.kind === 'dog' ? 1 : 2;
    h += `<span class="slot full w${w} who">${f.kind === 'dog' ? icon('dog', 30) : `<canvas class="pt" data-key="${f.key}" width="30" height="30"></canvas>`}</span>`;
  });
  for (let i = slotsUsed(); i < cap; i++) h += '<span class="slot"></span>';
  $('#hudSlots').innerHTML = `<span class="slot-label">${S.cart ? 'Carrinho' : 'Mãos'}<b>${slotsUsed()}/${cap}</b></span>` + h + (S.cart ? `<span class="cart-tag">${icon('carrinho', 26)}</span>` : '');
  $$('#hudSlots canvas.pt').forEach(cv => paintPortrait(cv, CHARACTERS[cv.dataset.key].look));
}
function updateStashHUD() {
  const parts = Object.entries(S.stash).map(([k, n]) => `<span class="st">${icon(k, 20)}${ITEMS[k].u ? '' : '×' + n}</span>`);
  const ppl = S.saved.length;
  $('#hudStash').innerHTML = `<b>Depósito</b> ${parts.join('') || '<i>vazio</i>'}${ppl ? `<span class="st">Pessoas ×${ppl}</span>` : ''}${S.dogSaved ? `<span class="st">${icon('dog', 20)}</span>` : ''}`;
}
function hud() {
  const s = Math.max(0, Math.ceil(S.time / S.tscale));
  const el = $('#hudTimer');
  const txt = fmtTime(s);
  if (el.textContent !== txt) { el.textContent = txt; el.parentElement.classList.toggle('danger', s <= 10); }
  if (S.dirty) { S.dirty = false; renderSlots(); updateStashHUD(); }
  $('#hudStam').style.width = (S.p.stam * 100).toFixed(0) + '%';
  $('#hudStam').classList.toggle('low', S.p.stam < .25);
  const btn = $('#btnClose'), inD = pInDepot() && S.phase === 'play';
  if (btn.disabled === inD) btn.disabled = !inD;
  $('#btnSprint').classList.toggle('on', S.sprintToggle);
}

function scavLoop(now) {
  const dt = Math.min(.05, (now - S.last) / 1000); S.last = now;
  if (S.active && Screen.cur === 'run') {
    update(dt);
    if (S.active) { render(now); hud(); if (S.frame % 3 === 0) renderMini(); }
  }
  requestAnimationFrame(scavLoop);
}

/* ---------------- entrada ---------------- */
const Input = { touch: false };
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ShiftLeft: 'shift', ShiftRight: 'shift' };
addEventListener('keydown', e => {
  if (!S.active || Screen.cur !== 'run') return;
  const k = KEYMAP[e.code];
  if (k) { SKeys[k] = true; e.preventDefault(); }
  if (S.phase === 'overview') { S.skipOverview = true; return; }
  if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); if (S.phase === 'play') startSearch(nearestSearchable()); }
  if (e.code === 'Enter') { e.preventDefault(); tryCloseDoor(); }
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) SKeys[k] = false; });
addEventListener('blur', () => Object.keys(SKeys).forEach(k => SKeys[k] = false));
addEventListener('touchstart', () => { Input.touch = true; document.body.classList.add('touch'); }, { passive: true, once: true });
