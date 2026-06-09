# **Cơ chế Đặc biệt & Chế độ Mở rộng (Advanced Mechanics & Extra Modes)**

Dự án: Cyber Defenders — Web-based Tower Defense

Tài liệu này bổ sung các cơ chế đặc thù của một số Towers, môi trường Encrypted Network (Stage 4) và các chế độ chơi ngoài Campaign.

## **1. Cơ chế Môi trường: Encrypted Network (Encrypted Net - Stage 4)**

* **Đặc điểm:** Kết hợp Data Stream (6 hàng) + Ban đêm (Không có coin rơi) + Encrypted columns.
* **Encrypted Columns:**
  * Một lớp mã hóa che khuất từ 3 đến 5 cột cuối cùng bên phải màn hình. Người chơi không thể nhìn thấy Threats hoặc Towers đang ở trong vùng này.
* **Cách khắc phục (Counter-mechanics):**
  * **Scanner Tower:** Đặt xuống sẽ giải mã và xóa lớp mã hóa trong phạm vi 3x3 ô xung quanh nó.
  * **Firewall Sweep:** Kích hoạt sẽ tạo ra luồng gió xóa toàn bộ mã hóa trên toàn bản đồ (mã hóa sẽ từ từ trôi lại sau một khoảng thời gian).

## **2. Các Threat có cơ chế Đặc thù**

Để làm AI phức tạp hơn, thêm các logic sau vào Vòng lặp kiểm tra (Update Loop) của Threat:

* **Botnet (Khổng lồ):**
  * *Sát thương:* Không cắn tower. Dùng cuộc tấn công DDoS ĐẬP NÁT bất kỳ tower nào trong 1 hit (kể cả Firewall Wall 4000 HP).
  * *Cơ chế ném Script:* Khi máu giảm xuống dưới 50%, Botnet sẽ ném một đoạn script qua hàng rào tower (rơi vào cột 2 hoặc 3), phá vỡ đội hình.
* **Advanced Persistent Threat (APT):**
  * Không đi bộ từ phải sang. Xuất hiện một điểm đánh dấu mục tiêu trên 1 tower ngẫu nhiên.
  * Từ trên trời thả payload xuống, dừng lại khoảng 3 giây. Nếu không bị tiêu diệt, nó sẽ "xóa" tower đó.
* **Rootkit (Đào hầm):**
  * Ẩn dưới mạng ngay từ lúc xuất hiện, đào hầm luồn qua TẤT CẢ các tower (miễn nhiễm đạn bay ngang).
  * Trồi lên ở cột 0 (cột tận cùng bên trái) và bắt đầu ăn ngược từ Trái sang Phải.

## **3. Các Tower có cơ chế Đặc thù**

* **Honeypot (🍯):**
  * Có bán kính hoạt động. Khi Threat đi vào tầm, Honeypot sẽ "gài bẫy", dụ Threat đến và ăn ngay lập tức. Sau đó cần 30 giây để reset.
* **Encryption Tower (🔐):**
  * Bắn data mã hóa, giảm tốc Threat 50% trong 2 giây.
* **Proxy Node (🔗):**
  * Nền đặt tower trên Data Stream (water cells). Không có chức năng tấn công.

## **4. Chế độ Mở rộng (Future Modes)**

Nếu muốn mở rộng game:

* **Capture the Flag:**
  * Máy tính bố trí tower rải rác sẵn. Người chơi có sẵn Coin, dùng để mua các thẻ Threat thả vào các hàng bên phải. Mục tiêu là chiếm được server ở cuối màn.
* **Firewall Challenge:**
  * Đảo ngược quy tắc: Người chơi chỉ được phép đặt tower phòng thủ, AI sẽ điều khiển Threat tấn công. Mục tiêu là giữ server trong thời gian quy định.

## **5. Threat Database (Almanac) & Training Ground**

* **Threat Database:** Màn hình trong Menu, dùng mảng `unlockedTowers` để cho phép người chơi xem chỉ số, mô tả của từng Tower và Threat.
* **Training Ground:** Một map đặc biệt không có chiến đấu.
  * Thỉnh thoảng chơi rơi ra một "New Core".
  * Người chơi vào đây test tower, xem chỉ số thực tế. Game vẫn chạy thời gian ngầm khi tắt trình duyệt.
