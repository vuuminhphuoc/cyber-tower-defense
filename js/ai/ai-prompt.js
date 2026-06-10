// =====================================================================
// ai-prompt.js — System prompt + user prompt builder for LLM
// Depends: config.js (TOWER_TYPES)
// Provides (global): buildSystemPrompt(config), buildUserPrompt(state, legalActions, playStyle)
// =====================================================================

const AI_PLAY_STYLES = {
  safe: 'SAFE: Stop threats closest to base first. Build economy early (Bitcoin Miner). Upgrade existing towers before placing new ones. Use walls for emergencies only. Collect tokens/coins immediately.',
  aggressive: 'AGGRESSIVE: Maximize DPS output. Place shooters in all threatened lanes. Upgrade offensive towers first. Use bombs freely. Minimize wall usage.',
  economy: 'ECONOMY: Place Bitcoin Miners ASAP. Delay wave starts to build economy. Upgrade producers first. Minimal defense until forced. Then mass upgrade shooters.',
  speedrun: 'SPEEDRUN: Start waves immediately. Minimal economy. Fast cheap defense. Aggressive upgrades. Use speed boost.'
};

function buildSystemPrompt(config) {
  const playStyle = AI_PLAY_STYLES[config.playStyle] || AI_PLAY_STYLES.safe;
  const maxActions = config.maxActions || 2;
  return `You are an AI player for Cyber Defenders, a cybersecurity tower defense game.

OBJECTIVE: Win the current level with minimal resource waste.

RULES:
1. You may ONLY choose from the legalActions list.
2. Do NOT invent actions not in legalActions.
3. You must return valid JSON only.
4. Maximum ${maxActions} actions per decision.
5. Do not spend diamonds unless explicitly allowed.

STRATEGY PRIORITIES (${config.playStyle?.toUpperCase() || 'SAFE'}):
${playStyle}

TOWER TYPES (for reference):
${Object.entries(TOWER_TYPES).map(([k, v]) => '- ' + k + ': ' + v.name + ' (' + v.type + ') — ' + v.desc).join('\n')}

THREAT TYPES:
${typeof THREAT_TYPES !== 'undefined' ? Object.entries(THREAT_TYPES).map(([k, v]) => '- ' + k + ': ' + v.name + ' — HP:' + v.hp + ' — ' + v.desc).join('\n') : '(see game state)'}

RESPONSE FORMAT (strict JSON only, no markdown):
{
  "thought": "Brief reasoning for your decisions (1-2 sentences)",
  "actions": [
    {"type": "action_type", ...parameters}
  ]
}

VALID ACTION TYPES:
- place_tower: {"type":"place_tower","tower":"FIREWALL","row":0,"col":2}
- upgrade_tower: {"type":"upgrade_tower","row":0,"col":2}
- sell_tower: {"type":"sell_tower","row":0,"col":2}
- collect_all: {"type":"collect_all"}
- send_wave: {"type":"send_wave"}
- toggle_speed: {"type":"toggle_speed"}
- wait: {"type":"wait"}`;
}

function buildUserPrompt(state, legalActions, playStyle) {
  // compact state for token efficiency
  const compactState = {
    level: state.level,
    credits: state.credits,
    score: state.score,
    wave: state.wave,
    waveActive: state.waveActive,
    mowers: state.mowers,
    availableTowers: state.availableTowers.map(t => t.key + '($' + t.cost + ')' + (t.cooldownReady ? '' : ' [CD]')).join(', '),
    lanes: state.lanes.map(l => ({
      row: l.row,
      threats: l.threats.map(t => t.type + '@' + Math.round(t.x) + '(' + t.hp + 'hp)'),
      towers: l.towers.join(',')
    }))
  };
  return 'GAME STATE:\n' + JSON.stringify(compactState, null, 2) +
    '\n\nLEGAL ACTIONS (choose ONLY from these):\n' +
    JSON.stringify(legalActions, null, 2) +
    '\n\nPlay style: ' + (playStyle || 'safe') +
    '\n\nReturn JSON with "thought" and "actions" array.';
}
