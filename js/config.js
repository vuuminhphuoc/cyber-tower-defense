// =====================================================================
// config.js — Constants, cybersecurity tower/threat blueprints, level database
// Depends: NONE (loaded first)
// Provides (global): canvas, ctx, ROWS, COLS, TOP_OFFSET, CELL_W, CELL_H,
//   TOWER_TYPES, ALL_TOWER_KEYS, TOWER_KEYS, THREAT_TYPES, THREAT_KEYS,
//   LEVEL_DATABASE, LEVEL_ORDER, STAGE_EMOJI
// =====================================================================

// ===== Canvas =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ===== Grid size =====
const ROWS = 5;
const COLS = 9;
const TOP_OFFSET = 0;
const CELL_W = canvas.width / COLS;   // 100
let CELL_H = canvas.height / ROWS;    // 100, updated per-level for pool mode

// ===== Tower (defense) blueprints =====
const TOWER_TYPES = {
  // --- Economy ---
  BITCOIN_MINER:  { cost: 50,  hp: 300,  cooldown: 2000,  type: 'producer', emoji: '⛏️', name: 'Bitcoin Miner', tokenRate: 8000, desc: 'Generates 25 coins every 8s', upgradeCost: 30 },
  CRYPTO_FARM:    { cost: 150, hp: 300,  cooldown: 2000,  type: 'producer', emoji: '🏦', name: 'Crypto Farm', tokenRate: 8000, desc: 'Generates 25 coins every 8s (faster)', upgradeCost: 75 },

  // --- Shooters ---
  FIREWALL:       { cost: 100, hp: 300,  cooldown: 2000,  type: 'shooter',  emoji: '🧱', name: 'Firewall', damage: 25, fireRate: 1500, desc: 'Fires data packets, 25 dmg every 1.5s', upgradeCost: 50 },
  ENCRYPTION:     { cost: 175, hp: 300,  cooldown: 2000,  type: 'shooter',  emoji: '🔐', name: 'Encryption Tower', damage: 20, fireRate: 1500, slow: 0.5, slowDuration: 2000, desc: 'Fires encrypted data, slows threats 50%', upgradeCost: 90 },
  DDoS_BOT:       { cost: 200, hp: 250,  cooldown: 2000,  type: 'multishooter', emoji: '🤖', name: 'DDoS Bot', damage: 5, fireRate: 400, multiShot: 2, desc: 'Fires 2 packets in rapid succession, 5 dmg each', upgradeCost: 100 },
  SNIPER:         { cost: 250, hp: 300,  cooldown: 2000,  type: 'shooter',  emoji: '🎯', name: 'Sniper Tower', damage: 120, fireRate: 2000, desc: 'High damage 120 dmg, fires every 2s', upgradeCost: 125 },

  // --- Chomper ---
  HONEYPOT:       { cost: 150, hp: 300,  cooldown: 5000,  type: 'chomper',  emoji: '🍯', name: 'Honeypot', chewTime: 30000, desc: 'Eats a threat instantly, chews for 30s', upgradeCost: 75 },

  // --- Bomb (explodes and dies) ---
  DATA_PURGE:     { cost: 150, hp: 300,  cooldown: 25000, type: 'bomb',     emoji: '💥', name: 'Data Purge', damage: 1200, radius: 1.5, desc: '3x3 explosion, purges all threats in range', upgradeCost: 75 },
  SYSTEM_WIPE:    { cost: 125, hp: 300,  cooldown: 25000, type: 'jalapeno', emoji: '⚡', name: 'System Wipe', desc: 'Wipes all threats in the row', upgradeCost: 60 },
  NUCLEAR_OPTION: { cost: 500, hp: 300,  cooldown: 60000, type: 'bomb',     emoji: '☢️', name: 'Nuclear Option', damage: 2000, radius: 2.5, desc: '5x5 explosion, massive 2000 dmg', upgradeCost: 250 },

  // --- Mine (hidden, explodes on contact) ---
  TRIPWIRE:       { cost: 50,  hp: 300,  cooldown: 15000, type: 'mine',     emoji: '🪤', name: 'Tripwire', damage: 300, armTime: 15000, desc: 'Hidden, deals 300 dmg on contact (15s arm time)', upgradeCost: 25 },
  EMP_MINE:       { cost: 75,  hp: 300,  cooldown: 20000, type: 'mine',     emoji: '🔮', name: 'EMP Mine', armTime: 15000, damage: 300, desc: 'Hidden, hits 3 rows, 300 dmg + 50% slow (15s arm time)', upgradeCost: 40 },

  // --- Wall ---
  FIREWALL_WALL:  { cost: 50,  hp: 3000, cooldown: 5000,  type: 'defender', emoji: '🛡️', name: 'Firewall Wall', desc: 'Blocks threats, 3000 HP', upgradeCost: 25 },
  STEEL_FIREWALL:  { cost: 150, hp: 8000, cooldown: 8000,  type: 'defender', emoji: '🔒', name: 'Steel Firewall', desc: 'Blocks threats, 8000 HP (ultra-durable)', upgradeCost: 75 },

  // --- Support ---
  VPN_SHIELD:     { cost: 100, hp: 300,  cooldown: 3000,  type: 'vpn',     emoji: '🌐', name: 'VPN Shield', cloakRadius: 1.5, desc: 'Hides towers within 1.5 tiles, threats ignore them', upgradeCost: 50 },
  PATCH_BOT:      { cost: 125, hp: 300,  cooldown: 3000,  type: 'healer',  emoji: '🔧', name: 'Patch Bot', healRate: 500, healAmount: 10, desc: 'Heals 10 HP every 0.5s to nearest tower', upgradeCost: 60 },
  SCANNER:        { cost: 75,  hp: 300,  cooldown: 2000,  type: 'scanner', emoji: '📡', name: 'Scanner', slow: 0.7, slowDuration: 1000, desc: 'Slows all threats in row by 30%', upgradeCost: 40 },

  // --- Pool (data stream) ---
  PROXY_NODE:     { cost: 25,  hp: 300,  cooldown: 1000,  type: 'lily_pad', emoji: '🔗', name: 'Proxy Node', desc: 'Platform to place towers on data streams', upgradeCost: 15 }
};
const ALL_TOWER_KEYS = Object.keys(TOWER_TYPES);
let TOWER_KEYS = ['BITCOIN_MINER', 'FIREWALL', 'FIREWALL_WALL'];

