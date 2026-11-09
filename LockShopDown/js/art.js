'use strict';
/* =========================================================
   LOCKSHOPDOWN — arte vetorial (personagens, cachorro, itens, ícones)
   Tudo desenhado em canvas, sem imagens externas.
   ========================================================= */

const OUT = '#1d1724';

function parseC(c) {
  if (c[0] === '#') {
    let h = c.slice(1); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16); return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
const rgbStr = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
function shade(c, amt) { return rgbStr(parseC(c).map(v => amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)); }
function mix(c1, c2, t) { const a = parseC(c1), b = parseC(c2); return rgbStr(a.map((v, i) => v + (b[i] - v) * t)); }
function rgba(c, a) { const p = parseC(c); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }

function rr(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); }
function paint(ctx, fill, stroke = true) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) ctx.stroke(); }

/* =========================================================
   PERSONAGEM (estilo chibi, contorno grosso)
   L = aparência {skin, hair, hs, shirt, pants, shoes, acc[], body}
   o = {t, pose, flip, expr, pale, sweat, bandage, scratch, glassy, mask, shadow}
   ========================================================= */
function drawChar(ctx, x, y, s, L, o = {}) {
  const t = o.t || 0, pose = o.pose || 'idle';
  const kid = L.body === 'kid', big = L.body === 'big';
  const acc = L.acc || [];
  const pale = clamp(o.pale || 0, 0, 1);
  const skin = pale ? mix(L.skin, '#bcd4b0', pale * .8) : L.skin;
  const sc = s * (kid ? .8 : 1);

  ctx.save();
  ctx.translate(x, y);
  if (o.shadow !== false && pose !== 'lie') { ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(ctx, 0, 0, 17 * sc, 4.5 * sc); ctx.fill(); }
  ctx.scale(sc * (o.flip ? -1 : 1), sc);
  if (pose === 'lie') {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(ctx, -6, 1, 40, 5); ctx.fill();
    ctx.translate(24, -13); ctx.rotate(-Math.PI / 2);
  }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.3;

  let bob = 0, swing = 0, legL = 0, legR = 0;
  if (pose === 'idle') bob = Math.sin(t * 2.2) * .8;
  if (pose === 'walk' || pose === 'run') {
    const sp = pose === 'run' ? 17 : 11, ph = Math.sin(t * sp);
    legL = ph * 4.5; legR = -ph * 4.5; bob = -Math.abs(Math.cos(t * sp)) * 2.2; swing = ph * .55;
  }
  if (pose === 'reach') { bob = Math.sin(t * 3) * 1.2; const ph = Math.sin(t * 6); legL = ph * 2.5; legR = -ph * 2.5; }
  const sit = pose === 'sit' || pose === 'hug';
  const oy = sit ? 13 : 0;
  const tw = big ? 31 : 24, top = -37 + oy + bob;

  /* cabelo de trás */
  const hr = kid ? 17 : 15, hx = 0, hy = -52 + oy + bob;
  if (!L.mascot) {
    if (L.hs === 'long' || L.hs === 'pony') { ctx.fillStyle = L.hair; rr(ctx, hx - hr - 2, hy - 5, (hr + 2) * 2, hr + 14, 7); paint(ctx, L.hair); }
    if (L.hs === 'afro') { circ(ctx, hx, hy - 3, hr + 6); paint(ctx, L.hair); }
  }

  /* pernas */
  if (sit) {
    rr(ctx, -12, -11, 10, 10, 4); paint(ctx, L.pants);
    rr(ctx, 2, -11, 10, 10, 4); paint(ctx, L.pants);
    ell(ctx, -7, -1, 6, 3.5); paint(ctx, L.shoes);
    ell(ctx, 7, -1, 6, 3.5); paint(ctx, L.shoes);
  } else {
    rr(ctx, -10 + legL * .3, -17, 8, 16 - Math.max(0, legL) * .4, 3); paint(ctx, L.pants);
    rr(ctx, 2 + legR * .3, -17, 8, 16 - Math.max(0, legR) * .4, 3); paint(ctx, shade(L.pants, -.14));
    ell(ctx, -6 + legL * .3, -1 - Math.max(0, legL) * .4, 5.5, 3.2); paint(ctx, L.shoes);
    ell(ctx, 6 + legR * .3, -1 - Math.max(0, legR) * .4, 5.5, 3.2); paint(ctx, L.shoes);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, -7.5 + legL * .3, -2.4, 1.8, 1); ctx.fill(); ell(ctx, 4.5 + legR * .3, -2.4, 1.8, 1); ctx.fill();
  }

  /* tronco */
  const shirt = L.mascot ? '#f6c62f' : L.shirt;
  rr(ctx, -tw / 2, top, tw, 23, 8); paint(ctx, shirt);
  ctx.save(); rr(ctx, -tw / 2, top, tw, 23, 8); ctx.clip();
  ctx.fillStyle = 'rgba(30,16,50,.18)'; ctx.fillRect(tw * .18, top, tw, 24);
  ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(-tw / 2, top, tw, 3.5);
  ctx.fillStyle = 'rgba(30,16,50,.12)'; ctx.fillRect(-tw / 2, top + 19, tw, 5);
  ctx.restore();
  if (!L.mascot && !(L.acc || []).includes('vest')) { ctx.save(); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(29,23,36,.55)'; ctx.beginPath(); ctx.moveTo(-4.5, top + .5); ctx.lineTo(0, top + 5); ctx.lineTo(4.5, top + .5); ctx.stroke(); ctx.restore(); }
  if (acc.includes('labcoat')) {
    ctx.save(); rr(ctx, -tw / 2, top, tw, 23, 8); ctx.clip();
    ctx.fillStyle = '#f4f6f8'; ctx.fillRect(-tw / 2, top, tw * .32, 24); ctx.fillRect(tw / 2 - tw * .32, top, tw * .32, 24);
    ctx.restore(); rr(ctx, -tw / 2, top, tw, 23, 8); ctx.stroke();
  }
  if (acc.includes('apron')) { rr(ctx, -tw / 2 + 4, top + 6, tw - 8, 17, 3); paint(ctx, L.apron || '#e74c3c'); }
  if (acc.includes('vest')) {
    ctx.save(); rr(ctx, -tw / 2, top, tw, 23, 8); ctx.clip();
    ctx.fillStyle = '#ff9f1c'; ctx.fillRect(-tw / 2, top, tw, 24);
    ctx.fillStyle = '#f3f3a8'; ctx.fillRect(-tw / 2, top + 12, tw, 4);
    ctx.restore(); rr(ctx, -tw / 2, top, tw, 23, 8); ctx.stroke();
  }
  if (acc.includes('tie')) { ctx.beginPath(); ctx.moveTo(0, top + 2); ctx.lineTo(3, top + 6); ctx.lineTo(1.5, top + 17); ctx.lineTo(0, top + 19); ctx.lineTo(-1.5, top + 17); ctx.lineTo(-3, top + 6); ctx.closePath(); paint(ctx, L.tie || '#c0392b'); }
  if (acc.includes('collar')) { rr(ctx, -3, top - 1, 6, 5, 1); paint(ctx, '#fff'); }
  if (acc.includes('badge')) { rr(ctx, 3, top + 6, 7, 5, 1); paint(ctx, '#f5f5f5'); ctx.fillStyle = '#c0392b'; ctx.fillRect(3.5, top + 6.5, 6, 1.5); }
  if (acc.includes('star')) { circ(ctx, -6, top + 8, 3); paint(ctx, '#f1c40f'); }
  if (acc.includes('scarf')) { rr(ctx, -10, top - 2, 20, 6, 3); paint(ctx, L.scarf || '#8e44ad'); }

  /* braços */
  const arm = (side) => {
    const sx = side * (tw / 2 + 1), sy = top + 3;
    let out = .12 + (side < 0 ? swing : -swing);
    if (pose === 'reach') out = 1.85 + Math.sin(t * 5 + side) * .15;
    if (pose === 'up') out = 2.7;
    if (pose === 'lie') out = .08;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(side < 0 ? out : -out);
    const sleeve = acc.includes('labcoat') ? '#f4f6f8' : shirt;
    rr(ctx, -3.2, -2, 6.4, 15, 3); paint(ctx, side > 0 ? shade(sleeve, -.12) : sleeve);
    circ(ctx, 0, 14, 3.4); paint(ctx, L.mascot ? '#f6c62f' : skin);
    if (side > 0 && acc.includes('phone') && pose !== 'reach') { rr(ctx, -3, 12, 6, 9, 1.5); paint(ctx, '#222'); ctx.fillStyle = '#7fd3ff'; ctx.fillRect(-2, 13.5, 4, 6); }
    ctx.restore();
  };
  if (pose === 'hug') {
    rr(ctx, -tw / 2 - 2, top + 9, tw + 4, 7, 3.5); paint(ctx, shirt);
    circ(ctx, -tw / 2 + 3, top + 12.5, 3.2); paint(ctx, skin); circ(ctx, tw / 2 - 3, top + 12.5, 3.2); paint(ctx, skin);
  } else { arm(-1); arm(1); }

  /* cabeça */
  if (L.mascot) {
    drawMascotHead(ctx, hx, hy - 2, hr + 7, t);
  } else {
    circ(ctx, hx, hy, hr); paint(ctx, skin);
    ctx.save(); circ(ctx, hx, hy, hr - 1); ctx.clip();
    ctx.fillStyle = 'rgba(70,30,40,.13)'; circ(ctx, hx + hr * .75, hy + hr * .45, hr * 1.05); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.16)'; ell(ctx, hx - hr * .45, hy - hr * .35, hr * .32, hr * .2, -.5); ctx.fill();
    ctx.restore();
    // orelhas
    ell(ctx, hx - hr + .5, hy + 2, 2.6, 3.5); paint(ctx, skin); ell(ctx, hx + hr - .5, hy + 2, 2.6, 3.5); paint(ctx, skin);
    drawHair(ctx, L, hx, hy, hr);
    drawFace(ctx, L, hx, hy, hr, o, t, pale);
    drawHeadAcc(ctx, L, hx, hy, hr, o);
  }

  /* pistas visuais */
  if (o.sweat) {
    ctx.fillStyle = '#7fc8ff';
    [[hx + hr - 1, hy - 7, 1], [hx - hr + 2, hy - 2, .8]].forEach(([dx, dy, k]) => {
      ctx.beginPath(); ctx.moveTo(dx, dy - 4 * k); ctx.quadraticCurveTo(dx + 3 * k, dy + 1, dx, dy + 2.5 * k); ctx.quadraticCurveTo(dx - 3 * k, dy + 1, dx, dy - 4 * k); ctx.fill(); ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 2.3;
    });
  }
  if (o.bandage === 'neck') { rr(ctx, hx - 7, hy + hr - 4, 14, 6, 2); paint(ctx, '#f5efe0'); ctx.fillStyle = '#b8322b'; circ(ctx, hx + 3, hy + hr - 1, 1.6); ctx.fill(); }
  if (o.bandage === 'head') { ctx.save(); circ(ctx, hx, hy, hr); ctx.clip(); ctx.fillStyle = '#f5efe0'; ctx.fillRect(hx - hr, hy - 10, hr * 2, 5); ctx.restore(); rr(ctx, hx - hr, hy - 10, hr * 2, 5, 2); ctx.stroke(); ctx.fillStyle = '#b8322b'; circ(ctx, hx - 6, hy - 7.5, 1.6); ctx.fill(); }
  if (o.scratch) { ctx.strokeStyle = '#b8322b'; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx + 4 + i * 2, hy + 3); ctx.lineTo(hx + 8 + i * 2, hy + 8); ctx.stroke(); } ctx.strokeStyle = OUT; ctx.lineWidth = 2.3; }
  ctx.restore();
}

