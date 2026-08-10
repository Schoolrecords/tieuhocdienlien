/*
============================================================================
 kdcl-app.js — Logic chính của trang Kiểm định Chất lượng (kdcl.html)
============================================================================
 Tách từ app.js (Refactor 2026-05-12 · Bước 2 của kế hoạch tách Hệ thống
 Quản trị số). Trang kdcl.html load theo thứ tự:
   1. core-shared.js  (Auth, utils, fetchGAS, loadDataShared, cross-nav)
   2. kdcl-app.js     (file này — MC + KĐCL bridge + boot riêng)

 Chứa:
   • Hằng số: DEFAULT_MC_FULL (95 MC), TC_NAMES, TCHI_NAMES, TC_META, TC_ORDER
   • State: HSS, TEACHERS, CLASSES, IMAGES, MINHCHUNG, STATS — set ở boot
   • Hàm Minh chứng: openMCOverview, renderMCOverview, mcJumpToHSS, …
   • Hàm Admin Minh chứng: admLoadMC, admSaveMC, exportMCExcel, …
   • IIFE Bridge: _buildSchoolInfoPayload, _buildEvidencePayload, …
   • IIFE View-swap: _loadScriptOnce, showKdcl, showHoso, …
   • Hàm boot riêng cho KĐCL — render MC + auto-mở KĐCL view

 Phụ thuộc DOM (kdcl.html phải có):
   • #loadScreen, #authGate (modal đăng nhập)
   • #mc-overview-section, #mcOverlay  (Danh mục Minh chứng)
   • #view-kdcl, #tdgReactSource       (KĐCL TĐG React app container)

 Phụ thuộc globals (kdcl.html khai báo trong <head>):
   • const API_URL = '...';  (Apps Script URL)
   • IIFE __earlyData (early-fetch JSONP)
============================================================================
*/

/* ───── BOOT KĐCL — set state + render MC + (tuỳ chọn) auto-mở KĐCL view ───── */

  // mcJumpToHSS gốc scroll trong cùng trang. Khi tách, hồ sơ HSS không có ở kdcl.html
  // → mở index.html#records ở tab mới (override hàm sau khi extract).
  function _kdclMcJumpToHSS(hssCode){
    if (!hssCode) return;
    var url = 'index.html#records';
    window.open(url, '_blank');
  }

  function boot(data, isCache){
    // Set globals — KĐCL bridge cần đọc HSS/TEACHERS/CLASSES/MINHCHUNG/STATS
    window.HSS = data.hss || [];
    window.TEACHERS = data.teachers || [];
    window.CLASSES = data.classes || [];
    window.IMAGES = data.images || [];
    // Fallback DEFAULT_MC_FULL nếu sheet < 90 MC (giữ nguyên logic app.js)
    window.MINHCHUNG = (data.minhchung && data.minhchung.length >= 90)
                        ? data.minhchung
                        : DEFAULT_MC.slice();
    window.STATS = data.stats || {};

    // Local refs để các hàm extract từ app.js dùng được trực tiếp
    HSS = window.HSS;
    TEACHERS = window.TEACHERS;
    CLASSES = window.CLASSES;
    IMAGES = window.IMAGES;
    MINHCHUNG = window.MINHCHUNG;
    STATS = window.STATS;

    // Render thông tin trường vào header
    var nm = document.getElementById('navSchoolName');
    if (nm && STATS.config && STATS.config.name) nm.textContent = STATS.config.name;
    var hd = document.getElementById('kdclSchoolName');
    if (hd && STATS.config && STATS.config.name) hd.textContent = STATS.config.name;

    // Cập nhật badge số liệu
    var elMC = document.getElementById('kdclMcCount'); if (elMC) elMC.textContent = MINHCHUNG.length;
    var elTC = document.getElementById('kdclTcCount'); if (elTC) elTC.textContent = '5';
    var elTchi = document.getElementById('kdclTchiCount'); if (elTchi) elTchi.textContent = '17';

    // Tắt loading screen
    var ls = document.getElementById('loadScreen');
    if (ls) { ls.classList.add('done'); setTimeout(function(){ ls.remove(); }, 500); }

    // Refresh ngầm sau khi bật cache
    if (isCache) {
      fetchGAS(function(freshData){
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: freshData})); } catch(e){}
        boot(freshData, false);
      }, function(){});
    }
  }

  // Wire button "Mở Hệ thống TĐG" — gọi showKdcl (định nghĩa ở Phần 3 IIFE bên dưới)
  window.addEventListener('DOMContentLoaded', function(){
    var btnOpen = document.getElementById('btnOpenTDG');
    if (btnOpen) btnOpen.addEventListener('click', function(ev){ if (window.showKdcl) window.showKdcl(ev); });
    var btnMC = document.getElementById('btnOpenMC');
    if (btnMC) btnMC.addEventListener('click', function(){ if (window.openMCOverview) window.openMCOverview(); });
  });

