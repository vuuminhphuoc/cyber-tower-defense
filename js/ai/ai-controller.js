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
  allowSpendDiamonds: false,
  lastThought: '',
  lastApiError: '',
  llmActive: false
};

let aiInterval = null;
let aiLastTick = 0;
let aiLastAction = '';
let aiActionsThisTick = 0;

AI.start = function() {
  if (aiInterval) return;
  AI_CONFIG.enabled = true;
  // apply saved LLM settings
  const saved = loadAISettings();
  AI_CONFIG.mode = saved.mode || 'rule';
  AI_CONFIG.tickRate = AI_CONFIG.mode === 'rule' ? 500 : (saved.tickRate || 750);
  AI_CONFIG.maxActionsPerTick = AI_CONFIG.mode === 'rule' ? 3 : (saved.maxActions || 2);
  aiLastTick = performance.now();
  aiInterval = setInterval(async () => {
    if (gameOver || gameWon || gamePaused) return;
    if (gameState !== GAME_STATE.PLAYING) return;
    const state = AI.getState();
    const legalActions = AI.getLegalActions();
    let decisions;
    if (AI_CONFIG.mode === 'llm' && hasValidProvider(saved)) {
      try {
        decisions = await AI.llmDecide(state, legalActions, saved);
      } catch (e) {
        AI_CONFIG.lastApiError = e.message;
        if (saved.autoFallback) {
          AI_CONFIG.mode = 'rule';
          decisions = AI.ruleBotDecide(state, legalActions);
        } else {
          decisions = [{ type: 'wait' }];
        }
      }
    } else {
      decisions = AI.ruleBotDecide(state, legalActions);
    }
    aiActionsThisTick = 0;
    for (const action of decisions) {
      if (AI.executeAction(action)) {
        aiActionsThisTick++;
        aiLastAction = AI.formatAction(action);
        if (aiActionsThisTick >= AI_CONFIG.maxActionsPerTick) break;
      }
    }
    aiLastTick = performance.now();
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
    // reload mode from settings each time AI is toggled on
    const saved = loadAISettings();
    AI_CONFIG.mode = saved.mode || 'rule';
    AI.start();
  }
  AI.updateButton();
};

AI.updateButton = function() {
  const btn = document.getElementById('ai-btn');
  if (!btn) return;
  if (AI_CONFIG.enabled) {
    const modeLabel = AI_CONFIG.mode === 'llm' ? '🧠 LLM' : '⚙️ Rule';
    btn.textContent = '🤖 AI: ON (' + modeLabel + ')';
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

function hasValidProvider(config) {
  return config.apiUrl && (config.provider !== 'openai-compatible' || config.apiKey);
}

AI.llmDecide = async function(state, legalActions, config) {
  if (legalActions.length <= 1) return legalActions;
  AI_CONFIG.llmActive = true;
  const messages = [
    { role: 'system', content: buildSystemPrompt(config) },
    { role: 'user', content: buildUserPrompt(state, legalActions, config.playStyle) }
  ];
  const response = await AIProvider.call(config, messages);
  const result = AIValidator.validate(response, legalActions);
  AI_CONFIG.lastThought = result.thought || '';
  AI_CONFIG.lastApiError = result.valid ? '' : (result.error || 'Validation failed');
  AI_CONFIG.llmActive = false;
  if (result.valid && result.actions.length > 0) {
    return result.actions.slice(0, config.maxActions || 2);
  }
  if (config.autoFallback) {
    AI_CONFIG.mode = 'rule';
    return AI.ruleBotDecide(state, legalActions);
  }
  return [{ type: 'wait' }];
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
