// =====================================================================
// ui.js — Tower card UI, placement, mouse input (collect token, place tower)
// Depends: config.js (TOWER_TYPES, TOWER_KEYS, canvas), state.js,
//   grid.js (pixelToCell), entities.js (Tower), save.js (saveData)
// Provides (global): cardsContainer, creditCounterEl, statusBar, buildCards,
//   selectTower, updateCardsUI, tryTower, collectCoin
// Used by: screens.js (startLevel calls buildCards), main.js (update calls updateCardsUI)
// =====================================================================

const cardsContainer = document.getElementById('cards');
const creditCounterEl = document.getElementById('credit-counter');
const statusBar = document.getElementById('status-bar');

// ===== Tower cards on UI bar =====
function buildCards() {
  cardsContainer.innerHTML = '';
  TOWER_KEYS.forEach(key => {
    const cfg = TOWER_TYPES[key];
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.key = key;
    card.innerHTML =
      '<div class="emoji">' + cfg.emoji + '</div>' +
      '<div class="name">' + cfg.name + '</div>' +
      '<div class="cost">💰 ' + cfg.cost + '</div>' +
      '<div class="cooldown-overlay" style="height:0%"></div>';
    card.addEventListener('click', () => selectTower(key));
    cardsContainer.appendChild(card);
  });
}

function selectTower(key) {
  if (gameOver || gameWon) return;
  const now = performance.now();
  if (towerCooldowns[key] && now < towerCooldowns[key]) {
    spawnFloatingText(canvas.width / 2, 80, 'Cooldown!', '#f39c12');
    return;
  }
  if (credits < TOWER_TYPES[key].cost) {
    spawnFloatingText(canvas.width / 2, 80, 'Not enough coins!', '#e74c3c');
    return;
  }
  selectedTowerKey = (selectedTowerKey === key) ? null : key;   // toggle
  shovelActive = false;
  shovelBtn.classList.remove('active');
  Sound.seedSelect();
  updateCardsUI();
}

function updateCardsUI() {
  const now = performance.now();
  creditCounterEl.textContent = '💰 ' + credits;
  [...cardsContainer.children].forEach(card => {
    const key = card.dataset.key;
    const cfg = TOWER_TYPES[key];
    const onCd = towerCooldowns[key] && now < towerCooldowns[key];
    const tooPoor = credits < cfg.cost;
    card.classList.toggle('selected', selectedTowerKey === key);
    card.classList.toggle('disabled', onCd || tooPoor);
    const overlay = card.querySelector('.cooldown-overlay');
    if (onCd) {
      const pct = (towerCooldowns[key] - now) / cfg.cooldown * 100;
      overlay.style.height = Math.max(0, Math.min(100, pct)) + '%';
    } else {
      overlay.style.height = '0%';
    }
  });
}

function collectToken(token) {
  if (!token || token.markedForDeletion) return false;
  credits += token.value;
  spawnCollectAnim(token.x, token.y, '💰', 50, 10, token.value);
  token.markedForDeletion = true;
  Sound.tokenCollect();
  updateCardsUI();
  return true;
}

function collectCoinEntity(coin) {
  if (!coin || coin.markedForDeletion) return false;
  collectCoin(coin);
  spawnCollectAnim(coin.x, coin.y, coin.emoji, 50, 10, coin.value);
  coin.markedForDeletion = true;
  Sound.coinCollect();
  return true;
}

function sellTower(tower) {
  if (!tower) return false;
  const sellValue = tower.getSellValue();
  credits += sellValue;
  spawnParticles(tower.centerX(), tower.centerY(), 10, '#ff6600');
  spawnCollectAnim(tower.centerX(), tower.centerY(), '💰', 50, 10, sellValue);
  const idx = towers.indexOf(tower);
  if (idx !== -1) towers.splice(idx, 1);
  const cell = grid[tower.row] && grid[tower.row][tower.col];
  if (cell) {
    if (cell.tower === tower) cell.tower = null;
    if (cell.baseTower === tower) cell.baseTower = null;
  }
  Sound.towerPlace();
  updateCardsUI();
  return true;
}

// effective terrain for placement: quantum cells act as water when "charged"
function effectiveCellType(cell) {
  if (cell.cellType === 'quantum') return cell.quantumWater ? 'water' : 'grass';
  return cell.cellType;
}

