// =====================================================================
// ai-provider.js — LLM API adapter (OpenAI, Anthropic, Gemini, Custom)
// Depends: ai-settings.js
// Provides (global): AIProvider.call(config, messages), AIProvider.fetchModels(config)
// =====================================================================

const AIProvider = {
  async call(config, messages) {
    switch (config.provider) {
      case 'openai-compatible':
      case 'openai':
      case 'openrouter':
      case 'groq':
      case 'together':
      case 'deepseek':
        return callOpenAICompatible(config, messages);
      case 'anthropic':
        return callAnthropic(config, messages);
      case 'gemini':
        return callGemini(config, messages);
      default:
        return callOpenAICompatible(config, messages);
    }
  },

  async fetchModels(config) {
    switch (config.provider) {
      case 'anthropic':
        return ANTHROPIC_MODELS;
      case 'gemini':
        return await fetchGeminiModels(config);
      default:
        return await fetchOpenAICompatibleModels(config);
    }
  }
};

// Hardcoded Anthropic models (no public list API)
const ANTHROPIC_MODELS = [
  'claude-opus-4-20250514',
  'claude-sonnet-4-20250514',
  'claude-3-5-haiku-20241022',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229'
];

async function fetchOpenAICompatibleModels(config) {
  // derive models endpoint from chat endpoint
  let modelsUrl = config.apiUrl.replace(/\/chat\/completions$/, '/models');
  if (modelsUrl === config.apiUrl) {
    // try appending /models
    const base = config.apiUrl.replace(/\/$/, '');
    modelsUrl = base.replace(/\/v\d+$/, '') + '/v1/models';
  }
  const headers = {};
  if (config.apiKey) headers['Authorization'] = 'Bearer ' + config.apiKey;
  const res = await fetch(modelsUrl, { headers });
  if (!res.ok) throw new Error('Fetch models failed: ' + res.status);
  const data = await res.json();
  const list = (data.data || data.models || [])
    .map(m => m.id || m.name)
    .filter(Boolean)
    .sort();
  if (list.length === 0) throw new Error('No models returned');
  return list;
}

async function fetchGeminiModels(config) {
  const url = 'https://generativelanguage.googleapis.com/v1/models' +
    (config.apiKey ? '?key=' + config.apiKey : '');
  const res = await fetch(url);
  if (!res.ok) throw new Error('Fetch models failed: ' + res.status);
  const data = await res.json();
  const list = (data.models || [])
    .map(m => m.name ? m.name.replace('models/', '') : null)
    .filter(n => n && n.startsWith('gemini'))
    .sort();
  if (list.length === 0) throw new Error('No models returned');
  return list;
}

async function callOpenAICompatible(config, messages) {
  const headers = { 'Content-Type': 'application/json' };
  if (config.apiKey) {
    headers['Authorization'] = 'Bearer ' + config.apiKey;
  }
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature || 0.2,
      max_tokens: config.maxTokens || 500
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('API ' + res.status + ': ' + err.substring(0, 200));
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(config, messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  };
  if (config.apiKey) headers['x-api-key'] = config.apiKey;
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      system: systemMsg?.content || '',
      messages: userMsgs,
      max_tokens: config.maxTokens || 500,
      temperature: config.temperature || 0.2
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('API ' + res.status + ': ' + err.substring(0, 200));
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callGemini(config, messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  const contents = userMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const url = config.apiUrl + '/v1/models/' + config.model + ':generateContent' +
    (config.apiKey ? '?key=' + config.apiKey : '');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      generationConfig: {
        temperature: config.temperature || 0.2,
        maxOutputTokens: config.maxTokens || 500
      }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error('API ' + res.status + ': ' + err.substring(0, 200));
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
