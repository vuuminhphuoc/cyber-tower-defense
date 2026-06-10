// =====================================================================
// ai-actions.js — Execute AI actions (place, upgrade, sell, collect)
// Depends: state.js, config.js, grid.js, entities.js, ui.js
// Provides (global): AI.executeAction(), AI.executeActions()
// =====================================================================

AI.executeAction = function(action) {
  if (!action || action.type === 'wait') return true;

  switch (action.type) {
    case 'place_tower': return AI.tryPlace(action.row, action.col, action.tower);
    case 'upgrade_tower': return AI.upgradeTower(action.row, action.col);
    case 'sell_tower': return AI.sellTower(action.row, action.col);
    case 'collect_all': return AI.collectAll();
    case 'send_wave': return AI.sendWave();
    case 'toggle_speed': return AI.toggleSpeed();
    default: return false;
  }
};

AI.executeActions = function(actions) {
  let executed = 0;
  for (const action of actions) {
    if (AI.executeAction(action)) {
      executed++;
      if (executed >= AI_CONFIG.maxActionsPerTick) break;
    }
  }
  return executed;
};

AI.tryPlace = function(row, col, key) {
  if (row < 0 || row >= gridRows || col < 0 || col >= COLS) return false;
  const cell = grid[row][col];
  if (!cell) return false;
  const cfg = TOWER_TYPES[key];
  if (!cfg) return false;
  if (credits < cfg.cost) return false;

  const now = performance.now();
  if (towerCooldowns[key] && now < towerCooldowns[key]) return false;

  // water cell rules
  const effType = effectiveCellType(cell);
  if (effType === 'water') {
    if (key === 'PROXY_NODE') {
      if (cell.baseTower) return false;
    } else {
      if (!cell.baseTower || cell.baseTower.key !== 'PROXY_NODE') return false;
      if (cell.tower) return false;
    }
  } else {
    if (key === 'PROXY_NODE') return false;
    if (cell.tower) return false;
  }
  if (effType === 'grave') return false;

  const tower = new Tower(col, row, key);
  if (key === 'PROXY_NODE' && effType === 'water') {
    cell.baseTower = tower;
  } else {
    cell.tower = tower;
  }
  towers.push(tower);
  credits -= cfg.cost;
  towerCooldowns[key] = now + cfg.cooldown;
  Sound.towerPlace();
  updateCardsUI();
  return true;
};

AI.upgradeTower = function(row, col) {
  const cell = grid[row] && grid[row][col];
  if (!cell) return false;
  const tower = cell.tower || cell.baseTower;
  if (!tower || tower.markedForDeletion) return false;
  if (tower.key === 'PROXY_NODE') return false;

  const cfg = TOWER_TYPES[tower.key];
  const upgradeCost = Math.floor(cfg.cost * 0.6);
  if (credits < upgradeCost) return false;

  credits -= upgradeCost;
  tower.hp = Math.floor(tower.hp * 1.3);
  tower.maxHp = Math.floor(tower.maxHp * 1.3);
  tower.upgradeLevel = (tower.upgradeLevel || 0) + 1;
  tower._totalInvested = (tower._totalInvested || cfg.cost) + upgradeCost;
  spawnFloatingText(tower.centerX(), tower.y - 10, 'UPGRADED!', '#ffd700');
  spawnParticles(tower.centerX(), tower.centerY(), 8, '#ffd700');
  Sound.heal();
  updateCardsUI();
  return true;
};

AI.sellTower = function(row, col) {
  const cell = grid[row] && grid[row][col];
  if (!cell) return false;
  const tower = cell.tower || cell.baseTower;
  if (!tower || tower.markedForDeletion) return false;
  if (tower.key === 'PROXY_NODE') return false;

  const cfg = TOWER_TYPES[tower.key];
  const refund = Math.floor((tower._totalInvested || cfg.cost) * 0.6);
  credits += refund;
  tower.markedForDeletion = true;
  if (cell.tower === tower) cell.tower = null;
  else if (cell.baseTower === tower) cell.baseTower = null;
  spawnFloatingText(tower.centerX(), tower.y - 10, '+' + refund, '#ffd700');
  Sound.sell();
  updateCardsUI();
  return true;
};

AI.collectAll = function() {
  let collected = false;
  tokens.forEach(t => {
    if (!t.markedForDeletion) collectToken(t);
  });
  coins.forEach(c => {
    if (!c.markedForDeletion) collectCoinEntity(c);
  });
  return true;
};

AI.sendWave = function() {
  if (waveActive) return false;
  if (!waveStarted) return false;
  if (currentWave + 1 >= WAVES.length) return false;
  startWave(currentWave + 1);
  return true;
};

AI.toggleSpeed = function() {
  gameSpeed = gameSpeed === 1 ? 2 : 1;
  const btn = document.getElementById('speed-btn');
  if (btn) btn.textContent = gameSpeed === 2 ? '⏫' : '⏩';
  return true;
};
