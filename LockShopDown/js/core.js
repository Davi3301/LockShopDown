'use strict';
/* =========================================================
   LOCKSHOPDOWN — núcleo: utilidades, telas, modal, som
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const rndf = (a, b) => a + Math.random() * (b - a);
const chance = p => Math.random() < p;
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const tpl = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => (o[k] !== undefined ? o[k] : ''));

/* gerador pseudo-aleatório com semente (para detalhes visuais estáveis) */
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

const Prefs = {
  get(k, d) { try { const v = localStorage.getItem('lsd_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lsd_' + k, JSON.stringify(v)); } catch (e) { /* sem storage */ } },
};

/* ---------------- telas e modal ---------------- */
const Screen = {
  cur: 'title',
  show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + id));
    this.cur = id;
    window.scrollTo(0, 0);
  },
};
function openModal(html, cls = '') {
  const card = $('#modalCard');
  const was = $('#modal').classList.contains('open');
  const scroll = card.scrollTop;
  card.className = 'modal-card ' + cls + (was ? ' still' : '');
  card.innerHTML = html;
  if (was) card.scrollTop = scroll;
  $('#modal').classList.add('open');
}
function closeModal() { $('#modal').classList.remove('open'); }
const modalOpen = () => $('#modal').classList.contains('open');

/* ---------------- som (tudo sintetizado) ---------------- */
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [[48, 52, 55, 59], [45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53]];