// ===== Place Tower =====
function tryTower(row, col) {
  if (!selectedTowerKey) return;
  const cell = grid[row][col];
  const cfg = TOWER_TYPES[selectedTowerKey];
  if (credits < cfg.cost) {
    spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Not enough!', '#e74c3c');
    return;
  }
  const now = performance.now();
  if (towerCooldowns[selectedTowerKey] && now < towerCooldowns[selectedTowerKey]) return;

  const effType = effectiveCellType(cell);
  // water cell rules
  if (effType === 'water') {
    if (selectedTowerKey === 'PROXY_NODE') {
      if (cell.baseTower) {
        spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Occupied!', '#f39c12');
        return;
      }
    } else {
      // must have proxy node to place on water
      if (!cell.baseTower || cell.baseTower.key !== 'PROXY_NODE') {
        spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Need Proxy Node!', '#f39c12');
        return;
      }
      if (cell.tower) {
        spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Occupied!', '#f39c12');
        return;
      }
    }
  } else {
    // grass cell: Proxy Node can only be placed on water
    if (selectedTowerKey === 'PROXY_NODE') {
      spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Water only!', '#f39c12');
      return;
    }
  }
  // grave blocks towering
  if (effType === 'grave') {
    spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Blocked!', '#f39c12');
    return;
  }
  // normal cell: can't have tower (unless water + proxy node already handled)
  if (effType !== 'water' && cell.tower) {
    spawnFloatingText(col * CELL_W + CELL_W / 2, TOP_OFFSET + row * CELL_H, 'Occupied!', '#f39c12');
    return;
  }

  const tower = new Tower(col, row, selectedTowerKey);
  if (selectedTowerKey === 'PROXY_NODE' && effType === 'water') {
    cell.baseTower = tower;
  } else {
    cell.tower = tower;
  }
  towers.push(tower);
  credits -= cfg.cost;
  towerCooldowns[selectedTowerKey] = now + cfg.cooldown;
  selectedTowerKey = null;
  Sound.towerPlace();
  updateCardsUI();
  // speedrun: start timer on first action
  if (gameMode === 'speedrun' && speedrunStart === 0) {
    speedrunStart = performance.now();
  }
}

// ===== Mouse Input =====
canvas.addEventListener('click', (e) => {
  if (gameOver || gameWon || gamePaused) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);

    // prioritize token collection (iterate backwards to pick top-most)
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].isClicked(px, py)) {
      collectToken(tokens[i]);
      return;
    }
  }
  // collect coins
  for (let i = coins.length - 1; i >= 0; i--) {
    if (coins[i].isClicked(px, py)) {
      collectCoinEntity(coins[i]);
      return;
    }
  }

  // shovel mode: dig up tower
  if (shovelActive) {
    const c = pixelToCell(px, py);
    if (c && grid[c.row] && grid[c.row][c.col]) {
      const cell = grid[c.row][c.col];
      // remove top tower first, then lily pad
      if (cell.tower) {
        sellTower(cell.tower);
      } else if (cell.baseTower) {
        sellTower(cell.baseTower);
      }
    }
    shovelActive = false;
    shovelBtn.classList.remove('active');
    return;
  }

  // if tower selected -> place
  const c = pixelToCell(px, py);
  if (c) tryTower(c.row, c.col);
});

// mouse hover also collects tokens/coins + tracks hover for range preview
const towerTooltip = document.getElementById('tower-tooltip');
canvas.addEventListener('mousemove', (e) => {
  if (gameOver || gameWon) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  // track hover cell for range preview
  const hc = pixelToCell(px, py);
  if (hc) { hoverRow = hc.row; hoverCol = hc.col; }
  else { hoverRow = -1; hoverCol = -1; }

  // tower tooltip on hover
  if (hc && !selectedTowerKey && !shovelActive) {
    const cell = grid[hc.row] && grid[hc.row][hc.col];
    const tower = cell && (cell.tower || cell.baseTower);
    if (tower && !tower.markedForDeletion) {
      const cfg = TOWER_TYPES[tower.key];
      let html = '<b style="color:#00ff41;">' + cfg.emoji + ' ' + cfg.name + '</b><br>';
      html += 'HP: ' + tower.hp + '/' + tower.maxHp + '<br>';
      if (cfg.damage) html += 'DMG: ' + cfg.damage + '<br>';
      if (cfg.fireRate) html += 'Rate: ' + (cfg.fireRate / 1000).toFixed(1) + 's<br>';
      if (cfg.slow) html += 'Slow: ' + Math.round(cfg.slow * 100) + '%<br>';
      if (cfg.multiShot) html += 'Multi: ' + cfg.multiShot + 'x<br>';
      if (cfg.tokenRate) html += 'Token: every ' + (cfg.tokenRate / 1000).toFixed(0) + 's<br>';
      if (tower.upgradeLevel) html += 'Lv: ' + tower.upgradeLevel + '<br>';
      const upgradeCost = Math.floor(cfg.cost * 0.6);
      html += '<span style="color:#666;">Upgrade: 💰' + upgradeCost + '</span>';
      towerTooltip.innerHTML = html;
      towerTooltip.style.display = 'block';
      towerTooltip.style.left = (e.clientX + 12) + 'px';
      towerTooltip.style.top = (e.clientY - 10) + 'px';
    } else {
      towerTooltip.style.display = 'none';
    }
  } else {
    towerTooltip.style.display = 'none';
  }

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].isClicked(px, py)) {
      collectToken(tokens[i]);
    }
  }
  for (let i = coins.length - 1; i >= 0; i--) {
    if (coins[i].isClicked(px, py)) {
      collectCoinEntity(coins[i]);
    }
  }
});
canvas.addEventListener('mouseleave', () => { hoverRow = -1; hoverCol = -1; towerTooltip.style.display = 'none'; });

