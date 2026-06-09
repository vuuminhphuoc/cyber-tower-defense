// =====================================================================
// entities.js — Game entity classes: Token, Coin, Tower, Projectile, Threat
// Depends: config.js (ctx, TOWER_TYPES, THREAT_TYPES, CELL_W/H...), state.js,
//   waves.js (showBanner — runtime), screens.js (triggerGameOver — runtime)
// Provides (global): Token, spawnSkyToken, Coin, dropCoin, Tower, Projectile,
//   Threat, spawnThreatByType
// =====================================================================

// ========== Token ==========
class Token {
  constructor(x, y, targetY) {
    this.x = x;
    this.y = y;
    this.targetY = targetY;
    this.radius = 22;
    this.value = 25;
    this.speed = 1.5;
    this.bornAt = gameTime;
    this.lifespan = 9000;
    this.markedForDeletion = false;
  }
  update() {
    if (this.y < this.targetY) {
      this.y += this.speed;
      if (this.y > this.targetY) this.y = this.targetY;
    }
    if (gameTime - this.bornAt > this.lifespan) this.markedForDeletion = true;
  }
  draw() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff9800';
    ctx.stroke();
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('☀️', this.x, this.y);
    ctx.restore();
  }
  isClicked(px, py) {
    const dx = px - this.x, dy = py - this.y;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }
}

function spawnSkyToken() {
  const col = Math.floor(Math.random() * COLS);
  const x = col * CELL_W + CELL_W / 2;
  const ch = canvas.height / gridRows;
  const targetY = TOP_OFFSET + Math.floor(Math.random() * gridRows) * ch + ch / 2;
  tokens.push(new Token(x, -20, Math.max(targetY, 80)));
}

// ========== Coin ==========
class Coin {
  constructor(x, y, kind) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.value = kind === 'diamond' ? 1000 : kind === 'gold' ? 50 : 10;
    this.emoji = kind === 'diamond' ? '\uD83D\uDC8E' : kind === 'gold' ? '\uD83D\uDCB0' : '\u26AA';
    this.radius = 16;
    this.bornAt = gameTime;
    this.lifespan = 8000;
    this.markedForDeletion = false;
  }
  update() {
    if (gameTime - this.bornAt > this.lifespan) this.markedForDeletion = true;
  }
  draw() {
    ctx.save();
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
  isClicked(px, py) {
    const dx = px - this.x, dy = py - this.y;
    return dx * dx + dy * dy <= (this.radius + 6) * (this.radius + 6);
  }
}

function dropCoin(x, y, isBoss) {
  if (isBoss) {
    // boss always drops gold + diamond
    coins.push(new Coin(x, y, 'gold'));
    coins.push(new Coin(x, y, 'diamond'));
    return;
  }
  const r = Math.random();
  if (r < 0.02) coins.push(new Coin(x, y, 'diamond'));
  else if (r < 0.08) coins.push(new Coin(x, y, 'gold'));
  else if (r < 0.35) coins.push(new Coin(x, y, 'silver'));
}

// ========== Tower ==========
class Tower {
  constructor(col, row, key) {
    this.col = col;
    this.row = row;
    this.x = col * CELL_W;
    this.y = TOP_OFFSET + row * CELL_H;
    this.width = CELL_W;
    this.height = CELL_H;
    this.key = key;
    this.cfg = Object.assign({}, TOWER_TYPES[key]); // shallow copy per instance
    this.type = this.cfg.type;
    this.maxHp = this.cfg.hp;
    this.hp = this.cfg.hp;
    this.lastFired = gameTime;
    this.lastTokenProduced = gameTime;
    this.lastHeal = gameTime;
    this.markedForDeletion = false;
    this._chewing = false;
    this._chewUntil = 0;
    this._armed = false;
    this._armStart = gameTime;
    this._exploded = false;
    this._multiShotCount = 0;
    this._multiShotTimer = 0;
    this._cloaked = false;
    this._frozenUntil = 0;
    this._baseFireRate = this.cfg.fireRate || 1500;
    this._adwareSlowUntil = 0;
    this._attackFlash = 0;
    this._placeTime = gameTime; // for placement animation
    this.upgradeLevel = 0;
    this._totalInvested = this.cfg.cost;
    this._lastOverheat = gameTime;
    // apply terrain bonuses from the cell this tower sits on
    const cell = grid[row] && grid[row][col];
    this._terrain = cell ? cell.cellType : 'grass';
    if (this._terrain === 'server_rack') {
      // -15% cooldown => faster fire/production
      if (this.cfg.fireRate) { this.cfg.fireRate = Math.floor(this.cfg.fireRate * 0.85); this._baseFireRate = this.cfg.fireRate; }
      if (this.cfg.tokenRate) this.cfg.tokenRate = Math.floor(this.cfg.tokenRate * 0.85);
    }
  }

  centerX() { return this.x + this.width / 2; }
  centerY() { return this.y + this.height / 2; }