const Sound = {
  ctx: null, master: null, music: null, filter: null, sfxBus: null, noiseBuf: null,
  muted: Prefs.get('muted', false),
  muzakOn: false, step: 0, nextT: 0, timer: null, detune: 0, drone: null,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass'; this.filter.frequency.value = 9000;
      this.music = this.ctx.createGain(); this.music.gain.value = 0.9;
      this.music.connect(this.filter); this.filter.connect(this.master);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 1; this.sfxBus.connect(this.master);
      const len = this.ctx.sampleRate * 1.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  toggleMute() {
    this.muted = !this.muted; Prefs.set('muted', this.muted);
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    return this.muted;
  },
  tone(freq, dur = 0.1, type = 'square', vol = 0.05, delay = 0, slideTo = null, bus = null) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur = 0.2, vol = 0.1, freq = 1200, delay = 0, q = 0.8, type = 'bandpass') {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'click': this.tone(660, .04, 'triangle', .04); break;
      case 'page': this.noise(.18, .06, 3000, 0, .5, 'highpass'); break;
      case 'step': this.noise(.05, .025, 500 + Math.random() * 200, 0, 1.5); break;
      case 'pick': this.tone(740, .06, 'square', .035); this.tone(1100, .08, 'square', .03, .05); break;
      case 'search': this.noise(.12, .05, 2200, 0, 1); this.noise(.1, .04, 1600, .12, 1); break;
      case 'found': this.tone(880, .08, 'triangle', .05); this.tone(1320, .14, 'triangle', .05, .07); break;
      case 'empty': this.tone(300, .12, 'triangle', .04, 0, 220); break;
      case 'deposit': [523, 659, 784].forEach((f, i) => this.tone(f, .14, 'triangle', .05, i * .07)); break;
      case 'hug': this.tone(90, .35, 'sawtooth', .08, 0, 50); this.tone(900, .5, 'sine', .03, .1, 400); this.tone(800, .5, 'sine', .025, .25, 350); break;
      case 'chime': this.tone(784, .5, 'sine', .06); this.tone(622, .7, 'sine', .06, .35); break;
      case 'alarm': this.tone(880, .15, 'square', .04); this.tone(660, .15, 'square', .04, .17); break;
      case 'shutter': this.noise(1.6, .12, 180, 0, .7, 'lowpass'); this.tone(70, 1.4, 'sawtooth', .03, 0, 50); break;
      case 'slam': this.noise(.7, .35, 120, 0, .6, 'lowpass'); this.tone(48, .8, 'square', .08, 0, 30); break;
      case 'knock': [0, .2, .4].forEach(d => { this.noise(.09, .35, 260, d, 2); this.tone(85, .09, 'sine', .2, d); }); break;
      case 'good': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, .2, 'triangle', .045, i * .08)); break;
      case 'bad': this.tone(220, .35, 'sawtooth', .05, 0, 160); this.tone(165, .5, 'sawtooth', .05, .25, 110); break;
      case 'radio': this.noise(.8, .08, 2500, 0, .3); break;
      case 'growl': this.noise(.6, .12, 160, 0, 6); this.tone(70, .6, 'sawtooth', .04); break;
      case 'bark': this.tone(500, .07, 'square', .06, 0, 300); this.tone(480, .09, 'square', .06, .15, 280); break;
      case 'heart': this.tone(60, .12, 'sine', .25); this.tone(55, .14, 'sine', .2, .18); break;
      case 'giggle': [0, .09, .18, .27].forEach((d, i) => this.tone(1000 - i * 60, .07, 'sine', .025, d)); break;
      case 'freeze': this.noise(.6, .05, 6000, 0, .3, 'highpass'); break;
      case 'type': this.tone(1800 + Math.random() * 300, .015, 'square', .012); break;
    }
  },

  /* ---- muzak de shopping (bossa de elevador que vai desafinando) ---- */
  startMuzak(muffled = false) {
    this.init(); if (!this.ctx) return;
    this.setMuffled(muffled);
    if (this.muzakOn) return;
    this.muzakOn = true; this.step = 0; this.nextT = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this._sched(), 50);
  },
  stopMuzak() { this.muzakOn = false; clearInterval(this.timer); this.timer = null; },
  setMuffled(m) { if (this.filter) this.filter.frequency.setTargetAtTime(m ? 520 : 9000, this.ctx.currentTime, .3); if (this.music) this.music.gain.setTargetAtTime(m ? 0.6 : 0.9, this.ctx.currentTime, .3); },
  _sched() {
    if (!this.ctx) return;
    while (this.nextT < this.ctx.currentTime + 0.25) { this._step(this.step, this.nextT); this.nextT += 0.23; this.step++; }
  },
  _step(st, t) {
    const bar = Math.floor(st / 16) % 4, beat = st % 16, ch = CHORDS[bar];
    const det = () => (Math.random() * 2 - 1) * this.detune;
    if (beat === 0 || beat === 10) this._note(NOTE(ch[0] - 12), t, .5, 'triangle', .05, det());
    if (beat === 6 || beat === 14) this._note(NOTE(ch[2] - 12), t, .3, 'triangle', .04, det());
    if ([3, 6, 10, 13].includes(beat)) ch.slice(1).forEach(n => this._note(NOTE(n + 12), t, .16, 'sine', .016, det()));
    if (beat % 2 === 0 && Math.random() < .3) this._note(NOTE(pick([72, 74, 76, 79, 81, 83])), t, .35, 'sine', .022, det());
  },
  _note(f, t, dur, type, vol, d) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f; o.detune.value = d;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.music);
    o.start(t); o.stop(t + dur + .05);
  },

  /* ---- drone noturno ---- */
  startDrone() {
    this.init(); if (!this.ctx || this.drone) return;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 1.5);
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sine'; o2.type = 'sine'; o1.frequency.value = 55; o2.frequency.value = 55.7;
    o1.connect(g); o2.connect(g); g.connect(this.master);
    o1.start(); o2.start();
    this.drone = { g, o1, o2 };
  },
  stopDrone() {
    if (!this.drone) return;
    const { g, o1, o2 } = this.drone, t = this.ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    o1.stop(t + 1.1); o2.stop(t + 1.1);
    this.drone = null;
  },
};

/* o primeiro gesto do usuário libera o áudio */
addEventListener('pointerdown', () => Sound.init(), { once: false, passive: true });
addEventListener('keydown', () => Sound.init(), { passive: true });
