// =====================================================================
// save.js — Save/load progress via localStorage
// Depends: NONE
// Provides (global): defaultSaveData, SaveManager, saveData
// Used by: screens.js (beatLevel, menu, seed chooser), ui.js (collectCoin)
// =====================================================================

const defaultSaveData = {
  progress: { maxLevelIndex: 0 }, // index in LEVEL_ORDER that is unlocked
  wallet: { coins: 0, diamonds: 0 },
  inventory: { unlockedTowers: ['BITCOIN_MINER', 'FIREWALL'], seedSlots: 6 },
  settings: { showGrid: true },
  bonusStartingTokens: 0
};

const SaveManager = {
  SAVE_KEY: 'cyber_defenders_save',
  OLD_KEY: 'pvz_web_save_data',
  load() {
    try {
      // Migrate from old save key
      const oldData = localStorage.getItem(this.OLD_KEY);
      if (oldData) {
        const parsed = JSON.parse(oldData);
        const migrated = this._mergeWithDefaults(parsed);
        this.save(migrated);
        localStorage.removeItem(this.OLD_KEY);
        return migrated;
      }
      const data = localStorage.getItem(this.SAVE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // merge with default to avoid missing fields
        return this._mergeWithDefaults(parsed);
      }
    } catch (e) { console.warn('Save load failed', e); }
    return JSON.parse(JSON.stringify(defaultSaveData));
  },
  _mergeWithDefaults(parsed) {
    return {
      progress: Object.assign({}, defaultSaveData.progress, parsed.progress),
      wallet: Object.assign({}, defaultSaveData.wallet, parsed.wallet),
      inventory: Object.assign({}, defaultSaveData.inventory, parsed.inventory),
      settings: Object.assign({}, defaultSaveData.settings, parsed.settings),
      bonusStartingTokens: parsed.bonusStartingTokens || 0
    };
  },
  save(data) {
    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    } catch (e) { console.warn('Save failed', e); }
  },
  reset() {
    localStorage.removeItem(this.SAVE_KEY);
    localStorage.removeItem(this.OLD_KEY);
  }
};

let saveData = SaveManager.load();
