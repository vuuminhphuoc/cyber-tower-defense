// =====================================================================
// ai-state.js — Serialize game state for AI consumption
// Depends: state.js, config.js, grid.js
// Provides (global): AI.getState(), AI.getLegalActions()
// =====================================================================

const AI = {};

AI.getState = function() {
  const lanes = [];
  for (let r = 0; r < gridRows; r++) {
    const threatsInLane = [];
    const towersInLane = [];
    const cells = [];
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r] && grid[r][c];
      const hasTower = !!(cell && (cell.tower || cell.baseTower));
      const towerKey = cell && cell.tower ? cell.tower.key : (cell && cell.baseTower ? cell.baseTower.key : null);
      if (hasTower) towersInLane.push(towerKey);
      cells.push({
        col: c,
        type: cell ? cell.cellType : 'grass',
        hasTower,
        towerKey,
        water: cell ? !!cell.quantumWater : false
      });
    }
    threats.forEach(z => {
      if (z.row === r && !z.markedForDeletion) {
        const cfg = THREAT_TYPES[z.type];
        threatsInLane.push({
          type: z.type,
          x: z.x,
          hp: z.hp,
          maxHp: z.maxHp,
          eating: z.isEating,
          speed: cfg ? cfg.speed : 0,
          danger: cfg ? cfg.hp * cfg.speed : 0
        });
      }
    });
    const laneDangerScore = threatsInLane.reduce((sum, t) => sum + t.danger, 0);
    lanes.push({ row: r, threats: threatsInLane, towers: towersInLane, cells, danger: laneDangerScore });
  }
  return {
    level: currentLevelId,
    stage: currentLevel ? currentLevel.stage : 1,
    credits,
    score,
    wave: waveStarted ? (currentWave + 1) + '/' + WAVES.length : '0/' + WAVES.length,
    waveActive,
    gridRows,
    gridCols: COLS,
    mowers: lawnMowers.map(m => !m.markedForDeletion),
    availableTowers: TOWER_KEYS.map(k => ({
      key: k,
      cost: TOWER_TYPES[k].cost,
      type: TOWER_TYPES[k].type,
      dps: TOWER_DPS ? (TOWER_DPS[k] || 0) : 0,
      cooldownReady: !towerCooldowns[k] || performance.now() >= towerCooldowns[k]
    })),
    lanes,
    tokens: tokens.map(t => ({ x: t.x, y: t.y, type: t.cfg ? t.cfg.emoji : '🪙' })),
    coins: coins.map(c => ({ x: c.x, y: c.y, value: c.cfg ? c.cfg.value : 5 }))
  };
};

AI.getLegalActions = function() {
  const state = AI.getState();
  const actions = [];

  // collect tokens/coins
  if (tokens.length > 0 || coins.length > 0) {
    actions.push({ type: 'collect_all' });
  }

  // place tower
  for (const lane of state.lanes) {
    for (const cell of lane.cells) {
      if (cell.hasTower) continue;
      if (cell.type === 'grave') continue;
      // water cells need proxy node
      if (cell.type === 'water' && !lane.cells.some(c => c.hasTower && c.towerKey === 'PROXY_NODE')) {
        if (state.credits >= TOWER_TYPES['PROXY_NODE'].cost) {
          actions.push({ type: 'place_tower', tower: 'PROXY_NODE', row: lane.row, col: cell.col });
        }
        continue;
      }
      if (cell.type === 'water' && !cell.hasTower) continue; // need proxy on top
      for (const tower of state.availableTowers) {
        if (!tower.cooldownReady) continue;
        if (tower.key === 'PROXY_NODE' && cell.type !== 'water') continue;
        if (tower.cost <= state.credits) {
          actions.push({ type: 'place_tower', tower: tower.key, row: lane.row, col: cell.col });
        }
      }
    }
  }

  // upgrade tower (max level 3)
  for (const lane of state.lanes) {
    for (const cell of lane.cells) {
      if (!cell.hasTower || cell.towerKey === 'PROXY_NODE') continue;
      // find actual tower to check upgrade level
      const actualCell = grid[lane.row] && grid[lane.row][cell.col];
      const actualTower = actualCell && (actualCell.tower || actualCell.baseTower);
      const currentLevel = actualTower ? (actualTower.upgradeLevel || 0) : 0;
      if (currentLevel >= 3) continue; // max upgrade level
      const cfg = TOWER_TYPES[cell.towerKey];
      const upgradeCost = Math.floor(cfg.cost * 0.6);
      if (state.credits >= upgradeCost) {
        actions.push({ type: 'upgrade_tower', row: lane.row, col: cell.col, cost: upgradeCost });
      }
    }
  }

  // sell tower
  for (const lane of state.lanes) {
    for (const cell of lane.cells) {
      if (!cell.hasTower || cell.towerKey === 'PROXY_NODE') continue;
      const refund = Math.floor(TOWER_TYPES[cell.towerKey].cost * 0.6);
      actions.push({ type: 'sell_tower', row: lane.row, col: cell.col, refund });
    }
  }

  // send wave
  if (!state.waveActive && waveStarted) {
    actions.push({ type: 'send_wave' });
  }

  // toggle speed
  actions.push({ type: 'toggle_speed' });

  // wait
  actions.push({ type: 'wait' });

  return actions;
};