  upgrade() {
    if (this.upgradeLevel >= 1) return false;
    const cost = this.cfg.upgradeCost;
    if (credits < cost) return false;
    credits -= cost;
    this.upgradeLevel = 1;
    this._totalInvested += cost;
    if (this.cfg.damage) this.cfg.damage = Math.floor(this.cfg.damage * 1.4);
    if (this.cfg.fireRate) {
      this.cfg.fireRate = Math.floor(this.cfg.fireRate * 0.8);
      this._baseFireRate = this.cfg.fireRate;
    }
    if (this.cfg.hp) {
      this.cfg.hp = Math.floor(this.cfg.hp * 1.5);
      this.maxHp = this.cfg.hp;
      this.hp = this.cfg.hp;
    }
    if (this.cfg.healAmount) this.cfg.healAmount = Math.floor(this.cfg.healAmount * 1.3);
    if (this.cfg.tokenRate) this.cfg.tokenRate = Math.floor(this.cfg.tokenRate * 0.7);
    if (this.cfg.chewTime) this.cfg.chewTime = Math.floor(this.cfg.chewTime * 0.7);
    // utility stat upgrades
    if (this.cfg.cloakRadius) this.cfg.cloakRadius = +(this.cfg.cloakRadius * 1.5).toFixed(1); // VPN: +50% radius
    if (this.cfg.slow && this.type === 'scanner') this.cfg.slow = +(this.cfg.slow * 0.8).toFixed(2); // Scanner: stronger slow
    if (this.cfg.slowDuration && this.type === 'scanner') this.cfg.slowDuration = Math.floor(this.cfg.slowDuration * 1.3); // Scanner: longer slow
    if (this.cfg.multiShot) this.cfg.multiShot = this.cfg.multiShot + 1; // DDoS: +1 shot
    Sound.towerPlace();
    spawnFloatingText(this.centerX(), this.y - 10, 'UPGRADED!', '#ffd700');
    return true;
  }

  getSellValue() {
    return Math.floor(this._totalInvested * 0.5);
  }

  _applyTerrainToProjectile(proj) {
    // uplink: tower fires faster projectiles (+20%)
    if (this._terrain === 'uplink') proj.speed *= 1.2;
    // signal delay lane: any cell in this row of type signal_delay slows projectiles -30%
    if (grid[this.row] && grid[this.row].some(c => c.cellType === 'signal_delay')) {
      proj.speed *= 0.7;
    }
  }

