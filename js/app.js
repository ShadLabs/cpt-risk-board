// Main board page.
let state = loadState();
const watcher = makeClearWatcher();
const shiftData = () => state.shifts[state.shift];

function applyLang() {
  applyStaticText('pageTitle');
  $('langBtn').textContent = t('langBtn');
  $('langBtn').lang = lang === 'ar' ? 'en' : 'ar';
  $('dockLink').href = 'dock.html?lang=' + lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
}

// ---- Rendering ----
function remainCell(x) {
  const p = pct(x.packed, x.total);
  return `<div class="rem"><span class="rem-n">${fmt(x.remaining)}</span><span class="bar ${STATUS[x.status][0]}"><span style="width:${p}%"></span></span><span class="rem-p">${ltr(p + '%')}</span></div>`;
}
function renderBoard(r) {
  $('boardRows').innerHTML = r.rows.map(x => `
    <tr class="${x.past ? 'past' : ''} ${x.status === 'cleared' ? 'is-cleared' : ''}">
      <td class="route">${x.label}${x.packingNow ? `<span class="now-tag">${t('packingNow')}</span>` : ''}</td>
      <td class="n">${x.past ? '–' : countdown(x.msLeft)}</td>
      <td class="n">${fmt(x.total)}</td>
      <td class="n">${fmt(x.packed)}</td>
      <td>${remainCell(x)}</td>
      <td class="n">${showsBuffer(x) && x.finish ? hhmm(x.finish) : '–'}</td>
      <td class="n ${bufClass(x)}">${bufText(x)}</td>
      <td>${badge(x.status)}</td>
    </tr>`).join('') || `<tr><td colspan="8">${t('noCpts')}</td></tr>`;
}

function renderOverview(r) {
  let cls = '', title, text;
  if (!r.active.length) { title = t('vNoneTitle'); text = t('vNone'); cls = r.missed.length ? 'bad' : (r.withVol.length && r.clearedN === r.withVol.length ? 'ok' : ''); }
  else if (r.risk.length) { cls = 'bad'; title = t('vRiskTitle'); text = t('vRisk')(r.risk.length, fmt(r.unitsAtRisk), r.risk[0].label); }
  else if (r.watch.length) {
    cls = 'warn'; title = t('vWatchTitle');
    const tight = [...r.watch].sort((a, b) => a.buffer - b.buffer)[0];
    text = t('vWatch')(tight.label, Math.floor(tight.buffer));
  } else { cls = 'ok'; title = t('vOkTitle'); text = t('vOk')(r.active.length); }
  const missed = r.missed.length ? `<div class="warn-line">${t('vMissed')(r.missed.length)}</div>` : '';
  $('verdict').className = 'verdict ' + cls;
  $('verdict').innerHTML = `<span class="dot" aria-hidden="true"></span><div><div class="vt">${title}</div><p>${text}</p>${missed}</div>`;

  $('progressLine').innerHTML = `<div>${t('progress')(r.clearedN, r.withVol.length, fmt(r.packedUnits), fmt(r.totalUnits))}</div>
    <div class="bar big done"><span style="width:${pct(r.packedUnits, r.totalUnits)}%"></span></div>`;

  const next = r.active[0];
  const nextCls = next ? STATUS[next.status][0] : '';
  const hcCls = r.needed > r.packers || (r.unsavable && r.risk.length) ? 'bad' : 'ok';
  $('cards').innerHTML = `
    <div class="card ${nextCls}"><div class="k">${t('kNext')}</div>
      <div class="v">${next ? countdown(next.msLeft) : '–'}</div>
      <div class="s">${next ? t('kNextSub')(next.label, fmt(next.remaining)) : t('kNone')}</div></div>
    <div class="card ${r.risk.length ? 'bad' : (r.watch.length ? 'warn' : 'ok')}"><div class="k">${t('kRisk')}</div>
      <div class="v">${r.risk.length}</div><div class="s">${t('kRiskSub')(r.watch.length)}</div></div>
    <div class="card ${r.unitsAtRisk > 0 ? 'bad' : 'ok'}"><div class="k">${t('kUnits')}</div>
      <div class="v">${fmt(r.unitsAtRisk)}</div><div class="s">${t('kUnitsSub')(fmt(r.unitsLeft))}</div></div>
    <div class="card ${hcCls}"><div class="k">${t('kHc')}</div>
      <div class="v">${r.active.length ? r.needed : '–'}</div>
      <div class="s">${t('kHcSub')(r.packers)}${r.unsavable ? `<br>${t('kHcNa')}` : ''}</div></div>`;

  const acts = actionsFor(r);
  $('topActions').innerHTML = acts.length ? `<h3>${t('actionsTitle')}</h3><ul>${acts.map(a => `<li>${a}</li>`).join('')}</ul>` : '';
}

function renderHeader() {
  $('facilityName').textContent = `${String(state.facility || '').trim() || '—'} · ${shiftName(state)}`;
  document.querySelectorAll('.shift-tabs [data-shift]').forEach(b => {
    const on = b.dataset.shift === state.shift;
    b.classList.toggle('active', on); b.setAttribute('aria-selected', on);
  });
  $('schedHint').textContent = t('s3hint')(shiftName(state).toLowerCase());
  const pace = num(state.pace, 0, 200);
  const cap = Math.floor(num(state.packers, 0)) * num(state.rate, 0) * pace / 100;
  $('capLine').innerHTML = t('capLine')(fmt(Math.round(cap)), fmt(cap / 60, 1), fmt(pace));
  const sp = Math.max(1, num(state.speed, 1));
  $('speedBadge').hidden = sp <= 1;
  $('speedBadge').textContent = t('speedBadge')(sp);
}

