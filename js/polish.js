// =====================================================================
// polish.js — Loading screen, tutorial overlay, achievement system
// Depends: config.js, state.js, screens.js
// Provides (global): LoadingScreen, Tutorial, Achievements
// =====================================================================

// ===== Loading Screen =====
const LoadingScreen = {
  el: document.getElementById('loading-screen'),
  text: document.getElementById('loading-text'),
  bar: document.getElementById('loading-bar'),
  messages: [
    'Initializing network defenses...',
    'Scanning threat database...',
    'Loading tower modules...',
    'Calibrating firewall systems...',
    'Establishing secure connection...',
    'Deploying countermeasures...',
    'Ready.'
  ],
  show() {
    this.el.style.display = 'flex';
    this.bar.style.width = '0%';
    this.text.textContent = this.messages[0];
  },
  update(progress) {
    const idx = Math.min(Math.floor(progress * this.messages.length), this.messages.length - 1);
    this.text.textContent = this.messages[idx];
    this.bar.style.width = Math.min(100, progress * 100) + '%';
  },
  hide() {
    this.bar.style.width = '100%';
    this.text.textContent = 'Ready.';
    setTimeout(() => {
      this.el.style.opacity = '0';
      setTimeout(() => { this.el.style.display = 'none'; this.el.style.opacity = '1'; }, 500);
    }, 300);
  }
};

// ===== Tutorial System =====
const TUTORIAL_STEPS = [
  { icon: '🛡️', title: 'Welcome to Cyber Defenders!', text: 'You are the last line of defense against cyber threats. Place towers to protect your network from incoming attacks.' },
  { icon: '💰', title: 'Credits & Tokens', text: 'You start with credits to place towers. Collect sky tokens and coins from defeated threats to earn more. Hover over them to collect!' },
  { icon: '🔧', title: 'Placing Towers', text: 'Click a tower card in the bottom bar, then click a grid cell to place it. Different towers have different abilities.' },
  { icon: '🧱', title: 'Towers & Walls', text: 'Shooter towers (like 🔥 Firewall) deal damage. Walls (like 🛡️ Defender) block threats. Producers (like ⛏️ Bitcoin Miner) earn credits.' },
  { icon: '🦠', title: 'Threats', text: 'Threats move from right to left. Each one that reaches the left edge costs you a lawn mower. Lose all mowers = game over!' },
  { icon: '⬆️', title: 'Upgrades', text: 'Click a placed tower to see upgrade options. Upgrading costs 60% of the base tower cost but makes it stronger.' },
  { icon: '🗑️', title: 'Selling Towers', text: 'Click a tower and use the Sell button to remove it. You get back 60% of your total investment.' },
  { icon: '📡', title: 'Waves', text: 'Click the wave button (📡) to send the next wave early for bonus time. Or wait for auto-send.' },
  { icon: '🤖', title: 'AI Autopilot', text: 'Toggle the 🤖 AI button to let the rule-based bot play for you. Great for testing or watching strategies!' },
  { icon: '🎮', title: 'Ready to Play!', text: 'Start with Level 1-1. Build your economy with Bitcoin Miners, then defend with Firewalls. Good luck, defender!' }
];

const Tutorial = {
  overlay: document.getElementById('tutorial-overlay'),
  title: document.getElementById('tutorial-title'),
  icon: document.getElementById('tutorial-icon'),
  text: document.getElementById('tutorial-text'),
  progress: document.getElementById('tutorial-progress'),
  step: 0,
  isActive: false,

  start() {
    if (localStorage.getItem('cyber_tutorial_done')) return;
    this.step = 0;
    this.isActive = true;
    this.overlay.style.display = 'flex';
    this.render();
  },

  render() {
    const s = TUTORIAL_STEPS[this.step];
    this.title.textContent = s.title;
    this.icon.textContent = s.icon;
    this.text.textContent = s.text;
    this.progress.textContent = (this.step + 1) + ' / ' + TUTORIAL_STEPS.length;
  },

  next() {
    this.step++;
    if (this.step >= TUTORIAL_STEPS.length) {
      this.finish();
    } else {
      this.render();
    }
  },

  finish() {
    this.isActive = false;
    this.overlay.style.display = 'none';
    localStorage.setItem('cyber_tutorial_done', '1');
  }
};

