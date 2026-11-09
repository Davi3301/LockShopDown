'use strict';
/* =========================================================
   LOCKSHOPDOWN — fluxo: título, história, escolha, finais
   ========================================================= */

const App = { proto: null, introIdx: 0, typing: null, anim: null, mode: Prefs.get('mode', 'classico'), diff: Prefs.get('diff', 'normal') };
if (!MODES[App.mode]) App.mode = 'classico'; if (!DIFFS[App.diff]) App.diff = 'normal';

/* barra de modo e dificuldade na tela de escolha */
function renderSetup() {
  const seg = (act, obj, cur) => Object.entries(obj).map(([k, v]) => `<button class="seg-b ${cur === k ? 'on' : ''}" data-act="${act}" data-k="${k}">${v.n}</button>`).join('');
  $('#setupBar').innerHTML = `<div class="setup-row"><span class="setup-l">Modo</span><div class="seg">${seg('setMode', MODES, App.mode)}</div><span class="setup-d">${MODES[App.mode].d}</span></div>
    <div class="setup-row"><span class="setup-l">Dificuldade</span><div class="seg">${seg('setDiff', DIFFS, App.diff)}</div><span class="setup-d">${DIFFS[App.diff].d}</span></div>`;
}

/* modo Direto pro Depósito: começa com itens e pessoas aleatórias */
function randomStart() {
  const stash = {}, add = (k, n) => { stash[k] = (stash[k] || 0) + n; };
  const rich = { facil: 1.4, normal: 1, dificil: .75, pesadelo: .55 }[App.diff] || 1;
  add('comida', Math.max(3, Math.round(rnd(3, 5) * rich) * 3));
  add('agua', Math.max(4, Math.round(rnd(3, 5) * rich) * 4));
  [['remedio', 2, .7], ['pilhas', 3, .7], ['tabuas', 2, .6], ['mascara', 2, .5], ['cobertor', 1, .5], ['cafe', 2, .5], ['fita', 2, .45], ['kit', 1, .3]].forEach(([k, n, p]) => { if (chance(p * rich)) add(k, n); });
  ['termometro', 'lanterna', 'radio', 'marreta', 'videogame', 'baralho', 'extintor', 'walkie'].forEach(k => { if (chance(.4 * rich)) stash[k] = 1; });
  if (chance(.25)) stash.amostra = 1;
  const keys = shuffle(REGULARS).slice(0, rnd(1, 3));
  let used = false;
  const saved = keys.map(key => { const inf = !used && chance(D().pool * .7); if (inf) used = true; return { key, infected: inf }; });
  return { ok: true, mode: 'deposito', stash, saved, dog: chance(.45), notes: chance(.4) ? [pick(['memo', 'diario', 'cupom', 'desenho'])] : [], playerInfected: false, hugs: 0 };
}