function collectCoin(coin) {
  if (coin.kind === 'diamond') saveData.wallet.diamonds += 1;
  else saveData.wallet.coins += coin.value;
  SaveManager.save(saveData);
}

// ===== Right-click to deselect =====
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (selectedTowerKey) {
    selectedTowerKey = null;
    shovelActive = false;
    shovelBtn.classList.remove('active');
    updateCardsUI();
  }
});

// ===== Keyboard shortcuts =====
document.addEventListener('keydown', (e) => {
  if (gameState !== GAME_STATE.PLAYING) return;

  // Escape: deselect tower
  if (e.key === 'Escape') {
    selectedTowerKey = null;
    shovelActive = false;
    shovelBtn.classList.remove('active');
    updateCardsUI();
    return;
  }

  // Space: toggle pause
  if (e.key === ' ') {
    e.preventDefault();
    if (!gameOver && !gameWon) {
      gamePaused = !gamePaused;
      pauseBtn.textContent = gamePaused ? '▶️' : '⏸️';
      pauseBtn.title = gamePaused ? 'Resume' : 'Pause';
      if (gamePaused) hideTowerPanel();
    }
    return;
  }

  // 1-9: select seed card
  const num = parseInt(e.key);
  if (num >= 1 && num <= TOWER_KEYS.length) {
    selectTower(TOWER_KEYS[num - 1]);
    return;
  }

  // S: toggle shovel
  if (e.key === 's' || e.key === 'S') {
    shovelActive = !shovelActive;
    if (shovelActive) selectedTowerKey = null;
    shovelBtn.classList.toggle('active', shovelActive);
    updateCardsUI();
    return;
  }

  // R: restart level
  if (e.key === 'r' || e.key === 'R') {
    if (gameOver || gameWon) {
      overlay.style.display = 'none';
      currentLevel = LEVEL_DATABASE[currentLevelId];
      startLevel();
    }
    return;
  }

  // N: send next wave early
  if (e.key === 'n' || e.key === 'N') {
    if (!waveActive && waveStarted && currentWave + 1 < WAVES.length) {
      startWave(currentWave + 1);
    }
    return;
  }

  // F: toggle fast forward
  if (e.key === 'f' || e.key === 'F') {
    gameSpeed = gameSpeed === 1 ? 2 : 1;
    const btn = document.getElementById('speed-btn');
    if (btn) btn.textContent = gameSpeed === 2 ? '⏫' : '⏩';
    return;
  }
});

// ===== Shovel =====
const shovelBtn = document.getElementById('shovel-btn');
shovelBtn.addEventListener('click', () => {
  shovelActive = !shovelActive;
  if (shovelActive) selectedTowerKey = null;
  shovelBtn.classList.toggle('active', shovelActive);
  updateCardsUI();
});

// ===== Pause =====
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
  if (gameOver || gameWon) return;
  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? '▶️' : '⏸️';
  pauseBtn.title = gamePaused ? 'Resume' : 'Pause';
  if (gamePaused) hideTowerPanel();
});

// ===== Music Toggle =====
const musicBtn = document.getElementById('music-btn');
musicBtn.addEventListener('click', () => {
  const enabled = Sound.bgmToggle();
  musicBtn.textContent = enabled ? '🎵' : '🔇';
  musicBtn.title = enabled ? 'Mute music' : 'Unmute music';
  musicBtn.classList.toggle('muted', !enabled);
});

