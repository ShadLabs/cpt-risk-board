const KEY = 'cpt-risk-board-v1';
const LANG_KEY = 'cpt-risk-board-lang';
const $ = id => document.getElementById(id);

// ---- Helpers ----
const pad = n => String(n).padStart(2, '0');
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = n => (n > 0 ? '+' : '') + n;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nm = s => `<bdi>${esc(s)}</bdi>`;
const ltr = v => `<bdi dir="ltr">${v}</bdi>`;
const num = (v, min, max) => {
  let n = parseFloat(v); if (!isFinite(n)) n = 0;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
};
// Countdown as H:MM:SS, or -H:MM:SS once the CPT has passed.
function countdown(ms) {
  const neg = ms < 0; let s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return `${neg ? '−' : ''}${h}:${pad(m)}:${pad(s)}`;
}

// ---- Sample data: CPTs placed relative to the current time so the demo always looks live ----
function sample() {
  const base = new Date(); base.setSeconds(0, 0);
  base.setMinutes(Math.ceil(base.getMinutes() / 5) * 5);
  const at = mins => hhmm(new Date(base.getTime() + mins * 60000));
  return {
    packers: 20, rate: 160, loadBuf: 20, watchMin: 15,
    cpts: [
      { name: 'Riyadh North – Last mile', time: at(40), units: 900 },
      { name: 'Riyadh East – Last mile', time: at(75), units: 2600 },
      { name: 'Jeddah – Line haul', time: at(120), units: 1800 },
      { name: 'Dammam – Line haul', time: at(180), units: 1500 },
      { name: 'Riyadh South – Last mile', time: at(240), units: 2000 }
    ]
  };
}
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.cpts)) return s; } catch (e) {}
  return sample();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
let state = load();

// ---- Language ----
function initialLang() {
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'ar' || q === 'en') return q; } catch (e) {}
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'ar' || s === 'en') return s; } catch (e) {}
  return 'en';
}
let lang = initialLang();
const t = key => I18N[lang][key];
function applyLang() {
  const root = document.documentElement;
  root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('pageTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $('langBtn').textContent = t('langBtn');
  $('langBtn').lang = lang === 'ar' ? 'en' : 'ar';
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
}

// ---- CPT time: today's date, but a time more than 6 hours ago is treated as tomorrow ----
function cptDate(time, now) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(time || ''));
  if (!m) return null;
  const d = new Date(now); d.setHours(+m[1], +m[2], 0, 0);
  const diff = d - now;
  if (diff < -6 * 3600000) d.setDate(d.getDate() + 1);
  else if (diff > 18 * 3600000) d.setDate(d.getDate() - 1);
  return d;
}

// ---- Core calculation ----
function calc(now) {
  const packers = Math.floor(num(state.packers, 0));
  const rate = num(state.rate, 0);
  const loadBuf = num(state.loadBuf, 0, 600);
  const watchMin = num(state.watchMin, 0, 600);
  const capPerMin = packers * rate / 60;

  const rows = state.cpts.map((c, i) => ({
    i, name: String(c.name || '').trim() || t('unnamed'),
    date: cptDate(c.time, now), units: Math.floor(num(c.units, 0))
  })).filter(r => r.date).sort((a, b) => a.date - b.date);

  let cum = 0;
  for (const r of rows) {
    r.msLeft = r.date - now;
    if (r.msLeft <= 0) { r.past = true; r.status = r.units > 0 ? 'missed' : 'departed'; continue; }
    cum += r.units;
    r.cum = cum;
    r.deadline = new Date(r.date.getTime() - loadBuf * 60000);
    r.minsToDeadline = (r.deadline - now) / 60000;
    r.finishMins = capPerMin > 0 ? cum / capPerMin : Infinity;
    r.finish = isFinite(r.finishMins) ? new Date(now.getTime() + r.finishMins * 60000) : null;
    r.buffer = r.minsToDeadline - r.finishMins; // minutes
    const packable = capPerMin * Math.max(0, r.minsToDeadline);
    r.atRisk = Math.min(r.units, Math.max(0, Math.ceil(cum - packable)));
    r.reqPackers = r.minsToDeadline > 0 && rate > 0 ? Math.ceil(cum / (r.minsToDeadline * rate / 60) - 1e-9) : Infinity;
    if (r.units === 0) r.status = 'ready';
    else if (r.buffer < 0) r.status = 'risk';
    else if (r.buffer < watchMin) r.status = 'watch';
    else r.status = 'safe';
  }

  const future = rows.filter(r => !r.past);
  const active = future.filter(r => r.units > 0);
  const risk = active.filter(r => r.status === 'risk');
  const watch = active.filter(r => r.status === 'watch');
  const missed = rows.filter(r => r.status === 'missed');
  const unitsLeft = future.reduce((a, r) => a + r.units, 0);
  const unitsAtRisk = risk.reduce((a, r) => a + r.atRisk, 0);
  const finiteReq = active.map(r => r.reqPackers).filter(isFinite);
  const needed = finiteReq.length ? Math.max(...finiteReq) : packers;
  const unsavable = active.some(r => !isFinite(r.reqPackers)); // already inside the load window
  return { now, packers, rate, loadBuf, watchMin, capPerMin, rows, future, active, risk, watch, missed, unitsLeft, unitsAtRisk, needed, unsavable };
}

