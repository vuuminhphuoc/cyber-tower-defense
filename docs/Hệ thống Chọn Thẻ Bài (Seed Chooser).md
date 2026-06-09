# **Hệ thống Chọn Tower Trước Trận (Core Selection Screen)**

Dự án: Cyber Defenders — Web-based Tower Defense

Khi người chơi thu thập được nhiều hơn số lượng ô core (Core Slots) cho phép mang vào trận, game sẽ chuyển sang màn hình chọn tower trước khi bắt đầu Level.

## **1. Trạng thái Game (Game State)**

Trước trạng thái PLAYING, thêm trạng thái SEED_CHOOSER.

## **2. Giao diện Người dùng (UI Layout)**

* **Khu vực 1: Bản đồ (Background):** Hiển thị màn chơi hiện tại (Terminal Grid, Data Stream) và hiển thị trước một vài Threats sẽ xuất hiện trong màn này.
* **Khu vực 2: Thanh Core đã chọn (Active Cores Bar):**
  * Nằm ở trên cùng.
  * Số lượng ô giới hạn (Mặc định là 6 ô, có thể nâng cấp lên 7, 8 từ Tech Shop).
* **Khu vực 3: Kho Tower (Core Inventory):**
  * Hiển thị toàn bộ các tower người chơi đã mở khóa (`unlockedTowers`).
  * Các tower chưa mở khóa hiện bóng đen hoặc bị ẩn.
* **Khu vực 4: Nút "Deploy!" (Bắt đầu):** Chỉ có thể bấm khi đã chọn đủ ít nhất 1 tower.

## **3. Logic Hoạt động (Interaction Logic)**

* **Chọn tower (Pick):** Click vào một tower ở Kho. Tower đó bay lên lấp vào ô trống đầu tiên trên thanh Active Cores, đồng thời bị làm mờ ở dưới Kho.
* **Bỏ chọn (Deselect):** Click vào một tower đã được chọn trên thanh. Tower đó bị xóa khỏi thanh, và ở dưới Kho sẽ sáng lên lại.
* **Keyboard Shortcuts:**
  * `1-9`: Chọn tower theo thứ tự trong TOWER_KEYS.
  * `Escape`: Bỏ chọn tower.
  * `S`: Bật/tắt xẻng (shovel).
  * `Space`: Tạm dừng game.
* **Cảnh báo Thông minh (Smart Warnings):** Nếu ấn "Deploy" mà:
  * Chơi màn Data Stream nhưng không mang Proxy Node → Cảnh báo: "Bạn không thể đặt tower trên data stream nếu thiếu Proxy Node!"
