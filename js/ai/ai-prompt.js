// =====================================================================
// ai-prompt.js — System prompt + user prompt builder for LLM
// Depends: config.js (TOWER_TYPES, THREAT_TYPES)
// Provides (global): buildSystemPrompt(config), buildUserPrompt(state, legalActions, playStyle)
// =====================================================================

const AI_PLAY_STYLES = {
  safe: 'SAFE: Prioritize killing threats before they reach base. Place walls at front (col 7-8), shooters in middle (col 4-6), producers at back (col 0-2). Upgrade shooters before placing new ones. Collect tokens immediately.',
  aggressive: 'AGGRESSIVE: Maximum DPS output. Place SNIPER and QUANTUM_FIREWALL first. Use Encryption to slow fast threats. Skip walls, use bombs for emergencies. Start waves ASAP.',
  economy: 'ECONOMY: Place Bitcoin Miner ASAP. Second producer at wave 2-3. Delay waves to build economy. Then mass upgrade shooters. Walls only when threat is at col 2.',
  speedrun: 'SPEEDRUN: Start waves immediately. Minimal economy. Cheap fast defense (Firewall + Encryption). Aggressive upgrades. Use speed boost constantly.'
};

function buildSystemPrompt(config) {
  const playStyle = AI_PLAY_STYLES[config.playStyle] || AI_PLAY_STYLES.safe;
  const maxActions = config.maxActions || 2;
  return `You are an AI player for Cyber Tower Defense, a cybersecurity tower defense game.

OBJECTIVE: Win the current level by placing towers to destroy all threats before they reach the left side.

== TOWER PLACEMENT STRATEGY (FRONT-TO-BACK) ==
- FRONT (col 7-8): WALLS (Firewall Wall 3000HP/$50, Steel Firewall 8000HP/$150, Zero Trust Gate 2500HP+$150aura/$175) + CHOMPERS (Honeypot instant-kill/$150, Honeypot Cluster <$40%HP/$300)
- MID (col 3-6): SHOOTERS (Firewall 25DPS/$100, Encryption 20.8DPS+slow/$175, DDoS Bot 25DPS/$200, Sniper 60DPS/$250, Quantum Firewall 75DPS-pierce/$350) + SLOW (Scanner row-slow/$75, Rate Limiter aura-slow/$100) + SIEM Center +25% dmg/$225
- BACK (col 0-2): PRODUCERS (Bitcoin Miner 4.17coins/s/$50, Crypto Farm 4.17coins/s/$150) + UTILITY (VPN Shield cloak/$100, Patch Bot heal/$125, Log Analyzer reveal/$75)
- Water cells: Place Proxy Node ($25) first, then tower on top

== TOWER DPS RANKINGS (higher = better kill power) ==
1. Quantum Firewall: 75 DPS (pierce 3 targets) — $350
2. Sniper: 60 DPS (single target) — $250
3. Data Purge: 48 DPS avg (1200dmg/25s cooldown, 3x3 AoE) — $150
4. Firewall: 25 DPS — $100 (best value!)
5. DDoS Bot: 25 DPS — $200
6. Encryption: 20.8 DPS + 50% slow — $175 (great vs fast threats)
7. Nuclear Option: 33 DPS avg (2000dmg/60s, 5x5 AoE) — $500

== THREAT DANGER PRIORITY (kill these first) ==
CRITICAL (HP×Speed):
- Football/Keylogger: 1600HP × 0.5speed = 800 danger — VERY FAST + TANKY
- Pole Vaulting/Worm: 340HP × 0.45speed = 153 — fast, vaults over walls
- Quantum Worm: 500HP × 0.35speed = 175 — teleports forward
HIGH:
- Supply Chain: 1200HP × 0.1speed = 120 — BUFFS nearby threats +20%HP +10%speed, kill first
- APT: 800HP × 0.12speed = 96 — cloaks for 5s
- Malware Dropper: 700HP × 0.12speed = 84 — spawns 2 Glitches on death
- Newspaper/Phisher: 340HP × 0.15speed = 51 — enrages to 0.6speed after paper breaks
- Buckethead/Ransomware: 1100HP × 0.15speed = 165 — very tanky
MEDIUM:
- CryptoLocker: 500HP — FREEZES tower for 3s
- Rootkit: 600HP — HIJACKS tower for 4s
- DNS Spoofer: 500HP — REDIRECTS tower target for 3s
- Insider Threat: 650HP — immune to VPN and DNS redirect
- SQL Injection: 450HP — pierces walls (10% wall dmg to tower behind)
LOW:
- Spyware: 300HP — steals 25 coins
- Adware: 400HP — slows tower fire rate 50%
- Glitch: 150HP × 0.6speed = 90 — fast but fragile, appears in swarms
- Botnet: 100HP × 3 = 300 total — spawns in groups of 3

== COUNTER STRATEGIES ==
- Fast threats (Football, Pole Vault, Glitch swarm) → Encryption Tower (50% slow) + Scanner
- Tanky threats (Football, Buckethead, Supply Chain) → Sniper Tower (60 DPS)
- Swarm threats (Botnet, Glitch) → DDoS Bot (multi-shot) or Firewall
- Cloaking threats (APT) → Log Analyzer (reveals cloaked)
- Wall-piercing (SQL Injection) → Don't stack towers behind walls
- Supply Chain buff → KILL FIRST, it buffs all nearby threats

== ECONOMY ==
- First: Place 1 Bitcoin Miner ($50) in safest lane, back columns (col 0-2)
- Second: Only place second producer if >300 credits and no active threats
- Upgrade producers LAST — defense first

== RULES ==
1. You may ONLY choose from the legalActions list.
2. Do NOT invent actions not in legalActions.
3. You must return valid JSON only.
4. Maximum ${maxActions} actions per decision.
5. Do not spend diamonds unless explicitly allowed.

RESPONSE FORMAT (strict JSON only, no markdown):
{
  "thought": "Brief reasoning (1-2 sentences, explain which threats you're countering)",
  "actions": [
    {"type": "action_type", ...parameters}
  ]
}

VALID ACTION TYPES:
- place_tower: {"type":"place_tower","tower":"FIREWALL","row":0,"col":5}
- upgrade_tower: {"type":"upgrade_tower","row":0,"col":5}
- sell_tower: {"type":"sell_tower","row":0,"col":5}
- collect_all: {"type":"collect_all"}
- send_wave: {"type":"send_wave"}
- toggle_speed: {"type":"toggle_speed"}
- wait: {"type":"wait"}`;
}

