// =====================================================================
// state.js — Global state (state machine + entity arrays)
// Depends: config.js (conceptual only)
// Provides (global): GAME_STATE, gameState, currentLevelId, currentLevel,
//   chosenSeeds, credits, score, gameOver, gameWon, frame, lastTime, deltaTime,
//   grid, towers, threats, projectiles, tokens, coins, selectedTowerKey,
//   towerCooldowns, lastSkyToken, skyTokenInterval
// Used by: most other files
// =====================================================================

// ===== State Machine =====
const GAME_STATE = { MENU: 'MENU', SEED_CHOOSER: 'SEED_CHOOSER', PLAYING: 'PLAYING', SHOP: 'SHOP', ALMANAC: 'ALMANAC', HELP: 'HELP' };
let gameState = GAME_STATE.MENU;
let currentLevelId = null;
let currentLevel = null;
let chosenSeeds = []; // selected seeds for the match

// ===== Battle state =====
let credits = 300;
let score = 0;
let gameOver = false;
let gameWon = false;
let gamePaused = false;
let frame = 0;
let lastTime = 0;
let deltaTime = 16.67;
let gameTime = 0; // accumulated game time (advances by deltaTime each frame)

// ===== Shovel =====
let shovelActive = false;

// ===== Game Speed =====
let gameSpeed = 1; // 1 = normal, 2 = fast forward

// ===== Lawn Mowers =====
let lawnMowers = [];  // LawnMower[] — firewall reset per row

// ===== Grid mode =====
let gridMode = '5_LANE'; // '5_LANE' | '6_LANE_POOL'
let gridRows = 5;        // 5 or 6 (pool)

// ===== Entity arrays =====
let grid = [];          // Cell[ROWS][COLS]
let towers = [];
let threats = [];
let projectiles = [];
let tokens = [];
let coins = [];   // coins dropped from threats

let selectedTowerKey = null;
let towerCooldowns = {};  // { BITCOIN_MINER: timestampReady, ... }

// sky token spawn counter
let lastSkyToken = 0;
let skyTokenInterval = 12000;

// ===== Slow Effect =====
// threats[i]._slowUntil = timestamp when slow expires
// threats[i]._slowFactor = 0.5 when slowed, 1.0 when normal

// ===== Floating text + Particles =====
let floatingTexts = [];
let particles = [];

// ===== Hover state (for range preview) =====
let hoverRow = -1;
let hoverCol = -1;

function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color: color || '#e74c3c', born: performance.now(), life: 1200 });
}

function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 400 + Math.random() * 300,
      born: performance.now(),
      color: color || '#00ff41',
      size: 2 + Math.random() * 3
    });
  }
}

// ===== Screen Shake =====
let shakeIntensity = 0;
let shakeDuration = 0;
let shakeStart = 0;

function triggerShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeStart = performance.now();
}
