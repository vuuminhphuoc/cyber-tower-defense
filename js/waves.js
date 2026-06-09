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

function startWave(index) {
  if (index >= WAVES.length) return;
  currentWave = index;
  const w = WAVES[index];
  threatsToSpawn = w.count;
  threatsSpawnedThisWave = 0;
  waveActive = true;
  lastThreatSpawn = gameTime;
  threatSpawnInterval = w.huge ? 2200 : 4000;
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

function spawnThreat() {
  const w = WAVES[currentWave];
  const row = Math.floor(Math.random() * gridRows);
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
    { type: 'GLITCH',        chance: w.glitchChance || 0 }
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
      if (currentWave + 1 < WAVES.length) {
        showBanner('WAVE CLEARED — Next wave incoming...');
        nextWaveAt = now + 5000;
      } else {
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
  bossZomboss = new Zomboss();
  threats.push(bossZomboss);
  showBanner('ZERO-DAY EXPLOIT DEPLOYED!');
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
    triggerWin();
  }
}
