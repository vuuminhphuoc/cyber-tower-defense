// =====================================================================
// ai-provider.js — LLM API adapter (OpenAI, Anthropic, Gemini, Custom)
// Depends: ai-settings.js
// Provides (global): AIProvider.call(config, messages)
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
        return callOpenAICompatible(config, messages); // fallback to OpenAI format
    }
  }
};

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
