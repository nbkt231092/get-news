# Get-News (OnlyNews Custom Edition)

A Ground News–style multi-source news aggregator & clustering engine running locally on `http://localhost:8001`. It fetches live RSS feeds across **101 verified outlets**, groups related articles into stories using TF-IDF + average-linkage clustering, analyzes political coverage distribution (*Left / Center / Right*), highlights media blindspots, and lets you export curated stories directly to `.txt`.

---

## ✨ Key Features

- **4 Dedicated Editions (101 Live RSS Feeds)**:
  - **US (`#us`)**: Major American news networks & newspapers (*NYT, WSJ, Washington Post, Fox News, NPR, AP, PBS, Politico, The Hill, Axios, CBS, NBC, ABC, New York Post, Reason, Mother Jones, etc.*).
  - **US Military (`#military`)**: Dedicated US defense, military branches, and national security coverage (*Defense News, Military Times, Breaking Defense, Task & Purpose, USNI News, Stars and Stripes, Air & Space Forces, The War Zone, Defense One, Army Times, Navy Times, Marine Corps Times, Defence Blog, Nextgov, C4ISRNET, etc.*).
  - **International (`#intl`)**: Global news agencies and international reporting (*BBC, Al Jazeera, DW, France 24, The Guardian, Euronews, Le Monde, Der Spiegel, TASS, SCMP, Japan Times, Kyiv Independent, etc.*).
  - **Vietnam (`#vn`)**: Major Vietnamese news outlets (*VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí, VietNamNet, VTV News, Báo Tin Tức, Người Lao Động, Sài Gòn Giải Phóng*).
- **100% English Interface**: Clean newspaper/wire-service inspired UI with light & dark mode support.
- **One-Click Live Fetch (`↻ Get News`)**: Fetch all 101 RSS feeds and rebuild clustered story data directly from the web UI without touching the terminal.
- **Export Stories to TXT (`⬇ Save to TXT`)**:
  - Select individual news stories via checkboxes or click **`⬇ Save to TXT`** on any section (or in the top header) to automatically select all stories in that section/view and download a `.txt` file.
  - Formatted cleanly with **1 story per line (`Title — Summary`) separated by 1 blank line**.
- **Coverage & Blindspot Analysis**:
  - Visual *Left / Center / Right* bias bar for every story cluster.
  - Dedicated **Blindspots** page (`#blindspots`) showing stories disproportionately covered by only one side of the spectrum.
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

1. **Cập nhật tin tức mới nhất (`↻ Get News`)**:
   - Bấm nút **`↻ Get News`** ở góc trên bên phải thanh điều hướng.
   - Server sẽ tự động quét 101 nguồn RSS, gom nhóm bài viết trùng chủ đề và tự động làm mới giao diện sau khi hoàn tất (~20–30 giây).
2. **Lưu tin tức ra file `.txt` (`⬇ Save to TXT`)**:
   - **Tích chọn thủ công**: Tích vào ô vuông ở góc trên bên phải các bản tin bạn muốn lấy, sau đó bấm **`⬇ Save to TXT (N)`**.
   - **Lưu nhanh toàn bộ mục**: Nếu chưa tích chọn tin nào, bấm **`⬇ Save to TXT`** ở đầu mỗi mục (*Top coverage*, *More stories*, *Single source only*) hoặc trên thanh Header để tự động tích chọn toàn bộ tin trong mục/trang đó và tải về file `.txt` (mỗi tin 1 dòng, cách nhau 1 dòng trống).
3. **Chuyển đổi chuyên mục**:
   - Chọn **US**, **US Military**, **International**, hoặc **Vietnam** trên thanh công cụ để xem tin tức theo từng khu vực/lĩnh vực.

---

## 📂 Cấu trúc thư mục

```text
GET-NEWS/
├── start-server.bat        # File click đúp để bật server & mở trình duyệt (Port 8001)
├── server.js               # Node HTTP server (phục vụ giao diện tĩnh + API POST /api/build)
├── pipeline/               # Bộ thu thập RSS & thuật toán gom nhóm bài viết (TF-IDF clustering)
│   ├── sources.json        # Danh sách 101 nguồn RSS (US, Military, International, Vietnam)
│   ├── fetch.js            # Tải và chuẩn hóa dữ liệu RSS/Atom
│   ├── cluster.js          # Gom nhóm các bài báo cùng chủ đề
│   └── build.js            # Điểm vào chạy pipeline tạo dữ liệu JSON
└── site/                   # Giao diện Web (HTML/CSS/ES Modules thuần)
    ├── index.html          # Khung giao diện chính
    ├── css/styles.css      # Giao diện phong cách báo chí + Dark/Light mode
    ├── js/                 # Logic hiển thị, tìm kiếm, lọc chuyên mục và xuất file TXT
    └── data/               # Dữ liệu JSON được sinh ra sau mỗi lần Get News
```

---

## 💻 Các lệnh CLI hữu ích

```bash
npm run build                        # Quét RSS và cập nhật dữ liệu vào site/data/ bằng dòng lệnh
npm test                             # Chạy unit test cho pipeline
node pipeline/tools/inspect.js us    # Kiểm tra kết quả gom nhóm tin tức (us | military | intl | vn)
node server.js                       # Chạy server tại http://localhost:8001
```