function drawHair(ctx, L, hx, hy, hr) {
  const c = L.hair, hs = L.hs;
  if (!hs || hs === 'none') return;
  if (hs === 'bald') { ell(ctx, hx - hr + 2, hy - 2, 3, 5); paint(ctx, c); ell(ctx, hx + hr - 2, hy - 2, 3, 5); paint(ctx, c); return; }
  if (hs === 'curly' || hs === 'afro') {
    for (let a = Math.PI * .95; a <= Math.PI * 2.05; a += .32) { circ(ctx, hx + Math.cos(a) * (hr - 1), hy - 3 + Math.sin(a) * (hr - 1), 5.2); paint(ctx, c); }
    circ(ctx, hx, hy - hr + 3, 7); paint(ctx, c, false);
    return;
  }
  if (hs === 'spiky') {
    ctx.beginPath(); ctx.moveTo(hx - hr - 1, hy - 1);
    const n = 6;
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; const r1 = hr + 2, r2 = hr + 8; ctx.lineTo(hx + Math.cos(a) * r1, hy - 3 + Math.sin(a) * r1); if (i < n) { const a2 = a + Math.PI / n / 2; ctx.lineTo(hx + Math.cos(a2) * r2, hy - 3 + Math.sin(a2) * r2); } }
    ctx.lineTo(hx + hr + 1, hy - 1); ctx.quadraticCurveTo(hx, hy - 7, hx - hr - 1, hy - 1); ctx.closePath(); paint(ctx, c); return;
  }
  // cúpula com franja
  const h = hs === 'buzz' ? hr - 6 : hr - 2;
  ctx.beginPath(); ctx.ellipse(hx, hy - 3, hr + 1.6, h, 0, Math.PI, 0);
  ctx.quadraticCurveTo(hx + hr * .4, hy - 8, hx + 2, hy - 7);
  ctx.quadraticCurveTo(hx - hr * .5, hy - 4, hx - hr - 1.6, hy - 3);
  ctx.closePath(); paint(ctx, c);
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.32)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx - 1, hy - 3, hr - 3, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke(); ctx.restore();
  if (hs === 'bun') { circ(ctx, hx, hy - hr - 4, 6.5); paint(ctx, c); }
  if (hs === 'pony') { ell(ctx, hx + hr + 3, hy + 2, 4, 9, -.3); paint(ctx, c); }
  if (hs === 'long') { rr(ctx, hx - hr - 2, hy - 3, 5, hr + 6, 2); paint(ctx, c); rr(ctx, hx + hr - 3, hy - 3, 5, hr + 6, 2); paint(ctx, c); }
}

