# HƯỚNG DẪN DEPLOY ĐBCL PHASE 2 — Tự cập nhật Tổ + Phụ lục từ Google Sheet

> Cập nhật: 2026-05-12 · Sau Phase 2 build xong code
> Mục tiêu: Thầy chỉ sửa Sheet → trang `dbcl.html` tự cập nhật, không cần đụng code.

## ⚠ Lưu ý quan trọng
- Trước khi deploy: trang `dbcl.html` đang chạy với data **hardcoded** (11 thành viên + 16 phụ lục).
- Sau deploy: trang **ưu tiên data từ Sheet**, fallback hardcoded nếu Sheet trống.
- Có thể chạy parallel — nếu Sheet trống, không có gì thay đổi.

## Bước 1: Tạo 2 sheet mới trong Google Sheet (~3 phút)

Mở Google Sheet đang dùng (`THDienLien_05.2026.gsheet`) → tạo 2 tab mới:

### 📋 Sheet "DBCL_To" (4 cột) — Tổ Đảm bảo Chất lượng

| STT | Họ và tên | Chức vụ | Vai trò |
|-----|-----------|---------|---------|
| 1 | Nguyễn Thị Hòa | Hiệu trưởng | Tổ trưởng |
| 2 | Trần Thanh Chung | Phó Hiệu trưởng | Tổ phó |
| 3 | Tăng Thị Tú | Thư ký Hội đồng | Thư ký |
| 4 | Tăng Thị Hương Giang | Tổ trưởng CM 1,2,3 | Thành viên |
| 5 | Cao Thị Hòe | Tổ phó CM 1,2,3 | Thành viên |
| 6 | Nguyễn Thị Hòa | Tổ trưởng CM 4,5 | Thành viên |
| 7 | Cao Thị Thanh Hương | Tổ phó CM 4,5 | Thành viên |
| 8 | Nguyễn Thị Kim Oanh | GV TPT Đội | Thành viên |
| 9 | Nguyễn Thị Luyến | GV Tiếng Anh | Thành viên |
| 10 | Nguyễn Thị Hà | NV TVTB | Thành viên |
| 11 | Phan Thị Hạnh | NV Kế toán | Thành viên |

> **Vai trò hợp lệ**: `Tổ trưởng` · `Tổ phó` · `Thư ký` · `Thành viên` (FE color-code đúng từng vai trò)

### 📑 Sheet "DBCL_PhuLuc" (4 cột) — 16 Phụ lục ĐBCL

| Số PL | Tên | Loại | Link Drive |
|-------|-----|------|------------|
| 1 | Thực trạng nhà trường 2025-2026 | data | *(dán URL Drive)* |
| 2 | Chuẩn đầu ra chất lượng học tập 2025-2026 | standard | |
| 3 | Nâng cao chất lượng CBQL, GV, NV (37 người) | data | |
| 4 | Nâng cao cơ sở vật chất, trang thiết bị (83,5 triệu) | plan | |
| 5 | Kết quả học tập, rèn luyện 2024-2025 | data | |
| 6 | Phiếu khảo sát Phụ huynh đối với GV | survey | |
| 7 | Phiếu khảo sát GV về chất lượng HS | survey | |
| 8 | Bộ tiêu chí đánh giá Chương trình GD (5 mục) | survey | |
| 9 | Phiếu đánh giá CBQL trường PT — HK1 | survey | |
| 10 | ⭐ QĐ thành lập Tổ ĐBCL (96/QĐ-THDL · 20/9/2025) | decision | |
| 11 | Phân công nhiệm vụ Tổ ĐBCL (9 nhóm) | plan | |
| 12 | Bìa + Danh sách & Chữ ký Tổ ĐBCL | cover | |
| 13 | Kế hoạch Đảm bảo Chất lượng 2025-2026 | plan | |
| 14 | Dự toán kinh phí ĐBCL (9,7 triệu) | budget | |
| 15 | Bản cam kết GV chủ nhiệm + GV chuyên (2 mẫu) | commit | |
| 16 | Bản cam kết HT với UBND xã Quảng Châu | commit | |

> **Loại hợp lệ**: `data` · `standard` · `plan` · `survey` · `decision` · `cover` · `budget` · `commit` (FE hiển thị badge màu khác nhau)
> **Link Drive**: Để trống nếu chưa upload — FE sẽ alert hướng dẫn. Khi có link → click "📂" mở thẳng.

