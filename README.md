# Get-News (OnlyNews Custom Edition)

A Ground News–style multi-source news aggregator & clustering engine running locally on `http://localhost:8001`. It fetches live RSS feeds across **115 verified outlets (122 RSS feeds)**, groups related articles into stories using TF-IDF + average-linkage clustering, analyzes political/editorial coverage distribution (*Left / Center / Right*), highlights media blindspots, and lets you export curated stories directly to `.txt`.

---

## ✨ Key Features

- **4 Dedicated Editions (115 Outlets / 122 Live RSS Feeds)**:
  - **US (`#/us`)**: 30 major American news networks & newspapers (*NYT, WSJ, Fox News, PBS, Newsweek, The Atlantic, ProPublica, Daily Wire, The Federalist, FactCheck.org, Snopes, etc.*).
  - **US Military (`#/military`)**: 18 dedicated US defense, military branches, and national security outlets (*Defense News, Military Times, Breaking Defense, Task & Purpose, The War Zone, Defense One, Army Times, Navy Times, Marine Corps Times, Air & Space Forces, Defence Blog, RealClearDefense, etc.*).
  - **International (`#/intl`)**: 35 global news agencies and international reporting outlets (*BBC, Al Jazeera, DW, France 24, The Guardian, The Economist, Financial Times, Politico, SCMP, Japan Times, etc.*).
  - **Vietnam (`#/vn`)**: **32 major Vietnamese news outlets** distributed across **Left**, **Center**, and **Right**:
    - **Left (`bias: -2`, `-1` — 12 outlets)**: *Tuổi Trẻ, Dân Việt, Nhà Báo & Công Luận, Gia Đình & Xã Hội, Báo Văn Hóa, aFamily, Thanh Niên, Dân Trí, Tiền Phong, Giáo Dục & Thời Đại, Tri Thức & Cuộc Sống, VietTimes*.
    - **Center (`bias: 0` — 8 outlets)**: *VnExpress, VTV News, VietnamPlus, VietNamNet, VnExpress International, Báo Nhân Dân, Báo Tin Tức, VTC News*.
    - **Right (`bias: 1`, `2` — 12 outlets)**: *VnEconomy, Sài Gòn Giải Phóng, Kinh Tế & Đô Thị, Báo Công Thương, Báo Xây Dựng, Báo Giao Thông, Vietstock, Sức Khỏe & Đời Sống, 24h.com.vn, Kenh14, Tinh Tế, Eva.vn*.
- **Dedicated Left, Center, Right & Blindspots Pages**:
  - Switch between **`All Coverage`**, **`Left` (`#/<market>/left`)**, **`Center` (`#/<market>/center`)**, **`Right` (`#/<market>/right`)**, and **`Blindspots` (`#/<market>/blindspots`)** directly from the top orientation tabs, the monitor bar, or the sidebar.
  - Browse all newspapers on the Left or Right and click any newspaper chip to filter stories by that specific outlet.
- **100% English Interface**: Clean newspaper/wire-service inspired UI with light & dark mode support.
- **One-Click Live Fetch (`↻ Get News`)**: Fetch all 122 RSS feeds and rebuild clustered story data directly from the web UI without touching the terminal.
- **Export Stories to TXT (`⬇ Save to TXT`)**:
  - Select individual news stories via checkboxes or click **`⬇ Save to TXT`** on any section (or in the top header) to automatically select all stories in that section/view and download a `.txt` file.
  - Formatted cleanly with **1 story per line (`Title — Summary`) separated by 1 blank line**.
- **One-Click Windows Launcher (`start-server.bat`)**: Double-click to start the server on port `8001` and automatically open the browser.

---

## 🚀 Quick Start (Hướng dẫn chạy nhanh)

### Cách 1: Click đúp (Windows)
1. Click đúp vào file **`start-server.bat`** trong thư mục gốc.
2. Cửa sổ dòng lệnh sẽ tự động khởi chạy server tại **`http://localhost:8001`** và mở trình duyệt của bạn.

