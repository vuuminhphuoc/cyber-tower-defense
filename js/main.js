// =====================================================================
// main.js — Game loop, update/render orchestration, bootstrap (LOAD LAST)
// Depends: ALL files above
// Provides (global): update, cleanupEntities, render, drawProgressBar, loop
// Bootstraps: goToMenu() + requestAnimationFrame(loop)
// =====================================================================

// ===== Update =====
function update(now) {
  if (gameOver || gameWon || gamePaused) return;
  frame++;

  // economy: sky token spawn (only daytime, tokenSpawnRate > 0)
  if (currentLevel && currentLevel.tokenSpawnRate > 0 && now - lastSkyToken >= skyTokenInterval) {
    spawnSkyToken();
    lastSkyToken = now;
    const base = currentLevel.tokenSpawnRate;
    skyTokenInterval = base + Math.random() * 2000;
  }

  tokens.forEach(s => s.update());
  coins.forEach(c => c.update());
  towers.forEach(p => p.update(now));
  threats.forEach(z => z.update());
  processDeferredSpawns(); // process any Botnet swarm spawns
  projectiles.forEach(p => p.update());

  // update particles
  const dt2 = deltaTime / 16.67;
  particles.forEach(p => {
    p.x += p.vx * dt2;
    p.y += p.vy * dt2;
    p.vy += 0.1 * dt2;
  });
  particles = particles.filter(p => performance.now() - p.born < p.life);
  floatingTexts = floatingTexts.filter(f => performance.now() - f.born < f.life);

  // update collection animations
  collectAnims.forEach(a => {
    const t = Math.min(1, (performance.now() - a.born) / a.life);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
    a.x = a.x + (a.targetX - a.x) * ease * 0.15;
    a.y = a.y + (a.targetY - a.y) * ease * 0.15;
  });
  collectAnims = collectAnims.filter(a => performance.now() - a.born < a.life);

  handleCollisions();
  updateWaves(now);
  lawnMowers.forEach(m => m.update());
  lawnMowers = lawnMowers.filter(m => !m.markedForDeletion);

  // cleanup marked-for-deletion entities
  cleanupEntities();
  updateCardsUI();
}

function cleanupEntities() {
  // entangled pairs: destroying a tower on one cell destroys the linked one too
  for (const p of towers) {
    if (!p.markedForDeletion) continue;
    const cell = grid[p.row] && grid[p.row][p.col];
    if (cell && cell.cellType === 'entangled' && cell.link) {
      const linked = grid[cell.link.row] && grid[cell.link.row][cell.link.col];
      const lt = linked && (linked.tower || linked.baseTower);
      if (lt && !lt.markedForDeletion) {
        lt.markedForDeletion = true;
        spawnParticles(lt.centerX(), lt.centerY(), 10, '#5fc');
        spawnFloatingText(lt.centerX(), lt.y - 10, 'ENTANGLED!', '#5fc');
      }
    }
  }
  // Cloud Backup: revive destroyed towers within range
  const now = gameTime;
  for (const p of towers) {
    if (!p.markedForDeletion) continue;
    if (p.type === 'lily_pad') continue; // don't revive proxy nodes
    for (const backup of towers) {
      if (backup.markedForDeletion || backup.type !== 'reviver') continue;
      if (backup._reviveCooldownUntil && now < backup._reviveCooldownUntil) continue;
      const dist = Math.abs(backup.x - p.x);
      if (dist < (backup.cfg.reviveRadius || 2) * CELL_W && backup.row === p.row) {
        // revive the tower
        const reviveHpPct = backup.cfg.reviveHp || 0.5;
        p.markedForDeletion = false;
        p.hp = Math.max(1, Math.floor(p.maxHp * reviveHpPct));
        backup._reviveCooldownUntil = now + (backup.cfg.reviveCooldown || 180000);
        spawnParticles(p.centerX(), p.centerY(), 15, '#5cf');
        spawnFloatingText(p.centerX(), p.y - 10, 'REVIVED!', '#5cf');
        Sound.heal();
        break;
      }
    }
  }
  // remove towers from grid before filtering
  for (const p of towers) {
    if (p.markedForDeletion && grid[p.row] && grid[p.row][p.col]) {
      const cell = grid[p.row][p.col];
      if (cell.tower === p) cell.tower = null;
      else if (cell.baseTower === p) cell.baseTower = null;
    }
  }
  towers = towers.filter(p => !p.markedForDeletion);
  threats = threats.filter(z => !z.markedForDeletion);
  projectiles = projectiles.filter(p => !p.markedForDeletion);
  tokens = tokens.filter(s => !s.markedForDeletion);
  coins = coins.filter(c => !c.markedForDeletion);
}

