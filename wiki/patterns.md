# Patterns — Cyber Defenders

## Adding a new tower

1. Add entry to `TOWER_TYPES` in `js/config.js` with stats, cost, type, description.
2. Add tower card UI in `js/ui.js` if it should appear in build menu.
3. Add upgrade/sell logic in `js/ui.js` if applicable.
4. Add rendering logic in `Tower.render()` in `js/entities.js` (or extend).
5. Add sound trigger in `js/audio.js` if new SFX needed.
6. Update `docs/Game Design.md` and `wiki/code-map.md`.
7. Add level/wave usage in `LEVEL_DATABASE` or `js/waves.js`.
8. Play test target level.

## Adding a new threat

1. Add entry to `THREAT_TYPES` in `js/config.js` with HP, speed, ability.
2. Add behavior in `Threat.update()` or `Threat` methods in `js/entities.js`.
3. Add spawn logic in `js/waves.js` if needed.
4. Add rendering/sprite in `Threat.render()` in `js/entities.js`.
5. Update `docs/Game Design.md` and almanac if needed.
6. Play test level featuring the threat.

## Adding a new level/stage

1. Add stage/level to `LEVEL_DATABASE` in `js/config.js`.
2. Define waves in `js/waves.js` or reference from config.
3. Add stage selection UI in `js/screens.js` if new stage type.
4. Update `docs/Game Design.md` stage list.
5. Test complete level flow (start → win/loss → unlock next).

## Save format migration

1. Update `defaultSaveData` in `js/save.js`.
2. Add migration function in `SaveManager.load()` or init.
3. Do not wipe existing player data; merge or default missing fields.
4. Document in `wiki/conventions.md` and `wiki/log.md`.

## UI screen changes

1. Identify screen in `index.html` (menu, level select, seed chooser, game, win/loss).
2. Update screen visibility in `js/screens.js`.
3. Add event listeners in `js/ui.js` or `js/screens.js`.
4. Keep responsive classes in `css/styles.css`.
