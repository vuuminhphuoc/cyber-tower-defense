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
  showOverlay('SYSTEM BREACH', '#e74c3c', 'Retry', 'Redeploy to this node?', true);
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
  } else {
    goToMenu();
  }
});

// ========== Screen Management ==========
const screenMenu = document.getElementById('screen-menu');
const screenSeed = document.getElementById('screen-seed');

function showScreen(state) {
  gameState = state;
  screenMenu.classList.toggle('active', state === GAME_STATE.MENU);
  screenSeed.classList.toggle('active', state === GAME_STATE.SEED_CHOOSER);
  if (typeof screenShop !== 'undefined') screenShop.classList.toggle('active', state === GAME_STATE.SHOP);
  if (typeof screenAlmanac !== 'undefined') screenAlmanac.classList.toggle('active', state === GAME_STATE.ALMANAC);
  if (typeof screenHelp !== 'undefined') screenHelp.classList.toggle('active', state === GAME_STATE.HELP);
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
