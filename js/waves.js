// =====================================================================
// waves.js — Threat wave system, huge wave, flag threat, banner
// Depends: state.js, entities.js (Threat, spawnThreatByType), config.js (THREAT_TYPES),
//   screens.js (triggerWin — runtime)
// Provides (global): WAVES, currentWave, waveActive, waveStarted, gameStartTime,
//   waveStartDelay, nextWaveAt, startWave, spawnThreat, updateWaves,
//   showBanner, bannerText, bannerUntil
// Used by: main.js (update/render), screens.js (startLevel resets variables)
// =====================================================================

let WAVES = [];
let currentWave = 0;
let threatsToSpawn = 0;
let threatsSpawnedThisWave = 0;
let lastThreatSpawn = 0;
let threatSpawnInterval = 8000;
let waveActive = false;
let waveStartDelay = 12000;
let gameStartTime = 0;
let waveStarted = false;
let nextWaveAt = 0;
let lastWaveEndTime = 0;

function startWave(index) {
  if (index >= WAVES.length) return;
  // quantum cells flip their water/grass state each wave
  if (grid && grid.length) {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.cellType === 'quantum') cell.quantumWater = !cell.quantumWater;
      }
    }
  }
  currentWave = index;
  const w = WAVES[index];
  threatsToSpawn = w.count;
  threatsSpawnedThisWave = 0;
  waveActive = true;
  lastThreatSpawn = gameTime;
  threatSpawnInterval = w.huge ? 2200 : 4000;
  // hide wave preview
  const previewEl = document.getElementById('wave-preview');
  if (previewEl) previewEl.style.display = 'none';
  if (w.huge) {
    showBanner('CRITICAL BREACH — MASSIVE ATTACK INCOMING!');
    Sound.hugeWaveAlarm();
    const flagZ = new Threat(Math.floor(Math.random() * gridRows), 'BASIC');
    flagZ.isFlag = true;
    threats.push(flagZ);
  } else {
    showBanner('Wave ' + (index + 1) + ' — INCOMING');
    Sound.waveStart();
  }
}

function getNextWavePreview() {
  if (currentWave + 1 >= WAVES.length) return null;
  const w = WAVES[currentWave + 1];
  const types = [];
  const chanceMap = {
    coneChance: 'CONEHEAD', poleChance: 'POLE_VAULTING', bucketChance: 'BUCKETHEAD',
    newspaperChance: 'NEWSPAPER', footballChance: 'FOOTBALL', spywareChance: 'SPYWARE',
    adwareChance: 'ADWARE', cryptolockerChance: 'CRYPTOLOCKER', glitchChance: 'GLITCH',
    botnetChance: 'BOTNET', aptChance: 'APT', rootkitChance: 'ROOTKIT',
    sqlChance: 'SQL_INJECTION', malwareChance: 'MALWARE_DROPPER', dnsChance: 'DNS_SPOOFER',
    insiderChance: 'INSIDER_THREAT', supplyChance: 'SUPPLY_CHAIN', quantumChance: 'QUANTUM_WORM'
  };
  Object.entries(chanceMap).forEach(([field, type]) => {
    if (w[field] && w[field] > 0 && THREAT_TYPES[type]) {
      types.push(THREAT_TYPES[type].emoji + ' ' + THREAT_TYPES[type].name);
    }
  });
  if (w.types) {
    w.types.forEach(t => {
      if (THREAT_TYPES[t] && !types.some(x => x.includes(THREAT_TYPES[t].name))) {
        types.push(THREAT_TYPES[t].emoji + ' ' + THREAT_TYPES[t].name);
      }
    });
  }
  return { count: w.count, huge: w.huge, types, boss: w.boss || w.bossLevel };
}