// ===== Render =====
function render() {
  // screen shake
  ctx.save();
  if (shakeDuration > 0 && performance.now() - shakeStart < shakeDuration) {
    const elapsed = performance.now() - shakeStart;
    const decay = 1 - elapsed / shakeDuration;
    const sx = (Math.random() - 0.5) * shakeIntensity * decay * 2;
    const sy = (Math.random() - 0.5) * shakeIntensity * decay * 2;
    ctx.translate(sx, sy);
  }
  ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);
  drawLawn();
  lawnMowers.forEach(m => m.draw());
  towers.forEach(p => p.draw());
  // frozen tower overlay
  towers.forEach(p => {
    if (p._frozenUntil > gameTime) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = COLORS.frozenTint;
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.restore();
    }
  });
  // scanner pulse (single-row only)
  towers.forEach(p => {
    if (p.type === 'scanner' && !p.markedForDeletion) {
      const pulse = Math.sin(gameTime / 300) * 0.15 + 0.15;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.fillStyle = COLORS.scannerPulse;
      ctx.fillRect(p.x, TOP_OFFSET + p.row * CELL_H, p.width, CELL_H);
      ctx.restore();
    }
  });
  // VPN cloak aura (centered on VPN, cloakRadius wide, same-row only)
  towers.forEach(p => {
    if (p.type === 'vpn' && !p.markedForDeletion) {
      const r = (p.cfg.cloakRadius || 1.5) * CELL_W;
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = COLORS.green400;
      // draw centered rectangle matching actual cloak range
      ctx.fillRect(p.x + p.width / 2 - r, TOP_OFFSET + p.row * CELL_H, r * 2, CELL_H);
      ctx.restore();
    }
  });
  // Hover cell highlight + range preview
  if (hoverRow >= 0 && hoverCol >= 0 && hoverRow < gridRows && hoverCol < COLS) {
    const hx = hoverCol * CELL_W;
    const hy = TOP_OFFSET + hoverRow * CELL_H;
    ctx.save();
    // cell highlight
    const canPlace = selectedTowerKey && grid[hoverRow] && grid[hoverRow][hoverCol] &&
      !grid[hoverRow][hoverCol].tower && grid[hoverRow][hoverCol].cellType !== 'grave';
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = canPlace ? COLORS.green400 : COLORS.red500;
    ctx.fillRect(hx, hy, CELL_W, CELL_H);
    // range indicator for selected tower
    if (selectedTowerKey && canPlace) {
      const cfg = TOWER_TYPES[selectedTowerKey];
      if (cfg && (cfg.type === 'shooter' || cfg.type === 'multishooter')) {
        // shooters target entire row to the right
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.cyan500;
        ctx.fillRect(hx + CELL_W, hy, canvas.width - hx - CELL_W, CELL_H);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.cyan500;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx + CELL_W, hy, canvas.width - hx - CELL_W, CELL_H);
      } else if (cfg && cfg.type === 'scanner') {
        // scanner: highlight entire row
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.cyan500;
        ctx.fillRect(0, hy, canvas.width, CELL_H);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.cyan500;
        ctx.lineWidth = 1;
        ctx.strokeRect(0, hy, canvas.width, CELL_H);
      } else if (cfg && cfg.type === 'bomb') {
        // bomb: show explosion radius
        const r = (cfg.radius || 1.5) * CELL_W;
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.bombRadius;
        ctx.beginPath();
        ctx.arc(hx + CELL_W / 2, hy + CELL_H / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.bombRadius;
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (cfg && cfg.type === 'mine') {
        // mine: show trigger zone
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.bombRadius;
        ctx.fillRect(hx, hy, CELL_W, CELL_H);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.bombRadius;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx, hy, CELL_W, CELL_H);
      } else if (cfg && cfg.type === 'vpn') {
        // VPN: show cloak radius
        const r = (cfg.cloakRadius || 1.5) * CELL_W;
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.green400;
        ctx.fillRect(hx + CELL_W / 2 - r, hy, r * 2, CELL_H);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.green400;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx + CELL_W / 2 - r, hy, r * 2, CELL_H);
      } else if (cfg && cfg.type === 'healer') {
        // healer: show heal range (2 tiles)
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.green400;
        ctx.fillRect(hx - CELL_W, hy - CELL_H, CELL_W * 5, CELL_H * 3);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.green400;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx - CELL_W, hy - CELL_H, CELL_W * 5, CELL_H * 3);
      } else if (cfg && cfg.type === 'chomper') {
        // chomper: show eat range
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.amber500;
        ctx.fillRect(hx, hy, CELL_W + 40, CELL_H);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = COLORS.amber500;
        ctx.lineWidth = 1;
        ctx.strokeRect(hx, hy, CELL_W + 40, CELL_H);
      }
    }
    // show range for hovered placed tower (no tower selected)
    if (!selectedTowerKey && grid[hoverRow] && grid[hoverRow][hoverCol]) {
      const hovTower = grid[hoverRow][hoverCol].tower || grid[hoverRow][hoverCol].baseTower;
      if (hovTower && !hovTower.markedForDeletion) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = COLORS.cyan500;
        if (hovTower.type === 'scanner') {
          ctx.fillRect(0, TOP_OFFSET + hoverRow * CELL_H, canvas.width, CELL_H);
        } else if (hovTower.cfg.cloakRadius) {
          const cr = hovTower.cfg.cloakRadius * CELL_W;
          ctx.beginPath();
          ctx.arc(hovTower.centerX(), hovTower.centerY(), cr, 0, Math.PI * 2);
          ctx.fill();
        } else if (hovTower.type === 'healer') {
          ctx.fillRect(hovTower.x - CELL_W, hovTower.y - CELL_H, CELL_W * 5, CELL_H * 3);
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }
  projectiles.forEach(p => p.draw());
  threats.forEach(z => z.draw());
  tokens.forEach(s => s.draw());
  coins.forEach(c => c.draw());
  // draw particles
  particles.forEach(p => {
    const age = Math.min(1, (performance.now() - p.born) / p.life);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.1, p.size * (1 - age * 0.5)), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  // draw floating texts
  floatingTexts.forEach(f => {
    const age = (performance.now() - f.born) / f.life;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.shadowColor = f.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - age * 30);
    ctx.restore();
  });
  // draw collection animations (coins/tokens flying to counter)
  collectAnims.forEach(a => {
    const age = (performance.now() - a.born) / a.life;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.emoji, a.x, a.y);
    ctx.restore();
  });
  // fog overlay (pulsing)
  if (currentLevel && currentLevel.fogColumns) {
    ctx.save();
    // first draw tower silhouettes in fogged columns
    towers.forEach(p => {
      if (!p.markedForDeletion && currentLevel.fogColumns.includes(p.col)) {
        ctx.globalAlpha = 0.35;
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.textPrimary;
        ctx.fillText(p.cfg.emoji, p.centerX(), p.centerY() + 4);
        // draw HP bar silhouette
        const bw = p.width - 24;
        const bx = p.x + 12;
        const by = p.y + 8;
        ctx.fillStyle = COLORS.hpBarGreen;
        ctx.fillRect(bx, by, bw, 6);
      }
    });
    // then draw fog with pulsing alpha
    const fogPulse = 0.45 + 0.1 * Math.sin(gameTime / 2000);
    ctx.globalAlpha = fogPulse;
    ctx.fillStyle = COLORS.fogPulse;
    currentLevel.fogColumns.forEach(col => {
      ctx.fillRect(col * CELL_W, 0, CELL_W, canvas.height);
    });
    ctx.restore();
  }
  drawProgressBar();
  drawBossHpBar();
  if (typeof updateWavePreview === 'function') updateWavePreview();

  // banner wave
  if (gameTime < bannerUntil && bannerText) {
    ctx.save();
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COLORS.banner;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 3;
    ctx.strokeText(bannerText, canvas.width / 2, canvas.height / 2);
    ctx.fillText(bannerText, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  // score
  ctx.save();
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'right';
  ctx.fillText('Score: ' + score, canvas.width - 12, 22);
  ctx.restore();

  // status bar
  let waveLabel;
  if (gameMode === 'endless') {
    waveLabel = 'Wave: ∞ ' + (endlessWave + 1);
  } else {
    waveLabel = waveStarted ? ('Wave ' + (currentWave + 1) + '/' + WAVES.length) : 'Initializing...';
  }
  let statusExtra = '';
  if (gameMode === 'speedrun' && speedrunStart > 0) {
    statusExtra = ' | Time: ' + formatTime(Math.floor((performance.now() - speedrunStart) / 1000));
  } else if (gameMode === 'boss_rush') {
    statusExtra = ' | Boss ' + (bossRushIndex + 1) + '/4';
  } else if (gameMode === 'endless') {
    statusExtra = ' | Best: ' + endlessBest;
  }
  statusBar.textContent = (currentLevel ? currentLevel.name + ' • ' : '') + waveLabel +
    ' • Threats: ' + threats.length + ' • Coins: ' + credits + statusExtra;

  drawPauseOverlay();
  ctx.restore(); // screen shake restore
}

// progress bar + flags
function drawProgressBar() {
  if (WAVES.length === 0) return;
  const bw = 260, bh = 14, bx = canvas.width / 2 - bw / 2, by = canvas.height - 24;
  ctx.save();
  ctx.fillStyle = COLORS.overlayLight;
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = COLORS.progressBg;
  ctx.fillRect(bx, by, bw, bh);
  // progress (wave + intra-wave smooth)
  let prog = 0;
  if (waveStarted) {
    const waveProg = WAVES.length > 1 ? currentWave / (WAVES.length - 1) : 1;
    const intraWave = waveActive && threatsToSpawn > 0
      ? (threatsSpawnedThisWave / threatsToSpawn) * (1 / WAVES.length)
      : 0;
    prog = Math.min(waveProg + intraWave, 1);
  }
  ctx.fillStyle = COLORS.progressFill;
  ctx.fillRect(bx, by, bw * prog, bh);
  // flag markers at huge waves
  WAVES.forEach((w, i) => {
    if (w.huge) {
      const fx = bx + bw * (i / Math.max(1, WAVES.length - 1));
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.fillText('\uD83D\uDEA9', fx, by - 6);
    }
  });
  // threat count at end
  ctx.font = '18px serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.textPrimary;
  ctx.fillText('\uD83E\uDDA0', bx + bw + 14, by + bh / 2 + 2);
  // wave countdown timer (show between waves)
  if (waveStarted && !waveActive && currentWave + 1 < WAVES.length) {
    const nextWaveDelay = WAVES[currentWave + 1].delay || 0;
    const timeSinceLastWave = gameTime - lastWaveEndTime;
    const remaining = Math.max(0, Math.ceil((nextWaveDelay - timeSinceLastWave) / 1000));
    if (remaining > 0 && nextWaveDelay > 0) {
      ctx.font = 'bold 14px Courier New';
      ctx.fillStyle = COLORS.cyan500;
      ctx.textAlign = 'center';
      ctx.fillText('Next wave in ' + remaining + 's', canvas.width / 2, by - 14);
    }
  }
  ctx.restore();
}

function drawBossHpBar() {
  if (!currentLevel || !currentLevel.bossLevel || !bossZomboss || bossZomboss.markedForDeletion) return;
  const bw = 400, bh = 18, bx = canvas.width / 2 - bw / 2, by = 6;
  const ratio = Math.max(0, bossZomboss.hp / bossZomboss.maxHp);
  ctx.save();
  ctx.fillStyle = COLORS.hpBarFrame;
  ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = COLORS.hpBarBg;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = ratio > 0.5 ? COLORS.bossHpHigh : ratio > 0.25 ? COLORS.bossHpMid : COLORS.bossHpLow;
  ctx.fillRect(bx, by, bw * ratio, bh);
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = COLORS.textWhite;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((bossZomboss.name || 'Zero-Day Exploit') + ' — ' + Math.max(0, Math.ceil(bossZomboss.hp)) + ' HP', canvas.width / 2, by + bh / 2);
  ctx.restore();
}

function drawPauseOverlay() {
  if (!gamePaused) return;
  ctx.save();
  ctx.fillStyle = COLORS.overlayMedium;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 56px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.textWhite;
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = COLORS.textGray;
  ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 10);
  // Quit button
  ctx.fillStyle = COLORS.pauseBtn;
  ctx.fillRect(canvas.width / 2 - 80, canvas.height / 2 + 40, 160, 40);
  ctx.fillStyle = COLORS.textWhite;
  ctx.font = 'bold 16px Arial';
  ctx.fillText('QUIT TO MENU', canvas.width / 2, canvas.height / 2 + 64);
  ctx.restore();
}

