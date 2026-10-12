// Celebration when a CPT is cleared: confetti, a congratulations card and a short fanfare.
// No external libraries: confetti is drawn on a canvas and the sound is generated with the Web Audio API.
const Celebrate = (() => {
  let audioCtx = null;
  const COLORS = ['#f2b230', '#e8a317', '#1f7a45', '#4cc27f', '#2f6fde', '#e3477a', '#ffffff', '#8b5cf6'];
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Sound ----
  function unlockAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx.state !== 'closed';
    } catch (e) { return false; }
  }
  const audioReady = () => !!audioCtx && audioCtx.state === 'running';

  function note(freq, start, dur, type = 'triangle', vol = 0.22) {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(start); o.stop(start + dur + 0.05);
  }
  // A rising "ta-da" arpeggio, a held major chord, then a sparkle on top.
  function fanfare() {
    if (!unlockAudio()) return;
    const t0 = audioCtx.currentTime + 0.05;
    const run = [523.25, 659.25, 783.99, 1046.5];           // C5 E5 G5 C6
    run.forEach((f, i) => note(f, t0 + i * 0.11, 0.22));
    const chordAt = t0 + run.length * 0.11 + 0.05;
    [523.25, 659.25, 783.99, 1046.5].forEach(f => note(f, chordAt, 1.1, 'triangle', 0.14));
    [261.63].forEach(f => note(f, chordAt, 1.1, 'sine', 0.18));  // C4 underneath
    [1567.98, 2093, 2637, 3135.96].forEach((f, i) => note(f, chordAt + 0.25 + i * 0.07, 0.18, 'sine', 0.06));
  }

  // ---- Confetti ----
  function confetti(durationMs = 4500) {
    if (reduceMotion()) return;
    const c = document.createElement('canvas');
    c.className = 'confetti-canvas'; c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    const ctx = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); addEventListener('resize', size);

    const parts = [];
    const burst = (x, dir) => {
      for (let i = 0; i < 110; i++) {
        const a = (-Math.PI / 2) + dir * (0.15 + Math.random() * 0.75);
        const sp = 9 + Math.random() * 11;
        parts.push({ x, y: innerHeight + 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          w: 6 + Math.random() * 7, h: 9 + Math.random() * 9, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .35,
          c: COLORS[(Math.random() * COLORS.length) | 0], shape: Math.random() < 0.25 ? 'circle' : 'rect', wob: Math.random() * 10 });
      }
    };
    burst(innerWidth * 0.1, 1); burst(innerWidth * 0.9, -1);
    setTimeout(() => { burst(innerWidth * 0.3, 0.4); burst(innerWidth * 0.7, -0.4); }, 350);

    const startT = performance.now();
    (function frame(now) {
      const el = now - startT;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of parts) {
        p.vy += 0.28; p.vx *= 0.992; p.vy *= 0.992;
        p.x += p.vx + Math.sin((el / 180) + p.wob) * 0.6; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.globalAlpha = el > durationMs - 800 ? Math.max(0, (durationMs - el) / 800) : 1;
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)) + 2);
        ctx.restore();
      }
      if (el < durationMs) requestAnimationFrame(frame);
      else { removeEventListener('resize', size); c.remove(); }
    })(startT);
  }

  // ---- Congratulations card ----
  let hideTimer = null;
  function banner(title, lines) {
    let el = document.getElementById('congrats');
    if (!el) {
      el = document.createElement('div');
      el.id = 'congrats'; el.className = 'congrats'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'assertive');
      el.addEventListener('click', () => el.classList.remove('show'));
      document.body.appendChild(el);
    }
    el.innerHTML = `<div class="congrats-card"><div class="congrats-emoji" aria-hidden="true">🎉</div>
      <div class="congrats-title">${title}</div>${lines.map(l => `<p>${l}</p>`).join('')}</div>`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => el.classList.remove('show'), 8000);
  }

  // One call for the whole celebration. playSound is false when another tab is already playing it.
  function cleared(row, isLast, playSound) {
    const mins = Math.max(0, Math.floor(row.msLeft / 60000));
    const lines = [t('congratsMsg')(fmt(row.total), mins), isLast ? t('congratsLast') : t('congratsCheer')];
    banner(t('congratsTitle')(row.label), lines);
    confetti(isLast ? 6500 : 4500);
    if (playSound) fanfare();
  }

  return { unlockAudio, audioReady, fanfare, confetti, banner, cleared };
})();