function updateWavePreview() {
  let previewEl = document.getElementById('wave-preview');
  if (!previewEl) {
    previewEl = document.createElement('div');
    previewEl.id = 'wave-preview';
    previewEl.style.cssText = 'display:none;position:fixed;bottom:60px;right:20px;background:#111820;border:1px solid #00cc33;border-radius:4px;padding:8px 12px;z-index:50;color:#00cc33;font-family:Courier New,monospace;font-size:11px;max-width:220px;box-shadow:0 0 8px rgba(0,255,65,0.2);';
    document.body.appendChild(previewEl);
  }
  if (waveActive || !waveStarted || currentWave + 1 >= WAVES.length) {
    previewEl.style.display = 'none';
    return;
  }
  const preview = getNextWavePreview();
  if (!preview) { previewEl.style.display = 'none'; return; }
  let html = '<b style="color:#00ff41;">Next Wave (' + (currentWave + 2) + ')</b><br>';
  html += 'Count: ' + preview.count;
  if (preview.huge) html += ' 🚩 HUGE';
  if (preview.boss) html += ' 👾 BOSS';
  html += '<br>';
  html += '<span style="color:#666;">' + (preview.types.join(', ') || 'Basic') + '</span>';
  previewEl.innerHTML = html;
  previewEl.style.display = 'block';
}

function spawnThreat() {
  const w = WAVES[currentWave];
  const row = Math.floor(Math.random() * gridRows);
  // endless mode waves use 'types' array
  if (w.types && w.types.length > 0) {
    const type = w.types[Math.floor(Math.random() * w.types.length)];
    const t = spawnThreatByType(type, row);
    // apply endless scaling
    if (gameMode === 'endless' && w.hpScale) {
      t.hp = Math.floor(t.hp * w.hpScale);
      t.maxHp = t.hp;
      if (w.speedScale) t.baseSpeed *= w.speedScale;
    }
    threatsSpawnedThisWave++;
    return;
  }
  // pick threat type based on wave config chances (weighted random)
  const chances = [
    { type: 'BASIC',         chance: 1.0 },  // fallback always available
    { type: 'CONEHEAD',      chance: w.coneChance || 0 },
    { type: 'POLE_VAULTING', chance: w.poleChance || 0 },
    { type: 'BUCKETHEAD',    chance: w.bucketChance || 0 },
    { type: 'NEWSPAPER',     chance: w.newspaperChance || 0 },
    { type: 'FOOTBALL',      chance: w.footballChance || 0 },
    { type: 'SPYWARE',       chance: w.spywareChance || 0 },
    { type: 'ADWARE',        chance: w.adwareChance || 0 },
    { type: 'CRYPTOLOCKER',  chance: w.cryptolockerChance || 0 },
    { type: 'GLITCH',        chance: w.glitchChance || 0 },
    { type: 'BOTNET',        chance: w.botnetChance || 0 },
    { type: 'APT',           chance: w.aptChance || 0 },
    { type: 'ROOTKIT',       chance: w.rootkitChance || 0 },
    { type: 'SQL_INJECTION', chance: w.sqlChance || 0 },
    { type: 'MALWARE_DROPPER', chance: w.malwareChance || 0 },
    { type: 'DNS_SPOOFER',   chance: w.dnsChance || 0 },
    { type: 'INSIDER_THREAT', chance: w.insiderChance || 0 },
    { type: 'SUPPLY_CHAIN',  chance: w.supplyChance || 0 },
    { type: 'QUANTUM_WORM',  chance: w.quantumChance || 0 }
  ];
  // remove BASIC fallback from weight calculation
  const weighted = chances.filter(c => c.type !== 'BASIC' && c.chance > 0);
  const totalWeight = weighted.reduce((s, c) => s + c.chance, 0);
  let type = 'BASIC';
  if (totalWeight > 0) {
    let r = Math.random() * totalWeight;
    for (const c of weighted) {
      r -= c.chance;
      if (r <= 0) { type = c.type; break; }
    }
  }
  spawnThreatByType(type, row);
  // apply endless scaling
  if (gameMode === 'endless' && w.hpScale) {
    const t = threats[threats.length - 1];
    if (t) {
      t.hp = Math.floor(t.hp * w.hpScale);
      t.maxHp = t.hp;
      if (w.speedScale) t.baseSpeed *= w.speedScale;
    }
  }
  threatsSpawnedThisWave++;
}