  update(now) {
    if (this._frozenUntil > now) return; // frozen by CryptoLocker

    // overheated terrain: lose HP over time unless a Patch Bot is in range
    if (this._terrain === 'overheated' && now - this._lastOverheat >= 1000) {
      this._lastOverheat = now;
      const cooled = towers.some(p =>
        p !== this && !p.markedForDeletion && p.type === 'healer' &&
        p.row === this.row && Math.abs(p.x - this.x) < 2 * CELL_W);
      if (!cooled) {
        this.hp -= 2;
        if (this.hp <= 0) { this.markedForDeletion = true; spawnParticles(this.centerX(), this.centerY(), 8, '#f73'); }
      }
    }

    if (this.type === 'producer') {
      if (now - this.lastTokenProduced >= this.cfg.tokenRate) {
        this.lastTokenProduced = now;
        const s = new Token(this.centerX(), this.centerY() - 40, this.centerY());
        tokens.push(s);
      }
    } else if (this.type === 'shooter' || this.type === 'multishooter') {
      const hasTarget = threats.some(z =>
        !z.markedForDeletion && z.x + z.width > this.x &&
        (z.row === this.row || z.type === 'BOSS') &&
        (!z._cloaked) // skip cloaked APT threats
      );
      // adware slow: double the fire interval
      const adwareSlowed = now < this._adwareSlowUntil;
      const effectiveFireRate = adwareSlowed ? this.cfg.fireRate * 2 : this.cfg.fireRate;
      if (this.type === 'multishooter') {
        // DDoS Bot: fire multiShot shots in quick succession
        if (this._multiShotCount > 0 && now >= this._multiShotTimer) {
          const proj = new Projectile(this.centerX() + 20, this.centerY() - 8, this.cfg.damage, this.row);
          this._applyTerrainToProjectile(proj);
          projectiles.push(proj);
          Sound.shoot();
          this._multiShotCount--;
          this._multiShotTimer = now + 120;
        }
        if (hasTarget && this._multiShotCount === 0 && now - this.lastFired >= effectiveFireRate) {
          this.lastFired = now;
          this._attackFlash = now;
          this._multiShotCount = this.cfg.multiShot || 2;
          this._multiShotTimer = now;
        }
      } else if (hasTarget && now - this.lastFired >= effectiveFireRate) {
        this.lastFired = now;
        this._attackFlash = now;
        const proj = new Projectile(this.centerX() + 20, this.centerY() - 8, this.cfg.damage, this.row);
        if (this.cfg.slow) { proj.slow = this.cfg.slow; proj.slowDuration = this.cfg.slowDuration; }
        this._applyTerrainToProjectile(proj);
        projectiles.push(proj);
        Sound.shoot();
      }
    } else if (this.type === 'chomper') {
      if (this._chewing) {
        if (now >= this._chewUntil) this._chewing = false;
      } else {
        const prey = threats.find(z =>
          !z.markedForDeletion &&
          z.x + z.width > this.x && z.x < this.x + this.width + 40 &&
          (z.row === this.row || z.type === 'BOSS') &&
          (!z._cloaked) // skip cloaked APT
        );
        if (prey) {
          prey.markedForDeletion = true;
          score += 10;
          this._chewing = true;
          this._chewUntil = now + this.cfg.chewTime;
          spawnParticles(this.centerX(), this.centerY(), 8, '#ffaa00');
          spawnFloatingText(this.centerX(), this.y - 10, 'DIGESTING', '#ffaa00');
        }
      }
    } else if (this.type === 'bomb') {
      if (!this._exploded) {
        this._exploded = true;
        const cx = this.centerX(), cy = this.centerY();
        const r = (this.cfg.radius || 1.5) * CELL_W;
        spawnParticles(cx, cy, 20, '#ff6600');
        threats.forEach(z => {
          if (!z.markedForDeletion && Math.abs(z.centerX() - cx) < r && Math.abs(z.centerY() - cy) < r) {
            if (z.type === 'BOSS') { z.takeDamage(this.cfg.damage || 1800); }
            else {
              z.takeDamage(this.cfg.damage || 1800);
              if (z.hp <= 0) { z.markedForDeletion = true; score += 10; spawnParticles(z.centerX(), z.centerY(), 6, '#ff3333'); }
            }
          }
        });
        Sound.threatDie();
        this.markedForDeletion = true;
      }
    } else if (this.type === 'jalapeno') {
      if (!this._exploded) {
        this._exploded = true;
        spawnParticles(this.centerX(), this.centerY(), 15, '#ff0000');
        threats.forEach(z => {
          if (!z.markedForDeletion && z.row === this.row && z.type !== 'BOSS') {
            z.hp = 0; z.markedForDeletion = true; score += 10;
            spawnParticles(z.centerX(), z.centerY(), 6, '#ff3333');
          }
        });
        Sound.threatDie();
        this.markedForDeletion = true;
      }
    } else if (this.type === 'mine') {
      if (!this._armed) {
        if (now - this._armStart >= this.cfg.armTime) {
          this._armed = true;
          Sound.mineArm();
          spawnFloatingText(this.x + this.width / 2, this.y - 10, 'ARMED', '#00ff41');
        }
      } else {
        const mineDmg = this.cfg.damage || 1800;
        if (this.key === 'EMP_MINE') {
          // EMP: explode in 3 rows
          const exploded = threats.filter(z =>
            !z.markedForDeletion && Math.abs(z.row - this.row) <= 1 &&
            z.x + z.width > this.x - CELL_W && z.x < this.x + this.width + CELL_W
          );
          if (exploded.length > 0) {
            exploded.forEach(z => {
              if (z.type === 'BOSS') { z.takeDamage(mineDmg); }
              else { z.takeDamage(mineDmg); if (z.hp <= 0) { z.markedForDeletion = true; score += 10; } }
              // apply slow 50%
              z._slowUntil = gameTime + 2000;
              z._slowFactor = 0.5;
            });
            Sound.empExplosion();
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, 15, '#9933ff');
            spawnFloatingText(this.x + this.width / 2, this.y - 10, 'EMP!', '#9933ff');
            this.markedForDeletion = true;
          }
        } else {
          const step = threats.find(z =>
            !z.markedForDeletion &&
            z.x + z.width > this.x && z.x < this.x + this.width &&
            (z.row === this.row || z.type === 'BOSS') &&
            (!z._cloaked) // skip cloaked APT
          );
          if (step) {
            if (step.type === 'BOSS') { step.takeDamage(mineDmg); }
            else { step.takeDamage(mineDmg); if (step.hp <= 0) { step.markedForDeletion = true; score += 10; } }
            Sound.threatDie();
            spawnParticles(this.x + this.width / 2, this.y + this.height / 2, 12, '#ff6600');
            spawnFloatingText(step.centerX(), step.y - 10, '-' + mineDmg, '#ff6600');
            this.markedForDeletion = true;
          }
        }
      }
    } else if (this.type === 'vpn') {
      // VPN Shield: reset cloak first, then re-apply
      towers.forEach(p => {
        if (p !== this && !p.markedForDeletion && p.row === this.row) {
          p._cloaked = false;
        }
      });
      towers.forEach(p => {
        if (p !== this && !p.markedForDeletion && p.row === this.row) {
          const dist = Math.abs(p.x - this.x);
          if (dist < (this.cfg.cloakRadius || 1.5) * CELL_W) {
            p._cloaked = true;
          }
        }
      });
    } else if (this.type === 'healer') {
      // Patch Bot: heal nearby towers
      if (now - this.lastHeal >= (this.cfg.healRate || 500)) {
        this.lastHeal = now;
        let best = null;
        towers.forEach(p => {
          if (p !== this && !p.markedForDeletion && p.hp < p.maxHp && p.row === this.row) {
            const dist = Math.abs(p.x - this.x);
            if (dist < 2 * CELL_W && (!best || p.hp < best.hp)) best = p;
          }
        });
        if (best) {
          best.hp = Math.min(best.maxHp, best.hp + (this.cfg.healAmount || 10));
          spawnFloatingText(best.centerX(), best.y - 10, '+' + (this.cfg.healAmount || 10), '#00ff41');
          Sound.heal();
        }
      }
    } else if (this.type === 'scanner') {
      // Scanner: slow all threats in row with cooldown
      const slowDur = this.cfg.slowDuration || 1000;
      if (!this._lastScanTime) this._lastScanTime = 0;
      if (now - this._lastScanTime >= slowDur) {
        threats.forEach(z => {
          if (!z.markedForDeletion && (z.row === this.row || z.type === 'BOSS')) {
            z._slowUntil = now + slowDur;
            z._slowFactor = this.cfg.slow || 0.7;
          }
        });
        this._lastScanTime = now;
      }
    }
  }

  draw() {
    ctx.save();
    ctx.font = '54px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // placement scale animation
    const age = gameTime - this._placeTime;
    const scale = age < 300 ? 0.5 + 0.5 * (age / 300) : 1;
    if (scale !== 1) {
      ctx.translate(this.centerX(), this.centerY() + 4);
      ctx.scale(scale, scale);
      ctx.translate(-this.centerX(), -(this.centerY() + 4));
    }
    if (this.type === 'mine' && !this._armed) ctx.globalAlpha = 0.35;
    if (this.type === 'chomper' && this._chewing) ctx.globalAlpha = 0.6;
    if (this._cloaked) ctx.globalAlpha = 0.4;
    if (this._frozenUntil > gameTime) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#7ec8e3'; }
    // attack flash effect
    if (this._attackFlash && gameTime - this._attackFlash < 120) {
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 20;
    }
    ctx.fillText(this.cfg.emoji, this.centerX(), this.centerY() + 4);
    ctx.restore();
    // upgrade glow ring
    if (this.upgradeLevel >= 1) {
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.4 + 0.2 * Math.sin(gameTime / 300);
      ctx.beginPath();
      ctx.arc(this.centerX(), this.centerY(), this.width / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      // upgrade star badge
      ctx.save();
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', this.x + this.width - 12, this.y + 12);
      ctx.restore();
    }
    this.drawHpBar();
  }

  drawHpBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    const bw = this.width - 24;
    const bx = this.x + 12;
    const by = this.y + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(bx, by, bw, 6);
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(bx, by, bw * ratio, 6);
  }
}

