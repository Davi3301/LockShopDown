'use strict';
/* =========================================================
   LOCKSHOPDOWN — cutscenes
   Cut.play(nome, dados, legenda) → Promise
   Cenas desenhadas em canvas, tela cheia, com legenda datilografada.
   ========================================================= */

const Cut = {
  q: [], cur: null, raf: null,
  play(name, data = {}, text = '') {
    if (!CUTS[name]) return Promise.resolve();
    return new Promise(res => { this.q.push({ name, data, text, res }); if (!this.cur) this.next(); });
  },
  next() {
    const it = this.q.shift();
    const el = $('#cut');
    if (!it) { this.cur = null; el.classList.remove('open'); cancelAnimationFrame(this.raf); return; }
    const sc = CUTS[it.name];
    this.cur = { ...it, sc, t0: performance.now(), typed: 0, done: false, fired: new Set(), holdT: 0 };
    el.classList.add('open'); el.classList.remove('fade');
    $('#cutText').textContent = '';
    $('#cutTag').textContent = sc.tag || '';
    const cv = $('#cutCv');
    this.fit(cv);
    const loop = now => {
      if (!this.cur) return;
      const c = this.cur, t = (now - c.t0) / 1000;
      // sons
      (sc.sfx || []).forEach(([at, s], i) => { if (t >= at && !c.fired.has(i)) { c.fired.add(i); Sound.play(s); } });
      // legenda
      if (c.text) {
        const want = Math.min(c.text.length, Math.floor(Math.max(0, t - (sc.textAt || .4)) * 45));
        if (want > c.typed) { c.typed = want; $('#cutText').textContent = c.text.slice(0, want); if (want % 5 === 0) Sound.play('type'); }
      }
      this.draw(cv, t);
      const dur = sc.dur, hold = Math.max(1.4, (c.text || '').length * .028);
      if (t > dur && c.typed >= (c.text || '').length) { c.holdT += 1 / 60; if (t > Math.max(dur, (sc.textAt || .4) + (c.text || '').length / 45) + hold) return this.finish(); }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  fit(cv) {
    const w = innerWidth, h = innerHeight, asp = w / h;
    let LW = 960, LH = 540;
    if (asp > 16 / 9) LW = Math.round(540 * asp); else LH = Math.round(960 / asp);
    const k = Math.min(2, (window.devicePixelRatio || 1)) * w / LW;
    cv.width = Math.round(LW * k); cv.height = Math.round(LH * k);
    this.LW = LW; this.LH = LH; this.k = k;
  },
  draw(cv, t) {
    const c = this.cur, ctx = cv.getContext('2d');
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    try { c.sc.draw(ctx, this.LW, this.LH, t, c.data); } catch (e) { console.error(e); }
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0);
    // fade de entrada
    if (t < .35) { ctx.fillStyle = `rgba(0,0,0,${1 - t / .35})`; ctx.fillRect(0, 0, this.LW, this.LH); }
    // grão de filme
    ctx.fillStyle = 'rgba(255,255,255,.025)';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * this.LW, Math.random() * this.LH, 2, 2);
  },
  click() {
    const c = this.cur; if (!c) return;
    if (c.text && c.typed < c.text.length) { c.typed = c.text.length; $('#cutText').textContent = c.text; c.t0 = Math.min(c.t0, performance.now() - (c.sc.dur * 1000)); return; }
    this.finish();
  },
  skipAll() { const all = [this.cur, ...this.q]; this.q = []; if (this.cur) { const c = this.cur; this.cur = null; c.res(); } all.slice(1).forEach(i => i && i.res()); this.next(); },
  finish() {
    const c = this.cur; if (!c) return;
    cancelAnimationFrame(this.raf);
    this.cur = null; c.res();
    this.next();
  },
};

/* controles: clique avança, Espaço/Enter avança, Esc pula */
$('#cut').addEventListener('click', e => { if (e.target.closest('.cut-skip')) return; Cut.click(); });
addEventListener('keydown', e => {
  if (!Cut.cur) return;
  if (['Space', 'Enter', 'Escape'].includes(e.code)) { e.preventDefault(); e.code === 'Escape' ? Cut.finish() : Cut.click(); }
  e.stopImmediatePropagation();
}, true);
addEventListener('resize', () => { if (Cut.cur) Cut.fit($('#cutCv')); });

/* =========================================================
   CENÁRIOS REUTILIZÁVEIS
   ========================================================= */
