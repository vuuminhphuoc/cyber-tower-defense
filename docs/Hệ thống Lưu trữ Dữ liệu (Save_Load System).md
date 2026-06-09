# **Hệ thống Lưu trữ Dữ liệu (Save/Load System)**

Dự án: Cyber Defenders — Web-based Tower Defense

## **1. Phương thức Lưu trữ (Storage Method)**

Sử dụng **HTML5 localStorage** để lưu trữ tiến trình của người chơi.

* Dữ liệu được lưu dưới dạng chuỗi JSON.
* Khóa lưu trữ (Key): `pvz_web_save_data`.

## **2. Cấu trúc Dữ liệu Lưu trữ (Save Data Schema)**

```js
const defaultSaveData = {
  // 1. Tiến trình (Progression)
  progress: {
    maxLevelIndex: 0  // index trong LEVEL_ORDER đã mở khóa
  },

  // 2. Kinh tế (Economy)
  wallet: {
    coins: 0,
    diamonds: 0
  },

  // 3. Kho đồ (Inventory)
  inventory: {
    unlockedTowers: ['BITCOIN_MINER', 'FIREWALL'], // Towers đã sở hữu
    seedSlots: 6  // Số lượng ô chọn tower tối đa
  },

  // 4. Cài đặt (Settings)
  settings: {
    showGrid: true
  }
};
```

## **3. Các hàm xử lý Dữ liệu (Storage Manager)**

```js
const SaveManager = {
  SAVE_KEY: 'pvz_web_save_data',

  load() {
    const data = localStorage.getItem(this.SAVE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return JSON.parse(JSON.stringify(defaultSaveData));
  },

  save(data) {
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
  },

  reset() {
    localStorage.removeItem(this.SAVE_KEY);
  }
};
```

## **4. Thời điểm kích hoạt Lưu (When to save)**

Game chỉ gọi hàm `SaveManager.save()` ở các thời điểm:

1. Giao diện **Victory / Network Secured** xuất hiện (Cập nhật tiến trình màn chơi).
2. Khi ấn nút **"Back to Menu"** từ overlay.
3. Khi người chơi **mua thành công** một vật phẩm ở Tech Shop.