/* ---------------- cenas ilustradas ---------------- */
function sky(c, W, H, top = '#0b0d1f', bot = '#2a1840') {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = seeded(5); c.fillStyle = 'rgba(255,255,255,.7)';
  for (let i = 0; i < 70; i++) { const s = r() * 1.6 + .4; c.fillRect(r() * W, r() * H * .5, s, s); }
}
function skyline(c, W, base, col = '#141226') {
  const r = seeded(9); c.fillStyle = col; let x = 0;
  while (x < W) { const w = 30 + r() * 60, h = 40 + r() * 120; c.fillRect(x, base - h, w, h); c.fillStyle = 'rgba(255,220,140,.25)'; for (let i = 0; i < 6; i++) c.fillRect(x + 5 + r() * (w - 10), base - h + 8 + r() * (h - 16), 3, 4); c.fillStyle = col; x += w + 4; }
}
function neonText(c, text, x, y, size, color, flicker = 1, font = 'Bungee') {
  c.save(); c.font = `${size}px ${font}, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = color; c.shadowBlur = 22 * flicker; c.fillStyle = flicker > .5 ? color : shade(color, -.6);
  c.fillText(text, x, y); c.shadowBlur = 0; c.restore();
}

function drawFacade(c, W, H, t) {
  sky(c, W, H);
  c.fillStyle = '#f5f1d8'; circ(c, W * .85, 70, 28); c.fill(); c.fillStyle = '#0b0d1f'; circ(c, W * .85 + 10, 64, 26); c.fill();
  skyline(c, W, H * .62);
  // prédio
  c.lineWidth = 3; c.strokeStyle = OUT;
  rr(c, W * .12, H * .26, W * .76, H * .42, 6); paint(c, '#2c2839');
  for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(W * .12, H * .3 + i * 34, W * .76, 12); }
  // entrada de vidro
  rr(c, W * .38, H * .44, W * .24, H * .24, 4); paint(c, '#1d3b4a');
  const gl = c.createLinearGradient(0, H * .44, 0, H * .68); gl.addColorStop(0, 'rgba(120,230,255,.45)'); gl.addColorStop(1, 'rgba(120,230,255,.1)');
  c.fillStyle = gl; c.fillRect(W * .38 + 3, H * .44 + 3, W * .24 - 6, H * .24 - 6);
  // persiana descendo
  const sh = clamp((Math.sin(t * .5) + 1) / 2 * .6 + .2, 0, 1);
  c.fillStyle = '#8b939c'; c.fillRect(W * .38 + 3, H * .44 + 3, W * .24 - 6, (H * .24 - 6) * sh);
  c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = H * .44 + 8; y < H * .44 + (H * .24) * sh; y += 7) c.fillRect(W * .38 + 3, y, W * .24 - 6, 2);
  // letreiro
  const fl = Math.sin(t * 13) > -.85 ? 1 : .2;
  neonText(c, 'LOCK', W * .36, H * .32, 40, '#ffffff');
  neonText(c, 'SHOP', W * .5, H * .32, 40, '#ff3d7f', fl);
  neonText(c, 'CENTER', W * .66, H * .32, 40, '#ffffff');
  // faixa
  c.save(); c.translate(W * .5, H * .395); c.rotate(-.015);
  rr(c, -W * .25, -16, W * .5, 32, 3); paint(c, '#c0392b');
  c.fillStyle = '#ffe14d'; c.font = '18px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LIQUIDAÇÃO FINAL · ATÉ 70% OFF', 0, 1);
  c.restore();
  // estacionamento
  c.fillStyle = '#1c1a22'; c.fillRect(0, H * .68, W, H * .32);
  c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3; for (let x = 20; x < W; x += 90) { c.beginPath(); c.moveTo(x, H * .78); c.lineTo(x + 40, H); c.stroke(); }
  c.strokeStyle = OUT;
  [[W * .08, '#c0392b'], [W * .76, '#2e86de'], [W * .9, '#f1c40f']].forEach(([x, col]) => car(c, x, H * .86, 1, col));
  // postes
  [W * .2, W * .8].forEach(x => {
    c.fillStyle = '#333'; c.fillRect(x - 3, H * .5, 6, H * .4);
    const g = c.createRadialGradient(x, H * .5, 4, x, H * .9, 200); g.addColorStop(0, 'rgba(255,230,160,.3)'); g.addColorStop(1, 'rgba(255,230,160,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(x - 10, H * .5); c.lineTo(x + 10, H * .5); c.lineTo(x + 110, H); c.lineTo(x - 110, H); c.closePath(); c.fill(); c.restore();
  });
  // Calmos chegando
  for (let i = 0; i < 4; i++) {
    const x = ((t * 14 + i * 230) % (W + 200)) - 100;
    const L = Object.values(CHARACTERS)[i * 3 % 13].look;
    drawChar(c, x, H * .94 - (i % 2) * 18, .9, L, { t: t + i, pose: 'walk', expr: 'smile', pale: .8, glassy: true });
  }
}
function car(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 3; c.strokeStyle = OUT;
  rr(c, -60, -30, 120, 30, 10); paint(c, col);
  c.beginPath(); c.moveTo(-34, -30); c.lineTo(-22, -52); c.lineTo(26, -52); c.lineTo(40, -30); c.closePath(); paint(c, shade(col, -.2));
  c.fillStyle = 'rgba(150,210,255,.6)'; c.beginPath(); c.moveTo(-28, -32); c.lineTo(-19, -48); c.lineTo(0, -48); c.lineTo(0, -32); c.fill(); c.beginPath(); c.moveTo(4, -32); c.lineTo(4, -48); c.lineTo(23, -48); c.lineTo(34, -32); c.fill();
  circ(c, -34, 0, 12); paint(c, '#222'); circ(c, 34, 0, 12); paint(c, '#222'); circ(c, -34, 0, 5); paint(c, '#999'); circ(c, 34, 0, 5); paint(c, '#999');
  c.restore();
}

const INTRO = [
  { draw: (c, W, H, t) => drawFacade(c, W, H, t),
    text: 'Sexta-feira, 21h47. O LockShop Center está a 13 minutos de fechar. Na fachada, uma faixa: LIQUIDAÇÃO FINAL. Ninguém prestou atenção na palavra "final".' },
  { draw: (c, W, H, t) => {
      c.fillStyle = '#3b2a2a'; c.fillRect(0, 0, W, H);
      for (let y = H * .6; y < H; y += 40) for (let x = 0; x < W; x += 40) { c.fillStyle = ((x + y) / 40) % 2 ? '#c9805a' : '#bd7450'; c.fillRect(x, y, 40, 40); }
      c.lineWidth = 3; c.strokeStyle = OUT;
      rr(c, W * .2, H * .2, W * .6, H * .42, 8); paint(c, '#2f9e63');
      for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#2f9e63' : '#fff'; c.fillRect(W * .2 + i * W * .05, H * .2, W * .05, 30); }
      c.strokeRect(W * .2, H * .2, W * .6, 30);
      neonText(c, 'SERENITÁ', W / 2, H * .34, 46, '#b8ffd0', 1);
      c.fillStyle = '#fff'; c.font = 'bold 20px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('BEBA A CALMA · AMOSTRA GRÁTIS', W / 2, H * .45);
      for (let i = 0; i < 7; i++) drawItem(c, 'amostra', W * .28 + i * W * .072, H * .54, 30);
      const people = ['kelly', 'bruno', 'lucia', 'ricardinho', 'fabinho'];
      people.forEach((k, i) => { const x = W * .14 + i * W * .18; drawChar(c, x, H * .97, 1.8, CHARACTERS[k].look, { t: t + i, pose: 'idle', expr: 'smile', pale: .25 + Math.sin(t + i) * .05 }); drawItem(c, 'amostra', x + 30, H * .97 - 52, 26); });
    },
    text: 'Na praça de alimentação, um quiosque novo distribuía amostras grátis de SERENITÁ, "a bebida que acalma". Cinco mil copinhos. A fila dava voltas.' },
  { draw: (c, W, H, t) => {
      c.fillStyle = '#d6cdbd'; c.fillRect(0, H * .55, W, H * .45); c.fillStyle = '#3c3947'; c.fillRect(0, 0, W, H * .55);
      for (let x = 0; x < W; x += 120) { rr(c, x + 10, H * .12, 100, H * .38, 4); c.fillStyle = 'rgba(160,220,255,.25)'; c.fill(); }
      c.lineWidth = 3; c.strokeStyle = OUT;
      c.save(); c.translate(W / 2, 40); c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.lineTo(46, 46); c.lineTo(-46, 46); c.closePath(); paint(c, '#9aa3ad'); c.restore();
      c.strokeStyle = 'rgba(255,230,120,.7)'; c.lineWidth = 4;
      for (let i = 0; i < 3; i++) { const r = 40 + ((t * 60 + i * 30) % 90); c.globalAlpha = 1 - (r - 40) / 90; c.beginPath(); c.arc(W / 2, 70, r, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
      c.globalAlpha = 1;
      const keys = ['marta', 'tonhao', 'taina', 'gilmar', 'neide', 'jorge'];
      keys.forEach((k, i) => { const calm = i === 2 || i === 4; drawChar(c, W * .1 + i * W * .16, H * .98, 1.6, CHARACTERS[k].look, { t: t * (calm ? .5 : 1) + i, pose: calm ? 'reach' : 'idle', expr: calm ? 'smile' : 'scared', pale: calm ? .8 : 0, sweat: !calm }); });
      c.lineWidth = 3; c.strokeStyle = OUT;
      rr(c, W / 2 - 190, 130, 380, 54, 12); paint(c, '#fffdf5');
      c.fillStyle = OUT; c.font = '22px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EMERGÊNCIA SANITÁRIA', W / 2, 158);
    },
    text: 'Às 21h47, os alto-falantes chiaram: "emergência sanitária". Quem tinha bebido não se assustou. Ficou calmo. Simpático. E começou a abraçar. Por muito tempo.' },
  { draw: (c, W, H, t) => {
      c.fillStyle = '#1a1820'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#cbc1b0'; c.fillRect(0, H * .78, W, H * .22);
      c.lineWidth = 3; c.strokeStyle = OUT;
      for (let i = 0; i < 4; i++) {
        const x = 20 + i * (W - 40) / 4, w = (W - 40) / 4 - 20;
        rr(c, x, H * .12, w, H * .66, 4); paint(c, '#2a3542');
        neonText(c, ['BOM PREÇO', 'DROGARIA', 'FERRAGENS', 'ELETRO'][i], x + w / 2, H * .08, 18, ['#4ade80', '#f472b6', '#fb923c', '#60a5fa'][i], 1, 'Inter');
        const k = clamp(((t * .35 + i * .22) % 1.4), 0, 1);
        c.fillStyle = '#8b939c'; c.fillRect(x + 3, H * .12 + 3, w - 6, (H * .66 - 6) * k);
        c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = H * .12 + 8; y < H * .12 + (H * .66) * k; y += 8) c.fillRect(x + 3, y, w - 6, 2);
        if (Math.floor(t * 4 + i) % 2) { c.fillStyle = '#ff2d2d'; circ(c, x + w / 2, H * .12 - 8 + 18, 6); c.fill(); }
      }
      const pr = PROTAGONISTS[Math.floor(t / 2) % 3];
      drawChar(c, W * .5, H * .99, 1.7, pr.look, { t: t * 2, pose: 'run', expr: 'scared', sweat: true });
      neonText(c, '3:00', W * .86, H * .88, 54, '#ff3b3b', Math.sin(t * 8) > 0 ? 1 : .4);
    },
    text: 'As portas de aço vão baixar em 3 minutos, loja por loja. O depósito da sua loja é o único lugar seguro. Pegue o que puder. Quem puder.' },
];

function startIntro() {
  App.introIdx = 0;
  Screen.show('intro');
  showIntroPanel();
  startAnim('#introCv', (c, W, H, t) => INTRO[App.introIdx].draw(c, W, H, t));
}
function showIntroPanel() {
  const p = INTRO[App.introIdx];
  $('#introStep').textContent = `${App.introIdx + 1} / ${INTRO.length}`;
  typeText($('#introText'), p.text);
}
function typeText(el, text) {
  clearInterval(App.typing);
  let i = 0; el.textContent = '';
  App.typingFull = () => { clearInterval(App.typing); App.typing = null; el.textContent = text; };
  App.typing = setInterval(() => {
    i += 2; el.textContent = text.slice(0, i);
    if (i % 6 === 0) Sound.play('type');
    if (i >= text.length) { clearInterval(App.typing); App.typing = null; }
  }, 28);
}
function introNext() {
  if (App.typing) { App.typingFull(); return; }
  App.introIdx++;
  Sound.play('page');
  if (App.introIdx >= INTRO.length) return startSelect();
  showIntroPanel();
}

/* animação genérica em canvas */
function startAnim(sel, fn) {
  stopAnim();
  const cv = $(sel), c = cv.getContext('2d');
  const t0 = performance.now();
  const step = now => {
    if (!cv.isConnected || cv.offsetParent === null) { App.anim = requestAnimationFrame(step); return; }
    c.setTransform(1, 0, 0, 1, 0, 0);
    fn(c, cv.width, cv.height, (now - t0) / 1000);
    App.anim = requestAnimationFrame(step);
  };
  App.anim = requestAnimationFrame(step);
}
function stopAnim() { if (App.anim) cancelAnimationFrame(App.anim); App.anim = null; }

/* ---------------- escolha de personagem ---------------- */
function startSelect() {
  Screen.show('select');
  renderSetup();
  $('#protoList').innerHTML = PROTAGONISTS.map(p => `
    <button class="proto" data-act="pickProto" data-k="${p.key}">
      <canvas class="proto-cv" data-k="${p.key}" width="200" height="220"></canvas>
      <b>${p.name}</b><span class="role">${p.role}</span><span class="perk">${p.perk}</span>
    </button>`).join('');
  stopAnim();
  const cvs = $$('.proto-cv');
  const t0 = performance.now();
  const step = now => {
    if (Screen.cur !== 'select') return;
    const t = (now - t0) / 1000;
    cvs.forEach((cv, i) => {
      const c = cv.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0);
      const g = c.createRadialGradient(100, 130, 10, 100, 130, 130); g.addColorStop(0, '#2b2840'); g.addColorStop(1, '#14121c');
      c.fillStyle = g; c.fillRect(0, 0, 200, 220);
      const hov = cv.parentElement.matches(':hover');
      drawChar(c, 100, 200, 2.5, PROTAGONISTS[i].look, { t: t + i, pose: hov ? 'walk' : 'idle', expr: hov ? 'grin' : 'normal' });
    });
    App.anim = requestAnimationFrame(step);
  };
  App.anim = requestAnimationFrame(step);
}

/* ---------------- fase 1 → fase 2 ---------------- */
function beginRun(key) {
  App.proto = key; stopAnim();
  if (App.mode === 'deposito') { Sound.play('slam'); onRunDone(randomStart()); return; }
  Scav.start(key, onRunDone);
}
function onRunDone(res) {
  App.runRes = res;
  Progress.add('runs');
  if (!res.ok) { G = null; return endGame(res.reason, res); }
  const units = Object.values(res.stash).reduce((a, b) => a + b, 0);
  Progress.unlock('first_run'); Progress.max('bestItems', units);
  if (units >= 30) Progress.unlock('packrat');
  if (res.saved.length >= 3) Progress.unlock('full_house');
  if (res.dog) Progress.unlock('dog');
  if (!res.hugs) Progress.unlock('untouched');
  if (res.skipped) Progress.unlock('skip');
  res.notes.forEach(n => Progress.note(n));
  const items = Object.entries(res.stash).map(([k, n]) => `<span class="sum-i">${icon(k, 34)}<b>${ITEMS[k].u ? '' : '×' + n}</b><small>${ITEMS[k].short}</small></span>`).join('');
  const ppl = res.saved.map(s => `<span class="sum-p"><canvas class="ptk" data-key="${s.key}" width="56" height="56"></canvas><small>${CHARACTERS[s.key].name}</small></span>`).join('');
  setTimeout(() => {
    openModal(`<div class="slam-wrap"><h2 class="slam">${res.mode === 'deposito' ? 'VOCÊ ACORDOU NO DEPÓSITO' : 'A PORTA BAIXOU'}</h2>
      <p>${res.mode === 'deposito' ? 'Dor de cabeça. Cheiro de papelão. Você não lembra como chegou aqui, mas a porta está trancada e alguém fez um inventário:' : 'Lá fora, a música ambiente continua. Aqui dentro, vocês têm:'}</p>
      <div class="sum-items">${items || '<i class="muted">Nada. Absolutamente nada.</i>'}</div>
      ${ppl || res.dog ? `<p>Com você:</p><div class="sum-people">${ppl}${res.dog ? `<span class="sum-p">${icon('dog', 56)}<small>Caramelo</small></span>` : ''}</div>` : '<p class="muted">Ninguém veio com você.</p>'}
      ${res.notes.length ? `<p class="note">Você achou ${res.notes.length} documento(s). Leia no Arquivo.</p>` : ''}
      <button class="btn big" data-act="startShelter">Começar a primeira noite</button></div>`, 'summary');
    $$('#modalCard canvas.ptk').forEach(cv => paintPortrait(cv, CHARACTERS[cv.dataset.key].look, { expr: 'grin' }));
  }, 700);
}

/* =========================================================
   FINAIS
   ========================================================= */
function endGame(kind, extra) {
  if (G) G.over = true;
  closeModal(); Room.peep = null;
  Sound.stopMuzak(); Sound.stopDrone();
  const E = buildEnding(kind, extra || {});
  const firstTime = Progress.ending(E.id);
  if (G) Progress.add('games');
  if (G && E.cls === 'good' && (G.diff === 'dificil' || G.diff === 'pesadelo')) E.ach.push('brave');
  if (G && G.mode === 'deposito') E.ach.push('direto');
  E.ach.forEach(a => Progress.unlock(a));
  if (E.rescued) Progress.max('bestRescued', E.rescued);
  if (G) Progress.max('bestDay', G.day);
  $('#endKicker').innerHTML = E.kicker + (firstTime ? ' <span class="new-end">Novo final!</span>' : '') + `<span class="end-count">${Object.keys(Progress.data.endings).length}/${Object.keys(ENDINGS).length} finais</span>`;
  const tt = $('#endTitle'); tt.textContent = E.title; tt.className = 'end-title ' + E.cls;
  $('#endText').innerHTML = E.text;
  $('#endStars').innerHTML = E.stars ? `<div class="stars">${'★'.repeat(E.stars)}${'☆'.repeat(5 - E.stars)}</div><div class="muted small">Avalie sua experiência no LockShop Center</div>` : '';
  let stats = '', reveal = '';
  if (G) {
    stats = `<div class="stat-row"><span>Dias: <b>${G.day}</b></span><span>Deixou entrar: <b>${G.stats.letIn}</b></span><span>Recusou: <b>${G.stats.refused}</b></span><span>Expedições: <b>${G.stats.exped}</b></span><span>Documentos: <b>${G.notes.length}/${Object.keys(NOTES).length}</b></span></div>`;
    G.members.forEach(m => { if (m.alive && !m.fate) m.fate = 'Ficou no depósito'; });
    const list = [P(), ...G.seen];
    reveal = `<div class="reveal"><h4>Quem era quem</h4><div class="rv-grid">${list.map((x, i) => `<div class="rv ${x.infected ? 'inf' : ''}"><canvas class="rvc" data-i="${i}" width="60" height="60"></canvas><div><b>${x.name}</b><span>${x.infected ? 'Infectado' : 'Saudável'}</span><small>${x.fate || ''}</small></div></div>`).join('')}</div></div>`;
    App.revealList = list;
  }
  $('#endStats').innerHTML = stats + reveal;
  Screen.show('end');
  $$('#endStats canvas.rvc').forEach(cv => { const x = App.revealList[+cv.dataset.i]; paintPortrait(cv, x.look, { expr: x.infected ? 'smile' : 'normal', pale: x.infected ? .6 : 0 }); });
  startAnim('#endCv', (c, W, H, t) => E.draw(c, W, H, t));
  Sound.play(E.cls === 'good' ? 'good' : 'bad');
}

function survivorsGroup(list, c, x, y, s, t, opts = {}) {
  list.slice(0, 7).forEach((m, i) => drawChar(c, x + i * 46 * s, y + (i % 2) * 6, s, m.look, { t: t + i, pose: opts.pose || 'idle', expr: opts.expr ? opts.expr(m) : 'grin', pale: m.infected && opts.reveal ? .6 : 0 }));
}
function heli(c, x, y, s, t, smile) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 3; c.strokeStyle = OUT;
  ell(c, 0, 0, 70, 34); paint(c, '#3d5a3c');
  rr(c, 50, -10, 110, 16, 6); paint(c, '#3d5a3c');
  c.save(); c.translate(160, -2); c.rotate(t * 20); rr(c, -3, -22, 6, 44, 2); paint(c, '#222'); c.restore();
  ell(c, -22, -6, 30, 18); paint(c, 'rgba(150,210,255,.75)');
  if (smile) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, -22, -6, 30, '#9dff8a', .5); c.restore(); drawItem(c, 'infect', -22, -6, 22); }
  c.beginPath(); c.moveTo(-40, 34); c.lineTo(40, 34); c.moveTo(-26, 34); c.lineTo(-20, 22); c.moveTo(26, 34); c.lineTo(20, 22); c.stroke();
  c.save(); c.scale(1, .12); c.rotate(t * 25); rr(c, -120, -6, 240, 12, 4); paint(c, '#222'); c.restore();
  c.restore();
}

function buildEnding(kind, extra) {
  const E = { id: kind, kicker: 'Fim de expediente', title: '', text: '', cls: 'bad', stars: 0, ach: [], rescued: 0, draw: () => {} };
  const nameOf = m => m.isPlayer ? 'você' : m.name;
  switch (kind) {
    case 'outside':
    case 'trapped': {
      E.title = kind === 'trapped' ? 'PRESO NA LOJA' : 'LADO ERRADO DA PORTA';
      E.text = kind === 'trapped'
        ? `A persiana da ${titleCase(extra.store || 'loja')} desceu com você do lado de dentro. No fundo da loja, alguém se levantou devagar. Sorrindo. "Que bom que você ficou."`
        : 'A porta de aço do depósito desceu. Você ficou do lado de fora. Um cliente muito simpático pôs a mão no seu ombro. "Relaxa", ele disse. E você relaxou.';
      const look = PROTAGONISTS.find(p => p.key === App.proto).look;
      E.draw = (c, W, H, t) => {
        c.fillStyle = '#16141c'; c.fillRect(0, 0, W, H); c.fillStyle = '#4a4554'; c.fillRect(0, H * .72, W, H * .28);
        c.lineWidth = 3; c.strokeStyle = OUT; rr(c, W * .3, H * .08, W * .4, H * .64, 4); paint(c, '#8b939c');
        for (let y = H * .1; y < H * .72; y += 10) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(W * .3 + 3, y, W * .4 - 6, 2); }
        c.fillStyle = '#c0392b'; c.font = '22px Bungee, sans-serif'; c.textAlign = 'center'; c.fillText(kind === 'trapped' ? 'FECHADO' : 'DEPÓSITO 3B', W / 2, H * .2);
        drawChar(c, W / 2, H * .95, 2, look, { t, expr: 'scared', sweat: true, pose: 'up' });
        [W * .12, W * .82, W * .25].forEach((x, i) => { const L = Object.values(CHARACTERS)[i * 4].look; const dx = Math.sin(t * .6 + i) * 10 + (i === 2 ? -40 : 0); drawChar(c, x + dx + (i === 1 ? -t * 6 % 60 : t * 6 % 60), H * .97, 1.9, L, { t: t + i, pose: 'reach', expr: 'smile', pale: .9, glassy: true }); });
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, W, H);
      };
      break;
    }
    case 'dead': {
      E.title = 'FIM DO EXPEDIENTE';
      E.text = `Você não resistiu ao dia ${G.day}. O LockShop Center agradece seus anos de serviço com um vale-compras de R$ 15, válido apenas na praça de alimentação.`;
      E.draw = (c, W, H, t) => { if (Room.bg) c.drawImage(Room.bg, 0, 80, 960, 380, 0, 0, W, H); c.fillStyle = 'rgba(5,6,15,.7)'; c.fillRect(0, 0, W, H); const sw = Math.sin(t * 1.2) * .25; c.save(); c.translate(W * .45, 0); c.rotate(sw); c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 40); c.lineTo(0, 110); c.stroke(); circ(c, 0, 116, 7); paint(c, '#fff6c8'); c.restore(); };
      break;
    }
    case 'calma': {
      E.cls = 'twist'; E.kicker = 'Final: A Calma';
      E.title = 'VOCÊ SE SENTE ÓTIMO';
      E.text = `Na manhã do dia ${G.day + 1}, você acordou em paz. Abriu a porta de aço. Abraçou todo mundo. Por bastante tempo. O diário continua, numa letra muito tranquila: <i>"Tudo bem por aqui. Venham nos visitar."</i>`;
      P().fate = 'Virou um Calmo';
      const grp = G.members.filter(m => m.alive);
      E.draw = (c, W, H, t) => {
        c.fillStyle = '#e9fbe6'; c.fillRect(0, 0, W, H);
        const g = c.createRadialGradient(W / 2, H * .4, 20, W / 2, H * .4, W * .6); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#a6e3a1'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        grp.forEach((m, i) => drawChar(c, W * .2 + i * (W * .6 / Math.max(1, grp.length - 1 || 1)), H * .95, 1.8, m.look, { t: t * .4 + i, pose: 'reach', expr: 'smile', pale: .7, glassy: true }));
      };
      break;
    }
    case 'concrete': {
      E.title = 'PATRIMÔNIO HISTÓRICO';
      E.text = `Dia ${MAXDAY}. Às 6h, caminhões de concreto cercaram o LockShop Center. Vocês ouviram o barulho por horas. Ninguém pensou em bater na porta para perguntar se tinha alguém. Hoje, uma placa no local diz: <i>"Aqui jaz a Liquidação Final."</i>`;
      E.draw = (c, W, H, t) => { drawFacade(c, W, H, 0); c.fillStyle = 'rgba(120,120,120,.92)'; const k = Math.min(1, t / 4); c.fillRect(0, H * (1 - .75 * k), W, H); c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < 40; i++) c.fillRect((i * 97) % W, H * (1 - .75 * k) + (i * 53) % (H * .7), 30, 4); };
      break;
    }
    case 'car':
    case 'rescue': {
      let group = G.members.filter(m => m.alive && !m.away);
      let left = [];
      const seats = group.some(m => m.trait === 'motorista') ? 7 : 5;
      if (kind === 'car') { left = group.slice(seats); group = group.slice(0, seats); left.forEach(m => m.fate = 'Não coube no Fiat'); }
      G.members.filter(m => m.alive && m.away).forEach(m => m.fate = 'Ficou pra trás (em expedição)');
      group.forEach(m => m.fate = kind === 'car' ? 'Fugiu no Fiat' : 'Resgatado');
      const infR = group.filter(m => m.infected);
      const pre = kind === 'car'
        ? `O Fiat do Lacerda saiu do G2 cantando pneu, com ${group.length} ${group.length > 1 ? 'pessoas' : 'pessoa'}${G.dog ? ' e um cachorro no colo de alguém' : ''}.${left.length ? ` Não couberam: ${left.map(m => m.name).join(', ')}. Vocês acenaram.` : ''} `
        : `Dia ${G.day}, 6h. O helicóptero pousou no telhado. `;
      if (infR.length) {
        E.cls = 'twist'; E.kicker = 'Final: Contaminação'; E.id = kind === 'car' ? 'car_twist' : 'heli_twist';
        E.title = kind === 'car' ? 'A CALMA PEGOU CARONA' : 'A CALMA DECOLOU';
        E.text = pre + `Vinte minutos depois, ${nameOf(infR[0])} começou a cantarolar. ${kind === 'car' ? 'Na estrada, o rádio tocava bossa nova. Ninguém desligou.' : 'A Calma chegou à base militar antes do almoço.'}`;
        E.draw = (c, W, H, t) => {
          sky(c, W, H, '#123d2a', '#7fd18a'); skyline(c, W, H * .85, '#0c2418');
          if (kind === 'car') { car(c, ((t * 80) % (W + 200)) - 100, H * .86, 1.6, '#e0e0e0'); drawItem(c, 'infect', ((t * 80) % (W + 200)) - 100 + 10, H * .86 - 62, 26); }
          else heli(c, W * .5 + Math.sin(t) * 40, H * .4 - t * 6 % 80, 1.6, t, true);
        };
      } else {
        const cureBonus = has('soro') || (G.stats.cured || 0) > 0;
        E.cls = 'good'; E.kicker = kind === 'car' ? 'Final: Estrada' : 'Final: Resgate';
        E.id = cureBonus ? 'cure' : kind; E.rescued = group.length;
        if (group.length === 1 && G.seen.length >= 2) {
          E.id = 'sozinho'; E.kicker = 'Final: Solidão'; E.title = 'ÚLTIMO CLIENTE'; E.ach.push('lonely');
          E.text = pre + `Só você. De todos que passaram por aquela porta, ${G.seen.length} pessoas, só você saiu. O piloto perguntou se faltava alguém. Você demorou para responder. Lá embaixo, o letreiro piscava: OBRIGADO PELA PREFERÊNCIA.`;
        }
        E.ach.push(kind === 'car' ? 'road' : 'helicopter');
        if (!G.members.some(m => m.fate === 'Morreu') && !G.seen.some(m => m.fate === 'Morreu')) E.ach.push('nobody');
        E.title = cureBonus ? 'A CURA NA MOCHILA' : (kind === 'car' ? 'PÉ NA ESTRADA' : 'SAÍDA PELO TELHADO');
        E.stars = clamp(group.length + (G.dog ? 1 : 0) + (cureBonus ? 1 : 0), 1, 5);
        E.text = pre + (kind === 'car'
          ? 'Lá atrás, o letreiro do shopping piscava LIQUIDAÇÃO FINAL. O tanque dava até a próxima cidade. O resto, vocês resolvem depois.'
          : `${group.length} ${group.length > 1 ? 'sobreviventes subiram' : 'sobrevivente subiu'}${G.dog ? ', mais um cachorro caramelo que se recusou a ficar' : ''}. Lá embaixo, o letreiro piscava: LIQUIDAÇÃO FINAL. Ninguém olhou para trás. Quase ninguém.`)
          + (cureBonus ? ' Na mochila, o soro brilhava. Os militares disseram que vão estudar. Pela primeira vez em dias, isso soou como esperança.' : '');
        E.draw = (c, W, H, t) => {
          sky(c, W, H, '#2b2d5c', '#ff9e6d');
          c.fillStyle = '#ffd27a'; circ(c, W * .8, H * .75, 50); c.fill();
          skyline(c, W, H * .8, '#2a1f3a');
          if (kind === 'car') {
            c.fillStyle = '#333'; c.fillRect(0, H * .82, W, H * .18); c.fillStyle = '#ffd23f'; for (let x = -((t * 300) % 80); x < W; x += 80) c.fillRect(x, H * .9, 40, 5);
            car(c, W * .45, H * .9, 1.8, '#c0392b');
          } else {
            c.fillStyle = '#3a3a44'; c.fillRect(0, H * .8, W, H * .2);
            c.strokeStyle = '#ffd23f'; c.lineWidth = 6; circ(c, W * .72, H * .9, 48); c.stroke();
            c.fillStyle = '#ffd23f'; c.font = '50px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', W * .72, H * .91);
            heli(c, W * .66, H * .5 + Math.sin(t * 2) * 6, 1.5, t, false);
            survivorsGroup(group, c, W * .08, H * .98, 1.1, t);
          }
          if (cureBonus) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W * .12, H * .2, 60, '#3fe0c5', .5); c.restore(); drawItem(c, 'soro', W * .12, H * .2, 50); }
        };
      }
      break;
    }
    case 'live': {
      const group = G.members.filter(m => m.alive && !m.away);
      const inf = group.filter(m => m.infected);
      group.forEach(m => m.fate = 'Resgatado pelos fãs');
      E.kicker = 'Final: Ao vivo'; E.title = 'VIRALIZOU'; E.ach.push('viral'); E.rescued = group.length;
      E.text = `A live do Ricardinho bateu 2,3 milhões de espectadores em quarenta minutos. Título: <i>"PRESO NO SHOPPING DOS ZUMBI CALMOS (NÃO CLICKBAIT)"</i>. Às 6h, um helicóptero de emissora de TV pousou no telhado, por audiência. ${group.length} pessoas embarcaram ao vivo, para o Brasil inteiro. `;
      if (inf.length) { E.cls = 'twist'; E.text += `No meio da entrevista, ${nameOf(inf[0])} abraçou a repórter. Por muito tempo. Ao vivo. A audiência foi recorde.`; }
      else { E.cls = 'good'; E.stars = clamp(group.length + 1, 1, 5); E.text += 'O Ricardinho ganhou 800 mil seguidores e um processo da Serenitá. Disse que valeu a pena.'; }
      E.draw = (c, W, H, t) => {
        c.fillStyle = '#0d0c14'; c.fillRect(0, 0, W, H);
        rr(c, W * .2, H * .06, W * .6, H * .82, 24); paint(c, '#111');
        c.save(); rr(c, W * .23, H * .1, W * .54, H * .74, 14); c.clip();
        sky(c, W, H, '#2b2d5c', '#ff9e6d'); heli(c, W * .5, H * .3 + Math.sin(t * 2) * 6, 1.1, t, inf.length > 0);
        group.slice(0, 5).forEach((m, i) => drawChar(c, W * .3 + i * W * .1, H * .82, 1.3, m.look, { t: t + i, pose: 'up', expr: 'grin' }));
        c.fillStyle = '#e53935'; rr(c, W * .25, H * .12, 70, 26, 6); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 15px Inter, sans-serif'; c.textAlign = 'left'; c.fillText('AO VIVO', W * .25 + 10, H * .12 + 18);
        c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, W * .25 + 80, H * .12, 130, 26, 6); c.fill(); c.fillStyle = '#fff'; c.fillText(`${(1.2 + t * .27).toFixed(1)} mi vendo`, W * .25 + 92, H * .12 + 18);
        for (let i = 0; i < 6; i++) { const y = H * .78 - ((t * 60 + i * 50) % 260); c.globalAlpha = .9; drawItem(c, 'heart', W * .72 + Math.sin(i + t) * 12, y, 28); } c.globalAlpha = 1;
        c.restore();
      };
      break;
    }
    case 'gerente': {
      const group = G.members.filter(m => m.alive && !m.away);
      group.forEach(m => m.fate = 'Fundou a LockShop Resistência');
      const inf = group.filter(m => m.infected);
      E.kicker = 'Final: Fortaleza'; E.title = 'GERENTE DO MÊS'; E.ach.push('manager'); E.rescued = group.length;
      E.text = `Dia ${MAXDAY}. Os caminhões de concreto lacraram as entradas do shopping. Mas vocês tinham comida, barricada e ${group.length} pessoas teimosas. Em um mês, o depósito 3B virou a <b>LockShop Resistência</b>: horta na praça de alimentação, rádio pirata, truco às sextas. Você foi eleito gerente do mês. Todos os meses. `;
      if (inf.length) { E.cls = 'twist'; E.text += `Na reunião de inauguração, ${nameOf(inf[0])} sugeriu um novo slogan: <i>"Aqui todo mundo fica calmo"</i>. Ninguém achou estranho a tempo.`; }
      else { E.cls = 'good'; E.stars = clamp(group.length, 1, 5); E.text += 'Às vezes alguém bate na porta. Educadamente. Vocês têm um protocolo pra isso agora.'; }
      E.draw = (c, W, H, t) => {
        if (Room.bg) { const s = Math.max(W / 960, H / 540); c.drawImage(Room.bg, (W - 960 * s) / 2, (H - 540 * s) / 2, 960 * s, 540 * s); }
        c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W / 2, H * .3, 400, '#ffd27a', .18); c.restore();
        c.save(); c.translate(W / 2, H * .14); c.rotate(-.03); rr(c, -200, -26, 400, 52, 6); paint(c, '#c0392b'); c.fillStyle = '#ffe14d'; c.font = '24px Bungee, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LOCKSHOP RESISTÊNCIA', 0, 2); c.restore();
        group.slice(0, 7).forEach((m, i) => drawChar(c, W * .14 + i * W * .12, H * .95, 1.7, m.look, { t: t + i, pose: i % 2 ? 'up' : 'idle', expr: 'grin' }));
      };
      break;
    }
    case 'dutos': {
      const me = P();
      const rest = G.members.filter(m => m.alive && !m.away && !m.isPlayer).sort((a, b) => (b.health - a.health) || (a.stress - b.stress));
      const group = [me, ...rest.slice(0, 2)], left = rest.slice(2);
      group.forEach(m => m.fate = 'Fugiu pelos dutos'); left.forEach(m => m.fate = 'Ficou no depósito (não coube no duto)');
      G.members.filter(m => m.alive && m.away).forEach(m => m.fate = 'Ficou pra trás (em expedição)');
      const inf = group.filter(m => m.infected);
      E.kicker = 'Final: Dutos'; E.title = 'RATO DE DUTO'; E.ach.push('vents'); E.rescued = group.length;
      E.text = `Quarenta minutos rastejando por dutos de alumínio, ${group.length > 1 ? 'em fila, ' : ''}com o cheiro de fritura da praça subindo pelas grades. Depois, a escada de serviço, a galeria de esgoto e, finalmente, uma tampa de bueiro na avenida.${G.dog ? ' O Caramelo foi na frente o caminho todo.' : ''}${left.length ? ` Ficaram no depósito: ${left.map(m => m.name).join(', ')}. Vocês prometeram voltar.` : ''} `;
      if (inf.length) { E.cls = 'twist'; E.text += `Na rua, ao sol, ${nameOf(inf[0])} respirou fundo e sorriu. Largo demais.`; }
      else { E.cls = 'good'; E.stars = clamp(group.length + (G.dog ? 1 : 0) + 1, 1, 5); E.text += 'A cidade estava estranhamente quieta. Mas vocês estavam do lado de fora, e isso já era muito.'; }
      E.draw = (c, W, H, t) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1c2420'); g.addColorStop(1, '#0b0f0d'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#2c3a33'; c.beginPath(); c.ellipse(W / 2, H * .55, W * .62, H * .7, 0, Math.PI, 0); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W * .88, H * .45, 160, '#fff1c2', .5); c.restore();
        c.fillStyle = '#38524a'; c.fillRect(0, H * .82, W, H * .18);
        c.fillStyle = 'rgba(140,200,180,.25)'; for (let x = -((t * 40) % 60); x < W; x += 60) c.fillRect(x, H * .86, 30, 3);
        group.forEach((m, i) => drawChar(c, W * .18 + i * 110 + ((t * 30) % 20), H * .84, 1.5, m.look, { t: t * 2 + i, pose: 'walk', expr: inf.includes(m) && i === group.length - 1 ? 'smile' : 'scared', flip: false }));
        if (G.dog) drawDog(c, W * .18 + group.length * 110 + 30, H * .86, .9, { t, walk: true, happy: true });
        const rx = (t * 90) % (W + 100) - 50; c.fillStyle = '#555'; ell(c, W - rx, H * .9, 9, 5); c.fill();
      };
      break;
    }
    case 'beber': {
      const me = P(); me.infected = true; me.fate = 'Bebeu a Serenitá';
      E.cls = 'twist'; E.kicker = 'Final: Obediência'; E.title = 'BEBA A CALMA'; E.ach.push('slogan');
      E.text = `Você esperou todo mundo dormir. Abriu o copinho. Era doce, gelado, com gosto de pudim. Em dez minutos, a ansiedade dos últimos ${G.day} dias foi embora. Toda. Você nunca entendeu por que estava com tanto medo. Às 3h, você abriu a porta de aço. Ninguém estava lá fora te esperando. Estavam todos ali, sorrindo, de braços abertos. <i>A Serenitá agradece a sua preferência.</i>`;
      G.members.filter(m => m.alive && !m.isPlayer).forEach(m => { m.fate = 'Ganhou um abraço'; });
      E.draw = (c, W, H, t) => {
        const k = Math.min(1, t / 5);
        c.fillStyle = mix('#1a1622', '#bfe8b0', k); c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, W / 2, H * .55, 300, '#9dff8a', .15 + k * .3); c.restore();
        drawChar(c, W / 2, H * .97, 2.6, me.look, { t, expr: k > .4 ? 'smile' : 'normal', pale: k * .7, glassy: k > .7, pose: k > .8 ? 'reach' : 'idle' });
        if (k < .8) drawItem(c, 'amostra', W / 2 + 46, H * .97 - 130, 50);
        for (let i = 0; i < 4; i++) { const x = (i < 2 ? W * .1 + i * 120 : W * .62 + (i - 2) * 120); drawChar(c, x, H * .97, 1.8, Object.values(CHARACTERS)[i * 3 + 1].look, { t: t * .5 + i, pose: 'reach', expr: 'smile', pale: .85, glassy: true }); }
      };
      break;
    }
  }
  return E;
}

/* =========================================================
   TÍTULO E ROTEAMENTO DE CLIQUES
   ========================================================= */
function showTitle() {
  Screen.show('title');
  Sound.stopDrone();
  const pd = Progress.data;
  $('#titleProg').textContent = `${Object.keys(pd.ach).length}/${Object.keys(ACHIEVEMENTS).length} conquistas · ${Object.keys(pd.endings).length}/${Object.keys(ENDINGS).length} finais`;
  startAnim('#titleCv', drawFacade);
}

function go(where) {
  Sound.play('click');
  closeModal();
  if (where === 'title') return showTitle();
  if (where === 'intro') return startIntro();
  if (where === 'select') return startSelect();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act],[data-go]');
  if (!b || b.disabled) return;
  Sound.init();
  if (b.dataset.go) return go(b.dataset.go);
  const a = b.dataset.act;
  const J = ['tab', 'choice', 'door', 'feed', 'med', 'feedDog', 'expWho', 'expDest', 'expGear', 'expGo', 'radio', 'barr', 'game', 'lacerda', 'craft', 'flee', 'sleep', 'dutos', 'beber', 'cards', 'tape', 'live'];
  if (a === 'setMode' || a === 'setDiff') { if (a === 'setMode') App.mode = b.dataset.k; else App.diff = b.dataset.k; Prefs.set('mode', App.mode); Prefs.set('diff', App.diff); Sound.play('click'); return renderSetup(); }
  if (a === 'cutSkip') { e.stopPropagation(); return Cut.finish(); }
  if (a === 'extras') return Extras.open(b.dataset.from);
  if (a === 'exTab') { Extras.tab = b.dataset.t; Sound.play('page'); return Extras.render(); }
  if (a === 'exBack') return Extras.from === 'end' ? Screen.show('end') : showTitle();
  if (a === 'exReset') { if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Tem certeza? Clique de novo'; return; } Prefs.set('progress', null); Progress.load(); return Extras.render(); }
  if (J.includes(a)) return onJournal(a, b);
  if (['mtool', 'msoro', 'mquar', 'mexpel', 'mcafe'].includes(a)) return onMember(a, b);
  if (['vq', 'vtool', 'vdec'].includes(a)) return onDoor(a, b);
  switch (a) {
    case 'closeModal': closeModal(); Room.peep = null; if (G && !G.over) renderJournal(); break;
    case 'introNext': introNext(); break;
    case 'introSkip': clearInterval(App.typing); App.typing = null; startSelect(); break;
    case 'pickProto': Sound.play('good'); beginRun(b.dataset.k); break;
    case 'startShelter': closeModal(); Shelter.start(App.proto, App.runRes); break;
    case 'closeDoor': tryCloseDoor(); break;
    case 'skipRun': skipRun(); break;
    case 'sprint': S.sprintToggle = !S.sprintToggle; break;
    case 'use': if (S.phase === 'play') startSearch(nearestSearchable()); break;
    case 'mute': { const m = Sound.toggleMute(); $$('.mute').forEach(x => x.classList.toggle('off', m)); break; }
  }
});
$('#cv').addEventListener('pointerdown', scavPointer);
$('#room').addEventListener('click', roomClick);
$('#room').addEventListener('pointermove', roomMove);
$('#introCv').addEventListener('click', introNext);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && $('#modalCard').classList.contains('member')) { closeModal(); renderJournal(); } });
addEventListener('keydown', e => {
  if (Screen.cur === 'intro' && (e.code === 'Space' || e.code === 'Enter')) { e.preventDefault(); introNext(); }
  if (e.code === 'Escape' && modalOpen() && $('#modalCard').classList.contains('member')) { closeModal(); renderJournal(); }
});
$$('.mute').forEach(x => x.classList.toggle('off', Sound.muted));

(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => showTitle());
