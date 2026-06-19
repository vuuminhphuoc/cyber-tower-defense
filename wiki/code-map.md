# Code Map — Cyber Defenders

## Entry point

- `index.html` — loads `css/styles.css` then 13 JS files in dependency order, bootstraps via `main.js`.

## Important symbols by file

| File | Key symbols |
| --- | --- |
| `js/config.js` | `TOWER_TYPES`, `THREAT_TYPES`, `LEVEL_DATABASE`, `CELL_W`, `CELL_H`, `canvas`, `ctx` |
| `js/save.js` | `SaveManager`, `saveData`, `defaultSaveData` |
| `js/state.js` | `credits`, `towers`, `threats`, `tokens`, `coins`, `grid`, `selectedTowerKey` |
| `js/grid.js` | `Cell`, `initGrid`, `pixelToCell`, `drawLawn` |
| `js/audio.js` | `Sound` object, 20+ SFX, BGM |
| `js/entities.js` | `Token`, `Coin`, `Tower`, `Projectile`, `Threat`, `LawnMower` |
| `js/combat.js` | `aabb`, `handleCollisions` |
| `js/waves.js` | `startWave`, `spawnThreat`, `updateWaves`, boss logic |
| `js/ui.js` | `buildCards`, `tryPlace`, `showTowerPanel`, shovel |
| `js/screens.js` | `startLevel`, `beatLevel`, `goToMenu`, menu screens |
| `js/shop.js` | `openShop`, `renderShop` |
| `js/almanac.js` | `openAlmanac`, `renderAlmanac` |
| `js/main.js` | `update(dt)`, `render()`, `loop()`, bootstrap |

## Test / debug files

| File | Purpose |
| --- | --- |
| `test-ai.html` | UI for AI testing |
| `test-ai-play.js` | Play test harness |
| `test-ai-levels.js` | Level test harness |
| `test-ai-debug.js` | Debug helper |
| `puppeteer-test.js` | Screenshot/automation test |
| `test-server.js` | Local static server for tests |
| `test-screenshot.png` | Reference/last screenshot |

## Commands

```bash
# Open game (no build)
open index.html

# Or run local server
node test-server.js

# Deploy
npx netlify-cli deploy --prod --dir .
```

## Plans

See `plans/README.md` for feature roadmap.