// ========== Projectile ==========
class Projectile {
  constructor(x, y, damage, row) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.speed = 6;
    this.damage = damage;
    this.row = row;
    this.markedForDeletion = false;
    this.slow = 0;
    this.slowDuration = 0;
  }
  update() {
    const dt = deltaTime / 16.67;
    this.x += this.speed * dt;
    if (this.x > canvas.width) this.markedForDeletion = true;
  }
  draw() {
    // trail glow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y, this.width / 2 + 2, 0, Math.PI * 2);
    ctx.fillStyle = this.slow ? '#7ec8e3' : '#a4e44a';
    ctx.fill();
    ctx.restore();
    // main projectile
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.slow ? '#7ec8e3' : '#a4e44a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.slow ? '#4a90b5' : '#5a9216';
    ctx.stroke();
  }
}

// ========== Threat ==========
class Threat {
  constructor(row, type) {
    this.row = row;
    this.x = canvas.width;
    this.y = TOP_OFFSET + row * CELL_H;
    this.width = 60;
    this.height = 80;
    this.type = type;
    const cfg = THREAT_TYPES[type] || THREAT_TYPES.BASIC;
    this.cfg = cfg; // store reference for death explosion
    this.maxHp = cfg.hp;
    this.hp = cfg.hp;
    this.speed = cfg.speed;
    this.baseSpeed = cfg.speed;
    this.isEating = false;
    this.damage = cfg.damage;
    this.markedForDeletion = false;
    this.isFlag = false;
    this._eatSoundAt = 0;
    this._slowUntil = 0;
    this._slowFactor = 1;
    this._vaulted = false;
    this._paperHp = cfg.paperHp || 0;
    this._enragedSpeed = cfg.enragedSpeed || this.baseSpeed;
    this._lastStealTime = 0;
    this.bornAt = gameTime;
    // APT cloaking
    this._cloaked = false;
    this._cloakUntil = gameTime + (cfg.cloakTime || 0);
    // Rootkit hijack
    this._hijackedTower = null;
    this._hijackUntil = 0;
    // Botnet swarm
    this._swarmSpawned = false;
  }

  centerX() { return this.x + this.width / 2; }
  centerY() { return this.y + this.height / 2; }

