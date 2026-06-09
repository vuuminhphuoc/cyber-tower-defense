# Game Design — Cyber Defenders

Cybersecurity tower defense game. 21 levels across 7 stages.

## Core Mechanics

- **Grid**: 5 rows × 9 columns (6 rows on Data Stream stages)
- **Currency**: Tokens (💰) — earned from producers, killing threats, or completing levels
- **Diamonds**: Premium currency — earned from completing stages
- **Goal**: Stop threats from reaching the left side of the grid
- **Lose**: Threat reaches x ≤ 0 (unless Firewall Reset triggers)

## Tower Placement

- Select a tower card → click a valid cell to place
- Costs tokens (shown on card)
- Cooldown after placing before same tower can be placed again
- Some towers have special placement rules (Proxy Node for Data Stream cells)

## Token Economy

- **Producers**: Bitcoin Miner (12s), Crypto Farm (8s) generate 25 tokens each
- **Threat kills**: Drop coins (silver +10, gold +50, diamond +1000)
- **Level completion**: Earn coins proportional to stage number
- **Starting tokens**: Varies by level (50-200)

## Tower Upgrade System

- Click a placed tower → info panel with upgrade/sell buttons
- Upgrade costs 60% of base tower cost
- Max level: 1 (one upgrade per tower)
- Upgrade bonuses:
  - Shooters: +40% damage, -20% fire rate
  - Producers: -30% token rate (faster production)
  - Defenders: +50% HP
  - VPN: +50% cloak radius
  - Scanner: stronger slow, +30% duration
  - DDoS Bot: +1 extra shot
- Sell refund: 50% of total invested (base + upgrade cost)

## Tower Types (18)

### Economy
| Tower | Cost | HP | Special | Desc |
|-------|------|----|---------|------|
| ⛏️ Bitcoin Miner | 50 | 300 | Produces 25 tokens every 8s | Basic producer |
| 🏦 Crypto Farm | 150 | 300 | Produces 25 tokens every 8s | Fast producer |

### Shooters
| Tower | Cost | HP | DMG | Fire Rate | Special | Desc |
|-------|------|----|-----|-----------|---------|------|
| 🧱 Firewall | 100 | 300 | 25 | 1.5s | — | Basic shooter |
| 🔐 Encryption | 175 | 300 | 20 | 1.5s | Slow 50% for 2s | Slows threats |
| 🤖 DDoS Bot | 200 | 250 | 5 | 0.4s | 2 shots | Rapid fire |
| 🎯 Sniper | 250 | 300 | 120 | 2.0s | — | High damage |

### Special
| Tower | Cost | HP | Special | Desc |
|-------|------|----|---------|------|
| 🍯 Honeypot | 150 | 300 | Eats threat, chews 30s | Instant kill |
| 💥 Data Purge | 150 | 300 | 1200 dmg, 3×3 area | Bomb |
| ⚡ System Wipe | 125 | 300 | Wipes entire row | Row clear |
| ☢️ Nuclear Option | 500 | 300 | 2000 dmg, 5×5 area | Massive bomb |

### Mine (hidden)
| Tower | Cost | HP | DMG | Arm Time | Desc |
|-------|------|----|-----|----------|------|
| 🪤 Tripwire | 50 | 300 | 300 | 15s | Single target |
| 🔮 EMP Mine | 75 | 300 | 300 | 15s | Hits 3 rows + 50% slow |

### Wall
| Tower | Cost | HP | Desc |
|-------|------|----|------|
| 🛡️ Firewall Wall | 50 | 3000 | Blocks threats |
| 🔒 Steel Firewall | 150 | 8000 | Ultra-durable wall |

### Support
| Tower | Cost | HP | Special | Desc |
|-------|------|----|---------|------|
| 🌐 VPN Shield | 100 | 300 | Cloak radius 1.5 tiles | Hides nearby towers |
| 🔧 Patch Bot | 125 | 300 | Heals 10 HP every 0.5s | Tower healer |
| 📡 Scanner | 75 | 300 | Slows row by 30% for 1s | Row slow |

### Pool
| Tower | Cost | HP | Desc |
|-------|------|----|------|
| 🔗 Proxy Node | 25 | 300 | Platform for Data Stream cells |

