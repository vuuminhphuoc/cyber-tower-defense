# **Hệ thống Tiến trình, Cửa hàng & Boss**

Dự án: Cyber Defenders — Web-based Tower Defense

Tài liệu này đặc tả các cơ chế nâng cao giúp tạo động lực cho người chơi, bao gồm hệ thống qua màn, tiền tệ (Coins/Diamonds), mở khóa tower và cơ chế đấu Boss.

## **1. Hệ thống Màn chơi (Level Progression)**

Game được chia thành chế độ Campaign với nhiều Stage và Level (Ví dụ: 1-1, 1-2, 2-1).

### **Cấu trúc Dữ liệu của một Level (Level Config)**

```js
const LEVEL_DATABASE = {
  "1-1": {
    name: "Firewall - Level 1",
    stage: 1,
    unlockedTowers: ['BITCOIN_MINER', 'FIREWALL'],
    reward: "ENCRYPTION",
    waves: [
      { count: 2, coneChance: 0.0 },
      { count: 4, coneChance: 0.0, huge: true }
    ]
  },
  "1-2": {
    name: "Firewall - Level 2",
    stage: 1,
    unlockedTowers: ['BITCOIN_MINER', 'FIREWALL', 'ENCRYPTION'],
    reward: "FIREWALL_WALL",
    waves: [
      { count: 3, coneChance: 0.0, poleChance: 0.0 },
      { count: 5, coneChance: 0.2, poleChance: 0.1 },
      { count: 7, coneChance: 0.3, poleChance: 0.1, huge: true }
    ]
  }
};
```

### **Cơ chế Mở khóa Tower mới (Unlocking Towers)**

* Khi kết thúc Wave cuối cùng của một màn chơi, người chơi nhận được một **New Core (Thẻ tower mới)**.
* Hiển thị UI Popup: "New core: ⛏️ Bitcoin Miner!" kèm tên và mô tả kỹ năng.
* Tower này sẽ được tự động thêm vào mảng `unlockedTowers` của người chơi ở màn tiếp theo.

## **2. Hệ thống Tiền tệ (Kinh tế ngoài màn chơi)**

Bên cạnh Coin (dùng trong trận), game có hệ thống tiền tệ riêng để mua sắm ngoài menu.

### **Các loại Tiền tệ**

Thỉnh thoảng Threats chết sẽ rớt ra tiền, hoặc người chơi nhận được khi qua màn.

* **Silver Coin:** +10 Coin.
* **Gold Coin:** +50 Coin.
* **Diamond:** +1000 Coin (Rất hiếm, thường rớt khi đánh bại Boss hoặc qua Stage lớn).

### **Cửa hàng Tech Shop**

Người chơi dùng tiền thu thập được để mua các nâng cấp vĩnh viễn:

* **Extra Core (💾):** Tăng số lượng tower mang theo vào trận (Từ 6 ô lên 7 ô giá 750, lên 8 ô giá 5000).

## **3. Cơ chế Boss (Boss Fights)**

Boss (Zero-Day Exploit) xuất hiện ở màn 5-10 (Root Access). Cơ chế Boss phức tạp hơn nhiều so với Threats thường.

### **Thông số Boss**

* **Kích thước:** Chiếm không gian của 4-6 ô lưới (rất lớn).
* **Vị trí:** Không đi từ phải sang trái mà đứng cố định ở 2 cột cuối cùng bên phải.
* **Máu (HP):** 60,000 HP (tương đương 3000 data packets).
* **Emoji:** 👾

### **Các Kỹ năng (Phases & Attacks)**

Boss có chu kỳ hành động:

1. **Summoning (Triệu hồi):** Boss thả ngẫu nhiên 3-5 Threats (đủ loại) vào các hàng khác nhau.
2. **Fire/Ice Ball (Cầu Lửa/Băng):**
   * Boss nhả ra một quả cầu lăn dọc theo 1 hàng.
   * Quả cầu sẽ nghiền nát MỌI tower và threats trên đường đi.
3. **System Crash (Đập server):** Boss thả một đoạn mã độc từ trên trời xuống đè bẹp một khu vực, phá hủy tower trong vùng đó.
4. **Vulnerability (Trạng thái VULNERABLE):** Boss chỉ nhận sát thương khi đang ở trạng thái VULNERABLE. Khi SHIELDED, đạn bị bật lại.

### **Boss Status Text**

* `VULNERABLE` (màu xanh) — Nhận sát thương bình thường.
* `SHIELDED` (màu đỏ) — Miễn nhiễm sát thương.