## Bước 2: Upload folder phụ lục lên Drive (~5 phút)

1. Vào Google Drive → tạo folder `THDL · ĐBCL · 2025-2026 · 10.2 Phụ lục`
2. Upload toàn bộ 16 file từ `D:\ChungTrT_Drive\HSS2026\TH_DIENLIEN_ADMIN\10. Đảm bảo chất lượng\Năm học 2025-2026\10.2. Phụ lục ĐBCL\`
3. Mỗi file → click chuột phải → **Share** → "Anyone with the link" → Copy link
4. Paste vào cột "Link Drive" của Sheet "DBCL_PhuLuc" (đúng số PL)

**Mẹo nhanh**: chỉ cần share **folder**, copy link folder, paste vào TẤT CẢ rows. Khi click trong dbcl.html sẽ mở folder → chọn file. Nhược: nhiều click hơn nhưng không cần copy 16 link riêng.

## Bước 3: Deploy Code.gs lên Apps Script (~3 phút)

1. Mở Google Apps Script project hiện tại của trường
2. Mở file `Code.gs` (hoặc file chứa `getAllData`)
3. Copy nội dung từ: `D:\…\Hệ thống quản trị số\THDienLien\Code.gs` → paste đè
4. **Save** (Ctrl+S)
5. **Deploy** → "Manage deployments" → bút chì sửa deployment hiện tại → Version: "New version" → mô tả: "ĐBCL Phase 2 — Tổ + Phụ lục" → **Deploy**
6. URL Apps Script GIỮ NGUYÊN (không thay đổi) → frontend không cần cập nhật

## Bước 4: Test

1. Mở `dbcl.html` trong browser
2. Hard refresh (Ctrl+F5) để tránh cache
3. F12 → Console → gõ: `window.DBCL_FROM_BACKEND` → phải trả `true` (xác nhận đọc từ Sheet)
4. Tab "🏛 Tổ ĐBCL" → hiện đúng 11 thành viên (nếu sửa Sheet, refresh thấy ngay)
5. Tab "📊 Chỉ tiêu & Báo cáo" → click button "📂" của 1 phụ lục có Link Drive → mở Drive trực tiếp

## Cách thầy SỬA hằng ngày sau này

| Việc | Làm gì |
|------|--------|
| Đổi thành viên Tổ ĐBCL | Sửa Sheet "DBCL_To" → refresh dbcl.html |
| Bổ sung link Drive cho phụ lục | Sửa cột "Link Drive" trong Sheet "DBCL_PhuLuc" → refresh |
| Thêm phụ lục mới | Insert row mới vào "DBCL_PhuLuc" → tự hiện trong bảng |
| Đổi vai trò thành viên | Sửa cột "Vai trò" (Tổ trưởng/Tổ phó/Thư ký/Thành viên) → tự đổi badge màu |

## Cache Apps Script

Backend cache 5 phút (`CacheService.put('allData', json, 300)`). Sau khi sửa Sheet, có thể chờ 5 phút HOẶC:
- Mở URL Apps Script với `?nocache=1` để xoá cache
- VD: `https://script.google.com/macros/s/.../exec?nocache=1&action=all&callback=cb`

## Rollback

Nếu deploy lỗi → vào "Manage deployments" → chọn version cũ → Active. URL không đổi.

---

## Tóm tắt thay đổi Code.gs (3 chỗ)

1. **Thêm 2 hằng số + 2 function** (cuối SECTION 1, trước SECTION 3 — line ~3198):
   - `SHEET_DBCL_TO = 'DBCL_To'`
   - `SHEET_DBCL_PHULUC = 'DBCL_PhuLuc'`
   - `function getDbclTo()` — đọc Sheet → array
   - `function getDbclPhuLuc()` — đọc Sheet → array

2. **Thêm vào `getAllData()` bundle** (line ~3134):
   - `var dbclTo = getDbclTo();`
   - `var dbclPhuLuc = getDbclPhuLuc();`
   - Trong `result`: `dbcl: { to: dbclTo, phuluc: dbclPhuLuc }`

3. **Thêm action routing** (line ~1726):
   - `case 'dbclTo': data = getDbclTo(); break;`
   - `case 'dbclPhuLuc': data = getDbclPhuLuc(); break;`
