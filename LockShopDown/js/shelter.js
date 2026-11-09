'use strict';
/* =========================================================
   LOCKSHOPDOWN — FASE 2: o depósito
   Cena ilustrada (canvas) + diário (HTML) + mecânicas
   ========================================================= */

let G = null;
let MUID = 1;
const WEEK = ['Sexta', 'Sábado', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta'];

/* ---------------- helpers usados pelos eventos ---------------- */
const P = () => G.members.find(m => m.isPlayer);
const home = () => G.members.filter(m => m.alive && !m.away && !m.quar);
const others = () => home().filter(m => !m.isPlayer);
const pickOther = () => { const o = others(); return o.length ? pick(o) : null; };
const pickAny = () => pick(home());
const has = (k, n = 1) => (G.inv[k] || 0) >= n;
const give = (k, n = 1) => { G.inv[k] = ITEMS[k].u ? 1 : (G.inv[k] || 0) + n; };
const take = (k, n = 1) => { G.inv[k] = Math.max(0, (G.inv[k] || 0) - n); };
function hurt(m, n = 1) { if (m) m.health -= n; }
function injure(m) { if (!m) return; m.injured = true; m.injT = 0; m.health -= 1; }
function sicken(m) { if (m) m.sick = true; }
function infect(m) { if (m && !m.infected) { m.infected = true; m.stage = 0; m.turnAt = rnd(5, 7); } }
function addStress(m, n) { if (m) m.stress = clamp(m.stress + n * (m.trait === 'zen' && n > 0 ? .6 : 1), 0, 100); }
function stressAll(n) { home().forEach(m => addStress(m, n)); }
function addFact(id, text) { if (!G.facts.find(f => f.id === id)) G.facts.push({ id, text, day: G.day }); }
function addNote(id) { Progress.note(id); if (!G.notes.includes(id)) { G.notes.push(id); if (G.notes.length >= 6) Progress.unlock('archivist'); return true; } return false; }
function queueVisitor(key, note) { G.visitorQueue.push(makeVisitor(key, note)); }
function quarantine(m) { m.quar = 2; m.quarNights = 0; m.blanket = false; if (has('cobertor')) { take('cobertor'); m.blanket = true; } }
function suspect(m, text) { (G.susp[m.name] = G.susp[m.name] || []).push(`Dia ${G.day}: ${text}`); }

function makeMember(key, infected, extra = {}) {
  const c = CHARACTERS[key] || extra;
  return Object.assign({
    id: MUID++, key, name: c.name, look: c.look, bio: c.bio, trait: c.trait || null, isPlayer: false,
    alive: true, hunger: 0, thirst: 0, health: 4, injured: false, injT: 0, sick: false, stress: rnd(10, 25),
    infected: !!infected, stage: infected ? 1 : 0, turnAt: rnd(5, 7),
    away: 0, dest: null, gear: {}, quar: 0, quarNights: 0, blanket: false,
    fed: false, drank: false, med: false, used: {}, log: [], talked: false, fate: null, stealIn: c.trait === 'ladrao' ? 3 : 0, joined: G ? G.day : 1,
  }, extra);
}

/* =========================================================
   INÍCIO
   ========================================================= */
const Shelter = {
  start(proto, res) {
    const pr = PROTAGONISTS.find(p => p.key === proto);
    G = {
      proto, day: 1, inv: {}, members: [], dog: null, barricade: D().startBar, diff: App.diff || 'normal', mode: App.mode || 'classico', flags: {}, facts: [], notes: [], seen: [], susp: {},
      feedback: [], visitorQueue: [], rescueDay: null, carReady: false, usedEvents: new Set(), today: null, report: [],
      stats: { letIn: 0, refused: 0, exped: 0, hugs: res.hugs || 0 }, pool: [], over: false, tab: 'diario', talks: 2,
    };
    INV_ORDER.forEach(k => G.inv[k] = 0);
    Object.entries(res.stash).forEach(([k, n]) => { G.inv[k] = ITEMS[k].u ? 1 : (G.inv[k] || 0) + n; });
    if (proto === 'dani') G.inv.lanterna = 1;
    const me = makeMember(null, res.playerInfected, { name: pr.name, look: pr.look, bio: pr.role, trait: null, isPlayer: true, stress: 20 });
    if (res.playerInfected) { me.stage = 0; me.turnAt = rnd(6, 8); }
    G.members.push(me);
    res.saved.forEach(s => { const m = makeMember(s.key, s.infected); G.members.push(m); G.seen.push(m); });
    if (res.dog) G.dog = { hunger: 0, fed: false, watch: null };
    res.notes.forEach(addNote);
    const used = new Set(res.saved.map(s => s.key).concat(S.cast || []));
    G.pool = shuffle(REGULARS.filter(k => !used.has(k)));
    addFact('cinema', CLOSED_PLACES.cinema.fact);
    const n = G.members.length;
    G.report = [
      '21h50. A porta de aço desceu com um estrondo. Do lado de fora, alguém bateu educadamente por 40 minutos. Depois parou.',
      n > 1 ? `Vocês são ${n}${G.dog ? ', mais o Caramelo' : ''}. Pelo menos por enquanto.` : `Só você${G.dog ? ' e o Caramelo' : ''}. E o silêncio.`,
      'Lembre: quem pegou A Calma não sabe. Ou não admite.',
    ];
    if (G.notes.length) G.report.push(`Você trouxe ${G.notes.length} documento(s) do shopping. Estão no Arquivo.`);
    prepareDay();
    G.tab = 'diario';
    Room.night = null; Room.peep = null; Room.msgT = 0;
    Screen.show('shelter');
    Sound.startMuzak(true); Sound.detune = 25;
    renderJournal();
    Room.start();
  },
};

/* =========================================================
   DIA
   ========================================================= */
function pickEvent() {
  const ok = e => !e.story && !G.usedEvents.has(e.id) && (!e.cond || e.cond()) && (!e.min || G.day >= e.min) && (!e.max || G.day <= e.max);
  let pool = EVENTS.filter(ok);
  if (!pool.length) { G.usedEvents = new Set(); pool = EVENTS.filter(ok); }
  if (!pool.length) return null;
  const e = pick(pool); G.usedEvents.add(e.id); return e;
}

function makeVisitor(key, note) {
  const c = CHARACTERS[key];
  let p = .4;
  if (key === 'helena') p = .25; if (key === 'enzo') p = .3; if (key === 'wagner') p = .55;
  if (key === 'valeria') p = 1;
  const inf = chance(Math.min(.9, p * D().inf)), stage = inf ? rnd(1, 3) : 0;
  const signs = {};
  if (inf) {
    if (stage >= 2 && chance(.7)) signs.pale = true;
    if (chance(.4)) signs.sweat = true;
    if (stage >= 2 && chance(.35)) signs.smile = true;
    if (chance(.35)) signs.bandage = true;
    if (stage >= 3 && chance(.4)) signs.glassy = true;
  } else {
    if (chance(.4)) signs.sweat = true;
    if (chance(.12)) signs.bandage = true;
    if (chance(.12)) signs.pale = true;
    if (chance(.15)) signs.scratch = true;
  }
  const v = { key, c, infected: inf, stage, signs, note: note || null, asked: {}, log: [], used: {}, masked: !!c.mascot };
  if (key === 'valeria' && G && home().some(m => m.key === 'enzo')) v.intro = 'Enzo? Filho? É a mamãe. Eu ouvi sua voz. Abre pra mamãe te dar um abraço. Um abraço bem demorado.';
  return v;
}

function prepareDay() {
  const t = G.today = { event: null, ctx: {}, eventDone: true, eventText: '', eventResult: '', visitor: null, doorDone: true, doorResult: '', radioUsed: false, radioResult: '', gameUsed: false, expSent: false, expSel: { who: null, dest: null, mask: false, marreta: false, lanterna: false }, crafted: false };
  G.talks = 2; G.flags.beberConfirm = false;
  G.members.forEach(m => { m.fed = false; m.drank = false; m.med = false; m.used = {}; m.log = []; m.talked = false; });
  if (G.dog) {
    G.dog.fed = false;
    const sus = others().filter(m => m.infected && m.stage >= 2);
    G.dog.watch = sus.length && chance(.6) ? pick(sus).id : null;
  }
  const story = EVENTS.find(e => e.story === G.day);
  const ev = story || (G.day >= 2 && chance(.8) ? pickEvent() : null);
  if (ev) { t.event = ev; t.eventText = ev.text(t.ctx); t.eventDone = false; if (CUTS['ev_' + ev.id]) t.introCut = 'ev_' + ev.id; }
  let v = null;
  const sv = STORY_VISITORS[G.day];
  if (sv && !G.flags['v_' + sv]) { G.flags['v_' + sv] = true; v = makeVisitor(sv); }
  else if (G.visitorQueue.length) v = G.visitorQueue.shift();
  else if (G.day >= 2 && G.pool.length && (G.day === 2 || chance(.5))) v = makeVisitor(G.pool.shift());
  if (v) { t.visitor = v; t.doorDone = false; }
}

/* =========================================================
   DIÁRIO (HTML)
   ========================================================= */
const TABS = [['diario', 'Diário'], ['racao', 'Ração'], ['exped', 'Expedição'], ['base', 'Base'], ['arquivo', 'Arquivo']];

function hearts(m) { let h = ''; for (let i = 0; i < 4; i++) h += icon(i < m.health ? 'heart' : 'heart0', 15); return `<span class="hearts">${h}</span>`; }
function stressBar(m) { const c = m.stress >= 75 ? 'hi' : m.stress >= 45 ? 'mid' : ''; return `<span class="sbar ${c}" title="Estresse ${Math.round(m.stress)}"><i style="width:${m.stress}%"></i></span>`; }
function chips(m) {
  const c = [];
  if (m.away) c.push(`<i class="chip blue">Em expedição · volta dia ${G.day + m.away}</i>`);
  if (m.quar) c.push(`<i class="chip ice">Câmara fria · ${m.quar} noite(s)</i>`);
  if (!m.away && !m.quar) {
    if (m.thirst >= 2) c.push(`<i class="chip ${m.thirst >= 3 ? 'red' : 'orange'}">${m.thirst} dias sem água</i>`);
    if (m.hunger >= 2) c.push(`<i class="chip ${m.hunger >= 4 ? 'red' : 'orange'}">${m.hunger} dias sem comer</i>`);
  }
  if (m.injured) c.push('<i class="chip red">Ferido</i>');
  if (m.sick) c.push('<i class="chip green">Doente</i>');
  if (m.stress >= 75) c.push('<i class="chip purple">Em pânico</i>');
  if (m.trait) c.push(`<i class="chip" title="${TRAITS[m.trait].d}">${TRAITS[m.trait].n}</i>`);
  return c.join('');
}
function portrait(m, size = 44, extra = '') { return `<canvas class="pt ${extra}" data-mid="${m.id}" width="${size}" height="${size}" style="width:${size}px;height:${size}px"></canvas>`; }
function paintAllPortraits(root = document) {
  $$('canvas.pt[data-mid]', root).forEach(cv => { const m = G.members.find(x => x.id === +cv.dataset.mid); if (m) paintPortrait(cv, m.look, memberVisual(m, 0, true)); });
}

function renderTabs() {
  const t = G.today;
  const alert = { diario: !t.eventDone || !t.doorDone, racao: home().some(m => (m.thirst >= 2 && !m.drank) || (m.hunger >= 3 && !m.fed)), exped: false, base: false, arquivo: false };
  $('#jTabs').innerHTML = TABS.map(([id, n]) => `<button class="jtab ${G.tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}">${n}${alert[id] ? '<i class="dot"></i>' : ''}</button>`).join('');
}

function renderJournal() {
  if (!G || G.over) return;
  renderTabs();
  const t = G.today; let h = '';
  if (G.tab === 'diario') h = pageDiario();
  if (G.tab === 'racao') h = pageRacao();
  if (G.tab === 'exped') h = pageExped();
  if (G.tab === 'base') h = pageBase();
  if (G.tab === 'arquivo') h = pageArquivo();
  const page = $('#jPage'); page.innerHTML = h; paintAllPortraits(page);
  const can = t.eventDone && t.doorDone;
  const sb = $('#btnSleep');
  sb.disabled = !can;
  sb.innerHTML = can ? 'Dormir · encerrar o dia' : (!t.eventDone ? 'Resolva a ocorrência primeiro' : 'Atenda a porta primeiro');
  $('#hudDay').textContent = `Dia ${G.day}`;
  $('#hudWeek').textContent = WEEK[(G.day - 1) % 7];
  $('#hudRescue').innerHTML = G.rescueDay ? `Resgate: dia ${G.rescueDay}` : (G.flags.ultimato ? `Prazo final: dia ${MAXDAY}` : '');
}

function pageDiario() {
  const t = G.today;
  let h = `<h2 class="j-h">Dia ${G.day} <small>${WEEK[(G.day - 1) % 7]}</small></h2>`;
  h += `<ul class="j-report">${G.report.map(l => `<li>${l}</li>`).join('')}</ul>`;
  if (G.day === 1) h += `<div class="sticky">Dica: dê água a cada 2 dias e comida a cada 3. Clique nas pessoas da cena para examinar ou conversar. Quem tem A Calma piora à noite, e às vezes dá pra ver no rosto. A câmara fria está trancada com um cadeado velho... e dá pra ouvir alguma coisa lá dentro.</div>`;
  if (t.event) {
    h += '<h3 class="j-sub">Ocorrência</h3>';
    h += `<p class="j-ev">${t.eventText}</p>`;
    if (t.eventDone) h += `<p class="j-res">${t.eventResult}</p>`;
    else h += '<div class="j-choices">' + t.event.choices.map((c, i) => {
      const ok = !c.c || c.c(t.ctx);
      const label = typeof c.l === 'function' ? c.l(t.ctx) : c.l;
      return `<button class="j-choice" data-act="choice" data-i="${i}" ${ok ? '' : 'disabled'}><span class="box"></span>${label}${!ok && c.req ? ` <em>(precisa: ${c.req})</em>` : ''}</button>`;
    }).join('') + '</div>';
  }
  if (t.visitor) {
    h += '<h3 class="j-sub">A porta</h3>';
    if (t.doorDone) h += `<p class="j-res">${t.doorResult}</p>`;
    else h += `<p class="j-ev knock">Toc. Toc. Toc.</p><p class="j-ev">Alguém está batendo na porta de aço.</p><button class="btn ink" data-act="door">Espiar pelo olho mágico</button>`;
  }
  if (!t.event && !t.visitor && G.day > 1) h += '<p class="j-ev muted">Nada aconteceu hoje. O que, aqui, é uma notícia excelente.</p>';
  return h;
}

function pageRacao() {
  let h = '<h2 class="j-h">Ração</h2>';
  h += `<div class="j-stock">${['comida', 'agua', 'remedio'].map(k => `<span class="stk">${icon(k, 26)}<b>${G.inv[k]}</b><small>${ITEMS[k].short}</small></span>`).join('')}</div>`;
  h += '<div class="j-rows">';
  G.members.filter(m => m.alive).forEach(m => {
    const at = !m.away && !m.quar;
    const fb = (flag, k) => `<button class="rbtn ${m[flag] ? 'on' : ''}" data-act="feed" data-flag="${flag}" data-id="${m.id}" ${!m[flag] && !has(k) ? 'disabled' : ''} title="${ITEMS[k].short}">${icon(k, 22)}</button>`;
    h += `<div class="rrow ${at ? '' : 'away'}">${portrait(m, 46)}
      <div class="rinfo"><b>${m.name}${m.isPlayer ? ' <small>(você)</small>' : ''}</b><div>${hearts(m)} ${stressBar(m)}</div><div class="chips">${chips(m)}</div></div>
      ${at ? `<div class="rbtns">${fb('fed', 'comida')}${fb('drank', 'agua')}${(m.injured || m.sick || m.health < 4) ? `<button class="rbtn ${m.med ? 'on' : ''}" data-act="med" data-id="${m.id}" ${!m.med && !has('remedio') ? 'disabled' : ''} title="Remédio">${icon('remedio', 22)}</button>` : ''}</div>` : ''}
    </div>`;
  });
  if (G.dog) {
    h += `<div class="rrow"><span class="dogpt">${icon('dog', 44)}</span><div class="rinfo"><b>Caramelo</b><div class="chips">${G.dog.hunger >= 3 ? '<i class="chip red">Faminto, pensando em ir embora</i>' : G.dog.hunger >= 2 ? '<i class="chip orange">Com fome</i>' : '<i class="chip green">Feliz</i>'}<i class="chip">Fareja infectados</i></div></div>
      <div class="rbtns"><button class="rbtn ${G.dog.fed ? 'on' : ''}" data-act="feedDog" ${!G.dog.fed && !has('comida') ? 'disabled' : ''}>${icon('comida', 22)}</button></div></div>`;
  }
  h += '</div><p class="j-tip">Sem água por 3 dias ou sem comida por 4, a saúde cai. Remédio cura ferimentos e doenças e devolve um coração.</p>';
  return h;
}

function pageExped() {
  const t = G.today, sel = t.expSel;
  let h = '<h2 class="j-h">Expedição</h2>';
  const away = G.members.filter(m => m.alive && m.away);
  if (away.length) h += '<div class="j-away">' + away.map(m => `<div>${portrait(m, 30)} <b>${m.name}</b> está em: ${DESTS[m.dest].name}. Volta no dia ${G.day + m.away}.</div>`).join('') + '</div>';
  if (t.expSent) return h + '<p class="j-ev">Alguém já saiu hoje. Mais de uma expedição por dia chama atenção.</p>';
  const cands = others().filter(m => m.health >= 2 && m.stress < 85);
  if (!cands.length) return h + '<p class="j-ev">Ninguém em condições de sair. (Precisa de outra pessoa com pelo menos 2 corações e sem pânico.)</p>';
  h += '<h3 class="j-sub">Quem vai?</h3><div class="pick-row">' + cands.map(m => `<button class="pick ${sel.who === m.id ? 'on' : ''}" data-act="expWho" data-id="${m.id}">${portrait(m, 40)}<span>${m.name}</span></button>`).join('') + '</div>';
  h += '<h3 class="j-sub">Para onde?</h3><div class="dest-list">' + Object.entries(DESTS).map(([k, d]) => {
    const locked = d.req && !d.req();
    const risk = '<i class="rk"></i>'.repeat(d.risk) + '<i class="rk off"></i>'.repeat(3 - d.risk);
    return `<button class="dest ${sel.dest === k ? 'on' : ''}" data-act="expDest" data-k="${k}" ${locked ? 'disabled' : ''}><b>${d.name}</b><span class="risk">${risk}</span><small>${locked ? d.reqText : `${d.nights} noite${d.nights > 1 ? 's' : ''} · ${destHint(k)}`}</small></button>`;
  }).join('') + '</div>';
  h += '<h3 class="j-sub">Equipamento</h3><div class="gear">';
  [['mask', 'mascara', 'Máscara (−65% infecção, gasta 1)'], ['marreta', 'marreta', 'Marreta (menos ferimentos; pode se perder)'], ['lanterna', 'lanterna', 'Lanterna (mais achados e documentos)'], ['walkie', 'walkie', 'Walkie-talkie (menos sumiços e ferimentos)']].forEach(([f, k, txt]) => {
    h += `<label class="gchk ${has(k) ? '' : 'off'}"><input type="checkbox" data-act="expGear" data-g="${f}" ${sel[f] ? 'checked' : ''} ${has(k) ? '' : 'disabled'}>${icon(k, 22)} ${txt}</label>`;
  });
  h += '</div>';
  h += `<button class="btn ink wide" data-act="expGo" ${sel.who && sel.dest ? '' : 'disabled'}>Mandar em expedição</button>`;
  return h;
}
function destHint(k) {
  return { super: 'comida e água', farm: 'remédios, máscaras, testes', ferr: 'tábuas, marreta', elet: 'pilhas, rádio', moda: 'cobertores', brinq: 'pilhas, videogame', praca: 'muita comida, muito risco', controle: 'documentos, chave', estac: 'o Fiat do Lacerda' }[k];
}

function pageBase() {
  const t = G.today;
  let h = '<h2 class="j-h">Base</h2><div class="base-grid">';
  // rádio
  h += `<div class="bcard"><div class="bh">${icon('radio', 30)}<b>Rádio</b></div>`;
  if (G.rescueDay) h += `<p>Resgate confirmado: helicóptero no telhado no <b>dia ${G.rescueDay}</b>. Só falta sobreviver até lá.</p>`;
  else if (has('radio')) h += `<p>Tentar contato com o resgate. Gasta 1 pilha (tem ${G.inv.pilhas}).${G.flags.evac ? ' Você tem a frequência.' : ' Sem a frequência certa, as chances são baixas.'}</p><button class="btn ink" data-act="radio" ${t.radioUsed || !has('pilhas') ? 'disabled' : ''}>${t.radioUsed ? 'Já tentou hoje' : 'Tentar contato'}</button>`;
  else h += '<p>Vocês não têm rádio. Talvez ainda haja um na Eletro Mega.</p>';
  if (t.radioResult) h += `<p class="j-res">${t.radioResult}</p>`;
  h += '</div>';
  // barricada
  h += `<div class="bcard"><div class="bh">${icon('tabuas', 30)}<b>Barricada</b> <span class="meter">${'<i class="on"></i>'.repeat(G.barricade)}${'<i></i>'.repeat(5 - G.barricade)}</span></div>
    <p>Segura as invasões noturnas. As invasões ficam mais frequentes com o passar dos dias. Tem ${G.inv.tabuas} tábua(s).</p>
    <button class="btn ink" data-act="barr" ${has('tabuas') && G.barricade < 5 ? '' : 'disabled'}>Pregar uma tábua</button></div>`;
  // videogame
  if (has('videogame')) h += `<div class="bcard"><div class="bh">${icon('videogame', 30)}<b>Videogame</b></div><p>Torneio de blocos caindo. Reduz o estresse de todo mundo.</p><button class="btn ink" data-act="game" ${t.gameUsed ? 'disabled' : ''}>${t.gameUsed ? 'Já jogaram hoje' : 'Começar torneio'}</button></div>`;
  // Lacerda
  if (G.flags.lacerdaWaiting && !G.flags.mapa && G.day < 10) h += `<div class="bcard"><div class="bh">${icon('pilhas', 30)}<b>Duto do Lacerda</b></div><p>Mandar 2 pilhas pelo duto em troca do mapa da manutenção.</p><button class="btn ink" data-act="lacerda" ${has('pilhas', 2) ? '' : 'disabled'}>Mandar 2 pilhas</button></div>`;
  // soro
  const helena = home().find(m => m.trait === 'quimica');
  const canKnow = helena || G.notes.includes('formula');
  if (canKnow || has('amostra')) {
    const ready = canKnow && has('amostra') && has('remedio', 2);
    h += `<div class="bcard glow"><div class="bh">${icon('soro', 30)}<b>Soro experimental</b></div>
      <p>Receita: ${icon('amostra', 18)} amostra da Serenitá + ${icon('remedio', 18)}×2 + ${helena ? helena.name : (G.notes.includes('formula') ? 'a fórmula anotada' : '<b>alguém que saiba a fórmula</b>')}. Rende 2 doses. Aplique no infectado antes da fase final.</p>
      <button class="btn ink" data-act="craft" ${ready && !t.crafted ? '' : 'disabled'}>Fabricar soro</button></div>`;
  }
  // fuga
  if (G.carReady && has('chaves')) h += `<div class="bcard glow"><div class="bh">${icon('chaves', 30)}<b>Fuga no Fiat</b></div><p>O carro está no G2, com meio tanque. Cabem 5 pessoas (e um cachorro, se apertar). Quem estiver fora, fica.</p><button class="btn danger" data-act="flee">Fugir agora</button></div>`;
  // câmara fria
  const q = G.members.filter(m => m.alive && m.quar);
  if (G.flags.freezer) h += `<div class="bcard"><div class="bh">${icon('cobertor', 30)}<b>Câmara fria</b></div><p>${q.length ? q.map(m => `${m.name} (${m.quar} noite${m.quar > 1 ? 's' : ''}${m.blanket ? ', com cobertor' : ', sem cobertor'})`).join(', ') : 'Vazia.'} O frio força A Calma a se revelar em até 2 noites.</p></div>`;
  else h += `<div class="bcard"><div class="bh">${icon('lock', 30)}<b>Câmara fria</b></div><p>Trancada com um cadeado velho. Às vezes alguém bate lá dentro, bem fraquinho.</p></div>`;
  // baralho e fita
  if (has('baralho')) h += `<div class="bcard"><div class="bh">${icon('baralho', 30)}<b>Baralho</b></div><p>Truco valendo ração. Grita, xinga, rouba, mas acalma.</p><button class="btn ink" data-act="cards" ${t.cardsUsed ? 'disabled' : ''}>${t.cardsUsed ? 'Já jogaram hoje' : 'Truco!'}</button></div>`;
  if (has('fita')) h += `<div class="bcard"><div class="bh">${icon('fita', 30)}<b>Silver tape</b></div><p>Tem ${G.inv.fita}. Cada uma reforça a barricada em 1.</p><button class="btn ink" data-act="tape" ${G.barricade < 5 ? '' : 'disabled'}>Passar fita na porta</button></div>`;
  // live do influencer
  const ric = home().find(m => m.key === 'ricardinho');
  if (ric && G.day >= 5) h += `<div class="bcard glow"><div class="bh">${icon('pilhas', 30)}<b>Live de socorro</b></div><p>${ric.name} jura que, com 3 pilhas no carregador improvisado, faz uma live que "quebra a internet" e alguém vem buscar vocês. Pode dar muito certo. Ou viralizar do jeito errado.</p><button class="btn danger" data-act="live" ${has('pilhas', 3) ? '' : 'disabled'}>Entrar ao vivo (−3 pilhas)</button></div>`;
  // fuga pelos dutos
  const neide = home().find(m => m.key === 'neide');
  if (neide || (G.notes.includes('neide') && G.flags.mapa)) {
    h += `<div class="bcard glow"><div class="bh">${icon('pilhas', 30)}<b>Fuga pelos dutos</b></div><p>${neide ? 'A Neide conhece o caminho' : 'O bilhete da Neide e o mapa da manutenção mostram o caminho'}: dutos de ventilação até o esgoto da avenida. Cabem só 3 pessoas (e o cachorro, se ele colaborar). Os mais fortes vão.</p><button class="btn danger" data-act="dutos">Entrar no duto agora</button></div>`;
  }
  // beber a amostra
  if (has('amostra')) h += `<div class="bcard"><div class="bh">${icon('amostra', 30)}<b>Amostra de Serenitá</b></div><p>Um copinho lacrado. "Beba a calma." Gelado. Brilhando. Ninguém precisa saber.</p><button class="btn ghost-ink" data-act="beber">${G.flags.beberConfirm ? 'Tem certeza? Clique de novo.' : 'Beber'}</button></div>`;
  h += '</div><h3 class="j-sub">Estoque</h3><div class="inv-list">' + INV_ORDER.filter(k => G.inv[k] > 0).map(k => `<div class="invi" title="${ITEMS[k].desc}">${icon(k, 30)}<span>${ITEMS[k].u ? ITEMS[k].short : ITEMS[k].short + ' ×' + G.inv[k]}</span></div>`).join('') + '</div>';
  return h;
}

function pageArquivo() {
  let h = '<h2 class="j-h">Arquivo</h2>';
  h += '<h3 class="j-sub">Fatos conhecidos</h3><ul class="j-report">' + G.facts.map(f => `<li>${f.text}</li>`).join('') + '</ul>';
  h += `<h3 class="j-sub">Documentos (${G.notes.length}/${Object.keys(NOTES).length})</h3>`;
  h += G.notes.length ? G.notes.map(id => `<details class="note-d"><summary>${icon('nota', 20)} ${NOTES[id].t}</summary><p>${NOTES[id].x}</p></details>`).join('') : '<p class="j-ev muted">Nenhum ainda. Expedições com lanterna acham mais.</p>';
  const names = Object.keys(G.susp);
  h += '<h3 class="j-sub">Suspeitas anotadas</h3>' + (names.length ? names.map(n => `<div class="susp"><b>${n}</b><ul>${G.susp[n].slice(-5).map(s => `<li>${s}</li>`).join('')}</ul></div>`).join('') : '<p class="j-ev muted">Nada anotado. Por enquanto.</p>');
  return h;
}

/* =========================================================
   AÇÕES DO DIÁRIO
   ========================================================= */
function onJournal(a, b) {
  const t = G.today;
  switch (a) {
    case 'tab': G.tab = b.dataset.tab; Sound.play('page'); break;
    case 'choice': {
      const c = t.event.choices[+b.dataset.i];
      t.eventResult = c.f(t.ctx); t.eventDone = true; Sound.play('page'); break;
    }
    case 'door': openDoor(); return;
    case 'feed': {
      const m = findM(+b.dataset.id), flag = b.dataset.flag, k = flag === 'fed' ? 'comida' : 'agua';
      if (m[flag]) { m[flag] = false; give(k); } else if (has(k)) { m[flag] = true; take(k); }
      Sound.play('click'); break;
    }
    case 'med': {
      const m = findM(+b.dataset.id);
      if (m.med) { m.med = false; give('remedio'); } else if (has('remedio')) { m.med = true; take('remedio'); }
      Sound.play('click'); break;
    }
    case 'feedDog': if (G.dog.fed) { G.dog.fed = false; give('comida'); } else if (has('comida')) { G.dog.fed = true; take('comida'); } Sound.play('bark'); break;
    case 'expWho': t.expSel.who = +b.dataset.id; break;
    case 'expDest': t.expSel.dest = b.dataset.k; break;
    case 'expGear': t.expSel[b.dataset.g] = b.checked; return;
    case 'expGo': {
      const m = findM(t.expSel.who), d = DESTS[t.expSel.dest];
      if (!m || !d) break;
      m.away = d.nights; m.dest = t.expSel.dest; m.gear = {};
      if (t.expSel.mask && has('mascara')) { take('mascara'); m.gear.mask = true; }
      if (t.expSel.marreta && has('marreta')) { take('marreta'); m.gear.marreta = true; }
      if (t.expSel.lanterna && has('lanterna')) { take('lanterna'); m.gear.lanterna = true; }
      if (t.expSel.walkie && has('walkie')) { take('walkie'); m.gear.walkie = true; }
      t.expSent = true; G.stats.exped++; renderJournal();
      Cut.play('depart', { m, lanterna: !!m.gear.lanterna, mask: !!m.gear.mask }, `${m.name} se abaixou por baixo da porta e sumiu no corredor escuro, rumo à ${d.name}.`);
      return;
    }
    case 'radio': {
      if (!has('pilhas') || t.radioUsed) break;
      take('pilhas'); t.radioUsed = true; Sound.play('radio');
      const tec = home().some(m => m.trait === 'tecnico');
      let p = G.flags.evac ? .35 : .08; if (tec) p = Math.min(.8, p * 2);
      if (chance(p)) {
        G.rescueDay = Math.min(G.day + 3, MAXDAY);
        t.radioResult = `Contato! Uma voz militar: "Helicóptero no heliponto do telhado, DIA ${G.rescueDay}, 6h. Não tragam ninguém sorridente."`;
        addFact('resgate', `Resgate combinado: telhado, dia ${G.rescueDay}, 6h.`);
        Cut.play('radio', {}, t.radioResult);
      } else t.radioResult = pick(RADIO_FAIL);
      break;
    }
    case 'barr': if (has('tabuas') && G.barricade < 5) { take('tabuas'); G.barricade++; Sound.play('knock'); Room.hammer = 1; } break;
    case 'game': t.gameUsed = true; stressAll(-12); Sound.play('good'); t.radioResult = t.radioResult; Room.flash('Torneio de blocos! Estresse do grupo caiu.'); break;
    case 'lacerda': if (has('pilhas', 2)) { take('pilhas', 2); G.flags.mapa = true; G.report.push('Você mandou as pilhas pelo duto. O mapa da manutenção chegou. Nova expedição: Sala de Controle.'); Room.flash('Mapa da manutenção recebido!'); Sound.play('good'); } break;
    case 'craft': {
      take('amostra'); take('remedio', 2); give('soro', 2); t.crafted = true;
      Cut.play('soro', {}, 'Amostra, vitamina C em dose alta e muita fé. Duas doses de soro, brilhando no escuro.');
      Room.flash('Duas doses de soro! Elas brilham levemente. Isso é bom? Isso é bom.');
      break;
    }
    case 'flee': endGame('car'); return;
    case 'live': if (has('pilhas', 3)) { take('pilhas', 3); endGame('live'); } return;
    case 'cards': t.cardsUsed = true; stressAll(-8); Sound.play('good'); Room.flash(pick(['TRUCO! SEIS! Ninguém sabe mais quem está ganhando.', 'A Irmã Glória roubou. Todo mundo viu. Ninguém teve coragem de falar.', 'Alguém jogou um zap. Gritaria. Por cinco minutos, ninguém lembrou de nada lá fora.'])); break;
    case 'tape': if (has('fita') && G.barricade < 5) { take('fita'); G.barricade++; Room.hammer = 1; Sound.play('search'); Room.flash('Silver tape: se não resolveu, é porque usou pouca.'); } break;
    case 'dutos': endGame('dutos'); return;
    case 'beber': if (!G.flags.beberConfirm) { G.flags.beberConfirm = true; Sound.play('giggle'); break; } endGame('beber'); return;
    case 'sleep': startNight(); return;
  }
  renderJournal();
}
const findM = id => G.members.find(m => m.id === id);

/* =========================================================
   PERSONAGEM (modal)
   ========================================================= */
function memberModal(m) {
  const at = m.alive && !m.away && !m.quar;
  let h = `<div class="mm-top"><canvas class="pt big" data-mid="${m.id}" width="120" height="120" style="width:120px;height:120px"></canvas>
    <div><h2>${m.name}${m.isPlayer ? ' <small>(você)</small>' : ''}</h2><p class="muted">${m.bio}</p>
    <div>${hearts(m)} ${stressBar(m)}</div><div class="chips">${chips(m)}</div></div></div>`;
  if (at) {
    if (m.log.length) h += `<ul class="exam">${m.log.map(l => `<li>${l}</li>`).join('')}</ul>`;
    const tools = [];
    if (!m.isPlayer) tools.push(`<button class="tbtn" data-act="mtool" data-t="talk" data-id="${m.id}" ${m.talked || G.talks <= 0 ? 'disabled' : ''}>Conversar <small>(${G.talks} conversa${G.talks !== 1 ? 's' : ''} hoje · −estresse)</small></button>`);
    if (has('termometro')) tools.push(`<button class="tbtn" data-act="mtool" data-t="term" data-id="${m.id}" ${m.used.term ? 'disabled' : ''}>${icon('termometro', 18)} Termômetro</button>`);
    if (has('lanterna')) tools.push(`<button class="tbtn" data-act="mtool" data-t="uv" data-id="${m.id}" ${m.used.uv || !has('pilhas') ? 'disabled' : ''}>${icon('lanterna', 18)} Lanterna UV <small>(−1 pilha)</small></button>`);
    if (G.dog && !m.isPlayer) tools.push(`<button class="tbtn" data-act="mtool" data-t="dog" data-id="${m.id}" ${m.used.dog ? 'disabled' : ''}>${icon('dog', 18)} Caramelo cheira</button>`);
    if (has('kit')) tools.push(`<button class="tbtn" data-act="mtool" data-t="kit" data-id="${m.id}" ${m.used.kit ? 'disabled' : ''}>${icon('kit', 18)} Teste rápido <small>(gasta 1)</small></button>`);
    if (has('cafe')) tools.push(`<button class="tbtn" data-act="mcafe" data-id="${m.id}">${icon('cafe', 18)} Dar café <small>(−25 estresse)</small></button>`);
    if (has('soro')) tools.push(`<button class="tbtn glow" data-act="msoro" data-id="${m.id}">${icon('soro', 18)} Aplicar soro</button>`);
    h += `<div class="tools">${tools.join('') || '<span class="muted">Sem ferramentas de exame.</span>'}</div>`;
    if (!m.isPlayer) h += `<div class="decide two">
      ${G.flags.freezer ? `<button class="btn ice" data-act="mquar" data-id="${m.id}">Câmara fria · 2 noites ${has('cobertor') ? '(usa cobertor)' : '(sem cobertor)'}</button>` : '<button class="btn ice" disabled>Câmara fria trancada</button>'}
      <button class="btn bad" data-act="mexpel" data-id="${m.id}">Expulsar do depósito</button></div>`;
  } else if (m.away) h += `<p>Em expedição: ${DESTS[m.dest].name}. Volta no dia ${G.day + m.away}. Talvez.</p>`;
  else if (m.quar) h += `<p>Na câmara fria. Faltam ${m.quar} noite(s). Às vezes dá pra ouvir a respiração pela porta.</p>`;
  if (m.trait) h += `<p class="trait-d"><b>${TRAITS[m.trait].n}:</b> ${TRAITS[m.trait].d}</p>`;
  h += '<div class="row center"><button class="btn ghost" data-act="closeModal">Fechar</button></div>';
  openModal(h, 'member');
  paintAllPortraits($('#modalCard'));
}

function examineTool(x, tool, isMember) {
  const inf = x.infected, stage = x.stage;
  switch (tool) {
    case 'talk': {
      const calm = inf ? chance(.8) : (x.trait === 'zen' ? chance(.75) : chance(.1));
      const pool = isMember ? (calm ? TALK.member_calm : TALK.member_nervous) : (calm ? TALK.calm : (x.trait === 'zen' ? TALK.zen : TALK.nervous));
      return `"${pick(pool)}"`;
    }
    case 'term':
      if (inf && stage >= 2) return `Termômetro: 38,${rnd(3, 9)}°C. Febre.`;
      if (chance(isMember && (x.sick || x.injured) ? .45 : .08)) return 'Termômetro: 37,8°C. Febrícula. Pode ser nervoso. Pode ser outra coisa.';
      return `Termômetro: 36,${rnd(4, 8)}°C. Normal.`;
    case 'uv':
      take('pilhas');
      if (inf ? chance(.85) : chance(.07)) return 'Lanterna UV: as pupilas não reagem. Nada. Nem um tremor.';
      return 'Lanterna UV: as pupilas encolheram normalmente.';
    case 'dog':
      Sound.play(inf ? 'growl' : 'bark');
      if (inf ? chance(.75) : chance(.12)) return 'O Caramelo rosnou e se escondeu atrás de você.';
      return 'O Caramelo abanou o rabo e pediu carinho.';
    case 'kit':
      take('kit');
      return inf ? 'TESTE RÁPIDO: POSITIVO. Duas listras. Sem dúvida.' : 'TESTE RÁPIDO: negativo. Uma listra só.';
  }
  return '';
}

function onMember(a, b) {
  const m = findM(+b.dataset.id);
  if (a === 'mtool') {
    const tool = b.dataset.t;
    if (tool === 'talk') {
      if (m.talked || G.talks <= 0) return;
      m.talked = true; G.talks--; addStress(m, -15);
    } else { if (m.used[tool]) return; m.used[tool] = true; }
    const res = examineTool(m, tool, true);
    m.log.push(res);
    if (tool !== 'talk' || res.includes('ótimo') || res.includes('Relaxa') || res.includes('lindo') || res.includes('fome')) suspect(m, res);
    memberModal(m); renderJournal(); return;
  }
  if (a === 'msoro') {
    take('soro');
    if (m.infected && m.stage < m.turnAt) { m.infected = false; m.stage = 0; m.sick = true; m.log.push('Soro aplicado. Febre forte, tremedeira... e depois, alívio. Algo foi embora.'); G.stats.cured = (G.stats.cured || 0) + 1; Sound.play('good'); Progress.unlock('cure'); Progress.add('cured'); }
    else { m.sick = true; m.log.push('Soro aplicado. Deu enjoo e febre. Era desnecessário?'); }
    memberModal(m); renderJournal(); return;
  }
  if (a === 'mcafe') { if (has('cafe')) { take('cafe'); addStress(m, -25); m.log.push(pick(['Café solúvel, morno, sem açúcar. Melhor coisa do mundo.', 'Tomou o café de olhos fechados. Por um minuto, era segunda-feira normal.', '"Agora sim eu consigo pensar." Pensou. Ficou triste de novo. Mas menos.'])); Sound.play('good'); } memberModal(m); renderJournal(); return; }
  if (a === 'mquar') { quarantine(m); addStress(m, 15); Sound.play('freeze'); closeModal(); renderJournal(); return; }
  if (a === 'mexpel') {
    m.alive = false; m.fate = 'Expulso'; stressAll(8); G.feedback.push(m); Sound.play('slam');
    closeModal(); renderJournal(); return;
  }
}

/* =========================================================
   A PORTA (olho mágico)
   ========================================================= */
const QUESTIONS = [
  ['origem', 'De onde você veio?'],
  ['medo', 'Você está com medo?'],
  ['bracos', 'Mostra os braços.'],
  ['porque', 'Por que a gente deveria te deixar entrar?'],
];
function qLimit() { return 2 + (G.proto === 'dani' ? 1 : 0); }
function visitorLook(v) { return v.masked ? v.c.look : (v.c.face || v.c.look); }
function visitorVisual(v, t) {
  const s = v.masked ? {} : v.signs;
  return { t, pale: s.pale ? .7 : 0, sweat: s.sweat, bandage: s.bandage ? 'neck' : null, scratch: s.scratch, glassy: s.glassy, expr: s.smile ? 'smile' : (v.infected ? 'calm' : 'scared') };
}
function openDoor() {
  const v = G.today.visitor;
  Room.knock = 1;
  if (v && !v.cutDone) { v.cutDone = true; Cut.play('knock', { v }, 'Alguém está batendo na porta de aço.').then(doorModal); return; }
  Sound.play('knock'); doorModal();
}
function doorModal() {
  const t = G.today, v = t.visitor, c = v.c;
  const asked = Object.keys(v.asked).length, lim = qLimit();
  const signs = v.masked ? ['A cabeça gigante do mascote sorri. Sempre sorriu.'] : Object.keys(v.signs).map(k => SIGNS_TEXT[k]);
  let h = `<div class="door-grid"><div class="peep-wrap"><canvas id="peepCv" width="240" height="240"></canvas><div class="peep-ring"></div></div>
    <div class="door-info"><div class="kicker">Toc toc toc</div><h2>${v.masked ? c.name : (c.realName || c.name)}</h2><p class="muted">${c.bio}</p>
    ${v.note ? `<p class="note">${v.note}</p>` : ''}
    <p class="say">"${v.intro || c.intro}"</p>
    ${c.offer ? `<p class="offer">Oferece: ${Object.entries(c.offer).map(([k, n]) => `${icon(k, 20)} ${ITEMS[k].short}${n > 1 ? ' ×' + n : ''}`).join(' ')}</p>` : ''}
    <p class="peepline"><b>Pelo olho mágico:</b> ${signs.length ? signs.join(' ') : 'nada de estranho à primeira vista.'}</p></div></div>`;
  if (v.log.length) h += `<ul class="exam">${v.log.map(l => `<li>${l}</li>`).join('')}</ul>`;
  h += `<div class="q-head">Perguntas <small>(${asked}/${lim})</small></div><div class="tools">`;
  const qs = QUESTIONS.slice(); if (v.masked) qs.push(['cabeca', 'Tira a cabeça da fantasia.']);
  qs.forEach(([id, q]) => { h += `<button class="tbtn" data-act="vq" data-q="${id}" ${v.asked[id] || asked >= lim ? 'disabled' : ''}>${q}</button>`; });
  h += '</div><div class="q-head">Ferramentas</div><div class="tools">';
  if (has('termometro')) h += `<button class="tbtn" data-act="vtool" data-t="term" ${v.used.term ? 'disabled' : ''}>${icon('termometro', 18)} Termômetro pela fresta</button>`;
  if (has('lanterna')) h += `<button class="tbtn" data-act="vtool" data-t="uv" ${v.used.uv || !has('pilhas') ? 'disabled' : ''}>${icon('lanterna', 18)} Lanterna UV <small>(−1 pilha)</small></button>`;
  if (G.dog) h += `<button class="tbtn" data-act="vtool" data-t="dog" ${v.used.dog ? 'disabled' : ''}>${icon('dog', 18)} Caramelo cheira a fresta</button>`;
  if (has('kit')) h += `<button class="tbtn" data-act="vtool" data-t="kit" ${v.used.kit ? 'disabled' : ''}>${icon('kit', 18)} Teste rápido <small>(gasta 1)</small></button>`;
  if (!has('termometro') && !has('lanterna') && !G.dog && !has('kit')) h += '<span class="muted">Nenhuma. Só seus olhos e seu instinto.</span>';
  h += `</div><div class="decide">
    <button class="btn ok" data-act="vdec" data-d="in">Deixar entrar</button>
    ${G.flags.freezer ? `<button class="btn ice" data-act="vdec" data-d="quar">Entrar direto pra câmara fria ${has('cobertor') ? '(usa cobertor)' : '(sem cobertor)'}</button>` : ''}
    ${c.offer ? '<button class="btn warn" data-act="vdec" data-d="trade">Pegar a oferta pela fresta e fechar</button>' : ''}
    <button class="btn bad" data-act="vdec" data-d="out">Mandar embora</button></div>`;
  openModal(h, 'door');
  Room.peep = { v, cv: $('#peepCv') };
}

function answer(v, q) {
  const c = v.c;
  switch (q) {
    case 'origem': {
      const closed = G.facts.map(f => CLOSED_PLACES[f.id]).filter(Boolean);
      let place;
      if (v.infected && closed.length && chance(.5)) place = pick(closed).place;
      else place = v.origin || (v.origin = pick(OPEN_PLACES));
      if (v.key === 'enzo') place = 'do balcão de informações';
      if (v.key === 'helena') place = v.infected && closed.length && chance(.5) ? pick(closed).place : 'do laboratório da Serenitá, no 3º andar';
      return `"Vim ${place}." ` + (v.infected ? pick(['"Estava tão tranquilo lá..."', '"Lugar ótimo, aliás."', '']) : pick(['"Fiquei escondido lá até agora."', '"Corri o caminho todo."', '"Não me pergunta como cheguei."']));
    }
    case 'medo': {
      const calm = v.infected ? chance(.8) : (c.trait === 'zen' ? chance(.75) : chance(.1));
      return `"${pick(calm ? (v.infected || c.trait !== 'zen' ? TALK.calm : TALK.zen) : TALK.nervous)}"`;
    }
    case 'bracos':
      if (v.masked) return 'As mangas da fantasia são de pelúcia amarela. Não dá pra ver nada.';
      if (v.infected && chance(.6)) { v.signs.bite = true; return 'Uma mordida mal escondida no antebraço. "Foi um... cachorro?"'; }
      if (!v.infected && chance(.15)) return 'Um arranhão no braço. "Foi o gato da vizinha. Antes disso tudo."';
      return 'Braços limpos. Nenhuma marca.';
    case 'porque':
      return `"${c.why}"` + (v.infected && chance(.35) ? ' "...E lá fora está tão bom. Quer dizer: perigoso."' : '');
    case 'cabeca':
      v.masked = false; Progress.unlock('mascot');
      return v.infected ? 'Ele tira a cabeça da fantasia. Um rapaz suado, de cabelo grudado... sorrindo. A fantasia sorria menos.' : 'Ele tira a cabeça da fantasia. Um rapaz suado, de cabelo grudado: "Ufa. Wagner, prazer. Tava um forno aí dentro."';
  }
  return '';
}

function onDoor(a, b) {
  const t = G.today, v = t.visitor;
  if (a === 'vq') {
    const q = b.dataset.q; if (v.asked[q] || Object.keys(v.asked).length >= qLimit()) return;
    v.asked[q] = true; v.log.push(`<b>${QUESTIONS.concat([['cabeca', 'Tira a cabeça da fantasia.']]).find(x => x[0] === q)[1]}</b> ${answer(v, q)}`);
    Sound.play('click'); doorModal(); return;
  }
  if (a === 'vtool') {
    const tool = b.dataset.t; if (v.used[tool]) return; v.used[tool] = true;
    v.log.push(examineTool({ infected: v.infected, stage: v.stage, trait: v.c.trait }, tool, false));
    doorModal(); return;
  }
  if (a === 'vdec') return visitorDecide(b.dataset.d);
}

function visitorDecide(d) {
  const t = G.today, v = t.visitor, c = v.c; let r = '';
  if (v.key === 'valeria' && home().some(m => m.key === 'enzo')) { Progress.unlock('mother'); if (d === 'out' || d === 'trade') { const e = home().find(m => m.key === 'enzo'); addStress(e, 30); suspect(e, 'chorou a noite toda chamando a mãe.'); } }
  Room.peep = null;
  if (d === 'in' || d === 'quar') {
    const m = makeMember(v.key, v.infected);
    if (c.mascot) { m.name = c.realName; m.look = c.face; m.bio = 'Era o Sorrisinho. Agora é só o Wagner.'; }
    m.stage = v.infected ? v.stage : 0;
    G.members.push(m); G.seen.push(m); G.stats.letIn++; stressAll(-3);
    if (d === 'quar') { quarantine(m); addStress(m, 15); r = `${m.name} entrou direto pra câmara fria${m.blanket ? ' com um cobertor' : ', sem cobertor'}. "Isso é necessário mesmo?" É.`; }
    else r = `${m.name} entrou. ${pick(['Todos fingiram não estar desconfiados.', 'Alguém contou os dedos da pessoa, discretamente.', 'Mais uma boca. Mais um par de mãos. Mais um ponto de interrogação.'])}`;
    if (v.key === 'helena') { addFact('soro', 'Soro: amostra da Serenitá + 2 remédios + a Dra. Helena (ou a fórmula). A amostra fica no quiosque da praça.'); r += ' Helena explica: "Com uma amostra da Serenitá e dois remédios, eu faço um soro." (veja a aba Base)'; }
  } else {
    const ref = { name: c.mascot && !v.masked ? c.realName : c.name, look: visitorLook(v), infected: v.infected, fate: d === 'trade' ? 'Trocou e foi embora' : 'Mandado embora' };
    G.seen.push(ref); G.stats.refused++; G.feedback.push(ref);
    if (v.infected) { G.stats.refInf = (G.stats.refInf || 0) + 1; Progress.add('caught'); if (G.stats.refInf >= 3) Progress.unlock('detector'); }
    if (d === 'trade') { Object.entries(c.offer).forEach(([k, n]) => give(k, n)); stressAll(8); r = `Você pegou a oferta pela fresta e fechou a porta. Funciona, mas pesa na consciência.`; }
    else { stressAll(4); r = `Você mandou ${ref.name} embora. Os passos se afastaram devagar.`; }
    if (v.key === 'helena') addFact('helena', 'A Dra. Helena sabia fazer um soro. Você a mandou embora.');
  }
  t.doorDone = true; t.doorResult = r; closeModal(); Sound.play('slam'); renderJournal();
}

/* =========================================================
   NOITE
   ========================================================= */
function startNight() {
  const t = G.today;
  if (!t.eventDone || !t.doorDone || Room.night) return;
  Room.night = { t: 0, done: false };
  Sound.stopMuzak(); Sound.startDrone();
  $('#btnSleep').disabled = true;
  setTimeout(() => { if (chance(.5)) Sound.play('knock'); }, 900);
  setTimeout(() => {
    const res = endDay();
    Room.night.done = true;
    if (res === 'over') return;
    setTimeout(async () => {
      const cuts = (G.nightCuts || []).slice();
      if (G.today.introCut) cuts.push({ name: G.today.introCut, data: {}, text: G.today.eventText });
      for (const ct of cuts) await Cut.play(ct.name, ct.data, ct.text);
      Room.night = null; Sound.stopDrone(); Sound.startMuzak(true);
      G.tab = 'diario'; renderJournal(); Sound.play('page');
    }, 900);
  }, 2600);
}

function resolveExpedition(m) {
  const d = DESTS[m.dest], g = m.gear || {}, guia = m.trait === 'guia', forte = m.trait === 'forte';
  const back = () => { if (g.marreta) { if (chance(.15)) lines.push('A marreta ficou pra trás.'); else give('marreta'); } if (g.lanterna) give('lanterna'); if (g.walkie) give('walkie'); m.gear = {}; m.dest = null; };
  const lines = [];
  let inf = d.inf * D().inf; if (m.dest === 'controle' && G.day >= 10) inf += .15;
  const walkie = !!g.walkie, lucky = m.trait === 'sortudo';
  if (chance(d.lost * (guia ? .4 : 1) * (g.marreta ? .6 : 1) * (walkie ? .5 : 1))) {
    m.alive = false; m.fate = 'Sumiu numa expedição'; stressAll(14);
    G.nightCuts.push({ name: 'lost', data: { m }, text: `Passou da hora. ${m.name} não voltou da ${d.name}. Só a lanterna voltou rolando até perto da porta.` });
    if (g.lanterna && chance(.5)) lines.push('');
    return `<b>${m.name}</b> não voltou da ${d.name}. Vocês deixaram a luz acesa mesmo assim.`;
  }
  const got = {}; let hurtNow = false;
  const n = rnd(1, 3) + (forte ? 1 : 0) + (d.bonus || 0) + (g.lanterna ? 1 : 0) + (lucky ? 1 : 0);
  for (let i = 0; i < n; i++) { const k = pick(d.loot); got[k] = (got[k] || 0) + Math.max(1, Math.ceil((ITEMS[k].pick || 2) / 2)); }
  if (d.special && chance(g.lanterna ? .45 : .28)) { const miss = d.special.filter(k => !has(k)); if (miss.length) got[miss[0]] = 1; }
  if (m.dest === 'praca' && !has('amostra') && (G.facts.find(f => f.id === 'soro') || G.notes.includes('formula')) && chance(.65)) got.amostra = 1;
  if (m.dest === 'controle' && !has('chaves') && chance(G.notes.includes('bilhete') ? .85 : .35)) got.chaves = 1;
  Object.entries(got).forEach(([k, v]) => give(k, v));
  lines.push(`<b>${m.name}</b> voltou da ${d.name} com: ${Object.entries(got).map(([k, v]) => `${icon(k, 18)}${ITEMS[k].u ? '' : '×' + v}`).join(' ')}.`);
  lines.push(`<i>"${pick(d.flavor)}"</i>`);
  if (d.notes && chance((g.lanterna ? .55 : .3) + (lucky ? .25 : 0))) { const nn = d.notes.filter(x => !G.notes.includes(x)); if (nn.length) { addNote(nn[0]); lines.push(`Trouxe um documento: "${NOTES[nn[0]].t}" (Arquivo).`); } }
  if (m.dest === 'estac') { G.carReady = true; addFact('carro', 'O Fiat do Lacerda está no G2, com meio tanque. Dá pra fugir (aba Base).'); lines.push('O Fiat está lá. Meio tanque. Cheiro de cigarro e desodorante de pinho.'); }
  if (m.dest === 'controle' && got.chaves) lines.push('No cofre da sala de controle: a chave do Fiat.');
  if (chance(d.hurt * (forte ? .5 : 1) * (g.marreta ? .6 : 1) * (walkie ? .7 : 1))) { injure(m); hurtNow = true; lines.push('Voltou mancando.'); }
  if (chance(inf * (g.mask ? .35 : 1) * (guia ? .6 : 1))) infect(m);
  if (m.infected ? chance(.5) : chance(.12)) { lines.push('Tem um arranhão no braço. "Foi num prego", diz.'); suspect(m, 'voltou da expedição com um arranhão ("foi num prego").'); }
  if (chance(.12) && G.pool.length) { const k = G.pool.shift(); G.visitorQueue.push(makeVisitor(k, `${m.name} encontrou essa pessoa escondida na ${d.name} e disse para vir até a porta.`)); lines.push('Disse que encontrou alguém escondido por lá. A pessoa vai bater na porta.'); }
  addStress(m, 10);
  G.nightCuts.push({ name: 'return', data: { m, items: got, hurt: hurtNow }, text: `${m.name} voltou da ${d.name}${hurtNow ? ', mancando,' : ''} com a sacola cheia.` });
  back();
  return lines.filter(Boolean).join(' ');
}

function turnMember(m, rep) {
  m.alive = false; m.fate = 'Virou um Calmo';
  const victims = home().filter(x => x !== m);
  rep.push(`<b>Às 3h17, ${m.name} acordou. Sorrindo. Muito.</b>`);
  G.nightCuts.push({ name: 'turn', data: { m, others: victims }, text: `3h17. ${m.name} se sentou devagar no colchão. E sorriu. Muito. Por tempo demais.` });
  Sound.play('bad');
  const v = victims.length ? pick(victims) : null;
  const vigia = victims.find(x => x.trait === 'vigia');
  if (vigia) rep.push(`${vigia.name}, que não dorme nunca, gritou antes que fosse tarde.`);
  const ext = !vigia && has('extintor') && !has('marreta');
  if (ext) { take('extintor'); rep.push('Alguém esvaziou o extintor na cara sorridente. Funcionou. O depósito ficou parecendo uma festa de espuma.'); }
  const defended = has('marreta') || !!vigia || ext || victims.some(x => x.trait === 'forte') || (G.proto === 'jo' && P().alive);
  if (defended) {
    rep.push(`O grupo reagiu${has('marreta') ? ' com a marreta' : ''}. Não foi bonito. ${m.name} não está mais entre vocês.`);
    if (v) { if (chance(.3)) { infect(v); rep.push('Todo mundo parece bem. Parece.'); } else if (chance(.5)) { injure(v); rep.push(`${v.name} se machucou na briga.`); } }
    stressAll(18);
  } else {
    rep.push(`Sem como se defender, vocês só conseguiram empurrar ${m.name} pra fora e trancar a porta.`);
    if (v) { if (chance(.65)) infect(v); injure(v); rep.push(`${v.name} levou um abraço longo antes de conseguirem separar. Ficou com um arranhão.`); }
    stressAll(25);
  }
}

function endDay() {
  const rep = [];
  G.nightCuts = [];
  const hm = home();
  /* 1. fome e sede */
  let cookSaved = false;
  hm.forEach(m => {
    m.hunger = m.fed ? 0 : m.hunger + 1;
    m.thirst = m.drank ? 0 : m.thirst + 1;
    if (m.fed && !cookSaved && hm.some(x => x.trait === 'cozinheiro') && chance(.3)) { cookSaved = true; give('comida'); rep.push(`${hm.find(x => x.trait === 'cozinheiro').name} fez uma lata render pra dois. +1 comida.`); }
    if (m.thirst >= D().thirstAt) { m.health--; addStress(m, 8); rep.push(`A sede está acabando com ${m.name}.`); }
    else if (m.thirst >= D().thirstAt - 1) addStress(m, 5);
    if (m.hunger >= D().hungerAt) { m.health--; addStress(m, 8); rep.push(`A fome está acabando com ${m.name}.`); }
    else if (m.hunger >= 2) addStress(m, 4);
    if (m.med) { m.injured = false; m.sick = false; m.health = Math.min(4, m.health + 1); }
  });
  if (G.dog) {
    G.dog.hunger = G.dog.fed ? 0 : G.dog.hunger + 1;
    if (G.dog.hunger >= 4) { G.dog = null; stressAll(10); rep.push('O Caramelo foi embora pela ventilação, procurar donos mais competentes.'); }
  }
  /* 2. ferimentos e doenças */
  hm.forEach(m => {
    if (m.injured) { m.injT++; if (m.injT >= 2 && chance(.35)) { m.health--; if (chance(.3)) m.sick = true; rep.push(`O ferimento de ${m.name} infeccionou.`); } }
    if (m.sick && chance(.5)) { m.health--; rep.push(`${m.name} passou a noite ardendo em febre.`); }
  });
  /* 3. traços */
  const doc = hm.find(m => m.trait === 'medico');
  if (doc) { const hurtOnes = hm.filter(m => m.health < 4 || m.injured).sort((a, b) => a.health - b.health); if (hurtOnes.length) { const x = hurtOnes[0]; x.health = Math.min(4, x.health + 1); if (chance(.5)) x.injured = false; rep.push(`${doc.name} cuidou de ${x === doc ? 'si mesmo' : x.name} durante a noite.`); } }
  if (hm.some(m => m.trait === 'piadista')) stressAll(-4);
  if (hm.some(m => m.trait === 'fofo')) stressAll(-3);
  hm.filter(m => m.trait === 'chorao').forEach(c => hm.forEach(o => { if (o !== c) addStress(o, 3); }));
  hm.forEach(m => {
    if (m.trait === 'ladrao' && m.stealIn > 0 && --m.stealIn === 0) {
      const c = Math.min(4, G.inv.comida), a = Math.min(3, G.inv.agua);
      take('comida', c); take('agua', a); m.alive = false; m.fate = 'Fugiu com o estoque'; stressAll(14);
      rep.push(`${m.name}, "do RH", sumiu de madrugada. Levou ${c} comidas, ${a} águas e o grampeador.`);
    }
  });
  /* 4. estresse base */
  hm.forEach(m => { if (m.alive) addStress(m, 4 + (G.flags.dark ? 6 : 0) + (m.injured || m.sick ? 5 : 0) - (m.trait === 'zen' ? 3 : 0)); });
  /* 5. A Calma */
  for (const m of G.members) {
    if (!m.alive || !m.infected) continue;
    if (m.quar) {
      m.quarNights++; m.stage += 2;
      if (m.stage >= m.turnAt || m.quarNights >= 2) {
        G.nightCuts.push({ name: 'freezer', data: { m }, text: `Na câmara fria, ${m.name} parou de tremer. Depois parou de bater na porta. Depois começou a sorrir.` });
        m.alive = false; m.fate = 'Revelado na câmara fria'; stressAll(6); Sound.play('freeze'); Progress.unlock('freezer'); Progress.add('caught');
        rep.push(`<b>Na câmara fria, ${m.name} parou de bater na porta. Depois começou a cantarolar.</b> A Calma se revelou. Ninguém vai abrir aquela porta tão cedo.`);
      }
      continue;
    }
    m.stage++;
    if (m.isPlayer && m.stage >= m.turnAt) { endGame('calma'); return 'over'; }
    if (!m.isPlayer && m.stage >= m.turnAt) {
      if (m.away) { m.alive = false; m.fate = 'Virou um Calmo (em expedição)'; rep.push(`${m.name} não voltou da expedição. Nunca mais.`); }
      else turnMember(m, rep);
    }
  }
  /* 6. câmara fria */
  G.members.forEach(m => {
    if (!m.alive || !m.quar) return;
    if (!m.blanket) { m.health--; if (chance(.4)) m.sick = true; }
    m.quar--;
    if (m.quar === 0) rep.push(`${m.name} saiu da câmara fria. Tremendo, mas humano.`);
  });
  /* 7. expedições */
  G.members.forEach(m => { if (m.alive && m.away > 0 && --m.away === 0) rep.push(resolveExpedition(m)); });
  /* 8. invasão noturna */
  const pAtk = (.08 + G.day * .013 + (G.flags.dark ? .15 : 0)) * D().attack + (G.flags.doorsOpen ? 1 : 0);
  if (G.day >= 2 && chance(pAtk) && home().length) {
    G.nightCuts.push({ name: 'attack', data: { broke: G.barricade <= 0 }, text: G.barricade > 0 ? 'Algo empurrou a porta a noite inteira. Uma tábua não aguentou.' : 'Sem barricada. Algo enfiou o braço pela fresta da porta.' });
    Sound.play('slam');
    if (G.barricade > 0) { G.barricade--; rep.push('Algo empurrou a porta a noite inteira. A barricada aguentou, mas perdeu uma tábua.'); }
    else {
      const v = pick(home());
      if (has('extintor')) { take('extintor'); rep.push('O extintor salvou a noite: espuma pela fresta até o braço recuar.'); }
      else { injure(v); stressAll(12);
      if (!has('marreta') && chance(.25)) infect(v); }
      rep.push(`<b>Sem barricada, algo enfiou o braço pela fresta.</b> ${v.name} se machucou${has('marreta') ? ', mas a marreta resolveu o resto' : ''}.`);
    }
  }
  /* 9. pistas */
  home().forEach(m => {
    if (m.infected && m.stage >= 2 && chance(.5)) { const l = m.isPlayer ? pick(PLAYER_CLUES) : tpl(pick(INF_CLUES), { n: m.name }); rep.push(l); if (!m.isPlayer) suspect(m, l); }
    else if (!m.infected && !m.isPlayer && chance(.08)) { const l = tpl(pick(HERRING_CLUES), { n: m.name }); rep.push(l); suspect(m, l); }
    if (G.dog && m.infected && !m.isPlayer && m.stage >= m.turnAt - 1) { rep.push(`O Caramelo latiu a noite toda para ${m.name}.`); suspect(m, 'o Caramelo latiu a noite toda para essa pessoa.'); }
  });
  /* 10. quem ficou lá fora */
  G.feedback.forEach(f => {
    if (f.infected) rep.push(tpl(pick(FB_INF), { n: f.name }));
    else if (chance(.6)) { rep.push(tpl(pick(FB_OK), { n: f.name })); stressAll(5); }
  });
  G.feedback = [];
  /* 11. pânico */
  home().filter(m => !m.isPlayer && m.stress >= 85).forEach(m => {
    if (m.stress >= 100) { m.alive = false; m.fate = 'Fugiu em pânico'; take('comida', 1); rep.push(`${m.name} abriu a porta às 2h e correu para o escuro, gritando. Levou uma lata.`); if (G.barricade > 0) G.barricade--; return; }
    if (!chance(.35)) return;
    const r = Math.random();
    if (r < .4 && has('comida')) { take('comida'); rep.push(`${m.name} comeu uma lata extra escondido. De nervoso.`); }
    else if (r < .7) { const ks = ['pilhas', 'remedio', 'agua'].filter(k => has(k)); if (ks.length) { const k = pick(ks); take(k); rep.push(`${m.name} teve um ataque e quebrou coisas. Perderam: ${ITEMS[k].short}.`); } }
    else { stressAll(6); rep.push(`${m.name} passou a noite gritando com a porta. Ninguém dormiu.`); }
  });
  /* 12. mortes */
  G.members.forEach(m => { if (m.alive && m.health <= 0) { m.alive = false; m.fate = 'Morreu'; stressAll(15); rep.push(`<b>${m.name} não resistiu.</b>`); } });
  if (!P().alive) { G.report = rep; endGame('dead'); return 'over'; }

  /* novo dia */
  G.day++;
  Progress.max('bestDay', G.day); if (G.day >= 8) Progress.unlock('week');
  if (G.flags.dark) G.flags.dark--;
  G.flags.doorsOpen = 0;
  const sf = STORY_FACTS[G.day];
  if (sf) { const cp = CLOSED_PLACES[sf[0]]; addFact(sf[0], cp.fact); if (sf[1]) rep.unshift(sf[1]); }
  if (G.rescueDay && G.day >= G.rescueDay) { G.report = rep; endGame('rescue'); return 'over'; }
  if (G.day >= MAXDAY) { G.report = rep; endGame(home().length >= 4 && G.barricade >= 4 && G.inv.comida >= 8 ? 'gerente' : 'concrete'); return 'over'; }
  if (chance(.3)) rep.push(`<i>${pick(chance(.6) ? CREEPY : FUNNY)}</i>`);
  G.report = rep.length ? rep : ['Noite tranquila. Ninguém sorriu. Bom sinal.'];
  prepareDay();
  if (G.today.visitor) setTimeout(() => Sound.play('knock'), 1200);
  return 'ok';
}

/* =========================================================
   CENA ILUSTRADA
   ========================================================= */
function memberVisual(m, t, portraitMode) {
  const o = { t, pose: 'idle', expr: 'normal' };
  if (m.infected && m.stage >= 2) o.pale = Math.min(.6, .2 * m.stage);
  if (m.infected && m.stage >= 3 && (portraitMode || Math.sin(t * .7 + m.id * 1.7) > .2)) o.expr = 'smile';
  if (m.infected && m.stage >= 4) o.glassy = true;
  if (m.sick) { o.pale = Math.max(o.pale || 0, .35); if (o.expr === 'normal') o.expr = 'sick'; }
  if (m.injured) o.bandage = 'head';
  if (!m.infected || m.stage < 3) {
    if (m.stress >= 75) o.expr = 'scared'; else if (m.health <= 1) o.expr = 'sad';
  }
  if (m.stress >= 60 && !m.infected) o.sweat = true;
  return o;
}

const Room = {
  cv: null, ctx: null, bg: null, hits: [], hover: null, knock: 0, hammer: 0, night: null, peep: null, msg: null, msgT: 0, last: 0, on: false,
  start() {
    this.cv = $('#room'); this.ctx = this.cv.getContext('2d');
    if (!this.bg) this.prerender();
    if (!this.on) { this.on = true; this.last = performance.now(); requestAnimationFrame(t => this.loop(t)); }
  },
  flash(msg) { this.msg = msg; this.msgT = 3; },
  LW: 960, LH: 540, ox: 0, oy: 0,
  /* ajusta a resolução lógica ao tamanho real do canvas, mantendo a cena 960x540 no centro */
  fit() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const asp = r.width / r.height;
    let LW = 960, LH = 540;
    if (asp > 960 / 540) LW = Math.round(540 * asp); else LH = Math.round(960 / asp);
    LW = Math.min(LW, 2400); LH = Math.min(LH, 1600);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const k = Math.max(1, Math.min(dpr, r.width * dpr / LW));
    const pw = Math.round(LW * k), ph = Math.round(LH * k);
    if (this.cv.width !== pw || this.cv.height !== ph) { this.cv.width = pw; this.cv.height = ph; }
    this.k = k; this.LW = LW; this.LH = LH; this.ox = (LW - 960) / 2; this.oy = (LH - 540) / 2;
  },
  /* continua parede, teto e piso para além da cena original */
  drawMargins(c, LW, LH, ox, oy) {
    const k = this.k || 1;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.fillStyle = '#3d3a45'; c.fillRect(0, 0, LW, LH);
    if (!this.brick) {
      const b = document.createElement('canvas'); b.width = 160; b.height = 60; const x = b.getContext('2d');
      x.fillStyle = '#4a4752'; x.fillRect(0, 0, 160, 60);
      [[0, 0], [80, 0], [-40, 30], [40, 30], [120, 30]].forEach(([bx, by], i) => { x.fillStyle = ['#514e5a', '#55525e', '#4f4c58', '#53505c', '#4f4c58'][i]; x.fillRect(bx + 2, by + 2, 76, 26); });
      this.brick = c.createPattern(b, 'repeat');
    }
    c.save(); c.translate(ox, oy + 40); c.fillStyle = this.brick; c.fillRect(-ox, -oy - 40, LW, oy + 400); c.restore();
    c.fillStyle = '#26232d'; c.fillRect(0, 0, LW, oy + 42);
    c.fillStyle = '#7c8a96'; c.fillRect(0, oy + 18, LW, 14);
    const fg = c.createLinearGradient(0, oy + 400, 0, LH); fg.addColorStop(0, '#6d6658'); fg.addColorStop(.25, '#4a4438'); fg.addColorStop(1, '#2e2a23');
    c.fillStyle = fg; c.fillRect(0, oy + 400, LW, LH - oy - 400);
    c.fillStyle = '#2b2730'; c.fillRect(0, oy + 396, LW, 8);
    c.fillStyle = '#e1b12c'; for (let x = -(ox % 28) - 28; x < LW; x += 28) { c.beginPath(); c.moveTo(x, oy + 414); c.lineTo(x + 14, oy + 414); c.lineTo(x + 24, oy + 404); c.lineTo(x + 10, oy + 404); c.fill(); }
    // escurece as bordas estendidas para a cena original ficar em destaque
    const side = c.createLinearGradient(0, 0, LW, 0);
    const a = ox / LW, b = (ox + 960) / LW;
    side.addColorStop(0, 'rgba(8,6,14,.75)'); side.addColorStop(Math.max(0, a), 'rgba(8,6,14,.15)'); side.addColorStop(Math.min(1, b), 'rgba(8,6,14,.15)'); side.addColorStop(1, 'rgba(8,6,14,.75)');
    c.fillStyle = side; c.fillRect(0, 0, LW, LH);
  },
  prerender() {
    const W = 960, H = 540;
    this.bg = document.createElement('canvas'); this.bg.width = W; this.bg.height = H;
    const c = this.bg.getContext('2d'), r = seeded(77);
    // parede de blocos
    c.fillStyle = '#4a4752'; c.fillRect(0, 0, W, 420);
    for (let y = 40, row = 0; y < 420; y += 30, row++) for (let x = -((row % 2) * 40); x < W; x += 80) {
      const v = Math.floor(r() * 14) - 7;
      c.fillStyle = `rgb(${82 + v},${78 + v},${90 + v})`; c.fillRect(x + 2, y + 2, 76, 26);
      c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(x + 2, y + 2, 76, 3);
    }
    // manchas
    for (let i = 0; i < 9; i++) { const g = c.createRadialGradient(r() * W, 80 + r() * 300, 0, r() * W, 80 + r() * 300, 60 + r() * 60); g.addColorStop(0, 'rgba(30,25,20,.18)'); g.addColorStop(1, 'rgba(30,25,20,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 420); }
    // luz e sombra na parede
    const wl = c.createRadialGradient(440, 260, 60, 440, 260, 620); wl.addColorStop(0, 'rgba(255,220,150,.10)'); wl.addColorStop(1, 'rgba(0,0,0,.38)');
    c.fillStyle = wl; c.fillRect(0, 40, W, 360);
    const wt = c.createLinearGradient(0, 40, 0, 120); wt.addColorStop(0, 'rgba(0,0,0,.45)'); wt.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = wt; c.fillRect(0, 40, W, 80);
    // rachaduras
    c.strokeStyle = 'rgba(20,16,24,.45)'; c.lineWidth = 1.5;
    [[250, 70, 6], [620, 300, 5], [80, 60, 4]].forEach(([x, y, n]) => { c.beginPath(); c.moveTo(x, y); let px = x, py = y; for (let i = 0; i < n; i++) { px += r() * 18 - 6; py += 8 + r() * 10; c.lineTo(px, py); } c.stroke(); });
    // teto e canos
    c.fillStyle = '#26232d'; c.fillRect(0, 0, W, 42);
    c.lineWidth = 2.5; c.strokeStyle = OUT;
    rr(c, -10, 18, W + 20, 14, 7); paint(c, '#7c8a96'); rr(c, -10, 50, 380, 10, 5); paint(c, '#9c6b4a');
    [120, 360, 610, 860].forEach(x => { rr(c, x, 14, 14, 22, 3); paint(c, '#5c6670'); });
    rr(c, 900, 40, 12, 200, 6); paint(c, '#7c8a96');
    // duto de ventilação
    rr(c, 680, 58, 70, 34, 4); paint(c, '#8d96a0'); c.fillStyle = '#1d1b22'; for (let i = 0; i < 5; i++) c.fillRect(688, 64 + i * 5.5, 54, 3);
    // piso
    const fg = c.createLinearGradient(0, 400, 0, H); fg.addColorStop(0, '#6d6658'); fg.addColorStop(1, '#4a4438');
    c.fillStyle = fg; c.fillRect(0, 400, W, H - 400);
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1;
    for (let x = -400; x < W + 400; x += 70) { c.beginPath(); c.moveTo(480 + (x - 480) * .7, 400); c.lineTo(480 + (x - 480) * 1.5, H); c.stroke(); }
    [430, 470, 520].forEach(y => { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); });
    c.fillStyle = '#2b2730'; c.fillRect(0, 396, W, 8);
    // listras de segurança
    c.save(); c.beginPath(); c.rect(0, 404, W, 10); c.clip();
    for (let x = -20; x < W; x += 28) { c.fillStyle = '#e1b12c'; c.beginPath(); c.moveTo(x, 414); c.lineTo(x + 14, 414); c.lineTo(x + 24, 404); c.lineTo(x + 10, 404); c.fill(); }
    c.restore();
    // sombra no rodapé e detalhes do piso
    const ao = c.createLinearGradient(0, 414, 0, 470); ao.addColorStop(0, 'rgba(0,0,0,.35)'); ao.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = ao; c.fillRect(0, 414, W, 56);
    for (let i = 0; i < 6; i++) { const g2 = c.createRadialGradient(80 + r() * 800, 450 + r() * 80, 0, 80 + r() * 800, 450 + r() * 80, 30 + r() * 40); g2.addColorStop(0, 'rgba(25,20,15,.25)'); g2.addColorStop(1, 'rgba(25,20,15,0)'); c.fillStyle = g2; c.fillRect(0, 400, W, 140); }
    circ(c, 660, 505, 14); c.fillStyle = '#3a352c'; c.fill(); c.strokeStyle = '#2a261f'; c.lineWidth = 2; for (let i = -10; i <= 10; i += 5) { c.beginPath(); c.moveTo(660 + i, 494); c.lineTo(660 + i, 516); c.stroke(); }
    [[130, 470, .3], [880, 520, -.4], [600, 530, .1]].forEach(([x, y, a]) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#e8e2d0'; c.fillRect(-14, -9, 28, 18); c.fillStyle = 'rgba(0,0,0,.15)'; for (let k = -5; k < 8; k += 4) c.fillRect(-10, k, 20, 1.5); c.restore(); });
    c.strokeStyle = OUT; c.lineWidth = 3;
    // câmara fria (porta)
    c.lineWidth = 3; c.strokeStyle = OUT;
    rr(c, 22, 120, 156, 282, 6); paint(c, '#5f6b77');
    rr(c, 32, 130, 136, 268, 4); paint(c, '#aebccb');
    for (let y = 140; y < 390; y += 22) { c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(36, y, 128, 2); }
    rr(c, 62, 156, 76, 58, 6); paint(c, '#1e3346');
    rr(c, 140, 250, 18, 54, 6); paint(c, '#d0d6dc');
    c.fillStyle = 'rgba(220,240,255,.6)'; for (let i = 0; i < 26; i++) { circ(c, 36 + r() * 128, 130 + r() * 30, 2 + r() * 5); c.fill(); }
    rr(c, 50, 94, 100, 22, 3); paint(c, '#1c4e80');
    c.fillStyle = '#fff'; c.font = 'bold 12px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CÂMARA FRIA', 100, 105);
    // estante
    c.lineWidth = 3;
    rr(c, 196, 96, 10, 304, 2); paint(c, '#6b4a2f'); rr(c, 466, 96, 10, 304, 2); paint(c, '#6b4a2f');
    [175, 260, 345].forEach(y => { rr(c, 190, y, 292, 11, 2); paint(c, '#8a5f3c'); });
    // quadro de cortiça
    rr(c, 500, 96, 152, 104, 4); paint(c, '#8a5a2b'); rr(c, 508, 104, 136, 88, 2); paint(c, '#c79a62');
    c.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 60; i++) c.fillRect(508 + r() * 136, 104 + r() * 88, 2, 2);
    // porta de aço
    rr(c, 772, 102, 176, 300, 4); paint(c, '#3a3f47');
    rr(c, 786, 112, 148, 288, 2); paint(c, '#9aa3ad');
    for (let y = 118; y < 398; y += 12) { c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(788, y, 144, 2); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(788, y + 2, 144, 1); }
    rr(c, 840, 386, 40, 10, 3); paint(c, '#555');
    circ(c, 860, 232, 9); paint(c, '#222'); circ(c, 860, 232, 4); paint(c, '#7fb4d8', false);
    // caixote (mesa)
    rr(c, 540, 380, 120, 60, 4); paint(c, '#a5774b');
    c.beginPath(); c.moveTo(546, 386); c.lineTo(654, 434); c.moveTo(654, 386); c.lineTo(546, 434); c.stroke();
    rr(c, 532, 372, 136, 12, 3); paint(c, '#b9895a');
    // cartaz da Serenitá (rasgado)
    c.save(); c.translate(666, 178); c.rotate(-.04);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(76, 0); c.lineTo(76, 62); c.lineTo(60, 70); c.lineTo(66, 84); c.lineTo(0, 84); c.closePath(); paint(c, '#2f9e63');
    c.fillStyle = '#eafff0'; c.font = '13px Bungee, sans-serif'; c.textAlign = 'center'; c.fillText('SERENITÁ', 38, 18);
    c.fillStyle = '#fff'; circ(c, 38, 46, 16); c.fill(); c.fillStyle = OUT; circ(c, 32, 42, 2); c.fill(); circ(c, 44, 42, 2); c.fill();
    c.lineWidth = 2; c.beginPath(); c.arc(38, 47, 8, .15 * Math.PI, .85 * Math.PI); c.stroke();
    c.fillStyle = '#eafff0'; c.font = 'bold 8px Inter, sans-serif'; c.fillText('BEBA A CALMA', 38, 76);
    c.fillStyle = '#d9cfb3'; circ(c, 6, 6, 3); c.fill(); circ(c, 70, 6, 3); c.fill();
    c.restore();
    // relógio parado às 21h50
    c.lineWidth = 3; c.strokeStyle = OUT; circ(c, 596, 70, 18); paint(c, '#f4efe2'); circ(c, 596, 70, 2.5); paint(c, OUT, false);
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(596, 70); c.lineTo(596 + Math.cos(-Math.PI / 2 + 2 * Math.PI * (9.83 / 12)) * 9, 70 + Math.sin(-Math.PI / 2 + 2 * Math.PI * (9.83 / 12)) * 9); c.moveTo(596, 70); c.lineTo(596 + Math.cos(-Math.PI / 2 + 2 * Math.PI * (50 / 60)) * 13, 70 + Math.sin(-Math.PI / 2 + 2 * Math.PI * (50 / 60)) * 13); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(584, 58); c.lineTo(608, 82); c.stroke();
    // fios pendurados
    c.strokeStyle = '#1b1820'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(150, 42); c.bezierCurveTo(170, 80, 220, 80, 240, 42); c.stroke();
    c.beginPath(); c.moveTo(760, 42); c.bezierCurveTo(780, 70, 820, 72, 840, 42); c.stroke();
  },

  layout(t) {
    const list = home();
    const n = list.length, out = [];
    const x0 = 250, x1 = 720;
    list.forEach((m, i) => {
      const x = n === 1 ? 480 : x0 + (x1 - x0) * (i / (n - 1));
      const y = (i % 2 && n > 4) ? 518 : 492;
      out.push({ m, x, y });
    });
    return out;
  },

  loop(now) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    if (Screen.cur === 'shelter' && G && !G.over) this.draw(now / 1000, dt);
    if (this.peep && modalOpen() && this.peep.cv && this.peep.cv.isConnected) this.drawPeep(now / 1000);
    requestAnimationFrame(t => this.loop(t));
  },

  draw(t, dt) {
    const c = this.ctx, W = 960, H = 540;
    this.fit();
    const LW = this.LW, LH = this.LH, ox = this.ox, oy = this.oy;
    if (this.night) { this.night.t += dt; if (this.night.done && this.night.doneAt === undefined) this.night.doneAt = this.night.t; }
    const nightK = this.night ? Math.min(1, this.night.t / .8) * (this.night.done ? Math.max(0, 1 - (this.night.t - this.night.doneAt) / .8) : 1) : 0;
    this.knock = Math.max(0, this.knock - dt * 1.5); this.hammer = Math.max(0, this.hammer - dt * 2);
    const pendingKnock = G.today.visitor && !G.today.doorDone;
    c.setTransform(1, 0, 0, 1, 0, 0);
    this.drawMargins(c, LW, LH, ox, oy);
    const kk = this.k || 1;
    c.setTransform(kk, 0, 0, kk, ox * kk, oy * kk);
    c.drawImage(this.bg, 0, 0);
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 2.5;

    /* escritos na parede */
    c.save(); c.fillStyle = 'rgba(240,240,230,.75)'; c.font = '22px "Permanent Marker", "Patrick Hand", cursive'; c.textAlign = 'left';
    c.fillText(`DIA ${G.day}`, 520, 238);
    c.strokeStyle = 'rgba(240,240,230,.7)'; c.lineWidth = 2.2;
    for (let i = 0; i < G.day; i++) { const gx = 520 + Math.floor(i / 5) * 34, k = i % 5; c.beginPath(); if (k < 4) { c.moveTo(gx + k * 6, 252); c.lineTo(gx + k * 6 + 1, 280); } else { c.moveTo(gx - 3, 276); c.lineTo(gx + 24, 256); } c.stroke(); }
    if (G.flags.evac) { c.font = '17px "Permanent Marker", cursive'; c.fillStyle = 'rgba(255,230,120,.8)'; c.fillText('FREQ. 7150!!', 680, 300); }
    if (G.rescueDay) { c.font = '17px "Permanent Marker", cursive'; c.fillStyle = 'rgba(140,255,170,.85)'; c.fillText(`RESGATE DIA ${G.rescueDay}`, 664, 324); }
    c.restore();
    c.strokeStyle = OUT; c.lineWidth = 2.5;

    /* mapa da manutenção */
    if (G.flags.mapa) { c.save(); c.translate(690, 120); c.rotate(.05); rr(c, 0, 0, 62, 46, 2); paint(c, '#3b6ea5'); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; c.strokeRect(6, 6, 50, 34); c.beginPath(); c.moveTo(6, 22); c.lineTo(56, 22); c.moveTo(30, 6); c.lineTo(30, 40); c.stroke(); c.restore(); c.strokeStyle = OUT; c.lineWidth = 2.5; }

    /* quadro: documentos */
    G.notes.slice(0, 6).forEach((id, i) => { c.save(); c.translate(522 + (i % 3) * 42, 112 + Math.floor(i / 3) * 40); c.rotate((i % 2 ? .08 : -.06)); drawItem(c, 'nota', 14, 16, 34); c.restore(); });
    if (has('chaves')) drawItem(c, 'chaves', 760, 200, 30);

    /* estante */
    let x = 214;
    [['remedio', Math.min(G.inv.remedio, 4), 24], ['pilhas', Math.min(G.inv.pilhas, 4), 22], ['mascara', Math.min(G.inv.mascara, 2), 24], ['kit', Math.min(G.inv.kit, 2), 24], ['soro', Math.min(G.inv.soro, 3), 24], ['termometro', G.inv.termometro ? 1 : 0, 26], ['lanterna', G.inv.lanterna ? 1 : 0, 28], ['amostra', G.inv.amostra ? 1 : 0, 24]].forEach(([k, n, s]) => {
      for (let i = 0; i < n; i++) { if (x > 458) return; drawItem(c, k, x + s / 2, 175 - s / 2 + 2, s); x += s * .82; }
      if (n) x += 5;
    });
    const nc = Math.min(G.inv.comida, 16);
    for (let i = 0; i < nc; i++) { const row = i < 8 ? 0 : 1, col = i % 8; drawItem(c, 'comida', 222 + col * 31, 260 - 15 - row * 27, 30); }
    if (G.inv.comida > 16) chalk(c, `+${G.inv.comida - 16}`, 445, 210);
    const na = Math.min(G.inv.agua, 6);
    for (let i = 0; i < na; i++) drawItem(c, 'agua', 226 + i * 42, 345 - 20, 40);
    if (G.inv.agua > 6) chalk(c, `+${G.inv.agua - 6}`, 450, 300);
    if (!G.inv.comida) chalk(c, 'sem comida', 280, 238);
    if (!G.inv.agua) chalk(c, 'sem água', 290, 322);
    for (let i = 0; i < Math.min(G.inv.cobertor, 4); i++) drawItem(c, 'cobertor', 185, 412 - i * 12, 34);
    for (let i = 0; i < Math.min(G.inv.tabuas, 6); i++) { c.save(); c.translate(742 + i * 5, 330); c.rotate(.08 + i * .03); rr(c, -6, -60, 12, 120, 2); paint(c, i % 2 ? '#c08a52' : '#b07b45'); c.restore(); }
    if (has('marreta')) { c.save(); c.translate(712, 360); c.rotate(.3); drawItem(c, 'marreta', 0, 0, 56); c.restore(); }
    if (has('radio')) drawItem(c, 'radio', 580, 352, 50, { on: !!G.rescueDay || Math.sin(t * 3) > .7 });
    if (has('videogame')) drawItem(c, 'videogame', 638, 360, 30);
    if (has('chaves') && G.carReady) chalk(c, 'G2 →', 740, 240);

    /* porta: barricada e batidas */
    const shake = (this.knock > 0 || (pendingKnock && (t % 3) < .45)) ? Math.sin(t * 60) * 3 : 0;
    c.save(); c.translate(shake, 0);
    for (let i = 0; i < G.barricade; i++) {
      c.save(); c.translate(860, 150 + i * 52); c.rotate(i % 2 ? .12 : -.12); if (this.hammer && i === G.barricade - 1) c.translate(0, -this.hammer * 8);
      rr(c, -88, -10, 176, 20, 3); paint(c, i % 2 ? '#c08a52' : '#a87240');
      c.fillStyle = '#444'; circ(c, -76, 0, 2.5); c.fill(); circ(c, 76, 0, 2.5); c.fill(); c.restore();
    }
    c.restore();
    if (pendingKnock) {
      const k = (t % 3) < .9;
      if (k) { c.save(); c.translate(860, 90); c.rotate(-.1); c.font = '26px Bungee, sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = '#1d1724'; c.strokeText('TOC TOC', 0, 0); c.fillStyle = '#ffd23f'; c.fillText('TOC TOC', 0, 0); c.restore(); c.strokeStyle = OUT; c.lineWidth = 2.5; }
      drawItem(c, 'question', 860, 232 + Math.sin(t * 4) * 3, 30);
    }

    /* câmara fria: silhueta */
    const q = G.members.filter(m => m.alive && m.quar);
    if (q.length) {
      c.save(); rr(c, 62, 156, 76, 58, 6); c.clip();
      c.fillStyle = 'rgba(120,180,230,.5)'; c.fillRect(62, 156, 76, 58);
      drawChar(c, 100, 250, .95, q[0].look, { t, shadow: false, pose: 'hug', expr: q[0].infected && q[0].stage >= 3 ? 'smile' : 'scared', pale: .5 });
      c.restore();
      if (Math.random() < .3) this.frost = (this.frost || 0) + 1;
      chalk(c, `${q.map(m => m.name).join(', ')}`, 100, 236, '#dff3ff', 13);
    }

    /* câmara fria trancada: corrente e cadeado */
    if (!G.flags.freezer) {
      c.save(); c.strokeStyle = '#8d939a'; c.lineWidth = 5; c.setLineDash([7, 4]);
      c.beginPath(); c.moveTo(36, 250); c.quadraticCurveTo(100, 300, 164, 250); c.stroke(); c.setLineDash([]);
      c.strokeStyle = OUT; c.lineWidth = 2.5; c.restore();
      drawItem(c, 'lock', 100, 288, 34);
      if (G.day === 1 || (G.day === 2 && !G.today.eventDone)) { const k = (t % 4) < .5; if (k) { c.save(); c.font = '15px "Permanent Marker", cursive'; c.fillStyle = '#cfe8ff'; c.textAlign = 'center'; c.fillText('toc... toc...', 100, 340); c.restore(); } }
    }
    /* poeira no facho de luz */
    if (!this.night) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) { const py = 130 + ((t * (6 + i % 5) + i * 37) % 300), spread = (py - 116) * .9; const px = 430 + Math.sin(i * 12.9 + t * .4) * spread * .8; c.fillStyle = `rgba(255,240,200,${.12 + (i % 3) * .05})`; circ(c, px, py, 1.2 + (i % 3) * .5); c.fill(); }
      c.restore();
    }
    /* luminária */
    const flick = this.night ? 0 : (Math.random() < .015 ? .3 : 1);
    c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(430, 42); c.lineTo(430, 92); c.stroke();
    c.lineWidth = 2.5; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(406, 112); c.lineTo(454, 112); c.lineTo(442, 92); c.lineTo(418, 92); c.closePath(); paint(c, '#2f6f4f');
    circ(c, 430, 116, 6); paint(c, flick > .5 ? '#fff6c8' : '#776');

    /* personagens */
    this.hits = [];
    const lay = this.layout(t);
    // cachorro
    if (G.dog) {
      let dx = 740, dy = 512, flip = false, growl = false, pose = 'lie';
      const w = G.dog.watch && lay.find(l => l.m.id === G.dog.watch);
      if (w && !this.night) { dx = w.x + 46; dy = w.y + 26; flip = true; growl = Math.sin(t * 2) > .3; pose = 'stand'; }
      drawDog(c, dx, dy, .9, { t, pose, flip, growl, happy: G.dog.fed, sleep: !!this.night });
      if (growl) drawItem(c, 'bang', dx - 30, dy - 54, 18);
      this.hits.push({ x: dx - 30, y: dy - 40, w: 60, h: 44, dog: true });
    }
    lay.sort((a, b) => a.y - b.y).forEach(({ m, x, y }) => {
      const o = memberVisual(m, t + m.id, false);
      const lying = this.night || m.health <= 1 || (m.sick && m.health <= 2);
      if (lying) { o.pose = 'lie'; if (this.night) o.expr = (m.infected && m.stage >= 3 && Math.sin(t + m.id) > 0) ? 'smile' : 'sleep'; rr(c, x - 52, y - 8, 104, 14, 4); paint(c, '#8b7d6b'); }
      else if (m.stress >= 75 && (!m.infected || m.stage < 3)) o.pose = 'hug';
      else if (m.id % 3 === 0) o.pose = 'sit';
      if (m.infected && m.stage >= 4 && !lying) o.flip = true;
      const sel = this.hover === m.id;
      if (sel) { c.save(); c.strokeStyle = '#ffd23f'; c.lineWidth = 3; ell(c, x, y + 2, 34, 9); c.stroke(); c.restore(); }
      const CS = 1.5;
      if (o.pose === 'sit' || o.pose === 'hug') { rr(c, x - 28, y - 22, 56, 24, 3); paint(c, '#9b6e44'); o.shadow = false; }
      drawChar(c, x, lying ? y : (o.pose === 'sit' || o.pose === 'hug' ? y - 16 : y), CS, m.look, o);
      // ícones de status
      const icons = [];
      if (m.thirst >= 2) icons.push('agua'); if (m.hunger >= 3) icons.push('comida');
      if (m.injured) icons.push('injured'); if (m.sick) icons.push('sick'); if (m.stress >= 75) icons.push('stress');
      const topY = lying ? y - 44 : y - 82 * CS;
      icons.forEach((k, i) => drawItem(c, k, x - (icons.length - 1) * 11 + i * 22, topY, 20));
      if (this.night && !this.night.done) drawItem(c, 'zzz', x + 18, y - 44 - ((t * 20 + m.id * 9) % 20), 22);
      if (m.isPlayer && !lying) { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(x - 7, topY - 18); c.lineTo(x + 7, topY - 18); c.lineTo(x, topY - 9); c.fill(); }
      if (sel) { outlineText(c, m.name, x, topY - 30, '#fff', 14); }
      this.hits.push({ x: x - 36, y: lying ? y - 44 : y - 76 * CS, w: 72, h: lying ? 54 : 78 * CS, m });
    });

    /* luz */
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (!this.night && flick > .5) {
      const g = c.createRadialGradient(430, 120, 10, 430, 380, 360); g.addColorStop(0, 'rgba(255,230,160,.22)'); g.addColorStop(1, 'rgba(255,230,160,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(410, 116); c.lineTo(450, 116); c.lineTo(760, 540); c.lineTo(100, 540); c.closePath(); c.fill();
    }
    if (q.length) { const g2 = c.createRadialGradient(100, 185, 5, 100, 185, 90); g2.addColorStop(0, 'rgba(120,200,255,.25)'); g2.addColorStop(1, 'rgba(120,200,255,0)'); c.fillStyle = g2; c.fillRect(0, 90, 200, 200); }
    if (G.inv.soro) { const g3 = c.createRadialGradient(380, 160, 2, 380, 160, 50); g3.addColorStop(0, 'rgba(80,255,220,.25)'); g3.addColorStop(1, 'rgba(80,255,220,0)'); c.fillStyle = g3; c.fillRect(320, 100, 120, 120); }
    c.restore();
    // vinheta
    c.save(); const vg = c.createRadialGradient(480, 300, 260, 480, 300, 640); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); c.fillStyle = vg; c.fillRect(-ox, -oy, LW, LH); c.restore();

    /* noite */
    if (nightK > 0) {
      c.fillStyle = `rgba(6,10,30,${.78 * nightK})`; c.fillRect(-ox, -oy, LW, LH);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(120,150,255,${.08 * nightK})`; c.beginPath(); c.moveTo(690, 92); c.lineTo(740, 92); c.lineTo(820, 540); c.lineTo(560, 540); c.closePath(); c.fill();
      c.restore();
      c.globalAlpha = nightK;
      outlineText(c, this.night.done ? 'Amanhece.' : `Noite do dia ${G.day}`, W / 2, 60, '#cfe2ff', 26, 'Bungee');
      c.globalAlpha = 1;
    }
    if (this.msgT > 0) { this.msgT -= dt; c.globalAlpha = Math.min(1, this.msgT); bubbleWide(c, W / 2, 470, this.msg); c.globalAlpha = 1; }
  },

  drawPeep(t) {
    const { v, cv } = this.peep;
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b2230'); g.addColorStop(1, '#0c0f16');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,80,140,.25)'; c.fillRect(20, 30, 70, 16);
    c.fillStyle = 'rgba(45,226,198,.18)'; c.fillRect(160, 50, 60, 12);
    const look = visitorLook(v);
    const o = visitorVisual(v, t);
    const sc = 3.2 * (look.body === 'kid' ? 1.15 : 1);
    drawChar(c, W / 2, H * .45 + 52 * sc * (look.body === 'kid' ? .8 : 1), sc, look, Object.assign(o, { shadow: false }));
    // olho mágico: distorção e vinheta
    const vg = c.createRadialGradient(W / 2, H / 2, W * .25, W / 2, H / 2, W * .52);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(.8, 'rgba(0,0,0,.6)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.08)'; ell(c, W * .36, H * .3, 40, 22, -.6); c.fill();
    c.fillStyle = 'rgba(255,200,120,.06)'; c.fillRect(0, 0, W, H);
  },
};

function chalk(c, text, x, y, color = 'rgba(240,240,230,.8)', size = 16) {
  c.save(); c.font = `${size}px "Permanent Marker", "Patrick Hand", cursive`; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y); c.restore();
}
function bubbleWide(c, x, y, text) {
  c.font = 'bold 15px Inter, sans-serif';
  const w = Math.min(820, c.measureText(text).width + 32);
  rr(c, x - w / 2, y - 22, w, 40, 12); c.fillStyle = 'rgba(255,253,245,.96)'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = OUT; c.stroke();
  c.fillStyle = OUT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y - 2);
}

/* interação com a cena */
function roomPoint(e) {
  const r = Room.cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * Room.LW / r.width - Room.ox, y: (e.clientY - r.top) * Room.LH / r.height - Room.oy };
}
function roomHit(p) {
  for (let i = Room.hits.length - 1; i >= 0; i--) { const h = Room.hits[i]; if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) return h; }
  if (p.x > 772 && p.x < 948 && p.y > 100 && p.y < 402) return { door: true };
  if (p.x > 22 && p.x < 178 && p.y > 120 && p.y < 402) return { freezer: true };
  if (p.x > 500 && p.x < 652 && p.y > 96 && p.y < 200) return { board: true };
  if (p.x > 190 && p.x < 482 && p.y > 96 && p.y < 400) return { shelf: true };
  if (p.x > 532 && p.x < 668 && p.y > 320 && p.y < 440) return { table: true };
  return null;
}
function roomClick(e) {
  if (!G || G.over || Room.night) return;
  const h = roomHit(roomPoint(e));
  if (!h) return;
  Sound.play('click');
  if (h.m) return memberModal(h.m);
  if (h.dog) { Sound.play('bark'); Room.flash(G.dog.watch ? 'O Caramelo não tira os olhos de alguém...' : 'O Caramelo abana o rabo. Bom garoto.'); return; }
  if (h.door) { if (G.today.visitor && !G.today.doorDone) return openDoor(); Room.flash(`Barricada: ${G.barricade}/5. A porta aguenta... por enquanto.`); G.tab = 'base'; renderJournal(); return; }
  if (h.freezer) { G.tab = 'base'; renderJournal(); Room.flash(G.flags.freezer ? 'A câmara fria. Quem entra, se revela.' : 'Trancada com um cadeado velho. Tem alguém batendo lá dentro, bem fraquinho.'); return; }
  if (h.board) { G.tab = 'arquivo'; renderJournal(); return; }
  if (h.shelf) { G.tab = 'racao'; renderJournal(); return; }
  if (h.table) { G.tab = 'base'; renderJournal(); return; }
}
function roomMove(e) {
  if (!G || !Room.cv) return;
  const h = roomHit(roomPoint(e));
  Room.hover = h && h.m ? h.m.id : null;
  Room.cv.style.cursor = h ? 'pointer' : 'default';
}