## Threat Types (14)

| Emoji | Key | Name | HP | Speed | DMG/s | Special |
|-------|-----|------|-----|-------|-------|---------|
| 🦠 | BASIC | Virus | 200 | 0.15 | 100 | — |
| 🦠🐴 | CONEHEAD | Trojan | 560 | 0.15 | 100 | Hat (extra HP) |
| 🦠 | POLE_VAULTING | Worm | 340 | 0.45 | 100 | Fast, vaults over first tower |
| 🦠🔒 | BUCKETHEAD | Ransomware | 1100 | 0.15 | 100 | Heavy hat |
| 🦠 | NEWSPAPER | Phisher | 340 | 0.15 | 100 | Paper shield (150 HP), enrages to 0.6 speed |
| 🦠⌨️ | FOOTBALL | Keylogger | 1600 | 0.5 | 100 | Tank + fast |
| 🕵️ | SPYWARE | Spyware | 300 | 0.2 | 100 | Steals 25 tokens/s while eating |
| 📢 | ADWARE | Adware | 400 | 0.18 | 100 | Slows tower fire rate by 50% |
| 🧊 | CRYPTOLOCKER | CryptoLocker | 500 | 0.15 | 100 | Freezes tower for 3s |
| ⚡ | GLITCH | Glitch | 150 | 0.6 | 50 | Very fast, low HP, swarm |
| 🕸️ | BOTNET | Botnet | 100 | 0.3 | 50 | Spawns in groups of 3 |
| 🎭 | APT | Advanced Persistent Threat | 800 | 0.12 | 150 | Cloaks for 5s, invisible to towers |
| 🐛 | ROOTKIT | Rootkit | 600 | 0.15 | 100 | Hijacks tower for 4s |
| 👾 | BOSS | Zero-Day Exploit | 30000 | 0 | 0 | Summons 2-4 threats, fireball, smash |

## Stages (7)

| # | Name | Emoji | Levels | Grid | Special |
|---|------|-------|--------|------|---------|
| 1 | Firewall | 🧱 | 1-1 to 1-6 | 5×9 | Basic, token spawning |
| 2 | Dark Web | 🕸️ | 2-1 to 2-3 | 5×9 | No token spawning, corrupted blocks |
| 3 | Data Stream | 📡 | 3-1 to 3-3 | 6×9 pool | Water lanes, Proxy Node needed |
| 4 | Encrypted Net | 🔐 | 4-1 to 4-3 | 5×9 | Fog columns hide threats |
| 5 | Root Access | 💀 | 5-10 | 5×9 | Boss level |
| 6 | Cloud Network | ☁️ | 6-1 to 6-2 | 5-6×9 | Harder variants |
| 7 | Air Gap | 🛡️ | 7-1 to 7-2 | 5-6×9 | Ultimate challenge, fog |

## Terrain Types

- **Standard**: Normal grass cells
- **Data Stream** (pool): Rows 2-3, requires Proxy Node to place towers
- **Corrupted Blocks** (graves): Block tower placement, visual obstacle
- **Fog** (encrypted columns): Hide threats from view (semi-transparent overlay)

## Boss: Zero-Day Exploit

- HP: 30,000
- Appears in Stage 5 (level 5-10)
- Attacks:
  - **Summon**: Spawns 2-4 random threats
  - **Fireball**: Destroys all towers in one row
  - **Smash**: Destroys towers in a 2×3 area
- Vulnerable only after attacking (6s window)
- HP bar displayed at top of screen

## Firewall Resets (Lawn Mowers)

- One per row, activates when threat reaches x ≤ 0
- Chases and kills all threats in the row
- One-time use per row

## Controls

- **Mouse click**: Select tower, place tower, collect tokens/coins
- **Touch**: Mobile support for all actions
- **1-9 keys**: Quick-select tower by position
- **Escape**: Deselect tower
- **Space**: Pause/unpause
- **Shovel button** (🗑️): Remove tower for 50% refund
- **Speed button** (⏩): Toggle 2x fast-forward
- **Wave button** (📡): Send next wave early
- **Pause button** (⏸️): Pause game
