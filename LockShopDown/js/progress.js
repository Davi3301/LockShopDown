'use strict';
/* =========================================================
   LOCKSHOPDOWN — progresso salvo entre partidas
   conquistas, documentos encontrados, finais vistos, recordes
   ========================================================= */

const Progress = {
  data: null,
  load() {
    const d = Prefs.get('progress', null) || {};
    this.data = {
      ach: d.ach || {}, notes: d.notes || [], endings: d.endings || {},
      rec: Object.assign({ runs: 0, games: 0, bestDay: 0, bestRescued: 0, bestItems: 0, caught: 0, cured: 0, notesTotal: 0 }, d.rec || {}),
    };
  },
  save() { Prefs.set('progress', this.data); },
  unlock(id) {
    if (!ACHIEVEMENTS[id] || this.data.ach[id]) return;
    this.data.ach[id] = Date.now(); this.save();
    achToast(ACHIEVEMENTS[id]);
    if (id !== 'collector' && Object.keys(ENDINGS).every(e => this.data.endings[e])) this.unlock('collector');
  },
  note(id) {
    if (!this.data.notes.includes(id)) { this.data.notes.push(id); this.save(); }
    if (Object.keys(NOTES).every(n => this.data.notes.includes(n))) this.unlock('historian');
  },
  ending(id) {
    if (!ENDINGS[id]) return;
    const first = !this.data.endings[id];
    this.data.endings[id] = (this.data.endings[id] || 0) + 1; this.save();
    if (Object.keys(ENDINGS).every(e => this.data.endings[e])) this.unlock('collector');
    return first;
  },
  max(key, v) { if (v > (this.data.rec[key] || 0)) { this.data.rec[key] = v; this.save(); return true; } return false; },
  add(key, v = 1) { this.data.rec[key] = (this.data.rec[key] || 0) + v; this.save(); },
};
Progress.load();

const achQueue = [];
function achToast(a) {
  achQueue.push(a);
  if (achQueue.length === 1) showNextAch();
}
function showNextAch() {
  const a = achQueue[0]; if (!a) return;
  const el = $('#achToast');
  el.innerHTML = `<span class="ach-medal">${medalSVG(true)}</span><div><small>Conquista desbloqueada</small><b>${a.t}</b><span>${a.d}</span></div>`;
  el.classList.add('show'); Sound.play('good');
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => { achQueue.shift(); showNextAch(); }, 400); }, 3200);
}
function medalSVG(on) {
  return `<svg viewBox="0 0 40 48" width="34" height="40"><path d="M10 0h8l4 14h-8zM30 0h-8l-4 14h8z" fill="${on ? '#e84393' : '#555'}"/><circle cx="20" cy="30" r="15" fill="${on ? '#ffd23f' : '#3a3848'}" stroke="#1d1724" stroke-width="3"/><circle cx="20" cy="30" r="9" fill="none" stroke="${on ? '#e1a500' : '#4a4858'}" stroke-width="2.5"/>${on ? '<path d="M15 30l4 4 7-8" stroke="#1d1724" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '<text x="20" y="35" font-size="14" text-anchor="middle" fill="#6a6878" font-family="Inter" font-weight="800">?</text>'}</svg>`;
}

/* ---------------- tela de extras ---------------- */
const Extras = {
  tab: 'ach', from: 'title',
  open(from) { this.from = from || 'title'; Screen.show('extras'); this.render(); },
  render() {
    const P = Progress.data;
    const tabs = [['ach', 'Conquistas'], ['notes', 'Arquivos da história'], ['endings', 'Finais'], ['rec', 'Recordes']];
    $('#exTabs').innerHTML = tabs.map(([id, n]) => `<button class="extab ${this.tab === id ? 'on' : ''}" data-act="exTab" data-t="${id}">${n}</button>`).join('');
    let h = '';
    if (this.tab === 'ach') {
      const ids = Object.keys(ACHIEVEMENTS), got = ids.filter(i => P.ach[i]).length;
      h = `<div class="ex-count">${got} de ${ids.length} conquistas</div><div class="ach-grid">` + ids.map(id => {
        const a = ACHIEVEMENTS[id], on = !!P.ach[id];
        return `<div class="ach ${on ? 'on' : ''}">${medalSVG(on)}<div><b>${a.t}</b><span>${a.d}</span></div></div>`;
      }).join('') + '</div>';
    }
    if (this.tab === 'notes') {
      const ids = Object.keys(NOTES), got = ids.filter(i => P.notes.includes(i)).length;
      h = `<div class="ex-count">${got} de ${ids.length} documentos</div><div class="note-list">` + ids.map((id, i) => {
        const on = P.notes.includes(id);
        return on ? `<details class="ex-note"><summary><span class="num">${String(i + 1).padStart(2, '0')}</span>${icon('nota', 22)} ${NOTES[id].t}</summary><p>${NOTES[id].x}</p></details>`
          : `<div class="ex-note locked"><span class="num">${String(i + 1).padStart(2, '0')}</span>${icon('lock', 20)} <i>Documento não encontrado</i><small>Onde procurar: ${NOTE_HINTS[id]}</small></div>`;
      }).join('') + '</div>';
    }
    if (this.tab === 'endings') {
      const ids = Object.keys(ENDINGS), got = ids.filter(i => P.endings[i]).length;
      h = `<div class="ex-count">${got} de ${ids.length} finais</div><div class="end-grid">` + ids.map(id => {
        const e = ENDINGS[id], n = P.endings[id];
        return `<div class="endc ${n ? 'on' : ''}"><b>${n ? e.t : '???'}</b><span>${n ? `Visto ${n}x` : 'Pista: ' + e.h}</span></div>`;
      }).join('') + '</div>';
    }
    if (this.tab === 'rec') {
      const r = P.rec;
      const rows = [['Explorações feitas', r.runs], ['Partidas terminadas', r.games], ['Mais dias sobrevividos', r.bestDay], ['Mais pessoas resgatadas', r.bestRescued], ['Mais itens numa exploração', r.bestItems], ['Infectados desmascarados (total)', r.caught], ['Pessoas curadas (total)', r.cured], ['Documentos achados (total)', P.notes.length + ' / ' + Object.keys(NOTES).length]];
      h = `<div class="rec-list">${rows.map(([k, v]) => `<div class="rec"><span>${k}</span><b>${v}</b></div>`).join('')}</div>
        <div class="row center" style="margin-top:18px"><button class="btn ghost small-btn" data-act="exReset">Apagar progresso</button></div>`;
    }
    $('#exBody').innerHTML = h;
  },
};