document.getElementById('tutorial-next').addEventListener('click', () => Tutorial.next());
document.getElementById('tutorial-skip').addEventListener('click', () => Tutorial.finish());

// ===== Achievement System =====
const ACHIEVEMENT_DEFS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Defeat your first threat', icon: '⚔️', check: (s) => s.threatsKilled >= 1 },
  { id: 'wave_5', name: 'Getting Started', desc: 'Complete wave 5', icon: '🌊', check: (s) => s.wavesCompleted >= 5 },
  { id: 'wave_10', name: 'Veteran', desc: 'Complete wave 10', icon: '🏅', check: (s) => s.wavesCompleted >= 10 },
  { id: 'wave_25', name: 'Quarter Century', desc: 'Complete wave 25', icon: '🎖️', check: (s) => s.wavesCompleted >= 25 },
  { id: 'wave_50', name: 'Half Century', desc: 'Complete wave 50', icon: '🥇', check: (s) => s.wavesCompleted >= 50 },
  { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat a boss', icon: '👑', check: (s) => s.bossesDefeated >= 1 },
  { id: 'all_bosses', name: 'Boss Hunter', desc: 'Defeat all 4 bosses', icon: '🏆', check: (s) => s.bossesDefeated >= 4 },
  { id: 'stage_5', name: 'Halfway There', desc: 'Complete Stage 5', icon: '📡', check: (s) => s.maxStage >= 5 },
  { id: 'stage_10', name: 'Network Complete', desc: 'Complete Stage 10', icon: '🌐', check: (s) => s.maxStage >= 10 },
  { id: 'collector', name: 'Coin Collector', desc: 'Collect 500 coins total', icon: '💰', check: (s) => s.totalCoins >= 500 },
  { id: 'whale', name: 'Whale', desc: 'Collect 5000 coins total', icon: '🐋', check: (s) => s.totalCoins >= 5000 },
  { id: 'builder', name: 'Tower Builder', desc: 'Place 100 towers total', icon: '🏗️', check: (s) => s.towersPlaced >= 100 },
  { id: 'demolisher', name: 'Demolisher', desc: 'Sell 20 towers total', icon: '🗑️', check: (s) => s.towersSold >= 20 },
  { id: 'speedrunner', name: 'Speedrunner', desc: 'Complete a level in under 2 minutes', icon: '⚡', check: (s) => s.fastestLevel > 0 && s.fastestLevel < 120000 },
  { id: 'no_damage', name: 'Perfect Defense', desc: 'Complete a level without losing any mowers', icon: '✨', check: (s) => s.perfectLevels >= 1 },
  { id: 'endless_10', name: 'Endurance', desc: 'Survive 10 waves in Endless Mode', icon: '♾️', check: (s) => s.endlessBest >= 10 },
  { id: 'endless_25', name: 'Marathon', desc: 'Survive 25 waves in Endless Mode', icon: '🏃', check: (s) => s.endlessBest >= 25 },
  { id: 'ai_user', name: 'AI Whisperer', desc: 'Use the AI autopilot', icon: '🤖', check: (s) => s.aiUsed },
  { id: 'all_towers', name: 'Arsenal', desc: 'Unlock all 26 towers', icon: '🔓', check: (s) => s.towersUnlocked >= 26 },
  { id: 'challenge_first', name: 'Challenger', desc: 'Complete any challenge mode', icon: '🎯', check: (s) => s.challengesCompleted >= 1 }
];

const Achievements = {
  popup: document.getElementById('achievement-popup'),
  nameEl: document.getElementById('achievement-name'),
  descEl: document.getElementById('achievement-desc'),
  unlocked: JSON.parse(localStorage.getItem('cyber_achievements') || '[]'),
  stats: JSON.parse(localStorage.getItem('cyber_achievements_stats') || '{}'),
  popupTimer: null,

  updateStats(key, value) {
    this.stats[key] = (this.stats[key] || 0) + value;
    this.save();
  },

  setStat(key, value) {
    this.stats[key] = value;
    this.save();
  },

  checkAll() {
    for (const ach of ACHIEVEMENT_DEFS) {
      if (this.unlocked.includes(ach.id)) continue;
      if (ach.check(this.stats)) {
        this.unlock(ach);
      }
    }
  },

  unlock(ach) {
    if (this.unlocked.includes(ach.id)) return;
    this.unlocked.push(ach.id);
    localStorage.setItem('cyber_achievements', JSON.stringify(this.unlocked));
    this.showPopup(ach);
  },

  showPopup(ach) {
    if (this.popupTimer) clearTimeout(this.popupTimer);
    this.nameEl.textContent = ach.icon + ' ' + ach.name;
    this.descEl.textContent = ach.desc;
    this.popup.style.display = 'block';
    this.popup.style.animation = 'slideIn 0.3s ease-out';
    this.popupTimer = setTimeout(() => {
      this.popup.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => { this.popup.style.display = 'none'; }, 300);
    }, 4000);
  },

  save() {
    localStorage.setItem('cyber_achievements', JSON.stringify(this.unlocked));
    localStorage.setItem('cyber_achievements_stats', JSON.stringify(this.stats));
  },

  isUnlocked(id) {
    return this.unlocked.includes(id);
  },

  getCount() {
    return this.unlocked.length;
  }
};

