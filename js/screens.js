// =====================================================================
// screens.js — Screen management (Menu, Seed Chooser), Win/Loss, start match
// Depends: config.js (LEVEL_DATABASE, LEVEL_ORDER, STAGE_EMOJI, TOWER_TYPES, TOWER_KEYS),
//   save.js (SaveManager, saveData), state.js, waves.js (WAVES + reset variables),
//   grid.js (initGrid), ui.js (buildCards, updateCardsUI)
// Provides (global): triggerGameOver, triggerWin, beatLevel, showOverlay,
//   showScreen, goToMenu, buildMenu, openSeedChooser, buildSeedChooser, startLevel,
//   overlay, screenMenu, screenSeed
// Used by: entities.js (triggerGameOver), waves.js (triggerWin), main.js (bootstrap)
// =====================================================================

// ========== Win / Loss ==========
let seedPacketReward = null; // pending reward display

function triggerGameOver() {
  if (gameOver || gameWon) return;
  gameOver = true;
  Sound.loseSound();
  Sound.bgmStop();
  let subMsg = '';
  if (gameMode === 'endless') {
    subMsg = 'Wave reached: ' + (endlessWave + 1) + ' | Best: ' + endlessBest;
  } else if (gameMode === 'speedrun' && speedrunStart > 0) {
    subMsg = 'Time: ' + formatTime(Math.floor((performance.now() - speedrunStart) / 1000));
  }
  showOverlay('SYSTEM BREACH', '#e74c3c', 'Retry', subMsg, true);
  gameMode = 'campaign';
}

function triggerWin() {
  if (gameOver || gameWon) return;
  gameWon = true;
  Sound.winFanfare();
  Sound.bgmStop();
  beatLevel();
}

function beatLevel() {
  // unlock next level
  const idx = LEVEL_ORDER.indexOf(currentLevelId);
  if (idx >= 0 && idx + 1 > saveData.progress.maxLevelIndex) {
    saveData.progress.maxLevelIndex = Math.min(idx + 1, LEVEL_ORDER.length - 1);
  }
  // unlock new tower reward
  const reward = currentLevel.reward;
  if (reward && !saveData.inventory.unlockedTowers.includes(reward)) {
    saveData.inventory.unlockedTowers.push(reward);
    seedPacketReward = reward;
  }
  const rewardCoins = (currentLevel.stage || 1) * 25;
  saveData.wallet.coins += rewardCoins;
  SaveManager.save(saveData);

  const msg = seedPacketReward
    ? 'New core: ' + TOWER_TYPES[seedPacketReward].emoji + ' ' + TOWER_TYPES[seedPacketReward].name + '!'
    : '';
  showOverlay('NETWORK SECURED', '#2ecc71', 'Back to Menu', msg);
}

const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const restartBtn = document.getElementById('restart-btn');
let overlaySubEl = null;

function showOverlay(text, color, btnLabel, subText, isReplay) {
  overlayText.textContent = text;
  overlayText.style.color = color;
  restartBtn.textContent = btnLabel || 'Retry';
  restartBtn.dataset.mode = isReplay ? 'replay' : 'menu';
  if (!overlaySubEl) {
    overlaySubEl = document.createElement('div');
    overlaySubEl.style.cssText = 'font-size:18px;color:#ffd700;text-align:center;';
    overlay.insertBefore(overlaySubEl, restartBtn);
  }
  overlaySubEl.textContent = subText || '';
  overlay.style.display = 'flex';
}

restartBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
  if (restartBtn.dataset.mode === 'replay') {
    // replay the same level
    currentLevel = LEVEL_DATABASE[currentLevelId];
    startLevel();
  } else if (restartBtn.dataset.mode === 'speedrun_next') {
    const nextIdx = LEVEL_ORDER.indexOf(currentLevelId) + 1;
    if (nextIdx < LEVEL_ORDER.length) {
      launchSpeedrunLevel(nextIdx);
    } else {
      gameMode = 'campaign';
      goToMenu();
    }
  } else if (restartBtn.dataset.mode === 'boss_rush_next') {
    startBossRushLevel();
  } else {
    goToMenu();
  }
});

// ========== Screen Management ==========
const screenMenu = document.getElementById('screen-menu');
const screenSeed = document.getElementById('screen-seed');
const screenChallenges = document.getElementById('screen-challenges');

