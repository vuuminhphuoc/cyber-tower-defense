# **Cấu trúc Dữ liệu Các Thực thể (Entity Data Structures)**

Dự án: Cyber Defenders — Web-based Tower Defense

Tài liệu này định nghĩa cấu trúc OOP (Object-Oriented Programming) bằng JavaScript (ES6 Classes) cho AI để đảm bảo AI code đúng thông số.

## **1. Lớp Tế bào lưới (Cell)**

```js
class Cell {
  constructor(x, y, width, height, cellType) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cellType = cellType || 'grass'; // 'grass' | 'water' | 'grave'
    this.tower = null;      // tower on this cell
    this.baseTower = null;  // proxy node on data stream cells
  }
}
```

## **2. Thông số Khởi tạo Tower (Tower Blueprint)**

```js
const TOWER_TYPES = {
  BITCOIN_MINER: { cost: 50, hp: 300, cooldown: 2000, type: 'producer', tokenRate: 12000 },
  FIREWALL:      { cost: 100, hp: 300, cooldown: 2000, type: 'shooter', damage: 20, fireRate: 1500 },
  ENCRYPTION:    { cost: 175, hp: 300, cooldown: 2000, type: 'shooter', damage: 20, fireRate: 1500, slow: 0.5, slowDuration: 2000 },
  HONEYPOT:      { cost: 150, hp: 300, cooldown: 5000, type: 'chomper', chewTime: 30000 },
  DATA_PURGE:    { cost: 150, hp: 300, cooldown: 25000, type: 'bomb', radius: 1.5 },
  SYSTEM_WIPE:   { cost: 125, hp: 300, cooldown: 25000, type: 'jalapeno' },
  TRIPWIRE:      { cost: 25, hp: 300, cooldown: 15000, type: 'mine', armTime: 15000 },
  FIREWALL_WALL: { cost: 50, hp: 4000, cooldown: 5000, type: 'defender' },
  PROXY_NODE:    { cost: 25, hp: 300, cooldown: 1000, type: 'lily_pad' }
};
```

## **3. Lớp Tower**

```js
class Tower {
  constructor(row, col, type) {
    this.row = row;
    this.col = col;
    this.x = col * CELL_W;
    this.y = TOP_OFFSET + row * CELL_H;
    this.width = CELL_W;
    this.height = CELL_H;
    this.type = type;
    this.hp = TOWER_TYPES[type].hp;
    this.lastFired = 0;
    this.lastTokenProduced = 0;
  }
  // update() và draw() methods...
}
```

## **4. Lớp Threat**

```js
class Threat {
  constructor(row, type) {
    this.x = canvas.width;
    this.row = row;
    this.y = TOP_OFFSET + row * CELL_H;
    this.width = 60;
    this.height = 80;
    this.type = type; // 'BASIC', 'CONEHEAD', etc.
    this.hp = THREAT_TYPES[type].hp;
    this.speed = THREAT_TYPES[type].speed;
    this.isEating = false;
    this.damage = THREAT_TYPES[type].damage;
  }
  // update() và draw() methods...
}
```

## **5. Lớp Data Packet (Projectile)**

```js
class Projectile {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.width = 15;
    this.height = 15;
    this.speed = 3;
    this.damage = damage;
    this.markedForDeletion = false;
  }
  // update() và draw() methods...
}
```

## **6. Danh sách Threat Types**

| Key | HP | Speed | Damage | Emoji | Tên |
|---|---|---|---|---|---|
| BASIC | 200 | 0.15 | 100 | 🦠 | Virus |
| CONEHEAD | 560 | 0.15 | 100 | 🦠+🐴 | Trojan |
| POLE_VAULTING | 340 | 0.45 | 100 | 🦠 | Worm |
| BUCKETHEAD | 1100 | 0.15 | 100 | 🦠+🔒 | Ransomware |
| NEWSPAPER | 340 | 0.15 | 100 | 🦠 | Phisher |
| FOOTBALL | 1600 | 0.5 | 100 | 🦠+⌨️ | Keylogger |
| BOSS | 60000 | 0 | 0 | 👾 | Zero-Day Exploit |
