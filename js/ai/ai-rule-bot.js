// =====================================================================
// ai-rule-bot.js — Rule-based decision engine (v2: DPS-aware, strategic)
// Depends: ai-state.js, ai-actions.js, config.js
// Provides (global): AI.ruleBotDecide(state, legalActions)
//
// STRATEGY OVERVIEW:
// - Towers: walls/front, shooters/mid, producers/back
// - DPS优先: SNIPER(60) > FIREWALL(25) ≈ DDoS(25) > ENCRYPTION(20.8+slow)
// - Threat scoring: HP × speed × ability_multiplier
// - Economy: 1 miner early, then defense, second miner only if safe
// - Upgrade: shooters in busiest lanes first, then walls
// =====================================================================

// Tower DPS rankings (damage per second, higher = better for killing)
const TOWER_DPS = {
  SNIPER:           60,    // 120 dmg / 2s
  QUANTUM_FIREWALL:  75,   // 45 * 3 pierce / 1.8s (theoretical max)
  FIREWALL:         25,    // 30 / 1.2s
  DDoS_BOT:         25,    // 10 / 0.4s (5*2 multi)
  ENCRYPTION:       20.8,  // 25 / 1.2s + 50% slow (value boost)
  HONEYPOT:         999,   // instant kill (but 30s chew)
  HONEYPOT_CLUSTER: 999,   // instant kill (but 15s chew, <40% threshold)
  DATA_PURGE:       48,    // 1200 / 25s cooldown
  NUCLEAR_OPTION:   33.3,  // 2000 / 60s cooldown
};

// Threat danger score (higher = more dangerous, must kill first)
function threatDanger(t) {
  const cfg = THREAT_TYPES[t.type];
  if (!cfg) return 0;
  let danger = cfg.hp * cfg.speed;
  // ability multipliers
  if (t.type === 'FOOTBALL') danger *= 2.0;        // fast + tanky = highest priority
  if (t.type === 'POLE_VAULTING') danger *= 1.8;   // very fast
  if (t.type === 'QUANTUM_WORM') danger *= 1.6;    // teleports past defenses
  if (t.type === 'NEWSPAPER') danger *= 1.4;       // enrages to 0.6 speed
  if (t.type === 'CRYPTOLOCKER') danger *= 1.3;    // freezes towers
  if (t.type === 'ROOTKIT') danger *= 1.3;         // hijacks towers
  if (t.type === 'APT') danger *= 1.2;             // cloaks
  if (t.type === 'SUPPLY_CHAIN') danger *= 1.5;    // buffs all nearby threats
  if (t.type === 'MALWARE_DROPPER') danger *= 1.4; // spawns 2 Glitches
  if (t.type === 'DNS_SPOOFER') danger *= 1.2;     // redirects towers
  if (t.type === 'SPYWARE') danger *= 1.1;         // steals coins
  if (t.type === 'INSIDER_THREAT') danger *= 1.2;  // immune to VPN/DNS
  if (t.type === 'SQL_INJECTION') danger *= 1.1;   // pierces walls
  return danger;
}

// Lane danger = sum of threat dangers
function laneDanger(lane) {
  return lane.threats.reduce((sum, t) => sum + threatDanger(t), 0);
}

// Count shooters in a lane
function laneShooterCount(lane) {
  return lane.towers.filter(k => {
    const cfg = TOWER_TYPES[k];
    return cfg && (cfg.type === 'shooter' || cfg.type === 'multishooter' || cfg.type === 'pierce_shooter');
  }).length;
}

// Has wall in lane?
function laneHasWall(lane) {
  return lane.towers.some(k => {
    const cfg = TOWER_TYPES[k];
    return cfg && (cfg.type === 'defender' || cfg.type === 'defender_aura');
  });
}

// Has chomper in lane?
function laneHasChomper(lane) {
  return lane.towers.some(k => {
    const cfg = TOWER_TYPES[k];
    return cfg && (cfg.type === 'chomper' || cfg.type === 'chomper_aoe');
  });
}

// Has slow utility in lane?
function laneHasSlow(lane) {
  return lane.towers.some(k => {
    const cfg = TOWER_TYPES[k];
    return cfg && (cfg.type === 'scanner' || cfg.type === 'aura_slow');
  });
}

// Has producer in lane?
function laneHasProducer(lane) {
  return lane.towers.some(k => {
    const cfg = TOWER_TYPES[k];
    return cfg && cfg.type === 'producer';
  });
}

// Has SIEM damage buff in lane?
function laneHasSiem(lane) {
  return lane.towers.includes('SIEM_CENTER');
}