### Cách 2: Chạy bằng Terminal / PowerShell
```bash
# Cài đặt thư viện (nếu chạy lần đầu)
npm install

# Khởi động web server tại http://localhost:8001
node server.js
```

---

## 🛠️ Cách sử dụng các tính năng chính

1. **Xem trang Left & Right (`#/vn/left`, `#/vn/right`)**:
   - Bấm vào tab **`Left`**, **`Center`**, **`Right`**, hoặc **`Blindspots`** ngay đầu trang chủ (hoặc trên thanh trạng thái phía trên / cột bên phải).
   - Trang **Left** và **Right** hiển thị đầy đủ danh sách các tờ báo Việt Nam thuộc nhóm đó; bạn có thể bấm vào tên từng tờ báo (*Tuổi Trẻ, Dân Trí, Thanh Niên, Dân Việt...* ở bên Left hoặc *VnEconomy, Sài Gòn Giải Phóng, Báo Công Thương, Báo Xây Dựng, Báo Giao Thông, Vietstock, 24h, Kenh14...* ở bên Right) để lọc riêng tin tức của tờ báo đó.
2. **Cập nhật tin tức mới nhất (`↻ Get News`)**:
   - Bấm nút **`↻ Get News`** ở góc trên bên phải thanh điều hướng.
   - Server sẽ tự động quét 122 nguồn RSS, gom nhóm bài viết trùng chủ đề và tự động làm mới giao diện sau khi hoàn tất (~20–30 giây).
3. **Lưu tin tức ra file `.txt` (`⬇ Save to TXT`)**:
   - **Tích chọn thủ công**: Tích vào ô vuông ở góc trên bên phải các bản tin bạn muốn lấy, sau đó bấm **`⬇ Save to TXT (N)`**.
   - **Lưu nhanh toàn bộ mục**: Nếu chưa tích chọn tin nào, bấm **`⬇ Save to TXT`** ở đầu mỗi mục hoặc trên thanh Header để tự động tích chọn toàn bộ tin trong mục/trang đó và tải về file `.txt` (mỗi tin 1 dòng, cách nhau 1 dòng trống).

---

## 📂 Cấu trúc thư mục

```text
GET-NEWS/
├── start-server.bat        # File click đúp để bật server & mở trình duyệt (Port 8001)
├── server.js               # Node HTTP server (phục vụ giao diện tĩnh + API POST /api/build)
├── pipeline/               # Bộ thu thập RSS & thuật toán gom nhóm bài viết (TF-IDF clustering)
│   ├── sources.json        # Danh sách 115 tờ báo / 122 nguồn RSS (US, Military, International, Vietnam)
│   ├── fetch.js            # Tải và chuẩn hóa dữ liệu RSS/Atom
│   ├── cluster.js          # Gom nhóm các bài báo cùng chủ đề
│   └── build.js            # Điểm vào chạy pipeline tạo dữ liệu JSON
└── site/                   # Giao diện Web (HTML/CSS/ES Modules thuần)
    ├── index.html          # Khung giao diện chính
    ├── css/styles.css      # Giao diện phong cách báo chí + Dark/Light mode
    ├── js/                 # Logic hiển thị, trang Left/Right (side.js), lọc chuyên mục và xuất file TXT
    └── data/               # Dữ liệu JSON được sinh ra sau mỗi lần Get News
```

---

## 💻 Các lệnh CLI hữu ích

```bash
npm run build                        # Quét 122 RSS feeds và cập nhật dữ liệu vào site/data/
npm test                             # Chạy 98 unit tests cho pipeline & giao diện
node pipeline/tools/inspect.js vn    # Kiểm tra kết quả gom nhóm tin tức (us | military | intl | vn)
node server.js                       # Chạy server tại http://localhost:8001
```
