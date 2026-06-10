// =====================================================================
// ai-rule-bot.js — Rule-based decision engine (improved)
// Depends: ai-state.js, ai-actions.js
// Provides (global): AI.ruleBotDecide(state, legalActions)
// =====================================================================

AI.ruleBotDecide = function(state, legalActions) {
  const decisions = [];
  const actionsByType = {};
  legalActions.forEach(a => {
    if (!actionsByType[a.type]) actionsByType[a.type] = [];
    actionsByType[a.type].push(a);
  });

  const allThreats = state.lanes.reduce((sum, l) => sum + l.threats.length, 0);
  const totalTowers = state.lanes.reduce((sum, l) => sum + l.towers.length, 0);

  // 0. ALWAYS: Collect all tokens/coins FIRST (highest priority, always do this)
  if (actionsByType.collect_all && actionsByType.collect_all.length > 0) {
    decisions.push(actionsByType.collect_all[0]);
    return decisions; // collect first, then next tick will place towers
  }

  // 1. CRITICAL: Emergency wall — threat in final 2 columns with no wall
  for (const lane of state.lanes) {
    for (const threat of lane.threats) {
      if (threat.x < 2 * CELL_W) {
        const hasWall = lane.towers.some(t => TOWER_TYPES[t] && TOWER_TYPES[t].type === 'defender');
        if (!hasWall) {
          const placeActions = (actionsByType.place_tower || []).filter(a =>
            a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'defender'
          );
          if (placeActions.length > 0) {
            placeActions.sort((a, b) => b.col - a.col);
            decisions.push(placeActions[0]);
            return decisions;
          }
        }
      }
    }
  }

  // 2. CRITICAL: No mower + threat in final 3 cells → emergency bomb
  for (let i = 0; i < state.lanes.length; i++) {
    const lane = state.lanes[i];
    const hasMower = state.mowers[i];
    if (hasMower) continue;
    for (const threat of lane.threats) {
      if (threat.x < 3 * CELL_W) {
        const bombActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'bomb'
        );
        if (bombActions.length > 0) {
          decisions.push(bombActions[0]);
          return decisions;
        }
        // also try chomper (instant kill)
        const chompActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'chomper'
        );
        if (chompActions.length > 0) {
          decisions.push(chompActions[0]);
          return decisions;
        }
      }
    }
  }

  // 3. HIGH: Lane has threat + no shooter → place cheapest shooter
  for (const lane of state.lanes) {
    if (lane.threats.length === 0) continue;
    const hasShooter = lane.towers.some(t => TOWER_TYPES[t] && (TOWER_TYPES[t].type === 'shooter' || TOWER_TYPES[t].type === 'multishooter' || TOWER_TYPES[t].type === 'chomper'));
    if (hasShooter) continue;
    const shootActions = (actionsByType.place_tower || []).filter(a =>
      a.row === lane.row && TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'shooter' || TOWER_TYPES[a.tower].type === 'multishooter')
    );
    if (shootActions.length > 0) {
      shootActions.sort((a, b) => TOWER_TYPES[a.tower].cost - TOWER_TYPES[b.tower].cost);
      decisions.push(shootActions[0]);
      return decisions;
    }
  }

  // 5. MEDIUM: Wave idle + no threats alive → send next wave
  if (!state.waveActive && allThreats === 0) {
    const canSend = state.wave !== '0/' + WAVES.length;
    if (canSend) {
      const sendActions = actionsByType.send_wave || [];
      if (sendActions.length > 0) {
        decisions.push(sendActions[0]);
        return decisions;
      }
    }
  }

  // 6. MEDIUM: Idle + credits > 50 → place producer (economy first)
  if (state.credits >= 50) {
    const producerActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer'
    );
    if (producerActions.length > 0) {
      // place in lane with fewest threats (safest), prefer leftmost empty cell
      let bestProducer = null;
      let bestScore = -1;
      for (const action of producerActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        const threatPenalty = lane ? lane.threats.length * 20 : 0;
        const colBonus = action.col * 2; // prefer left columns (safer)
        const score = colBonus - threatPenalty;
        if (score > bestScore) {
          bestScore = score;
          bestProducer = action;
        }
      }
      if (bestProducer) {
        decisions.push(bestProducer);
        return decisions;
      }
    }
  }

  // 7. MEDIUM: Enough credits → upgrade tower in lane with most threats
  if (state.credits >= 80) {
    const upgradeActions = actionsByType.upgrade_tower || [];
    if (upgradeActions.length > 0) {
      let bestUpgrade = null;
      let bestScore = -1;
      for (const action of upgradeActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        const score = lane ? lane.threats.length * 10 + (lane.towers.length > 1 ? 5 : 0) : 0;
        if (score > bestScore) {
          bestScore = score;
          bestUpgrade = action;
        }
      }
      if (bestUpgrade) {
        decisions.push(bestUpgrade);
        return decisions;
      }
    }
  }

  // 8. MEDIUM: Water cell + no Proxy Node → place Proxy Node
  for (const lane of state.lanes) {
    for (const cell of lane.cells) {
      if (cell.type === 'water' && !cell.hasTower) {
        const proxyActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && a.col === cell.col && a.tower === 'PROXY_NODE'
        );
        if (proxyActions.length > 0 && state.credits >= TOWER_TYPES['PROXY_NODE'].cost) {
          decisions.push(proxyActions[0]);
          return decisions;
        }
      }
    }
  }

  // 9. LOW: Idle + credits > 200 → place utility (scanner/vpn) in busiest lane
  if (state.credits >= 200) {
    const utilActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'scanner' || TOWER_TYPES[a.tower].type === 'vpn')
    );
    if (utilActions.length > 0) {
      // place in lane with most threats
      let bestUtil = null;
      let bestScore = -1;
      for (const action of utilActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        const score = lane ? lane.threats.length * 10 + lane.towers.length : 0;
        if (score > bestScore) {
          bestScore = score;
          bestUtil = action;
        }
      }
      if (bestUtil) {
        decisions.push(bestUtil);
        return decisions;
      }
    }
  }

  // 10. LOW: Idle + many credits → place second shooter in busy lane
  if (state.credits >= 150 && allThreats > 0) {
    const shootActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'shooter' || TOWER_TYPES[a.tower].type === 'multishooter')
    );
    if (shootActions.length > 0) {
      // find lane with most threats but only 1 shooter
      let bestLane = null;
      let bestScore = -1;
      for (const lane of state.lanes) {
        if (lane.threats.length === 0) continue;
        const shooterCount = lane.towers.filter(t => TOWER_TYPES[t] && (TOWER_TYPES[t].type === 'shooter' || TOWER_TYPES[t].type === 'multishooter')).length;
        if (shooterCount >= 2) continue;
        const score = lane.threats.length * 10 - shooterCount * 5;
        if (score > bestScore) {
          bestScore = score;
          bestLane = lane;
        }
      }
      if (bestLane) {
        const action = shootActions.find(a => a.row === bestLane.row);
        if (action) {
          decisions.push(action);
          return decisions;
        }
      }
    }
  }

  // 11. DEFAULT: wait
  decisions.push({ type: 'wait' });
  return decisions;
};