// Hook into game events for achievement tracking (deferred until all scripts load)
(function hookAchievements() {
  function init() {
    // Track threats killed by patching cleanupEntities
    if (typeof cleanupEntities !== 'undefined') {
      const origCleanup = cleanupEntities;
      cleanupEntities = function() {
        const before = threats.length;
        origCleanup();
        const killed = before - threats.length;
        if (killed > 0) {
          Achievements.updateStats('threatsKilled', killed);
        }
      };
    }

    // Track towers placed - patch the global tryTower
    if (typeof tryTower !== 'undefined') {
      const origTryTower = tryTower;
      tryTower = function(row, col) {
        const result = origTryTower(row, col);
        if (result) {
          Achievements.updateStats('towersPlaced', 1);
        }
        return result;
      };
    }

    // Track towers sold - patch sellTower
    if (typeof sellTower !== 'undefined') {
      const origSellTower = sellTower;
      sellTower = function(row, col) {
        const result = origSellTower(row, col);
        if (result) {
          Achievements.updateStats('towersSold', 1);
        }
        return result;
      };
    }

    // Track coins collected - patch collectCoinEntity
    if (typeof collectCoinEntity !== 'undefined') {
      const origCollectCoin = collectCoinEntity;
      collectCoinEntity = function(coin) {
        const val = coin.cfg ? coin.cfg.value : 5;
        Achievements.updateStats('totalCoins', val);
        return origCollectCoin(coin);
      };
    }

    // Track waves completed
    if (typeof updateWaves !== 'undefined') {
      const origUpdateWaves = updateWaves;
      updateWaves = function(now) {
        const prevWave = currentWave;
        const prevActive = waveActive;
        origUpdateWaves(now);
        if (prevActive && !waveActive && currentWave !== prevWave) {
          Achievements.updateStats('wavesCompleted', 1);
        }
      };
    }

    // Track AI usage
    if (typeof AI !== 'undefined' && AI.toggle) {
      const origAIToggle = AI.toggle;
      AI.toggle = function() {
        Achievements.setStat('aiUsed', true);
        origAIToggle();
      };
    }

    // Track challenges completed
    if (typeof triggerWin !== 'undefined') {
      const origTriggerWin = triggerWin;
      triggerWin = function() {
        if (gameMode !== 'campaign') {
          Achievements.updateStats('challengesCompleted', 1);
        }
        if (typeof lawnMowers !== 'undefined' && lawnMowers.every(m => !m.markedForDeletion)) {
          Achievements.updateStats('perfectLevels', 1);
        }
        if (gameStartTime > 0) {
          const elapsed = performance.now() - gameStartTime;
          const prev = Achievements.stats.fastestLevel || 999999;
          if (elapsed < prev) {
            Achievements.setStat('fastestLevel', elapsed);
          }
        }
        origTriggerWin();
      };
    }
  }

  // Wait for all scripts to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // scripts already loaded, but main.js bootstrap may not have run yet
    setTimeout(init, 50);
  }

  // check achievements periodically
  setInterval(() => {
    if (gameState !== GAME_STATE.PLAYING) return;
    if (currentLevel && currentLevel.stage) {
      Achievements.setStat('maxStage', Math.max(Achievements.stats.maxStage || 0, currentLevel.stage));
    }
    Achievements.setStat('endlessBest', endlessBest);
    Achievements.setStat('towersUnlocked', saveData.inventory.unlockedTowers.length);
    Achievements.checkAll();
  }, 5000);
})();