// ===== Threat blueprints =====
const THREAT_TYPES = {
  BASIC:         { hp: 200,  speed: 0.15, damage: 100, emoji: '🦠', name: 'Virus' },
  CONEHEAD:      { hp: 560,  speed: 0.15, damage: 100, emoji: '🦠', name: 'Trojan', hat: '🐴' },
  POLE_VAULTING: { hp: 340,  speed: 0.45, damage: 100, emoji: '🦠', name: 'Worm', vaulted: false },
  BUCKETHEAD:    { hp: 1100, speed: 0.15, damage: 100, emoji: '🦠', name: 'Ransomware', hat: '🔒' },
  NEWSPAPER:     { hp: 340,  speed: 0.15, damage: 100, emoji: '🦠', name: 'Phisher', paperHp: 150, enragedSpeed: 0.6 },
  FOOTBALL:      { hp: 1600, speed: 0.5,  damage: 100, emoji: '🦠', name: 'Keylogger', hat: '⌨️' },
  SPYWARE:       { hp: 300,  speed: 0.2,  damage: 100, emoji: '🕵️', name: 'Spyware', stealAmount: 25, desc: 'Steals 25 coins when eating a tower' },
  ADWARE:        { hp: 400,  speed: 0.18, damage: 100, emoji: '📢', name: 'Adware', slowFireRate: 0.5, desc: 'Slows tower fire rate by 50% when near' },
  CRYPTOLOCKER:  { hp: 500,  speed: 0.15, damage: 100, emoji: '🧊', name: 'CryptoLocker', freezeTime: 3000, desc: 'Freezes tower for 3s on contact' },
  GLITCH:        { hp: 150,  speed: 0.6,  damage: 50,  emoji: '⚡', name: 'Glitch', desc: 'Very fast, low HP, appears in swarms' },
  BOTNET:        { hp: 100,  speed: 0.3,  damage: 50,  emoji: '🕸️', name: 'Botnet', swarmCount: 3, desc: 'Spawns in groups of 3, low HP each' },
  APT:           { hp: 800,  speed: 0.12, damage: 150, emoji: '🎭', name: 'APT', cloakTime: 5000, desc: 'Advanced Persistent Threat, cloaks for 5s' },
  ROOTKIT:       { hp: 600,  speed: 0.15, damage: 100, emoji: '🐛', name: 'Rootkit', hijackDuration: 4000, desc: 'Hijacks tower for 4s, turning it against you' },
  BOSS:          { hp: 30000, speed: 0, damage: 0, emoji: '👾', name: 'Zero-Day Exploit' }
};
const THREAT_KEYS = Object.keys(THREAT_TYPES);