const STATUS = {
  safe: ['ok', 'stSafe'], watch: ['warn', 'stWatch'], risk: ['bad', 'stRisk'],
  missed: ['bad', 'stMissed'], departed: ['muted', 'stDeparted'], ready: ['ok', 'stReady']
};
const badge = s => `<span class="badge ${STATUS[s][0]}">${t(STATUS[s][1])}</span>`;
const bufText = r => (r.past || r.status === 'ready' || !isFinite(r.buffer)) ? '–' : `${ltr(signed(Math.floor(r.buffer)))} ${t('min')}`;
const bufClass = r => r.status === 'risk' ? 'neg' : r.status === 'watch' ? 'tight' : r.status === 'safe' ? 'pos' : '';

// ---- Rendering ----
function renderBoard(r) {
  $('boardRows').innerHTML = r.rows.map(x => `
    <tr class="${x.past ? 'past' : ''}">
      <td class="route">${nm(x.name)}</td>
      <td class="n">${hhmm(x.date)}</td>
      <td class="n">${countdown(x.msLeft)}</td>
      <td class="n">${fmt(x.units)}</td>
      <td class="n">${x.past || x.status === 'ready' ? '–' : (x.finish ? hhmm(x.finish) : '∞')}</td>
      <td class="n ${bufClass(x)}">${bufText(x)}</td>
      <td>${badge(x.status)}</td>
    </tr>`).join('') || `<tr><td colspan="7">${t('noCpts')}</td></tr>`;
}

function actionsFor(r) {
  const out = [];
  const late = r.risk.find(x => !isFinite(x.reqPackers));
  if (late) out.push(t('actLate')(nm(late.name)));
  if (r.risk.length && r.needed > r.packers) {
    const binding = r.risk.filter(x => isFinite(x.reqPackers)).sort((a, b) => b.reqPackers - a.reqPackers)[0];
    if (binding) out.push(t('actAdd')(r.needed - r.packers, nm(binding.name), hhmm(binding.deadline)));
  }
  const first = r.risk.find(x => isFinite(x.reqPackers));
  if (first) out.push(t('actEscalate')(fmt(first.atRisk), nm(first.name)));
  const tight = [...r.watch].sort((a, b) => a.buffer - b.buffer)[0];
  if (tight) out.push(t('actWatch')(nm(tight.name), Math.floor(tight.buffer)));
  return out.slice(0, 3);
}

function renderOverview(r) {
  let cls = '', title, text;
  if (!r.active.length) { title = t('vNoneTitle'); text = t('vNone'); }
  else if (r.risk.length) {
    cls = 'bad'; title = t('vRiskTitle');
    text = t('vRisk')(r.risk.length, fmt(r.unitsAtRisk), nm(r.risk[0].name));
  } else if (r.watch.length) {
    cls = 'warn'; title = t('vWatchTitle');
    const tight = [...r.watch].sort((a, b) => a.buffer - b.buffer)[0];
    text = t('vWatch')(r.watch.length, nm(tight.name), Math.floor(tight.buffer));
  } else { cls = 'ok'; title = t('vOkTitle'); text = t('vOk')(r.active.length); }
  const missed = r.missed.length ? `<div class="warn-line">${t('vMissed')(r.missed.length)}</div>` : '';
  $('verdict').className = 'verdict ' + cls;
  $('verdict').innerHTML = `<span class="dot" aria-hidden="true"></span><div><div class="vt">${title}</div><p>${text}</p>${missed}</div>`;

  const next = r.future[0];
  const nextCls = next ? (STATUS[next.status][0] === 'muted' ? '' : STATUS[next.status][0]) : '';
  const hcCls = r.unsavable && !r.risk.some(x => isFinite(x.reqPackers)) ? 'bad' : (r.needed > r.packers ? 'bad' : 'ok');
  $('cards').innerHTML = `
    <div class="card ${nextCls}"><div class="k">${t('kNext')}</div>
      <div class="v">${next ? countdown(next.msLeft) : '–'}</div>
      <div class="s">${next ? t('kNextSub')(nm(next.name), hhmm(next.date)) : t('kNone')}</div></div>
    <div class="card ${r.risk.length ? 'bad' : (r.watch.length ? 'warn' : 'ok')}"><div class="k">${t('kRisk')}</div>
      <div class="v">${r.risk.length}</div>
      <div class="s">${t('kRiskSub')(r.watch.length)}</div></div>
    <div class="card ${r.unitsAtRisk > 0 ? 'bad' : 'ok'}"><div class="k">${t('kUnits')}</div>
      <div class="v">${fmt(r.unitsAtRisk)}</div>
      <div class="s">${t('kUnitsSub')(fmt(r.unitsLeft))}</div></div>
    <div class="card ${hcCls}"><div class="k">${t('kHc')}</div>
      <div class="v">${Math.max(r.needed, 0)}</div>
      <div class="s">${t('kHcSub')(r.packers)}${r.unsavable ? `<br>${t('kHcNa')}` : ''}</div></div>`;

  const acts = actionsFor(r);
  $('topActions').innerHTML = acts.length ? `<h3>${t('actionsTitle')}</h3><ul>${acts.map(a => `<li>${a}</li>`).join('')}</ul>` : '';
}

