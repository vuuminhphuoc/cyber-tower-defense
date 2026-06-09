# Kiến trúc Mã nguồn (ARCHITECTURE)

Dự án: Cyber Defenders — Web-based Tower Defense

Tài liệu này mô tả cách dự án được **chia nhỏ thành nhiều file**, **mối liên hệ
(dependency)** giữa chúng, và **biến/hàm dùng chung được tái sử dụng ở đâu**.

---

## 1. Cách hoạt động chung

- Game dùng **Vanilla JS + nhiều thẻ `<script>` thường** (KHÔNG dùng ES modules).
- Tất cả file `.js` chạy trong **cùng một global scope**, nên `let`/`const`/`class`
  khai báo ở top-level của file này **dùng được ở file khác** (miễn là nạp đúng thứ tự).
- Ưu điểm: **mở thẳng `index.html` bằng double-click (file://) là chạy được**,
  không cần server — đúng tiêu chí "siêu nhẹ" trong `docs/`.
- `index.html` chỉ chứa HTML + link CSS + danh sách `<script>` theo thứ tự phụ thuộc.

> ⚠️ **Quy tắc vàng:** thứ tự `<script>` trong `index.html` PHẢI khớp thứ tự phụ thuộc
> bên dưới. `main.js` luôn nạp **cuối cùng** (nó gọi `goToMenu()` khởi động).

---

## 2. Cây thư mục

```
verdant-siege/
├── index.html          # Khung HTML + nạp CSS/JS
├── ARCHITECTURE.md     # Tài liệu kiến trúc mã nguồn
├── netlify.toml        # Netlify config
├── css/
│   └── styles.css      # Toàn bộ style (dark terminal theme, neon green)
├── js/
│   ├── config.js       # [1] Hằng số, TOWER_TYPES, LEVEL_DATABASE
│   ├── save.js         # [2] SaveManager + saveData (localStorage)
│   ├── state.js        # [3] Biến trạng thái toàn cục + mảng thực thể
│   ├── grid.js         # [4] Cell, lưới network, đổi tọa độ
│   ├── audio.js        # [5] Web Audio API — Sound object (âm thanh oscillator)
│   ├── entities.js     # [6] Coin, Tower, Projectile, Threat, LawnMower
│   ├── combat.js       # [7] AABB + packet trúng threat
│   ├── waves.js        # [8] Hệ thống đợt threat + critical breach + banner
│   ├── ui.js           # [9] Chọn tower, đặt tower, xẻng, keyboard shortcuts
│   ├── screens.js      # [10] Menu, Core Chooser, Win/Loss, startLevel
│   ├── shop.js         # [11] Tech Shop (mua core slots)
│   ├── almanac.js      # [12] Threat Database (xem chỉ số tower/threat)
│   └── main.js         # [13] update/render/loop + bootstrap (NẠP CUỐI)
├── docs/               # Tài liệu thiết kế game
│   ├── Tài liệu Đặc tả & Luật chơi.md
│   ├── Kế hoạch & Kiến trúc Kỹ thuật.md
│   ├── Cấu trúc Dữ liệu Thực thể.md
│   ├── Cơ chế Đặc biệt & Chế độ Mở rộng.md
│   ├── Cơ chế Địa hình & Ngày Đêm.md
│   ├── Cơ sở Dữ liệu Màn chơi.md
│   ├── Hệ thống Chọn Thẻ Bài.md
│   ├── Hệ thống Lưu trữ Dữ liệu.md
│   ├── Hệ thống Tiến trình, Cửa hàng & Boss.md
│   └── Hướng dẫn Đồ họa & Âm thanh.md
└── package.json        # Dev dependencies (puppeteer, express)
```

---

## 3. Thứ tự nạp & phụ thuộc

| # | File | Phụ thuộc (cần nạp trước) | Cung cấp (global chính) |
|---|------|---------------------------|--------------------------|
| 1 | `config.js`   | — | `canvas`, `ctx`, `ROWS/COLS`, `CELL_W/H`, `TOWER_TYPES`, `ALL_TOWER_KEYS`, `TOWER_KEYS`, `THREAT_TYPES`, `THREAT_KEYS`, `LEVEL_DATABASE`, `LEVEL_ORDER`, `STAGE_EMOJI` |
| 2 | `save.js`     | — | `SaveManager`, `saveData`, `defaultSaveData` |
| 3 | `state.js`    | config (khái niệm) | `GAME_STATE`, `gameState`, `currentLevel`, `credits`, `score`, `gameOver/Won`, `deltaTime`, các mảng `towers/threats/projectiles/tokens/coins`, `grid`, `towerCooldowns` |
| 4 | `grid.js`     | config, state | `Cell`, `initGrid`, `drawLawn`, `pixelToCell` |
| 5 | `audio.js`    | — | `Sound` (tokenCollect, coinCollect, towerPlace, shoot, projectileHit, threatEat, threatDie, waveStart, hugeWaveAlarm, menuClick, coreSelect, winFanfare, loseSound, bgmStart/Stop/Toggle) |
| 6 | `entities.js` | config, state, grid, audio | `Token`, `spawnSkyToken`, `Coin`, `dropCoin`, `Tower`, `Projectile`, `Threat`, `LawnMower`, `spawnThreatByType` |
| 7 | `combat.js`   | state, audio | `aabb`, `handleCollisions` |
| 8 | `waves.js`    | state, entities, audio | `WAVES`, `startWave`, `spawnThreat`, `updateWaves`, `showBanner`, `waveStarted`, `gameStartTime`… |
| 9 | `ui.js`       | config, state, grid, entities, save, audio | `buildCards`, `selectTower`, `updateCardsUI`, `tryTower`, `collectToken`, listener chuột + keyboard |
| 10| `screens.js`  | config, save, state, waves, grid, ui, audio | `triggerGameOver`, `triggerWin`, `beatLevel`, `showOverlay`, `showScreen`, `goToMenu`, `openSeedChooser`, `startLevel` |
| 11| `shop.js`     | config, save, state, audio, screens | `openShop`, `renderShop`, `buyItem` |
| 12| `almanac.js`  | config, state, audio, screens | `openAlmanac`, `renderAlmanac` |
| 13| `main.js`     | TẤT CẢ | `update`, `render`, `drawProgressBar`, `loop` + khởi động |

### Phụ thuộc "ngược" (forward reference) — an toàn vì chỉ gọi lúc runtime
- `entities.js → triggerGameOver()` (định nghĩa ở `screens.js`): Threat gọi khi vượt mép trái.
- `waves.js → triggerWin()` (định nghĩa ở `screens.js`): gọi khi hết wave cuối.
- `entities.js → Projectile` dùng trong `Tower`: cùng file, OK.
- `entities.js`, `combat.js`, `waves.js`, `ui.js`, `screens.js → Sound.*()` (định nghĩa ở `audio.js`): tất cả gọi lúc runtime, sau khi audio.js đã nạp.

---

## 4. Biến/hàm tái sử dụng — dùng ở đâu

### `TOWER_TYPES` (config.js)
Blueprint chỉ số tower (18 loại: Bitcoin Miner, Crypto Farm, Firewall, Encryption, Honeypot, Data Purge, System Wipe, Tripwire, Firewall Wall, Proxy Node, Scanner, DDoS Bot, Sniper, EMP Mine, VPN Cloaker, Patch Bot, Chomper, Healer). Dùng ở: `entities.js` (Tower), `ui.js` (buildCards, tryTower), `screens.js` (seed chooser, thưởng).

### `THREAT_TYPES` (config.js)
Blueprint chỉ số threat (11 loại: Virus, Trojan, Worm, Ransomware, Phisher, Keylogger, Adware, DDoS Bot, Spyware, Logic Bomb, Zero-Day Exploit). Dùng ở: `entities.js` (Threat constructor), `waves.js` (spawnThreat).

### `saveData` + `SaveManager` (save.js)
Tiến trình người chơi. Dùng ở: `ui.js` (collectToken cộng tiền),
`screens.js` (beatLevel lưu, menu/seed chooser đọc unlockedTowers & seedSlots).

### Mảng thực thể `towers/threats/projectiles/tokens/coins` (state.js)
Đọc/ghi khắp nơi: `entities.js` (spawn/đẩy phần tử), `combat.js`, `waves.js`,
`ui.js` (nhặt), `main.js` (update/render/cleanup).

### `ctx`, `canvas` (config.js)
Mọi hàm vẽ: `grid.js`, `entities.js` (draw), `main.js` (render/progress bar).

### `currentLevel` (state.js, set bởi screens.js)
Cấu hình màn đang chơi. Dùng ở: `main.js` (tokenSpawnRate), `screens.js` (startLevel),
`ui.js`/`waves.js` gián tiếp qua `WAVES`.

### `showBanner` (waves.js)
Hiện chữ giữa màn. Dùng ở: `waves.js` (startWave/huge wave). Render bởi `main.js`.

### `Sound` (audio.js)
Âm thanh game. Dùng ở: `entities.js` (shoot, threatEat, threatDie),
`combat.js` (projectileHit), `waves.js` (waveStart, hugeWaveAlarm),
`ui.js` (tokenCollect, coinCollect, seedSelect, towerPlace),
`screens.js` (menuClick, winFanfare, loseSound).

---

## 5. Luồng chạy (Game Flow)

```
goToMenu()                 [main.js bootstrap]
  → buildMenu()            [screens.js] đọc saveData, vẽ nút level
  → click level
openSeedChooser(id)        [screens.js] vào màn chọn tower
  → buildSeedChooser()     lọc tower unlocked ∩ available
  → "Deploy!"
startLevel()               [screens.js] nạp WAVES, reset thực thể, PLAYING
  → loop()                 [main.js] mỗi frame:
       update() → render()
       updateWaves() → startWave()/spawnThreat()  [waves.js]
       Tower.update() bắn Projectile               [entities.js]
       handleCollisions() packet trừ máu threat    [combat.js]
       threat chết → dropCoin()                    [entities.js]
  → hết wave cuối → triggerWin() → beatLevel()    [screens.js]
       Sound.winFanfare() + mở khóa tower + lưu    [audio.js, save.js]
  → "Back to Menu" → goToMenu()
```

---

## 6. Khi thêm tính năng mới (hướng dẫn)

- **Thêm tower mới:** khai báo trong `TOWER_TYPES` (config.js). Nếu có hành vi đặc biệt
  (ném parabol, ẩn…), thêm nhánh trong `Tower.update()` (entities.js).
- **Thêm threat mới:** thêm nhánh trong `Threat` (entities.js) + chỉnh `spawnThreat` (waves.js).
- **Thêm màn mới:** thêm entry vào `LEVEL_DATABASE` + `LEVEL_ORDER` (config.js).
- **Thêm địa hình (dark web/data stream/encrypted net):** cập nhật `grid.js` (initGrid, drawLawn) và config.js (gridMode).
- **Thêm cửa hàng/Boss:** cập nhật `shop.js` / `entities.js` (Boss class).

> Mỗi khi thêm file `.js`, **luôn cập nhật bảng ở mục 3** và **danh sách `<script>`
> trong `index.html`** để giữ thứ tự phụ thuộc đúng.
