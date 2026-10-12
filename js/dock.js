// Dock screen: a separate tab for a wall TV. It reads the board's saved state,
// updates live when the main board changes it, and celebrates every cleared CPT.
let state = loadState();
const watcher = makeClearWatcher();
let soundOn = false;

function applyLang() {
  applyStaticText('dockPageTitle');
  $('backLink').href = 'index.html?lang=' + lang;
  renderSoundBtn();
}
function renderSoundBtn() {
  const b = $('soundBtn');
  b.textContent = !Celebrate.audioReady() ? t('soundEnable') : (soundOn ? t('soundOn') : t('soundOff'));
  b.classList.toggle('primary', !Celebrate.audioReady() || soundOn);
}

function tile(x) {
  const cls = STATUS[x.status][0];
  const tags = `<div class="t-tags">${x.packingNow ? `<span class="now-tag">${t('packingNow')}</span>` : ''}${x.past ? '' : badge(x.status)}</div>`;
  let main, sub, meta;
  if (x.past && x.status === 'cleared') {          // CPT time is up: final result
    main = `<div class="t-final ok">✓ ${t('stCleared')}</div>`;
    sub = ''; meta = `<span>${t('shipped')(`<b>${fmt(x.total)}</b>`)}</span>`;
  } else if (x.past && x.status === 'missed') {
    main = `<div class="t-final bad">✗ ${t('stMissed')}</div>`;
    sub = ''; meta = `<span>${t('leftBehind')(`<b>${fmt(x.remaining)}</b>`, `<b>${fmt(x.total)}</b>`)}</span>`;
  } else if (x.status === 'packed') {               // all packed, truck not gone yet
    main = `<div class="t-final ok">✓ ${t('stPacked')}</div>`;
    sub = `<div class="t-clock">${t('loadingNow')(countdown(x.msLeft))}</div>`;
    meta = `<span>${t('dockOf')(`<b>${fmt(x.packed)}</b>`, `<b>${fmt(x.total)}</b>`)}</span>`;
  } else {                                          // live: units remaining is the headline
    main = `<div class="t-units"><span class="t-num">${fmt(x.remaining)}</span><span class="t-cap">${t('unitsRemaining')}</span></div>`;
    sub = x.past ? '' : `<div class="t-clock">⏱ ${t('toCpt')(countdown(x.msLeft))}</div>`;
    meta = `<span>${t('dockOf')(`<b>${fmt(x.packed)}</b>`, `<b>${fmt(x.total)}</b>`)}</span>` +
      (showsBuffer(x) ? `<span>${t('dockBuffer')}: <b class="${bufClass(x)}">${bufText(x)}</b></span>` : '');
  }
  return `
    <div class="tile ${cls} ${x.past ? 'final' : ''}">
      <div class="t-top"><div class="t-name">${x.label}</div>${tags}</div>
      ${main}${sub}
      <div class="bar ${cls}"><span style="width:${pct(x.packed, x.total)}%"></span></div>
      <div class="t-meta">${meta}</div>
    </div>`;
}

function tick() {
  const now = new Date();
  const { fresh, r } = watcher(state, now);
  const sp = Math.max(1, num(state.speed, 1));
  $('speedBadge').hidden = sp <= 1; $('speedBadge').textContent = t('speedBadge')(sp);
  $('dockClock').textContent = hhmm(now) + ':' + pad(now.getSeconds());
  $('dockFacility').textContent = String(state.facility || '').trim() || '—';
  $('dockShift').textContent = shiftName(state);
  $('dockSummary').innerHTML = t('dockSummary')(r.clearedN, r.withVol.length, r.risk.length, r.watch.length);
  $('dockProgress').style.width = pct(r.packedUnits, r.totalUnits) + '%';
  $('tiles').innerHTML = r.rows.map(tile).join('') || `<p class="dock-empty">${t('noCpts')}</p>`;
  try { localStorage.setItem(DOCK_ALIVE_KEY, String(Date.now())); } catch (e) {}
  fresh.forEach((row, i) => {
    const isLast = r.withVol.length > 0 && r.clearedN === r.withVol.length && i === fresh.length - 1;
    setTimeout(() => Celebrate.cleared(row, isLast, soundOn && Celebrate.audioReady()), i * 1500);
  });
}

// Live updates from the main board (another tab writes to localStorage).
addEventListener('storage', e => {
  if (e.key === LANG_KEY && (e.newValue === 'en' || e.newValue === 'ar')) { lang = e.newValue; applyLang(); tick(); return; }
  if (e.key !== KEY || !e.newValue) return;
  try { state = JSON.parse(e.newValue); } catch (err) { return; }
  tick(); // celebrations are picked up in tick
});

// Browsers only allow sound after a tap or click on the page.
$('soundBtn').addEventListener('click', () => {
  if (!Celebrate.audioReady()) { Celebrate.unlockAudio(); soundOn = true; setTimeout(() => { renderSoundBtn(); Celebrate.fanfare(); }, 60); return; }
  soundOn = !soundOn; renderSoundBtn();
});
$('fsBtn').addEventListener('click', () => {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p = document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
  } catch (e) {}
});
// Any first click on the page also unlocks sound, so the screen is ready to cheer.
addEventListener('pointerdown', e => { if (e.target.closest('#soundBtn')) return; if (!Celebrate.audioReady()) { Celebrate.unlockAudio(); soundOn = true; setTimeout(renderSoundBtn, 60); } }, { once: true });

applyLang();
watcher(state, new Date()); // CPTs already cleared when the screen opens don't trigger a celebration
tick();
setInterval(tick, 1000);
addEventListener('beforeunload', () => { try { localStorage.removeItem(DOCK_ALIVE_KEY); } catch (e) {} });