function drawFace(ctx, L, hx, hy, hr, o, t, pale) {
  const acc = L.acc || [];
  let ex = 5.6, ey = hy + 1;
  const expr = o.expr || 'normal';
  const blink = expr !== 'sleep' && expr !== 'dead' && (t * 1.3 + (L.seed || 0)) % 4 < .1;
  ctx.fillStyle = OUT; ctx.strokeStyle = OUT;
  // bochechas
  if (!pale && expr !== 'sick' && expr !== 'dead') { ctx.fillStyle = 'rgba(255,120,120,.28)'; circ(ctx, hx - 8.5, hy + 5, 2.6); ctx.fill(); circ(ctx, hx + 8.5, hy + 5, 2.6); ctx.fill(); }
  if (expr === 'sick') { ctx.fillStyle = 'rgba(120,170,60,.35)'; circ(ctx, hx - 8, hy + 5, 3); ctx.fill(); circ(ctx, hx + 8, hy + 5, 3); ctx.fill(); }
  ctx.fillStyle = OUT; ctx.lineWidth = 1.8;
  const eye = (sx) => {
    const x = hx + sx * ex;
    if (expr === 'dead') { ctx.beginPath(); ctx.moveTo(x - 2, ey - 2); ctx.lineTo(x + 2, ey + 2); ctx.moveTo(x + 2, ey - 2); ctx.lineTo(x - 2, ey + 2); ctx.stroke(); return; }
    if (blink || expr === 'sleep') { ctx.beginPath(); ctx.arc(x, ey - 1, 2.2, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); return; }
    if (o.glassy) { circ(ctx, x, ey, 3); ctx.fillStyle = '#eef2ee'; ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(150,170,160,.6)'; circ(ctx, x, ey, 1.3); ctx.fill(); ctx.fillStyle = OUT; return; }
    if (expr === 'smile') { ctx.beginPath(); ctx.arc(x, ey + 1, 2.4, 1.1 * Math.PI, 1.9 * Math.PI); ctx.stroke(); return; }
    if (expr === 'calm') { ctx.beginPath(); ctx.moveTo(x - 2.4, ey); ctx.lineTo(x + 2.4, ey); ctx.stroke(); ell(ctx, x, ey + .9, 1.6, 1.1); ctx.fill(); return; }
    if (expr === 'scared') { circ(ctx, x, ey, 3.2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.fillStyle = OUT; circ(ctx, x, ey + .3, 1.4); ctx.fill(); return; }
    if (expr === 'sick') { ctx.beginPath(); ctx.moveTo(x - 2.2, ey - .3); ctx.lineTo(x + 2.2, ey - .3); ctx.stroke(); ell(ctx, x, ey + 1, 1.5, 1); ctx.fill(); return; }
    ell(ctx, x, ey, 1.9, 2.6); ctx.fill();
    ctx.fillStyle = '#fff'; circ(ctx, x + .6, ey - .9, .7); ctx.fill(); ctx.fillStyle = OUT;
  };
  eye(-1); eye(1);
  // sobrancelhas
  if (expr === 'scared') { ctx.beginPath(); ctx.moveTo(hx - 8, ey - 6); ctx.lineTo(hx - 3, ey - 7.5); ctx.moveTo(hx + 8, ey - 6); ctx.lineTo(hx + 3, ey - 7.5); ctx.stroke(); }
  if (expr === 'sad') { ctx.beginPath(); ctx.moveTo(hx - 8, ey - 5); ctx.lineTo(hx - 3, ey - 6.8); ctx.moveTo(hx + 8, ey - 5); ctx.lineTo(hx + 3, ey - 6.8); ctx.stroke(); }
  if (expr === 'angry') { ctx.beginPath(); ctx.moveTo(hx - 8, ey - 7); ctx.lineTo(hx - 3, ey - 5); ctx.moveTo(hx + 8, ey - 7); ctx.lineTo(hx + 3, ey - 5); ctx.stroke(); }
  // boca
  const my = hy + 7.5;
  if (acc.includes('mask') || o.mask) {
    rr(ctx, hx - 8, hy + 2, 16, 10, 4); ctx.fillStyle = '#a8d8f0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx - 6, hy + 5.5); ctx.lineTo(hx + 6, hy + 5.5); ctx.moveTo(hx - 6, hy + 8.5); ctx.lineTo(hx + 6, hy + 8.5); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.stroke(); ctx.strokeStyle = OUT;
  } else if (expr === 'smile') {
    ctx.beginPath(); ctx.moveTo(hx - 8, my - 2); ctx.quadraticCurveTo(hx, my + 10, hx + 8, my - 2); ctx.quadraticCurveTo(hx, my + 1.5, hx - 8, my - 2); ctx.closePath();
    ctx.fillStyle = '#5a1f2a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(hx - 6.5, my - .8); ctx.quadraticCurveTo(hx, my + 2.8, hx + 6.5, my - .8); ctx.quadraticCurveTo(hx, my + 4.5, hx - 6.5, my - .8); ctx.fill();
  } else if (expr === 'scared') { ell(ctx, hx, my + 1, 2.2, 3); ctx.fillStyle = '#5a1f2a'; ctx.fill(); ctx.stroke(); }
  else if (expr === 'sad' || expr === 'sick') { ctx.beginPath(); ctx.arc(hx, my + 4, 3.6, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke(); }
  else if (expr === 'sleep') { ell(ctx, hx, my + 1, 1.5, 1.5); ctx.stroke(); }
  else if (expr === 'dead') { ctx.beginPath(); ctx.moveTo(hx - 3, my + 1); ctx.lineTo(hx + 3, my + 1); ctx.stroke(); }
  else if (expr === 'calm') { ctx.beginPath(); ctx.arc(hx, my - 1.5, 5, .2 * Math.PI, .8 * Math.PI); ctx.stroke(); }
  else if (expr === 'grin') { ctx.beginPath(); ctx.arc(hx, my - 1, 4, .05 * Math.PI, .95 * Math.PI); ctx.closePath(); ctx.fillStyle = '#5a1f2a'; ctx.fill(); ctx.stroke(); }
  else if (expr === 'angry') { ctx.beginPath(); ctx.moveTo(hx - 3.5, my + 1); ctx.lineTo(hx + 3.5, my + 1); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(hx, my - 1, 3.2, .2 * Math.PI, .8 * Math.PI); ctx.stroke(); }
  ctx.lineWidth = 2.3;
}

function drawHeadAcc(ctx, L, hx, hy, hr, o) {
  const acc = L.acc || [];
  if (acc.includes('beard')) {
    ctx.beginPath(); ctx.moveTo(hx - hr + 1, hy + 1); ctx.quadraticCurveTo(hx - hr + 2, hy + hr + 5, hx, hy + hr + 6);
    ctx.quadraticCurveTo(hx + hr - 2, hy + hr + 5, hx + hr - 1, hy + 1); ctx.quadraticCurveTo(hx, hy + 13, hx - hr + 1, hy + 1); ctx.closePath();
    paint(ctx, L.beard || L.hair);
  }
  if (acc.includes('mustache')) { ctx.beginPath(); ctx.ellipse(hx - 3, hy + 5.5, 3.6, 1.8, .2, 0, Math.PI * 2); ctx.ellipse(hx + 3, hy + 5.5, 3.6, 1.8, -.2, 0, Math.PI * 2); paint(ctx, L.beard || L.hair); }
  if (acc.includes('veil')) {
    ctx.beginPath(); ctx.moveTo(hx - hr - 3, hy + hr + 4); ctx.lineTo(hx - hr - 3, hy - 2); ctx.arc(hx, hy - 2, hr + 3, Math.PI, 0); ctx.lineTo(hx + hr + 3, hy + hr + 4); ctx.lineTo(hx + hr - 2, hy + hr + 4); ctx.lineTo(hx + hr - 2, hy - 2); ctx.arc(hx, hy - 2, hr - 2, 0, Math.PI, true); ctx.lineTo(hx - hr + 2, hy + hr + 4); ctx.closePath(); paint(ctx, '#23212b');
    ctx.save(); circ(ctx, hx, hy, hr); ctx.clip(); ctx.fillStyle = '#f5f5f5'; ctx.fillRect(hx - hr, hy - 12, hr * 2, 4); ctx.restore();
  }
  if (acc.includes('glasses')) {
    ctx.lineWidth = 1.6; circ(ctx, hx - 5.6, hy + 1, 4); ctx.stroke(); circ(ctx, hx + 5.6, hy + 1, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx - 1.6, hy + 1); ctx.lineTo(hx + 1.6, hy + 1); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; circ(ctx, hx - 5.6, hy + 1, 3.4); ctx.fill(); circ(ctx, hx + 5.6, hy + 1, 3.4); ctx.fill(); ctx.lineWidth = 2.3;
  }
  if (acc.includes('cap')) {
    ctx.beginPath(); ctx.ellipse(hx, hy - 5, hr + 1, hr - 4, 0, Math.PI, 0); ctx.closePath(); paint(ctx, L.capColor || '#24325c');
    ell(ctx, hx + 3, hy - 5, hr - 2, 3.2); paint(ctx, shade(L.capColor || '#24325c', -.3));
    circ(ctx, hx, hy - 11, 2.4); paint(ctx, '#f1c40f');
  }
  if (acc.includes('santa')) {
    ctx.beginPath(); ctx.moveTo(hx - hr - 1, hy - 6); ctx.quadraticCurveTo(hx - 2, hy - hr - 18, hx + hr + 8, hy - hr - 4); ctx.lineTo(hx + hr + 1, hy - 6); ctx.closePath(); paint(ctx, '#d0312d');
    rr(ctx, hx - hr - 2, hy - 9, hr * 2 + 4, 6, 3); paint(ctx, '#fafafa'); circ(ctx, hx + hr + 8, hy - hr - 4, 3.6); paint(ctx, '#fafafa');
  }
  if (acc.includes('nurse')) { rr(ctx, hx - 7, hy - hr - 3, 14, 7, 2); paint(ctx, '#fff'); ctx.fillStyle = '#d0312d'; ctx.fillRect(hx - 1, hy - hr - 2, 2, 5); ctx.fillRect(hx - 2.5, hy - hr - .5, 5, 2); }
  if (acc.includes('headband')) { ctx.save(); circ(ctx, hx, hy, hr); ctx.clip(); ctx.fillStyle = L.band || '#e84393'; ctx.fillRect(hx - hr, hy - 9, hr * 2, 3.5); ctx.restore(); }
  if (acc.includes('bow')) { ctx.beginPath(); ctx.moveTo(hx + 6, hy - hr + 2); ctx.lineTo(hx + 1, hy - hr - 3); ctx.lineTo(hx + 1, hy - hr + 5); ctx.closePath(); ctx.moveTo(hx + 6, hy - hr + 2); ctx.lineTo(hx + 11, hy - hr - 3); ctx.lineTo(hx + 11, hy - hr + 5); ctx.closePath(); paint(ctx, L.bowColor || '#ff6fa5'); }
  if (acc.includes('headset')) { ctx.beginPath(); ctx.arc(hx, hy, hr + 1.5, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 2.6; ctx.stroke(); ctx.lineWidth = 2.3; rr(ctx, hx - hr - 3, hy - 2, 5, 8, 2); paint(ctx, '#333'); rr(ctx, hx + hr - 2, hy - 2, 5, 8, 2); paint(ctx, '#333'); }
  if (acc.includes('earring')) { circ(ctx, hx - hr + .5, hy + 6.5, 1.6); paint(ctx, '#f1c40f', false); circ(ctx, hx + hr - .5, hy + 6.5, 1.6); paint(ctx, '#f1c40f', false); }
}

/* cabeça do mascote Sorrisinho (sorri sempre — por contrato) */
function drawMascotHead(ctx, x, y, r, t) {
  circ(ctx, x, y, r); paint(ctx, '#f6c62f');
  ell(ctx, x - r * .78, y - r * .72, r * .28, r * .36, -.5); paint(ctx, '#f6c62f');
  ell(ctx, x + r * .78, y - r * .72, r * .28, r * .36, .5); paint(ctx, '#f6c62f');
  ctx.fillStyle = OUT; ell(ctx, x - r * .32, y - r * .2, r * .1, r * .16); ctx.fill(); ell(ctx, x + r * .32, y - r * .2, r * .1, r * .16); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - r * .62, y + r * .12); ctx.quadraticCurveTo(x, y + r * .95, x + r * .62, y + r * .12); ctx.quadraticCurveTo(x, y + r * .4, x - r * .62, y + r * .12); ctx.closePath();
  ctx.fillStyle = '#7a2230'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(x - r * .35, y + r * .2, r * .7, r * .12);
  ctx.fillStyle = 'rgba(255,120,120,.45)'; circ(ctx, x - r * .6, y + r * .1, r * .12); ctx.fill(); circ(ctx, x + r * .6, y + r * .1, r * .12); ctx.fill();
}

/* =========================================================
   CACHORRO (o Caramelo)
   ========================================================= */
function drawDog(ctx, x, y, s, o = {}) {
  const t = o.t || 0, c = '#c98b4a', dk = '#94592a', lt = '#ecc590';
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(ctx, 0, 0, 24 * s, 4.5 * s); ctx.fill();
  ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.3;
  const wag = Math.sin(t * (o.happy ? 16 : 6)) * (o.happy ? .6 : .25);
  if (o.pose === 'lie') {
    ctx.save(); ctx.translate(-20, -9); ctx.rotate(-.3 + wag * .5); rr(ctx, -12, -2, 14, 4.5, 2); paint(ctx, c); ctx.restore();
    ell(ctx, -2, -9, 21, 9); paint(ctx, c);
    ell(ctx, 16, -3, 8, 3.5); paint(ctx, c);
    circ(ctx, 21, -15, 9); paint(ctx, c);
    ell(ctx, 28, -12, 6, 4); paint(ctx, lt);
    circ(ctx, 33, -13, 1.8); paint(ctx, OUT, false);
    ell(ctx, 16, -17, 3.5, 7, .5); paint(ctx, dk);
    if (o.sleep) { ctx.beginPath(); ctx.arc(22, -16, 2, .1 * Math.PI, .9 * Math.PI); ctx.stroke(); } else { circ(ctx, 23, -17, 1.5); paint(ctx, OUT, false); }
  } else {
    const ph = o.walk ? Math.sin(t * 12) * 3 : 0;
    [[-15, ph], [-7, -ph], [7, ph], [14, -ph]].forEach(([lx, d]) => { rr(ctx, lx + d * .4, -15, 5, 15, 2); paint(ctx, c); });
    ctx.save(); ctx.translate(-18, -22); ctx.rotate(-.7 + wag); rr(ctx, -2, -15, 4.5, 15, 2.2); paint(ctx, c); ctx.restore();
    ell(ctx, 0, -21, 20, 10); paint(ctx, c);
    ell(ctx, 11, -18, 6.5, 6); paint(ctx, lt, false);
    rr(ctx, 12, -28, 4, 9, 1.5); paint(ctx, '#d0312d');
    circ(ctx, 21, -31, 9.5); paint(ctx, c);
    ell(ctx, 29, -27, 6.5, 4.5); paint(ctx, lt);
    circ(ctx, 34.5, -28.5, 2); paint(ctx, OUT, false);
    ell(ctx, 15, -33, 3.5, 7.5, .45); paint(ctx, dk);
    circ(ctx, 24, -33, 1.6); paint(ctx, OUT, false);
    if (o.growl) { ctx.beginPath(); ctx.moveTo(26, -24.5); ctx.lineTo(33, -24.5); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(27, -25, 1.5, 2); ctx.fillRect(30, -25, 1.5, 2); }
  }
  ctx.restore();
}

/* =========================================================
   ITENS E ÍCONES (caixa de 32 unidades centrada)
   ========================================================= */
function drawItem(ctx, key, cx, cy, size = 32, o = {}) {
  const k = size / 32;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
  switch (key) {
    case 'comida': {
      rr(ctx, -10, -11, 20, 23, 3); paint(ctx, '#cfd5dc');
      ctx.save(); rr(ctx, -10, -11, 20, 23, 3); ctx.clip(); ctx.fillStyle = '#d64933'; ctx.fillRect(-11, -5, 22, 12); ctx.fillStyle = '#f4d35e'; ell(ctx, 0, 1, 5, 3.4); ctx.fill(); ctx.restore();
      rr(ctx, -10, -11, 20, 23, 3); ctx.stroke();
      ell(ctx, 0, -11, 10, 3.2); paint(ctx, '#e9edf0');
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ell(ctx, 0, -11, 6.5, 1.8); ctx.stroke();
      break;
    }
    case 'agua': {
      rr(ctx, -4.5, -15, 9, 6, 2); paint(ctx, '#2a6cd6');
      ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(5, -10); ctx.quadraticCurveTo(11, -8, 11, -2); ctx.lineTo(11, 11); ctx.quadraticCurveTo(11, 14, 8, 14); ctx.lineTo(-8, 14); ctx.quadraticCurveTo(-11, 14, -11, 11); ctx.lineTo(-11, -2); ctx.quadraticCurveTo(-11, -8, -5, -10); ctx.closePath();
      paint(ctx, '#8fd0f5');
      ctx.fillStyle = 'rgba(40,120,200,.35)'; ctx.fillRect(-10, 2, 20, 11);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-7, 8); ctx.stroke();
      break;
    }
    case 'remedio': {
      rr(ctx, -9, -8, 18, 21, 3); paint(ctx, '#f0932b');
      rr(ctx, -10, -14, 20, 7, 2); paint(ctx, '#fafafa');
      rr(ctx, -6, -2, 12, 10, 1.5); paint(ctx, '#fff', false);
      ctx.fillStyle = '#d0312d'; ctx.fillRect(-1.3, -.5, 2.6, 7); ctx.fillRect(-3.5, 1.7, 7, 2.6);
      break;
    }
    case 'pilhas': {
      [-6, 5].forEach(x => {
        rr(ctx, x - 4.5, -10, 9, 22, 2); paint(ctx, '#2d2d2d');
        ctx.fillStyle = '#d4893b'; ctx.fillRect(x - 3.5, -9, 7, 6);
        rr(ctx, x - 2, -13, 4, 3, 1); paint(ctx, '#bbb');
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(x - .7, 2, 1.4, 4); ctx.fillRect(x - 2, 3.3, 4, 1.4);
      });
      break;
    }
    case 'tabuas': {
      [[-.45, '#c08a52'], [.45, '#b07b45']].forEach(([a, col]) => {
        ctx.save(); ctx.rotate(a); rr(ctx, -16, -4.5, 32, 9, 2); paint(ctx, col);
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, -1); ctx.lineTo(10, -1); ctx.moveTo(-8, 2); ctx.lineTo(13, 2); ctx.stroke();
        ctx.fillStyle = '#555'; circ(ctx, -12, 0, 1.3); ctx.fill(); circ(ctx, 12, 0, 1.3); ctx.fill(); ctx.restore();
      });
      break;
    }
    case 'mascara': {
      ctx.beginPath(); ctx.moveTo(-11, -6); ctx.quadraticCurveTo(0, -10, 11, -6); ctx.lineTo(10, 6); ctx.quadraticCurveTo(0, 11, -10, 6); ctx.closePath(); paint(ctx, '#a8d8f0');
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.2; [-3, 0, 3].forEach(y => { ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(9, y); ctx.stroke(); });
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-13, 0, 5, -1.2, 1.2, true); ctx.stroke(); ctx.beginPath(); ctx.arc(13, 0, 5, Math.PI - 1.2, Math.PI + 1.2, true); ctx.stroke();
      break;
    }
    case 'cobertor': {
      rr(ctx, -14, -9, 28, 18, 4); paint(ctx, '#b83b2e');
      ctx.save(); rr(ctx, -14, -9, 28, 18, 4); ctx.clip();
      ctx.fillStyle = 'rgba(255,220,160,.35)'; [-8, 0, 8].forEach(x => ctx.fillRect(x - 1.5, -10, 3, 20)); [-3, 4].forEach(y => ctx.fillRect(-15, y - 1.5, 30, 3));
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-15, -1, 30, 2);
      ctx.restore(); rr(ctx, -14, -9, 28, 18, 4); ctx.stroke();
      break;
    }
    case 'termometro': {
      ctx.save(); ctx.rotate(-.6);
      rr(ctx, -4, -15, 8, 26, 4); paint(ctx, '#f7f7f7');
      rr(ctx, -2.5, -9, 5, 9, 1); paint(ctx, '#9fd8a8', false);
      circ(ctx, 0, 13, 3.4); paint(ctx, '#d0312d');
      ctx.restore();
      break;
    }
    case 'lanterna': {
      ctx.fillStyle = 'rgba(170,110,255,.35)'; ctx.beginPath(); ctx.moveTo(8, -5); ctx.lineTo(17, -12); ctx.lineTo(17, 12); ctx.lineTo(8, 5); ctx.fill();
      rr(ctx, -15, -4.5, 17, 9, 3); paint(ctx, '#5b3fc4');
      rr(ctx, 1, -7, 9, 14, 2); paint(ctx, '#7a5cf0');
      ctx.fillStyle = '#e8dcff'; ctx.fillRect(8, -5, 2, 10);
      rr(ctx, -9, -6.5, 4, 2.5, 1); paint(ctx, '#f1c40f', false);
      break;
    }
    case 'radio': {
      ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(13, -16); ctx.stroke(); circ(ctx, 13, -16, 1.8); paint(ctx, '#ddd');
      rr(ctx, -14, -8, 28, 19, 4); paint(ctx, '#c46a3a');
      circ(ctx, -6, 2, 5.5); paint(ctx, '#3a2a22');
      ctx.fillStyle = 'rgba(255,255,255,.2)'; for (let i = -3; i <= 3; i += 2) ctx.fillRect(-10, 2 + i * 1.1 - .4, 8, .8);
      rr(ctx, 2, -4, 9, 5, 1); paint(ctx, o.on ? '#8dff9d' : '#f3e2b3');
      circ(ctx, 6.5, 6, 2.6); paint(ctx, '#ddd');
      break;
    }
    case 'marreta': {
      ctx.save(); ctx.rotate(-.7);
      rr(ctx, -2.5, -6, 5, 22, 2); paint(ctx, '#a0703d');
      rr(ctx, -10, -14, 20, 10, 2); paint(ctx, '#7f8c8d');
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-9, -13, 18, 2.5);
      ctx.restore();
      break;
    }
    case 'videogame': {
      rr(ctx, -10, -14, 20, 28, 4); paint(ctx, '#d8d4cc');
      rr(ctx, -7, -11, 14, 11, 1.5); paint(ctx, '#87a96b');
      ctx.fillStyle = '#556b3d'; ctx.fillRect(-4, -7, 3, 3); ctx.fillRect(1, -5, 3, 3);
      ctx.fillStyle = OUT; ctx.fillRect(-6, 5, 5, 1.8); ctx.fillRect(-4.4, 3.4, 1.8, 5);
      circ(ctx, 4, 6.5, 1.8); paint(ctx, '#b0304f', false); circ(ctx, 7, 4, 1.8); paint(ctx, '#b0304f', false);
      break;
    }
    case 'kit': {
      rr(ctx, -12, -9, 24, 19, 3); paint(ctx, '#f7f7f7');
      ctx.fillStyle = '#27ae60'; ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-7, -2, 14, 4);
      rr(ctx, -12, -13, 24, 5, 2); paint(ctx, '#27ae60');
      break;
    }
    case 'soro': {
      ctx.fillStyle = 'rgba(80,255,220,.25)'; circ(ctx, 0, 2, 14); ctx.fill();
      rr(ctx, -5, -9, 10, 23, 3); paint(ctx, '#e8fbff');
      ctx.fillStyle = '#3fe0c5'; rr(ctx, -4, -1, 8, 14, 2); ctx.fill();
      rr(ctx, -6, -14, 12, 6, 1.5); paint(ctx, '#2c3e50');
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-3, 1, 1.5, 9);
      break;
    }
    case 'amostra': {
      ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, -9); ctx.lineTo(7, 13); ctx.lineTo(-7, 13); ctx.closePath(); paint(ctx, '#e9f7e4');
      rr(ctx, -11, -13, 22, 5, 2); paint(ctx, '#3c9d5d');
      ctx.fillStyle = '#3c9d5d'; ctx.beginPath(); ctx.ellipse(0, 2, 3.5, 6, .6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(3, -13); ctx.lineTo(6, -18); ctx.stroke();
      break;
    }
    case 'chaves': {
      ctx.lineWidth = 2.4; circ(ctx, -6, -6, 6); ctx.stroke();
      rr(ctx, -2, -4, 16, 5, 2); paint(ctx, '#d4ac3b');
      ctx.fillStyle = '#d4ac3b'; ctx.fillRect(8, 0, 2.5, 4); ctx.fillRect(12, 0, 2, 3);
      rr(ctx, -14, 2, 9, 11, 3); paint(ctx, '#d0312d');
      break;
    }
    case 'nota': {
      ctx.save(); ctx.rotate(-.08); rr(ctx, -11, -13, 22, 27, 1); paint(ctx, '#fdf6d8');
      ctx.strokeStyle = 'rgba(60,60,120,.45)'; ctx.lineWidth = 1.2; for (let y = -6; y <= 9; y += 4) { ctx.beginPath(); ctx.moveTo(-7, y); ctx.lineTo(7, y); ctx.stroke(); }
      ctx.restore(); circ(ctx, 0, -13, 2.6); paint(ctx, '#d0312d');
      break;
    }
    case 'carrinho': {
      ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(-10, -12); ctx.lineTo(-6, 6); ctx.lineTo(12, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, -7); ctx.lineTo(15, -7); ctx.lineTo(12, 3); ctx.lineTo(-7, 3); ctx.closePath(); paint(ctx, '#bfc9d2');
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; for (let x = -4; x <= 10; x += 4) { ctx.beginPath(); ctx.moveTo(x, -7); ctx.lineTo(x - .5, 3); ctx.stroke(); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; circ(ctx, -4, 11, 2.8); paint(ctx, '#444'); circ(ctx, 10, 11, 2.8); paint(ctx, '#444');
      break;
    }
    case 'racao': {
      rr(ctx, -10, -13, 20, 26, 4); paint(ctx, '#e67e22');
      rr(ctx, -6, -4, 12, 10, 2); paint(ctx, '#fff', false);
      ctx.fillStyle = '#8e5a2b'; circ(ctx, 0, 1, 2.2); ctx.fill(); [-2.5, 0, 2.5].forEach(x => { circ(ctx, x, -2, 1); ctx.fill(); });
      break;
    }
    case 'extintor': {
      rr(ctx, -7, -9, 14, 23, 5); paint(ctx, '#d63031');
      rr(ctx, -4, -14, 8, 6, 2); paint(ctx, '#2d3436');
      ctx.beginPath(); ctx.moveTo(3, -12); ctx.lineTo(11, -12); ctx.lineTo(13, -6); ctx.stroke();
      rr(ctx, -5, -2, 10, 7, 1); paint(ctx, '#fff', false);
      ctx.fillStyle = '#d63031'; ctx.fillRect(-3, 0, 6, 1.5); ctx.fillRect(-3, 2.5, 4, 1.5);
      break;
    }
    case 'cafe': {
      rr(ctx, -9, -10, 18, 22, 3); paint(ctx, '#6d4c41');
      rr(ctx, -10, -14, 20, 6, 2); paint(ctx, '#d4a373');
      rr(ctx, -6, -4, 12, 10, 2); paint(ctx, '#f6e7c1', false);
      ctx.fillStyle = '#6d4c41'; ell(ctx, 0, 1, 3.5, 2.5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.quadraticCurveTo(-6, -22, -2, -25); ctx.moveTo(3, -18); ctx.quadraticCurveTo(0, -22, 4, -25); ctx.stroke();
      break;
    }
    case 'baralho': {
      ctx.save(); ctx.rotate(-.25); rr(ctx, -10, -13, 18, 25, 3); paint(ctx, '#2e86de'); ctx.restore();
      ctx.save(); ctx.rotate(.15); rr(ctx, -7, -12, 18, 25, 3); paint(ctx, '#fff');
      ctx.fillStyle = '#d63031'; ctx.beginPath(); ctx.moveTo(2, -4); ctx.bezierCurveTo(-4, -10, -6, 0, 2, 6); ctx.bezierCurveTo(10, 0, 8, -10, 2, -4); ctx.fill();
      ctx.font = 'bold 7px Inter, sans-serif'; ctx.fillText('A', -5, -6); ctx.restore();
      break;
    }
    case 'walkie': {
      ctx.beginPath(); ctx.moveTo(4, -9); ctx.lineTo(4, -17); ctx.stroke();
      rr(ctx, -7, -10, 14, 24, 3); paint(ctx, '#f39c12');
      rr(ctx, -5, -6, 10, 6, 1); paint(ctx, '#2d3436', false);
      ctx.fillStyle = OUT; for (let y = 3; y <= 9; y += 3) ctx.fillRect(-4, y, 8, 1.4);
      break;
    }
    case 'fita': {
      circ(ctx, 0, 0, 13); paint(ctx, '#b2bec3');
      circ(ctx, 0, 0, 6); paint(ctx, '#3d3a45');
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI * 1.1, Math.PI * 1.5); ctx.lineTo(0, 0); ctx.fill();
      rr(ctx, 6, 8, 12, 5, 1); paint(ctx, '#b2bec3');
      break;
    }
    /* ---- ícones de interface ---- */
    case 'heart': case 'heart0': {
      ctx.beginPath(); ctx.moveTo(0, 12); ctx.bezierCurveTo(-16, 1, -12, -14, 0, -6); ctx.bezierCurveTo(12, -14, 16, 1, 0, 12); ctx.closePath();
      paint(ctx, key === 'heart' ? '#e5484d' : 'rgba(0,0,0,.08)');
      if (key === 'heart') { ctx.fillStyle = 'rgba(255,255,255,.5)'; ell(ctx, -6, -4, 2.5, 1.6, -.6); ctx.fill(); }
      break;
    }
    case 'stress': {
      ctx.beginPath(); ctx.arc(-6, 2, 7, Math.PI * .5, Math.PI * 1.5); ctx.arc(0, -4, 8, Math.PI, Math.PI * 2); ctx.arc(7, 2, 7, Math.PI * 1.5, Math.PI * .5); ctx.closePath(); paint(ctx, '#56607a');
      ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-3, 12); ctx.lineTo(2, 11); ctx.lineTo(-1, 16); ctx.stroke();
      break;
    }
    case 'injured': {
      ctx.save(); ctx.rotate(-.6); rr(ctx, -13, -5, 26, 10, 5); paint(ctx, '#f3d9b1');
      rr(ctx, -5, -5, 10, 10, 1); paint(ctx, '#e9c48f'); ctx.fillStyle = '#c0392b'; circ(ctx, 0, 0, 2); ctx.fill(); ctx.restore();
      break;
    }
    case 'sick': {
      circ(ctx, 0, 0, 12); paint(ctx, '#a6d36b');
      ctx.fillStyle = OUT; ctx.fillRect(-6, -3, 4, 2); ctx.fillRect(2, -3, 4, 2);
      ctx.beginPath(); ctx.moveTo(-5, 6); ctx.quadraticCurveTo(-2, 3, 0, 6); ctx.quadraticCurveTo(2, 9, 5, 6); ctx.stroke();
      break;
    }
    case 'skull': {
      circ(ctx, 0, -2, 11); paint(ctx, '#ece8df'); rr(ctx, -6, 6, 12, 7, 2); paint(ctx, '#ece8df');
      ctx.fillStyle = OUT; circ(ctx, -4.5, -2, 3); ctx.fill(); circ(ctx, 4.5, -2, 3); ctx.fill();
      break;
    }
    case 'infect': {
      circ(ctx, 0, 0, 12); paint(ctx, '#bfe3a8');
      ctx.beginPath(); ctx.arc(-4.5, -2, 2.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(4.5, -2, 2.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-7, 3); ctx.quadraticCurveTo(0, 12, 7, 3); ctx.closePath(); paint(ctx, '#5a1f2a');
      break;
    }
    case 'dog': { ctx.restore(); ctx.save(); ctx.translate(cx, cy + size * .38); drawDog(ctx, -size * .18, 0, size / 50, { pose: 'idle' }); break; }
    case 'lock': {
      ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -4, 7, Math.PI, 0); ctx.stroke(); ctx.lineWidth = 2.2;
      rr(ctx, -10, -4, 20, 16, 3); paint(ctx, '#f1c40f'); circ(ctx, 0, 3, 2.4); paint(ctx, OUT, false);
      break;
    }
    case 'hunger': { drawItem(ctx, 'comida', 0, 0, 30); break; }
    case 'thirst': { drawItem(ctx, 'agua', 0, 0, 30); break; }
    case 'zzz': {
      ctx.fillStyle = '#cfe2ff'; ctx.font = 'bold 14px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('z', -6, 6); ctx.font = 'bold 18px Inter, sans-serif'; ctx.fillText('Z', 5, -4);
      break;
    }
    case 'bang': {
      circ(ctx, 0, 0, 12); paint(ctx, '#ffd23f');
      ctx.fillStyle = OUT; rr(ctx, -2, -8, 4, 10, 2); ctx.fill(); circ(ctx, 0, 6.5, 2.2); ctx.fill();
      break;
    }
    case 'question': {
      circ(ctx, 0, 0, 12); paint(ctx, '#7fd3ff');
      ctx.fillStyle = OUT; ctx.font = 'bold 18px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 1);
      break;
    }
  }
  const gl = GLOSS[key];
  if (gl) { ctx.fillStyle = 'rgba(255,255,255,.38)'; rr(ctx, gl[0], gl[1], gl[2], gl[3], gl[2] / 2); ctx.fill(); }
  ctx.restore();
}
const GLOSS = { comida: [-7, -7, 2.5, 16], remedio: [-6, -5, 2.5, 14], pilhas: [-8.5, -6, 1.6, 14], radio: [-11, -6, 2.5, 12], videogame: [-8, -11, 2, 20], kit: [-10, -6, 2.5, 12], soro: [-3.5, -7, 1.5, 6], amostra: [-6, -6, 2, 14], cobertor: [-12, -7, 2.5, 12], lanterna: [-13, -3, 12, 1.8], extintor: [-5, -6, 2.5, 14], cafe: [-7, -7, 2, 14], walkie: [-5, -8, 2, 10] };

