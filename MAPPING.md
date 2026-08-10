# BẢN ĐỒ REFACTOR — Tách `app.js` thành 4 file

> Cập nhật: 2026-05-12 · Phục vụ Bước 1-4 của kế hoạch tách Hệ thống Quản trị số.
> File này = "hợp đồng" giữa thầy và Claude trước khi bóc code thật.

## 1. NGUYÊN TẮC PHÂN LOẠI

| Tiêu chí | Vào `core-shared.js` | Vào file riêng |
|----------|----------------------|----------------|
| Hàm dùng ≥ 2/3 trang | ✅ | ❌ |
| Dùng `localStorage`, fetch GAS | ✅ | ❌ |
| Render UI đặc thù 1 trang | ❌ | ✅ |
| State riêng của 1 module | ❌ | ✅ |

## 2. BẢN ĐỒ HÀM (4 nhóm)

### 🔧 `core-shared.js` — Dùng cho cả 3 trang HSS / KĐCL / ĐBCL (~600 dòng)

**Auth (lines 27-282 trong app.js gốc):**
- `_GV_WRITE_ACTIONS`, `_ADMIN_WRITE_ACTIONS` (action whitelist)
- `_authLevelForAction(action)`
- `getCU() / setCU(obj) / _cuLevel(cu)` — SSO mới qua tab Users
- `getAuthToken() / getAuthLevel() / _saveAuthToken() / _saveAuthLevel()` — legacy
- `_hasLevel(needLevel)`
- `setAuthToken / logoutSchool` (window)
- `_setAuthGateUI / _showAuthGate / _hideAuthGate / cancelAuthGate`
- `requireAuth(needLevel, callback, onCancel)` (window)
- `_authForAction(action)` (window)
- `submitAuthForm(ev)`

**Utils nhỏ:**
- `toggleMenu()` (417)
- `initials(name)` (422)
- `escapeHtml(s)` (428)
- `countLeaves(nodes)` (431)
- `_safeCell(v)` (2019)

**Data layer:**
- `fetchGAS(onOk, onFail, retries)` (2494) — JSONP fetcher
- `loadData()` (2526)
- `loadError(msg)` (2474)
- **MỚI cần thêm:** `getCachedData()` / `setCachedData()` — cache 5-10 phút trong sessionStorage để 3 trang không gọi API trùng

**Cross-page navigation:**
- `showQlcl(ev)` — link sang qlcl.html (4221)
- **MỚI cần thêm:** `goToHss()`, `goToKdcl()`, `goToDbcl()` — link giữa 3 trang

---

### 📋 `hss-app.js` — Trang Hồ sơ số (`index.html`) (~1500 dòng)

**Render HSS:**
- `renderStats()` (441)
- `renderCategories()` (474) — chỉ render NHÓM 1-9 (loại bỏ 10, 11)
- `renderLeaves(items)` / `renderSubgroup(g)` (489, 498)
- `loadHssStatusForPublic()` (571)
- `_hssLazyCheckFolders / _hssUpdateBadgesInPlace / _hssRefreshProgressBox` (619-711)
- `invalidateHssStatusCache` (window)
- `_hssFindLeaf / _hssShowDebug / _hssFmtDate / _hssEffectiveStatus / _hssNguoiPhuTrach / _hssCatStats`
- `renderLeavesTable / _hssTableShell / renderSubgroupTable / _renderSubgroupBody / _hssProgressBox`
- `hssCheckMissing` (window)
- `openCat(i) / closeDetail()`

**Catalog overview:**
- `openCatalogOverview / closeCatalogOverview / renderCatalogOverview / filterCatalogOverview`
- `_buildCatalogPrintHTML / printCatalogOverview / exportCatalogWord`

**Văn bản:**
- `openHeThongVanBan` (window)

**Teachers:**
- `teacherType / renderRoleFilter / renderTeacherLanding / enterTeacherRole / backToTeacherLanding`
- `_teacherCardHtml / _teacherSectionHtml / renderTeachers`
- `openTeacherDetail / closeTeacherDetail`

**Students:**
- `showGradeOverview / showClassesByGrade / openClass / closeStudents`
- `_refreshStudents / loadStudentsAuthed / renderStudents / toggleStudent`

**Guide:**
- `guideTab / openGuideOverview / closeGuideOverview`

**Hero/Carousel:**
- `renderAbout / renderCarousel`

