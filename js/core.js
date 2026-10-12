// Shared state, time logic and risk calculation for the main board and the dock screen.
const KEY = 'cpt-risk-board-v3';
const LANG_KEY = 'cpt-risk-board-lang';
const DOCK_ALIVE_KEY = 'cpt-risk-board-dock-alive';
const $ = id => document.getElementById(id);

// ---- Helpers ----
const pad = n => String(n).padStart(2, '0');
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = n => (n > 0 ? '+' : '') + n;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = v => `<bdi dir="ltr">${v}</bdi>`;
const uid = () => Math.random().toString(36).slice(2, 10);
const round50 = x => Math.max(0, Math.round(x / 50) * 50);
const num = (v, min, max) => {
  let n = parseFloat(v); if (!isFinite(n)) n = 0;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
};
function countdown(ms) {
  const neg = ms < 0; let s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return `${neg ? '−' : ''}${h}:${pad(m)}:${pad(s)}`;
}
function parseTime(str) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(str || ''));
  return m ? { h: +m[1], m: +m[2] } : null;
}

// ---- Shifts ----
const DEFAULT_SHIFTS = {
  day:   { start: '07:00', times: ['10:00', '13:00', '15:30', '17:30'] },
  night: { start: '19:00', times: ['22:00', '01:00', '03:30', '05:30'] }
};
// The shift that is running (or about to start) at this moment.
function autoShift(now) { const h = now.getHours(); return h >= 6 && h < 18 ? 'day' : 'night'; }

// Start of the current instance of a shift: today's start time, or yesterday's if
// today's start is still more than 4 hours away (for example, a night shift viewed at 02:00).
function shiftAnchor(start, now) {
  const p = parseTime(start) || { h: 0, m: 0 };
  const d = new Date(now); d.setHours(p.h, p.m, 0, 0);
  if (d - now > 4 * 3600000) d.setDate(d.getDate() - 1);
  return d;
}
// A CPT time earlier than the shift start belongs to the next morning.
function cptDate(time, anchor) {
  const p = parseTime(time); if (!p) return null;
  const d = new Date(anchor); d.setHours(p.h, p.m, 0, 0);
  if (d < anchor) d.setDate(d.getDate() + 1);
  return d;
}

