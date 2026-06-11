// =====================================================================
// ai-rule-bot.js — Rule-based decision engine (v8: batched shooters)
// Depends: ai-state.js, ai-actions.js, config.js
// Provides (global): AI.ruleBotDecide(state, legalActions)
//
// v8: Batches all shooter placements into one phase so the controller
// can execute 3 placements per tick instead of 1.
// =====================================================================

const TOWER_DPS = {
  QUANTUM_FIREWALL:  75,
  SNIPER:           60,
  DATA_PURGE:       48,
  FIREWALL:         25,
  DDoS_BOT:         25,
  ENCRYPTION:       20.8,
  HONEYPOT:         999,
  HONEYPOT_CLUSTER: 999,
  NUCLEAR_OPTION:   33.3,
};

function threatDanger(t) {
  const cfg = THREAT_TYPES[t.type];
  if (!cfg) return 0;
  let danger = cfg.hp * cfg.speed;
  if (t.type === 'FOOTBALL') danger *= 2.0;
  if (t.type === 'POLE_VAULTING') danger *= 1.8;
  if (t.type === 'QUANTUM_WORM') danger *= 1.6;
  if (t.type === 'NEWSPAPER') danger *= 1.4;
  if (t.type === 'CRYPTOLOCKER') danger *= 1.3;
  if (t.type === 'ROOTKIT') danger *= 1.3;
  if (t.type === 'APT') danger *= 1.2;
  if (t.type === 'SUPPLY_CHAIN') danger *= 1.5;
  if (t.type === 'MALWARE_DROPPER') danger *= 1.4;
  if (t.type === 'DNS_SPOOFER') danger *= 1.2;
  if (t.type === 'SPYWARE') danger *= 1.1;
  if (t.type === 'INSIDER_THREAT') danger *= 1.2;
  if (t.type === 'SQL_INJECTION') danger *= 1.1;
  return danger;
}

function laneDanger(lane) {
  return lane.threats.reduce((sum, t) => sum + threatDanger(t), 0);
}

function countType(lane, types) {
  return lane.towers.filter(k => {
    const cfg = TOWER_TYPES[k];
    return cfg && types.includes(cfg.type);
  }).length;
}

function laneShooterCount(lane) { return countType(lane, ['shooter', 'multishooter', 'pierce_shooter']); }
function laneHasType(lane, types) {
  return lane.towers.some(k => { const cfg = TOWER_TYPES[k]; return cfg && types.includes(cfg.type); });
}
function laneHasWall(lane) { return laneHasType(lane, ['defender', 'defender_aura']); }
function laneHasSlow(lane) { return laneHasType(lane, ['scanner', 'aura_slow']); }
function laneHasProducer(lane) { return laneHasType(lane, ['producer']); }

function cheapestShooter(available, credits) {
  let best = null, bestCost = Infinity;
  for (const t of available) {
    if (!t.cooldownReady || t.cost > credits) continue;
    if (t.type !== 'shooter' && t.type !== 'multishooter' && t.type !== 'pierce_shooter') continue;
    if (t.cost < bestCost) { bestCost = t.cost; best = t; }
  }
  return best;
}

function bestDpsShooter(available, credits) {
  let best = null, bestDps = 0;
  for (const t of available) {
    if (!t.cooldownReady || t.cost > credits) continue;
    if (t.type !== 'shooter' && t.type !== 'multishooter' && t.type !== 'pierce_shooter') continue;
    const dps = TOWER_DPS[t.key] || 0;
    if (dps > bestDps) { bestDps = dps; best = t; }
  }
  return best;
}

function findShooterAction(actions, row, available, credits) {
  const tower = bestDpsShooter(available, credits) || cheapestShooter(available, credits);
  if (!tower) return null;
  const matching = actions.filter(a => a.row === row && a.tower === tower.key);
  if (matching.length === 0) return null;
  return matching.sort((a, b) => Math.abs(a.col - 3.5) - Math.abs(b.col - 3.5))[0];
}

