// =====================================================================
// ai-controller.js — AI tick loop + UI toggle
// Depends: ai-state.js, ai-actions.js, ai-rule-bot.js, state.js
// Provides (global): AI.start(), AI.stop(), AI.toggle(), AI_CONFIG
// =====================================================================

const AI_CONFIG = {
  enabled: false,
  mode: 'rule', // 'rule' | 'llm' (v2.0)
  tickRate: 750,
  maxActionsPerTick: 2,
  allowSpendDiamonds: false
};

let aiInterval = null;
let aiLastTick = 0;
let aiLastAction = '';
let aiActionsThisTick = 0;

AI.start = function() {
  if (aiInterval) return;
  AI_CONFIG.enabled = true;
  aiLastTick = performance.now();
  aiInterval = setInterval(() => {
    if (gameOver || gameWon || gamePaused) return;
    if (gameState !== GAME_STATE.PLAYING) return;
    const now = performance.now();
    const state = AI.getState();
    const legalActions = AI.getLegalActions();
    let decisions;
    if (AI_CONFIG.mode === 'rule') {
      decisions = AI.ruleBotDecide(state, legalActions);
    } else {
      decisions = [{ type: 'wait' }]; // LLM mode placeholder
    }
    aiActionsThisTick = 0;
    for (const action of decisions) {
      if (AI.executeAction(action)) {
        aiActionsThisTick++;
        aiLastAction = AI.formatAction(action);
        if (aiActionsThisTick >= AI_CONFIG.maxActionsPerTick) break;
      }
    }
    aiLastTick = now;
  }, AI_CONFIG.tickRate);
};

AI.stop = function() {
  if (aiInterval) {
    clearInterval(aiInterval);
    aiInterval = null;
  }
  AI_CONFIG.enabled = false;
};

AI.toggle = function() {
  if (AI_CONFIG.enabled) {
    AI.stop();
  } else {
    AI.start();
  }
  AI.updateButton();
};

AI.updateButton = function() {
  const btn = document.getElementById('ai-btn');
  if (!btn) return;
  if (AI_CONFIG.enabled) {
    btn.textContent = '🤖 AI: ON';
    btn.classList.add('active');
  } else {
    btn.textContent = '🤖 AI: OFF';
    btn.classList.remove('active');
  }
};

AI.formatAction = function(action) {
  switch (action.type) {
    case 'place_tower':
      return 'Place ' + (TOWER_TYPES[action.tower] ? TOWER_TYPES[action.tower].name : action.tower) +
             ' row ' + action.row + ' col ' + action.col;
    case 'upgrade_tower':
      return 'Upgrade row ' + action.row + ' col ' + action.col;
    case 'sell_tower':
      return 'Sell row ' + action.row + ' col ' + action.col;
    case 'collect_all':
      return 'Collect all';
    case 'send_wave':
      return 'Send wave';
    case 'toggle_speed':
      return 'Toggle speed';
    default:
      return action.type;
  }
};

// Add AI toggle button to UI bar on load
(function initAIButton() {
  const uiBar = document.getElementById('ui-bar');
  if (!uiBar) return;
  const btn = document.createElement('button');
  btn.id = 'ai-btn';
  btn.className = 'ui-tool-btn';
  btn.title = 'Toggle AI autopilot';
  btn.textContent = '🤖 AI: OFF';
  btn.addEventListener('click', () => {
    AI.toggle();
    Sound.menuClick();
  });
  // insert before speed button
  const speedBtn = document.getElementById('speed-btn');
  if (speedBtn) {
    uiBar.insertBefore(btn, speedBtn);
  } else {
    uiBar.appendChild(btn);
  }
})();
