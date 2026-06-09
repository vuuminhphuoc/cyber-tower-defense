# Cyber Defenders

A browser-based cybersecurity tower defense game built with Vanilla JS + HTML5 Canvas.

Defend your network against incoming threats — viruses, trojans, worms, ransomware, and more.

**Play it live:** [cyber-tower-defense.netlify.app](https://cyber-tower-defense.netlify.app)

---

## How to Play

1. Open `index.html` in any browser (no server required)
2. Select a level from the map
3. Pick your tower loadout
4. Place towers to defend against incoming threats
5. Earn coins from defeating threats to unlock more towers

## Controls

| Key | Action |
|-----|--------|
| 1-9 | Select tower card |
| Space | Pause/Resume |
| S | Shovel mode |
| Esc | Cancel / Back to menu |
| Left click | Place tower / Collect coins |
| Right click | Cancel placement |

## Towers

| Tower | Cost | Type | Description |
|-------|------|------|-------------|
| Bitcoin Miner | 50 | Producer | Generates 25 coins every 12s |
| Crypto Farm | 150 | Producer | Generates 25 coins every 8s |
| Firewall | 100 | Shooter | 20 dmg, fires every 1.5s |
| Encryption Tower | 175 | Shooter | 20 dmg + 50% slow for 2s |
| DDoS Bot | 200 | Multi-Shooter | Fires 3 x 8 dmg in quick burst |
| Sniper Tower | 250 | Shooter | 80 dmg, fires every 3s |
| Honeypot | 150 | Chomper | Instant-kill, chews 30s |
| Data Purge | 150 | Bomb | 1800 dmg in 3x3 area |
| System Wipe | 125 | Jalapeno | Destroys all threats in a row |
| Nuclear Option | 500 | Bomb | 2000 dmg in 5x5 area |
| Tripwire | 25 | Mine | 500 dmg, arms in 15s |
| EMP Mine | 75 | Mine | 200 dmg across 3 rows, arms in 20s |
| Firewall Wall | 50 | Wall | 4000 HP blocker |
| Steel Firewall | 150 | Wall | 8000 HP blocker |
| VPN Shield | 100 | VPN | Cloaks nearby towers (1.5 tiles) |
| Patch Bot | 125 | Healer | Heals 5 HP every 0.5s |
| Scanner | 75 | Scanner | Slows all threats in row by 30% |
| Proxy Node | 25 | Lily Pad | Base platform for water levels |

## Threats

| Threat | HP | Speed | Ability |
|--------|-----|-------|---------|
| Virus | 200 | 0.15 | Basic threat |
| Trojan | 560 | 0.15 | High HP, has hat |
| Worm | 340 | 0.45 | Fast, vaults over first tower |
| Ransomware | 1100 | 0.15 | Very high HP, has bucket |
| Phisher | 340 | 0.15 | Enrages when paper is destroyed |
| Keylogger | 1600 | 0.50 | Very fast + very high HP |
| Spyware | 300 | 0.20 | Steals 25 coins every 2s while eating |
| Adware | 400 | 0.18 | Delays tower fire rate by 500ms |
| CryptoLocker | 500 | 0.15 | Freezes tower for 3s on contact |
| Glitch | 150 | 0.60 | Very fast, low HP, appears in swarms |
| Zero-Day Exploit | 60000 | 0 | Boss — summons, fireballs, smashes |

## Stages

1. **Firewall** — Levels 1-1 through 1-6 (Day)
2. **Dark Web** — Levels 2-1 through 2-3 (Night)
3. **Data Stream** — Levels 3-1 through 3-3 (Pool)
4. **Encrypted Net** — Levels 4-1 through 4-3 (Fog)
5. **Root Access** — Level 5-10 (Boss)
6. **Cloud Net** — Levels 6-1 through 6-2
7. **Air Gap** — Levels 7-1 through 7-2

## Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 Canvas
- Web Audio API (procedural sound effects + music)
- No frameworks, no dependencies, no build step

## Project Structure

```
├── index.html          # Entry point
├── netlify.toml        # Deploy config
├── css/styles.css      # Dark terminal theme
├── js/
│   ├── config.js       # Constants, tower/threat blueprints, level database
│   ├── save.js         # localStorage save/load
│   ├── state.js        # Global game state
│   ├── grid.js         # Grid system, Cell class
│   ├── audio.js        # Sound effects & music
│   ├── entities.js     # Towers, threats, projectiles, lawn mowers
│   ├── combat.js       # Collision detection
│   ├── waves.js        # Wave spawning system
│   ├── ui.js           # Tower selection, placement
│   ├── screens.js      # Menu, level select, win/loss
│   ├── shop.js         # Tech shop
│   ├── almanac.js      # Tower/threat database viewer
│   └── main.js         # Game loop, rendering
└── docs/               # Design documentation
```

## Deploy

```bash
npx netlify-cli deploy --prod --dir .
```

## Author

**Phước** — [vuuminhphuoc@gmail.com](mailto:vuuminhphuoc@gmail.com)

Fan-made project. Not affiliated with or endorsed by any game publisher.