/* ============================================================================
   PHẦN A · CONSTANTS — DEFAULT_MC_FULL (95 MC) + TC/TCHI names
   Bóc từ app.js lines 37-140 + 1517-1551 (Refactor 2026-05-12 · Bước 2)
   ============================================================================ */
  const DEFAULT_MC_TEMPLATE_RAW = [
    /* Đã xoá 95 MC mẫu. Trường mới tự nhập qua Admin → Excel. */
  ];
  const DEFAULT_MC_FULL = [
  {stt:1,tc:"TC1",tchi:"1.1",code:"[H1-1.1-01]",name:"KH chiến lược phát triển nhà trường",issued:"",issuer:"",hssCode:"1.1.2",link:"",note:""},
  {stt:2,tc:"TC1",tchi:"1.1",code:"[H1-1.1-02]",name:"KH giáo dục nhà trường hàng năm",issued:"",issuer:"",hssCode:"1.1.1",link:"",note:""},
  {stt:3,tc:"TC1",tchi:"1.1",code:"[H1-1.1-03]",name:"NQ Đại hội Đảng bộ/Chi bộ về phát triển NT",issued:"",issuer:"",hssCode:"6.1",link:"",note:""},
  {stt:4,tc:"TC1",tchi:"1.1",code:"[H1-1.1-04]",name:"NQ Hội đồng trường về chiến lược phát triển",issued:"",issuer:"",hssCode:"1.2.1",link:"",note:""},
  {stt:5,tc:"TC1",tchi:"1.1",code:"[H1-1.1-05]",name:"BB rà soát chiến lược phát triển NT",issued:"",issuer:"",hssCode:"1.10.1",link:"",note:""},
  {stt:6,tc:"TC1",tchi:"1.1",code:"[H1-1.1-06]",name:"KH duy trì XD trường chuẩn Quốc gia",issued:"",issuer:"",hssCode:"1.1.3",link:"",note:""},
  {stt:7,tc:"TC1",tchi:"1.1",code:"[H1-1.1-07]",name:"BC tiến độ XD trường chuẩn Quốc gia",issued:"",issuer:"",hssCode:"1.10.3",link:"",note:""},
  {stt:8,tc:"TC1",tchi:"1.1",code:"[H1-1.1-08]",name:"BB họp HĐ trường, hội nghị VC-NLĐ",issued:"",issuer:"",hssCode:"1.7.3",link:"",note:""},
  {stt:9,tc:"TC1",tchi:"1.1",code:"[H1-1.1-09]",name:"BC sơ kết, tổng kết năm học",issued:"",issuer:"",hssCode:"1.10.1",link:"",note:""},
  {stt:10,tc:"TC1",tchi:"1.2",code:"[H1-1.2-01]",name:"QĐ thành lập Hội đồng trường",issued:"",issuer:"",hssCode:"1.4.2",link:"",note:""},
  {stt:11,tc:"TC1",tchi:"1.2",code:"[H1-1.2-02]",name:"QĐ thành lập HĐ TĐ-KT",issued:"",issuer:"",hssCode:"1.4.2",link:"",note:""},
  {stt:12,tc:"TC1",tchi:"1.2",code:"[H1-1.2-03]",name:"QĐ thành lập HĐ chấm SKKN",issued:"",issuer:"",hssCode:"1.4.2",link:"",note:""},
  {stt:13,tc:"TC1",tchi:"1.2",code:"[H1-1.2-04]",name:"NQ của Hội đồng trường",issued:"",issuer:"",hssCode:"1.2.2",link:"",note:""},
  {stt:14,tc:"TC1",tchi:"1.2",code:"[H1-1.2-05]",name:"BB họp các Hội đồng",issued:"",issuer:"",hssCode:"1.7.3",link:"",note:""},
  {stt:15,tc:"TC1",tchi:"1.2",code:"[H1-1.2-06]",name:"QC hoạt động Hội đồng trường",issued:"",issuer:"",hssCode:"1.3.3",link:"",note:""},
  {stt:16,tc:"TC1",tchi:"1.3",code:"[H1-1.3-01]",name:"NQ Chi bộ các tháng, năm",issued:"",issuer:"",hssCode:"6.1",link:"",note:""},
  {stt:17,tc:"TC1",tchi:"1.3",code:"[H1-1.3-02]",name:"BB họp Chi ủy, Chi bộ",issued:"",issuer:"",hssCode:"6.3",link:"",note:""},
  {stt:18,tc:"TC1",tchi:"1.3",code:"[H1-1.3-03]",name:"BC hoạt động Chi bộ",issued:"",issuer:"",hssCode:"6.4",link:"",note:""},
  {stt:19,tc:"TC1",tchi:"1.3",code:"[H1-1.3-04]",name:"KH hoạt động Công đoàn",issued:"",issuer:"",hssCode:"1.7.1",link:"",note:""},
  {stt:20,tc:"TC1",tchi:"1.3",code:"[H1-1.3-05]",name:"KH hoạt động Đội, Sao nhi đồng",issued:"",issuer:"",hssCode:"7.1",link:"",note:""},
  {stt:21,tc:"TC1",tchi:"1.3",code:"[H1-1.3-06]",name:"BB, BC hoạt động Đội",issued:"",issuer:"",hssCode:"7.2",link:"",note:""},
  {stt:22,tc:"TC1",tchi:"1.4",code:"[H1-1.4-01]",name:"QĐ bổ nhiệm HT, PHT",issued:"",issuer:"",hssCode:"1.4.1",link:"",note:""},
  {stt:23,tc:"TC1",tchi:"1.4",code:"[H1-1.4-02]",name:"QĐ thành lập Tổ CM, Tổ VP",issued:"",issuer:"",hssCode:"1.7.1",link:"",note:""},
  {stt:24,tc:"TC1",tchi:"1.4",code:"[H1-1.4-03]",name:"QĐ phân công nhiệm vụ CB, GV, NV",issued:"",issuer:"",hssCode:"1.4.1",link:"",note:""},
  {stt:25,tc:"TC1",tchi:"1.4",code:"[H1-1.4-04]",name:"Sơ đồ tổ chức nhà trường",issued:"",issuer:"",hssCode:"1.7.1",link:"",note:""},
  {stt:26,tc:"TC1",tchi:"1.4",code:"[H1-1.4-05]",name:"KH & BB sinh hoạt chuyên môn",issued:"",issuer:"",hssCode:"3.2.1",link:"",note:""},
  {stt:27,tc:"TC1",tchi:"1.4",code:"[H1-1.4-06]",name:"Sổ ghi chép hoạt động Tổ CM",issued:"",issuer:"",hssCode:"3.2.3",link:"",note:""},
  {stt:28,tc:"TC1",tchi:"1.5",code:"[H1-1.5-01]",name:"KH bồi dưỡng CMNV cho CB, GV, NV",issued:"",issuer:"",hssCode:"2.2.2",link:"",note:""},
  {stt:29,tc:"TC1",tchi:"1.5",code:"[H1-1.5-02]",name:"Hồ sơ phát động thi đua",issued:"",issuer:"",hssCode:"1.8.1",link:"",note:""},
  {stt:30,tc:"TC1",tchi:"1.5",code:"[H1-1.5-03]",name:"Hồ sơ xét khen thưởng GV, NV",issued:"",issuer:"",hssCode:"1.8.2",link:"",note:""},
  {stt:31,tc:"TC1",tchi:"1.5",code:"[H1-1.5-04]",name:"Hồ sơ SKKN",issued:"",issuer:"",hssCode:"1.8.4",link:"",note:""},
  {stt:32,tc:"TC1",tchi:"1.5",code:"[H1-1.5-05]",name:"QC TĐ-KT nội bộ",issued:"",issuer:"",hssCode:"1.3.2",link:"",note:""},
  {stt:33,tc:"TC1",tchi:"1.5",code:"[H1-1.5-06]",name:"KH kiểm tra nội bộ",issued:"",issuer:"",hssCode:"2.6.2",link:"",note:""},
  {stt:34,tc:"TC1",tchi:"1.6",code:"[H1-1.6-01]",name:"Sổ VB đến, VB đi",issued:"",issuer:"",hssCode:"4.1.1",link:"",note:""},
  {stt:35,tc:"TC1",tchi:"1.6",code:"[H1-1.6-02]",name:"QC chi tiêu nội bộ",issued:"",issuer:"",hssCode:"1.3.1",link:"",note:""},
  {stt:36,tc:"TC1",tchi:"1.6",code:"[H1-1.6-03]",name:"Công khai tài chính",issued:"",issuer:"",hssCode:"1.5.2",link:"",note:""},
  {stt:37,tc:"TC1",tchi:"1.6",code:"[H1-1.6-04]",name:"Dự toán, báo cáo quyết toán",issued:"",issuer:"",hssCode:"5.5",link:"",note:""},
  {stt:38,tc:"TC1",tchi:"1.6",code:"[H1-1.6-05]",name:"Sổ TSCĐ, sổ CC-DC",issued:"",issuer:"",hssCode:"1.6.2",link:"",note:""},
  {stt:39,tc:"TC1",tchi:"1.6",code:"[H1-1.6-06]",name:"BB kiểm kê tài sản",issued:"",issuer:"",hssCode:"1.6.4",link:"",note:""},
  {stt:40,tc:"TC1",tchi:"1.6",code:"[H1-1.6-07]",name:"QC dân chủ cơ sở",issued:"",issuer:"",hssCode:"1.3.1",link:"",note:""},
  {stt:41,tc:"TC1",tchi:"1.6",code:"[H1-1.6-08]",name:"Hồ sơ công khai theo TT36",issued:"",issuer:"",hssCode:"1.5.2",link:"",note:""},
  {stt:42,tc:"TC2",tchi:"2.1",code:"[H2-2.1-01]",name:"DS trích ngang CBGV-NV",issued:"",issuer:"",hssCode:"9.1.1",link:"",note:""},
  {stt:43,tc:"TC2",tchi:"2.1",code:"[H2-2.1-02]",name:"Hồ sơ viên chức & HĐLĐ",issued:"",issuer:"",hssCode:"1.7.2",link:"",note:""},
  {stt:44,tc:"TC2",tchi:"2.1",code:"[H2-2.1-03]",name:"Bảng tổng hợp trình độ GV",issued:"",issuer:"",hssCode:"9.1.1",link:"",note:""},
  {stt:45,tc:"TC2",tchi:"2.1",code:"[H2-2.1-04]",name:"BC thống kê đội ngũ",issued:"",issuer:"",hssCode:"1.10.2",link:"",note:""},
  {stt:46,tc:"TC2",tchi:"2.2",code:"[H2-2.2-01]",name:"KH bồi dưỡng thường xuyên",issued:"",issuer:"",hssCode:"2.2.2",link:"",note:""},
  {stt:47,tc:"TC2",tchi:"2.2",code:"[H2-2.2-02]",name:"Hồ sơ BDTX theo module",issued:"",issuer:"",hssCode:"9.1.3",link:"",note:""},
  {stt:48,tc:"TC2",tchi:"2.2",code:"[H2-2.2-03]",name:"Chứng chỉ, chứng nhận bồi dưỡng",issued:"",issuer:"",hssCode:"9.1.1",link:"",note:""},
  {stt:49,tc:"TC2",tchi:"2.2",code:"[H2-2.2-04]",name:"KH đào tạo nâng chuẩn GV",issued:"",issuer:"",hssCode:"2.2.2",link:"",note:""},
  {stt:50,tc:"TC2",tchi:"2.3",code:"[H2-2.3-01]",name:"Đánh giá CNN GV theo NĐ90",issued:"",issuer:"",hssCode:"9.1.2",link:"",note:""},
  {stt:51,tc:"TC2",tchi:"2.3",code:"[H2-2.3-02]",name:"Sổ dự giờ",issued:"",issuer:"",hssCode:"9.1.4",link:"",note:""},
  {stt:52,tc:"TC2",tchi:"2.3",code:"[H2-2.3-03]",name:"Hồ sơ thi GV dạy giỏi",issued:"",issuer:"",hssCode:"1.8.2",link:"",note:""},
  {stt:53,tc:"TC2",tchi:"2.3",code:"[H2-2.3-04]",name:"Kế hoạch bài dạy",issued:"",issuer:"",hssCode:"9.1.4",link:"",note:""},
  {stt:54,tc:"TC2",tchi:"2.3",code:"[H2-2.3-05]",name:"Hồ sơ SHCM theo NCBH",issued:"",issuer:"",hssCode:"3.2.1",link:"",note:""},
  {stt:55,tc:"TC3",tchi:"3.1",code:"[H3-3.1-01]",name:"Hồ sơ đất đai, XDCB",issued:"",issuer:"",hssCode:"1.6.1",link:"",note:""},
  {stt:56,tc:"TC3",tchi:"3.1",code:"[H3-3.1-02]",name:"Sơ đồ tổng thể khuôn viên NT",issued:"",issuer:"",hssCode:"1.6.1",link:"",note:""},
  {stt:57,tc:"TC3",tchi:"3.1",code:"[H3-3.1-03]",name:"KH mua sắm, sửa chữa CSVC",issued:"",issuer:"",hssCode:"1.5.3",link:"",note:""},
  {stt:58,tc:"TC3",tchi:"3.1",code:"[H3-3.1-04]",name:"BB kiểm tra CSVC, ANTH",issued:"",issuer:"",hssCode:"1.9.1",link:"",note:""},
  {stt:59,tc:"TC3",tchi:"3.2",code:"[H3-3.2-01]",name:"Danh mục phòng học, phòng CN",issued:"",issuer:"",hssCode:"1.6.2",link:"",note:""},
  {stt:60,tc:"TC3",tchi:"3.2",code:"[H3-3.2-02]",name:"BB bàn giao, cấp phát CSVC",issued:"",issuer:"",hssCode:"1.6.3",link:"",note:""},
  {stt:61,tc:"TC3",tchi:"3.2",code:"[H3-3.2-03]",name:"Hồ sơ PCCC, ANTH",issued:"",issuer:"",hssCode:"1.9.1",link:"",note:""},
  {stt:62,tc:"TC3",tchi:"3.3",code:"[H3-3.3-01]",name:"Hồ sơ thư viện, sổ sách TV",issued:"",issuer:"",hssCode:"4.2.1",link:"",note:""},
  {stt:63,tc:"TC3",tchi:"3.3",code:"[H3-3.3-02]",name:"Hồ sơ văn hóa đọc",issued:"",issuer:"",hssCode:"4.2.2",link:"",note:""},
  {stt:64,tc:"TC3",tchi:"3.3",code:"[H3-3.3-03]",name:"Danh mục TB dạy học, sổ mượn-trả",issued:"",issuer:"",hssCode:"4.3.1",link:"",note:""},
  {stt:65,tc:"TC3",tchi:"3.3",code:"[H3-3.3-04]",name:"KH mua sắm thiết bị",issued:"",issuer:"",hssCode:"4.3.2",link:"",note:""},
  {stt:66,tc:"TC3",tchi:"3.3",code:"[H3-3.3-05]",name:"Hồ sơ ứng dụng CNTT",issued:"",issuer:"",hssCode:"3.3.3",link:"",note:""},
  {stt:67,tc:"TC4",tchi:"4.1",code:"[H4-4.1-01]",name:"QĐ, QC Ban ĐDCMHS",issued:"",issuer:"",hssCode:"8.1.1",link:"",note:""},
  {stt:68,tc:"TC4",tchi:"4.1",code:"[H4-4.1-02]",name:"BB họp Ban ĐDCMHS",issued:"",issuer:"",hssCode:"8.1.2",link:"",note:""},
  {stt:69,tc:"TC4",tchi:"4.1",code:"[H4-4.1-03]",name:"KH phối hợp NT-GĐ",issued:"",issuer:"",hssCode:"8.1.2",link:"",note:""},
  {stt:70,tc:"TC4",tchi:"4.2",code:"[H4-4.2-01]",name:"Hồ sơ phối hợp ANTT, ATGT",issued:"",issuer:"",hssCode:"1.9.1",link:"",note:""},
  {stt:71,tc:"TC4",tchi:"4.2",code:"[H4-4.2-02]",name:"Hồ sơ phối hợp Y tế",issued:"",issuer:"",hssCode:"1.9.2",link:"",note:""},
  {stt:72,tc:"TC4",tchi:"4.2",code:"[H4-4.2-03]",name:"Hồ sơ phối hợp GD truyền thống",issued:"",issuer:"",hssCode:"1.9.3",link:"",note:""},
  {stt:73,tc:"TC4",tchi:"4.2",code:"[H4-4.2-04]",name:"Hồ sơ vận động XHH giáo dục",issued:"",issuer:"",hssCode:"1.9.3",link:"",note:""},
  {stt:74,tc:"TC4",tchi:"4.2",code:"[H4-4.2-05]",name:"Hồ sơ tham mưu cấp ủy, chính quyền",issued:"",issuer:"",hssCode:"1.9.3",link:"",note:""},
  {stt:75,tc:"TC5",tchi:"5.1",code:"[H5-5.1-01]",name:"KH dạy học theo CTGDPT 2018",issued:"",issuer:"",hssCode:"2.2.1",link:"",note:""},
  {stt:76,tc:"TC5",tchi:"5.1",code:"[H5-5.1-02]",name:"Thời khóa biểu, PC chuyên môn",issued:"",issuer:"",hssCode:"2.3.1",link:"",note:""},
  {stt:77,tc:"TC5",tchi:"5.1",code:"[H5-5.1-03]",name:"Sổ đăng bộ, học bạ HS",issued:"",issuer:"",hssCode:"2.1.1",link:"",note:""},
  {stt:78,tc:"TC5",tchi:"5.1",code:"[H5-5.1-04]",name:"KH môn học các khối",issued:"",issuer:"",hssCode:"3.1.1",link:"",note:""},
  {stt:79,tc:"TC5",tchi:"5.1",code:"[H5-5.1-05]",name:"Ma trận, đề KT định kỳ",issued:"",issuer:"",hssCode:"2.4.1",link:"",note:""},
  {stt:80,tc:"TC5",tchi:"5.1",code:"[H5-5.1-06]",name:"Tổng hợp KQGD",issued:"",issuer:"",hssCode:"2.4.2",link:"",note:""},
  {stt:81,tc:"TC5",tchi:"5.1",code:"[H5-5.1-07]",name:"Sổ Chủ nhiệm",issued:"",issuer:"",hssCode:"9.2.1",link:"",note:""},
  {stt:82,tc:"TC5",tchi:"5.2",code:"[H5-5.2-01]",name:"KH trải nghiệm, STEM, HĐNGLL",issued:"",issuer:"",hssCode:"2.2.3",link:"",note:""},
  {stt:83,tc:"TC5",tchi:"5.2",code:"[H5-5.2-02]",name:"KH GD địa phương",issued:"",issuer:"",hssCode:"2.2.5",link:"",note:""},
  {stt:84,tc:"TC5",tchi:"5.2",code:"[H5-5.2-03]",name:"Hình ảnh hoạt động NGLL",issued:"",issuer:"",hssCode:"7.3",link:"",note:""},
  {stt:85,tc:"TC5",tchi:"5.2",code:"[H5-5.2-04]",name:"Hồ sơ đổi mới PP, ứng dụng CNTT",issued:"",issuer:"",hssCode:"3.3.3",link:"",note:""},
  {stt:86,tc:"TC5",tchi:"5.3",code:"[H5-5.3-01]",name:"Tổng hợp KQ đánh giá HS",issued:"",issuer:"",hssCode:"2.4.2",link:"",note:""},
  {stt:87,tc:"TC5",tchi:"5.3",code:"[H5-5.3-02]",name:"DS khen thưởng HS",issued:"",issuer:"",hssCode:"2.4.3",link:"",note:""},
  {stt:88,tc:"TC5",tchi:"5.3",code:"[H5-5.3-03]",name:"Hồ sơ Hội thi HS giỏi",issued:"",issuer:"",hssCode:"2.4.2",link:"",note:""},
  {stt:89,tc:"TC5",tchi:"5.3",code:"[H5-5.3-04]",name:"KH phụ đạo HS chưa đạt, BD năng khiếu",issued:"",issuer:"",hssCode:"2.2.4",link:"",note:""},
  {stt:90,tc:"TC5",tchi:"5.3",code:"[H5-5.3-05]",name:"KH-VB Y tế, theo dõi SK HS",issued:"",issuer:"",hssCode:"4.4.1",link:"",note:""},
  {stt:91,tc:"TC5",tchi:"5.4",code:"[H5-5.4-01]",name:"VB chỉ đạo PCGD",issued:"",issuer:"",hssCode:"2.5.1",link:"",note:""},
  {stt:92,tc:"TC5",tchi:"5.4",code:"[H5-5.4-02]",name:"Hồ sơ PCGD (KH, BC, biểu mẫu)",issued:"",issuer:"",hssCode:"2.5.2",link:"",note:""},
  {stt:93,tc:"TC5",tchi:"5.4",code:"[H5-5.4-03]",name:"Sổ theo dõi HS chuyển đi/đến",issued:"",issuer:"",hssCode:"2.1.3",link:"",note:""},
  {stt:94,tc:"TC5",tchi:"5.4",code:"[H5-5.4-04]",name:"Hồ sơ HS khuyết tật hòa nhập",issued:"",issuer:"",hssCode:"2.1.4",link:"",note:""},
  {stt:95,tc:"TC5",tchi:"5.4",code:"[H5-5.4-05]",name:"Hồ sơ tuyển sinh vào lớp 1",issued:"",issuer:"",hssCode:"2.6.1",link:"",note:""}
];
  // 2026-05-09: TRỎ VỀ DEFAULT_MC_FULL (95 MC chuẩn TT 17/2018 + TT 22/2024).
  // Khi sheet MinhChung có <90 MC (chưa đủ) → fallback về DEFAULT_MC_FULL ở line ~2139.
  // Khi user đã import đầy đủ qua Admin → sheet ghi đè (≥90 MC = trust).
  const DEFAULT_MC = DEFAULT_MC_FULL;

  const TC_NAMES = {
    'TC1':'Tổ chức và quản lý nhà trường',
    'TC2':'Cán bộ quản lý, giáo viên, nhân viên và học sinh',
    'TC3':'Cơ sở vật chất và thiết bị dạy học',
    'TC4':'Quan hệ giữa nhà trường, gia đình và xã hội',
    'TC5':'Hoạt động giáo dục và kết quả giáo dục'
  };
  const TCHI_NAMES = {
    '1.1':'Phương hướng, chiến lược xây dựng và phát triển nhà trường',
    '1.2':'Hội đồng trường và các hội đồng khác',
    '1.3':'Tổ chức Đảng Cộng sản Việt Nam, các đoàn thể và tổ chức khác',
    '1.4':'Hiệu trưởng, phó hiệu trưởng, tổ chuyên môn và tổ văn phòng',
    '1.5':'Quản lý, phát triển đội ngũ cán bộ quản lý, giáo viên, nhân viên',
    '1.6':'Quản lý hành chính, tài chính và tài sản',
    '2.1':'Đội ngũ cán bộ quản lý, giáo viên, nhân viên',
    '2.2':'Đào tạo, bồi dưỡng cán bộ quản lý, giáo viên, nhân viên',
    '2.3':'Năng lực nghề nghiệp của cán bộ quản lý, giáo viên, nhân viên',
    '3.1':'Khuôn viên, khu sân chơi, bãi tập',
    '3.2':'Phòng học, khối phòng hành chính - quản trị và phòng chức năng',
    '3.3':'Thư viện, thiết bị dạy học và ứng dụng CNTT',
    '4.1':'Ban đại diện cha mẹ học sinh',
    '4.2':'Công tác tham mưu cấp ủy, chính quyền và phối hợp XHH giáo dục',
    '5.1':'Thực hiện Chương trình giáo dục phổ thông cấp tiểu học',
    '5.2':'Tổ chức hoạt động trải nghiệm, ngoài giờ lên lớp',
    '5.3':'Kết quả giáo dục',
    '5.4':'Công tác phổ cập giáo dục tiểu học'
  };
  const TC_META = {
    'TC1':{icon:'🏫'},
    'TC2':{icon:'👨‍🏫'},
    'TC3':{icon:'🏢'},
    'TC4':{icon:'🤝'},
    'TC5':{icon:'🎓'}
  };
  const TC_ORDER = ['TC1','TC2','TC3','TC4','TC5'];