  update() {
    if (this.markedForDeletion) return;
    this.isEating = false;
    const dt = deltaTime / 16.67;
    const now = gameTime;

    // slow effect
    if (now < this._slowUntil) {
      this.speed = this.baseSpeed * this._slowFactor;
    } else {
      this.speed = this.baseSpeed;
    }

    // newspaper rage
    if (this.type === 'NEWSPAPER' && this._paperHp <= 0 && this.speed < this._enragedSpeed) {
      this.speed = this._enragedSpeed;
    }

    // pole vaulting
    if (this.type === 'POLE_VAULTING' && !this._vaulted) {
      const towerAhead = this.findTowerAhead();
      if (towerAhead && this.x - towerAhead.x < 80) {
        this.x = towerAhead.x - this.width - 10;
        this._vaulted = true;
        this.speed = this.baseSpeed * 0.5;
      }
    }

    const target = this.findTowerAhead();
    if (target) {
      this.isEating = true;
      if (now - this._eatSoundAt > 500) { Sound.threatEat(); this._eatSoundAt = now; }
      target.hp -= this.damage * dt / 60;
      // Spyware: steal coins when eating (once per 2s)
      if (this.type === 'SPYWARE' && now - this._lastStealTime > 2000) {
        this._lastStealTime = now;
        const steal = THREAT_TYPES.SPYWARE.stealAmount || 25;
        credits = Math.max(0, credits - steal);
        Sound.spywareSteal();
        spawnFloatingText(target ? target.centerX() : this.x, this.y - 10, '-' + steal, '#ff3333');
      }
      // CryptoLocker: freeze tower (re-freeze after previous freeze expires)
      if (this.type === 'CRYPTOLOCKER' && now >= (target._frozenUntil || 0)) {
        target._frozenUntil = now + (THREAT_TYPES.CRYPTOLOCKER.freezeTime || 3000);
        Sound.cryptolockerFreeze();
      }
      // Adware: slow tower fire rate (set multiplier, applied in fire check)
      if (this.type === 'ADWARE' && target._adwareSlowUntil !== undefined) {
        target._adwareSlowUntil = now + 1000; // refresh every frame while eating
      }
      if (target.hp <= 0) target.markedForDeletion = true;
    } else {
      this.x -= this.speed * dt;
    }

    if (this.x + this.width <= 0) {
      // check lawn mower — keep threat alive, mower will chase and kill it
      const mower = lawnMowers.find(m => m.row === this.row && !m.activated && !m.markedForDeletion);
      if (mower) {
        mower.activate();
      } else {
        triggerGameOver();
      }
    }
    if (this.hp <= 0) {
      this.markedForDeletion = true;
      // boss death is handled by checkBossDefeated() in waves.js
      if (this.type !== 'BOSS') {
        score += 10;
        Sound.threatDie();
        dropCoin(this.centerX(), this.centerY(), false);
        // death explosion — more particles for tougher threats
        const hpRatio = this.cfg.hp / 200;
        const count = Math.min(4 + Math.floor(hpRatio * 2), 16);
        const colors = ['#00ff41', '#39ff14', '#ff3333', '#ff6600'];
        spawnParticles(this.centerX(), this.centerY(), count, colors[Math.floor(Math.random() * colors.length)]);
        // extra flash for special threats
        if (this.cfg.stealAmount || this.cfg.freezeTime || this.cfg.slowFireRate) {
          spawnParticles(this.centerX(), this.centerY(), 6, '#ffff00');
        }
      }
    }

    // APT cloaking: become invisible after 1s, reappear after cloakTime
    if (this.type === 'APT' && !this._cloaked) {
      if (gameTime - this.bornAt > 1000 && gameTime < this._cloakUntil) {
        this._cloaked = true;
      }
    }
    if (this.type === 'APT' && this._cloaked && gameTime >= this._cloakUntil) {
      this._cloaked = false;
    }

    // Rootkit hijacking: freeze tower and deal damage over time
    if (this.type === 'ROOTKIT' && this.isEating && target && !target.markedForDeletion) {
      if (this._hijackedTower !== target) {
        this._hijackedTower = target;
        this._hijackUntil = gameTime + (THREAT_TYPES.ROOTKIT.hijackDuration || 4000);
        // visual effect
        spawnFloatingText(target.centerX(), target.y - 10, 'HIJACKED!', '#ff00ff');
        Sound.cryptolockerFreeze();
      }
      // deal 20 damage per second to hijacked tower while rootkit is alive
      if (!this.markedForDeletion) {
        target.hp -= 20 * dt / 60;
        if (target.hp <= 0) target.markedForDeletion = true;
      }
    }

    // Botnet swarm: queue extra threats when first appearing
    if (this.type === 'BOTNET' && !this._swarmSpawned && this.x < canvas.width - 50) {
      this._swarmSpawned = true;
      const count = (THREAT_TYPES.BOTNET.swarmCount || 3) - 1; // -1 because this one already exists
      for (let i = 0; i < count; i++) {
        queueThreatSpawn('BASIC', this.row);
      }
    }
  }

  takeDamage(amount) {
    // Newspaper: paper absorbs damage first, then body takes remainder
    if (this.type === 'NEWSPAPER' && this._paperHp > 0) {
      if (amount <= this._paperHp) {
        this._paperHp -= amount;
        return; // paper absorbed all damage
      } else {
        amount -= this._paperHp;
        this._paperHp = 0;
      }
    }
    this.hp -= amount;
  }

  findTowerAhead() {
    let best = null;
    for (const p of towers) {
      if (p.markedForDeletion || p.row !== this.row) continue;
      // VPN cloaked towers are invisible to threats
      if (p._cloaked) continue;
      const towerRight = p.x + p.width;
      if (this.x <= towerRight - 30 && this.x + this.width > p.x + 20) {
        if (!best || p.x > best.x) best = p;
      }
    }
    return best;
  }

  draw() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.save();
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (this._slowUntil > gameTime) ctx.globalAlpha = 0.7;
    // walking bob animation
    const bob = this.isEating ? 0 : Math.sin(gameTime / 200 + this.row * 1.5) * 2;
    // draw threat-specific emoji
    const cfg = THREAT_TYPES[this.type];
    ctx.fillText(cfg ? cfg.emoji : '🦠', cx, cy + 6 + bob);
    if (cfg && cfg.hat) {
      ctx.font = '22px serif';
      ctx.fillText(cfg.hat, cx, this.y - 2 + bob);
    }
    if (this.isFlag) {
      ctx.font = '22px serif';
      ctx.fillText('🚩', cx + 22, cy - 14);
    }
    if (this.type === 'POLE_VAULTING' && !this._vaulted) {
      ctx.font = '20px serif';
      ctx.fillText('🏃', cx + 20, cy);
    }
    // spyware indicator
    if (this.type === 'SPYWARE') {
      ctx.font = '16px serif';
      ctx.fillText('💰', cx + 24, cy - 16);
    }
    // APT cloaking effect
    if (this.type === 'APT') {
      if (this._cloaked) {
        ctx.globalAlpha = 0.2; // very transparent when cloaked
        ctx.font = '16px serif';
        ctx.fillText('🎭', cx + 24, cy - 16);
      } else if (gameTime - this.bornAt < 1000) {
        // charging up cloak
        ctx.font = '16px serif';
        ctx.fillText('⏳', cx + 24, cy - 16);
      }
    }
    // Rootkit hijack indicator
    if (this.type === 'ROOTKIT' && this._hijackedTower) {
      ctx.font = '16px serif';
      ctx.fillText('🐛', cx + 24, cy - 16);
    }
    // Botnet swarm indicator
    if (this.type === 'BOTNET') {
      ctx.font = '14px serif';
      ctx.fillText('🕸️', cx + 24, cy - 16);
    }
    ctx.restore();
    this.drawHpBar();
  }

  drawHpBar() {
    const ratio = Math.max(0, this.hp / this.maxHp);
    const bw = this.width;
    const bx = this.x;
    const by = this.y + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(bx, by, bw * ratio, 5);
  }
}

