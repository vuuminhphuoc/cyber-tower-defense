# **Cơ sở Dữ liệu Màn chơi (Level Designs & Waves)**

Dự án: Cyber Defenders — Web-based Tower Defense

Cấu trúc dùng một Object JSON để cấu hình cho toàn bộ 13 Level của chế độ Campaign.

## **1. Cấu trúc Dữ liệu Level**

```js
const LEVEL_DATABASE = {
  "1-1": {
    stage: 1,           // 1: Firewall, 2: Dark Web, 3: Data Stream, 4: Encrypted Net, 5: Root Access
    name: "Firewall - Level 1",
    gridMode: "5_LANE",
    tokenSpawnRate: 7000,  // ms giữa mỗi coin rơi
    initialTokens: 150,     // coin ban đầu
    reward: "ENCRYPTION", // tower thưởng sau khi qua màn
    unlockedTowers: ['BITCOIN_MINER', 'FIREWALL'],
    waves: [
      { count: 2, coneChance: 0.0 },
      { count: 4, coneChance: 0.0, huge: true }
    ]
  },
  "3-1": {
    stage: 3,
    name: "Data Stream - Level 1",
    gridMode: "6_LANE_POOL", // Bật 2 hàng data stream ở giữa
    tokenSpawnRate: 5000,
    initialTokens: 100,
    unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE', 'PROXY_NODE'],
    waves: [
      { count: 5, coneChance: 0.2, poleChance: 0.1, bucketChance: 0.1 },
      { count: 8, coneChance: 0.3, poleChance: 0.2, bucketChance: 0.15, newspaperChance: 0.1 },
      { count: 12, coneChance: 0.4, poleChance: 0.25, bucketChance: 0.2, newspaperChance: 0.15, footballChance: 0.1, huge: true }
    ]
  },
  "5-10": {
    stage: 5,
    name: "Root Access - Final Boss",
    gridMode: "5_LANE",
    bossLevel: true,
    initialTokens: 200,
    tokenSpawnRate: 5000,
    reward: null,
    unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION', 'FIREWALL_WALL', 'DATA_PURGE', 'TRIPWIRE', 'HONEYPOT', 'SYSTEM_WIPE', 'PROXY_NODE'],
    waves: [
      { count: 0, boss: true }
    ]
  }
};
```

## **2. Wave System**

Mỗi wave có các tham số:

| Tham số | Mô tả |
|---|---|
| `count` | Số lượng threats trong wave |
| `coneChance` | Xác suất Trojan xuất hiện |
| `poleChance` | Xác suất Worm xuất hiện |
| `bucketChance` | Xác suất Ransomware xuất hiện |
| `newspaperChance` | Xác suất Phisher xuất hiện |
| `footballChance` | Xác suất Keylogger xuất hiện |
| `huge` | Nếu true → Critical Breach (đợt tấn công lớn) |

## **3. Level Order**

```js
const LEVEL_ORDER = [
  '1-1','1-2','1-3','1-4','1-5','1-6',  // Firewall (6 levels)
  '2-1','2-2',                            // Dark Web (2 levels)
  '3-1','3-2',                            // Data Stream (2 levels)
  '4-1','4-2',                            // Encrypted Net (2 levels)
  '5-10'                                  // Root Access - Boss (1 level)
];
```

## **4. Flags & Waves Logic**

* Game có thanh tiến trình (Progress Bar) chia làm các mốc cờ (Flags).
* Mỗi màn chơi có từ 2 đến 4 waves.
* Khi tiến trình chạm đến Cờ:
  * Kích hoạt **Critical Breach** (Đợt tấn công lớn).
  * Chữ "CRITICAL BREACH — MASSIVE ATTACK INCOMING!" hiện lên giữa màn hình.
  * Số lượng threats sinh ra cùng lúc tăng vọt.
