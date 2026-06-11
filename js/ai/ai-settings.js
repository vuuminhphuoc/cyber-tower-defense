// =====================================================================
// ai-settings.js — AI settings UI + localStorage persistence
// Depends: ai-provider.js, ai-prompt.js, ai-validator.js
// Provides (global): AISettings, loadAISettings(), saveAISettings()
// =====================================================================

const AI_SETTINGS_KEY = 'cyber_defenders_ai_settings';

function defaultAISettings() {
  return {
    mode: 'rule', // 'rule' | 'llm'
    provider: 'openai-compatible',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.2,
    maxTokens: 500,
    tickRate: 750,
    maxActions: 2,
    playStyle: 'safe',
    autoFallback: true
  };
}

function loadAISettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AI_SETTINGS_KEY));
    return Object.assign(defaultAISettings(), saved || {});
  } catch { return defaultAISettings(); }
}

function saveAISettings(settings) {
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
}

const AISettings = {
  screen: null,
  fetchedModels: [],
  init() {
    this.screen = document.getElementById('screen-ai-settings');
  },
  open() {
    const s = loadAISettings();
    document.getElementById('ai-mode-select').value = s.mode || 'rule';
    document.getElementById('ai-provider').value = s.provider;
    document.getElementById('ai-api-url').value = s.apiUrl;
    document.getElementById('ai-api-key').value = s.apiKey;
    this.populateModelDropdown(s.model);
    document.getElementById('ai-temperature').value = s.temperature;
    document.getElementById('ai-max-tokens').value = s.maxTokens;
    document.getElementById('ai-tick-rate').value = s.tickRate;
    document.getElementById('ai-max-actions').value = s.maxActions;
    document.getElementById('ai-play-style').value = s.playStyle;
    document.getElementById('ai-auto-fallback').checked = s.autoFallback;
    document.getElementById('ai-settings-status').textContent = 'Ready';
    showScreen(GAME_STATE.AI_SETTINGS);
    // auto-fetch models if key exists
    if (s.apiKey) {
      this.fetchModels();
    }
  },
  populateModelDropdown(selectedModel) {
    const select = document.getElementById('ai-model-select');
    const input = document.getElementById('ai-model-input');
    // always keep input in sync for manual entry
    input.value = selectedModel || '';
    // if we have fetched models, populate dropdown
    if (this.fetchedModels.length > 0) {
      select.innerHTML = '';
      for (const m of this.fetchedModels) {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        if (m === selectedModel) opt.selected = true;
        select.appendChild(opt);
      }
      // if selected model not in list, add it
      if (selectedModel && !this.fetchedModels.includes(selectedModel)) {
        const opt = document.createElement('option');
        opt.value = selectedModel;
        opt.textContent = selectedModel + ' (saved)';
        opt.selected = true;
        select.insertBefore(opt, select.firstChild);
      }
      select.style.display = '';
      input.style.display = 'none';
    } else {
      select.style.display = 'none';
      input.style.display = '';
    }
  },
  async fetchModels() {
    const statusEl = document.getElementById('ai-settings-status');
    // read directly from inputs (not localStorage — user may not have saved yet)
    const apiKey = document.getElementById('ai-api-key').value.trim();
    const provider = document.getElementById('ai-provider').value;
    const apiUrl = document.getElementById('ai-api-url').value.trim();
    if (!apiKey && provider !== 'anthropic') {
      statusEl.textContent = 'Enter API key first to fetch models.';
      return;
    }
    statusEl.textContent = 'Fetching models...';
    const config = { provider, apiUrl, apiKey };
    try {
      const models = await AIProvider.fetchModels(config);
      this.fetchedModels = models;
      const currentModel = document.getElementById('ai-model-input').value ||
        document.getElementById('ai-model-select').value;
      this.populateModelDropdown(currentModel);
      statusEl.textContent = 'Loaded ' + models.length + ' models.';
    } catch (e) {
      statusEl.textContent = 'Model fetch failed: ' + e.message + ' — you can type manually.';
      document.getElementById('ai-model-select').style.display = 'none';
      document.getElementById('ai-model-input').style.display = '';
    }
  },
  save() {
    // get model from whichever is visible
    const select = document.getElementById('ai-model-select');
    const input = document.getElementById('ai-model-input');
    const model = select.style.display !== 'none' ? select.value : input.value;
    const s = {
      mode: document.getElementById('ai-mode-select').value,
      provider: document.getElementById('ai-provider').value,
      apiUrl: document.getElementById('ai-api-url').value,
      apiKey: document.getElementById('ai-api-key').value,
      model: model,
      temperature: parseFloat(document.getElementById('ai-temperature').value) || 0.2,
      maxTokens: parseInt(document.getElementById('ai-max-tokens').value) || 500,
      tickRate: parseInt(document.getElementById('ai-tick-rate').value) || 2000,
      maxActions: parseInt(document.getElementById('ai-max-actions').value) || 2,
      playStyle: document.getElementById('ai-play-style').value,
      autoFallback: document.getElementById('ai-auto-fallback').checked
    };
    saveAISettings(s);
    AI_CONFIG.mode = s.mode;
    AI_CONFIG.tickRate = s.tickRate;
    AI_CONFIG.maxActionsPerTick = s.maxActions;
    document.getElementById('ai-settings-status').textContent = 'Saved! Mode: ' + s.mode.toUpperCase();
  },
  clearKey() {
    document.getElementById('ai-api-key').value = '';
    const s = loadAISettings();
    s.apiKey = '';
    saveAISettings(s);
    this.fetchedModels = [];
    this.populateModelDropdown(s.model);
    document.getElementById('ai-settings-status').textContent = 'API key cleared.';
  },
  async testConnection() {
    const statusEl = document.getElementById('ai-settings-status');
    statusEl.textContent = 'Testing connection...';
    const apiKey = document.getElementById('ai-api-key').value.trim();
    const provider = document.getElementById('ai-provider').value;
    const apiUrl = document.getElementById('ai-api-url').value.trim();
    const model = document.getElementById('ai-model-select').style.display !== 'none'
      ? document.getElementById('ai-model-select').value
      : document.getElementById('ai-model-input').value;
    if (!apiKey) {
      statusEl.textContent = 'Error: No API key entered.';
      return;
    }
    const config = { provider, apiUrl, apiKey, model };
    try {
      const res = await AIProvider.call(config, [
        { role: 'user', content: 'Say "OK" if you can hear me. Reply with only the word OK.' }
      ]);
      statusEl.textContent = 'Connected! Response: ' + res.substring(0, 80);
    } catch (e) {
      statusEl.textContent = 'Error: ' + e.message;
    }
  }
};

// Provider presets
const PROVIDER_PRESETS = {
  'openai': { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  'openai-compatible': { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  'openrouter': { url: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini' },
  'groq': { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.1-8b-instant' },
  'together': { url: 'https://api.together.xyz/v1/chat/completions', model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' },
  'deepseek': { url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
  'anthropic': { url: 'https://api.anthropic.com/v1/messages', model: 'claude-3-haiku-20240307' },
  'gemini': { url: 'https://generativelanguage.googleapis.com', model: 'gemini-1.5-flash' },
  'custom': { url: '', model: '' }
};

function onProviderChange() {
  const provider = document.getElementById('ai-provider').value;
  const preset = PROVIDER_PRESETS[provider];
  if (preset) {
    document.getElementById('ai-api-url').value = preset.url;
    // set model in input (will be populated to dropdown on fetch)
    document.getElementById('ai-model-input').value = preset.model;
    document.getElementById('ai-model-input').style.display = '';
    document.getElementById('ai-model-select').style.display = 'none';
  }
  // auto-fetch models if key is present
  const key = document.getElementById('ai-api-key').value;
  if (key) {
    AISettings.fetchModels();
  }
}