// ===== Tech Shop =====
const SHOP_ITEMS = [
  { id: 'seed_slot_7', name: 'Extra Core', emoji: '💾', desc: '+1 core slot (total 7)', cost: 750, currency: 'coins', requires: { seedSlots: 6 }, effect: { seedSlots: 7 } },
  { id: 'seed_slot_8', name: 'Core Pack', emoji: '💾', desc: '+2 core slots (total 8)', cost: 5000, currency: 'coins', requires: { seedSlots: 7 }, effect: { seedSlots: 8 } },
  { id: 'instant_unlock', name: 'Emergency Decrypt', emoji: '🔓', desc: 'Unlock 1 random tower immediately', cost: 3, currency: 'diamonds', requires: {}, effect: { unlockRandom: true } },
  { id: 'extra_starting', name: 'Booster Pack', emoji: '📦', desc: '+200 coins at level start', cost: 2, currency: 'diamonds', requires: {}, effect: { bonusTokens: 200 } }
];

// ===== Level Database =====
const LEVEL_DATABASE = {
  // === Stage 1: Firewall (6 levels) ===
  "1-1": {
    name: "Firewall - Level 1", stage: 1, initialTokens: 150, tokenSpawnRate: 7000,
    reward: "ENCRYPTION", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL'],
    waves: [
      { count: 2, coneChance: 0.0 },
      { count: 4, coneChance: 0.0, huge: true }
    ]
  },
  "1-2": {
    name: "Firewall - Level 2", stage: 1, initialTokens: 150, tokenSpawnRate: 7000,
    reward: "FIREWALL_WALL", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION'],
    waves: [
      { count: 3, coneChance: 0.0, poleChance: 0.0 },
      { count: 5, coneChance: 0.2, poleChance: 0.1 },
      { count: 7, coneChance: 0.3, poleChance: 0.1, huge: true }
    ]
  },
  "1-3": {
    name: "Firewall - Level 3", stage: 1, initialTokens: 100, tokenSpawnRate: 7000,
    reward: "DATA_PURGE", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL'],
    waves: [
      { count: 4, coneChance: 0.2, poleChance: 0.1 },
      { count: 6, coneChance: 0.3, poleChance: 0.15 },
      { count: 10, coneChance: 0.4, poleChance: 0.2, huge: true }
    ]
  },
  "1-4": {
    name: "Firewall - Level 4", stage: 1, initialTokens: 100, tokenSpawnRate: 7000,
    reward: "TRIPWIRE", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE'],
    waves: [
      { count: 5, coneChance: 0.2, poleChance: 0.15 },
      { count: 8, coneChance: 0.3, poleChance: 0.2, bucketChance: 0.1 },
      { count: 12, coneChance: 0.4, poleChance: 0.2, bucketChance: 0.15, huge: true }
    ]
  },
  "1-5": {
    name: "Firewall - Level 5", stage: 1, initialTokens: 100, tokenSpawnRate: 7000,
    reward: "HONEYPOT", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE'],
    waves: [
      { count: 5, coneChance: 0.25, poleChance: 0.15, bucketChance: 0.1 },
      { count: 8, coneChance: 0.35, poleChance: 0.2, bucketChance: 0.15 },
      { count: 10, coneChance: 0.4, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.1 },
      { count: 15, coneChance: 0.5, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.15, huge: true }
    ]
  },
  "1-6": {
    name: "Firewall - Level 6", stage: 1, initialTokens: 50, tokenSpawnRate: 7000,
    reward: "SYSTEM_WIPE", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT'],
    waves: [
      { count: 6, coneChance: 0.3, poleChance: 0.2, bucketChance: 0.15 },
      { count: 10, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.2, newspaperChance: 0.15 },
      { count: 12, coneChance: 0.45, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.05 },
      { count: 18, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.2, footballChance: 0.1, huge: true }
    ]
  },

  // === Stage 2: Dark Web (3 levels — no sky data, corrupted blocks) ===
  "2-1": {
    name: "Dark Web - Level 1", stage: 2, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 12000,
    graves: [{ row: 1, col: 7 }, { row: 3, col: 8 }],
    reward: "VPN_SHIELD", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE'],
    waves: [
      { count: 4, coneChance: 0.2, poleChance: 0.1, bucketChance: 0.1 },
      { count: 7, coneChance: 0.3, poleChance: 0.15, bucketChance: 0.15, newspaperChance: 0.1 },
      { count: 10, coneChance: 0.4, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15, footballChance: 0.05, huge: true }
    ]
  },
  "2-2": {
    name: "Dark Web - Level 2", stage: 2, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 10000,
    graves: [{ row: 0, col: 6 }, { row: 2, col: 8 }, { row: 4, col: 7 }],
    reward: "SCANNER", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE', 'VPN_SHIELD'],
    waves: [
      { count: 5, coneChance: 0.25, poleChance: 0.15, bucketChance: 0.15 },
      { count: 8, coneChance: 0.35, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15 },
      { count: 12, coneChance: 0.45, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.1 },
      { count: 16, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.2, footballChance: 0.15, huge: true }
    ]
  },
  "2-3": {
    name: "Dark Web - Level 3", stage: 2, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 8000,
    graves: [{ row: 0, col: 5 }, { row: 1, col: 7 }, { row: 3, col: 6 }, { row: 4, col: 8 }],
    reward: "DDoS_BOT", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE', 'VPN_SHIELD', 'SCANNER'],
    waves: [
      { count: 6, coneChance: 0.3, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15 },
      { count: 10, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.1 },
      { count: 14, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.15 },
      { count: 20, coneChance: 0.55, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.2, spywareChance: 0.1, huge: true }
    ]
  },

  // === Stage 3: Data Stream (3 levels — 6 lanes, data rows 2-3) ===
  "3-1": {
    name: "Data Stream - Level 1", stage: 3, gridMode: '6_LANE_POOL', initialTokens: 100, tokenSpawnRate: 5000,
    reward: "PATCH_BOT", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE', 'VPN_SHIELD', 'SCANNER', 'DDoS_BOT', 'PROXY_NODE'],
    waves: [
      { count: 5, coneChance: 0.2, poleChance: 0.1, bucketChance: 0.1 },
      { count: 8, coneChance: 0.3, poleChance: 0.2, bucketChance: 0.15, newspaperChance: 0.1 },
      { count: 12, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.2, newspaperChance: 0.15, footballChance: 0.1, huge: true }
    ]
  },
  "3-2": {
    name: "Data Stream - Level 2", stage: 3, gridMode: '6_LANE_POOL', initialTokens: 50, tokenSpawnRate: 5000,
    reward: "SNIPER", unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE', 'VPN_SHIELD', 'SCANNER', 'DDoS_BOT', 'PROXY_NODE', 'PATCH_BOT'],
    waves: [
      { count: 6, coneChance: 0.25, poleChance: 0.15, bucketChance: 0.15 },
      { count: 10, coneChance: 0.35, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15, spywareChance: 0.05 },
      { count: 14, coneChance: 0.45, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.1 },
      { count: 18, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.2, footballChance: 0.15, spywareChance: 0.1, huge: true }
    ]
  },
  "3-3": {
    name: "Data Stream - Level 3", stage: 3, gridMode: '6_LANE_POOL', initialTokens: 50, tokenSpawnRate: 5000,
    reward: "CRYPTO_FARM", unlockedTowers: ALL_TOWER_KEYS.filter(k => k !== 'NUCLEAR_OPTION' && k !== 'EMP_MINE' && k !== 'STEEL_FIREWALL'),
    waves: [
      { count: 8, coneChance: 0.3, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15, spywareChance: 0.1 },
      { count: 12, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.1, adwareChance: 0.1 },
      { count: 16, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.15, spywareChance: 0.15 },
      { count: 22, coneChance: 0.55, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.2, spywareChance: 0.15, adwareChance: 0.1, huge: true }
    ]
  },

  // === Stage 4: Encrypted Network (3 levels — fog) ===
  "4-1": {
    name: "Encrypted Net - Level 1", stage: 4, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 5000,
    fogColumns: [5, 6, 7, 8],
    reward: "EMP_MINE", unlockedTowers: ALL_TOWER_KEYS.filter(k => k !== 'NUCLEAR_OPTION' && k !== 'STEEL_FIREWALL'),
    waves: [
      { count: 6, coneChance: 0.3, poleChance: 0.15, bucketChance: 0.15, newspaperChance: 0.1, spywareChance: 0.05 },
      { count: 10, coneChance: 0.4, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15, footballChance: 0.1, adwareChance: 0.05 },
      { count: 14, coneChance: 0.5, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.15, spywareChance: 0.1, botnetChance: 0.05, huge: true }
    ]
  },
  "4-2": {
    name: "Encrypted Net - Level 2", stage: 4, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 5000,
    fogColumns: [4, 5, 6, 7, 8],
    reward: "STEEL_FIREWALL", unlockedTowers: ALL_TOWER_KEYS.filter(k => k !== 'NUCLEAR_OPTION'),
    waves: [
      { count: 8, coneChance: 0.35, poleChance: 0.2, bucketChance: 0.2, newspaperChance: 0.15, spywareChance: 0.1, adwareChance: 0.05 },
      { count: 12, coneChance: 0.45, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, footballChance: 0.1, cryptolockerChance: 0.05, botnetChance: 0.05 },
      { count: 16, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.2, footballChance: 0.15, spywareChance: 0.15, adwareChance: 0.1 },
      { count: 22, coneChance: 0.55, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.2, spywareChance: 0.15, adwareChance: 0.1, cryptolockerChance: 0.1, botnetChance: 0.1, huge: true }
    ]
  },
  "4-3": {
    name: "Encrypted Net - Level 3", stage: 4, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 5000,
    fogColumns: [3, 4, 5, 6, 7, 8],
    reward: "NUCLEAR_OPTION", unlockedTowers: ALL_TOWER_KEYS,
    waves: [
      { count: 10, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, spywareChance: 0.15, adwareChance: 0.1, cryptolockerChance: 0.05, botnetChance: 0.1 },
      { count: 14, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.15, spywareChance: 0.15, adwareChance: 0.1 },
      { count: 18, coneChance: 0.55, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.2, spywareChance: 0.2, adwareChance: 0.15, cryptolockerChance: 0.1, glitchChance: 0.1, botnetChance: 0.15 },
      { count: 25, coneChance: 0.6, poleChance: 0.35, bucketChance: 0.35, newspaperChance: 0.3, footballChance: 0.25, spywareChance: 0.2, adwareChance: 0.15, cryptolockerChance: 0.15, glitchChance: 0.15, botnetChance: 0.2, huge: true }
    ]
  },

  // === Stage 5: Root Access (Boss) ===
  "5-10": {
    name: "Root Access - Final Boss", stage: 5, gridMode: '5_LANE', initialTokens: 200, tokenSpawnRate: 5000,
    bossLevel: true,
    reward: null,
    unlockedTowers: ALL_TOWER_KEYS,
    waves: [
      { count: 0, boss: true }
    ]
  },

  // === Stage 6: Cloud Network (post-boss, harder variants) ===
  "6-1": {
    name: "Cloud Net - Level 1", stage: 6, gridMode: '5_LANE', initialTokens: 100, tokenSpawnRate: 6000,
    reward: null, unlockedTowers: ALL_TOWER_KEYS,
    waves: [
      { count: 8, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.25, newspaperChance: 0.2, spywareChance: 0.15, adwareChance: 0.1, botnetChance: 0.1 },
      { count: 14, coneChance: 0.55, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, footballChance: 0.2, spywareChance: 0.2, adwareChance: 0.15, cryptolockerChance: 0.1, aptChance: 0.05 },
      { count: 20, coneChance: 0.6, poleChance: 0.35, bucketChance: 0.35, newspaperChance: 0.3, footballChance: 0.25, spywareChance: 0.2, adwareChance: 0.2, cryptolockerChance: 0.15, glitchChance: 0.15, botnetChance: 0.15, huge: true }
    ]
  },
  "6-2": {
    name: "Cloud Net - Level 2", stage: 6, gridMode: '6_LANE_POOL', initialTokens: 100, tokenSpawnRate: 5000,
    reward: null, unlockedTowers: ALL_TOWER_KEYS,
    waves: [
      { count: 10, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, spywareChance: 0.2, adwareChance: 0.15, cryptolockerChance: 0.1, aptChance: 0.05 },
      { count: 16, coneChance: 0.6, poleChance: 0.35, bucketChance: 0.35, newspaperChance: 0.3, footballChance: 0.2, spywareChance: 0.2, adwareChance: 0.2, cryptolockerChance: 0.15, aptChance: 0.1, rootkitChance: 0.05 },
      { count: 22, coneChance: 0.65, poleChance: 0.4, bucketChance: 0.35, newspaperChance: 0.3, footballChance: 0.25, spywareChance: 0.25, adwareChance: 0.2, cryptolockerChance: 0.2, glitchChance: 0.2, botnetChance: 0.2 },
      { count: 30, coneChance: 0.7, poleChance: 0.4, bucketChance: 0.4, newspaperChance: 0.35, footballChance: 0.3, spywareChance: 0.25, adwareChance: 0.2, cryptolockerChance: 0.2, glitchChance: 0.2, aptChance: 0.15, rootkitChance: 0.1, huge: true }
    ]
  },

  // === Stage 7: Air Gap (ultimate challenge) ===
  "7-1": {
    name: "Air Gap - Level 1", stage: 7, gridMode: '5_LANE', initialTokens: 50, tokenSpawnRate: 6000,
    fogColumns: [4, 5, 6, 7, 8],
    reward: null, unlockedTowers: ALL_TOWER_KEYS,
    waves: [
      { count: 10, coneChance: 0.5, poleChance: 0.3, bucketChance: 0.3, newspaperChance: 0.25, spywareChance: 0.2, adwareChance: 0.15, cryptolockerChance: 0.1, glitchChance: 0.05, botnetChance: 0.15 },
      { count: 16, coneChance: 0.6, poleChance: 0.35, bucketChance: 0.35, newspaperChance: 0.3, footballChance: 0.2, spywareChance: 0.25, adwareChance: 0.2, cryptolockerChance: 0.15, glitchChance: 0.1, aptChance: 0.1, rootkitChance: 0.05 },
      { count: 22, coneChance: 0.65, poleChance: 0.4, bucketChance: 0.4, newspaperChance: 0.35, footballChance: 0.25, spywareChance: 0.3, adwareChance: 0.2, cryptolockerChance: 0.2, glitchChance: 0.15, botnetChance: 0.2 },
      { count: 30, coneChance: 0.7, poleChance: 0.4, bucketChance: 0.4, newspaperChance: 0.35, footballChance: 0.3, spywareChance: 0.3, adwareChance: 0.25, cryptolockerChance: 0.2, glitchChance: 0.2, aptChance: 0.15, rootkitChance: 0.1, huge: true }
    ]
  },
  "7-2": {
    name: "Air Gap - Final Stand", stage: 7, gridMode: '6_LANE_POOL', initialTokens: 50, tokenSpawnRate: 6000,
    fogColumns: [3, 4, 5, 6, 7, 8],
    reward: null, unlockedTowers: ALL_TOWER_KEYS,
    waves: [
      { count: 12, coneChance: 0.55, poleChance: 0.35, bucketChance: 0.35, newspaperChance: 0.3, spywareChance: 0.25, adwareChance: 0.2, cryptolockerChance: 0.15, glitchChance: 0.1, aptChance: 0.1 },
      { count: 18, coneChance: 0.65, poleChance: 0.4, bucketChance: 0.4, newspaperChance: 0.35, footballChance: 0.25, spywareChance: 0.3, adwareChance: 0.25, cryptolockerChance: 0.2, glitchChance: 0.15, aptChance: 0.15, rootkitChance: 0.1 },
      { count: 25, coneChance: 0.7, poleChance: 0.45, bucketChance: 0.4, newspaperChance: 0.35, footballChance: 0.3, spywareChance: 0.3, adwareChance: 0.25, cryptolockerChance: 0.25, glitchChance: 0.2, botnetChance: 0.2, aptChance: 0.15 },
      { count: 35, coneChance: 0.75, poleChance: 0.45, bucketChance: 0.45, newspaperChance: 0.4, footballChance: 0.35, spywareChance: 0.35, adwareChance: 0.3, cryptolockerChance: 0.25, glitchChance: 0.25, aptChance: 0.2, rootkitChance: 0.15, huge: true }
    ]
  }
};

const LEVEL_ORDER = [
  '1-1','1-2','1-3','1-4','1-5','1-6',
  '2-1','2-2','2-3',
  '3-1','3-2','3-3',
  '4-1','4-2','4-3',
  '5-10',
  '6-1','6-2',
  '7-1','7-2'
];
const STAGE_EMOJI = { 1: '🧱', 2: '🕸️', 3: '📡', 4: '🔐', 5: '💀', 6: '☁️', 7: '🛡️' };