// Runs every second: redraw with live counts, and celebrate any CPT that has just been cleared.
// (If a dock screen is open, it plays the sound so it isn't heard twice.)
function tick() {
  const { fresh, r } = watcher(state, new Date());
  $('clock').textContent = hhmm(r.now) + ':' + pad(r.now.getSeconds());
  renderBoard(r); renderOverview(r);
  // Keep the "Packed so far" boxes counting up, except the one being typed in.
  const byId = Object.fromEntries(r.rows.map(x => [x.id, x.packed]));
  document.querySelectorAll('#schedRows input[data-k=packed]').forEach(el => {
    const c = shiftData().cpts[+el.dataset.i];
    if (c && el !== document.activeElement && c.id in byId && String(byId[c.id]) !== el.value) el.value = byId[c.id];
  });
  fresh.forEach((row, i) => {
    const isLast = r.withVol.length > 0 && r.clearedN === r.withVol.length && i === fresh.length - 1;
    setTimeout(() => Celebrate.cleared(row, isLast, !dockIsOpen()), i * 1500);
  });
}

function update() { saveState(state); renderHeader(); tick(); }
// Before changing anything that affects counting, lock in what has been packed up to now.
const change = fn => { rebase(state, new Date()); fn(); update(); };

// ---- Inputs ----
const SETUP = ['facility', 'packers', 'rate', 'loadBuf', 'watchMin', 'pace', 'speed'];
function fillSetup() {
  SETUP.forEach(f => { $(f).value = state[f]; });
  $('auto').checked = state.auto !== false;
  $('shiftStart').value = shiftData().start;
}
SETUP.forEach(f => $(f).addEventListener('input', e => change(() => { state[f] = e.target.value; })));
$('auto').addEventListener('change', e => change(() => { state.auto = e.target.checked; }));
$('shiftStart').addEventListener('input', e => change(() => { shiftData().start = e.target.value; }));

function renderSchedule() {
  $('schedRows').innerHTML = shiftData().cpts.map((c, i) => `
    <tr>
      <td><input type="time" data-i="${i}" data-k="time" value="${esc(c.time)}" aria-label="${esc(t('thTime'))}"></td>
      <td><input type="number" min="0" step="100" data-i="${i}" data-k="total" value="${esc(c.total)}" aria-label="${esc(t('thTotalEdit'))}"></td>
      <td><input type="number" min="0" step="100" data-i="${i}" data-k="packed" value="${esc(Math.floor(num(c.packed, 0)))}" aria-label="${esc(t('thPackedEdit'))}"></td>
      <td><button class="small" data-clear="${i}">${t('markCleared')}</button></td>
      <td><button class="icon-btn" data-remove="${i}" aria-label="${esc(t('removeCpt'))}">✕</button></td>
    </tr>`).join('');
}
$('schedRows').addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.k) { Celebrate.unlockAudio(); change(() => { shiftData().cpts[+el.dataset.i][el.dataset.k] = el.value; }); }
});
$('schedRows').addEventListener('click', e => {
  const rm = e.target.closest('[data-remove]');
  const cl = e.target.closest('[data-clear]');
  if (rm) { change(() => { shiftData().cpts.splice(+rm.dataset.remove, 1); }); renderSchedule(); }
  if (cl) {
    Celebrate.unlockAudio();
    change(() => { const c = shiftData().cpts[+cl.dataset.clear]; c.packed = c.total; });
    renderSchedule();
  }
});
$('addCpt').addEventListener('click', () => {
  const list = shiftData().cpts;
  const last = list.length ? parseTime(list[list.length - 1].time) : parseTime(shiftData().start);
  const d = new Date(); d.setHours((last ? last.h : 0) + 2, last ? last.m : 0, 0, 0);
  change(() => list.push({ id: uid(), time: hhmm(d), total: 0, packed: 0 }));
  renderSchedule();
});

// ---- Buttons ----
document.querySelectorAll('.shift-tabs [data-shift]').forEach(b => b.addEventListener('click', () => {
  state.shift = b.dataset.shift; fillSetup(); renderSchedule(); update();
}));
$('resetBtn').addEventListener('click', () => {
  rebase(state, new Date());
  state.shifts[state.shift] = buildSample(state.shift, new Date(), state);
  fillSetup(); renderSchedule(); update();
});
$('langBtn').addEventListener('click', () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  applyLang(); renderSchedule(); update();
});

$('exportCsv').addEventListener('click', () => {
  const r = calc(state, new Date());
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const plain = h => String(h).replace(/<[^>]+>/g, '');
  const lines = [t('csvHeader'), ...r.rows.map(x => [
    state.facility, shiftName(state), plain(x.label), Math.round(x.msLeft / 60000), x.total, x.packed, x.remaining,
    showsBuffer(x) && x.finish ? hhmm(x.finish) : '', showsBuffer(x) ? Math.floor(x.buffer) : '',
    x.past ? (x.status === 'missed' ? x.remaining : 0) : (x.atRisk || 0), t(STATUS[x.status][1])
  ])];
  const csv = '﻿' + lines.map(l => l.map(q).join(',')).join('\n'); // BOM so Excel reads Arabic
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = t('csvFile'); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// Keep in sync if the board is open in another tab.
addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  const editing = document.activeElement && document.activeElement.tagName === 'INPUT';
  try { state = JSON.parse(e.newValue); } catch (err) { return; }
  if (!editing) { fillSetup(); renderSchedule(); }
  watcher(state, new Date()); // the other tab celebrates its own change
  renderHeader(); tick();
});

// ---- Start ----
applyLang();
fillSetup();
renderSchedule();
update();
setInterval(tick, 1000);