// ========== Zomboss (Final Boss) ==========
class Zomboss {
  constructor() {
    this.row = -1; // occupies all rows
    this.x = canvas.width - 180;
    this.y = 20;
    this.width = 160;
    this.height = canvas.height - 40;
    this.maxHp = THREAT_TYPES.BOSS.hp;
    this.hp = THREAT_TYPES.BOSS.hp;
    this.speed = 0;
    this.damage = 0;
    this.markedForDeletion = false;
    this.isEating = false;
    this.type = 'BOSS';
    // state machine
    this.state = 'IDLE'; // IDLE, SUMMONING, FIREBALL, SMASHING, VULNERABLE
    this.stateTimer = 0;
    this.vulnerable = false;
    this._nextAction = gameTime + 3000; // first action after 3s
    this._fireballRow = -1;
    this._smashTarget = null;
  }

  centerX() { return this.x + this.width / 2; }
  centerY() { return this.y + this.height / 2; }

  update() {
    const now = gameTime;
    const dt = deltaTime / 16.67;

    if (now < this._nextAction) return;

    switch (this.state) {
      case 'IDLE':
        this.vulnerable = false;
        // pick next action
        const r = Math.random();
        if (r < 0.4) { this.state = 'SUMMONING'; this.stateTimer = now + 2000; }
        else if (r < 0.75) { this.state = 'FIREBALL'; this._fireballRow = Math.floor(Math.random() * gridRows); this.stateTimer = now + 1500; }
        else { this.state = 'SMASHING'; this.stateTimer = now + 1500; }
        break;

      case 'SUMMONING':
        this.vulnerable = false;
        if (now >= this.stateTimer) {
          // spawn 2-4 random threats
          const count = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < count; i++) {
            const row = Math.floor(Math.random() * gridRows);
            const types = ['BASIC', 'CONEHEAD', 'BUCKETHEAD', 'FOOTBALL', 'SPYWARE', 'ADWARE', 'CRYPTOLOCKER', 'GLITCH', 'BOTNET', 'APT', 'ROOTKIT'];
            spawnThreatByType(types[Math.floor(Math.random() * types.length)], row);
          }
          spawnFloatingText(canvas.width / 2, 60, 'SUMMONED ' + count + '!', '#ff3333');
          Sound.bossSummon();
          this.vulnerable = true;
          this.state = 'IDLE';
          this._nextAction = now + 6000;
        }
        break;

      case 'FIREBALL':
        this.vulnerable = false;
        if (now >= this.stateTimer) {
          // fireball destroys all towers in one row with big explosion
          const row = this._fireballRow;
          const rowY = TOP_OFFSET + row * CELL_H + CELL_H / 2;
          // screen flash
          spawnParticles(canvas.width / 2, rowY, 30, '#ff4400');
          // destroy towers
          towers.forEach(p => {
            if (p.row === row && !p.markedForDeletion) {
              spawnParticles(p.centerX(), p.centerY(), 8, '#ff4400');
              p.markedForDeletion = true;
            }
          });
          projectiles.forEach(p => {
            if (p.row === row) p.markedForDeletion = true;
          });
          spawnFloatingText(canvas.width / 2, 60, 'FIREBALL!', '#ff4400');
          Sound.bossFireball();
          triggerShake(8, 500);
          this.vulnerable = true;
          this.state = 'IDLE';
          this._nextAction = now + 6000;
        }
        break;

      case 'SMASHING':
        this.vulnerable = false;
        if (now >= this.stateTimer) {
          // smash 2x3 area anywhere on grid
          const smashRow = Math.floor(Math.random() * gridRows);
          const smashCol = Math.floor(Math.random() * (COLS - 2));
          const smashCX = (smashCol + 1.5) * CELL_W;
          const smashCY = TOP_OFFSET + (smashRow + 1) * CELL_H;
          spawnParticles(smashCX, smashCY, 25, '#ff0066');
          for (let r = smashRow; r < Math.min(smashRow + 2, gridRows); r++) {
            for (let c = smashCol; c < Math.min(smashCol + 3, COLS); c++) {
              if (grid[r] && grid[r][c] && grid[r][c].tower) {
                spawnParticles(grid[r][c].tower.centerX(), grid[r][c].tower.centerY(), 8, '#ff0066');
                grid[r][c].tower.markedForDeletion = true;
              }
            }
          }
          spawnFloatingText(canvas.width / 2, 60, 'SMASH!', '#ff0066');
          Sound.bossSmash();
          triggerShake(12, 600);
          this.vulnerable = true;
          this.state = 'IDLE';
          this._nextAction = now + 6000;
        }
        break;
    }
  }

  takeDamage(amount) {
    if (this.vulnerable) {
      this.hp -= amount;
    }
  }

  draw() {
    const cx = this.centerX();
    const cy = this.centerY();
    const now = gameTime;
    ctx.save();
    // attack telegraphs
    if (this.state === 'FIREBALL' && now < this.stateTimer) {
      // red row highlight
      const progress = 1 - (this.stateTimer - now) / 1500;
      ctx.globalAlpha = 0.15 + progress * 0.25;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, TOP_OFFSET + this._fireballRow * CELL_H, canvas.width, CELL_H);
      ctx.globalAlpha = 1;
    }
    if (this.state === 'SMASHING' && now < this.stateTimer) {
      // screen shake effect via canvas offset
      const shake = Math.sin(now / 50) * 3 * (1 - (this.stateTimer - now) / 1500);
      ctx.translate(shake, shake);
    }
    // shield effect when not vulnerable
    if (!this.vulnerable) {
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fillStyle = '#3498db';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // body
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👾', cx, cy);
    // state indicator
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = this.vulnerable ? '#2ecc71' : '#e74c3c';
    const stateLabel = this.vulnerable ? '⚡ VULNERABLE' :
      this.state === 'FIREBALL' ? '🔥 FIREBALL!' :
      this.state === 'SMASHING' ? '💥 SMASHING!' :
      this.state === 'SUMMONING' ? '👾 SUMMONING!' :
      '🛡️ SHIELDED';
    ctx.fillText(stateLabel, cx, this.y + 12);
    ctx.restore();
    // HP bar
    const ratio = Math.max(0, this.hp / this.maxHp);
    const bw = this.width;
    const bx = this.x;
    const by = this.y + this.height - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(bx, by, bw * ratio, 8);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(Math.max(0, Math.ceil(this.hp)) + ' / ' + this.maxHp, cx, by - 4);
  }
}