// Quit button in pause overlay
canvas.addEventListener('click', (e) => {
  if (!gamePaused) return;
  e.stopImmediatePropagation();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  // quit button bounds
  const bx = canvas.width / 2 - 80, by = canvas.height / 2 + 40;
  if (px >= bx && px <= bx + 160 && py >= by && py <= by + 40) {
    gamePaused = false;
    Sound.bgmStop();
    goToMenu();
  }
}, true); // capture phase to run before ui.js handler

// ===== Game Loop =====
function loop(timestamp) {
  if (lastTime > 0) {
    deltaTime = Math.min(timestamp - lastTime, 50); // cap max 50ms
    deltaTime *= gameSpeed; // apply speed multiplier
    gameTime += deltaTime; // advance game clock
  }
  lastTime = timestamp;
  if (gameState === GAME_STATE.PLAYING) {
    update(gameTime);
    render();
  }
  requestAnimationFrame(loop);
}

// ===== Bootstrap =====
LoadingScreen.show();
let loadProgress = 0;
const loadInterval = setInterval(() => {
  loadProgress += 0.15;
  LoadingScreen.update(loadProgress);
  if (loadProgress >= 1) {
    clearInterval(loadInterval);
    LoadingScreen.hide();
    goToMenu();
    // start tutorial on first visit
    setTimeout(() => { Tutorial.start(); }, 800);
  }
}, 100);
requestAnimationFrame(loop);