// ---- Sample data ----
// Totals are sized from line capacity so the demo always looks like a live shift:
// CPTs before now are cleared, the next one is slightly behind, later ones are unstarted.
const SETUP_DEFAULTS = { packers: 20, rate: 160, loadBuf: 20, watchMin: 15, auto: true, pace: 100, speed: 1 };
function buildSample(key, now, setup) {
  const def = DEFAULT_SHIFTS[key];
  const anchor = shiftAnchor(def.start, now);
  const capMin = num(setup.packers, 0) * num(setup.rate, 0) / 60 || 50;
  const lb = num(setup.loadBuf, 0);
  const factors = [0.9, 0.95, 0.82, 0.88];
  const dated = def.times.map(time => ({ time, date: cptDate(time, anchor) })).sort((a, b) => a.date - b.date);
  let prevDl = anchor, first = true;
  const cpts = dated.map((c, i) => {
    const dl = new Date(c.date.getTime() - lb * 60000);
    const interval = Math.max(30, (dl - prevDl) / 60000);
    prevDl = dl;
    const base = round50(capMin * interval * factors[i % 4]);
    if (dl <= now) return { id: uid(), time: c.time, total: base, packed: base };
    if (first) {
      first = false;
      if (now >= anchor) {
        const remaining = round50(capMin * Math.max(10, (dl - now) / 60000) * 1.07);
        const total = Math.max(base, remaining + 500);
        return { id: uid(), time: c.time, total, packed: total - remaining };
      }
    }
    return { id: uid(), time: c.time, total: base, packed: 0 };
  });
  return { start: def.start, baseAt: now.getTime(), cpts };
}
function defaultState(now) {
  return {
    facility: 'Riyadh Demo Warehouse',
    shift: autoShift(now),
    ...SETUP_DEFAULTS,
    shifts: { day: buildSample('day', now, SETUP_DEFAULTS), night: buildSample('night', now, SETUP_DEFAULTS) }
  };
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.shifts && s.shifts.day && s.shifts.night) return s;
  } catch (e) {}
  return defaultState(new Date());
}
function saveState(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

// ---- Live auto-count ----
// Units per real minute the line packs: packers x rate x actual pace, sped up in demo mode.
function packRatePerMin(s) {
  return Math.floor(num(s.packers, 0)) * num(s.rate, 0) * num(s.pace, 0, 200) / 100 / 60 * Math.max(1, num(s.speed, 1));
}
// "Packed so far" at any moment, worked out from the last entered (baseline) counts.
// The line packs the earliest CPT that still has units and whose pack deadline hasn't passed;
// when a pack deadline passes, its leftover units miss and the line moves to the next CPT.
// Because it is calculated from time rather than counted up, every open tab shows the same number.
function effectivePacked(s, key, now) {
  const sh = s.shifts[key];
  const anchor = shiftAnchor(sh.start, now);
  const loadMs = num(s.loadBuf, 0, 600) * 60000;
  const base = num(sh.baseAt, 0);
  const stale = base < anchor.getTime() - 12 * 3600000; // baseline belongs to an earlier day
  const rows = sh.cpts.map(c => {
    const total = Math.floor(num(c.total, 0));
    const date = cptDate(c.time, anchor);
    return { id: c.id, total, date, deadline: date ? date.getTime() - loadMs : 0, packed: stale ? 0 : Math.min(total, num(c.packed, 0)) };
  }).filter(r => r.date).sort((a, b) => a.date - b.date);
  const out = {};
  const rate = packRatePerMin(s);
  if (s.auto !== false && rate > 0) {
    let cursor = Math.max(stale ? 0 : base, anchor.getTime());
    const end = now.getTime();
    while (cursor < end) {
      const target = rows.find(r => r.packed < r.total && r.deadline > cursor);
      if (!target) break;
      const stop = Math.min(end, target.deadline);
      const capacity = rate * (stop - cursor) / 60000;
      const need = target.total - target.packed;
      if (need <= capacity) { target.packed = target.total; cursor += need / rate * 60000; }
      else { target.packed += capacity; cursor = stop; }
    }
  }
  rows.forEach(r => { out[r.id] = r.packed; });
  return out;
}
// Freeze the live counts as the new baseline. Called before any setting or count changes,
// so the time already worked is kept and only the future uses the new numbers.
function rebase(s, now) {
  for (const key of ['day', 'night']) {
    const eff = effectivePacked(s, key, now);
    s.shifts[key].cpts.forEach(c => { if (c.id in eff) c.packed = Math.round(eff[c.id] * 100) / 100; });
    s.shifts[key].baseAt = now.getTime();
  }
}

// ---- Language ----
function initialLang() {
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'ar' || q === 'en') return q; } catch (e) {}
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'ar' || s === 'en') return s; } catch (e) {}
  return 'en';
}
let lang = initialLang();
const t = key => I18N[lang][key];
function applyStaticText(titleKey) {
  const root = document.documentElement;
  root.lang = lang; root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t(titleKey);
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
}
const shiftName = s => t(s.shift === 'night' ? 'shiftNight' : 'shiftDay');