// ========== New Bosses (Stage 8/9/10) ==========
// They reuse the Zomboss state-machine pattern with tuned HP/behaviour.

// Botnet Commander (Stage 8 mini-boss) — shielded while its botnets are alive.
class BotnetCommander extends Zomboss {
  constructor() {
    super();
    this.name = 'Botnet Commander';
    this.emoji = '🕸️';
    this.maxHp = 3000;
    this.hp = 3000;
    this.width = 140;
    this.x = canvas.width - 160;
    this._lastSummon = gameTime;
    // spawn 3 botnets immediately
    for (let i = 0; i < 3; i++) spawnThreatByType('BOTNET', Math.floor(Math.random() * gridRows));
  }
  _botnetsAlive() {
    return threats.some(z => z !== this && !z.markedForDeletion && (z.type === 'BOTNET' || z.type === 'BASIC'));
  }
  update() {
    const now = gameTime;
    // summon a botnet every 10s
    if (now - this._lastSummon >= 10000) {
      this._lastSummon = now;
      spawnThreatByType('BOTNET', Math.floor(Math.random() * gridRows));
      spawnFloatingText(canvas.width / 2, 60, 'BOTNET SUMMONED!', '#ff3333');
      Sound.bossSummon();
    }
    // shielded (invulnerable) while botnets alive
    this.vulnerable = !this._botnetsAlive();
  }
  draw() {
    const cx = this.centerX(), cy = this.centerY();
    ctx.save();
    if (!this.vulnerable) {
      ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.fillStyle = '#9b59b6'; ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.font = '80px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, cx, cy);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = this.vulnerable ? '#2ecc71' : '#e74c3c';
    ctx.fillText(this.vulnerable ? '⚡ VULNERABLE' : '🛡️ SHIELDED (kill botnets)', cx, this.y + 12);
    ctx.restore();
    this._drawHp(cx);
  }
  _drawHp(cx) {
    const ratio = Math.max(0, this.hp / this.maxHp);
    const bw = this.width, bx = this.x, by = this.y + this.height - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(bx, by, bw * ratio, 8);
    ctx.font = '11px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(Math.max(0, Math.ceil(this.hp)) + ' / ' + this.maxHp, cx, by - 4);
  }
}

// Satellite Hijacker (Stage 9 boss) — disables a random lane + slows projectiles.
class SatelliteHijacker extends Zomboss {
  constructor() {
    super();
    this.name = 'Satellite Hijacker';
    this.emoji = '🛰️';
    this.maxHp = 8000;
    this.hp = 8000;
    this._nextAction = gameTime + 3000;
  }
  update() {
    const now = gameTime;
    if (now < this._nextAction) { this.vulnerable = true; return; }
    switch (this.state) {
      case 'IDLE': {
        const r = Math.random();
        if (r < 0.45) { this.state = 'JAM'; this.stateTimer = now + 1200; this._jamRow = Math.floor(Math.random() * gridRows); }
        else if (r < 0.75) { this.state = 'STORM'; this.stateTimer = now + 1200; }
        else { this.state = 'SUMMON'; this.stateTimer = now + 1200; }
        this.vulnerable = false;
        break;
      }
      case 'JAM':
        if (now >= this.stateTimer) {
          // disable (freeze) all towers in a lane for 5s
          towers.forEach(p => { if (p.row === this._jamRow && !p.markedForDeletion) p._frozenUntil = now + 5000; });
          spawnFloatingText(canvas.width / 2, 60, 'LANE JAMMED!', '#a7f');
          triggerShake(6, 400);
          this.state = 'IDLE'; this._nextAction = now + 6000; this.vulnerable = true;
        }
        break;
      case 'STORM':
        if (now >= this.stateTimer) {
          // signal storm: slow all existing projectiles 50% for 3s (slow new ones via flag)
          projectiles.forEach(p => p.speed *= 0.5);
          spawnFloatingText(canvas.width / 2, 60, 'SIGNAL STORM!', '#a7f');
          this.state = 'IDLE'; this._nextAction = now + 6000; this.vulnerable = true;
        }
        break;
      case 'SUMMON':
        if (now >= this.stateTimer) {
          const count = 2 + Math.floor(Math.random() * 2);
          for (let i = 0; i < count; i++) spawnThreatByType('GLITCH', Math.floor(Math.random() * gridRows));
          spawnFloatingText(canvas.width / 2, 60, 'QUANTUM WORMS!', '#ff3333');
          Sound.bossSummon();
          this.state = 'IDLE'; this._nextAction = now + 6000; this.vulnerable = true;
        }
        break;
    }
  }
}

// Quantum Root (Stage 10 final boss) — teleports, enrages, heavy summons.
class QuantumRoot extends Zomboss {
  constructor() {
    super();
    this.name = 'Quantum Root';
    this.emoji = '⚛️';
    this.maxHp = 15000;
    this.hp = 15000;
    this._enraged = false;
    this._lastTeleport = gameTime;
    this._nextAction = gameTime + 3000;
  }
  update() {
    const now = gameTime;
    // enrage at 30% HP
    if (!this._enraged && this.hp <= this.maxHp * 0.3) {
      this._enraged = true;
      spawnFloatingText(canvas.width / 2, 60, 'QUANTUM ROOT ENRAGED!', '#c5f');
      triggerShake(14, 700);
    }
    // teleport between lanes every 8s (visual reposition)
    if (now - this._lastTeleport >= 8000) {
      this._lastTeleport = now;
      this.y = 20 + Math.floor(Math.random() * 3) * 20;
      spawnParticles(this.centerX(), this.centerY(), 20, '#c5f');
    }
    if (now < this._nextAction) { this.vulnerable = true; return; }
    // summon APT + Rootkit pairs
    const count = this._enraged ? 3 : 2;
    for (let i = 0; i < count; i++) {
      spawnThreatByType('APT', Math.floor(Math.random() * gridRows));
      spawnThreatByType('ROOTKIT', Math.floor(Math.random() * gridRows));
    }
    spawnFloatingText(canvas.width / 2, 60, 'APT + ROOTKIT WAVE!', '#ff3333');
    Sound.bossSummon();
    this._nextAction = now + (this._enraged ? 5000 : 8000);
    this.vulnerable = true;
  }
  draw() {
    const cx = this.centerX(), cy = this.centerY();
    ctx.save();
    if (this._enraged) { ctx.shadowColor = '#c5f'; ctx.shadowBlur = 25; }
    ctx.font = '80px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, cx, cy);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = this._enraged ? '#c5f' : '#2ecc71';
    ctx.fillText(this._enraged ? '🔥 ENRAGED' : '⚛️ QUANTUM CORE', cx, this.y + 12);
    ctx.restore();
    const ratio = Math.max(0, this.hp / this.maxHp);
    const bw = this.width, bx = this.x, by = this.y + this.height - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, bw, 8);
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(bx, by, bw * ratio, 8);
    ctx.font = '11px Arial'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(Math.max(0, Math.ceil(this.hp)) + ' / ' + this.maxHp, cx, by - 4);
  }
}

