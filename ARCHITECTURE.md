# Architecture — Cyber Defenders

## Overview

- Vanilla JS + Canvas, no ES modules, no frameworks
- 13 JS files loaded via `<script>` tags in dependency order
- All globals share single scope (file:// compatible)
- Save/load via localStorage

## File Structure

```
├── index.html          # Shell with 5 screens + game UI
├── css/styles.css      # Dark terminal theme, neon green
├── netlify.toml        # Deploy config
├── js/
│   ├── config.js       # [1] Constants, TOWER_TYPES, THREAT_TYPES, LEVEL_DATABASE
│   ├── save.js         # [2] SaveManager + saveData (localStorage)
│   ├── state.js        # [3] Global state: credits, towers[], threats[], tokens[]
│   ├── grid.js         # [4] Cell class, grid init, coordinate conversion
│   ├── audio.js        # [5] Web Audio API — Sound object (20+ effects + BGM)
│   ├── entities.js     # [6] Token, Coin, Tower, Projectile, Threat, LawnMower
│   ├── combat.js       # [7] AABB collision detection
│   ├── waves.js        # [8] Wave spawning, threat types, boss logic
│   ├── ui.js           # [9] Tower cards, placement, shovel, tower info panel
│   ├── screens.js      # [10] Menu, seed chooser, win/loss, startLevel
│   ├── shop.js         # [11] Tech Shop (buy upgrades)
│   ├── almanac.js      # [12] Threat Database (view stats)
│   └── main.js         # [13] Game loop, rendering, bootstrap
└── docs/               # Design documentation
```

## Dependency Order

| # | File | Depends On | Provides |
|---|------|-----------|----------|
| 1 | config.js | — | canvas, ctx, CELL_W/H, TOWER_TYPES, THREAT_TYPES, LEVEL_DATABASE |
| 2 | save.js | — | SaveManager, saveData, defaultSaveData |
| 3 | state.js | config | credits, towers[], threats[], tokens[], coins[], grid |
| 4 | grid.js | config, state | Cell, initGrid, drawLawn, pixelToCell |
| 5 | audio.js | — | Sound (20+ effects + BGM) |
| 6 | entities.js | config, state, grid, audio | Token, Coin, Tower, Projectile, Threat, LawnMower |
| 7 | combat.js | state, audio | aabb, handleCollisions |
| 8 | waves.js | state, entities, audio | startWave, spawnThreat, updateWaves |
| 9 | ui.js | config, state, grid, entities, save, audio | buildCards, tryPlace, showTowerPanel |
| 10 | screens.js | config, save, state, waves, grid, ui, audio | startLevel, beatLevel, goToMenu |
| 11 | shop.js | config, save, state, audio | openShop, renderShop |
| 12 | almanac.js | config, state, audio, screens | openAlmanac, renderAlmanac |
| 13 | main.js | ALL | update, render, loop + bootstrap |

## Key Globals

- `credits` — current token count
- `towers[]` — placed towers
- `threats[]` — active threats
- `tokens[]` — falling tokens (sky spawns)
- `coins[]` — dropped coins
- `grid[row][col]` — Cell objects (tower, baseTower, cellType)
- `selectedTowerKey` — currently selected tower type
- `gameTime` — accumulated game clock (affected by 2x speed)
- `gameSpeed` — 1 or 2

## Cell Properties

```js
cell.tower      // Tower placed on this cell (or null)
cell.baseTower  // Proxy Node on Data Stream cells (or null)
cell.cellType   // 'standard', 'water', 'data_stream', 'grave'
```

## Game Loop

1. `update(dt)` — update game time, towers, threats, projectiles, tokens, coins, waves
2. `handleCollisions()` — projectiles vs threats, threats eating towers
3. `render()` — draw grid, towers, threats, projectiles, tokens, coins, UI
