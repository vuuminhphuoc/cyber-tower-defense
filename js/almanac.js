// =====================================================================
// almanac.js — Threat Database (view tower/threat stats)
// Depends: config.js (TOWER_TYPES, THREAT_TYPES), state.js
// Provides (global): openAlmanac
// Used by: screens.js (menu button)
// =====================================================================

const screenAlmanac = document.getElementById('screen-almanac');
let almanacTab = 'towers';

function openAlmanac() {
  almanacTab = 'towers';
  renderAlmanac();
  showScreen(GAME_STATE.ALMANAC);
}

function renderAlmanac() {
  const content = document.getElementById('almanac-content');
  content.innerHTML = '';
  if (almanacTab === 'towers') {
    ALL_TOWER_KEYS.forEach(key => {
      const cfg = TOWER_TYPES[key];
      const unlocked = saveData.inventory.unlockedTowers.includes(key);
      const card = document.createElement('div');
      card.className = 'almanac-card';
      if (!unlocked) card.style.filter = 'grayscale(1) brightness(0.5)';
      let stats = unlocked
        ? '💰 ' + cfg.cost + ' Coin<br>HP: ' + cfg.hp + '<br>' + cfg.desc
        : 'Locked';
      // add type-specific info
      if (unlocked) {
        if (cfg.damage) stats += '<br>DMG: ' + cfg.damage;
        if (cfg.fireRate) stats += '<br>Fire Rate: ' + (cfg.fireRate / 1000).toFixed(1) + 's';
        if (cfg.multiShot) stats += '<br>Shots: ' + cfg.multiShot;
        if (cfg.slow) stats += '<br>Slow: ' + Math.round(cfg.slow * 100) + '%';
        if (cfg.healAmount) stats += '<br>Heal: +' + cfg.healAmount + ' HP';
        if (cfg.cloakRadius) stats += '<br>Cloak: ' + cfg.cloakRadius + ' tiles';
      }
      card.innerHTML =
        '<div class="alc-emoji">' + (unlocked ? cfg.emoji : '❓') + '</div>' +
        '<div class="alc-name">' + (unlocked ? cfg.name : '???') + '</div>' +
        '<div class="alc-stats">' + stats + '</div>';
      content.appendChild(card);
    });
  } else {
    Object.keys(THREAT_TYPES).forEach(key => {
      const cfg = THREAT_TYPES[key];
      const card = document.createElement('div');
      card.className = 'almanac-card';
      let stats;
      if (key === 'BOSS') {
        stats = 'HP: ' + cfg.hp + '<br><br>' +
          '<b>Attacks:</b><br>' +
          'Summons 2-4 random threats<br>' +
          'Fireball: destroys all towers in a row<br>' +
          'Smash: destroys 2x3 area of towers<br><br>' +
          'Only vulnerable after attacking!';
      } else {
        stats = 'HP: ' + cfg.hp + '<br>' +
          'Speed: ' + cfg.speed.toFixed(2) + '<br>' +
          'DMG: ' + cfg.damage + '/s';
        if (cfg.desc) stats += '<br><br>' + cfg.desc;
        if (cfg.enragedSpeed) stats += '<br>Enrages when paper is destroyed';
        if (cfg.stealAmount) stats += '<br>Steals 💰' + cfg.stealAmount + ' per hit';
        if (cfg.freezeTime) stats += '<br>Freezes tower for ' + (cfg.freezeTime / 1000) + 's';
      }
      card.innerHTML =
        '<div class="alc-emoji">' + cfg.emoji + (cfg.hat || '') + '</div>' +
        '<div class="alc-name">' + cfg.name + '</div>' +
        '<div class="alc-stats">' + stats + '</div>';
      content.appendChild(card);
    });
  }
}

// tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    almanacTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAlmanac();
  });
});

document.getElementById('almanac-back-btn').addEventListener('click', () => {
  Sound.menuClick();
  goToMenu();
});