AI.ruleBotDecide = function(state, legalActions) {
  const d = [];
  const byType = {};
  legalActions.forEach(a => {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
  });

  const allThreats = state.lanes.reduce((sum, l) => sum + l.threats.length, 0);
  const totalShooters = state.lanes.reduce((sum, l) => sum + laneShooterCount(l), 0);
  const totalProducers = state.lanes.reduce((sum, l) => sum + (laneHasProducer(l) ? 1 : 0), 0);
  const placeActions = byType.place_tower || [];

  const lanesByDanger = [...state.lanes]
    .filter(l => l.threats.length > 0)
    .sort((a, b) => laneDanger(b) - laneDanger(a));

  // 1. COLLECT
  if (byType.collect_all && byType.collect_all.length > 0) {
    d.push(byType.collect_all[0]);
  }

  // 2. EMERGENCY — threat at base
  for (let i = 0; i < state.lanes.length; i++) {
    const lane = state.lanes[i];
    if (state.mowers[i]) continue;
    for (const threat of lane.threats) {
      if (threat.x < 2 * CELL_W && !laneHasWall(lane)) {
        const wall = placeActions.filter(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] &&
          (TOWER_TYPES[a.tower].type === 'defender' || TOWER_TYPES[a.tower].type === 'defender_aura')
        ).sort((a, b) => (TOWER_TYPES[b.tower].hp || 0) - (TOWER_TYPES[a.tower].hp || 0))[0];
        if (wall) { d.push(wall); return d; }
      }
      if (threat.x < 3 * CELL_W) {
        const bomb = placeActions.find(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] &&
          (TOWER_TYPES[a.tower].type === 'bomb' || TOWER_TYPES[a.tower].type === 'jalapeno' ||
           TOWER_TYPES[a.tower].type === 'chomper' || TOWER_TYPES[a.tower].type === 'chomper_aoe')
        );
        if (bomb) { d.push(bomb); return d; }
      }
    }
  }

  // 3. SEND WAVE — if idle + no threats
  if (!state.waveActive && allThreats === 0 && state.wave) {
    const waveNum = parseInt(state.wave) || 0;
    if (waveNum < WAVES.length && byType.send_wave && byType.send_wave.length > 0) {
      d.push(byType.send_wave[0]);
      return d;
    }
  }

  // 4. ECONOMY — first producer
  if (totalProducers === 0 && state.credits >= 50) {
    const prod = placeActions.filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer'
    ).sort((a, b) => {
      const aScore = (state.mowers[a.row] ? 200 : 0) - a.col * 5;
      const bScore = (state.mowers[b.row] ? 200 : 0) - b.col * 5;
      return bScore - aScore;
    })[0];
    if (prod) { d.push(prod); return d; }
  }

  // 5. BATCH SHOOTERS — collect ALL possible shooter placements
  // Priority: threatened lanes (1st) > empty lanes (1st) > threatened (2nd) > busy (3rd) > rich (4th)
  const shooterActions = [];
  const laneShootersAdded = {};

  // 5a: shooters in threatened lanes with 0 shooters
  for (const lane of lanesByDanger) {
    if (laneShooterCount(lane) >= 1) continue;
    const shoot = findShooterAction(placeActions, lane.row, state.availableTowers, state.credits);
    if (shoot) { shooterActions.push(shoot); laneShootersAdded[lane.row] = (laneShootersAdded[lane.row] || 0) + 1; }
  }

  // 5b: 2nd shooter in threatened lanes (BEFORE empty lanes)
  for (const lane of lanesByDanger) {
    if (laneShooterCount(lane) + (laneShootersAdded[lane.row] || 0) >= 2) continue;
    const shoot = findShooterAction(placeActions, lane.row, state.availableTowers, state.credits);
    if (shoot) { shooterActions.push(shoot); laneShootersAdded[lane.row] = (laneShootersAdded[lane.row] || 0) + 1; }
  }

  // 5c: 3rd shooter in very busy lanes (3+ threats)
  for (const lane of lanesByDanger) {
    if (lane.threats.length < 3) continue;
    if (laneShooterCount(lane) + (laneShootersAdded[lane.row] || 0) >= 3) continue;
    const shoot = findShooterAction(placeActions, lane.row, state.availableTowers, state.credits);
    if (shoot) { shooterActions.push(shoot); laneShootersAdded[lane.row] = (laneShootersAdded[lane.row] || 0) + 1; }
  }

  // 5d: more shooters when rich (100+ credits)
  if (state.credits >= 100) {
    for (const lane of lanesByDanger) {
      if (laneShooterCount(lane) + (laneShootersAdded[lane.row] || 0) >= 4) continue;
      const shoot = findShooterAction(placeActions, lane.row, state.availableTowers, state.credits);
      if (shoot) { shooterActions.push(shoot); laneShootersAdded[lane.row] = (laneShootersAdded[lane.row] || 0) + 1; }
    }
  }

  // 5e: shooters in empty lanes (ONLY when no active threats or all threatened lanes have 2+)
  if (allThreats === 0 || lanesByDanger.every(l => laneShooterCount(l) >= 2)) {
    for (const lane of state.lanes) {
      if (laneShooterCount(lane) > 0 || laneShootersAdded[lane.row]) continue;
      const shoot = findShooterAction(placeActions, lane.row, state.availableTowers, state.credits);
      if (shoot) { shooterActions.push(shoot); laneShootersAdded[lane.row] = (laneShootersAdded[lane.row] || 0) + 1; }
    }
  }

  // Push up to 3 shooter actions (leave room for collect = 1 action)
  const maxShooters = byType.collect_all && byType.collect_all.length > 0 ? 2 : 3;
  for (let i = 0; i < Math.min(shooterActions.length, maxShooters); i++) {
    d.push(shooterActions[i]);
  }
  if (shooterActions.length > 0) return d;

  // 6. ECONOMY — additional producers (up to 5) when idle
  if (totalProducers >= 1 && totalProducers < 5 && allThreats === 0 && state.credits >= 50) {
    const prod = placeActions.filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer' &&
      !laneHasProducer(state.lanes.find(l => l.row === a.row))
    ).sort((a, b) => {
      const aScore = (state.mowers[a.row] ? 200 : 0) - a.col * 5;
      const bScore = (state.mowers[b.row] ? 200 : 0) - b.col * 5;
      return bScore - aScore;
    })[0];
    if (prod) { d.push(prod); return d; }
  }

  // 7. WALL — in lane with no mower + threat approaching (6 cells)
  for (let i = 0; i < state.lanes.length; i++) {
    const lane = state.lanes[i];
    if (laneHasWall(lane) || state.mowers[i]) continue;
    if (!lane.threats.some(t => t.x < 6 * CELL_W)) continue;
    const wall = placeActions.filter(a =>
      a.row === lane.row && TOWER_TYPES[a.tower] &&
      (TOWER_TYPES[a.tower].type === 'defender' || TOWER_TYPES[a.tower].type === 'defender_aura')
    ).sort((a, b) => b.col - a.col)[0];
    if (wall) { d.push(wall); return d; }
  }

  // 8. BOMB — Data Purge when 3+ threats
  if (state.credits >= 150) {
    for (const lane of lanesByDanger) {
      if (lane.threats.length < 3) continue;
      const bomb = placeActions.find(a =>
        a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'bomb'
      );
      if (bomb) { d.push(bomb); return d; }
    }
  }

  // 9. SIEM
  if (state.credits >= 225) {
    const siem = placeActions.filter(a => a.tower === 'SIEM_CENTER').filter(a => {
      const lane = state.lanes.find(l => l.row === a.row);
      return lane && laneShooterCount(lane) >= 2;
    })[0];
    if (siem) { d.push(siem); return d; }
  }

  // 10. SLOW
  if (state.credits >= 75 && allThreats > 0) {
    const slow = placeActions.filter(a =>
      TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'scanner' || TOWER_TYPES[a.tower].type === 'aura_slow')
    ).filter(a => {
      const lane = state.lanes.find(l => l.row === a.row);
      return lane && !laneHasSlow(lane);
    }).sort((a, b) => {
      const laneA = state.lanes.find(l => l.row === a.row);
      const laneB = state.lanes.find(l => l.row === b.row);
      return laneDanger(laneB || { threats: [] }) - laneDanger(laneA || { threats: [] });
    })[0];
    if (slow) { d.push(slow); return d; }
  }

  // 11. UPGRADE — only when all lanes have 2+ shooters
  if (totalShooters >= state.lanes.length * 2 && state.credits >= 80 && byType.upgrade_tower) {
    let best = null, bestScore = -1;
    for (const action of byType.upgrade_tower) {
      const lane = state.lanes.find(l => l.row === action.row);
      if (!lane) continue;
      const actualCell = grid[action.row] && grid[action.row][action.col];
      const actualTower = actualCell && (actualCell.tower || actualCell.baseTower);
      const key = actualTower ? actualTower.key : null;
      const cfg = key ? TOWER_TYPES[key] : null;
      const isShooter = cfg && (cfg.type === 'shooter' || cfg.type === 'multishooter' || cfg.type === 'pierce_shooter');
      const danger = laneDanger(lane);
      const score = danger * (isShooter ? 15 : 5) + (isShooter ? 20 : 0) + (lane.threats.length > 0 ? 30 : 0);
      if (score > bestScore) { bestScore = score; best = action; }
    }
    if (best && bestScore > 0) { d.push(best); return d; }
  }

  // 12. VPN
  if (state.credits >= 100) {
    const vpn = placeActions.filter(a => a.tower === 'VPN_SHIELD').filter(a => {
      const lane = state.lanes.find(l => l.row === a.row);
      return lane && lane.towers.length >= 3;
    })[0];
    if (vpn) { d.push(vpn); return d; }
  }

  d.push({ type: 'wait' });
  return d;
};
