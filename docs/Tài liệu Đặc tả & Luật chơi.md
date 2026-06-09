# **Đặc tả Game & Luật chơi (Game Specification & Rules)**

Dự án: Cyber Defenders — Web-based Tower Defense

## **1. Môi trường chơi (The Grid)**

* **Bản đồ (Network Grid):** Chia thành một lưới (Grid). Kích thước chuẩn là 5 hàng (Rows) x 9 cột (Cols).
* Mỗi ô (Cell) chỉ được đặt tối đa 1 tower.
* Threats (malware) sẽ xuất hiện ngẫu nhiên ở mép bên phải của 5 hàng và đi thẳng sang bên trái.
* Nếu có bất kỳ 1 Threat nào vượt qua mép tận cùng bên trái của hàng, người chơi Thua (System Breach).

## **2. Hệ thống Kinh tế (Economy)**

* **Đơn vị tiền tệ:** Coin (🪙).
* **Coin rớt từ bầu trời:** Cứ mỗi 10-15 giây, một Coin ngẫu nhiên sẽ rơi từ trên xuống. Click vào để thu thập (+25 Coin).
* **Coin từ Tower (Bitcoin Miner):** Cứ mỗi 12 giây, tạo ra 1 Coin (+25 Coin).
* **Số Coin ban đầu:** 50 Coin.

## **3. Hệ thống Sát thương & Máu (Cơ bản)**

Lấy chỉ số quy chuẩn để dễ tính toán:

* 1 data packet (Firewall) = 20 sát thương (Damage).
* Threat cắn tower = 100 sát thương / giây.

**Danh sách Towers (Defense):**

1. **Bitcoin Miner (⛏️):** Giá: 50 Coin. Máu: 300 HP.
   * Kỹ năng: Sinh ra 25 Coin mỗi 12s.
2. **Firewall (🧱):**
   * Giá: 100 Coin. Máu: 300 HP.
   * Kỹ năng: Bắn 1 data packet (20 Dmg) mỗi 1.5s nếu phát hiện Threat trên cùng hàng.
3. **Firewall Wall (🛡️):**
   * Giá: 50 Coin. Máu: 4000 HP.
   * Kỹ năng: Không tấn công, chỉ dùng thân mình để chặn Threat tiến lên.

**Danh sách Threats (Malware):**

1. **Virus (🦠):**
   * Máu: 200 HP.
   * Tốc độ di chuyển: Chậm (Khoảng 4.7 giây để đi hết 1 ô lưới).
   * Sát thương cắn: 100 HP / giây.
2. **Trojan (🦠+🐴):**
   * Máu: 560 HP (Gấp gần 3 lần Virus thường).
   * Tốc độ và Sát thương: Tương đương Virus thường.

## **4. Điều kiện Thắng / Thua**

* **Thua (System Breach):** Khi một con Threat chạm vào tọa độ X = 0 (Vượt qua mép trái màn hình).
* **Thắng (Network Secured):** Sống sót qua một số lượng đợt (Waves) Threat nhất định. Ví dụ màn 1 có 2 đợt (Wave 1: 2 threats, Wave 2: 4 threats (Critical Breach)).
