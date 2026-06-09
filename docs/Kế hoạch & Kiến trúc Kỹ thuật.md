# **Kế hoạch Phát triển & Kiến trúc Kỹ thuật**

Dự án: Cyber Defenders — Web-based Tower Defense

## **1. Công nghệ sử dụng (Tech Stack)**

* **Ngôn ngữ:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Đồ họa:** HTML5 `<canvas>` để render game mượt mà với 60 FPS.
* **Giao diện:** Dark terminal theme, neon green (#00ff41), monospace font.
* **Lý do chọn cấu trúc này:** Hoạt động thẳng trên trình duyệt, không cần cài đặt, siêu nhẹ, dễ dàng cho AI sinh code trên 1 file index.html duy nhất. Không sử dụng thư viện bên thứ 3 ở giai đoạn MVP.

## **2. Kiến trúc Game (Game Architecture)**

* **Game Loop (Vòng lặp game):** Sử dụng `window.requestAnimationFrame()` để cập nhật (Update) và vẽ (Draw) mọi thực thể trên màn hình liên tục.
* **State Management (Quản lý trạng thái):**
  * Danh sách mảng (Arrays) lưu trữ: `towers[]`, `threats[]`, `projectiles[]`, `tokens[]`.
  * Biến toàn cục: `credits`, `score`, `gameOver`, `frame`.
* **Collision Detection (Phát hiện va chạm):**
  * Sử dụng AABB (Axis-Aligned Bounding Box) cơ bản. Kiểm tra tọa độ (x, y, width, height) của Threat có giao cắt với Tower hoặc Projectile hay không.

## **3. Cấu trúc Module (Module Split)**

Game được chia thành 13 file JS theo thứ tự phụ thuộc:

| File | Nhiệm vụ |
|---|---|
| `config.js` | Hằng số, blueprint tower/threat, LEVEL_DATABASE |
| `save.js` | Lưu/tải tiến trình qua localStorage |
| `state.js` | Quản lý trạng thái game (PLAYING, MENU, etc.) |
| `grid.js` | Lưới network (Cell), initGrid, drawLawn |
| `audio.js` | Hiệu ứng âm thanh Web Audio API |
| `entities.js` | Coin, Tower, Projectile, Threat, LawnMower |
| `combat.js` | Xử lý va chạm (AABB) |
| `waves.js` | Hệ thống đợt tấn công |
| `ui.js` | UI chọn tower, đặt tower, xẻng, keyboard shortcuts |
| `screens.js` | Quản lý màn hình, Win/Loss, startLevel |
| `shop.js` | Cửa hàng Tech Shop |
| `almanac.js` | Threat Database (xem chỉ số) |
| `main.js` | Vòng lặp game, render tổng, bootstrap |

## **4. Lộ trình phát triển (Phases)**

**Giai đoạn 1: Khởi tạo móng (Grid & Clicks)**
* Vẽ Canvas, vẽ lưới 5x9.
* Bắt sự kiện click chuột trên lưới (chuyển tọa độ chuột thành tọa độ ô lưới).

**Giai đoạn 2: Kinh tế (Economy & Placing)**
* Thanh UI hiển thị tower cards và số Coin.
* Logic sinh Coin ngẫu nhiên rơi xuống và click để thu thập.
* Cơ chế chọn tower → Trừ tiền → Đặt tower lên lưới.

**Giai đoạn 3: Combat (Threats & Shooting)**
* Hệ thống sinh Threat ngẫu nhiên theo thời gian (Timer) đi từ phải sang trái.
* Logic Firewall: Quét trên hàng, nếu có Threat → Bắn data packet.
* Logic packet chạm Threat → Trừ HP → Hủy packet.
* Logic Threat chạm Tower → Dừng lại → Trừ HP Tower liên tục → Phá hủy → Đi tiếp.

**Giai đoạn 4: Waves & Win/Loss**
* Code kiểm tra điều kiện System Breach (Threat đi quá vạch).
* Quản lý các đợt (Waves) Threat.

**Giai đoạn 5: Đồ họa (Assets)**
* *Khởi đầu:* Dùng ctx.fillRect, ctx.arc hoặc Emoji (dark terminal theme).
* *Sau này:* Thay thế bằng sprite nếu cần.