function updateWaves(now) {
  // boss level
  if (currentLevel && currentLevel.bossLevel) {
    if (!waveStarted && now - gameStartTime > 5000) {
      waveStarted = true;
      startBossLevel();
    }
    if (bossZomboss) checkBossDefeated();
    return;
  }

  if (!waveStarted && now - gameStartTime > waveStartDelay) {
    waveStarted = true;
    startWave(0);
    return;
  }
  if (nextWaveAt > 0 && now >= nextWaveAt) {
    nextWaveAt = 0;
    startWave(currentWave + 1);
    return;
  }
  if (waveActive) {
    if (threatsSpawnedThisWave < threatsToSpawn && now - lastThreatSpawn >= threatSpawnInterval) {
      spawnThreat();
      lastThreatSpawn = now;
    }
    if (threatsSpawnedThisWave >= threatsToSpawn && threats.length === 0) {
      waveActive = false;
      lastWaveEndTime = now;
      if (gameMode === 'endless') {
        endlessWave++;
        if (endlessWave > endlessBest) {
          endlessBest = endlessWave;
          localStorage.setItem('cyber_endless_best', endlessBest.toString());
        }
        showBanner('WAVE ' + endlessWave + ' CLEARED');
        // generate more waves if running low
        if (currentWave + 3 >= WAVES.length) {
          generateEndlessWaves(10);
        }
        nextWaveAt = now + 5000;
      } else if (currentWave + 1 < WAVES.length) {
        showBanner('WAVE CLEARED — Next wave incoming...');
        nextWaveAt = now + 5000;
      } else {
        // all waves done
        if (gameMode === 'speedrun' && speedrunStart > 0) {
          const elapsed = Math.floor((performance.now() - speedrunStart) / 1000);
          const best = parseInt(localStorage.getItem('cyber_speedrun_best') || '999999');
          if (elapsed < best) {
            localStorage.setItem('cyber_speedrun_best', elapsed.toString());
          }
          // advance to next level in speedrun
          const speedrunIdx = LEVEL_ORDER.indexOf(currentLevelId) + 1;
          if (speedrunIdx < LEVEL_ORDER.length) {
            gameWon = true; // mark current level won
            showOverlay('LEVEL COMPLETE!', '#2ecc71', 'Next Level',
              'Time: ' + formatTime(Math.floor((performance.now() - speedrunStart) / 1000)));
            restartBtn.dataset.mode = 'speedrun_next';
            return;
          }
        }
        triggerWin();
      }
    }
  }
}

let bannerText = '';
let bannerUntil = 0;
function showBanner(text) {
  bannerText = text;
  bannerUntil = gameTime + 2500;
}

// Boss level support
let bossZomboss = null;
let _bossWinTriggered = false;
function startBossLevel() {
  const bossKey = (currentLevel && currentLevel.bossType) || 'ZERO_DAY';
  const BossClass = (typeof BOSS_CLASSES !== 'undefined' && BOSS_CLASSES[bossKey]) || Zomboss;
  bossZomboss = new BossClass();
  // endless mode: scale boss HP
  if (gameMode === 'endless') {
    const scale = 1 + endlessWave * 0.15;
    bossZomboss.hp = Math.floor(bossZomboss.hp * scale);
    bossZomboss.maxHp = bossZomboss.hp;
  }
  threats.push(bossZomboss);
  showBanner((bossZomboss.name || 'ZERO-DAY EXPLOIT').toUpperCase() + ' DEPLOYED!');
  Sound.hugeWaveAlarm();
}

function checkBossDefeated() {
  if (_bossWinTriggered) return;
  if (bossZomboss && bossZomboss.hp <= 0) {
    _bossWinTriggered = true;
    bossZomboss.markedForDeletion = true;
    score += 500;
    Sound.threatDie();
    Sound.winFanfare();
    dropCoin(bossZomboss.centerX(), bossZomboss.centerY(), true);
    spawnParticles(bossZomboss.centerX(), bossZomboss.centerY(), 30, '#00ff41');
    spawnFloatingText(bossZomboss.centerX(), bossZomboss.centerY() - 30, 'BOSS DEFEATED! +500', '#ffd700');
    if (gameMode === 'boss_rush') {
      bossRushIndex++;
      // delay before next boss
      setTimeout(() => { startBossRushLevel(); }, 3000);
    } else if (gameMode === 'endless') {
      // endless: boss defeated, keep going
      showBanner('BOSS DEFEATED — CONTINUING...');
      if (currentWave + 3 >= WAVES.length) {
        generateEndlessWaves(10);
      }
      nextWaveAt = gameTime + 5000;
    } else {
      triggerWin();
    }
  }
}
