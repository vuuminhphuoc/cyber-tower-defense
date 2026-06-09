// =====================================================================
// shop.js — Tech Shop
// Depends: config.js (SHOP_ITEMS, ALL_TOWER_KEYS, TOWER_TYPES), save.js (saveData, SaveManager), state.js
// Provides (global): openShop, renderShop
// Used by: screens.js (menu button)
// =====================================================================

const screenShop = document.getElementById('screen-shop');

function openShop() {
  renderShop();
  showScreen(GAME_STATE.SHOP);
}

function renderShop() {
  document.getElementById('shop-coins').textContent = saveData.wallet.coins;
  document.getElementById('shop-diamonds').textContent = saveData.wallet.diamonds;
  const container = document.getElementById('shop-items');
  container.innerHTML = '';
  SHOP_ITEMS.forEach(item => {
    const el = document.createElement('div');
    el.className = 'shop-item';
    const owned = isItemOwned(item);
    const currency = item.currency || 'coins';
    const walletAmount = currency === 'diamonds' ? saveData.wallet.diamonds : saveData.wallet.coins;
    const canAfford = walletAmount >= item.cost;
    const currencyIcon = currency === 'diamonds' ? '💎' : '💰';
    if (owned) el.classList.add('sold');
    el.innerHTML =
      '<div class="item-emoji">' + item.emoji + '</div>' +
      '<div class="item-name">' + item.name + '</div>' +
      '<div class="item-desc">' + item.desc + '</div>' +
      '<div class="item-cost">' + (owned ? 'OWNED' : currencyIcon + ' ' + item.cost) + '</div>';
    if (!owned && canAfford) {
      el.addEventListener('click', () => buyItem(item));
    }
    container.appendChild(el);
  });
}

function isItemOwned(item) {
  if (item.id.startsWith('seed_slot_')) {
    return saveData.inventory.seedSlots >= item.effect.seedSlots;
  }
  return false;
}

function buyItem(item) {
  const currency = item.currency || 'coins';
  const wallet = currency === 'diamonds' ? saveData.wallet.diamonds : saveData.wallet.coins;
  if (wallet < item.cost) return;
  if (isItemOwned(item)) return;
  // check prerequisites
  if (item.requires) {
    for (const [key, val] of Object.entries(item.requires)) {
      if (saveData.inventory[key] !== undefined && saveData.inventory[key] < val) {
        spawnFloatingText(canvas.width / 2, canvas.height / 2, 'Requires ' + key + ' >= ' + val, '#ff3333');
        return;
      }
    }
  }
  // check if unlockRandom has anything to unlock
  if (item.effect.unlockRandom) {
    const unlocked = Array.isArray(saveData.inventory.unlockedTowers) ? saveData.inventory.unlockedTowers : [];
    const locked = ALL_TOWER_KEYS.filter(k => !unlocked.includes(k));
    if (locked.length === 0) {
      spawnFloatingText(canvas.width / 2, canvas.height / 2, 'All towers already unlocked!', '#ff3333');
      return;
    }
  }

  // deduct currency
  if (currency === 'diamonds') saveData.wallet.diamonds -= item.cost;
  else saveData.wallet.coins -= item.cost;

  // apply effects
  if (item.effect.seedSlots) {
    saveData.inventory.seedSlots = item.effect.seedSlots;
  }
  if (item.effect.unlockRandom) {
    const locked = ALL_TOWER_KEYS.filter(k => !saveData.inventory.unlockedTowers.includes(k));
    if (locked.length > 0) {
      const pick = locked[Math.floor(Math.random() * locked.length)];
      saveData.inventory.unlockedTowers.push(pick);
    }
  }
  if (item.effect.bonusTokens) {
    saveData.bonusStartingTokens = (saveData.bonusStartingTokens || 0) + item.effect.bonusTokens;
  }

  SaveManager.save(saveData);
  Sound.coinCollect();
  renderShop();
}

document.getElementById('shop-back-btn').addEventListener('click', () => {
  Sound.menuClick();
  goToMenu();
});