**Admin (TẬP TRUNG ở đây — cần thầy XÁC NHẬN):**
- `_admGet / _admSet / _admPwd / openAdmin / closeAdmin / admDoLogin / admTab`
- Tab Thông tin: `admLoadInfo / admSaveInfo / admApplyConfig / _toMapEmbed / applyMapEmbed`
- Tab Hồ sơ số: `admLoadHSS / admRenderHSSTable / admHssEdit / admHssCommit / admHssLink / admHssDelete / admAddHSS / admFilterHSS / admSaveHSS`
- Tab Trạng thái HSS: `admHssStatusReload / admHssStatusRender / admHssStatusFilter / admHssStatusToggle / admHssStatusSavePT / admHssRescanDrive`
- Tab Quản lý HS: (gọi sang student admin)
- Tab Nhập dữ liệu: `_b64toBlob / _admMsgEl / admDownloadTemplate / _xlAddr / _xlSet / _buildStyledHSSheet / _buildStyledGVSheet / _admExportTemplateImpl / _admAssignPending / admHandleFile / _parseCSV / admPreviewUpload / admDoImport / admPostToGAS / _admVerifyAfterPost`
- Tab Mã trường: `admChangeAuthTokens / admTestConnection / _admUpdateApiUrlHint / admRefresh / admClearCache / admInitConfig / showUpgradeToast`

---

### 🏅 `kdcl-app.js` — Trang Kiểm định CL (`kdcl.html`) (~1500 dòng)

**Nhóm 10 (Kiểm định CL) trong HSS:** dữ liệu vẫn ở Sheet, chỉ thay đổi nơi RENDER. Hàm `renderCategories()` ở kdcl-app.js sẽ filter `cat.stt === 10`.

**Minh chứng (Danh mục 95 MC):**
- `openMCOverview / closeMCOverview`
- `_mcResolveTC / _mcResolveTchi / _mcGroupByTC / _mcCountLinked`
- `renderMCOverview / _mcStat / filterMCOverview`
- `mcJumpToHSS(hssCode)` — **CẦN ĐỔI**: thay vì scroll trong cùng trang, mở popup chi tiết HSS trong KĐCL (cần copy renderer HSS detail vào core-shared)
- `toggleLegalRefs / _mcLegalClose`

**Admin Minh chứng (tab "Minh chứng" của Admin):**
- `admLoadMC / admRenderMCTable / admFilterMC / admAddMC / admLoadMC_rerender / admDeleteMC / admSaveMC`
- `exportMCExcel`

**KĐCL bridge → React TĐG app (đã hoạt động):**
- `_buildSchoolInfoPayload / _buildEvidencePayload / _buildMinhChungTree / _buildHssDataPayload`
- `_loadScriptOnce / _setKdclBootText / _buildBridgePayload`
- `showKdcl / showHoso` (window)

**Admin tab "Minh chứng"** (R3 quyết định): để ở `kdcl.html`, hoặc giữ trong Admin tập trung ở HSS rồi link sang.

---

### 📊 `dbcl-app.js` — Trang Đảm bảo CL (`dbcl.html`) (~500 dòng — SẼ MỞ RỘNG)

**Hiện có (chuyển từ HSS nhóm 11):**
- Render danh sách hồ sơ ĐBCL (filter `cat.stt === 11`)

**MỚI — chờ văn bản thầy cấp để thiết kế:**
- Kế hoạch chất lượng năm
- Bộ phiếu khảo sát PH-HS-GV
- Sổ theo dõi cải tiến (Plan-Do-Check-Act)
- Dashboard KPI chất lượng
- Báo cáo định kỳ ĐBCL

---

### 📈 `qlcl-app.js` — GIỮ NGUYÊN

Không động vào. Chỉ thêm 1 link "← Về Quản trị số" (đã có "Về Trang chủ" sẵn).

---

## 3. CÁC ĐIỂM PHỤ THUỘC CẦN CHÚ Ý

1. **`MINHCHUNG` array** — đang là `let` trong scope app.js. Khi tách, phải đưa vào `core-shared.js` để cả HSS (admin) và KĐCL (render) cùng truy cập.

2. **`HSS / TEACHERS / CLASSES / IMAGES / STATS`** — tương tự MINHCHUNG, cần đưa vào core-shared làm singleton state, expose qua getters.

3. **`API_URL`** — đang inline trong index.html. Phải copy y nguyên 3 dòng đó sang `kdcl.html` và `dbcl.html`.

4. **Early-fetch JSONP** (lines 62-73 của index.html) — phải copy sang kdcl.html, dbcl.html. Nhưng cần thêm logic: nếu đã có `__earlyData` trong sessionStorage cache → dùng luôn, không fetch lại.

5. **Modal `authGate`** — markup HTML phải copy sang cả 3 trang (hoặc inject động bằng `core-shared.js` khi load).

## 4. THỨ TỰ TRIỂN KHAI