function cRoom(c, W, H, dark = 0) {
  if (!Room.bg) Room.prerender();
  const s = Math.max(W / 960, H / 540);
  c.drawImage(Room.bg, (W - 960 * s) / 2, (H - 540 * s) / 2, 960 * s, 540 * s);
  if (dark) { c.fillStyle = `rgba(6,10,30,${dark})`; c.fillRect(0, 0, W, H); }
  return { s, ox: (W - 960 * s) / 2, oy: (H - 540 * s) / 2 };
}
function cCorridor(c, W, H, t, light = .5) {
  const fy = H * .72;
  const g = c.createLinearGradient(0, 0, 0, fy); g.addColorStop(0, '#0d0c14'); g.addColorStop(1, '#1c1a26');
  c.fillStyle = g; c.fillRect(0, 0, W, fy);
  // vitrines
  for (let x = -40; x < W + 200; x += 230) {
    c.fillStyle = '#14131c'; c.fillRect(x, fy - 250, 200, 250);
    c.fillStyle = 'rgba(120,200,255,.08)'; c.fillRect(x + 10, fy - 220, 180, 200);
    c.strokeStyle = 'rgba(160,220,255,.14)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 30, fy - 30); c.lineTo(x + 90, fy - 210); c.stroke();
    c.fillStyle = '#2a2833'; c.fillRect(x - 15, fy - 260, 15, 260);
  }
  const neon = ['#ff3d7f', '#2de2c6', '#60a5fa', '#facc15'];
  [[.2, 0], [.62, 1], [.9, 2]].forEach(([px, i]) => {
    const on = Math.sin(t * 9 + i * 3) > -.7;
    c.save(); c.globalCompositeOperation = 'lighter'; if (on) glowAt(c, W * px, fy - 280, 90, neon[i], .25); c.restore();
    c.fillStyle = on ? neon[i] : '#333'; c.fillRect(W * px - 50, fy - 288, 100, 14);
  });
  const fg = c.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, '#3a3644'); fg.addColorStop(1, '#16141c');
  c.fillStyle = fg; c.fillRect(0, fy, W, H - fy);
  c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 2;
  for (let x = -((t * 0) % 80); x < W; x += 80) { c.beginPath(); c.moveTo(x, fy); c.lineTo(x - 140, H); c.stroke(); }
  c.fillStyle = `rgba(4,4,10,${1 - light})`; c.fillRect(0, 0, W, H);
  c.strokeStyle = OUT; c.lineWidth = 2.5;
  return fy;
}
function cSteelDoor(c, x, y, w, h, lift = 0, shake = 0) {
  c.save(); c.translate(shake, 0);
  rr(c, x - 12, y - 12, w + 24, h + 12, 6); paint(c, '#3a3f47');
  c.fillStyle = '#0a0a10'; c.fillRect(x, y, w, h);
  const sh = h * (1 - lift);
  c.fillStyle = '#9aa3ad'; c.fillRect(x, y, w, sh);
  for (let yy = y + 6; yy < y + sh; yy += 14) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x, yy, w, 2); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x, yy + 2, w, 1); }
  c.strokeStyle = OUT; c.lineWidth = 3; c.strokeRect(x, y, w, sh);
  rr(c, x + w / 2 - 22, y + sh - 14, 44, 10, 3); paint(c, '#555');
  c.restore();
}
function cVignette(c, W, H, a = .6) { const g = c.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, W * .7); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function cBigText(c, txt, x, y, size, color, a = 1) { c.save(); c.globalAlpha = a; outlineText(c, txt, x, y, color, size, 'Bungee'); c.restore(); }
function cSack(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 2.5; c.strokeStyle = OUT; ell(c, 0, 0, 16, 18); paint(c, '#b98a5a'); c.beginPath(); c.moveTo(-6, -16); c.lineTo(0, -24); c.lineTo(6, -16); c.stroke(); c.restore(); }
function cNote(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = '#ffe58a'; circ(c, 0, 0, 5); c.fill(); c.strokeStyle = '#ffe58a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(5, 0); c.lineTo(5, -20); c.lineTo(14, -16); c.stroke(); c.restore(); }
function cSpeaker(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 3; c.strokeStyle = OUT;
  c.beginPath(); c.moveTo(-14, -18); c.lineTo(14, -18); c.lineTo(40, 30); c.lineTo(-40, 30); c.closePath(); paint(c, '#9aa3ad');
  rr(c, -8, -34, 16, 18, 3); paint(c, '#6b7480');
  c.strokeStyle = 'rgba(255,230,120,.8)'; c.lineWidth = 4;
  for (let i = 0; i < 3; i++) { const r = 40 + ((t * 70 + i * 30) % 90); c.globalAlpha = 1 - (r - 40) / 90; c.beginPath(); c.arc(0, 40, r, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
  c.restore();
}
function cCRT(c, x, y, w, h, tint, inner) {
  rr(c, x - 14, y - 14, w + 28, h + 40, 12); paint(c, '#3b3a44');
  c.save(); rr(c, x, y, w, h, 10); c.clip();
  c.fillStyle = tint; c.fillRect(x, y, w, h);
  inner();
  c.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = y; yy < y + h; yy += 4) c.fillRect(x, yy, w, 1.5);
  c.restore();
  rr(c, x, y, w, h, 10); c.lineWidth = 3; c.strokeStyle = OUT; c.stroke();
  circ(c, x + w - 20, y + h + 14, 6); paint(c, '#ff3b3b');
}
const LACERDA = { skin: '#e5b088', hair: '#9a9a9a', hs: 'bald', shirt: '#f0f0f0', pants: '#2d3436', shoes: '#111', acc: ['tie', 'glasses', 'mustache', 'badge'], tie: '#8e1b1b', beard: '#9a9a9a', seed: 77 };
const MASCOT_LOOK = () => CHARACTERS.wagner.look;
function charsOf(d) { return (d.others || []).slice(0, 4); }

/* =========================================================
   CENAS
   ========================================================= */
const CUTS = {
  /* ---------- fim da exploração ---------- */
  slam: { dur: 3.2, tag: 'Depósito 3B · 21h50', sfx: [[0, 'shutter'], [1.6, 'slam'], [2.2, 'heart']],
    draw(c, W, H, t, d) {
      cRoom(c, W, H, .25);
      const k = Math.min(1, t / 1.6), sh = t > 1.6 && t < 2 ? Math.sin(t * 80) * 8 : 0;
      const look = PROTAGONISTS.find(p => p.key === d.proto).look;
      (d.saved || []).forEach((L, i) => drawChar(c, W / 2 - 220 - i * 95, H * .9, 2.3, L, { t: t + i, pose: 'idle', expr: 'scared', sweat: true }));
      if (d.dog) drawDog(c, W / 2 + 220, H * .9, 1.4, { t, pose: 'idle', happy: true });
      drawChar(c, W / 2, H * .92, 2.8, look, { t: t * 2, pose: t < 1.6 ? 'run' : 'idle', expr: 'scared', sweat: true });
      c.save(); c.translate(sh, 0);
      c.fillStyle = '#9aa3ad'; c.fillRect(0, 0, W, H * k * .95);
      for (let y = 8; y < H * k * .95; y += 18) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, y, W, 3); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, y + 3, W, 1.5); }
      if (k > 0) { c.fillStyle = '#3a3f47'; c.fillRect(0, H * k * .95 - 14, W, 14); }
      c.restore();
      if (t > 1.6) { for (let i = 0; i < 30; i++) { const a = (i * 2.4) % 6.28, r = (t - 1.6) * 200 * ((i % 5) / 5 + .5); c.fillStyle = `rgba(200,190,170,${Math.max(0, .6 - (t - 1.6) * .4)})`; circ(c, W / 2 + Math.cos(a) * r * 2, H * .9 + Math.sin(a) * r * .3, 6); c.fill(); } }
      if (t > 1.9) cBigText(c, 'A PORTA BAIXOU', W / 2, H * .45, 64, '#ff5b5b', Math.min(1, (t - 1.9) * 3));
      cVignette(c, W, H);
    } },

  /* ---------- expedições ---------- */
  depart: { dur: 4.4, tag: 'Expedição', sfx: [[0, 'shutter'], [3.3, 'slam']],
    draw(c, W, H, t, d) {
      const fy = cCorridor(c, W, H, t, d.lanterna ? .55 : .4);
      const dx = W * .2, lift = t < 1 ? t : t < 3 ? 1 : Math.max(0, 1 - (t - 3) * 3);
      cSteelDoor(c, dx, fy - 260, 220, 260, lift * .45);
      const px = t < 1 ? dx + 110 : dx + 110 + (t - 1) * 190;
      if (d.lanterna) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,240,190,.18)'; c.beginPath(); c.moveTo(px + 30, fy - 90); c.lineTo(px + 420, fy - 200); c.lineTo(px + 420, fy + 40); c.closePath(); c.fill(); c.restore(); }
      if (t > .6) drawChar(c, px, fy + 40, 2.6, d.m.look, { t: t * 1.2, pose: t < 1 ? 'idle' : 'walk', expr: 'scared', mask: d.mask });
      cVignette(c, W, H, .75);
    } },
  return: { dur: 4.6, tag: 'Expedição · volta', sfx: [[2.6, 'shutter'], [3.6, 'deposit']],
    draw(c, W, H, t, d) {
      const fy = cCorridor(c, W, H, t, .5);
      const dx = W * .2, lift = t < 2.6 ? 0 : Math.min(.45, (t - 2.6) * .8);
      cSteelDoor(c, dx, fy - 260, 220, 260, lift);
      const hurt = d.hurt, sp = hurt ? 120 : 190;
      const px = Math.max(dx + 110, W * .9 - t * sp);
      const limp = hurt ? Math.abs(Math.sin(t * 5)) * 6 : 0;
      drawChar(c, px, fy + 40 + limp, 2.6, d.m.look, { t, pose: px > dx + 112 ? 'walk' : 'idle', flip: true, expr: hurt ? 'sad' : 'grin', bandage: hurt ? 'head' : null });
      cSack(c, px + 34, fy - 30 + limp, 1.8);
      const items = Object.keys(d.items || {}).slice(0, 5);
      items.forEach((k, i) => { const tt = t - .5 - i * .3; if (tt > 0) drawItem(c, k, px - 60 + i * 34, fy - 190 - Math.min(20, tt * 40), 36); });
      cVignette(c, W, H, .7);
    } },
  lost: { dur: 4.4, tag: 'Expedição', sfx: [[1.2, 'heart'], [2, 'heart'], [3, 'giggle']],
    draw(c, W, H, t, d) {
      const fy = cCorridor(c, W, H, t, .35);
      cSteelDoor(c, W * .2, fy - 260, 220, 260, 0);
      cSack(c, W * .62, fy + 20, 1.6);
      drawItem(c, 'lanterna', W * .55, fy + 30, 60);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(200,180,255,.15)'; c.beginPath(); c.moveTo(W * .58, fy + 30); c.lineTo(W, fy - 40); c.lineTo(W, fy + 120); c.closePath(); c.fill(); c.restore();
      const a = Math.min(1, Math.max(0, (t - 1.5) / 2));
      c.save(); c.globalAlpha = a * .9; drawChar(c, W * .88, fy + 10, 1.3, d.m.look, { t, pose: 'idle', expr: 'smile', pale: .9, glassy: true }); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W * .88, fy - 60, 60, '#9dff8a', .2 * a); c.restore();
      cVignette(c, W, H, .85);
    } },

  /* ---------- porta ---------- */
  knock: { dur: 2.6, tag: 'A porta', sfx: [[.15, 'knock'], [1.3, 'knock']],
    draw(c, W, H, t, d) {
      c.fillStyle = '#1a1820'; c.fillRect(0, 0, W, H);
      const w = Math.min(W * .5, 520), h = H * .8, x = W / 2 - w / 2, y = H * .06;
      const shake = ((t > .15 && t < .75) || (t > 1.3 && t < 1.9)) ? Math.sin(t * 70) * 6 : 0;
      cSteelDoor(c, x, y, w, h, 0, shake);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,220,160,.35)'; c.fillRect(x, y + h, w, 8); c.restore();
      const fx = x + w * .35 + Math.sin(t * 2) * 30;
      c.fillStyle = 'rgba(0,0,0,.85)'; rr(c, fx, y + h, 36, 8, 3); c.fill(); rr(c, fx + 54, y + h, 36, 8, 3); c.fill();
      circ(c, W / 2, y + h * .45, 12); paint(c, '#222'); circ(c, W / 2, y + h * .45, 5); paint(c, '#7fb4d8', false);
      [[.2, -.15, W / 2 - w * .55, y + h * .25], [.5, .1, W / 2 + w * .55, y + h * .35], [1.35, -.05, W / 2 - w * .5, y + h * .6], [1.6, .12, W / 2 + w * .5, y + h * .7]].forEach(([at, rot, tx, ty]) => {
        if (t > at && t < at + .9) { c.save(); c.translate(tx, ty); c.rotate(rot); cBigText(c, 'TOC', 0, 0, 44, '#ffd23f', 1 - (t - at) / .9); c.restore(); }
      });
      cVignette(c, W, H, .7);
    } },

  /* ---------- noite ---------- */
  turn: { dur: 5.2, tag: '3h17', sfx: [[0, 'heart'], [.8, 'heart'], [1.8, 'giggle'], [3, 'bad']],
    draw(c, W, H, t, d) {
      cRoom(c, W, H, .78);
      const oth = charsOf(d);
      oth.forEach((m, i) => { const awake = t > 3; drawChar(c, W * .18 + i * 150, H * .9, 1.9, m.look, { t, pose: awake ? 'hug' : 'lie', expr: awake ? 'scared' : 'sleep', sweat: awake }); });
      const up = t > 1.4;
      c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W * .78, H * .7, 220, '#9dff8a', Math.min(.35, Math.max(0, t - 1) * .2)); c.restore();
      drawChar(c, W * .78, H * .92, 2.7, d.m.look, { t: t * .5, pose: up ? (t > 3 ? 'reach' : 'idle') : 'lie', expr: up ? 'smile' : 'sleep', pale: Math.min(.9, t * .25), glassy: t > 2.2 });
      cVignette(c, W, H, .8);
    } },
  freezer: { dur: 4.6, tag: 'Câmara fria', sfx: [[0, 'freeze'], [2.4, 'giggle'], [3.4, 'freeze']],
    draw(c, W, H, t, d) {
      c.fillStyle = '#aebccb'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 26) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, y, W, 3); }
      const ww = Math.min(W * .5, 520), wh = H * .62, x = W / 2 - ww / 2, y = H * .14;
      rr(c, x - 16, y - 16, ww + 32, wh + 32, 18); paint(c, '#5f6b77');
      c.save(); rr(c, x, y, ww, wh, 14); c.clip();
      c.fillStyle = '#16314a'; c.fillRect(x, y, ww, wh);
      const smile = t > 2.4;
      drawChar(c, W / 2, y + wh * 1.25, 4, d.m.look, { t: t * (smile ? .3 : 3), pose: 'hug', expr: smile ? 'smile' : 'scared', pale: smile ? .9 : .4, glassy: smile, sweat: !smile, shadow: false });
      if (smile) { c.globalCompositeOperation = 'lighter'; glowAt(c, W / 2, y + wh * .5, ww * .6, '#9dff8a', Math.min(.35, (t - 2.4) * .3)); c.globalCompositeOperation = 'source-over'; }
      const frost = Math.min(.8, .25 + t * .12);
      const g = c.createRadialGradient(W / 2, y + wh / 2, ww * .15, W / 2, y + wh / 2, ww * .7); g.addColorStop(0, `rgba(230,245,255,${frost * .3})`); g.addColorStop(1, `rgba(230,245,255,${frost})`);
      c.fillStyle = g; c.fillRect(x, y, ww, wh);
      c.restore();
      rr(c, x, y, ww, wh, 14); c.lineWidth = 4; c.strokeStyle = OUT; c.stroke();
      for (let i = 0; i < 40; i++) { const px = (i * 97 + t * 30) % W, py = (i * 53 + t * 20 * (i % 3 + 1)) % H; c.fillStyle = 'rgba(255,255,255,.7)'; circ(c, px, py, 1.5 + i % 3); c.fill(); }
      cVignette(c, W, H, .5);
    } },
  attack: { dur: 3.6, tag: 'Madrugada', sfx: [[.3, 'slam'], [1.2, 'slam'], [2.1, 'slam']],
    draw(c, W, H, t, d) {
      c.fillStyle = '#121019'; c.fillRect(0, 0, W, H);
      const w = Math.min(W * .55, 560), h = H * .82, x = W / 2 - w / 2, y = H * .05;
      const hit = [.3, 1.2, 2.1].some(a => t > a && t < a + .25), sh = hit ? Math.sin(t * 90) * 12 : 0;
      cSteelDoor(c, x, y, w, h, d.broke ? .06 : 0, sh);
      if (!d.broke) {
        for (let i = 0; i < 2; i++) { c.save(); c.translate(W / 2 + sh, y + h * (.3 + i * .3)); c.rotate(i ? .12 : -.12); if (i === 1 && t > 2.1) { c.translate((t - 2.1) * 400, -(t - 2.1) * 200); c.rotate((t - 2.1) * 6); } rr(c, -w * .55, -14, w * 1.1, 28, 4); paint(c, '#a87240'); c.restore(); }
      } else if (t > 1.3) {
        const k = Math.min(1, (t - 1.3) / 1.2);
        c.save(); c.translate(W / 2 - 40, y + h + 2); c.rotate(-.2);
        rr(c, -10, -14, 140 * k, 26, 12); paint(c, '#bcd4b0');
        for (let i = 0; i < 4; i++) { rr(c, 140 * k - 4, -16 + i * 8, 26, 7, 3); paint(c, '#bcd4b0'); }
        c.restore();
      }
      if (hit) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(0, 0, W, H); }
      cVignette(c, W, H, .8);
    } },

  /* ---------- base ---------- */
  radio: { dur: 4.2, tag: 'Frequência 7150', sfx: [[0, 'radio'], [1.6, 'good']],
    draw(c, W, H, t, d) {
      c.fillStyle = '#211c18'; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W / 2, H * .5, 300, t > 1.6 ? '#7dff9e' : '#ffcf7d', .25); c.restore();
      c.strokeStyle = t > 1.6 ? 'rgba(140,255,170,.7)' : 'rgba(255,220,140,.5)'; c.lineWidth = 4;
      for (let i = 0; i < 4; i++) { const r = 160 + ((t * 90 + i * 50) % 200); c.globalAlpha = 1 - (r - 160) / 200; c.beginPath(); c.arc(W / 2, H * .5, r, -.9, .9); c.stroke(); c.beginPath(); c.arc(W / 2, H * .5, r, Math.PI - .9, Math.PI + .9); c.stroke(); }
      c.globalAlpha = 1;
      drawItem(c, 'radio', W / 2, H * .52, 300, { on: t > 1.6 });
      if (t > 2.2) { const hx = W * 1.1 - (t - 2.2) * 260; c.save(); c.globalAlpha = .7; heli(c, hx, H * .16, .6, t, false); c.restore(); }
      cVignette(c, W, H, .7);
    } },
  soro: { dur: 3.6, tag: 'Laboratório improvisado', sfx: [[.4, 'search'], [1.8, 'good']],
    draw(c, W, H, t, d) {
      c.fillStyle = '#0f1a1c'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#5b3d28'; c.fillRect(0, H * .72, W, H * .28);
      c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W / 2, H * .5, 260, '#3fe0c5', .2 + Math.min(.3, t * .1)); c.restore();
      drawItem(c, 'soro', W / 2 - 60, H * .54, 200); drawItem(c, 'soro', W / 2 + 70, H * .58, 160);
      drawItem(c, 'amostra', W * .25, H * .64, 110); drawItem(c, 'remedio', W * .76, H * .64, 110);
      for (let i = 0; i < 24; i++) { const py = H * .6 - ((t * 60 + i * 23) % 220); c.fillStyle = `rgba(120,255,230,${.2 + (i % 3) * .15})`; circ(c, W / 2 - 60 + Math.sin(i + t * 2) * 30, py, 3 + i % 3); c.fill(); }
      cVignette(c, W, H, .7);
    } },

  /* ---------- eventos da história ---------- */
  ev_entregador: { dur: 4, tag: 'Dia 2', sfx: [[.3, 'knock'], [2, 'freeze']],
    draw(c, W, H, t) {
      c.fillStyle = '#aebccb'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 26) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(0, y, W, 3); }
      const shake = (t % 1.4) < .35 ? Math.sin(t * 70) * 5 : 0;
      c.save(); c.translate(shake, 0);
      rr(c, W / 2 - 160, H * .14, 320, H * .3, 14); paint(c, '#1e3346');
      c.strokeStyle = '#8d939a'; c.lineWidth = 12; c.setLineDash([22, 10]); c.beginPath(); c.moveTo(W * .2, H * .62); c.quadraticCurveTo(W / 2, H * .82, W * .8, H * .62); c.stroke(); c.setLineDash([]);
      c.restore();
      c.save(); c.translate(W / 2, H * .74); c.rotate(Math.sin(t * 12) * .15 * ((t % 1.4) < .35 ? 1 : .2)); drawItem(c, 'lock', 0, 0, 110); c.restore();
      for (let i = 0; i < 18; i++) { const k = (t * .6 + i / 18) % 1; c.fillStyle = `rgba(255,255,255,${.5 * (1 - k)})`; circ(c, W / 2 - 150 + i * 17, H * .44 + k * 60, 4 + k * 10); c.fill(); }
      if ((t % 1.4) < .6) cBigText(c, 'toc... toc...', W / 2, H * .3, 30, '#cfe8ff', .9);
      cVignette(c, W, H, .55);
    } },
  ev_lacerda1: { dur: 4.4, tag: 'Alto-falantes', sfx: [[0, 'radio'], [.6, 'chime']],
    draw(c, W, H, t) {
      c.fillStyle = '#1c1a24'; c.fillRect(0, 0, W, H);
      cSpeaker(c, W * .2, H * .25, 2.2, t);
      cCRT(c, W * .45, H * .18, Math.min(W * .4, 420), H * .55, '#2a3b4d', () => drawChar(c, W * .45 + Math.min(W * .4, 420) / 2, H * .18 + H * .55 * 1.35, 4.2, LACERDA, { t, pose: 'idle', expr: 'sad', sweat: true, shadow: false }));
      cVignette(c, W, H, .6);
    } },
  ev_lacerda2: { dur: 4.6, tag: 'Alto-falantes', sfx: [[0, 'radio'], [1, 'giggle'], [2.4, 'shutter']],
    draw(c, W, H, t) {
      c.fillStyle = '#16231a'; c.fillRect(0, 0, W, H);
      cSpeaker(c, W * .2, H * .25, 2.2, t);
      cCRT(c, W * .45, H * .18, Math.min(W * .4, 420), H * .55, '#29482f', () => drawChar(c, W * .45 + Math.min(W * .4, 420) / 2, H * .18 + H * .55 * 1.35, 4.2, LACERDA, { t: t * .4, pose: 'idle', expr: 'smile', pale: .85, glassy: true, shadow: false }));
      c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W * .65, H * .45, 260, '#9dff8a', .15 + Math.sin(t * 3) * .05); c.restore();
      cVignette(c, W, H, .65);
    } },
  ev_apagao: { dur: 4, tag: 'Dia 7', sfx: [[.5, 'slam'], [1.4, 'giggle']],
    draw(c, W, H, t) {
      const off = t > .5 && !(t > .7 && t < .8) && !(t > 1 && t < 1.05);
      cRoom(c, W, H, off ? .92 : .1);
      if (off) {
        for (let i = 0; i < 4; i++) { const blink = Math.sin(t * 3 + i * 2) > .9; if (blink) continue; const x = W * (.25 + i * .17), y = H * .6 + (i % 2) * 20; c.fillStyle = i === 2 ? '#c8ffb5' : '#fff'; ell(c, x - 7, y, 3, 4); c.fill(); ell(c, x + 7, y, 3, 4); c.fill(); }
        for (let i = 0; i < 5; i++) { const k = ((t - .5) * .5 + i / 5) % 1; c.globalAlpha = 1 - k; cNote(c, W * .62 + Math.sin(i) * 40, H * .55 - k * 120, 1.4); } c.globalAlpha = 1;
      }
      cVignette(c, W, H, .7);
    } },
  ev_evac: { dur: 4.4, tag: 'Operação Telhado Limpo', sfx: [[0, 'radio'], [1.5, 'chime']],
    draw(c, W, H, t) {
      sky(c, W, H, '#0b0d1f', '#3a2d55'); skyline(c, W, H * .85);
      for (let i = 0; i < 3; i++) { const hx = ((t * 150 + i * 400) % (W + 400)) - 200; heli(c, hx, H * (.2 + i * .12), .55 - i * .1, t, false); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,220,.08)'; c.beginPath(); c.moveTo(hx - 20, H * (.24 + i * .12)); c.lineTo(hx - 90, H); c.lineTo(hx + 50, H); c.closePath(); c.fill(); c.restore(); }
      cBigText(c, '7150', W / 2, H * .55, 80, '#ffe58a', Math.min(1, Math.max(0, t - 1.5)));
      cVignette(c, W, H, .6);
    } },
  ev_gangue: { dur: 4, tag: 'Dia 12', sfx: [[.2, 'knock'], [1.5, 'slam']],
    draw(c, W, H, t) {
      c.fillStyle = '#121019'; c.fillRect(0, 0, W, H);
      const w = Math.min(W * .55, 560), h = H * .8, x = W / 2 - w / 2, y = H * .06;
      cSteelDoor(c, x, y, w, h, .05, (t > 1.5 && t < 1.8) ? Math.sin(t * 90) * 10 : 0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,220,160,.35)'; c.fillRect(x, y + h - h * .05, w, h * .05); c.restore();
      for (let i = 0; i < 5; i++) { const fx = x + 40 + i * (w - 80) / 5 + Math.sin(t * 2 + i) * 8; c.fillStyle = '#000'; rr(c, fx, y + h - 14, 30, 12, 3); c.fill(); }
      for (let i = 0; i < 3; i++) { c.save(); c.translate(x + 90 + i * 150, y + h - 10); c.rotate(-.5 + i * .3); c.fillStyle = '#c0c0c0'; c.fillRect(-3, -60, 6, 60); c.fillStyle = '#888'; rr(c, -10, -4, 26, 9, 3); c.fill(); c.restore(); }
      if (t > 1) { c.save(); c.translate(W / 2, y + h * .3); bubbleWide(c, 0, 0, '"Pedágio. Metade da comida. Ou a gente entra."'); c.restore(); }
      cVignette(c, W, H, .75);
    } },
  ev_ultimato: { dur: 4.6, tag: 'Comunicado oficial', sfx: [[0, 'chime'], [1.5, 'shutter']],
    draw(c, W, H, t) {
      drawFacade(c, W, H, 0);
      for (let i = 0; i < 3; i++) {
        const tx = W + 200 - ((t * 120 + i * 260) % (W + 500));
        c.save(); c.translate(tx, H * .9); c.lineWidth = 3; c.strokeStyle = OUT;
        rr(c, -90, -70, 70, 60, 6); paint(c, '#e1b12c'); c.save(); c.translate(30, -50); c.rotate(t * 2); ell(c, 0, 0, 55, 34); paint(c, '#9aa3ad'); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(-55, -4, 110, 8); c.restore();
        circ(c, -60, -6, 14); paint(c, '#222'); circ(c, 50, -6, 14); paint(c, '#222'); c.restore();
      }
      cBigText(c, 'DIA 18: CONCRETO', W / 2, H * .18, 46, '#ff5b5b', Math.min(1, Math.max(0, t - 1)));
    } },

  /* ---------- eventos aleatórios ---------- */
  ev_rato: { dur: 3.2, tag: 'Despensa', sfx: [[.3, 'click'], [1.2, 'giggle']],
    draw(c, W, H, t) {
      cRoom(c, W, H, .2);
      const x = W * 1.05 - t * W * .45, y = H * .88 + Math.abs(Math.sin(t * 20)) * -4;
      c.save(); c.translate(x, y); c.lineWidth = 3; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(40, 0); c.quadraticCurveTo(90, -10 + Math.sin(t * 15) * 10, 120, 0); c.stroke();
      ell(c, 0, -14, 44, 22); paint(c, '#7d7d86'); circ(c, -40, -22, 18); paint(c, '#7d7d86'); circ(c, -36, -40, 10); paint(c, '#c99'); circ(c, -52, -26, 3); paint(c, OUT, false);
      drawItem(c, 'comida', -62, -8, 36); c.restore();
      cVignette(c, W, H, .55);
    } },
  ev_karaoke: { dur: 3.6, tag: 'Eletro Mega', sfx: [[0, 'chime']],
    draw(c, W, H, t) {
      cRoom(c, W, H, .45);
      const cols = ['#ff3d7f', '#2de2c6', '#ffd23f', '#a78bfa'];
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) glowAt(c, W * (.2 + i * .2) + Math.sin(t * 2 + i) * 80, H * .4, 220, cols[(i + Math.floor(t * 3)) % 4], .18); c.restore();
      for (let i = 0; i < 8; i++) { const k = (t * .5 + i / 8) % 1; c.globalAlpha = 1 - k; cNote(c, W * (.1 + i * .11), H * .8 - k * H * .6, 1.6); } c.globalAlpha = 1;
      cBigText(c, '"EVIDÊNCIAS"', W / 2, H * .22, 50, '#fff', .9);
    } },
  ev_teto: { dur: 3.6, tag: 'Forro', sfx: [[.3, 'step'], [1, 'step'], [1.7, 'step'], [2.4, 'step']],
    draw(c, W, H, t) {
      cRoom(c, W, H, .55);
      const steps = Math.floor(t / .7);
      for (let i = 0; i <= Math.min(steps, 4); i++) { const x = W * (.2 + i * .15); c.fillStyle = 'rgba(0,0,0,.6)'; ell(c, x, H * .05, 22, 10); c.fill(); for (let k = 0; k < 6; k++) { const yy = ((t - i * .7) * 160 + k * 30); if (yy > 0 && yy < H) { c.fillStyle = 'rgba(210,200,180,.5)'; circ(c, x + Math.sin(k) * 14, H * .06 + yy, 2.5); c.fill(); } } }
      cVignette(c, W, H, .75);
    } },
  ev_goteira: { dur: 3.4, tag: 'Cano do teto', sfx: [[.4, 'click'], [1.2, 'click'], [2, 'click']],
    draw(c, W, H, t) {
      const r = cRoom(c, W, H, .35);
      const px = r.ox + 300 * r.s, py = r.oy + 60 * r.s;
      for (let i = 0; i < 3; i++) { const k = ((t + i * .33) % 1); c.fillStyle = '#7fc8ff'; ell(c, px, py + k * (H * .75 - py), 5, 8); c.fill(); }
      rr(c, px - 50, H * .78, 100, 70, 8); paint(c, '#c0392b');
      c.strokeStyle = 'rgba(127,200,255,.7)'; c.lineWidth = 2; for (let i = 0; i < 2; i++) { const k = (t * 1.5 + i * .5) % 1; ell(c, px, H * .79, 20 + k * 30, 4 + k * 4); c.stroke(); }
      cVignette(c, W, H, .6);
    } },
  ev_drone: { dur: 3.6, tag: 'Ventilação', sfx: [[0, 'radio']],
    draw(c, W, H, t) {
      sky(c, W, H, '#10142a', '#2a2848');
      const x = W / 2 + Math.sin(t * 2) * 40, y = H * .4 + Math.sin(t * 5) * 10;
      c.save(); c.translate(x, y); c.lineWidth = 3; c.strokeStyle = OUT;
      [[-90, -30], [90, -30], [-90, 30], [90, 30]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(dx, dy); c.stroke(); c.save(); c.translate(dx, dy - 10); c.scale(1, .18); c.rotate(t * 30); rr(c, -40, -6, 80, 12, 4); paint(c, '#333'); c.restore(); });
      rr(c, -50, -24, 100, 48, 12); paint(c, '#e74c3c'); rr(c, -26, -12, 52, 20, 4); paint(c, '#7dffb0');
      c.beginPath(); c.moveTo(0, 24); c.lineTo(0, 60); c.stroke(); cSack(c, 0, 84, 1.6); c.restore();
      c.fillStyle = '#1d1b22'; for (let i = 0; i < 6; i++) c.fillRect(0, H * .8 + i * 14, W, 7);
      cVignette(c, W, H, .6);
    } },
  ev_manequim: { dur: 3.8, tag: 'Pela fresta', sfx: [[1.8, 'heart'], [2.6, 'heart']],
    draw(c, W, H, t) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save(); c.beginPath(); c.rect(W * .1, H * .45, W * .8, H * .12); c.clip();
      cCorridor(c, W, H, t, .6);
      const s = 1.4 + Math.min(1.4, t * .35);
      c.save(); c.translate(W / 2, H * .9); c.lineWidth = 3; c.strokeStyle = OUT;
      ell(c, 0, -60 * s, 26 * s, 40 * s); paint(c, '#f1dfc8'); circ(c, 0, -120 * s, 18 * s); paint(c, '#f1dfc8');
      if (t > 2.4) { c.beginPath(); c.arc(0, -114 * s, 9 * s, .15 * Math.PI, .85 * Math.PI); c.stroke(); }
      c.restore(); c.restore();
      c.strokeStyle = '#3a3f47'; c.lineWidth = 10; c.strokeRect(W * .1, H * .45, W * .8, H * .12);
    } },
  ev_ventilacao: { dur: 3.6, tag: 'Ventilação', sfx: [[.3, 'search']],
    draw(c, W, H, t) {
      const r = cRoom(c, W, H, .3);
      const vx = r.ox + 715 * r.s, vy = r.oy + 75 * r.s;
      for (let i = 0; i < 14; i++) { const k = ((t * .4 + i / 14) % 1); c.fillStyle = `rgba(150,230,140,${.35 * (1 - k)})`; circ(c, vx + Math.sin(i * 3 + t) * k * 260, vy + k * H * .55, 20 + k * 90); c.fill(); }
      cVignette(c, W, H, .65);
    } },
  ev_sonho: { dur: 4, tag: 'Sonho', sfx: [[.5, 'giggle']],
    draw(c, W, H, t) {
      const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * .7); g.addColorStop(0, '#f4fff0'); g.addColorStop(1, '#7fbf8a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.globalAlpha = Math.min(1, t * .5); drawChar(c, W / 2, H * 1.1, 4.5, CHARACTERS.valdirene.look, { t: t * .4, pose: 'reach', expr: 'smile', pale: .6, glassy: true, shadow: false }); c.restore();
      cVignette(c, W, H, .5);
    } },
  ev_musica: { dur: 3.4, tag: 'Alto-falantes', sfx: [[0, 'chime']],
    draw(c, W, H, t) {
      c.fillStyle = '#1c1a24'; c.fillRect(0, 0, W, H);
      cSpeaker(c, W / 2, H * .3, 2.6, t);
      for (let i = 0; i < 8; i++) { const k = (t * .4 + i / 8) % 1; c.globalAlpha = 1 - k; cNote(c, W * .3 + i * W * .06, H * .7 - k * H * .4, 1.8); } c.globalAlpha = 1;
      cVignette(c, W, H, .6);
    } },
};