// ===== Bug Report =====
(function initBugReport() {
  const modal = document.getElementById('bug-modal');
  const btn = document.getElementById('bug-report-btn');
  const submitBtn = document.getElementById('bug-submit');
  const cancelBtn = document.getElementById('bug-cancel');
  const titleInput = document.getElementById('bug-title');
  const descInput = document.getElementById('bug-desc');

  if (!btn || !modal) return;

  btn.addEventListener('click', () => {
    modal.style.display = 'flex';
    titleInput.value = '';
    descInput.value = '';
    titleInput.focus();
  });

  cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  submitBtn.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const desc = descInput.value.trim();
    if (!title) { titleInput.focus(); return; }

    // gather game state
    const state = [];
    state.push('**Game State**');
    state.push('- Level: ' + (currentLevelId || 'N/A'));
    state.push('- Level Name: ' + (currentLevel ? currentLevel.name : 'N/A'));
    state.push('- Wave: ' + (waveStarted ? (currentWave + 1) + '/' + WAVES.length : 'Not started'));
    state.push('- Score: ' + score);
    state.push('- Credits: ' + credits);
    state.push('- Towers placed: ' + towers.length);
    state.push('- Threats alive: ' + threats.length);
    state.push('- Game Speed: ' + gameSpeed + 'x');
    state.push('- Game Over: ' + gameOver);
    state.push('- Game Won: ' + gameWon);
    state.push('');
    state.push('**User Description**');
    state.push(desc || '(none)');

    const body = state.join('\n');
    const url = 'https://github.com/vuuminhphuoc/cyber-tower-defense/issues/new'
      + '?title=' + encodeURIComponent('[Bug] ' + title)
      + '&body=' + encodeURIComponent(body)
      + '&labels=' + encodeURIComponent('bug');

    window.open(url, '_blank');
    modal.style.display = 'none';
  });
})();