// ---- Risk calculation ----
function calc(s, now) {
  const sh = s.shifts[s.shift];
  const packers = Math.floor(num(s.packers, 0));
  const rate = num(s.rate, 0);
  const loadBuf = num(s.loadBuf, 0, 600);
  const watchMin = num(s.watchMin, 0, 600);
  const capPerMin = packRatePerMin(s); // live rate: packers x rate x pace (x demo speed)
  const effRate = capPerMin / Math.max(1, packers) * 60; // units per packer-hour actually achieved
  const anchor = shiftAnchor(sh.start, now);
  const eff = effectivePacked(s, s.shift, now);

  const rows = sh.cpts.map(c => {
    const total = Math.floor(num(c.total, 0));
    const live = c.id in eff ? eff[c.id] : num(c.packed, 0);
    const packed = live >= total ? total : Math.min(total, Math.floor(live));
    return { id: c.id, date: cptDate(c.time, anchor), total, packed, remaining: total - packed };
  }).filter(r => r.date).sort((a, b) => a.date - b.date);
  rows.forEach((r, i) => { r.n = i + 1; r.label = t('cptLabel')(r.n, hhmm(r.date)); });

  let cum = 0;
  for (const r of rows) {
    r.msLeft = r.date - now;
    r.cleared = r.total > 0 && r.remaining === 0;
    // Once the CPT time is up the result is final: cleared or missed.
    if (r.msLeft <= 0) { r.past = true; r.status = r.total === 0 ? 'ready' : (r.cleared ? 'cleared' : 'missed'); continue; }
    cum += r.remaining;
    r.deadline = new Date(r.date.getTime() - loadBuf * 60000);
    r.minsToDeadline = (r.deadline - now) / 60000;
    r.finishMins = capPerMin > 0 ? cum / capPerMin : Infinity;
    r.finish = isFinite(r.finishMins) ? new Date(now.getTime() + r.finishMins * 60000) : null;
    r.buffer = r.minsToDeadline - r.finishMins;
    const packable = capPerMin * Math.max(0, r.minsToDeadline);
    r.atRisk = Math.min(r.remaining, Math.max(0, Math.ceil(cum - packable)));
    r.reqPackers = r.minsToDeadline > 0 && effRate > 0 ? Math.ceil(cum / (r.minsToDeadline * effRate / 60) - 1e-9) : Infinity;
    if (r.total === 0) r.status = 'ready';
    else if (r.cleared) r.status = 'packed'; // all packed, waiting for the truck to leave
    else if (r.buffer < 0) r.status = 'risk';
    else if (r.buffer < watchMin) r.status = 'watch';
    else r.status = 'safe';
  }

  // The CPT the line is packing right now (live auto-count only).
  const packingNow = s.auto !== false && capPerMin > 0 && now >= anchor
    ? rows.find(r => !r.past && r.remaining > 0 && r.minsToDeadline > 0) : null;
  if (packingNow) packingNow.packingNow = true;
  const future = rows.filter(r => !r.past);
  const active = future.filter(r => r.remaining > 0);
  const risk = active.filter(r => r.status === 'risk');
  const watch = active.filter(r => r.status === 'watch');
  const missed = rows.filter(r => r.status === 'missed');
  const withVol = rows.filter(r => r.total > 0);
  const clearedN = withVol.filter(r => r.cleared).length;
  const totalUnits = withVol.reduce((a, r) => a + r.total, 0);
  const packedUnits = withVol.reduce((a, r) => a + r.packed, 0);
  const unitsLeft = active.reduce((a, r) => a + r.remaining, 0);
  const unitsAtRisk = risk.reduce((a, r) => a + r.atRisk, 0);
  const finiteReq = active.map(r => r.reqPackers).filter(isFinite);
  const needed = finiteReq.length ? Math.max(...finiteReq) : packers;
  const unsavable = active.some(r => !isFinite(r.reqPackers));
  return { now, packers, rate, effRate, packingNow, loadBuf, watchMin, capPerMin, rows, future, active, risk, watch, missed,
    withVol, clearedN, totalUnits, packedUnits, unitsLeft, unitsAtRisk, needed, unsavable };
}

const STATUS = {
  safe: ['ok', 'stSafe'], watch: ['warn', 'stWatch'], risk: ['bad', 'stRisk'],
  missed: ['bad', 'stMissed'], packed: ['done', 'stPacked'], cleared: ['done', 'stCleared'], ready: ['muted', 'stReady']
};
const badge = s => `<span class="badge ${STATUS[s][0]}">${t(STATUS[s][1])}</span>`;
const showsBuffer = r => !r.past && (r.status === 'safe' || r.status === 'watch' || r.status === 'risk') && isFinite(r.buffer);
const bufText = r => showsBuffer(r) ? `${ltr(signed(Math.floor(r.buffer)))} ${t('min')}` : '–';
const bufClass = r => r.status === 'risk' ? 'neg' : r.status === 'watch' ? 'tight' : r.status === 'safe' ? 'pos' : '';
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round(a / b * 100)) : 0);

// ---- Cleared-CPT detection (shared by both pages) ----
// Returns CPTs that became cleared since the last check, while still before their CPT time.
function makeClearWatcher() {
  let seen = null;
  return (s, now) => {
    const r = calc(s, now);
    const ids = new Set(r.rows.filter(x => x.cleared).map(x => x.id));
    const fresh = seen ? r.rows.filter(x => x.cleared && !seen.has(x.id) && !x.past) : [];
    seen = ids;
    return { fresh, r };
  };
}

// Is a dock screen open in another tab? (It writes a heartbeat every 2 seconds.)
function dockIsOpen() {
  try { return Date.now() - Number(localStorage.getItem(DOCK_ALIVE_KEY) || 0) < 5000; } catch (e) { return false; }
}

// Shared top-action logic.
function actionsFor(r) {
  const out = [];
  const late = r.risk.find(x => !isFinite(x.reqPackers));
  if (late) out.push(t('actLate')(late.label));
  if (r.risk.length && r.needed > r.packers) {
    const binding = r.risk.filter(x => isFinite(x.reqPackers)).sort((a, b) => b.reqPackers - a.reqPackers)[0];
    if (binding) out.push(t('actAdd')(r.needed - r.packers, binding.label, hhmm(binding.deadline)));
  }
  const first = r.risk.find(x => isFinite(x.reqPackers));
  if (first) out.push(t('actEscalate')(fmt(first.atRisk), first.label));
  const tight = [...r.watch].sort((a, b) => a.buffer - b.buffer)[0];
  if (tight) out.push(t('actWatch')(tight.label, Math.floor(tight.buffer)));
  return out.slice(0, 3);
}
