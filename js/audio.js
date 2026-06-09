// =====================================================================
// audio.js — Sound effects via Web Audio API (no MP3 files needed)
// Depends: NONE (standalone)
// Provides (global): Sound
// Used by: ui.js, entities.js, combat.js, waves.js, screens.js
// =====================================================================

const Sound = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    return ctx;
  }

  // Resume AudioContext if blocked by browser (autoplay policy)
  function resume() {
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  // --- primitive helpers ---
  function tone(freq, dur, type, vol, rampEnd) {
    const c = getCtx();
    if (!c) return;
    resume();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (rampEnd !== undefined) o.frequency.linearRampToValueAtTime(rampEnd, c.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.15, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  }

  function noise(dur, vol) {
    const c = getCtx();
    if (!c) return;
    resume();
    const bufSize = c.sampleRate * dur;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol || 0.1, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(g);
    g.connect(c.destination);
    src.start();
  }

  // ========== Sound Library ==========

  function tokenCollect() {
    tone(880, 0.12, 'sine', 0.12);
    setTimeout(() => tone(1320, 0.15, 'sine', 0.10), 60);
  }

  function coinCollect() {
    tone(1200, 0.08, 'square', 0.07);
    setTimeout(() => tone(1600, 0.12, 'square', 0.06), 50);
  }

  function towerPlace() {
    tone(220, 0.15, 'triangle', 0.15, 110);
    noise(0.08, 0.06);
  }

  function shoot() {
    tone(600, 0.08, 'square', 0.06, 300);
  }

  function projectileHit() {
    tone(300, 0.06, 'sawtooth', 0.07, 100);
    noise(0.04, 0.05);
  }

  function threatEat() {
    noise(0.08, 0.08);
    tone(120, 0.1, 'sawtooth', 0.06, 60);
  }

  function threatDie() {
    tone(400, 0.1, 'sawtooth', 0.10, 80);
    noise(0.12, 0.08);
  }

  function waveStart() {
    tone(440, 0.15, 'square', 0.08);
    setTimeout(() => tone(550, 0.15, 'square', 0.08), 120);
    setTimeout(() => tone(660, 0.2, 'square', 0.10), 240);
  }

  function hugeWaveAlarm() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => tone(800, 0.12, 'sawtooth', 0.08), i * 180);
    }
    setTimeout(() => tone(600, 0.3, 'sawtooth', 0.10), 540);
  }

  function menuClick() {
    tone(500, 0.06, 'sine', 0.08);
  }

  function seedSelect() {
    tone(700, 0.06, 'triangle', 0.08);
    setTimeout(() => tone(900, 0.08, 'triangle', 0.06), 40);
  }

  function winFanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.25, 'sine', 0.10), i * 180);
    });
    setTimeout(() => {
      tone(1047, 0.5, 'sine', 0.12);
      tone(784, 0.5, 'sine', 0.08);
    }, 720);
  }

  function loseSound() {
    const notes = [440, 370, 330, 262];
    notes.forEach((f, i) => {
      setTimeout(() => tone(f, 0.35, 'triangle', 0.10), i * 250);
    });
  }

  // ========== Background Music ==========
  let bgmGain = null;
  let bgmPlaying = false;
  let bgmInterval = null;
  let bgmEnabled = true;

  // Ambient melody — pentatonic scale, gentle loop
  const BGM_MELODY = [
    392, 440, 523, 587, 523, 440, 392, 330,
    349, 392, 440, 523, 440, 392, 349, 330,
    294, 330, 392, 440, 392, 330, 294, 262,
    330, 392, 440, 392, 330, 294, 330, 392
  ];
  const BGM_BASS = [
    131, 131, 165, 165, 175, 175, 131, 131,
    147, 147, 165, 165, 147, 147, 131, 131,
    110, 110, 131, 131, 131, 131, 110, 110,
    131, 131, 165, 165, 131, 131, 110, 131
  ];
  let bgmNoteIdx = 0;

  function bgmPlayNote() {
    const c = getCtx();
    if (!c || !bgmPlaying) return;
    const noteIdx = bgmNoteIdx % BGM_MELODY.length;

    // melody voice
    const osc1 = c.createOscillator();
    const g1 = c.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(BGM_MELODY[noteIdx], c.currentTime);
    g1.gain.setValueAtTime(0.04 * (bgmEnabled ? 1 : 0), c.currentTime);
    g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.45);
    osc1.connect(g1);
    g1.connect(bgmGain);
    osc1.start();
    osc1.stop(c.currentTime + 0.5);

    // bass voice
    const osc2 = c.createOscillator();
    const g2 = c.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(BGM_BASS[noteIdx], c.currentTime);
    g2.gain.setValueAtTime(0.03 * (bgmEnabled ? 1 : 0), c.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.55);
    osc2.connect(g2);
    g2.connect(bgmGain);
    osc2.start();
    osc2.stop(c.currentTime + 0.6);

    bgmNoteIdx++;
  }

  function bgmStart() {
    if (bgmPlaying) return;
    const c = getCtx();
    if (!c) return;
    resume();
    bgmGain = c.createGain();
    bgmGain.gain.setValueAtTime(1, c.currentTime);
    bgmGain.connect(c.destination);
    bgmPlaying = true;
    bgmNoteIdx = 0;
    bgmInterval = setInterval(bgmPlayNote, 500);
  }

  function bgmStop() {
    bgmPlaying = false;
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
    bgmGain = null;
  }

  function bgmToggle() {
    bgmEnabled = !bgmEnabled;
    if (bgmGain) {
      const c = getCtx();
      if (c) bgmGain.gain.setValueAtTime(bgmEnabled ? 1 : 0, c.currentTime);
    }
    return bgmEnabled;
  }

  function lawnMower() {
    // alarm siren: rising then falling
    for (let i = 0; i < 4; i++) {
      setTimeout(() => tone(400 + i * 150, 0.1, 'sawtooth', 0.08), i * 80);
    }
    setTimeout(() => tone(900, 0.3, 'square', 0.06), 320);
  }

  function bossFireball() {
    tone(200, 0.3, 'sawtooth', 0.10);
    setTimeout(() => tone(300, 0.2, 'sawtooth', 0.08), 100);
    setTimeout(() => tone(150, 0.4, 'square', 0.06), 200);
  }

  function bossSmash() {
    tone(100, 0.15, 'square', 0.12);
    setTimeout(() => tone(80, 0.3, 'square', 0.10), 50);
    setTimeout(() => tone(60, 0.4, 'triangle', 0.08), 100);
  }

  function bossSummon() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => tone(600 + i * 200, 0.15, 'sine', 0.06), i * 120);
    }
  }

  function mineArm() {
    tone(1200, 0.05, 'square', 0.06);
    setTimeout(() => tone(1600, 0.05, 'square', 0.04), 60);
  }

  function heal() {
    tone(800, 0.08, 'sine', 0.06);
    setTimeout(() => tone(1000, 0.1, 'sine', 0.04), 50);
  }

  function empExplosion() {
    tone(150, 0.3, 'sawtooth', 0.08);
    tone(300, 0.2, 'square', 0.06);
    setTimeout(() => tone(100, 0.4, 'sawtooth', 0.06), 100);
  }

  function spywareSteal() {
    tone(900, 0.06, 'triangle', 0.06);
    setTimeout(() => tone(700, 0.08, 'triangle', 0.04), 40);
  }

  function cryptolockerFreeze() {
    tone(1400, 0.1, 'sine', 0.06);
    setTimeout(() => tone(1200, 0.15, 'sine', 0.04), 80);
    setTimeout(() => tone(1000, 0.2, 'sine', 0.03), 160);
  }

  return {
    resume, tokenCollect, coinCollect, towerPlace, shoot, projectileHit,
    threatEat, threatDie, waveStart, hugeWaveAlarm,
    menuClick, seedSelect, winFanfare, loseSound, lawnMower,
    bossFireball, bossSmash, bossSummon, mineArm, heal,
    empExplosion, spywareSteal, cryptolockerFreeze,
    bgmStart, bgmStop, bgmToggle, get bgmEnabled() { return bgmEnabled; }
  };
})();