function renderDock(r) {
  $('dockClock').textContent = hhmm(r.now) + ':' + pad(r.now.getSeconds());
  $('dockSummary').innerHTML = t('dockSummary')(r.risk.length, r.watch.length, fmt(r.unitsAtRisk));
  // Upcoming first, then the most recent departures.
  const list = [...r.future, ...r.rows.filter(x => x.past).reverse().slice(0, 2)];
  $('tiles').innerHTML = list.map(x => `
    <div class="tile ${STATUS[x.status][0]}">
      <div class="t-top"><div class="t-name">${nm(x.name)}</div><div class="t-cpt">${hhmm(x.date)}</div></div>
      <div class="t-count">${countdown(x.msLeft)}</div>
      <div class="t-meta"><span>${t('dockUnits')}: <b>${fmt(x.units)}</b></span><span>${t('dockBuffer')}: <b class="${bufClass(x)}">${bufText(x)}</b></span></div>
      ${badge(x.status)}
    </div>`).join('') || `<p>${t('noCpts')}</p>`;
}

function tick() {
  const r = calc(new Date());
  $('clock').textContent = hhmm(r.now) + ':' + pad(r.now.getSeconds());
  renderBoard(r);
  renderOverview(r);
  if (document.body.classList.contains('docked')) renderDock(r);
}
function update() { save(); renderSetup(); tick(); }

// ---- Inputs ----
const SETUP = ['packers', 'rate', 'loadBuf', 'watchMin'];
function fillSetup() { SETUP.forEach(f => { $(f).value = state[f]; }); }
SETUP.forEach(f => $(f).addEventListener('input', e => { state[f] = e.target.value; update(); }));
function renderSetup() {
  const cap = Math.floor(num(state.packers, 0)) * num(state.rate, 0);
  $('capLine').innerHTML = t('capLine')(fmt(cap), fmt(cap / 60, 1));
}

function renderSchedule() {
  $('schedRows').innerHTML = state.cpts.map((c, i) => `
    <tr>
      <td><input type="text" dir="auto" data-i="${i}" data-k="name" value="${esc(c.name)}" aria-label="${esc(t('thRoute'))}"></td>
      <td><input type="time" data-i="${i}" data-k="time" value="${esc(c.time)}" aria-label="${esc(t('thCpt'))}"></td>
      <td><input type="number" min="0" step="50" data-i="${i}" data-k="units" value="${esc(c.units)}" aria-label="${esc(t('thUnitsEdit'))}"></td>
      <td><button class="icon-btn" data-remove="${i}" aria-label="${esc(t('removeCpt'))}">✕</button></td>
    </tr>`).join('');
}
$('schedRows').addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.k) { state.cpts[+el.dataset.i][el.dataset.k] = el.value; update(); }
});
$('schedRows').addEventListener('click', e => {
  const b = e.target.closest('[data-remove]');
  if (b) { state.cpts.splice(+b.dataset.remove, 1); renderSchedule(); update(); }
});
$('addCpt').addEventListener('click', () => {
  const d = new Date(Date.now() + 3 * 3600000); d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  state.cpts.push({ name: t('newRoute'), time: hhmm(d), units: 0 });
  renderSchedule(); update();
});

// ---- Buttons ----
$('resetBtn').addEventListener('click', () => { state = sample(); fillSetup(); renderSchedule(); update(); });
$('langBtn').addEventListener('click', () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  applyLang(); renderSchedule(); update();
});

function openDock() {
  document.body.classList.add('docked');
  $('dock').hidden = false;
  try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  tick();
}
function closeDock() {
  document.body.classList.remove('docked');
  $('dock').hidden = true;
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
}
$('dockBtn').addEventListener('click', openDock);
$('exitDock').addEventListener('click', closeDock);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('docked')) closeDock(); });

$('exportCsv').addEventListener('click', () => {
  const r = calc(new Date());
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [t('csvHeader'), ...r.rows.map(x => [
    x.name, hhmm(x.date), Math.round(x.msLeft / 60000), x.units,
    x.past || x.status === 'ready' || !x.finish ? '' : hhmm(x.finish),
    x.past || x.status === 'ready' || !isFinite(x.buffer) ? '' : Math.floor(x.buffer),
    x.past ? (x.status === 'missed' ? x.units : 0) : (x.atRisk || 0),
    t(STATUS[x.status][1])
  ])];
  const csv = '﻿' + lines.map(l => l.map(q).join(',')).join('\n'); // BOM so Excel reads Arabic
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = t('csvFile'); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// ---- Start ----
applyLang();
fillSetup();
renderSchedule();
update();
setInterval(tick, 1000);