// Best DPS tower we can afford (from available towers)
function bestDpsTower(available, credits) {
  let best = null;
  let bestDps = 0;
  for (const t of available) {
    if (!t.cooldownReady) continue;
    if (t.cost > credits) continue;
    if (t.type === 'producer' || t.type === 'defender' || t.type === 'defender_aura' ||
        t.type === 'lily_pad' || t.type === 'healer' || t.type === 'vpn' ||
        t.type === 'scanner' || t.type === 'aura_slow' || t.type === 'aura_damage' ||
        t.type === 'support_reveal' || t.type === 'reviver' || t.type === 'mine') continue;
    const dps = TOWER_DPS[t.key] || 0;
    if (dps > bestDps) {
      bestDps = dps;
      best = t;
    }
  }
  return best;
}

// Cheapest available shooter
function cheapestShooter(available, credits) {
  let best = null;
  let bestCost = Infinity;
  for (const t of available) {
    if (!t.cooldownReady) continue;
    if (t.cost > credits) continue;
    if (t.type !== 'shooter' && t.type !== 'multishooter' && t.type !== 'pierce_shooter') continue;
    if (t.cost < bestCost) {
      bestCost = t.cost;
      best = t;
    }
  }
  return best;
}

AI.ruleBotDecide = function(state, legalActions) {
  const decisions = [];
  const actionsByType = {};
  legalActions.forEach(a => {
    if (!actionsByType[a.type]) actionsByType[a.type] = [];
    actionsByType[a.type].push(a);
  });

  const allThreats = state.lanes.reduce((sum, l) => sum + l.threats.length, 0);
  const totalTowers = state.lanes.reduce((sum, l) => sum + l.towers.length, 0);

  // === PHASE 0: ALWAYS collect tokens/coins first ===
  if (actionsByType.collect_all && actionsByType.collect_all.length > 0) {
    decisions.push(actionsByType.collect_all[0]);
    return decisions;
  }

  // === PHASE 1: CRITICAL — threat in final 2 columns, no wall → emergency wall ===
  for (const lane of state.lanes) {
    for (const threat of lane.threats) {
      if (threat.x < 2 * CELL_W) {
        if (!laneHasWall(lane)) {
          const wallActions = (actionsByType.place_tower || []).filter(a =>
            a.row === lane.row && TOWER_TYPES[a.tower] &&
            (TOWER_TYPES[a.tower].type === 'defender' || TOWER_TYPES[a.tower].type === 'defender_aura')
          );
          if (wallActions.length > 0) {
            // prefer steel wall (more HP) if we can afford it
            wallActions.sort((a, b) => (TOWER_TYPES[b.tower].hp || 0) - (TOWER_TYPES[a.tower].hp || 0));
            decisions.push(wallActions[0]);
            return decisions;
          }
        }
      }
    }
  }

  // === PHASE 2: CRITICAL — no mower + threat in final 3 cells → emergency bomb/chomper ===
  for (let i = 0; i < state.lanes.length; i++) {
    const lane = state.lanes[i];
    const hasMower = state.mowers[i];
    if (hasMower) continue;
    for (const threat of lane.threats) {
      if (threat.x < 3 * CELL_W) {
        // try chomper first (instant kill, reusable after chew)
        const chompActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] &&
          (TOWER_TYPES[a.tower].type === 'chomper' || TOWER_TYPES[a.tower].type === 'chomper_aoe')
        );
        if (chompActions.length > 0) {
          decisions.push(chompActions[0]);
          return decisions;
        }
        // try bomb
        const bombActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'bomb'
        );
        if (bombActions.length > 0) {
          decisions.push(bombActions[0]);
          return decisions;
        }
        // try system wipe (row clear)
        const wipeActions = (actionsByType.place_tower || []).filter(a =>
          a.row === lane.row && TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'jalapeno'
        );
        if (wipeActions.length > 0) {
          decisions.push(wipeActions[0]);
          return decisions;
        }
      }
    }
  }

  // === PHASE 3: HIGH — lane with threats + no shooter → place best DPS shooter ===
  // Sort lanes by danger (most dangerous first)
  const lanesByDanger = [...state.lanes].filter(l => l.threats.length > 0).sort((a, b) => laneDanger(b) - laneDanger(a));
  for (const lane of lanesByDanger) {
    const shooterCount = laneShooterCount(lane);
    if (shooterCount >= 2) continue; // already well-defended

    // Pick tower based on threat composition
    const hasFastThreats = lane.threats.some(t => {
      const cfg = THREAT_TYPES[t.type];
      return cfg && cfg.speed >= 0.4;
    });
    const hasTankThreats = lane.threats.some(t => {
      const cfg = THREAT_TYPES[t.type];
      return cfg && cfg.hp >= 800;
    });

    let preferredTower = null;
    if (hasFastThreats) {
      // Fast threats → Encryption (slows them) or Scanner
      preferredTower = 'ENCRYPTION';
    } else if (hasTankThreats && state.credits >= 250) {
      // Tank threats → Sniper (high single-target DPS)
      preferredTower = 'SNIPER';
    } else if (state.credits >= 350 && shooterCount === 0) {
      // First shooter in lane, can afford quantum → Quantum Firewall (pierce)
      preferredTower = 'QUANTUM_FIREWALL';
    }

    if (preferredTower) {
      const prefActions = (actionsByType.place_tower || []).filter(a =>
        a.row === lane.row && a.tower === preferredTower
      );
      if (prefActions.length > 0) {
        // place in middle columns (col 4-6) — behind potential wall, in front of producers
        prefActions.sort((a, b) => Math.abs(a.col - 5) - Math.abs(b.col - 5));
        decisions.push(prefActions[0]);
        return decisions;
      }
    }

    // Fallback: place best available DPS shooter
    const shootActions = (actionsByType.place_tower || []).filter(a =>
      a.row === lane.row && TOWER_TYPES[a.tower] &&
      (TOWER_TYPES[a.tower].type === 'shooter' || TOWER_TYPES[a.tower].type === 'multishooter' || TOWER_TYPES[a.tower].type === 'pierce_shooter')
    );
    if (shootActions.length > 0) {
      // sort by DPS descending
      shootActions.sort((a, b) => (TOWER_DPS[b.tower] || 0) - (TOWER_DPS[a.tower] || 0));
      // place in mid columns
      const midActions = shootActions.filter(a => a.col >= 3 && a.col <= 6);
      decisions.push(midActions.length > 0 ? midActions[0] : shootActions[0]);
      return decisions;
    }
  }

  // === PHASE 4: MEDIUM — wave idle + no threats → send next wave ===
  if (!state.waveActive && allThreats === 0) {
    const waveNum = parseInt(state.wave) || 0;
    if (waveNum < WAVES.length) {
      const sendActions = actionsByType.send_wave || [];
      if (sendActions.length > 0) {
        decisions.push(sendActions[0]);
        return decisions;
      }
    }
  }

  // === PHASE 5: MEDIUM — economy: place first producer if we have none ===
  const totalProducers = state.lanes.reduce((sum, l) => sum + (laneHasProducer(l) ? 1 : 0), 0);
  if (totalProducers === 0 && state.credits >= 50) {
    const producerActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer'
    );
    if (producerActions.length > 0) {
      // place in lane with fewest threats, leftmost column (safest)
      let bestProd = null;
      let bestScore = -Infinity;
      for (const action of producerActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        const danger = lane ? laneDanger(lane) : 0;
        const score = -danger * 10 - action.col * 5; // prefer safe lane, LOW col (back)
        if (score > bestScore) {
          bestScore = score;
          bestProd = action;
        }
      }
      if (bestProd) {
        decisions.push(bestProd);
        return decisions;
      }
    }
  }

  // === PHASE 6: MEDIUM — place wall in lane with threats but no wall ===
  for (const lane of lanesByDanger) {
    if (laneHasWall(lane)) continue;
    // only place wall if lane has 2+ threats or a dangerous threat
    if (lane.threats.length < 2 && laneDanger(lane) < 500) continue;
    const wallActions = (actionsByType.place_tower || []).filter(a =>
      a.row === lane.row && TOWER_TYPES[a.tower] &&
      (TOWER_TYPES[a.tower].type === 'defender' || TOWER_TYPES[a.tower].type === 'defender_aura')
    );
    if (wallActions.length > 0) {
      // place at col 7 or 8 (front line)
      wallActions.sort((a, b) => b.col - a.col);
      decisions.push(wallActions[0]);
      return decisions;
    }
  }

  // === PHASE 7: MEDIUM — place second producer if safe ===
  if (totalProducers === 1 && state.credits >= 150 && allThreats === 0) {
    const producerActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer'
    );
    if (producerActions.length > 0) {
      let bestProd = null;
      let bestScore = -Infinity;
      for (const action of producerActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        const danger = lane ? laneDanger(lane) : 0;
        const score = -danger * 10 - action.col * 5;
        if (score > bestScore) {
          bestScore = score;
          bestProd = action;
        }
      }
      if (bestProd) {
        decisions.push(bestProd);
        return decisions;
      }
    }
  }

  // === PHASE 8: MEDIUM — upgrade shooters in busiest lanes ===
  if (state.credits >= 80) {
    const upgradeActions = actionsByType.upgrade_tower || [];
    if (upgradeActions.length > 0) {
      let bestUpgrade = null;
      let bestScore = -1;
      for (const action of upgradeActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        if (!lane) continue;
        const towerKey = lane.towers.find(k => {
          const cell = grid[action.row] && grid[action.row][action.col];
          return cell && (cell.tower || cell.baseTower);
        });
        const cfg = towerKey ? TOWER_TYPES[towerKey] : null;
        const isShooter = cfg && (cfg.type === 'shooter' || cfg.type === 'multishooter' || cfg.type === 'pierce_shooter');
        const danger = laneDanger(lane);
        const score = danger * (isShooter ? 15 : 5) + (isShooter ? 20 : 0);
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

  // === PHASE 9: MEDIUM — place SIEM Center in lane with most shooters ===
  if (state.credits >= 225) {
    const siemActions = (actionsByType.place_tower || []).filter(a =>
      a.tower === 'SIEM_CENTER'
    );
    if (siemActions.length > 0) {
      let bestSiem = null;
      let bestScore = -1;
      for (const action of siemActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        if (!lane) continue;
        const shooters = laneShooterCount(lane);
        const score = shooters * 20;
        if (score > bestScore) {
          bestScore = score;
          bestSiem = action;
        }
      }
      if (bestSiem && bestScore > 0) {
        decisions.push(bestSiem);
        return decisions;
      }
    }
  }

  // === PHASE 10: LOW — place slow utility (Scanner/Rate Limiter) in busy lane ===
  if (state.credits >= 100 && allThreats > 0) {
    const slowActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && (TOWER_TYPES[a.tower].type === 'scanner' || TOWER_TYPES[a.tower].type === 'aura_slow')
    );
    if (slowActions.length > 0) {
      let bestSlow = null;
      let bestScore = -1;
      for (const action of slowActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        if (!lane || laneHasSlow(lane)) continue;
        const danger = laneDanger(lane);
        const score = danger;
        if (score > bestScore) {
          bestScore = score;
          bestSlow = action;
        }
      }
      if (bestSlow) {
        decisions.push(bestSlow);
        return decisions;
      }
    }
  }

  // === PHASE 11: LOW — place second shooter in lane with most threats ===
  if (state.credits >= 100 && allThreats > 0) {
    for (const lane of lanesByDanger) {
      const shooterCount = laneShooterCount(lane);
      if (shooterCount >= 2) continue;
      const tower = cheapestShooter(state.availableTowers, state.credits);
      if (!tower) continue;
      const shootActions = (actionsByType.place_tower || []).filter(a =>
        a.row === lane.row && a.tower === tower.key
      );
      if (shootActions.length > 0) {
        shootActions.sort((a, b) => Math.abs(a.col - 5) - Math.abs(b.col - 5));
        decisions.push(shootActions[0]);
        return decisions;
      }
    }
  }

  // === PHASE 12: LOW — place VPN in lane with valuable towers ===
  if (state.credits >= 100) {
    const vpnActions = (actionsByType.place_tower || []).filter(a =>
      a.tower === 'VPN_SHIELD'
    );
    if (vpnActions.length > 0) {
      let bestVpn = null;
      let bestScore = -1;
      for (const action of vpnActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        if (!lane) continue;
        // VPN is valuable when lane has multiple towers (protects investment)
        const score = lane.towers.length * 10;
        if (score > bestScore) {
          bestScore = score;
          bestVpn = action;
        }
      }
      if (bestVpn && bestScore >= 20) {
        decisions.push(bestVpn);
        return decisions;
      }
    }
  }

  // === PHASE 13: LOW — place Patch Bot near walls ===
  if (state.credits >= 125) {
    const patchActions = (actionsByType.place_tower || []).filter(a =>
      a.tower === 'PATCH_BOT'
    );
    if (patchActions.length > 0) {
      let bestPatch = null;
      let bestScore = -1;
      for (const action of patchActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        if (!lane) continue;
        const hasWall = laneHasWall(lane);
        const score = hasWall ? 30 : 0;
        if (score > bestScore) {
          bestScore = score;
          bestPatch = action;
        }
      }
      if (bestPatch && bestScore > 0) {
        decisions.push(bestPatch);
        return decisions;
      }
    }
  }

  // === PHASE 14: LOW — place Proxy Node on water ===
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

  // === PHASE 15: LOW — place third producer if very safe ===
  if (totalProducers < 2 && state.credits >= 150 && allThreats === 0 && state.credits > 300) {
    const producerActions = (actionsByType.place_tower || []).filter(a =>
      TOWER_TYPES[a.tower] && TOWER_TYPES[a.tower].type === 'producer'
    );
    if (producerActions.length > 0) {
      let bestProd = null;
      let bestScore = -Infinity;
      for (const action of producerActions) {
        const lane = state.lanes.find(l => l.row === action.row);
        const danger = lane ? laneDanger(lane) : 0;
        const score = -danger * 10 - action.col * 5;
        if (score > bestScore) {
          bestScore = score;
          bestProd = action;
        }
      }
      if (bestProd) {
        decisions.push(bestProd);
        return decisions;
      }
    }
  }

  // === DEFAULT: wait ===
  decisions.push({ type: 'wait' });
  return decisions;
};
