# **Cơ chế Địa hình & Hệ thống Môi trường (Environments)**

Dự án: Cyber Defenders — Web-based Tower Defense

Game có 5 khu vực chính (Stages), mỗi khu vực mang đến một sự thay đổi lớn về quy tắc vật lý và kinh tế.

## **1. Hệ thống Firewall & Dark Web (Day/Night Equivalent)**

Sự khác biệt lớn nhất giữa Firewall và Dark Web là **Kinh tế Coin** và **Corrupted Blocks**.

* **Firewall (Stage 1, Stage 3, Stage 5):** Coin rơi ngẫu nhiên từ bầu trời. Towers hoạt động bình thường.
* **Dark Web (Stage 2, Stage 4):**
  * **KHÔNG** có coin rơi từ bầu trời (Chỉ có thể kiếm từ Bitcoin Miner).
  * Xuất hiện Corrupted Blocks (⚠️) trên grid cản trở việc đặt tower, threats có thể chui lên từ corrupted blocks ở đợt tấn công cuối (Final Wave).

## **2. Cơ chế Data Stream (Pool Equivalent - Stage 3 & 4)**

* **Kích thước lưới thay đổi:** Tăng từ 5 hàng lên **6 hàng** (Rows).
* **Phân bổ địa hình:**
  * Hàng 0, 1: Terminal Grid (Grass equivalent).
  * Hàng 2, 3: Data Stream (Water equivalent).
  * Hàng 4, 5: Terminal Grid (Grass equivalent).
* **Luật đặt tower trên Data Stream:**
  * Không thể đặt tower bình thường trực tiếp xuống data stream.
  * Phải đặt **Proxy Node (🔗)** (Giá 25 Coin) xuống ô data stream trước. Proxy Node đóng vai trò như một nền đất mới.
  * Sau đó mới có thể đặt các tower khác (Firewall, Firewall Wall) lên trên Proxy Node.
* **Threats trên data stream:** Worm (lặn, không thể bị bắn trúng cho đến khi nó trồi lên ăn tower).

## **3. Cơ chế Root Access (Roof Equivalent - Stage 5)**

* **Kích thước lưới:** 5 hàng x 9 cột.
* **Boss Level:** Zero-Day Exploit (60,000 HP) đứng cố định ở 2 cột cuối cùng bên phải.
* **Luật đặt tower:**
  * Grid mặc định, KHÔNG THỂ đặt tower trực tiếp lên Boss.
  * Tower bắn thẳng (Firewall, Encryption Tower) hoạt động bình thường.
* **Boss Vulnerability:**
  * Boss chỉ nhận sát thương khi đang ở trạng thái VULNERABLE (sau khi tấn công xong).
  * Khi Boss ở trạng thái SHIELDED, đạn bị bật lại hoặc nhận sát thương rất thấp.

## **4. Tên Stage**

| Stage | Tên | Tương đương |
|---|---|---|
| 1 | Firewall | Day |
| 2 | Dark Web | Night |
| 3 | Data Stream | Pool |
| 4 | Encrypted Network | Fog |
| 5 | Root Access | Roof/Boss |
