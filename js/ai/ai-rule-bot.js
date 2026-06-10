// =====================================================================
// ai-rule-bot.js — Rule-based decision engine
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

  // 1. CRITICAL: Emergency wall — threat in final 2 cells with no wall
  for (const lane of state.lanes) {
    for (const threat of lane.threats) {
      if (threat.x < 2 * CELL_W) {
        const hasWall = lane.towers.some(t => TOWER_TYPES[t] && TOWER_TYPES[t].type === 'defender');
        if (!hasWall) {
          const placeActions = (actionsByType.place_tower || []).filter(a =>
            a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'defender'
          );
          if (placeActions.length > 0) {
            // pick the one closest to the threat
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
      }
    }
  }

  // 3. HIGH: Lane has threat + no shooter → place cheapest shooter
  for (const lane of state.lanes) {
    if (lane.threats.length === 0) continue;
    const hasShooter = lane.towers.some(t => TOWER_TYPES[t] && (TOWER_TYPES[t].type === 'shooter' || TOWER_TYPES[t].type === 'multishooter'));
    if (hasShooter) continue;
    const shootActions = (actionsByType.place_tower || []).filter(a =>
      a.row === lane.row && TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'shooter' || TOWER_TYPES[a.tower].type === 'multishooter')
    );
    if (shootActions.length > 0) {
      // pick cheapest
      shootActions.sort((a, b) => TOWER_TYPES[a.tower].cost - TOWER_TYPES[b.tower].cost);
      decisions.push(shootActions[0]);
      return decisions;
    }
  }

  // 4. HIGH: Collect all tokens/coins
  if (actionsByType.collect_all && actionsByType.collect_all.length > 0) {
    decisions.push(actionsByType.collect_all[0]);
    return decisions;
  }

  // 5. MEDIUM: Wave not started + board stable → send wave
  if (!state.waveActive && state.wave !== '0/' + WAVES.length) {
    if (lane.threats.length === 0 || state.lanes.every(l => l.threats.length === 0)) {
      const sendActions = actionsByType.send_wave || [];
      if (sendActions.length > 0) {
        decisions.push(sendActions[0]);
        return decisions;
      }
    }
  }

  // 6. MEDIUM: Enough credits + good placement → upgrade strongest tower
  if (state.credits >= 100) {
    const upgradeActions = actionsByType.upgrade_tower || [];
    if (upgradeActions.length > 0) {
      // prioritize towers in lanes with most threats
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

  // 7. MEDIUM: Water cell + no Proxy Node → place Proxy Node
  for (const lane of state.lanes) {
    for (const cell of lane.cells) {
      if (cell.type === 'water' && !cell.hasTower) {
        const proxyActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && a.col === cell.col && a.tower === 'PROXY_NODE'
        );
        if (proxyActions.length > 0) {
          decisions.push(proxyActions[0]);
          return decisions;
        }
      }
    }
  }

  // 8. LOW: Idle + credits > 50 → place producer in safest lane
  if (!state.waveActive && state.credits >= 50) {
    const producerActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer'
    );
    if (producerActions.length > 0) {
      // place in lane with fewest threats (safest)
      let safestLane = 0;
      let minThreats = Infinity;
      for (const lane of state.lanes) {
        if (lane.threats.length < minThreats) {
          minThreats = lane.threats.length;
          safestLane = lane.row;
        }
      }
      const safeProducer = producerActions.find(a => a.row === safestLane);
      if (safeProducer) {
        decisions.push(safeProducer);
        return decisions;
      }
      decisions.push(producerActions[0]);
      return decisions;
    }
  }

  // 9. LOW: Idle + credits > 200 → place utility tower (scanner/vpn)
  if (!state.waveActive && state.credits >= 200) {
    const utilActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'scanner' || TOWER_TYPES[a.tower].type === 'vpn')
    );
    if (utilActions.length > 0) {
      decisions.push(utilActions[0]);
      return decisions;
    }
  }

  // 10. DEFAULT: wait
  decisions.push({ type: 'wait' });
  return decisions;
};