| Bước | Việc | Trạng thái |
|------|------|-----------|
| 0 | Backup + Copy workspace | ✅ XONG (2026-05-12) |
| 1a | Lập MAPPING.md | ✅ XONG (file này) |
| 1b | Bóc Auth + utils → `core-shared.js` (chưa xoá khỏi app.js) | ✅ XONG — 18 hàm auth + 5 utils |
| 1c | Bóc fetchGAS/loadData + cache + cross-nav vào core-shared | ✅ XONG — 26.3 KB · 476 dòng |
| 1d | Cập nhật index.html load thêm `core-shared.js`, xoá hàm trùng khỏi app.js, smoke test | ✅ XONG — thầy test 3/3 PASS (Admin · QLCL · KĐCL) |
| 1e | Xoá thật 250 dòng Auth comment block khỏi app.js | ✅ XONG — app.js: 276.6→266.4 KB |
| 2 | Tạo `kdcl.html` + `kdcl-app.js`, di chuyển nhóm 10 + MC | ✅ XONG — kdcl.html 397.6 KB, kdcl-app.js 56.9 KB |
| 3 | Tạo `dbcl.html` + `dbcl-app.js`, di chuyển nhóm 11 | ✅ XONG — minimal + 4 trụ cột ĐBCL từ văn bản trường |
| 4 | Dọn `index.html` (bỏ KĐCL/MC/nhóm 10-11), cập nhật nav 4 trang | ✅ XONG — partial (xem 4.3 dưới) |
| 4b | Cleanup app.js + index.html: xoá MC overview/Bridge/View-swap/tdgReactSource | ✅ XONG — app.js -28 KB, index.html -375 KB |
| 5 | Nav gọn (10→6 items) + chuyển "Hệ thống văn bản" vào hero | ✅ XONG |
| 6 | ĐBCL Phase 1 — 5 tab structure | ✅ XONG — 5 tab layout với pill-style nav |
| 7 | ĐBCL Phase 1.5 — tích hợp 16 phụ lục thực tế (bóc qua Word COM) | ✅ XONG — 11 thành viên + 9 phân công + 4 cam kết + chuẩn Lớp 5 |
| 8 | ĐBCL Phase 2 — backend dynamic (Code.gs + Sheet DBCL_To/PhuLuc) | ✅ XONG (chờ thầy deploy theo HUONG_DAN_DEPLOY_PHASE2_DBCL.md) |

### 4.3 — QUYẾT ĐỊNH KỸ THUẬT TRONG BƯỚC 3 + 4

**Bước 3 (dbcl.html minimal):**
- Đọc folder `D:\ChungTrT_Drive\HSS2026\TH_DIENLIEN_ADMIN\10. Đảm bảo chất lượng\Năm học 2025-2026\10.1. Hệ thống văn bản\` thầy cấp → có **10 văn bản gốc** (5 PDF + 5 DOCX) đã ban hành.
- Phân loại thành **4 trụ cột ĐBCL** của trường:
  1. **Cam kết ĐBCL** (1 văn bản)
  2. **Chuẩn đầu ra** (4 văn bản: QĐ ban hành, Bảng công khai, Hồ sơ, BB giao lớp 5)
  3. **Kiểm tra giám sát** (2 văn bản: Kế hoạch + Biên bản)
  4. **Báo cáo TĐG ĐBCL** (3 văn bản: BC TĐG, BB Hội nghị, BB họp HT-PH)
- `dbcl-app.js` render 2 chế độ:
  - Nếu Sheet HSS có nhóm 11 (đã nhập qua Admin) → render danh mục bình thường
  - Nếu nhóm 11 trống → hiện **khung 4 trụ cột** với danh sách 10 file thầy cần nhập (hướng dẫn workflow)

**Bước 4 (dọn index.html — partial, chỉ HTML/CSS, không động app.js logic):**
- ✅ Nav 4 trang: Hồ sơ số · Kiểm định CL 🏅 · Đảm bảo CL 📊 · QL Chất lượng 📈
- ✅ Mobile menu cập nhật tương ứng
- ✅ 2 rec-dual button đổi: "Sang trang Kiểm định CL" + "Sang trang Đảm bảo CL" (thay cho KĐCL bridge + MC overview cũ)
- ✅ Footer link cập nhật
- ✅ `renderCategories()` filter chỉ render 9 nhóm (cat.stt < 10)
- ✅ `renderCatalogOverview()` filter chỉ liệt kê 9 nhóm
- ✅ `openCat(origIdx)` dùng index gốc HSS, tránh sai khi click sau filter
- ⚠ **GIỮ NGUYÊN trong app.js** (chưa xoá): MC functions (1553-2032), Bridge IIFE (3529-3724), View-swap IIFE (3726-3833), `#view-kdcl` markup, `tdgReactSource` script, `mcOverlay` markup. Lý do: Admin tab "Minh chứng" + admin có thể vẫn dùng nội bộ; xoá ngay sẽ phá nhiều chỗ. Sẽ cleanup ở Bước 4b sau khi test ổn.