// ===== Fast Forward =====
const speedBtn = document.getElementById('speed-btn');
speedBtn.addEventListener('click', () => {
  gameSpeed = gameSpeed === 1 ? 2 : 1;
  speedBtn.classList.toggle('active', gameSpeed === 2);
  speedBtn.title = gameSpeed === 2 ? 'Normal Speed (1x)' : 'Fast Forward (2x)';
});

// ===== Send Wave Early =====
const waveBtn = document.getElementById('wave-btn');
waveBtn.addEventListener('click', () => {
  if (gameOver || gameWon || gamePaused) return;
  // boss levels use a different flow — don't allow early send
  if (currentLevel && currentLevel.bossLevel) return;
  // can only send early if no wave is currently active or nextWaveAt is pending
  if (!waveActive && nextWaveAt > 0) {
    nextWaveAt = 0;
    startWave(currentWave + 1);
  } else if (!waveStarted) {
    // start first wave immediately
    waveStarted = true;
    startWave(0);
  }
});

// ===== Touch Events (mobile support) =====
canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (gameOver || gameWon || gamePaused) return;
  const touch = e.changedTouches[0];
  const rect = canvas.getBoundingClientRect();
  const px = (touch.clientX - rect.left) * (canvas.width / rect.width);
  const py = (touch.clientY - rect.top) * (canvas.height / rect.height);
  // collect tokens/coins on tap
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (tokens[i].isClicked(px, py)) {
      collectToken(tokens[i]);
      return;
    }
  }
  for (let i = coins.length - 1; i >= 0; i--) {
    if (coins[i].isClicked(px, py)) {
      collectCoinEntity(coins[i]);
      return;
    }
  }
  // shovel mode
  if (shovelActive) {
    const c = pixelToCell(px, py);
    if (c && grid[c.row] && grid[c.row][c.col]) {
      const cell = grid[c.row][c.col];
      if (cell.tower) {
        sellTower(cell.tower);
      } else if (cell.baseTower) {
        sellTower(cell.baseTower);
      }
    }
    shovelActive = false;
    shovelBtn.classList.remove('active');
    return;
  }
  // tap on placed tower to show info panel (mobile support)
  const tapCell = pixelToCell(px, py);
  if (tapCell && grid[tapCell.row] && grid[tapCell.row][tapCell.col]) {
    const cell = grid[tapCell.row][tapCell.col];
    const tower = cell.tower || cell.baseTower;
    if (tower && !tower.markedForDeletion) {
      showTowerPanel(tower, touch.clientX, touch.clientY);
      return;
    }
  }
  hideTowerPanel();
  // place tower
  const c = pixelToCell(px, py);
  if (c) tryTower(c.row, c.col);
}, { passive: false });

// ===== Tower Info Panel =====
const towerPanel = document.getElementById('tower-panel');
const towerPanelEmoji = document.getElementById('tower-panel-emoji');
const towerPanelName = document.getElementById('tower-panel-name');
const towerPanelStats = document.getElementById('tower-panel-stats');
const towerPanelUpgrade = document.getElementById('tower-panel-upgrade');
const towerPanelSell = document.getElementById('tower-panel-sell');
const towerPanelClose = document.getElementById('tower-panel-close');
let selectedTower = null;

