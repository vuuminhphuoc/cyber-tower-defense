# Implementation Order

## Sprint 1: Stability + UX Polish (Current)

### Tasks
1. Add README section: how to run `npm test`, `npm run syntax`
2. Add changelog section
3. Add level detail preview before deploy
4. Add map terrain preview icons
5. Improve mobile layout for card/tower panel
6. Clean inline styles → CSS classes

### Done
- [x] Bug report modal
- [x] Smoke test harness (all 20 levels)
- [x] Collect/sell UX unification
- [x] Proxy Node placement fix
- [x] Encryption/Scanner slow fix
- [x] All critical bug fixes

---

## Sprint 2: New Maps & Levels — DONE

### Tasks
1. [x] Add `cellType` values: `server_rack`, `overheated`, `signal_delay`, `uplink`, `quantum`, `entangled`
2. [x] Add terrain effect hooks in `entities.js`
3. [x] Add terrain visual overlays in `grid.js`
4. [x] Add Stage 8: Server Farm (5 levels)
5. [x] Add Stage 9: Satellite Network (5 levels)
6. [x] Add Stage 10: Quantum Core (5 levels)
7. [x] Add 3 new bosses (Botnet Commander, Satellite Hijacker, Quantum Root)
8. [x] Update `config.js` LEVEL_DATABASE + LEVEL_ORDER + STAGE_EMOJI
9. [x] Generalized `startBossLevel()` via `bossType` + BOSS_CLASSES

### Deliverables
- [x] 15 new levels (total: 35)
- [x] 3 new bosses
- [x] 6 new terrain types
- [x] Smoke test updated (35 levels + boss checks)

---

## Sprint 3: New Towers

### Tasks
1. Add `LOG_ANALYZER` (support, reveal cloaked)
2. Add `SANDBOX` (trap, immobilize)
3. Add `RATE_LIMITER` (slow, lane-wide)
4. Add `ZERO_TRUST_GATE` (wall + aura)
5. Add `SIEM_CENTER` (row damage buff)
6. Add `CLOUD_BACKUP` (revive towers)
7. Add `QUANTUM_FIREWALL` (piercing shooter)
8. Add `HONEYPOT_CLUSTER` (chomper + AoE)
9. Add aura logic in `entities.js`
10. Add trap mechanic for threats
11. Add `onTowerDestroyed` event hook
12. Update shop/almanac/unlock progression

### Deliverables
- 8 new towers (total: 26)
- Updated shop
- Updated almanac

---

## Sprint 4: New Threats

### Tasks
1. Add `SQL_INJECTION` (wall pierce)
2. Add `MALWARE_DROPPER` (spawn on death)
3. Add `DNS_SPOOFER` (redirect tower target)
4. Add `INSIDER_THREAT` (immune to VPN)
5. Add `SUPPLY_CHAIN_ATTACK` (buff nearby threats)
6. Add `QUANTUM_WORM` (teleport forward)
7. Add `BOTNET_COMMANDER` (Stage 8 boss)
8. Add `SATELLITE_HIJACKER` (Stage 9 boss)
9. Add `QUANTUM_ROOT` (Stage 10 boss)
10. Add shield mechanic for bosses
11. Add supply chain aura logic
12. Add DNS spoof redirect mechanic
13. Add quantum teleport logic
14. Update wave compositions
15. Update boss music triggers

### Deliverables
- 6 new threats (total: 20)
- 3 new bosses
- Updated wave data

---

## Sprint 5: Challenge Modes

### Tasks
1. Add mode selection screen
2. Add Endless Mode (infinite waves + scaling)
3. Add Boss Rush (boss-only levels)
4. Add Daily Breach (seeded random daily challenge)
5. Add Minimal Core (4 random towers)
6. Add No Economy (fixed credits)
7. Add Speedrun Mode (timer + leaderboard)
8. Add Fog Nightmare (heavy fog + APT)
9. Add high score storage per mode
10. Add shareable result codes

### Deliverables
- 7 new game modes
- High score system
- Mode selection UI

---

## Sprint 6: AI Rule Bot

### Tasks
1. Create `js/ai/` directory
2. Add `ai-state.js` (game state serialization)
3. Add `ai-actions.js` (action execution wrapper)
4. Add `ai-rule-bot.js` (rule-based decisions)
5. Add `ai-controller.js` (tick loop)
6. Add AI toggle button UI
7. Add AI status display
8. Test: rule bot plays all 20 levels
9. Update `index.html` with AI scripts

### Deliverables
- Rule-based AI bot
- AI toggle UI
- Status display

---

## Sprint 7: AI LLM Autoplay

### Tasks
1. Add `ai-provider.js` (OpenAI-compatible adapter)
2. Add Anthropic adapter
3. Add Gemini adapter
4. Add `ai-prompt.js` (system/user prompt builder)
5. Add `ai-validator.js` (response validation)
6. Add `ai-settings.js` (settings UI + localStorage)
7. Add LLM tick loop with rate limiting
8. Add error handling + fallback to rule bot
9. Add cost tracking display
10. Add test connection button
11. Update AI toggle for LLM mode
12. Test with OpenAI API
13. Test with Anthropic API

### Deliverables
- LLM-powered AI
- Provider settings UI
- Error handling + fallback

---

## Sprint 8: AI Coach

### Tasks
1. Add coach mode (suggestion overlay)
2. Add explain mode (click cell for explanation)
3. Add replay review (post-game analysis)
4. Add coach settings
5. Add visual highlights for suggestions
6. Test coach with rule-based explanations
7. Test coach with LLM explanations

### Deliverables
- Coach mode
- Explain mode
- Replay review

---

## Sprint 9: Modding

### Tasks
1. Create `mods/` directory
2. Add mod schema (campaign, towers, threats, levels)
3. Add mod loader
4. Add mod validator
5. Add mod manager UI
6. Add import from file
7. Add import from URL
8. Add terrain types for mods
9. Add example mod
10. Test mod loading

### Deliverables
- Mod system
- Mod manager UI
- Example mod

---

## Sprint 10: Polish & Deploy

### Tasks
1. Update all documentation
2. Add loading screens
3. Add tutorial overlay
4. Add achievement system
5. Performance profiling
6. Mobile optimization
7. Final QA pass
8. Deploy v2.0

### Deliverables
- Polished game
- Updated docs
- Production deploy

---

## Priority Order

1. **Sprint 1** — Stability (current)
2. **Sprint 2** — New maps (content expansion)
3. **Sprint 3** — New towers (strategic depth)
4. **Sprint 6** — AI rule bot (foundation for AI)
5. **Sprint 7** — AI LLM autoplay (main feature)
6. **Sprint 4** — New threats (challenge)
7. **Sprint 5** — Challenge modes (replay value)
8. **Sprint 8** — AI coach (learning tool)
9. **Sprint 9** — Modding (community)
10. **Sprint 10** — Polish (final)

---

## Estimated Timeline

| Sprint | Effort | Priority |
|---|---|---|
| 1. Stability | 1-2 days | High |
| 2. New Maps | 3-5 days | High |
| 3. New Towers | 3-5 days | High |
| 4. New Threats | 2-4 days | Medium |
| 5. Challenge Modes | 3-5 days | Medium |
| 6. AI Rule Bot | 2-3 days | High |
| 7. AI LLM Autoplay | 3-5 days | High |
| 8. AI Coach | 2-3 days | Low |
| 9. Modding | 5-7 days | Low |
| 10. Polish | 2-3 days | Medium |

**Total: 26-40 days**