/* ícones como <img> (cache em dataURL) */
const ICON_CACHE = {};
function iconURL(key, size = 32) {
  const id = key + '@' + size;
  if (!ICON_CACHE[id]) {
    const c = document.createElement('canvas'); const r = 2;
    c.width = c.height = size * r;
    const x = c.getContext('2d'); x.scale(r, r);
    drawItem(x, key, size / 2, size / 2, size * .92);
    ICON_CACHE[id] = c.toDataURL();
  }
  return ICON_CACHE[id];
}
function icon(key, size = 24, cls = '') { return `<img class="ico ${cls}" src="${iconURL(key, 64)}" width="${size}" height="${size}" alt="">`; }

/* retrato (cabeça e ombros) num <canvas> */
function paintPortrait(cv, L, o = {}) {
  const r = window.devicePixelRatio > 1 ? 2 : 1;
  const w = cv.clientWidth || +cv.getAttribute('width') || 64, h = cv.clientHeight || +cv.getAttribute('height') || 64;
  if (cv.width !== w * r) { cv.width = w * r; cv.height = h * r; }
  const ctx = cv.getContext('2d');
  ctx.setTransform(r, 0, 0, r, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h); }
  const sc = h / (L.body === 'kid' ? 40 : 46) * (o.zoom || 1);
  const headY = h * (o.headY || .46);
  const kidk = L.body === 'kid' ? .8 : 1;
  drawChar(ctx, w / 2, headY + 52 * sc * kidk, sc, L, Object.assign({ shadow: false }, o));
}