function showTowerPanel(tower, px, py) {
  selectedTower = tower;
  const cfg = tower.cfg;
  towerPanelEmoji.textContent = cfg.emoji;
  towerPanelName.textContent = cfg.name + (tower.upgradeLevel >= 1 ? ' ⭐' : '');
  let stats = 'HP: ' + tower.hp + '/' + tower.maxHp;
  if (cfg.damage) stats += '<br>DMG: ' + cfg.damage;
  if (cfg.fireRate) stats += '<br>Rate: ' + (cfg.fireRate / 1000).toFixed(1) + 's';
  if (cfg.healAmount) stats += '<br>Heal: ' + cfg.healAmount + '/tick';
  if (cfg.tokenRate) stats += '<br>Prod: ' + (cfg.tokenRate / 1000).toFixed(0) + 's';
  if (cfg.slow && tower.type === 'scanner') stats += '<br>Slow: ' + Math.round((1 - cfg.slow) * 100) + '%';
  if (cfg.cloakRadius) stats += '<br>Radius: ' + cfg.cloakRadius + ' tiles';
  if (cfg.multiShot) stats += '<br>Shots: ' + cfg.multiShot;
  towerPanelStats.innerHTML = stats;

  // suppress upgrade/sell for bomb/jalapeno (they explode instantly)
  const isInstantUse = tower.type === 'bomb' || tower.type === 'jalapeno';

  // upgrade button with stat preview
  if (!isInstantUse && tower.upgradeLevel < 1 && cfg.upgradeCost) {
    const canAfford = credits >= cfg.upgradeCost;
    let upgradePreview = '';
    if (cfg.damage) upgradePreview += 'DMG ' + cfg.damage + '→' + Math.floor(cfg.damage * 1.4) + ' ';
    if (cfg.fireRate) upgradePreview += 'Rate ' + (cfg.fireRate / 1000).toFixed(1) + 's→' + (Math.floor(cfg.fireRate * 0.8) / 1000).toFixed(1) + 's ';
    if (cfg.hp && tower.key !== 'PROXY_NODE') upgradePreview += 'HP ' + tower.hp + '→' + Math.floor(cfg.hp * 1.5) + ' ';
    if (cfg.healAmount) upgradePreview += 'Heal ' + cfg.healAmount + '→' + Math.floor(cfg.healAmount * 1.3) + ' ';
    if (cfg.tokenRate) upgradePreview += 'Prod ' + (cfg.tokenRate / 1000).toFixed(0) + 's→' + (Math.floor(cfg.tokenRate * 0.7) / 1000).toFixed(0) + 's ';
    if (cfg.cloakRadius) upgradePreview += 'Radius ' + cfg.cloakRadius + '→' + +(cfg.cloakRadius * 1.5).toFixed(1) + ' ';
    if (cfg.slow && tower.type === 'scanner') upgradePreview += 'Slow ' + Math.round((1 - cfg.slow) * 100) + '%→' + Math.round((1 - cfg.slow * 0.8) * 100) + '% ';
    if (cfg.multiShot) upgradePreview += 'Shots ' + cfg.multiShot + '→' + (cfg.multiShot + 1) + ' ';
    towerPanelUpgrade.innerHTML = '<div style="color:#00cc33;font-size:10px;margin-bottom:3px;">' + upgradePreview + '</div>' +
      '<button id="upgrade-btn" style="background:' + (canAfford ? '#00ff41' : '#333') + ';color:#0a0e14;border:none;padding:4px 10px;cursor:' + (canAfford ? 'pointer' : 'not-allowed') + ';font-size:12px;border-radius:3px;">⬆ Upgrade (💰' + cfg.upgradeCost + ')</button>';
    document.getElementById('upgrade-btn').addEventListener('click', () => {
      if (selectedTower && selectedTower.upgrade()) {
        showTowerPanel(selectedTower, px, py);
        updateCardsUI();
      }
    });
  } else {
    towerPanelUpgrade.innerHTML = tower.upgradeLevel >= 1 ? '<span style="color:#ffd700;font-size:12px;">MAX LEVEL</span>' : '';
  }

  // sell button
  if (isInstantUse) {
    towerPanelSell.innerHTML = '<span style="color:#00cc33;font-size:11px;">Instant use tower</span>';
  } else {
    const sellVal = tower.getSellValue();
    towerPanelSell.innerHTML = '<button id="sell-btn" style="background:#ff6600;color:#fff;border:none;padding:4px 10px;cursor:pointer;font-size:12px;border-radius:3px;">🗑 Sell (💰' + sellVal + ')</button>';
    document.getElementById('sell-btn').addEventListener('click', () => {
      if (selectedTower) {
        sellTower(selectedTower);
        hideTowerPanel();
      }
    });
  }

  // position panel
  const rect = canvas.getBoundingClientRect();
  let panelX = px + 20;
  let panelY = py - 60;
  if (panelX + 180 > rect.right) panelX = px - 180;
  if (panelY < rect.top) panelY = py + 20;
  towerPanel.style.left = panelX + 'px';
  towerPanel.style.top = panelY + 'px';
  towerPanel.style.display = 'block';
}

function hideTowerPanel() {
  towerPanel.style.display = 'none';
  selectedTower = null;
}

towerPanelClose.addEventListener('click', hideTowerPanel);

// click on placed tower to show info panel
canvas.addEventListener('mousedown', (e) => {
  if (gameOver || gameWon || gamePaused) return;
  if (shovelActive) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  const c = pixelToCell(px, py);
  if (c && grid[c.row] && grid[c.row][c.col]) {
    const cell = grid[c.row][c.col];
    const tower = cell.tower || cell.baseTower;
    if (tower && !tower.markedForDeletion) {
      showTowerPanel(tower, e.clientX, e.clientY);
      return;
    }
  }
  hideTowerPanel();
});
