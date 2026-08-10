// ════════════════════════════════════════════════════════════════════
// background.js — HSS Sync v2 Service Worker
// Nhận lệnh từ QLCL → fetch data → tạo Excel → upload tự động
// ════════════════════════════════════════════════════════════════════

importScripts('./lib/xlsx.min.js');

// ─── Lắng nghe message từ QLCL (externally_connectable) ────────────
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'ping') {
    sendResponse({ ok: true, version: '2.0' });
    return;
  }

  if (msg.action === 'uploadToMOET') {
    handleUploadToMOET(msg, sendResponse);
    return true; // async response
  }
});

// ─── Lắng nghe progress từ content script ───────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'saveScanResult') {
    chrome.storage.local.set({ lastScan: msg.data });
  }
  return true;
});

// ════════════════════════════════════════════════════════════════════
// Handler chính: nhận yêu cầu upload, điều phối toàn bộ luồng
// ════════════════════════════════════════════════════════════════════
async function handleUploadToMOET(msg, sendResponse) {
  try {
    const { apiUrl, khoi, ky } = msg;

    // ─── BƯỚC 1: Lấy dữ liệu từ Apps Script ─────────────────────────
    const url = `${apiUrl}?action=getKetQuaMOET&khoi=${khoi}&ky=${ky}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) {
      sendResponse({ step: 'error', msg: json.message || 'Apps Script lỗi', ok: false });
      return;
    }

    const students = json.data || [];
    if (students.length === 0) {
      sendResponse({ step: 'error', msg: `Không có học sinh khối ${khoi} kỳ ${ky}`, ok: false });
      return;
    }

    // ─── BƯỚC 2: Tạo Excel base64 ───────────────────────────────────
    const xlsxBase64 = buildMOETExcel(students, khoi, ky);

    // ─── BƯỚC 3: Tìm/mở tab CSDL ngành ──────────────────────────────
    const IMPORT_URL = 'https://truong.csdl.moet.gov.vn/C1/KetQuaHocTapImportExcel.aspx';
    let tab = null;

    const existingTabs = await chrome.tabs.query({
      url: 'https://truong.csdl.moet.gov.vn/*'
    });

    if (existingTabs.length > 0) {
      tab = existingTabs[0];
      if (!tab.url.includes('KetQuaHocTapImportExcel')) {
        await chrome.tabs.update(tab.id, { url: IMPORT_URL });
        await sleep(3000);
      }
    } else {
      tab = await chrome.tabs.create({ url: IMPORT_URL });
      await sleep(4000);
    }

    await chrome.tabs.update(tab.id, { active: true });
    await sleep(500);

    // ─── BƯỚC 4: Gửi file cho content script ────────────────────────
    const fileName = `MOET_K${khoi}_${ky}_${today()}.xlsx`;

    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'injectAndUpload',
      fileBase64: xlsxBase64,
      fileName: fileName,
      khoi: khoi,
      ky: ky,
      studentCount: students.length
    });

    // ─── BƯỚC 5: Báo kết quả ────────────────────────────────────────
    sendResponse({
      step: result?.ok ? 'done' : 'error',
      msg: result?.message || 'Upload hoàn tất',
      khoi: khoi,
      count: students.length,
      ok: result?.ok ?? false
    });
  } catch (err) {
    sendResponse({ step: 'error', msg: err.message, ok: false });
  }
}

// ════════════════════════════════════════════════════════════════════
// buildMOETExcel: Tạo file Excel 35 cột đúng format MOET
// Trả về base64 string để truyền qua message tới content script
// ════════════════════════════════════════════════════════════════════
function buildMOETExcel(students, khoi, ky) {
  const wb = XLSX.utils.book_new();

  // ─── HEADER 3 TẦNG ──────────────────────────────────────────────────
  const H1 = [
    'STT', 'Mã lớp', 'Mã học sinh', 'Họ tên', 'Ngày sinh',
    'Môn học và hoạt động giáo dục', '', '', '', '', '', '', '', '', '', '', '', '',
    'Năng lực cốt lõi', '', '', '', '', '', '', '',
    'Phẩm chất chủ yếu', '', '', '', '',
    'Hoàn thành\nchương trình lớp học', 'Lên lớp', 'Xếp loại', ''
  ];
  const H2 = [
    '', '', '', '', '',
    'Toán', '', 'Tiếng việt', '', 'Đạo đức',
    'Tự nhiên và xã hội', 'Ngoại ngữ', 'Tiếng dân tộc',
    'TH-CN (Tin học)', 'Nghệ thuật (Âm nhạc)', 'Nghệ thuật (Mĩ thuật)',
    'Hoạt động trải nghiệm', 'Giáo dục thể chất',
    'Năng lực chung', '', '',
    'Năng lực đặc thù', '', '', '', '',
    'Yêu nước', 'Nhân ái', 'Chăm chỉ', 'Trung thực', 'Trách nhiệm',
    '', '', '', ''
  ];
  const H3 = [
    '', '', '', '', '',
    'Mức đạt được', 'Điểm KTĐK',
    'Mức đạt được', 'Điểm KTĐK',
    'Mức đạt được', 'Mức đạt được', 'Mức đạt được', 'Mức đạt được',
    'Mức đạt được', 'Mức đạt được', 'Mức đạt được', 'Mức đạt được', 'Mức đạt được',
    'Tự chủ và tự học', 'Giao tiếp và hợp tác', 'Giải quyết vấn đề và sáng tạo',
    'Ngôn ngữ', 'Tính toán', 'Khoa học', 'Thẩm mĩ', 'Thể chất',
    '', '', '', '', '',
    '', '', '', ''
  ];

  // ─── DỮ LIỆU ─────────────────────────────────────────────────────────
  const rows = [H1, H2, H3];

  students.forEach((s, idx) => {
    const g = s.grades || {};

    const v = key =>
      (g[key] !== undefined && g[key] !== null) ? String(g[key]) : '';

    const d = key => {
      const num = parseFloat(g[key]);
      return (!isNaN(num) && num >= 1 && num <= 10) ? num : '';
    };

    const x = key => {
      const val = v(key).toLowerCase();
      return (val === 'x' || val === '1' || val === 'true') ? 'x' : '';
    };

    rows.push([
      s.stt || idx + 1,                   // A: STT
      s.maLop || '',                       // B: Mã lớp
      s.maHS || '',                        // C: Mã học sinh MOET
      s.hoTen || '',                       // D: Họ tên
      s.ngaySinh || '',                    // E: Ngày sinh
      v('mon_Toán'),                       // F: Toán mức đạt
      d('diem_Toán'),                      // G: Toán điểm
      v('mon_Tiếng_việt'),                 // H: TV mức đạt
      d('diem_Tiếng_việt'),                // I: TV điểm
      v('mon_Đạo_đức'),                    // J: Đạo đức
      v('mon_Tự_nhiên_và_xã_hội'),         // K: TN&XH
      v('mon_Ngoại_ngữ'),                  // L: Ngoại ngữ
      v('mon_Tiếng_dân_tộc'),              // M: Tiếng dân tộc
      v('mon_TH-CN_Tin_học'),              // N: Tin học
      v('mon_Nghệ_thuật_Âm_nhạc'),         // O: Âm nhạc
      v('mon_Nghệ_thuật_Mĩ_thuật'),        // P: Mĩ thuật
      v('mon_Hoạt_động_trải_nghiệm'),      // Q: HĐTN
      v('mon_Giáo_dục_thể_chất'),          // R: Thể chất
      v('nl_Tự_chủ_và_tự_học'),            // S: NL Tự chủ (T/Đ/C)
      v('nl_Giao_tiếp_và_hợp_tác'),        // T: NL Giao tiếp
      v('nl_Giải_quyết_vấn_đề_và_sáng_tạo'),// U: NL GQVĐ
      v('nl_Ngôn_ngữ'),                    // V: NL Ngôn ngữ
      v('nl_Tính_toán'),                   // W: NL Tính toán
      v('nl_Khoa_học'),                    // X: NL Khoa học
      v('nl_Thẩm_mĩ'),                     // Y: NL Thẩm mĩ
      v('nl_Thể_chất'),                    // Z: NL Thể chất
      v('pc_Yêu_nước'),                    // AA: PC Yêu nước
      v('pc_Nhân_ái'),                     // AB: PC Nhân ái
      v('pc_Chăm_chỉ'),                    // AC: PC Chăm chỉ
      v('pc_Trung_thực'),                  // AD: PC Trung thực
      v('pc_Trách_nhiệm'),                 // AE: PC Trách nhiệm
      x('hoanThanh'),                      // AF: Hoàn thành CT
      x('lenLop'),                         // AG: Lên lớp
      v('xepLoai'),                        // AH: Xếp loại
      ''                                    // AI: Trống
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 5 }, { wch: 6 }, { wch: 13 }, { wch: 22 }, { wch: 11 },
    ...Array(29).fill({ wch: 8 }),
    { wch: 5 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}

// ════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
