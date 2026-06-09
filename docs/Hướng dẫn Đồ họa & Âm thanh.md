# **Hướng dẫn Quản lý Tài nguyên (Assets Guideline)**

Dự án: Cyber Defenders — Web-based Tower Defense

Để đảm bảo code do AI sinh ra có thể chạy ngay lập tức mà không bị lỗi, hệ thống Assets sẽ được chia làm 2 giai đoạn.

## **1. Phương pháp MVP (Dùng Code/Emoji thay vì Ảnh)**

Yêu cầu AI vẽ các thực thể bằng HTML5 Canvas Context (ctx) trực tiếp với **dark terminal theme**:

* **Nền Grid (Terminal Grid):** Vẽ các ô hình chữ nhật xen kẽ 2 màu `#0a1a0a` / `#0e220e` (dark green/black).
* **Data Stream (Water):** Vẽ các ô `#0a2e4a` / `#0c3555` (cyan/blue).
* **Corrupted Blocks (Graves):** Vẽ các ô `#2a1520` / `#351a28` (red tint) với icon ⚠️.
* **Grid Lines:** Neon green `rgba(0,255,65,0.15)`.
* **Token (Coin):** Dùng Text ☀️.
* **Bitcoin Miner:** Dùng Text ⛏️.
* **Firewall:** Dùng Text 🧱.
* **Encryption Tower:** Dùng Text 🔐.
* **Honeypot:** Dùng Text 🍯.
* **Firewall Wall:** Dùng Text 🛡️.
* **Data Packet (Projectile):** Vẽ hình tròn nhỏ màu cyan.
* **Threats:** Dùng Text 🦠 với các modifier (🐴, 🔒, ⌨️).
* **Boss (Zero-Day Exploit):** Dùng Text 👾.

## **2. UI Theme**

* **Background:** `#0a0a1a` → `#0d1117` (dark gradient).
* **Primary Color:** `#00ff41` (neon green).
* **Secondary Color:** `#00cc33` (darker green).
* **Accent Color:** `#00ffff` (cyan).
* **Font:** `'Courier New', 'Consolas', monospace`.
* **Borders:** `2px solid #00ff41` with `box-shadow: 0 0 10px rgba(0,255,65,0.2)`.
* **Text Glow:** `text-shadow: 0 0 10px #00ff41`.

## **3. Phương pháp Nâng cao (Thay thế bằng Sprite - Sau khi MVP thành công)**

Khi khung game đã ổn định, thêm một class AssetManager để load ảnh:

* Nguồn tìm ảnh chuẩn: OpenGameArt.org (Tìm từ khóa "Cyberpunk Tower Defense 2D").
* Cách hoạt động: Tạo đối tượng Image(), gán src = "url_anh". Chờ onload rồi mới ctx.drawImage().

## **4. Âm thanh (Audio)**

Sử dụng Web Audio API (không cần file âm thanh bên ngoài).

* **Hiệu ứng cần thiết:**
  * Thu thập coin (Ching!)
  * Đặt tower (Thump)
  * Bắn data packet (Pew)
  * Trúng mục tiêu (Splat)
  * Threat ăn tower (Chomp)
  * Threat chết (Digital decay)
  * Wave start (Digital alarm)
  * Critical Breach (Siren)
  * Victory (Fanfare)
  * Game Over (Error tone)
  * Menu click (Blip)
  * Coin collect (Coin ching)
  * BGM: Pentatonic melody + triangle bass loop