const BOSS_CLASSES = {
  ZERO_DAY: Zomboss,
  BOTNET_COMMANDER: BotnetCommander,
  SATELLITE_HIJACKER: SatelliteHijacker,
  QUANTUM_ROOT: QuantumRoot
};

function spawnThreatByType(type, row) {
  const z = new Threat(row, type);
  threats.push(z);
  return z;
}

// ========== LawnMower ==========
class LawnMower {
  constructor(row) {
    this.row = row;
    this.cellX = 0;
    this.x = 0;
    this.y = TOP_OFFSET + row * CELL_H;
    this.width = 40;
    this.height = 30;
    this.activated = false;
    this.markedForDeletion = false;
    this._moveSpeed = 6;
    this._hit = false;
  }

  activate() {
    this.activated = true;
    this.x = this.cellX;
    Sound.lawnMower();
  }

  update() {
    if (!this.activated) return;
    this.x += this._moveSpeed;
    // kill threats in row (including the one at x<=0 that triggered us)
    for (const z of threats) {
      if (z.row === this.row && !z.markedForDeletion &&
          z.x + z.width >= this.x - 10 && z.x <= this.x + this.width) {
        z.hp = 0;
        z.markedForDeletion = true;
        score += 10;
        Sound.threatDie();
      }
    }
    if (this.x > canvas.width + 50) {
      this.markedForDeletion = true;
    }
  }

  draw() {
    if (this.markedForDeletion) return;
    const cx = this.x + this.width / 2;
    const cy = this.y + CELL_H / 2;
    ctx.save();
    // body
    ctx.fillStyle = this.activated ? '#e74c3c' : '#888';
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 14, 0, Math.PI * 2);
    ctx.fill();
    // handle
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx + 6, cy - 14);
    ctx.stroke();
    // blade
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(cx - 8, cy + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
