// =====================================================================
// ai-validator.js — Validate LLM output against legal actions
// Depends: ai-state.js
// Provides (global): AIValidator.validate(response, legalActions)
// =====================================================================

const AIValidator = {
  validate(response, legalActions) {
    try {
      // strip markdown code fences if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(cleaned);
      if (!parsed.actions || !Array.isArray(parsed.actions)) {
        return { valid: false, error: 'Missing actions array', actions: [] };
      }
      const validActions = [];
      for (const action of parsed.actions) {
        if (!action || !action.type) continue;
        // find matching legal action
        const match = legalActions.find(la => {
          if (la.type !== action.type) return false;
          switch (la.type) {
            case 'place_tower':
              return la.tower === action.tower && la.row === action.row && la.col === action.col;
            case 'upgrade_tower':
              return la.row === action.row && la.col === action.col;
            case 'sell_tower':
              return la.row === action.row && la.col === action.col;
            default:
              return true; // collect_all, send_wave, toggle_speed, wait
          }
        });
        if (match) {
          validActions.push(match);
        }
      }
      return {
        valid: validActions.length > 0,
        thought: parsed.thought || '',
        actions: validActions,
        totalAttempted: parsed.actions.length,
        totalValid: validActions.length
      };
    } catch (e) {
      return { valid: false, error: 'JSON parse: ' + e.message, actions: [] };
    }
  }
};