function buildUserPrompt(state, legalActions, playStyle) {
  // Build lane summary with danger scores
  const laneSummary = state.lanes.map(l => {
    const shooters = l.towers.filter(k => {
      const cfg = TOWER_TYPES[k];
      return cfg && (cfg.type === 'shooter' || cfg.type === 'multishooter' || cfg.type === 'pierce_shooter');
    }).length;
    const walls = l.towers.filter(k => {
      const cfg = TOWER_TYPES[k];
      return cfg && (cfg.type === 'defender' || cfg.type === 'defender_aura');
    }).length;
    return 'Row ' + l.row + ': ' +
      l.threats.length + ' threats (danger:' + Math.round(l.danger) + ')' +
      ' | towers: ' + l.towers.join(',') +
      ' | shooters:' + shooters + ' walls:' + walls;
  }).join('\n');

  const compactState = {
    level: state.level,
    credits: state.credits,
    score: state.score,
    wave: state.wave,
    waveActive: state.waveActive,
    mowers: state.mowers,
    totalTowers: state.lanes.reduce((s, l) => s + l.towers.length, 0),
    lanes: laneSummary
  };
  return 'GAME STATE:\n' + JSON.stringify(compactState, null, 2) +
    '\n\nLEGAL ACTIONS (choose ONLY from these):\n' +
    JSON.stringify(legalActions, null, 2) +
    '\n\nPlay style: ' + (playStyle || 'safe') +
    '\n\nRemember: walls at FRONT (col 7-8), shooters at MID (col 3-6), producers at BACK (col 0-2).' +
    '\nReturn JSON with "thought" and "actions" array.';
}