/* ============================================================================
   PHẦN B · MC FUNCTIONS — Overview + Admin Minh chứng + Export Excel
   Bóc từ app.js lines 1553-2032 (Refactor 2026-05-12 · Bước 2)
   ============================================================================ */
  function openMCOverview(){
    const ov = document.getElementById('mcOverlay');
    ov.style.display = 'flex';
    ov.classList.add('open');
    document.getElementById('mcOvSearch').value = '';
    renderMCOverview();
  }
  function closeMCOverview(){
    const ov = document.getElementById('mcOverlay');
    ov.style.display = 'none';
    ov.classList.remove('open');
    // close legal popup if open
    const pop = document.getElementById('mcLegalPop');
    const btn = document.getElementById('mcLegalBtn');
    if(pop) pop.classList.remove('open');
    if(btn) btn.classList.remove('open');
  }

  // 2026-05-09: parse fallback từ m.code khi cột tc/tchi trong sheet bị rỗng
  // Hỗ trợ format: "[1.1-01]" hoặc "[H1-1.1-01]" hoặc "1.1-01"
  function _mcResolveTC(m){
    if (m && m.tc) {
      var t = String(m.tc).trim().toUpperCase();
      if (/^TC[1-5]$/.test(t)) return t;
      if (/^[1-5]$/.test(t)) return 'TC' + t;
    }
    var c = String((m && m.code) || '');
    var match = c.match(/(?:H\d+-)?(\d)\.(\d+)/);
    return match ? ('TC' + match[1]) : '';
  }
  function _mcResolveTchi(m){
    if (m && m.tchi) {
      var t = String(m.tchi).trim();
      if (/^\d\.\d+$/.test(t)) return t;
    }
    var c = String((m && m.code) || '');
    var match = c.match(/(?:H\d+-)?(\d\.\d+)/);
    return match ? match[1] : '';
  }

  function _mcGroupByTC(filter){
    const q = (filter || '').toLowerCase();
    const out = {};
    MINHCHUNG.forEach(m => {
      if(q){
        const hay = (m.code + ' ' + m.name + ' ' + m.tchi + ' ' + (m.issuer||'') + ' ' + (m.hssCode||'')).toLowerCase();
        if(!hay.includes(q)) return;
      }
      var tc = _mcResolveTC(m);
      var tchi = _mcResolveTchi(m);
      if (!tc || !tchi) return; // skip nếu không xác định được vị trí
      if(!out[tc]) out[tc] = {};
      if(!out[tc][tchi]) out[tc][tchi] = [];
      out[tc][tchi].push(m);
    });
    return out;
  }

  function _mcCountLinked(list){
    let n = 0;
    list.forEach(m => { if(m.hssCode && String(m.hssCode).trim()) n++; });
    return n;
  }

  function renderMCOverview(filter){
    const q = (filter || '').toLowerCase();
    const grouped = _mcGroupByTC(filter);

    // Stats on full dataset (not filtered)
    const totalMC = MINHCHUNG.length;
    const linkedMC = _mcCountLinked(MINHCHUNG);
    const statHtml =
      _mcStat(5, 'Tiêu chuẩn') +
      _mcStat(17, 'Tiêu chí') +
      _mcStat(totalMC, 'Minh chứng') +
      _mcStat(linkedMC + '/' + totalMC, 'Đã liên kết HSS');
    document.getElementById('mcStats').innerHTML = statHtml;

    // Subtitle
    document.getElementById('mcOvSub').textContent =
      '5 Tiêu chuẩn · 17 Tiêu chí · Cập nhật theo TT 22/2024/TT-BGDĐT';

    // TC cards
    const body = document.getElementById('mcBody');
    let html = '';
    let shown = 0;
    TC_ORDER.forEach((tc, tci) => {
      if(!grouped[tc]) return;
      const meta = TC_META[tc] || {icon:'📁'};
      const tcName = TC_NAMES[tc] || tc;
      let tcCount = 0;
      const tchiKeys = Object.keys(grouped[tc]).sort();
      tchiKeys.forEach(k => tcCount += grouped[tc][k].length);
      shown += tcCount;

      let innerHtml = '';
      tchiKeys.forEach(tchi => {
        const items = grouped[tc][tchi];
        const tchiName = TCHI_NAMES[tchi] || tchi;
        const tchiKeyDisp = (typeof _safeCell === 'function') ? _safeCell(tchi) : tchi;
        innerHtml += '<div class="mc-tchi-head"><b>'+escapeHtml(tchiKeyDisp)+'</b> '+escapeHtml(tchiName)+'</div>';
        innerHtml += '<table class="mc-table">'+
          '<colgroup>'+
            '<col class="c-tt"><col class="c-code"><col class="c-name">'+
            '<col class="c-issued"><col class="c-issuer"><col class="c-hss"><col class="c-drive">'+
          '</colgroup>'+
          '<thead><tr>'+
            '<th class="mc-h-tt">TT</th>'+
            '<th>Mã MC</th>'+
            '<th>Nội dung minh chứng</th>'+
            '<th class="mc-h-issued">Số, ngày BH</th>'+
            '<th class="mc-h-issuer">Nơi ban hành</th>'+
            '<th>Nơi lưu (HSS)</th>'+
            '<th></th>'+
          '</tr></thead><tbody>';
        items.forEach((m, mi) => {
          const hssDisp = _safeCell(m.hssCode);
          const codeDisp = _safeCell(m.code);
          const hasHss = hssDisp && hssDisp.trim();
          const hasLink = m.link && String(m.link).trim();
          innerHtml += '<tr>'+
            '<td class="mc-tt">'+(mi+1)+'</td>'+
            '<td><span class="mc-code-pill" '+(hasHss?'onclick="mcJumpToHSS(\''+escapeHtml(hssDisp)+'\')" title="Nhảy đến HSS '+escapeHtml(hssDisp)+'"':'')+'>'+escapeHtml(codeDisp)+'</span></td>'+
            '<td class="mc-name">'+escapeHtml(_safeCell(m.name))+'</td>'+
            '<td class="mc-meta mc-c-issued">'+escapeHtml(_safeCell(m.issued))+'</td>'+
            '<td class="mc-meta mc-c-issuer">'+escapeHtml(_safeCell(m.issuer))+'</td>'+
            '<td class="mc-c-hss">'+(hasHss
              ? '<span class="mc-hss-chip" onclick="mcJumpToHSS(\''+escapeHtml(hssDisp)+'\')" title="Nhảy đến HSS '+escapeHtml(hssDisp)+'">📂 <b>'+escapeHtml(hssDisp)+'.</b>'+(m.hssName ? ' '+escapeHtml(m.hssName) : '')+'</span>'
              : '<span class="mc-hss-chip empty">—</span>')+'</td>'+
            '<td class="mc-c-drive">'+(hasLink
              ? '<a class="mc-drive" href="'+escapeHtml(m.link)+'" target="_blank" rel="noopener" title="Mở minh chứng trên Drive">📂</a>'
              : '<span class="mc-drive empty">📂</span>')+'</td>'+
          '</tr>';
        });
        innerHtml += '</tbody></table>';
      });

      const openCls = (q || tci === 0) ? ' open' : '';
      html += '<div class="mc-tc'+openCls+'" data-tc="'+tc+'">'+
        '<div class="mc-tc-head" onclick="this.parentElement.classList.toggle(\'open\')">'+
          '<div class="mc-tc-icon">'+meta.icon+'</div>'+
          '<div class="mc-tc-title"><b>Tiêu chuẩn '+tc.substr(2)+'</b><span>'+escapeHtml(tcName)+'</span></div>'+
          '<span class="mc-tc-badge">'+tcCount+' MC</span>'+
          '<span class="mc-tc-arrow">▸</span>'+
        '</div>'+
        '<div class="mc-tc-body">'+innerHtml+'</div>'+
      '</div>';
    });

    body.innerHTML = html || '<div class="mc-empty"><div class="mc-empty-ico">🔎</div>Không tìm thấy minh chứng phù hợp.</div>';
  }

  function _mcStat(num, label){
    return '<div class="mc-stat-card"><span class="mc-stat-num">'+num+'</span><span class="mc-stat-label">'+label+'</span></div>';
  }

  function filterMCOverview(){ renderMCOverview(document.getElementById('mcOvSearch').value.trim()); }

  function mcJumpToHSS(hssCode){
    closeMCOverview();
    const searchInput = document.getElementById('recSearch');
    if(searchInput){
      searchInput.value = hssCode;
      searchInput.dispatchEvent(new Event('input'));
    }
    setTimeout(() => {
      const sec = document.getElementById('records');
      if(sec) sec.scrollIntoView({behavior:'smooth'});
    }, 200);
  }

  // ----- Popup "Căn cứ pháp lý" -----
  function toggleLegalRefs(e){
    if(e){ e.stopPropagation(); }
    const pop = document.getElementById('mcLegalPop');
    const btn = document.getElementById('mcLegalBtn');
    if(!pop || !btn) return;
    const open = pop.classList.toggle('open');
    btn.classList.toggle('open', open);
    if(open){
      setTimeout(() => {
        document.addEventListener('click', _mcLegalClose, { once:true });
      }, 0);
    }
  }
  function _mcLegalClose(){
    const pop = document.getElementById('mcLegalPop');
    const btn = document.getElementById('mcLegalBtn');
    if(pop) pop.classList.remove('open');
    if(btn) btn.classList.remove('open');
  }

  // ⭐ _safeCell — đã chuyển sang core-shared.js Phần 2 (Refactor 2026-05-12 · Bước 1d).

  // ============ ADMIN MINH CHỨNG ============
  let _mcRawRows = [];

  function admLoadMC(){
    _mcRawRows = MINHCHUNG.map((m, i) => ({
      stt: i+1, tc: m.tc, tchi: m.tchi, code: m.code, name: m.name,
      issued: m.issued || '', issuer: m.issuer || '', hssCode: m.hssCode || '',
      link: m.link || '', note: m.note || ''
    }));
    admLoadMC_rerender();
  }

  function admRenderMCTable(rows){
    const wrap = document.getElementById('admMcTable');
    if(!rows.length){
      wrap.innerHTML = '<p style="padding:20px;text-align:center;color:#8a9690">Không có minh chứng.</p>';
      return;
    }
    let html = '<table class="adm-edit-table mc-adm-table"><thead><tr>'+
      '<th style="width:26px">TT</th>'+
      '<th style="width:54px">T.Chí</th>'+
      '<th style="width:120px">Mã MC</th>'+
      '<th style="width:320px">Tên minh chứng</th>'+
      '<th style="width:140px">Số, ngày BH</th>'+
      '<th style="width:144px">Nơi ban hành</th>'+
      '<th style="width:72px">HSS</th>'+
      '<th style="width:440px">Link Drive</th>'+
      '<th style="width:42px"></th>'+
    '</tr></thead><tbody>';
    rows.forEach((r, i) => {
      const bg = i%2===0 ? '' : 'background:#f9fbfa';
      const origIdx = r._idx != null ? r._idx : i;
      html += '<tr data-idx="'+origIdx+'" style="'+bg+'">'+
        '<td class="row-idx">'+r.stt+'</td>'+
        '<td style="font-size:.72rem;color:#6b7a72;text-align:center">'+escapeHtml(r.tchi)+'</td>'+
        '<td style="font-weight:600;color:var(--g2);font-size:.78rem">'+escapeHtml(r.code)+'</td>'+
        '<td><input type="text" value="'+escapeHtml(r.name)+'" onchange="_mcRawRows['+origIdx+'].name=this.value.trim()" style="font-size:.8rem"></td>'+
        '<td><input type="text" value="'+escapeHtml(r.issued||'')+'" onchange="_mcRawRows['+origIdx+'].issued=this.value.trim()" style="font-size:.76rem" placeholder="Số.../ngày..."></td>'+
        '<td><input type="text" value="'+escapeHtml(r.issuer||'')+'" onchange="_mcRawRows['+origIdx+'].issuer=this.value.trim()" style="font-size:.76rem" placeholder="Nơi BH"></td>'+
        '<td><input type="text" value="'+escapeHtml(r.hssCode||'')+'" onchange="_mcRawRows['+origIdx+'].hssCode=this.value.trim()" style="font-size:.76rem;text-align:center"></td>'+
        '<td><input type="text" value="'+escapeHtml(r.link||'')+'" onchange="_mcRawRows['+origIdx+'].link=this.value.trim()" style="font-size:.72rem" placeholder="https://..."></td>'+
        '<td style="white-space:nowrap;text-align:center"><button onclick="admDeleteMC('+origIdx+')" style="background:none;border:none;cursor:pointer;font-size:.95rem;opacity:.4" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.4" title="Xóa MC này">🗑️</button></td>'+
      '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function admFilterMC(){
    const q = document.getElementById('admMcSearch').value.trim().toLowerCase();
    const view = _mcRawRows.map((r, i) => Object.assign({}, r, {_idx:i}));
    if(!q){ admRenderMCTable(view); return; }
    admRenderMCTable(view.filter(r =>
      (r.code||'').toLowerCase().includes(q) ||
      (r.name||'').toLowerCase().includes(q) ||
      (r.tchi||'').includes(q) ||
      (r.issuer||'').toLowerCase().includes(q) ||
      (r.hssCode||'').toLowerCase().includes(q)
    ));
  }

  function admAddMC(){
    const tchiEl = document.getElementById('admMcTchi');
    const tchi = (tchiEl.value || '').trim();
    const code = document.getElementById('admMcCode').value.trim();
    const name = document.getElementById('admMcName').value.trim();
    const hss = document.getElementById('admMcHss').value.trim();
    const issued = document.getElementById('admMcIssued').value.trim();
    const issuer = document.getElementById('admMcIssuer').value.trim();
    const link = document.getElementById('admMcLink').value.trim();
    const note = document.getElementById('admMcNote').value.trim();
    const msg = document.getElementById('admMcMsg');
    if(!tchi || !code || !name){
      msg.textContent = '❌ Nhập tối thiểu: tiêu chí, mã MC và tên minh chứng.';
      msg.className = 'adm-alert err'; setTimeout(()=>msg.className='adm-alert',3000); return;
    }
    const tc = 'TC' + tchi.split('.')[0];
    const stt = _mcRawRows.length + 1;
    _mcRawRows.push({stt, tc, tchi, code, name, issued, issuer, hssCode:hss, link, note});
    admLoadMC_rerender();
    ['admMcCode','admMcName','admMcHss','admMcIssued','admMcIssuer','admMcLink','admMcNote'].forEach(id => {
      const el = document.getElementById(id); if(el) el.value = '';
    });
    msg.textContent = '✅ Đã thêm "'+code+' '+name+'". Nhấn 💾 Lưu lên Sheet để đồng bộ.';
    msg.className = 'adm-alert ok'; setTimeout(()=>msg.className='adm-alert',4000);
  }

  function admLoadMC_rerender(){
    document.getElementById('admMcSearch').value = '';
    admRenderMCTable(_mcRawRows.map((r, i) => Object.assign({}, r, {_idx:i})));
  }

  function admDeleteMC(i){
    if(!_mcRawRows[i]) return;
    if(!confirm('Xóa "'+_mcRawRows[i].code+' '+_mcRawRows[i].name+'"?\n\nNhấn 💾 Lưu sau khi xóa để cập nhật lên Sheet.')) return;
    _mcRawRows.splice(i, 1);
    _mcRawRows.forEach((r,j) => r.stt = j+1);
    admLoadMC_rerender();
    const msg = document.getElementById('admMcMsg');
    msg.textContent = '🗑️ Đã xóa. Nhấn 💾 Lưu để cập nhật lên Sheet.';
    msg.className = 'adm-alert warn'; setTimeout(()=>msg.className='adm-alert',4000);
  }

  function admSaveMC(){
    const msg = document.getElementById('admMcMsg');
    if(!_mcRawRows.length){ msg.textContent='❌ Chưa có dữ liệu.'; msg.className='adm-alert err'; return; }
    const sheetRows = _mcRawRows.map((r,i) => [i+1, r.tc, r.tchi, r.code, r.name, r.issued, r.issuer, r.hssCode, r.link, r.note]);
    msg.textContent = '⏳ Đang lưu...'; msg.className = 'adm-alert warn';
    admPostToGAS({action:'updateMinhChung', rows: sheetRows}, function(ok, resp){
      if(ok){
        msg.textContent = '✅ Đã lưu '+sheetRows.length+' minh chứng lên Sheet!';
        msg.className = 'adm-alert ok';
        try{ localStorage.removeItem(CACHE_KEY); } catch(e){}
      } else {
        msg.textContent = '❌ Lỗi: '+(resp||'Không kết nối');
        msg.className = 'adm-alert err';
      }
      setTimeout(()=>msg.className='adm-alert',5000);
    });
  }

  // ============ XUẤT DANH MỤC MINH CHỨNG (.doc — Word-compatible HTML) ============
  // Format theo TT17/2018 + TT22/2024 + CV5942 — giống file In của hệ thống Hồ sơ số.
  // Output .doc mở được bằng MS Word / LibreOffice / Google Docs — preserve styling.
  function exportMCExcel(){
    const cfg = (STATS && STATS.config) || {};
    const schoolName = (cfg.name || 'Trường Tiểu học').toUpperCase();
    const schoolAddr = cfg.address || '';
    const schoolYear = cfg.schoolYear || '2025 - 2026';
    // Tách địa chỉ → lấy Xã/Phường làm UBND
    var wardName = '';
    var parts = schoolAddr.split(',').map(function(s){return s.trim();});
    if(parts.length){
      var first = parts[0];
      // first thường là "Xã X" hoặc "Phường X" — bỏ prefix "Xã"/"Phường"/"Thị trấn"
      wardName = first.replace(/^(Xã|Phường|Thị trấn)\s+/i,'');
    }
    var ubnd = wardName ? 'UBND XÃ ' + wardName.toUpperCase() : 'UBND XÃ ...';

    const data = _mcRawRows && _mcRawRows.length ? _mcRawRows : MINHCHUNG;
    // Group by TC → tchi để restart STT mỗi tiêu chí.
    // ⭐ Dùng _mcResolveTC/_mcResolveTchi — fallback parse từ Mã MC khi m.tc/m.tchi
    //    rỗng (vd data sinh tự động từ DATA_HSS có thể bỏ qua 2 cột này).
    const grouped = {};
    data.forEach(m => {
      const tc = _mcResolveTC(m);
      const tchi = _mcResolveTchi(m);
      if (!tc || !tchi) return; // bỏ qua minh chứng không xác định được vị trí
      if(!grouped[tc]) grouped[tc] = {};
      if(!grouped[tc][tchi]) grouped[tc][tchi] = [];
      grouped[tc][tchi].push(m);
    });

    let totalMC = 0;
    let tableBody = '';
    TC_ORDER.forEach((tc, tci) => {
      if(!grouped[tc]) return;
      // Dòng Tiêu chuẩn (colspan 7)
      tableBody += '<tr class="tc-row"><td colspan="7"><b>Tiêu chuẩn ' + (tci+1) + ': ' + escapeHtml(TC_NAMES[tc]||'') + '</b></td></tr>';
      const tchiKeys = Object.keys(grouped[tc]).sort(function(a,b){
        var na = parseFloat(a), nb = parseFloat(b);
        return na - nb;
      });
      tchiKeys.forEach(tchi => {
        // Dòng Tiêu chí (colspan 7)
        tableBody += '<tr class="tchi-row"><td colspan="7"><i>Tiêu chí ' + tchi + '. ' + escapeHtml(TCHI_NAMES[tchi]||'') + '</i></td></tr>';
        let stt = 0;
        grouped[tc][tchi].forEach(m => {
          stt++; totalMC++;
          tableBody +=
            '<tr>' +
              '<td class="c-num">' + stt + '</td>' +
              '<td class="c-code"><b>' + escapeHtml(m.code||'') + '</b></td>' +
              '<td class="c-name">' + escapeHtml(m.name||'') + '</td>' +
              '<td class="c-issued">' + escapeHtml(m.issued||'') + '</td>' +
              '<td class="c-issuer">' + escapeHtml(m.issuer || (cfg.name || 'Trường Tiểu học')) + '</td>' +
              '<td class="c-hss"><b>' + escapeHtml(m.hssCode||'') + '</b></td>' +
              '<td class="c-note">' + escapeHtml(m.note||'') + '</td>' +
            '</tr>';
        });
      });
    });

    if(!totalMC){
      tableBody = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#666;font-style:italic">(Chưa có minh chứng nào. Vui lòng nhập qua Admin → Minh chứng hoặc Admin → Nhập dữ liệu.)</td></tr>';
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2,'0');
    const mm = String(today.getMonth()+1).padStart(2,'0');
    const yyyy = today.getFullYear();
    const dateStr = 'ngày ' + dd + ' tháng ' + mm + ' năm ' + yyyy;
    const placeStr = wardName || '...';

    const html =
'<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
'<head><meta charset="utf-8"><title>Danh mục Minh chứng</title>' +
'<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
'<style>' +
'@page WordSection1 { size: 29.7cm 21cm; mso-page-orientation: landscape; margin: 1.5cm 1.5cm 2cm 2cm; }' +
'div.WordSection1 { page: WordSection1; }' +
'body { font-family: "Times New Roman", serif; font-size: 13pt; line-height: 1.35; margin: 0; color: #000; }' +
'.head-tbl { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }' +
'.head-tbl td { vertical-align: top; padding: 0; border: 0; }' +
'.head-tbl .left { width: 45%; text-align: center; font-size: 13pt; }' +
'.head-tbl .right { width: 55%; text-align: center; font-size: 13pt; }' +
'.head-tbl .ubnd { font-weight: normal; }' +
'.head-tbl .school { font-weight: bold; }' +
'.head-tbl .cong-hoa { font-weight: bold; }' +
'.head-tbl .slogan { font-weight: bold; }' +
'.head-underline { display: inline-block; border-bottom: 1.5pt solid #000; min-width: 55%; margin-top: 3pt; }' +
'.doc-title { text-align: center; font-size: 15pt; font-weight: bold; letter-spacing: 0.5pt; margin-top: 12pt; }' +
'.doc-subtitle { text-align: center; font-size: 13pt; font-weight: bold; margin-top: 4pt; }' +
'.doc-law { text-align: center; font-size: 11.5pt; font-style: italic; margin-top: 6pt; padding: 0 40pt; }' +
'.doc-year { text-align: center; font-size: 13pt; margin-top: 6pt; font-weight: bold; }' +
'table.mc { width: 100%; border-collapse: collapse; margin-top: 12pt; font-size: 11pt; }' +
'table.mc th, table.mc td { border: 1pt solid #000; padding: 5pt 6pt; vertical-align: middle; }' +
'table.mc thead th { background: #e5f4ec; font-weight: bold; text-align: center; font-size: 10.5pt; mso-number-format: "\@"; }' +
'table.mc .c-num { width: 4%; text-align: center; }' +
'table.mc .c-code { width: 11%; text-align: center; }' +
'table.mc .c-name { width: 34%; }' +
'table.mc .c-issued { width: 13%; text-align: center; }' +
'table.mc .c-issuer { width: 20%; }' +
'table.mc .c-hss { width: 8%; text-align: center; color: #0c5da5; }' +
'table.mc .c-note { width: 10%; }' +
'table.mc tr.tc-row td { background: #2d8a6e; color: #ffffff; font-size: 12pt; padding: 6pt 8pt; }' +
'table.mc tr.tchi-row td { background: #cfeadd; color: #142a23; padding: 5pt 8pt; }' +
'.sign-block { width: 100%; margin-top: 14pt; }' +
'.sign-block .sign-cell { text-align: center; width: 35%; float: right; font-size: 13pt; }' +
'.sign-block .sign-cell .date { font-style: italic; }' +
'.sign-block .sign-cell .title { font-weight: bold; margin-top: 2pt; }' +
'.sign-block .sign-cell .space { height: 50pt; }' +
'</style></head>' +
'<body><div class="WordSection1">' +
// Header table: UBND XÃ ... + CỘNG HÒA
'<table class="head-tbl"><tr>' +
  '<td class="left">' +
    '<div class="ubnd">' + escapeHtml(ubnd) + '</div>' +
    '<div class="school">' + escapeHtml(schoolName) + '</div>' +
    '<span class="head-underline"></span>' +
  '</td>' +
  '<td class="right">' +
    '<div class="cong-hoa">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>' +
    '<div class="slogan">Độc lập - Tự do - Hạnh phúc</div>' +
    '<span class="head-underline"></span>' +
  '</td>' +
'</tr></table>' +
// Title block
'<div class="doc-title">BẢNG MÃ HOÁ MINH CHỨNG</div>' +
'<div class="doc-subtitle">KIỂM ĐỊNH CHẤT LƯỢNG GIÁO DỤC VÀ CÔNG NHẬN ĐẠT CHUẨN QUỐC GIA</div>' +
'<div class="doc-law">(Theo Thông tư số 17/2018/TT-BGDĐT ngày 22/8/2018, sửa đổi, bổ sung bởi Thông tư số 22/2024/TT-BGDĐT; Hướng dẫn tại Công văn số 5942/BGDĐT-QLCL ngày 28/12/2018 của Bộ Giáo dục và Đào tạo)</div>' +
'<div class="doc-year">Năm học: ' + escapeHtml(schoolYear) + '</div>' +
// Main table
'<table class="mc">' +
  '<thead><tr>' +
    '<th class="c-num">STT</th>' +
    '<th class="c-code">MÃ MINH CHỨNG</th>' +
    '<th class="c-name">TÊN MINH CHỨNG</th>' +
    '<th class="c-issued">SỐ, NGÀY BAN HÀNH</th>' +
    '<th class="c-issuer">NƠI BAN HÀNH HOẶC NHÓM, CÁ NHÂN ĐƯỢC KHẢO SÁT</th>' +
    '<th class="c-hss">MÃ HSS LIÊN QUAN</th>' +
    '<th class="c-note">GHI CHÚ</th>' +
  '</tr></thead>' +
  '<tbody>' + tableBody + '</tbody>' +
'</table>' +
// Signature block
'<table class="sign-block" style="margin-top:14pt;width:100%"><tr>' +
  '<td style="width:60%"></td>' +
  '<td style="width:40%;text-align:center">' +
    '<div style="font-style:italic">' + escapeHtml(placeStr + ', ' + dateStr) + '</div>' +
    '<div style="font-weight:bold;margin-top:2pt">HIỆU TRƯỞNG</div>' +
    '<div style="height:55pt"></div>' +
  '</td>' +
'</tr></table>' +
'</div></body></html>';

    // Xuất file .doc
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'DanhMuc_MinhChung_KDCL_' + yyyy + '.doc';
    a.click();
    URL.revokeObjectURL(a.href);

    const msg = document.getElementById('admMcMsg') || document.getElementById('admImportMsg');
    if(msg){
      msg.textContent = '✅ Đã tải Danh mục Minh chứng (' + totalMC + ' minh chứng). Mở bằng Word.';
      msg.className = 'adm-alert ok';
      setTimeout(function(){ msg.className = 'adm-alert'; }, 4000);
    }
  }
/* ============================================================================
   PHẦN C · BRIDGE PAYLOAD BUILDERS — Hồ sơ số → KĐCL TĐG React app
   Bóc từ app.js lines 3529-3724 (Phần 2 IIFE) (Refactor 2026-05-12 · Bước 2)
   ============================================================================ */
/* ===== Phần 2: Bridge Hồ sơ số → Hệ thống KĐCL ===== */
(function(){
  function _admGet(){
    try {
      const raw = localStorage.getItem('hsys_admin_cfg_v1') || localStorage.getItem('hsoSoCfg') || '{}';
      return JSON.parse(raw) || {};
    } catch(e){ return {}; }
  }

  window._buildSchoolInfoPayload = function(){
    const adm = _admGet();
    const cfg = (window.STATS && window.STATS.config) || {};
    const name = adm.schoolName || cfg.name || 'Trường Tiểu học';
    const addr = adm.schoolAddr || cfg.address || '';
    let ward = '', province = '';
    const m = addr.match(/^(.*?),\s*(.+)$/);
    if (m) { ward = m[1].trim(); province = m[2].trim(); }
    const yr = adm.schoolYear || cfg.schoolYear || '';
    let yf = '', yt = '';
    const ym = yr.match(/(\d{4})\s*[–-]\s*(\d{4})/);
    if (ym) { yf = ym[1]; yt = ym[2]; }
    const st = window.STATS || {};
    return {
      name: name,
      type: 'tieuhoc',
      address: addr,
      ward: ward,
      province: province,
      principal: adm.principal || '',
      phone: adm.schoolPhone || cfg.phone || '',
      email: adm.schoolEmail || cfg.email || '',
      academicYearFrom: yf,
      academicYearTo: yt,
      numStudents: st.totalChildren || st.numStudents || 0,
      numClasses: st.totalClasses || st.numClasses || 0,
      numTeachers: st.totalTeachers || st.numTeachers || 0,
      numStaff: st.numStaff || 0
    };
  };

  // 2026-05-09 fix: cùng bug như _buildMinhChungTree — MINHCHUNG là array
  // of objects, không phải raw rows. Sửa: parse object + group theo TC/tchi
  // rồi sinh markdown cho prompt AI báo cáo TĐG.
  window._buildEvidencePayload = function(){
    const MC = window.MINHCHUNG;
    if (!Array.isArray(MC) || !MC.length) return '';
    const _TC_NAMES_LOC = (typeof TC_NAMES !== 'undefined') ? TC_NAMES : {};
    const _TCHI_NAMES_LOC = (typeof TCHI_NAMES !== 'undefined') ? TCHI_NAMES : {};

    const tcMap = {};
    const tcOrder = [];
    MC.forEach(function(m){
      if (!m || typeof m !== 'object') return;
      const tc = String(m.tc || '').trim();
      const tchi = String(m.tchi || '').trim();
      if (!tc || !tchi) return;
      if (!tcMap[tc]) { tcMap[tc] = { tchiMap: {}, tchiOrder: [] }; tcOrder.push(tc); }
      if (!tcMap[tc].tchiMap[tchi]) { tcMap[tc].tchiMap[tchi] = []; tcMap[tc].tchiOrder.push(tchi); }
      tcMap[tc].tchiMap[tchi].push(m);
    });

    const lines = ['# Danh mục minh chứng đã mã hoá (từ Hồ sơ số Tiểu học)'];
    tcOrder.sort();
    tcOrder.forEach(function(tc){
      lines.push('\n## ' + tc + ' · ' + (_TC_NAMES_LOC[tc] || ''));
      const obj = tcMap[tc];
      obj.tchiOrder.sort(function(a, b){
        const aa = a.split('.').map(Number);
        const bb = b.split('.').map(Number);
        return (aa[0] - bb[0]) || (aa[1] - bb[1]);
      });
      obj.tchiOrder.forEach(function(tchi){
        lines.push('\n### Tiêu chí ' + tchi + ' · ' + (_TCHI_NAMES_LOC[tchi] || ''));
        obj.tchiMap[tchi].forEach(function(m){
          const code = String(m.code || '').trim();
          const noiDung = String(m.name || '').trim();
          const nguon = String(m.issuer || '').trim();
          const ngayBH = String(m.issued || '').trim();
          if (!code) return;
          let line = '- ' + code + ' ' + noiDung;
          if (nguon || ngayBH) line += ' _(' + [nguon, ngayBH].filter(Boolean).join(', ') + ')_';
          lines.push(line);
        });
      });
    });
    return lines.join('\n');
  };

  // 2026-05-09 fix: MINHCHUNG là array of OBJECTS từ getMinhChung()
  // (stt, tc, tchi, code, name, issued, issuer, hssCode, link, note, hssName).
  // Logic cũ đọc r[0], r[2]... như raw rows → tree luôn rỗng → KĐCL ẩn
  // nút "📋 Minh chứng HSS". Sửa: group object theo tc → tchi → items.
  window._buildMinhChungTree = function(){
    const MC = window.MINHCHUNG;
    if (!Array.isArray(MC) || !MC.length) return [];

    // Lấy TC_NAMES, TCHI_NAMES từ scope ngoài (đã định nghĩa line ~1474+)
    const _TC_NAMES_LOC = (typeof TC_NAMES !== 'undefined') ? TC_NAMES : {};
    const _TCHI_NAMES_LOC = (typeof TCHI_NAMES !== 'undefined') ? TCHI_NAMES : {};

    const tcMap = {};
    const tcOrder = [];

    MC.forEach(function(m){
      if (!m || typeof m !== 'object') return;
      const tc = String(m.tc || '').trim();
      const tchi = String(m.tchi || '').trim();
      if (!tc || !tchi) return;

      if (!tcMap[tc]) {
        tcMap[tc] = { id: tc, title: _TC_NAMES_LOC[tc] || tc, name: '', tieuchi: {}, _order: [] };
        tcOrder.push(tc);
      }
      if (!tcMap[tc].tieuchi[tchi]) {
        tcMap[tc].tieuchi[tchi] = { id: tchi, title: _TCHI_NAMES_LOC[tchi] || '', name: '', items: [] };
        tcMap[tc]._order.push(tchi);
      }
      tcMap[tc].tieuchi[tchi].items.push({
        code: String(m.code || ''),
        content: String(m.name || ''),
        issueDate: String(m.issued || ''),
        issuer: String(m.issuer || ''),
        hssRef: String(m.hssCode || ''),
        note: String(m.note || '')
      });
    });

    // Sort TC1 → TC5 và sort tchi 1.1, 1.2, 2.1, ...
    tcOrder.sort();
    return tcOrder.map(function(tc){
      const obj = tcMap[tc];
      obj._order.sort(function(a, b){
        const aa = a.split('.').map(Number);
        const bb = b.split('.').map(Number);
        return (aa[0] - bb[0]) || (aa[1] - bb[1]);
      });
      return {
        id: obj.id,
        title: obj.title,
        name: obj.name,
        tieuchi: obj._order.map(function(k){ return obj.tieuchi[k]; })
      };
    });
  };

  window._buildHssDataPayload = function(){
    try {
      const teachers = (window.TEACHERS || []).map(t => ({
        name: t[1] || '',
        dob: t[2] || '',
        role: t[3] || '',
        degree: t[4] || '',
        phone: t[5] || '',
        email: t[6] || ''
      })).filter(t => t.name);
      const teacherStats = { total: teachers.length, byRole: {}, byDegree: {} };
      teachers.forEach(t => {
        const role = t.role || 'Khác';
        teacherStats.byRole[role] = (teacherStats.byRole[role] || 0) + 1;
        const deg = t.degree || 'Khác';
        teacherStats.byDegree[deg] = (teacherStats.byDegree[deg] || 0) + 1;
      });
      const classes = (window.CLASSES || []).map(c => {
        const students = c.students || [];
        let male = 0, female = 0, ethnic = {};
        students.forEach(s => {
          const gender = (s[5] || s.gender || '').toString().toLowerCase();
          if (gender.indexOf('nữ') >= 0 || gender === 'nu' || gender === 'f') female++;
          else if (gender.indexOf('nam') >= 0 || gender === 'm') male++;
          const dt = s[6] || s.ethnic || 'Kinh';
          if (dt) ethnic[dt] = (ethnic[dt] || 0) + 1;
        });
        return {
          name: c.name || '',
          grade: c.grade || c.ageGroup || '',
          total: students.length,
          male: c.male || male,
          female: c.female || female,
          ethnic: ethnic
        };
      });
      const studentStats = { total: 0, male: 0, female: 0, ethnic: {}, byGrade: {} };
      classes.forEach(c => {
        studentStats.total += c.total;
        studentStats.male += c.male || 0;
        studentStats.female += c.female || 0;
        const g = c.grade || '';
        if (g) studentStats.byGrade[g] = (studentStats.byGrade[g] || 0) + c.total;
        Object.keys(c.ethnic || {}).forEach(dt => {
          studentStats.ethnic[dt] = (studentStats.ethnic[dt] || 0) + c.ethnic[dt];
        });
      });
      return { teachers, teacherStats, classes, studentStats };
    } catch(e) { console.warn('[_buildHssDataPayload]', e); return null; }
  };
})();
/* ============================================================================
   PHẦN D · VIEW-SWAP GLUE — Lazy load React libs + showKdcl/showHoso
   Bóc từ app.js lines 3726-3833 (Phần 3 IIFE) (Refactor 2026-05-12 · Bước 2)
   ============================================================================ */
/* ===== Phần 3: View-swap glue ===== */
(function(){
  // LOCK __tdgBackToHso: setter no-op để TDG's IIFE (nếu có) không thể override.
  var _backFn = function(){ showHoso(); };
  try {
    Object.defineProperty(window, '__tdgBackToHso', {
      get: function(){ return _backFn; },
      set: function(){},
      configurable: false
    });
  } catch(e) { window.__tdgBackToHso = _backFn; }

  window.__TDG_FROM_HSO__ = true;
  window.__TDG_BACK_URL__ = location.href.replace(/#.*$/, '');

  // Lazy load React + Babel + Tailwind + Mammoth — chỉ khi user bấm KĐCL lần đầu
  let _kdclLibsPromise = null;
  function _loadScriptOnce(src, attrs){
    return new Promise(function(resolve, reject){
      var exists = document.querySelector('script[data-lib="'+src+'"]');
      if (exists) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src;
      s.setAttribute('data-lib', src);
      if (attrs && attrs.crossOrigin) s.crossOrigin = attrs.crossOrigin;
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('Không tải được: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function _setKdclBootText(txt){
    var el = document.getElementById('bootMain');
    if (el) el.textContent = txt;
  }
  async function loadKdclLibs(){
    if (_kdclLibsPromise) return _kdclLibsPromise;
    _kdclLibsPromise = (async function(){
      _setKdclBootText('Đang đồng bộ dữ liệu. Vui lòng đợi!');
      await _loadScriptOnce('https://cdn.tailwindcss.com');
      try { if (window.tailwind) window.tailwind.config = { corePlugins: { preflight: false } }; } catch(e){}
      await _loadScriptOnce('https://unpkg.com/react@18/umd/react.production.min.js', { crossOrigin: '' });
      await _loadScriptOnce('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', { crossOrigin: '' });
      await _loadScriptOnce('https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js');
      await _loadScriptOnce('https://unpkg.com/@babel/standalone/babel.min.js');
      var srcEl = document.getElementById('tdgReactSource');
      if (!srcEl) throw new Error('Không tìm thấy #tdgReactSource');
      var src = srcEl.textContent;
      var transformed = window.Babel.transform(src, { presets: ['react'] }).code;
      var execScript = document.createElement('script');
      execScript.textContent = transformed;
      document.body.appendChild(execScript);
    })();
    return _kdclLibsPromise;
  }

  function _buildBridgePayload(){
    var si = typeof window._buildSchoolInfoPayload === 'function' ? window._buildSchoolInfoPayload() : {};
    var hssData = typeof window._buildHssDataPayload === 'function' ? window._buildHssDataPayload() : null;
    if (hssData && hssData.teacherStats) si.numTeachers = hssData.teacherStats.total;
    if (hssData && hssData.studentStats) si.numStudents = hssData.studentStats.total;
    if (hssData && hssData.classes) si.numClasses = hssData.classes.length;
    return {
      schoolInfo: si,
      evidenceList: typeof window._buildEvidencePayload === 'function' ? window._buildEvidencePayload() : '',
      hssMinhChung: typeof window._buildMinhChungTree === 'function' ? window._buildMinhChungTree() : [],
      hssData: hssData
    };
  }

  window.showKdcl = function(ev){
    if (ev && ev.preventDefault) ev.preventDefault();
    // ⭐ Khoá cấp 1: KĐCL/TĐG là khu vực nội bộ — chỉ Hiệu trưởng/PHT vào.
    if (typeof requireAuth === 'function' && !_hasLevel('admin')) {
      requireAuth('admin', function(){ window.showKdcl(); });
      return false;
    }
    document.body.classList.add('kdcl-active');
    window.scrollTo(0, 0);
    try {
      var payload = _buildBridgePayload();
      window.__HSS_MINHCHUNG__ = payload.hssMinhChung;
      window.__TDG_PENDING_BRIDGE__ = payload;
    } catch(e) { console.warn('[bridge] build payload fail:', e); }
    (async function(){
      try {
        await loadKdclLibs();
        await new Promise(function(r){ requestAnimationFrame(function(){ setTimeout(r, 120); }); });
        if (window.__TDG_PENDING_BRIDGE__) {
          window.dispatchEvent(new CustomEvent('tdg:applyBridge', { detail: window.__TDG_PENDING_BRIDGE__ }));
        }
      } catch(e) {
        console.error('[loadKdclLibs]', e);
        _setKdclBootText('⚠ Lỗi đồng bộ dữ liệu: ' + e.message + ' — Kiểm tra mạng + F5');
      }
    })();
    return false;
  };

  window.showHoso = function(){
    document.body.classList.remove('kdcl-active');
    window.scrollTo(0, 0);
  };

  // ====== QLCL view toggle ======
  // ⭐ window.showQlcl + alias goToQlcl đã chuyển sang core-shared.js Phần 4
  //   (Refactor 2026-05-12 · Bước 1d). Logic giữ nguyên 1:1.

})();

/* ============================================================================
   PHẦN E · OVERRIDE — Sửa các hàm cross-page navigation cho kdcl.html
   ============================================================================ */
// mcJumpToHSS gốc scroll trong cùng trang. Trang KĐCL không chứa danh mục HSS,
// nên override mở index.html#records ở tab mới.
window.mcJumpToHSS = function(hssCode){
  if (!hssCode) return;
  window.open('index.html#records', '_blank');
};

// showHoso gốc chỉ remove class 'kdcl-active' (toggle view trong cùng trang index.html cũ).
// Trang kdcl.html giờ là trang riêng → "về Hồ sơ số" = điều hướng sang index.html.
window.showHoso = function(){
  if (typeof goToHss === 'function') goToHss();
  else window.location.href = 'index.html';
};

/* ───── KHỞI ĐỘNG — gọi loadDataShared (core-shared.js) với boot riêng ───── */
loadDataShared(boot);
