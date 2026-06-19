# Conventions — Cyber Defenders

## Code style

- Vanilla JS ES6+; no TypeScript, no build step.
- Global functions/objects share one scope; declare globals with `const`/`let` at file top.
- Avoid adding new top-level dependencies without ADR/plan approval.
- Script load order in `index.html` matters; never reorder without updating `wiki/architecture.md`.

## Naming

- Constants: `SCREAMING_SNAKE_CASE` (e.g., `CELL_W`, `TOWER_TYPES`).
- Constructors/classes: `PascalCase` (e.g., `Tower`, `Threat`).
- Functions/variables: `camelCase`.
- DOM element refs: prefix `el` optional.

## Balance changes

- Any change to tower cost, damage, HP, fire rate, threat HP/speed, or economy must be recorded.
- Record in `plans/` if part of a planned feature; otherwise record in `wiki/log.md` and `docs/Game Design.md`.
- Avoid stealth balance nerfs without plan or ADR.

## Save data

- Save format lives in `js/save.js` (`saveData`, `defaultSaveData`).
- When changing save shape, add migration logic or bump save version; do not wipe player data.

## Canvas / rendering

- Use `config.js` constants for cell size and colors.
- Draw order: grid → towers → threats → projectiles → tokens/coins → UI overlay.

## Testing

- Manual: open `index.html` and play target level.
- Automated: `node test-server.js` + `node puppeteer-test.js` for screenshot/flow.
- AI tests: `test-ai-play.js`, `test-ai-levels.js`, `test-ai-debug.js`.

## Documentation

- Update `wiki/code-map.md` when adding/removing major file.
- Update `docs/Game Design.md` when adding tower, threat, level, or stage.
- Update `plans/README.md` when plan status changes.
