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
  const big = x.status === 'cleared' ? `<div class="t-count t-done">✓ ${t('stCleared')}</div>` : `<div class="t-count">${countdown(x.msLeft)}</div>`;
  return `
    <div class="tile ${cls} ${x.past ? 'past' : ''}">
      <div class="t-top"><div class="t-name">${x.label}</div>${badge(x.status)}</div>
      ${big}
      <div class="bar ${cls}"><span style="width:${pct(x.packed, x.total)}%"></span></div>
      <div class="t-meta"><span>${t('dockOf')(`<b>${fmt(x.packed)}</b>`, `<b>${fmt(x.total)}</b>`)}</span>
        <span>${showsBuffer(x) ? `${t('dockBuffer')}: <b class="${bufClass(x)}">${bufText(x)}</b>` : `${t('dockLeft')}: <b>${fmt(x.remaining)}</b>`}</span></div>
    </div>`;
}

function tick() {
  const now = new Date();
  const r = calc(state, now);
  $('dockClock').textContent = hhmm(now) + ':' + pad(now.getSeconds());
  $('dockFacility').textContent = String(state.facility || '').trim() || '—';
  $('dockShift').textContent = shiftName(state);
  $('dockSummary').innerHTML = t('dockSummary')(r.clearedN, r.withVol.length, r.risk.length, r.watch.length);
  $('dockProgress').style.width = pct(r.packedUnits, r.totalUnits) + '%';
  $('tiles').innerHTML = r.rows.map(tile).join('') || `<p class="dock-empty">${t('noCpts')}</p>`;
  try { localStorage.setItem(DOCK_ALIVE_KEY, String(Date.now())); } catch (e) {}
}

// Live updates from the main board (another tab writes to localStorage).
addEventListener('storage', e => {
  if (e.key === LANG_KEY && (e.newValue === 'en' || e.newValue === 'ar')) { lang = e.newValue; applyLang(); tick(); return; }
  if (e.key !== KEY || !e.newValue) return;
  try { state = JSON.parse(e.newValue); } catch (err) { return; }
  const { fresh, r } = watcher(state, new Date());
  tick();
  fresh.forEach((row, i) => {
    const isLast = r.withVol.length > 0 && r.clearedN === r.withVol.length && i === fresh.length - 1;
    setTimeout(() => Celebrate.cleared(row, isLast, soundOn && Celebrate.audioReady()), i * 1500);
  });
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