/* =========================================================
   v8 — cenas dos eventos novos
   ========================================================= */
const ABILIO = { skin: '#f0c8a0', hair: '#e8e0d0', hs: 'short', shirt: '#1e2a44', pants: '#1e2a44', shoes: '#111', acc: ['tie', 'badge'], tie: '#c0392b', seed: 88 };
Object.assign(CUTS, {
  ev_diretoria: { dur: 4.6, tag: 'Pronunciamento oficial', sfx: [[0, 'chime'], [2.6, 'giggle']],
    draw(c, W, H, t) {
      c.fillStyle = '#0e0d14'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const w = Math.min(W * .28, 300), h = w * .7, x = W / 2 - w * 1.6 + i * (w + 30), y = H * .2 + (i === 1 ? -20 : 10);
        cCRT(c, x, y, w, h, '#1d2a45', () => {
          c.fillStyle = '#2f3f66'; c.fillRect(x, y + h * .7, w, h * .3);
          drawChar(c, x + w / 2, y + h * 1.5, h / 70, ABILIO, { t: t * .5 + i, pose: 'idle', expr: t > 2.6 ? 'smile' : 'calm', pale: t > 2.6 ? .5 : .1, glassy: t > 3.2, shadow: false });
          c.fillStyle = '#c0392b'; c.fillRect(x, y + h - 22, w, 22); c.fillStyle = '#fff'; c.font = 'bold 11px Inter, sans-serif'; c.textAlign = 'left'; c.fillText('AO VIVO · CEO DO GRUPO LOCKSHOP', x + 8, y + h - 7);
        });
      }
      cVignette(c, W, H, .7);
    } },
  ev_bilhete_porta: { dur: 4.2, tag: 'Dia 6', sfx: [[.4, 'page'], [2.2, 'heart'], [2.9, 'heart']],
    draw(c, W, H, t) {
      c.fillStyle = '#121019'; c.fillRect(0, 0, W, H);
      cSteelDoor(c, W / 2 - 280, -40, 560, H * .7, 0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,220,160,.3)'; c.fillRect(W / 2 - 280, H * .7 - 40, 560, 10); c.restore();
      const k = Math.min(1, t / 1.6);
      c.save(); c.translate(W / 2, H * .66 + k * 120); c.rotate(-.06);
      rr(c, -170, -50, 340, 100, 4); paint(c, '#fdf6d8');
      c.fillStyle = '#b3142b'; c.font = '26px "Permanent Marker", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('CONTAMOS VOCÊS', 0, -14); if (t > 2) c.fillText('AMANHÃ +1', 0, 22);
      c.restore();
      cVignette(c, W, H, .8);
    } },
  ev_zero: { dur: 4.2, tag: 'Intervalo comercial', sfx: [[0, 'chime'], [3.2, 'giggle']],
    draw(c, W, H, t) {
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#b8ffd0'); g.addColorStop(1, '#2f9e63'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { c.fillStyle = 'rgba(255,255,255,.25)'; circ(c, (i * 137 + t * 60) % W, H - ((i * 71 + t * 80) % H), 6 + i % 4 * 4); c.fill(); }
      drawItem(c, 'amostra', W * .3, H * .52, Math.min(W, H) * .5);
      cBigText(c, 'SERENITÁ ZERO', W * .66, H * .3, 54, '#ffffff');
      cBigText(c, 'ZERO ANSIEDADE', W * .66, H * .45, 30, '#14532d');
      const fam = ['kelly', 'bruno', 'lucia'];
      fam.forEach((k, i) => drawChar(c, W * .55 + i * 110, H * .98, 1.6, CHARACTERS[k].look, { t: t + i, pose: 'reach', expr: 'smile', pale: .3 + t * .1, glassy: t > 3 }));
      if (t > 3.1 && t < 3.6) { c.fillStyle = 'rgba(0,0,0,.75)'; c.fillRect(0, H * .9, W, H * .1); c.fillStyle = '#fff'; c.font = 'bold 12px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('PODE CAUSAR TRANQUILIDADE PERMANENTE E ABRAÇOS INVOLUNTÁRIOS', W / 2, H * .95); }
    } },
  ev_contagem: { dur: 4.6, tag: '3h00', sfx: [[.5, 'heart'], [1.3, 'heart'], [2.1, 'heart'], [3, 'giggle']],
    draw(c, W, H, t) {
      cRoom(c, W, H, .85);
      const n = (typeof G !== 'undefined' && G) ? Math.max(2, home().length) : 4;
      for (let i = 0; i < n; i++) drawChar(c, W * .15 + i * (W * .7 / n), H * .92, 1.6, (G && home()[i] ? home()[i].look : PROTAGONISTS[i % 3].look), { t, pose: 'lie', expr: 'sleep' });
      const shown = Math.min(n + 1, Math.floor(t / .7));
      for (let i = 0; i < shown; i++) { const last = i === n; cBigText(c, String(i + 1), last ? W * .9 : W * .15 + i * (W * .7 / n), H * .62 - (last ? 40 : 0), last ? 70 : 40, last ? '#9dff8a' : '#cfe2ff', last ? .5 + Math.sin(t * 10) * .3 : .8); }
      cVignette(c, W, H, .85);
    } },
  ev_fotos: { dur: 4.4, tag: 'Galeria', sfx: [[.3, 'click'], [1.4, 'click'], [2.6, 'bad']],
    draw(c, W, H, t) {
      c.fillStyle = '#0a090e'; c.fillRect(0, 0, W, H);
      const pw = Math.min(W * .3, 300), ph = pw * 1.9, x = W / 2 - pw / 2, y = H / 2 - ph / 2;
      rr(c, x - 12, y - 12, pw + 24, ph + 24, 30); paint(c, '#1d1d24');
      c.save(); rr(c, x, y, pw, ph, 20); c.clip();
      const idx = Math.min(2, Math.floor(t / 1.2));
      const s = Math.max(pw / 960, ph / 540) * .9;
      if (Room.bg) c.drawImage(Room.bg, x + pw / 2 - 480 * s, y + ph / 2 - 270 * s, 960 * s, 540 * s);
      c.fillStyle = 'rgba(10,20,40,.6)'; c.fillRect(x, y, pw, ph);
      for (let i = 0; i < 3; i++) drawChar(c, x + pw * (.25 + i * .25), y + ph * .7, .8, PROTAGONISTS[i].look, { t, pose: 'lie', expr: 'sleep' });
      if (idx >= 2) { c.globalCompositeOperation = 'lighter'; glowAt(c, x + pw * .5, y + ph * .35, 90, '#9dff8a', .35); c.globalCompositeOperation = 'source-over'; drawChar(c, x + pw * .5, y + ph * .55, 1.2, CHARACTERS.wagner.face, { t, expr: 'smile', pale: .9, glassy: true }); }
      c.fillStyle = 'rgba(255,255,255,.9)'; c.font = 'bold 13px Inter, sans-serif'; c.textAlign = 'center'; c.fillText(['03:12', '03:58', 'agora há 10 min'][idx], x + pw / 2, y + 28);
      c.restore();
      cVignette(c, W, H, .7);
    } },
  ev_voz: { dur: 4.4, tag: 'Do outro lado', sfx: [[.4, 'knock'], [2, 'giggle']],
    draw(c, W, H, t) {
      c.fillStyle = '#0f0d14'; c.fillRect(0, 0, W, H);
      cSteelDoor(c, W / 2 - 260, H * .04, 520, H * .78, 0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,220,160,.35)'; c.fillRect(W / 2 - 260, H * .82, 520, 8); c.restore();
      c.fillStyle = '#000'; rr(c, W / 2 - 50, H * .82, 36, 8, 3); c.fill(); rr(c, W / 2 + 14, H * .82, 36, 8, 3); c.fill();
      const k = Math.min(1, Math.max(0, (t - 1.6) / 1.5));
      c.save(); c.globalAlpha = k; c.font = '28px "Permanent Marker", cursive'; c.fillStyle = '#ffd6e0'; c.textAlign = 'center';
      c.fillText('"filho... abre pra mamãe..."', W / 2, H * .9 + Math.sin(t * 4) * 3); c.restore();
      cVignette(c, W, H, .85);
    } },
  ev_blackfriday: { dur: 4.2, tag: 'Pela fresta', sfx: [[.4, 'chime'], [2.4, 'giggle']],
    draw(c, W, H, t) {
      const fy = cCorridor(c, W, H, t, .55);
      c.fillStyle = '#111'; c.fillRect(W * .1, fy - 300, W * .5, 40); c.fillStyle = '#ffd23f'; c.font = '28px Bungee, sans-serif'; c.textAlign = 'center'; c.fillText('BLACK FRIDAY', W * .35, fy - 270);
      const looks = Object.values(CHARACTERS).filter(x => !x.special).map(x => x.look);
      for (let i = 0; i < 9; i++) drawChar(c, W * .08 + i * 110, fy + 30, 1.6, looks[i % looks.length], { t: t * .3 + i, pose: 'idle', expr: 'smile', pale: .85, glassy: i % 2 === 0 });
      cVignette(c, W, H, .65);
    } },
  ev_coach: { dur: 3.8, tag: 'Duto de ventilação', sfx: [[0, 'chime'], [1, 'good']],
    draw(c, W, H, t) {
      const r = cRoom(c, W, H, .35);
      const vx = r.ox + 715 * r.s, vy = r.oy + 75 * r.s;
      c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, vx, vy, 140, '#ffd23f', .25); c.restore();
      ['CRESÇA!', 'FOCO!', 'ABRA A MENTE!', 'E A PORTA!'].forEach((w, i) => { const k = t - i * .7; if (k > 0) cBigText(c, w, vx - 120 - i * 60, vy + 60 + i * 60, 28 + i * 4, '#ffd23f', Math.max(0, 1 - k / 3)); });
      cVignette(c, W, H, .6);
    } },
});