function showScreen(state) {
  gameState = state;
  screenMenu.classList.toggle('active', state === GAME_STATE.MENU);
  screenSeed.classList.toggle('active', state === GAME_STATE.SEED_CHOOSER);
  if (typeof screenShop !== 'undefined') screenShop.classList.toggle('active', state === GAME_STATE.SHOP);
  if (typeof screenAlmanac !== 'undefined') screenAlmanac.classList.toggle('active', state === GAME_STATE.ALMANAC);
  if (typeof screenHelp !== 'undefined') screenHelp.classList.toggle('active', state === GAME_STATE.HELP);
  screenChallenges.classList.toggle('active', state === GAME_STATE.CHALLENGES);
  document.body.classList.toggle('playing', state === GAME_STATE.PLAYING);
}

// ===== MENU =====
function goToMenu() {
  saveData = SaveManager.load();
  Sound.bgmStop();
  // reset match state so the next level starts clean (prevents stale win/loss
  // flags blocking input and old towers lingering on screen)
  gameOver = false;
  gameWon = false;
  gamePaused = false;
  towers = [];
  threats = [];
  projectiles = [];
  tokens = [];
  coins = [];
  selectedTowerKey = null;
  // clear the canvas so no stale frame is shown behind the menu
  if (typeof ctx !== 'undefined' && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  buildMenu();
  showScreen(GAME_STATE.MENU);
}

function buildMenu() {
  document.getElementById('wallet-coins').textContent = saveData.wallet.coins;
  document.getElementById('wallet-diamonds').textContent = saveData.wallet.diamonds;
  const container = document.getElementById('menu-levels');
  container.innerHTML = '';
  LEVEL_ORDER.forEach((id, idx) => {
    const lv = LEVEL_DATABASE[id];
    const btn = document.createElement('div');
    btn.className = 'level-btn';
    const locked = idx > saveData.progress.maxLevelIndex;
    const beaten = idx < saveData.progress.maxLevelIndex;
    if (locked) btn.classList.add('locked');
    if (beaten) btn.classList.add('beaten');
    btn.innerHTML = '<span class="stage-emoji">' + STAGE_EMOJI[lv.stage] + '</span>' +
                    '<span>' + id + '</span>' + (beaten ? '<span>✓</span>' : locked ? '<span>🔒</span>' : '');
    if (!locked) btn.addEventListener('click', () => { Sound.menuClick(); openSeedChooser(id); });
    container.appendChild(btn);
  });
}

document.getElementById('reset-save-btn').addEventListener('click', () => {
  if (confirm('Reset all progress?')) {
    SaveManager.reset();
    goToMenu();
  }
});

document.getElementById('shop-btn').addEventListener('click', () => { Sound.menuClick(); openShop(); });
document.getElementById('almanac-btn').addEventListener('click', () => { Sound.menuClick(); openAlmanac(); });

const screenHelp = document.getElementById('screen-help');
document.getElementById('help-btn').addEventListener('click', () => { Sound.menuClick(); showScreen(GAME_STATE.HELP); });
document.getElementById('help-back-btn').addEventListener('click', () => { Sound.menuClick(); goToMenu(); });

// ===== SEED CHOOSER =====
function openSeedChooser(levelId) {
  currentLevelId = levelId;
  currentLevel = LEVEL_DATABASE[levelId];
  chosenSeeds = [];
  document.getElementById('seed-title').textContent = 'Deploy — ' + currentLevel.name;
  document.getElementById('slot-max').textContent = saveData.inventory.seedSlots;
  // preview threat types from waves
  const zTypes = new Set();
  const chanceMap = {
    coneChance: 'CONEHEAD', poleChance: 'POLE_VAULTING', bucketChance: 'BUCKETHEAD',
    newspaperChance: 'NEWSPAPER', footballChance: 'FOOTBALL', spywareChance: 'SPYWARE',
    adwareChance: 'ADWARE', cryptolockerChance: 'CRYPTOLOCKER', glitchChance: 'GLITCH',
    botnetChance: 'BOTNET', aptChance: 'APT', rootkitChance: 'ROOTKIT'
  };
  currentLevel.waves.forEach(w => {
    Object.entries(chanceMap).forEach(([field, type]) => {
      if (w[field] && w[field] > 0) {
        const cfg = THREAT_TYPES[type];
        if (cfg) zTypes.add(cfg.emoji + ' ' + cfg.name);
      }
    });
    if (w.types) {
      w.types.forEach(t => {
        const cfg = THREAT_TYPES[t];
        if (cfg) zTypes.add(cfg.emoji + ' ' + cfg.name);
      });
    }
  });
  document.getElementById('seed-preview').textContent = 'Threats: ' + [...zTypes].join(' | ');
  buildSeedChooser();
  showScreen(GAME_STATE.SEED_CHOOSER);
}

function buildSeedChooser() {
  // available towers = unlocked ∩ level-available
  const available = currentLevel.unlockedTowers.filter(k => saveData.inventory.unlockedTowers.includes(k));
  const slots = saveData.inventory.seedSlots;

  // chosen seed slots bar
  const chosenBar = document.getElementById('chosen-bar');
  chosenBar.innerHTML = '';
  for (let i = 0; i < slots; i++) {
    const slot = document.createElement('div');
    slot.className = 'seed-slot';
    if (chosenSeeds[i]) {
      const cfg = TOWER_TYPES[chosenSeeds[i]];
      slot.classList.remove('seed-slot');
      slot.className = 'inv-card';
      slot.innerHTML = '<div class="emoji">' + cfg.emoji + '</div><div class="name">' + cfg.name + '</div><div class="cost">💰 ' + cfg.cost + '</div>';
      slot.addEventListener('click', () => { chosenSeeds.splice(i, 1); buildSeedChooser(); });
    }
    chosenBar.appendChild(slot);
  }
  document.getElementById('slot-count').textContent = chosenSeeds.length;

  // tower inventory
  const inv = document.getElementById('inventory');
  inv.innerHTML = '';
  available.forEach(key => {
    const cfg = TOWER_TYPES[key];
    const card = document.createElement('div');
    card.className = 'inv-card';
    const picked = chosenSeeds.includes(key);
    if (picked) card.classList.add('picked');
    card.innerHTML = '<div class="emoji">' + cfg.emoji + '</div><div class="name">' + cfg.name +
                     '</div><div class="cost">💰 ' + cfg.cost + '</div>';
    if (!picked) card.addEventListener('click', () => {
      if (chosenSeeds.length >= slots) return;
      chosenSeeds.push(key);
      buildSeedChooser();
    });
    inv.appendChild(card);
  });

  const rockBtn = document.getElementById('lets-rock-btn');
  rockBtn.classList.toggle('disabled', chosenSeeds.length === 0);
}

document.getElementById('seed-back-btn').addEventListener('click', goToMenu);
document.getElementById('lets-rock-btn').addEventListener('click', () => {
  if (chosenSeeds.length === 0) return;
  Sound.menuClick();
  startLevel();
});

// ===== Start Game =====
function startLevel() {
  TOWER_KEYS = chosenSeeds.slice();
  WAVES = currentLevel.waves.slice();

  credits = currentLevel.initialTokens + (saveData.bonusStartingTokens || 0);
  saveData.bonusStartingTokens = 0;
  SaveManager.save(saveData);
  score = 0;
  gameOver = false;
  gameWon = false;
  frame = 0;
  towers = [];
  threats = [];
  projectiles = [];
  tokens = [];
  coins = [];
  floatingTexts = [];
  particles = [];
  collectAnims = [];
  deferredSpawns = [];
  selectedTowerKey = null;
  towerCooldowns = {};
  gamePaused = false;
  gameSpeed = 1;
  shovelActive = false;
  pauseBtn.textContent = '⏸️';
  pauseBtn.title = 'Pause';
  shovelBtn.classList.remove('active');
  currentWave = 0;
  threatsToSpawn = 0;
  threatsSpawnedThisWave = 0;
  waveActive = false;
  waveStarted = false;
  nextWaveAt = 0;
  lastWaveEndTime = 0;
  bannerText = '';
  bannerUntil = 0;
  seedPacketReward = null;
  bossZomboss = null;
  _bossWinTriggered = false;
  gameTime = 0; // reset game clock
  lastSkyToken = 0;
  skyTokenInterval = currentLevel.tokenSpawnRate || 12000;
  gameStartTime = 0;
  overlay.style.display = 'none';
  // grid mode from level config
  gridMode = currentLevel.gridMode || '5_LANE';
  gridRows = gridMode === '6_LANE_POOL' ? 6 : 5;
  CELL_H = canvas.height / gridRows;
  initGrid();
  lawnMowers = [];
  for (let r = 0; r < gridRows; r++) {
    lawnMowers.push(new LawnMower(r));
  }
  buildCards();
  updateCardsUI();
  showScreen(GAME_STATE.PLAYING);
  // force one synchronous render so the fresh, empty board is painted
  // immediately instead of showing a stale frame from the previous match
  render();
  Sound.bgmStart();
}

// ===== CHALLENGE MODES =====
const CHALLENGE_DEFS = [
  {
    id: 'endless',
    name: 'Endless Mode',
    emoji: '♾️',
    desc: 'Infinite waves with scaling difficulty. How long can you survive?',
    unlock: 4, // maxLevelIndex needed
    bestKey: 'cyber_endless_best',
    bestLabel: 'Best Wave'
  },
  {
    id: 'boss_rush',
    name: 'Boss Rush',
    emoji: '👑',
    desc: 'Fight all bosses back-to-back. Credits carry over.',
    unlock: 6,
    bestKey: 'cyber_boss_rush_best',
    bestLabel: 'Best Time'
  },
  {
    id: 'speedrun',
    name: 'Speedrun',
    emoji: '⚡',
    desc: 'Race through the campaign. Timer starts on first action.',
    unlock: 7,
    bestKey: 'cyber_speedrun_best',
    bestLabel: 'Best Time'
  },
  {
    id: 'daily',
    name: 'Daily Breach',
    emoji: '📅',
    desc: 'Same challenge for everyone. Changes every day.',
    unlock: 2,
    bestKey: 'cyber_daily_best',
    bestLabel: 'Best Score'
  }
];

function buildChallengeScreen() {
  const container = document.getElementById('challenge-modes');
  container.innerHTML = '';
  CHALLENGE_DEFS.forEach(ch => {
    const unlocked = saveData.progress.maxLevelIndex >= ch.unlock;
    const div = document.createElement('div');
    div.className = 'level-btn' + (unlocked ? '' : ' locked');
    const best = localStorage.getItem(ch.bestKey) || '—';
    div.innerHTML = '<span class="stage-emoji">' + ch.emoji + '</span>' +
      '<span style="flex:1;text-align:left;">' + ch.name + '<br><small style="color:#666;">' + ch.desc + '</small></span>' +
      '<span>' + (unlocked ? ch.bestLabel + ': ' + best : '🔒 Complete Stage ' + (ch.unlock + 1)) + '</span>';
    if (unlocked) div.addEventListener('click', () => { Sound.menuClick(); launchChallenge(ch.id); });
    container.appendChild(div);
  });
}

document.getElementById('challenges-btn').addEventListener('click', () => {
  Sound.menuClick();
  buildChallengeScreen();
  showScreen(GAME_STATE.CHALLENGES);
});
document.getElementById('challenge-back-btn').addEventListener('click', goToMenu);

function launchChallenge(mode) {
  gameMode = mode;
  if (mode === 'endless') {
    launchEndless();
  } else if (mode === 'boss_rush') {
    launchBossRush();
  } else if (mode === 'speedrun') {
    speedrunStart = 0;
    launchSpeedrunLevel(0);
  } else if (mode === 'daily') {
    launchDailyBreach();
  }
}

// --- Endless Mode ---
function launchEndless() {
  endlessWave = 0;
  currentLevelId = 'ENDLESS';
  currentLevel = {
    name: 'Endless Mode',
    stage: 99,
    gridMode: '5_LANE',
    initialTokens: 200,
    tokenSpawnRate: 10000,
    unlockedTowers: Object.keys(TOWER_TYPES).filter(k => saveData.inventory.unlockedTowers.includes(k)),
    waves: []
  };
  chosenSeeds = currentLevel.unlockedTowers.slice(0, Math.min(8, currentLevel.unlockedTowers.length));
  // auto-start with all unlocked towers
  startLevel();
  // generate first batch of endless waves
  generateEndlessWaves(10);
  bannerText = 'ENDLESS MODE';
  bannerUntil = gameTime + 3000;
}

function generateEndlessWaves(count) {
  const allTypes = Object.keys(THREAT_TYPES).filter(k => k !== 'BOSS' && k !== 'BASIC');
  for (let i = 0; i < count; i++) {
    const waveNum = endlessWave + i;
    const isBossWave = waveNum > 0 && waveNum % 25 === 0;
    const isMiniBoss = waveNum > 0 && waveNum % 10 === 0;
    const hpScale = 1 + waveNum * 0.1;
    const speedScale = 1 + waveNum * 0.02;
    const countScale = Math.min(20, 4 + Math.floor(waveNum * 0.5));
    if (isBossWave) {
      WAVES.push({ types: ['BOSS'], count: 1, delay: 3000, hpScale, speedScale });
    } else if (isMiniBoss) {
      WAVES.push({ types: ['APT', 'ROOTKIT'], count: Math.floor(countScale / 3), delay: 2000, hpScale, speedScale, miniBoss: true });
    } else {
      const pool = [];
      const numTypes = Math.min(4, 1 + Math.floor(waveNum / 5));
      for (let t = 0; t < numTypes; t++) {
        pool.push(allTypes[Math.floor(Math.random() * allTypes.length)]);
      }
      WAVES.push({ types: pool, count: countScale, delay: 2000, hpScale, speedScale });
    }
  }
}

// --- Boss Rush ---
function launchBossRush() {
  bossRushIndex = 0;
  startBossRushLevel();
}

function startBossRushLevel() {
  const bossId = bossRushOrder[bossRushIndex];
  if (!bossId) {
    // all bosses beaten — win!
    gameMode = 'campaign';
    const elapsed = Math.floor((performance.now() - speedrunStart) / 1000);
    const best = parseInt(localStorage.getItem('cyber_boss_rush_best') || '999999');
    if (elapsed < best) {
      localStorage.setItem('cyber_boss_rush_best', elapsed.toString());
    }
    showOverlay('BOSS RUSH COMPLETE!', '#ffd700', 'Back to Menu',
      'Time: ' + formatTime(elapsed));
    return;
  }
  currentLevelId = bossId;
  currentLevel = Object.assign({}, LEVEL_DATABASE[bossId]);
  currentLevel.name = 'Boss Rush — ' + currentLevel.name;
  currentLevel.initialTokens = 400 + bossRushIndex * 100;
  chosenSeeds = currentLevel.unlockedTowers.filter(k => saveData.inventory.unlockedTowers.includes(k));
  if (chosenSeeds.length === 0) chosenSeeds = ['FIREWALL', 'SCANNER'];
  startLevel();
  bannerText = 'BOSS ' + (bossRushIndex + 1) + '/4';
  bannerUntil = gameTime + 3000;
}

// --- Speedrun ---
function launchSpeedrunLevel(idx) {
  if (idx >= LEVEL_ORDER.length) {
    const elapsed = Math.floor((performance.now() - speedrunStart) / 1000);
    const best = parseInt(localStorage.getItem('cyber_speedrun_best') || '999999');
    if (elapsed < best) {
      localStorage.setItem('cyber_speedrun_best', elapsed.toString());
    }
    gameMode = 'campaign';
    showOverlay('SPEEDRUN COMPLETE!', '#ffd700', 'Back to Menu',
      'Time: ' + formatTime(elapsed));
    return;
  }
  currentLevelId = LEVEL_ORDER[idx];
  currentLevel = LEVEL_DATABASE[currentLevelId];
  chosenSeeds = currentLevel.unlockedTowers.filter(k => saveData.inventory.unlockedTowers.includes(k));
  if (chosenSeeds.length === 0) chosenSeeds = ['FIREWALL', 'SCANNER'];
  startLevel();
  bannerText = 'SPEEDRUN — ' + currentLevel.name;
  bannerUntil = gameTime + 2000;
}

// --- Daily Breach ---
function launchDailyBreach() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  // seeded random
  let s = seed;
  const rng = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  // pick 4 random towers from unlocked
  const all = Object.keys(TOWER_TYPES).filter(k => saveData.inventory.unlockedTowers.includes(k));
  chosenSeeds = [];
  while (chosenSeeds.length < 4 && all.length > 0) {
    const idx = Math.floor(rng() * all.length);
    chosenSeeds.push(all.splice(idx, 1)[0]);
  }
  // pick a random level config
  const levelIdx = Math.floor(rng() * LEVEL_ORDER.length);
  currentLevelId = LEVEL_ORDER[levelIdx];
  currentLevel = Object.assign({}, LEVEL_DATABASE[currentLevelId]);
  currentLevel.name = 'Daily Breach — ' + currentLevel.name;
  startLevel();
  bannerText = 'DAILY BREACH';
  bannerUntil = gameTime + 3000;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}