### 4.4 — TỔNG KẾT FILE SAU REFACTOR

| File | Trạng thái | Size |
|------|-----------|------|
| `core-shared.js` | MỚI | 26.8 KB |
| `kdcl-app.js` | MỚI | 56.9 KB |
| `dbcl-app.js` | MỚI | 8.4 KB |
| `kdcl.html` | MỚI | 397.6 KB |
| `dbcl.html` | MỚI | 16.5 KB |
| `app.js` | Đã refactor + cleanup 4b | **239.1 KB** (gốc 285.3 KB · giảm 16%) |
| `index.html` | Đã dọn + cleanup 4b | **153 KB** (gốc 527.6 KB · giảm **71%**) |
| `qlcl.html` + `qlcl-app.js` | Không đổi | 46.8 + 260.9 KB |
| `Code.gs` | Không đổi | 245.5 KB |
| **THDienLien GỐC** | **0 file thay đổi** ✅ | 3305 KB |

### 4.2 — QUYẾT ĐỊNH KỸ THUẬT TRONG BƯỚC 2

- **kdcl.html** = trang KĐCL độc lập, chứa: nav 4 trang · authGate · hero KĐCL · 2 cổng (Mở Minh chứng + Mở TĐG) · mcOverlay (95 MC) · view-kdcl (TĐG React app) · footer.
- **`tdgReactSource`** (~6033 dòng React JSX) copy nguyên từ index.html sang kdcl.html. Không tách thành file `.js` riêng vì script type='text/tdg-react-source' yêu cầu inline để Babel scan.
- **kdcl-app.js** = 5 phần: BOOT riêng + Block A (constants) + Block B (28 hàm MC) + Block C (4 builder bridge) + Block D (showKdcl/showHoso/loadKdclLibs) + Phần E (override `mcJumpToHSS` mở `index.html#records` ở tab mới + `showHoso` điều hướng sang index.html thay vì toggle class).
- **Các hàm `admLoadMC/admSaveMC/admAddMC/...`** vẫn nằm trong kdcl-app.js Block B (declarations) nhưng KHÔNG được gọi từ DOM kdcl.html → không có lỗi runtime. Khi Bước 4 dọn xong, có thể xoá các hàm Admin MC khỏi cả 2 nơi (Admin tập trung ở index.html). Tạm để cho an toàn.
- **`index.html` chưa bị động trong Bước 2** — nhóm 10 + MC vẫn ở cả 2 nơi (index.html + kdcl.html). Bước 4 mới dọn index.html. Lúc đó cả 2 trang dùng chung Sheet data → không vấn đề duplicate render data.

### 4.1 — QUYẾT ĐỊNH KỸ THUẬT TRONG BƯỚC 1c (cần thầy biết)

- **Hàm `boot(data, isCache)` KHÔNG đưa vào core-shared**. Vì `boot` chứa render UI khác nhau ở mỗi trang (HSS render carousel + categories + teachers, KĐCL render MC + group 10, ĐBCL render group 11). Mỗi trang sẽ có hàm `boot` riêng.
- **Core-shared expose `loadDataShared(bootCallback)`** thay vì `loadData()` cũ. Trang chỉ cần gọi `loadDataShared(myBoot)` với hàm `boot` của mình. Logic cache + early-fetch + fallback giữ nguyên 1:1.
- **`CACHE_KEY = 'thMau_data'` giữ nguyên** — backwards-compat với localStorage người dùng đã có (không phải xoá dữ liệu cũ khi triển khai).
- **`window.showQlcl` giữ tên cũ** — backwards-compat với `onclick="showQlcl(event)"` đã có trong index.html. Thêm alias `goToQlcl` cho nhất quán bộ tên mới.

## 5. CÂU HỎI CẦN THẦY DUYỆT

- [ ] **Admin tập trung ở `index.html`** (hay tách Admin thành trang `admin.html` riêng)?
- [ ] **Tên 4 trang trên thanh nav**: "Hồ sơ số · Kiểm định CL · Đảm bảo CL · Quản lý CL" — đúng chưa?
- [ ] **Văn bản về Đảm bảo CL** — thầy gửi giúp để Bước 3 thiết kế đúng module dbcl.
- [ ] **MAPPING này** đã đúng phân loại chưa? Có hàm nào thầy muốn đưa khác nhóm không?
