/*
============================================================================
 app.js — Logic chính của Hệ thống Hồ sơ số Trường TH Diễn Liên
============================================================================
 Tách từ index.html (Refactor 2026-05-05) — giảm HTML từ 932KB → khoảng 510KB.
 File này chứa:
   • Logic HSS chính: callGAS, render, Admin, Setup, KĐCL bridge, view-swap
   • QLCL workspace: sổ điểm, NLPC, xếp loại, sổ chủ nhiệm, vi phạm, hoạt động
   • Scroll-to-top floating button
 KHÔNG chứa (giữ inline trong index.html):
   • IIFE Early Fetch (chạy ngay trong <head>)
   • const API_URL — mỗi trường có URL Apps Script riêng
   • JSX của KĐCL React app (Babel runtime cần text/tdg-react-source)
   • <style> print template (embed vào HTML output khi in)
 Khi sửa logic JS:
   1. Sửa file này
   2. Bump query string trong index.html (?v=YYYYMMDD)
   3. Push lên GitHub Pages → mọi máy tự nhận update sau lần refresh
============================================================================
*/

/* ===== Phần 1: JS chính HSS (render, Admin, Setup, callGAS) ===== */
  // 🔗 const API_URL đã được tách ra inline trong index.html (chỗ DUY NHẤT mỗi
  //    trường cần sửa khi triển khai). Biến này là global classic-script binding
  //    → app.js (cũng classic script) tham chiếu trực tiếp được.

  // ⭐ AUTH 2 CẤP — Đã chuyển sang core-shared.js (Refactor 2026-05-12 · Bước 1d).
  //   Các hàm/biến: _GV_WRITE_ACTIONS, _ADMIN_WRITE_ACTIONS, _authLevelForAction,
  //   getCU, setCU, _cuLevel, getAuthToken, getAuthLevel, _saveAuthToken, _saveAuthLevel,
  //   _hasLevel, setAuthToken, logoutSchool, _setAuthGateUI, _showAuthGate, _hideAuthGate,
  //   cancelAuthGate, requireAuth, _authForAction, submitAuthForm — xem core-shared.js Phần 1.

  // ============ STATE ============
  // TEMPLATE MODE: DEFAULT_MC để rỗng. Khi API backend trả về dữ liệu Sheet MinhChung,
  // MINHCHUNG sẽ nhận giá trị đó. Khi chưa có dữ liệu → Danh mục MC hiển thị 0 dòng
  // (user vào Admin → Nhập dữ liệu → upload file Excel theo mẫu để nạp).
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
  let HSS = [], TEACHERS = [], CLASSES = [], IMAGES = [], MINHCHUNG = DEFAULT_MC.slice(), STATS = {};
  let currentClass = null;
  const CAT_ICONS = [
    '🏫',      // 1. Hiệu trưởng
    '👩‍🏫',    // 2. Phó Hiệu trưởng
    '🏢',      // 3. Tổ chuyên môn
    '🤝',      // 4. Nhóm hồ sơ hành chính
    '📖',      // 5. Kế toán
    '🎗️',     // 6. Đảng
    '🚩',      // 7. Đội - Sao nhi đồng (cờ Đội)
    '👪',      // 8. Ban đại diện cha mẹ học sinh
    '📇',      // 9. Hồ sơ CB, GV, NV (hồ sơ nhân sự)
    '🏅',      // 10. Kiểm định chất lượng GD (huy hiệu KĐCL)
    '📊'       // 11. Đảm bảo chất lượng (thống kê chất lượng)
  ];
  const CAT_TINTS = ['#d6ecdb','#fff0d1','#dae7ff','#f0dcff','#ffdfd1','#ffe5b4','#e8f5ee','#e8f5ee'];
  const GRADE_META = {
    khoi1: {icon:'📖', label:'Khối 1'},
    khoi2: {icon:'✏️', label:'Khối 2'},
    khoi3: {icon:'📐', label:'Khối 3'},
    khoi4: {icon:'🔬', label:'Khối 4'},
    khoi5: {icon:'🎓', label:'Khối 5'}
  };

  // ⭐ UTILS — toggleMenu, initials, escapeHtml, countLeaves đã chuyển sang
  //   core-shared.js Phần 2 (Refactor 2026-05-12 · Bước 1d).

  // ============ RENDER STATS ============
  function renderStats(){
    document.getElementById('stRecords').textContent = STATS.totalRecords || 0;
    document.getElementById('stTeachers').textContent = STATS.totalTeachers || 0;
    document.getElementById('stClasses').textContent = STATS.totalClasses || 0;
    document.getElementById('stChildren').textContent = STATS.totalChildren || 0;
    document.getElementById('recCount').textContent = STATS.totalRecords || 0;
    const elDualHss = document.getElementById('recDualHss');
    if(elDualHss) elDualHss.textContent = STATS.totalRecords || 0;
    const elDualMc = document.getElementById('recDualMc');
    if(elDualMc) elDualMc.textContent = (MINHCHUNG && MINHCHUNG.length) || 0;
    if(STATS.config){
      // Cập nhật logo text + hero địa chỉ khi config load xong (template mode)
      try {
        var navName = document.getElementById('navSchoolName');
        if(navName && STATS.config.name){
          // Bỏ "Trường " đầu để ngắn gọn trên nav
          navName.textContent = String(STATS.config.name).replace(/^Trườngs+/i, '');
        }
        var heroAddr = document.getElementById('heroSchoolAddr');
        if(heroAddr){
          var fullName = STATS.config.name || 'Trường Tiểu học';
          var addr = STATS.config.address || '[Vui lòng cập nhật Admin → Thông tin]';
          heroAddr.textContent = '📍 ' + fullName + (addr ? ' – ' + addr : '');
        }
      } catch(e){}
      document.getElementById('cfgAddress').textContent = STATS.config.address || '';
      document.getElementById('cfgPhone').textContent = STATS.config.phone || '';
      document.getElementById('cfgEmail').textContent = STATS.config.email || '';
      document.getElementById('schoolYear').textContent = STATS.config.schoolYear || '';
    }
  }

  // ============ RECORDS (Hồ sơ số) ============
  // ⭐ Refactor 2026-05-12 · Bước 4: Chỉ render 9 nhóm hành chính (stt 1-9).
  //   Nhóm 10 (Kiểm định CL) → trang kdcl.html. Nhóm 11 (Đảm bảo CL) → trang dbcl.html.
  //   Admin tab "Hồ sơ số" vẫn quản lý đầy đủ 11 nhóm qua admLoadHSS riêng.
  function renderCategories(){
    const visibleCats = (HSS || []).filter((cat, i) => {
      const stt = (cat && cat.stt != null) ? Number(cat.stt) : (i + 1);
      return stt < 10;
    });
    document.getElementById('catGrid').innerHTML = visibleCats.map((cat, displayIdx) => {
      const c = countLeaves(cat.children || []);
      const groups = (cat.children || []).length;
      // openCat(origIdx) cần index trong mảng HSS gốc (vì state chi tiết tham chiếu HSS[origIdx])
      const origIdx = HSS.indexOf(cat);
      return `<div class="cat-card" onclick="openCat(${origIdx})">
        <span class="cat-num">NHÓM 0${displayIdx+1}</span>
        <span class="cat-icon">${CAT_ICONS[origIdx] || '📁'}</span>
        <h3>${escapeHtml(cat.name)}</h3>
        <div class="cat-meta">
          <div class="cat-count"><span><b>${c.t}</b>hồ sơ</span><span><b>${groups}</b>nhóm</span></div>
          <div class="cat-arrow">→</div>
        </div></div>`;
    }).join('');
    // Cập nhật count badge ở phần intro
    var elRC = document.getElementById('recCount'); if (elRC) elRC.textContent = visibleCats.reduce((s, c) => s + countLeaves(c.children || []).t, 0);
    var elRD = document.getElementById('recDualHss'); if (elRD) elRD.textContent = visibleCats.reduce((s, c) => s + countLeaves(c.children || []).t, 0);
  }

  function renderLeaves(items){
    return items.map(it => `<div class="leaf">
      <span class="status-dot ${it.has ? '' : 'empty'}"></span>
      <span class="leaf-code">${it.code}</span>
      <span class="leaf-name">${escapeHtml(it.name)}</span>
      ${it.has ? `<a class="open-btn" href="${escapeHtml(it.link)}" target="_blank" rel="noopener">Mở</a>` : `<span class="open-btn disabled">Chưa có</span>`}
    </div>`).join('');
  }

  function renderSubgroup(g){
    // Nếu g là leaf (không phải group) → render trực tiếp
    if(g.leaf) return renderLeaves([g]);

    const children = g.children || [];
    const leafCount = countLeaves(children).t;

    // Render children ĐÚNG THỨ TỰ gốc (không tách leaves/groups)
    let innerHtml = '';
    children.forEach(child => {
      if(child.leaf){
        innerHtml += renderLeaves([child]);
      } else {
        // Nested group — render đệ quy nếu có sub-groups sâu hơn
        const nested = child.children || [];
        const hasDeeper = nested.some(x => !x.leaf);
        if(hasDeeper){
          // Có sub-group con → render từng item theo thứ tự
          let nestInner = '';
          nested.forEach(n => {
            if(n.leaf) nestInner += renderLeaves([n]);
            else {
              const nLeaves = (n.children || []).filter(x => x.leaf);
              nestInner += `<div class="sub-nest">
                <div class="nest-head" onclick="this.parentElement.classList.toggle('open')">
                  <div class="nest-title"><span>📁</span><span>${escapeHtml(n.code)}. ${escapeHtml(n.name)}</span></div>
                  <span class="sub-badge">${countLeaves(n.children||[]).t}</span>
                </div>
                <div class="nest-list">${renderLeaves(nLeaves)}</div>
              </div>`;
            }
          });
          innerHtml += `<div class="sub-nest">
            <div class="nest-head" onclick="this.parentElement.classList.toggle('open')">
              <div class="nest-title"><span>📁</span><span>${escapeHtml(child.code)}. ${escapeHtml(child.name)}</span></div>
              <span class="sub-badge">${countLeaves(nested).t}</span>
            </div>
            <div class="nest-list">${nestInner}</div>
          </div>`;
        } else {
          // Chỉ có leaves → render đơn giản
          innerHtml += `<div class="sub-nest">
            <div class="nest-head" onclick="this.parentElement.classList.toggle('open')">
              <div class="nest-title"><span>📁</span><span>${escapeHtml(child.code)}. ${escapeHtml(child.name)}</span></div>
              <span class="sub-badge">${nested.filter(x=>x.leaf).length}</span>
            </div>
            <div class="nest-list">${renderLeaves(nested.filter(x=>x.leaf))}</div>
          </div>`;
        }
      }
    });

    return `<div class="sub-group">
      <div class="sub-head" onclick="this.parentElement.classList.toggle('open')">
        <div class="sub-title"><span>📂</span><span>${escapeHtml(g.code)}. ${escapeHtml(g.name)}</span></div>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="sub-badge">${leafCount} hồ sơ</span>
          <span class="sub-toggle">▸</span>
        </div>
      </div>
      <div class="sub-list">${innerHtml}</div>
    </div>`;
  }

  // ============================================================================
  // ⭐ HSS TABLE — render Danh mục Hồ sơ số theo mẫu MN Nghi Văn / MN Diễn Xuân:
  // 4 cột: Mã hồ sơ | Danh mục | Người phụ trách | Trạng thái (badge + folder)
  // ============================================================================
  // Cache HSS_Status từ backend (lazy-load lần đầu mở 1 cat)
  window.HSS_STATUS_MAP = null;     // { maHS: { trangThai, nguoiPhuTrach, capNhat } }
  window.HSS_STATUS_STATS = null;   // { total, daCo, chuaCo, percent } - thống kê tổng
  window.HSS_STATUS_CAPNHAT = null; // ngày cập nhật mới nhất

  function loadHssStatusForPublic(){
    return new Promise(function(resolve){
      // Đã cache → trả ngay
      if (window.HSS_STATUS_MAP !== null) { resolve(window.HSS_STATUS_MAP); return; }
      var url = (typeof getGAS_URL === 'function') ? getGAS_URL()
                : (typeof API_URL !== 'undefined' ? API_URL : '');
      if (!url) { window.HSS_STATUS_MAP = {}; resolve({}); return; }
      // Endpoint getHssStatus là read-only, không cần token
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getHssStatus' })
      }).then(function(r){ return r.text(); }).then(function(t){
        try {
          var res = JSON.parse(t);
          var map = {};
          if (res && res.ok && res.data) {
            (res.data.rows || []).forEach(function(r){
              map[r.maHS] = {
                trangThai: r.trangThai,
                nguoiPhuTrach: r.nguoiPhuTrach || '',
                source: r.source || 'unscanned',           // 'manual' | 'scanned' | 'unscanned'
                folderStatus: r.folderStatus,               // 'OK' | 'EMPTY' | 'ERROR' | 'NO_LINK' | null
                lastChecked: r.lastChecked,
                scanned: r.scanned
              };
            });
            window.HSS_STATUS_STATS = res.data.stats || null;
            // ⭐ Ưu tiên lastScan (timestamp quét Drive thật)
            var lastScan = res.data.stats && res.data.stats.lastScan;
            window.HSS_STATUS_CAPNHAT = lastScan ? new Date(lastScan) : null;
            window.HSS_STATUS_SCANNED_COUNT = res.data.stats ? (res.data.stats.scanned || 0) : 0;
          }
          window.HSS_STATUS_MAP = map;
        } catch(e) {
          window.HSS_STATUS_MAP = {};
        }
        resolve(window.HSS_STATUS_MAP);
      }).catch(function(){
        window.HSS_STATUS_MAP = {};
        resolve({});
      });
    });
  }

  // ⭐ Lazy real-time check (theo MN Diễn Xuân): khi user mở 1 cat,
  // tự động check những mã có cache > 5 phút (hoặc chưa từng check) → cập nhật badge in-place.
  // Public action, không yêu cầu auth. Cache 30s/code phía backend.
  function _hssLazyCheckFolders(codes){
    if (!codes || !codes.length) return;
    var STALE_MS = 5 * 60 * 1000; // 5 phút
    var now = Date.now();
    var stale = codes.filter(function(code){
      var fs = (window.HSS_STATUS_MAP || {})[code];
      // Chưa scan lần nào → cần check
      if (!fs || fs.source === 'unscanned' || !fs.lastChecked) return true;
      // Source = 'manual' (Admin override) → không check Drive (giữ override)
      if (fs.source === 'manual') return false;
      // Cache cũ > 5 phút → check lại
      var t = Date.parse(fs.lastChecked);
      return isNaN(t) || (now - t > STALE_MS);
    });
    if (!stale.length) return;

    var url = (typeof getGAS_URL === 'function') ? getGAS_URL()
              : (typeof API_URL !== 'undefined' ? API_URL : '');
    if (!url) return;

    // Backend cap 30 mã/request — chia batch
    for (var i = 0; i < stale.length; i += 30) {
      var batch = stale.slice(i, i + 30);
      (function(b){
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'checkFolderBatch', codes: b })
        }).then(function(r){ return r.text(); }).then(function(t){
          try {
            var res = JSON.parse(t);
            if (!res.ok || !res.data || !Array.isArray(res.data.results)) return;
            window.HSS_STATUS_MAP = window.HSS_STATUS_MAP || {};
            res.data.results.forEach(function(r){
              if (!r.code) return;
              window.HSS_STATUS_MAP[r.code] = {
                trangThai: (r.status === 'OK') ? 'co' : 'chua',
                nguoiPhuTrach: (window.HSS_STATUS_MAP[r.code] || {}).nguoiPhuTrach || '',
                source: 'scanned',
                folderStatus: r.status,
                lastChecked: r.lastChecked,
                scanned: true
              };
            });
            // Cập nhật DOM badge in-place + cập nhật progress box
            _hssUpdateBadgesInPlace();
          } catch(e) {}
        }).catch(function(){});
      })(batch);
    }
  }

  // Cập nhật DOM badge (Đã có/Chưa có) sau khi check xong — không re-render full bảng
  function _hssUpdateBadgesInPlace(){
    document.querySelectorAll('#detailBody tr').forEach(function(tr){
      var codeCell = tr.querySelector('.hss-code-cell');
      if (!codeCell) return;
      var code = codeCell.textContent.trim();
      var fs = (window.HSS_STATUS_MAP || {})[code];
      if (!fs) return;
      var stCell = tr.querySelector('.hss-st-cell');
      if (!stCell) return;
      var status = fs.trangThai;
      var badge = stCell.querySelector('.hss-badge');
      if (badge) {
        badge.className = 'hss-badge ' + (status === 'co' ? 'hss-badge-co' : 'hss-badge-chua');
        badge.textContent = (status === 'co') ? 'Đã có' : 'Chưa có';
        if (status === 'co') {
          badge.style.cursor = '';
          badge.removeAttribute('title');
        } else {
          badge.style.cursor = 'pointer';
          badge.title = 'Click để xem chi tiết lý do';
        }
      }
    });
    // Cập nhật progress box (đếm lại từ DOM)
    _hssRefreshProgressBox();
  }

  function _hssRefreshProgressBox(){
    var box = document.querySelector('#detailBody .hss-progress-box');
    if (!box) return;
    var coBadges = document.querySelectorAll('#detailBody .hss-badge-co').length;
    var chuaBadges = document.querySelectorAll('#detailBody .hss-badge-chua').length;
    var total = coBadges + chuaBadges;
    if (total === 0) return;
    var b = box.querySelector('.hpb-text b');
    if (b) b.textContent = coBadges + '/' + total + ' hồ sơ đã có file';
  }

  // Reset cache khi Admin lưu thay đổi → gọi từ admHssStatusSaveStatus / admHssStatusSavePT
  window.invalidateHssStatusCache = function(){ window.HSS_STATUS_MAP = null; window.HSS_STATUS_STATS = null; };

  // ============ DEBUG: click "Chưa có" → hiển thị chi tiết ============
  function _hssFindLeaf(code){
    var found = null;
    (function walk(nodes){
      for (var i = 0; i < nodes.length; i++){
        var n = nodes[i];
        if (n.leaf && n.code === code){ found = n; return; }
        if (n.children){ walk(n.children); if (found) return; }
      }
    })(window.HSS || []);
    return found;
  }

  function _hssShowDebug(code){
    var leaf = _hssFindLeaf(code);
    var fs = (window.HSS_STATUS_MAP || {})[code] || {};
    var link = (leaf && leaf.link) || '';
    var name = (leaf && leaf.name) || '(không tìm thấy)';

    // Extract folder ID
    var folderId = '';
    var m = link.match(/[-\w]{25,}/);
    if (m) folderId = m[0];

    // Status gốc từ backend
    var raw = fs.folderStatus || (link ? '(chưa quét)' : 'NO_LINK');
    var source = fs.source || '(unscanned)';
    var lastChecked = fs.lastChecked ? new Date(fs.lastChecked).toLocaleString('vi-VN') : '–';

    // Phỏng đoán nguyên nhân
    var dx = '';
    var dxColor = '#dc2626';
    if (!link) {
      dx = 'Chưa dán link Drive ở dòng này.\nKhắc phục: Vào Admin → Hồ sơ số → tìm dòng ' + code + ' → dán link folder Drive vào cột "LINK GOOGLE DRIVE" → Lưu.';
    } else if (raw === 'NO_LINK') {
      dx = 'Backend đọc link rỗng. Có thể link đã bị xóa khỏi Sheet hoặc Sheet chưa đồng bộ.';
    } else if (raw === 'EMPTY') {
      dx = 'Folder Drive tồn tại nhưng KHÔNG có file nào (đệ quy 5 cấp).\nKiểm tra: link đang trỏ folder rỗng, hoặc trỏ folder cha mà file thực tế nằm sâu hơn 5 cấp.';
    } else if (raw === 'ERROR') {
      dx = 'Backend KHÔNG truy cập được folder.\nKhả năng cao: folder ở "Được chia sẻ với tôi" mà tài khoản chủ Apps Script không có quyền.\nKhắc phục: vào Drive, share folder cho email chủ Apps Script (quyền Xem), HOẶC chuyển folder vào Drive của tài khoản chủ project.';
    } else if (raw === 'OK') {
      dx = 'Backend báo CÓ file (OK), nhưng badge vẫn "Chưa có".\nCó thể bị Admin override thủ công (source=manual). Vào Admin → Trạng thái HSS để kiểm tra.';
      dxColor = '#0891b2';
    } else if (raw === '(chưa quét)') {
      dx = 'Mã này có link nhưng backend CHƯA quét lần nào. Bấm "Kiểm tra ngay" hoặc đợi 5 phút auto-rescan.';
      dxColor = '#0891b2';
    } else {
      dx = 'Status không xác định: ' + raw;
    }

    // Remove old modal nếu có
    var old = document.getElementById('hssDebugModal');
    if (old) old.remove();

    var modal = document.createElement('div');
    modal.id = 'hssDebugModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
    modal.innerHTML =
      '<div style="background:#fff;border-radius:16px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">' +
        '<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">' +
          '<h3 style="margin:0;font-family:\'Fraunces\',serif;color:#0c5da5;font-size:1.2rem">🔍 Chi tiết hồ sơ ' + escapeHtml(code) + '</h3>' +
          '<button onclick="document.getElementById(\'hssDebugModal\').remove()" style="background:#f1f5f9;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;color:#475569">✕</button>' +
        '</div>' +
        '<div style="padding:20px 24px">' +
          '<div style="margin-bottom:14px"><b style="color:#475569">Tên hồ sơ:</b><br>' + escapeHtml(name) + '</div>' +
          '<div style="margin-bottom:14px"><b style="color:#475569">Link Drive đã dán:</b><br>' +
            (link ? '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" style="color:#0c5da5;word-break:break-all">' + escapeHtml(link) + '</a>' : '<i style="color:#dc2626">(trống — chưa dán link)</i>') +
          '</div>' +
          (folderId ? '<div style="margin-bottom:14px"><b style="color:#475569">Folder ID:</b><br><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:.9em">' + escapeHtml(folderId) + '</code></div>' : '') +
          '<div style="margin-bottom:14px;display:flex;gap:20px;flex-wrap:wrap">' +
            '<div><b style="color:#475569">Status backend:</b><br><code style="background:#fef3c7;padding:2px 8px;border-radius:4px">' + escapeHtml(raw) + '</code></div>' +
            '<div><b style="color:#475569">Nguồn:</b><br><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px">' + escapeHtml(source) + '</code></div>' +
            '<div><b style="color:#475569">Quét lần cuối:</b><br>' + escapeHtml(lastChecked) + '</div>' +
          '</div>' +
          '<div style="margin-top:18px;padding:14px 16px;background:' + (dxColor === '#dc2626' ? '#fef2f2' : '#ecfeff') + ';border-left:4px solid ' + dxColor + ';border-radius:8px">' +
            '<b style="color:' + dxColor + ';display:block;margin-bottom:6px">📋 Phỏng đoán nguyên nhân:</b>' +
            '<div style="white-space:pre-wrap;color:#1e293b;line-height:1.6">' + escapeHtml(dx) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  // Event delegate trên document — chỉ bind 1 lần
  if (!window._hssDebugBound) {
    window._hssDebugBound = true;
    document.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('hss-badge-chua')) return;
      var tr = t.closest('tr');
      if (!tr) return;
      var codeCell = tr.querySelector('.hss-code-cell');
      if (!codeCell) return;
      _hssShowDebug(codeCell.textContent.trim());
    });
  }

  // Format ngày: "07:33 05/05/2026"
  function _hssFmtDate(d){
    if (!d) return '';
    try {
      var dt = (d instanceof Date) ? d : new Date(d);
      if (isNaN(dt.getTime())) return '';
      var pad = function(n){ return n < 10 ? '0' + n : n; };
      return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ' ' +
             pad(dt.getDate()) + '/' + pad(dt.getMonth()+1) + '/' + dt.getFullYear();
    } catch(e) { return ''; }
  }

  // Trạng thái hiệu dụng của 1 leaf: ưu tiên override từ HSS_Status, fallback theo link
  function _hssEffectiveStatus(leaf){
    var map = window.HSS_STATUS_MAP || {};
    var st = map[leaf.code];
    if (st && (st.trangThai === 'co' || st.trangThai === 'chua')) return st.trangThai;
    return leaf.has ? 'co' : 'chua';
  }
  function _hssNguoiPhuTrach(leaf){
    var map = window.HSS_STATUS_MAP || {};
    var st = map[leaf.code];
    return (st && st.nguoiPhuTrach) || '';
  }

  // Đếm hồ sơ trong 1 cat (root): total và daCo dựa trên trạng thái hiệu dụng
  function _hssCatStats(catChildren){
    var total = 0, daCo = 0;
    (function walk(nodes){
      nodes.forEach(function(n){
        if (n.leaf) {
          total++;
          if (_hssEffectiveStatus(n) === 'co') daCo++;
        } else if (n.children) walk(n.children);
      });
    })(catChildren || []);
    return { total: total, daCo: daCo, chuaCo: total - daCo };
  }

  // Render 1 hàng HS trong bảng
  function renderLeavesTable(items){
    return items.map(function(it){
      var status = _hssEffectiveStatus(it);
      var pt     = _hssNguoiPhuTrach(it);
      var badge  = status === 'co'
        ? '<span class="hss-badge hss-badge-co">Đã có</span>'
        : '<span class="hss-badge hss-badge-chua" style="cursor:pointer" title="Click để xem chi tiết lý do">Chưa có</span>';
      var folder = (it.has && it.link)
        ? '<a class="hss-folder-icon has" href="' + escapeHtml(it.link) + '" target="_blank" rel="noopener" title="Mở thư mục Drive">📁</a>'
        : '<span class="hss-folder-icon empty" title="Chưa có file">📁</span>';
      return '<tr>' +
        '<td class="hss-code-cell">' + escapeHtml(it.code) + '</td>' +
        '<td class="hss-name-cell">' + escapeHtml(it.name) + '</td>' +
        '<td class="hss-pt-cell">' + escapeHtml(pt || '–') + '</td>' +
        '<td class="hss-st-cell">' + badge + folder + '</td>' +
      '</tr>';
    }).join('');
  }

  // Khung bảng đầy đủ 4 cột (header + body)
  function _hssTableShell(rowsHtml){
    return '<table class="hss-table"><thead><tr>' +
      '<th>Mã hồ sơ</th><th>Danh mục hồ sơ</th><th>Người phụ trách</th><th>Trạng thái</th>' +
    '</tr></thead><tbody>' + rowsHtml + '</tbody></table>';
  }

  // Render 1 sub-group (vd "1.1 Kế hoạch nhà trường") thành 1 .hss-table-wrap có thể collapse
  function renderSubgroupTable(g){
    if (g.leaf) {
      // Edge case: top-level cũng là leaf → wrap thành 1 row table
      return '<div class="hss-table-wrap open">' + _hssTableShell(renderLeavesTable([g])) + '</div>';
    }
    var children = g.children || [];
    var leafCount = countLeaves(children).t;
    return '<div class="hss-table-wrap open">' +
      '<div class="sub-head" onclick="this.parentElement.classList.toggle(\'open\')">' +
        '<div class="sub-title"><span>📁</span><span>' + escapeHtml(g.code) + '. ' + escapeHtml(g.name) + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:12px"><span class="sub-badge">' + leafCount + ' hồ sơ</span><span class="sub-toggle">▾</span></div>' +
      '</div>' +
      _renderSubgroupBody(children) +
    '</div>';
  }

  // Render thân của subgroup: gom các leaf liền kề thành 1 table, nested groups thành sub-section
  function _renderSubgroupBody(children){
    var html = '';
    var buffer = [];
    var flush = function(){
      if (buffer.length) { html += _hssTableShell(renderLeavesTable(buffer)); buffer = []; }
    };
    children.forEach(function(child){
      if (child.leaf) {
        buffer.push(child);
      } else {
        flush();
        // Nested group có children riêng
        var leafCount = countLeaves(child.children || []).t;
        html += '<div class="sub-nest open">' +
          '<div class="nest-head" onclick="this.parentElement.classList.toggle(\'open\')">' +
            '<div class="nest-title"><span>📁</span><span>' + escapeHtml(child.code) + '. ' + escapeHtml(child.name) + '</span></div>' +
            '<span class="sub-badge">' + leafCount + '</span>' +
          '</div>' +
          '<div class="nest-list">' + _renderSubgroupBody(child.children || []) + '</div>' +
        '</div>';
      }
    });
    flush();
    return html;
  }

  // Build progress box ở đầu cat-detail
  function _hssProgressBox(stats){
    var scannedCount = window.HSS_STATUS_SCANNED_COUNT || 0;
    var capNhat = window.HSS_STATUS_CAPNHAT;
    // Trường hợp 1: chưa scan Drive lần nào → mọi hồ sơ đang ở trạng thái "Chưa có"
    // Hệ thống sẽ tự quét trong 3-8 giây tới (lazy check khi mở cat).
    if (scannedCount === 0) {
      return '<div class="hss-progress-box" style="background:#fffbeb;border-color:#fde68a">' +
        '<div class="hpb-text" style="color:#92400e">' +
          '<span>⏳</span>' +
          '<b style="color:#b45309">Đang quét Drive lần đầu — vui lòng đợi 3-8 giây</b>' +
          '<span class="hpb-meta" style="color:#92400e">· Trạng thái sẽ tự cập nhật khi quét xong</span>' +
        '</div>' +
      '</div>';
    }
    // Trường hợp 2: đã scan → hiển thị thống kê thật
    var capNhatStr = capNhat ? _hssFmtDate(capNhat) : '';
    var capNhatHtml = capNhatStr ? '<span class="hpb-meta">Cập nhật: ' + escapeHtml(capNhatStr) + '</span>' : '';
    return '<div class="hss-progress-box">' +
      '<div class="hpb-text">' +
        '<span>📊</span>' +
        '<b>' + stats.daCo + '/' + stats.total + ' hồ sơ đã có file</b>' +
        capNhatHtml +
      '</div>' +
      '<button class="hss-progress-btn" onclick="hssCheckMissing()">🔍 Kiểm tra ngay</button>' +
    '</div>';
  }

  // Nút "Kiểm tra ngay": cuộn tới hồ sơ "Chưa có" đầu tiên trong cat đang mở
  window.hssCheckMissing = function(){
    var firstChua = document.querySelector('#detailBody .hss-badge-chua');
    if (!firstChua) {
      alert('🎉 Tất cả hồ sơ đã có file. Không có hồ sơ "Chưa có" trong nhóm này.');
      return;
    }
    // Mở wrap chứa nó nếu đang đóng
    var wrap = firstChua.closest('.hss-table-wrap');
    if (wrap && !wrap.classList.contains('open')) wrap.classList.add('open');
    var nest = firstChua.closest('.sub-nest');
    if (nest && !nest.classList.contains('open')) nest.classList.add('open');
    var row = firstChua.closest('tr');
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight tạm thời
      var origBg = row.style.background;
      row.style.background = '#fff3cd';
      row.style.transition = 'background 1s';
      setTimeout(function(){ row.style.background = origBg; }, 2000);
    }
  };

  function openCat(i){
    const cat = HSS[i];
    if(!cat) return;
    document.getElementById('detailIcon').textContent = CAT_ICONS[i] || '📁';
    document.getElementById('detailName').textContent = cat.name;

    const detail = document.getElementById('catDetail');
    detail.classList.add('active');
    setTimeout(() => detail.scrollIntoView({behavior:'smooth', block:'start'}), 100);

    // ⭐ PHẦN 1.2: Render NGAY (không đợi loadHssStatusForPublic)
    // Cache đã được prefetch khi boot. Nếu cache chưa kịp về thì fallback dùng leaf.has,
    // sau khi prefetch xong sẽ tự update badge in-place qua _hssUpdateBadgesInPlace.
    const children = cat.children || [];
    const stats = _hssCatStats(children);
    let html = _hssProgressBox(stats);
    children.forEach(function(child){ html += renderSubgroupTable(child); });
    document.getElementById('detailBody').innerHTML = html;

    // Collect mã trong cat → lazy check Drive (chỉ cho mã có cache > 5 phút)
    var codes = [];
    (function collect(nodes){
      nodes.forEach(function(n){
        if (n.leaf) codes.push(n.code);
        else if (n.children) collect(n.children);
      });
    })(children);

    // Nếu cache HSS_Status chưa có (prefetch chưa xong) → đợi rồi update badge + lazy check
    if (window.HSS_STATUS_MAP === null) {
      loadHssStatusForPublic().then(function(){
        _hssUpdateBadgesInPlace();
        _hssLazyCheckFolders(codes);
      });
    } else {
      _hssLazyCheckFolders(codes);
    }
  }
  function closeDetail(){
    document.getElementById('catDetail').classList.remove('active');
    document.getElementById('records').scrollIntoView({behavior:'smooth'});
  }

  // Mở link Drive động cho nút "Hệ thống văn bản" (trỏ tới 4.1.1. Văn bản đến)
  window.openHeThongVanBan = function(e){
    if(e && e.preventDefault) e.preventDefault();
    var hss = window.HSS || [];
    var target = null;
    (function walk(nodes){
      for(var i=0; i<nodes.length; i++){
        var n = nodes[i];
        if(n.leaf && n.code === '4.1.1'){ target = n; return; }
        if(n.children){ walk(n.children); if(target) return; }
      }
    })(hss);
    if(!target){
      alert('Chưa tìm thấy mục "4.1.1. Văn bản đến" trong Danh mục Hồ sơ số.\nVui lòng kiểm tra Admin → Hồ sơ số.');
      return false;
    }
    if(!target.link){
      alert('Mục "4.1.1. Văn bản đến" chưa được gắn link Google Drive.\nVui lòng vào Admin → Hồ sơ số → dòng 4.1.1 để dán link.');
      return false;
    }
    window.open(target.link, '_blank', 'noopener');
    return false;
  };

  // Search records
  document.getElementById('recSearch').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    if(!q){
      document.querySelectorAll('.cat-card').forEach(c => c.style.display='');
      closeDetail(); return;
    }
    const matches = [];
    HSS.forEach((cat, ci) => {
      (function walk(nodes){
        nodes.forEach(n => {
          if(n.leaf){
            if(n.code.toLowerCase().includes(q) || n.name.toLowerCase().includes(q))
              matches.push({...n, catIdx: ci, catName: cat.name});
          } else if(n.children){ walk(n.children); }
        });
      })(cat.children || []);
    });
    document.querySelectorAll('.cat-card').forEach(c => c.style.display='none');
    document.getElementById('detailIcon').textContent = '🔍';
    document.getElementById('detailName').textContent = `Kết quả tìm: "${q}" (${matches.length} hồ sơ)`;
    document.getElementById('catDetail').classList.add('active');
    if (!matches.length) {
      document.getElementById('detailBody').innerHTML =
        '<p style="padding:30px;text-align:center;color:#6b7a72">Không tìm thấy hồ sơ phù hợp.</p>';
      return;
    }
    // ⭐ PHẦN 1.2: Render NGAY — nếu cache chưa có thì update badge sau qua _hssUpdateBadgesInPlace
    document.getElementById('detailBody').innerHTML =
      '<div class="hss-table-wrap open">' + _hssTableShell(renderLeavesTable(matches)) + '</div>';
    if (window.HSS_STATUS_MAP === null) {
      loadHssStatusForPublic().then(function(){ _hssUpdateBadgesInPlace(); });
    }
  });

  // ============ CLASSES (Quản lý học sinh) ============
  // 2026-05-08: Mô hình 2 cấp drill-down (giống Mầm non):
  //   View 1 = 5 card khối to → click → View 2 = các lớp khối đó + nút "← Tất cả khối"
  function showGradeOverview(){
    const stats = {
      khoi1: {classes: 0, hs: 0},
      khoi2: {classes: 0, hs: 0},
      khoi3: {classes: 0, hs: 0},
      khoi4: {classes: 0, hs: 0},
      khoi5: {classes: 0, hs: 0}
    };
    CLASSES.forEach(c => {
      const n = (c.students || []).length;
      if (stats[c.gradeKey]) {
        stats[c.gradeKey].classes++;
        stats[c.gradeKey].hs += n;
      }
    });
    const totalC = Object.values(stats).reduce((s,x)=>s+x.classes,0);
    const totalH = Object.values(stats).reduce((s,x)=>s+x.hs,0);
    document.getElementById('ageTabs').innerHTML =
      `<div class="grade-overview-summary">Toàn trường · ${totalC} lớp · ${totalH} học sinh</div>`;
    const grid = document.getElementById('classGrid');
    grid.classList.add('grade-overview');
    grid.innerHTML = ['khoi1','khoi2','khoi3','khoi4','khoi5']
      .filter(k => stats[k].classes > 0)
      .map(k => {
        const meta = GRADE_META[k];
        const s = stats[k];
        return `<div class="class-card grade-overview-card" data-grade="${k}" onclick="showClassesByGrade('${k}')">
          <div class="grade-icon-big">${meta.icon}</div>
          <div class="class-name">${meta.label}</div>
          <div class="class-stats">
            <div class="class-stat"><b>${s.classes}</b><small>Lớp</small></div>
            <div class="class-stat male"><b>${s.hs}</b><small>Học sinh</small></div>
          </div>
          <div class="class-cta">Xem các lớp →</div>
        </div>`;
      }).join('');
    const sp = document.getElementById('studentsPanel');
    if (sp) sp.classList.remove('active');
  }

  function showClassesByGrade(gradeKey){
    const list = CLASSES.filter(c => c.gradeKey === gradeKey);
    if (!list.length) return showGradeOverview();
    const meta = GRADE_META[gradeKey] || {icon:'🏫', label:'Khối'};
    const totalHS = list.reduce((s, c) => s + (c.students || []).length, 0);
    document.getElementById('ageTabs').innerHTML =
      `<button class="grade-back-btn" onclick="showGradeOverview()">← Tất cả khối</button>
       <div class="grade-current-label"><span class="grade-current-icon">${meta.icon}</span> ${meta.label} · ${list.length} lớp · ${totalHS} học sinh</div>`;
    const grid = document.getElementById('classGrid');
    grid.classList.remove('grade-overview');
    grid.innerHTML = list.map(c => {
      const cmeta = GRADE_META[c.gradeKey] || {icon:'🏫', label:c.gradeLabel||''};
      return `<div class="class-card" data-grade="${c.gradeKey}" onclick="openClass('${escapeHtml(c.name).replace(/'/g,'&#39;')}')">
        <span class="class-age-chip">${cmeta.icon} ${cmeta.label}</span>
        <div class="class-name">${escapeHtml(c.name)}</div>
        <span class="class-age-text">${escapeHtml(c.gradeGroup||'')}</span>
        <div class="class-stats">
          <div class="class-stat"><b>${c.students.length}</b><small>Tổng</small></div>
          <div class="class-stat male"><b>${c.male}</b><small>Nam</small></div>
          <div class="class-stat female"><b>${c.female}</b><small>Nữ</small></div>
        </div>
        <div class="class-cta">Xem danh sách →</div>
      </div>`;
    }).join('');
    document.getElementById('classes').scrollIntoView({behavior:'smooth', block:'start'});
  }
  // Expose cho onclick inline
  window.showGradeOverview = showGradeOverview;
  window.showClassesByGrade = showClassesByGrade;
  function openClass(name){
    name = name.replace(/&#39;/g, "'");
    const cls = CLASSES.find(c => c.name === name);
    if(!cls) return;
    currentClass = cls;
    document.getElementById('spTitle').textContent = cls.name;
    document.getElementById('spMeta').textContent = `${cls.gradeGroup} · ${cls.students.length} học sinh (${cls.male} nam / ${cls.female} nữ)`;
    document.getElementById('stSearch').value = '';
    renderStudents(cls.students);
    const panel = document.getElementById('studentsPanel');
    panel.classList.add('active');
    setTimeout(() => panel.scrollIntoView({behavior:'smooth', block:'start'}), 100);
    // 2026-05-07: Load field nhạy cảm (Xóm + SĐT phụ huynh) — chỉ admin/GVCN của lớp đó được xem
    if (typeof loadStudentsAuthed === 'function') {
      loadStudentsAuthed().then(function(){
        // Re-render sau khi merge data nhạy cảm vào CLASSES.students
        if (currentClass === cls) renderStudents(cls.students);
      }).catch(function(){
        // Không có quyền → giữ nguyên hiển thị (cột Xóm/SĐT sẽ là '–')
      });
    }
  }
  function closeStudents(){
    document.getElementById('studentsPanel').classList.remove('active');
    document.getElementById('classes').scrollIntoView({behavior:'smooth'});
  }
  // 2026-05-10: helper exposed cho onclick — sau khi login CBGV, fetch lại field
  // nhạy cảm rồi re-render bảng (mở khoá ngày sinh / xóm / SĐT / cha mẹ).
  window._refreshStudents = function(){
    if (!currentClass) return;
    if (typeof loadStudentsAuthed === 'function') {
      loadStudentsAuthed(true).then(function(){
        if (currentClass) renderStudents(currentClass.students);
      }).catch(function(err){
        console.warn('[_refreshStudents] loadStudentsAuthed lỗi:', err && err.message);
        if (currentClass) renderStudents(currentClass.students);
      });
    } else {
      renderStudents(currentClass.students);
    }
  };

  // 2026-05-10: Khôi phục sau cleanup ngày 10/05 đã xoá nhầm.
  // Gọi action `studentsAuthed` (POST + sessionToken) để lấy field nhạy cảm
  // (hamlet, phone, father, mother, ward, province, ethnic, religion, ...) →
  // merge vào window.CLASSES[].students[] tại chỗ. Sau khi merge, render lại
  // sẽ thấy data thật thay vì 🔒.
  // Cache theo username: nếu đổi user → tự động fetch lại.
  function loadStudentsAuthed(force){
    return new Promise(function(resolve, reject){
      var cu = getCU() || {};
      var cuKey = cu.username || '';
      if (!cuKey || !cu.sessionToken){
        reject(new Error('Chưa đăng nhập CBGV'));
        return;
      }
      if (!force && window._studentsAuthedFor === cuKey){
        resolve({ ok:true, cached:true });
        return;
      }
      if (typeof API_URL === 'undefined' || !API_URL){
        reject(new Error('Chưa cấu hình API_URL'));
        return;
      }
      var body = {
        action: 'studentsAuthed',
        user: cuKey,
        role: cu.role || '',
        sessionToken: cu.sessionToken
      };
      fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      }).then(function(r){ return r.text(); }).then(function(t){
        var res;
        try { res = JSON.parse(t); }
        catch(e){ reject(new Error('Backend trả không phải JSON')); return; }
        if (!res || res.ok !== true || !Array.isArray(res.data)){
          reject(new Error((res && res.error) || 'Backend không trả danh sách'));
          return;
        }
        // Index theo (classCode|studentCode) để merge nhanh
        var idx = {};
        res.data.forEach(function(s){
          var k = (s.classCode || '') + '|' + (s.studentCode || '');
          idx[k] = s;
        });
        var sensitiveFields = ['hamlet','birthplace','phone','father','fatherYear','mother','motherYear','ward','province','address','ethnic','religion'];
        var merged = 0;
        (window.CLASSES || []).forEach(function(cls){
          (cls.students || []).forEach(function(stu){
            var k = (stu.classCode || cls.name || '') + '|' + (stu.studentCode || '');
            var src = idx[k];
            if (src){
              sensitiveFields.forEach(function(f){
                if (src[f] !== undefined && src[f] !== null && src[f] !== '') stu[f] = src[f];
              });
              merged++;
            }
          });
        });
        window._studentsAuthedFor = cuKey;
        console.log('[loadStudentsAuthed] Đã merge', merged, 'HS với data nhạy cảm');
        resolve({ ok:true, merged:merged });
      }).catch(reject);
    });
  }
  window.loadStudentsAuthed = loadStudentsAuthed;
  function renderStudents(list){
    const wrap = document.getElementById('stTableWrap');
    if(!list.length){
      wrap.innerHTML = '<div class="st-empty">Không tìm thấy học sinh phù hợp.</div>';
      return;
    }
    // 2026-05-10: Khách (chưa login CBGV) → khoá ngày sinh, xóm/chỗ ở, SĐT, cha/mẹ
    // theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân của trẻ em.
    // Hiện 🔒 thay vì '–' để không gây hiểu nhầm "data trống".
    const isGuest = !_hasLevel('gv');
    const lock = '<span class="st-lock" title="Đăng nhập CBGV để xem">🔒</span>';
    const banner = isGuest ? `
      <div class="st-guest-banner">
        <div class="st-guest-text">
          <span class="st-guest-emoji">🔒</span>
          <span><b>Đang xem ở chế độ công khai.</b> Để xem ngày sinh, xóm/chỗ ở, SĐT phụ huynh, cha mẹ — vui lòng đăng nhập tài khoản cán bộ, giáo viên.</span>
        </div>
        <button class="st-login-btn" onclick="requireAuth('gv', _refreshStudents)">
          <span class="st-login-ico">🔓</span>
          <span>Đăng nhập CBGV</span>
        </button>
      </div>` : '';
    wrap.innerHTML = banner + `<table class="st-table">
      <thead><tr><th>STT</th><th>Họ và tên</th><th>Ngày sinh</th><th>Giới tính</th><th>Xóm</th><th>SĐT phụ huynh</th></tr></thead>
      <tbody>${list.map((s, i) => {
        const isFemale = /nữ|nu/i.test(s.gender);
        const init = initials(s.name);
        const rowId = 'st' + i;
        const dobCell     = isGuest ? lock : escapeHtml(s.dob || '–');
        const hamletCell  = isGuest ? lock : escapeHtml(s.hamlet || '–');
        const phoneCell   = isGuest ? lock : escapeHtml(s.phone || '–');
        const ethnicCell  = isGuest ? lock : (escapeHtml(s.ethnic || '–') + ' / ' + escapeHtml(s.religion || '–'));
        const addressCell = isGuest ? lock : escapeHtml([s.hamlet, s.ward, s.province].filter(Boolean).join(', ') || '–');
        const fatherCell  = isGuest ? lock : (escapeHtml(s.father || '–') + (s.fatherYear ? ' ('+escapeHtml(s.fatherYear)+')' : ''));
        const motherCell  = isGuest ? lock : (escapeHtml(s.mother || '–') + (s.motherYear ? ' ('+escapeHtml(s.motherYear)+')' : ''));
        return `<tr class="main" id="${rowId}" onclick="toggleStudent('${rowId}', ${i})">
          <td class="st-idx" data-lbl="STT">${i+1}</td>
          <td class="st-name-cell" data-lbl="HS">
            <span class="st-avatar ${isFemale?'female':''}">${init}</span>
            <span class="st-name">${escapeHtml(s.name)}</span>
          </td>
          <td data-lbl="Ngày sinh">${dobCell}</td>
          <td data-lbl="Giới tính"><span class="st-gender ${isFemale?'f':'m'}">${escapeHtml(s.gender)}</span></td>
          <td data-lbl="Xóm">${hamletCell}</td>
          <td data-lbl="SĐT">${phoneCell}</td>
        </tr>
        <tr class="st-detail-row" id="${rowId}_d" style="display:none">
          <td colspan="6"><div class="st-detail-inner">
            <div class="st-field"><strong>Mã học sinh</strong><span>${escapeHtml(s.studentCode || '–')}</span></div>
            <div class="st-field"><strong>Dân tộc / Tôn giáo</strong><span>${ethnicCell}</span></div>
            <div class="st-field"><strong>Địa chỉ thường trú</strong><span>${addressCell}</span></div>
            <div class="st-field"><strong>Họ tên cha</strong><span>${fatherCell}</span></div>
            <div class="st-field"><strong>Họ tên mẹ</strong><span>${motherCell}</span></div>
          </div></td>
        </tr>`;
      }).join('')}</tbody></table>`;
  }
  function toggleStudent(rowId, i){
    const row = document.getElementById(rowId);
    const det = document.getElementById(rowId + '_d');
    if(!det.classList.contains('open')){
      det.classList.add('open'); det.style.display = ''; row.classList.add('open');
    } else {
      det.classList.remove('open'); det.style.display = 'none'; row.classList.remove('open');
    }
  }
  document.getElementById('stSearch').addEventListener('input', e => {
    if(!currentClass) return;
    const q = e.target.value.trim().toLowerCase();
    if(!q){ renderStudents(currentClass.students); return; }
    renderStudents(currentClass.students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.father || '').toLowerCase().includes(q) ||
      (s.mother || '').toLowerCase().includes(q)
    ));
  });

  // ============ TEACHERS ============
  function teacherType(t){
    const r = (t.role || '').toLowerCase();
    if(r.includes('hiệu trưởng') || r.includes('phó hiệu')) return 'bgh';
    if(r.includes('giáo viên')) return 'gv';
    return 'nv';
  }
  function renderRoleFilter(){
    const counts = {bgh:0, gv:0, nv:0};
    TEACHERS.forEach(t => counts[teacherType(t)]++);
    const filter = document.getElementById('roleFilter');
    // 2026-05-10: bỏ chip "Tất cả" — landing đã đảm nhận vai trò đó.
    filter.innerHTML = `<button class="role-chip" data-role="bgh">🛡️ Ban giám hiệu (${counts.bgh})</button>
      <button class="role-chip" data-role="gv">👩‍🏫 Giáo viên (${counts.gv})</button>
      <button class="role-chip" data-role="nv">📋 Nhân viên (${counts.nv})</button>`;
    filter.querySelectorAll('.role-chip').forEach(c => {
      c.addEventListener('click', () => {
        filter.querySelectorAll('.role-chip').forEach(x => x.classList.remove('active'));
        c.classList.add('active');
        renderTeachers(c.dataset.role);
      });
    });
  }
  // 2026-05-09: thiết kế lại — 3 nhóm BGH / Giáo viên / Nhân viên
  // 2026-05-10: thêm landing 3 hero card, click drill-down vào từng nhóm
  const _T_SECTIONS = [
    { key: 'bgh', icon: '🛡️',  name: 'BAN GIÁM HIỆU',     sub: 'Lãnh đạo & quản lý nhà trường', desc: 'Hiệu trưởng và Phó hiệu trưởng — định hướng phát triển nhà trường' },
    { key: 'gv',  icon: '👩‍🏫', name: 'ĐỘI NGŨ GIÁO VIÊN', sub: 'Trực tiếp giảng dạy & chủ nhiệm', desc: 'Giáo viên đứng lớp các khối 1-5 và tổ trưởng chuyên môn' },
    { key: 'nv',  icon: '📋',  name: 'NHÂN VIÊN',          sub: 'Kế toán · TVTV · Văn thư · Y tế', desc: 'Đội ngũ phục vụ và hỗ trợ hoạt động dạy học của nhà trường' }
  ];

  function renderTeacherLanding(){
    const el = document.getElementById('teacherLanding');
    if (!el) return;
    const counts = { bgh:0, gv:0, nv:0 };
    TEACHERS.forEach(t => counts[teacherType(t)]++);
    el.innerHTML = _T_SECTIONS.map(s => `
      <div class="teacher-hero teacher-hero-${s.key}" tabindex="0" role="button"
           onclick="enterTeacherRole('${s.key}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();enterTeacherRole('${s.key}')}">
        <div class="th-ico">${s.icon}</div>
        <div class="th-count"><b>${counts[s.key] || 0}</b><span>thành viên</span></div>
        <h3 class="th-name">${s.name}</h3>
        <p class="th-sub">${s.sub}</p>
        <p class="th-desc">${s.desc}</p>
        <span class="th-cta">Xem danh sách →</span>
      </div>
    `).join('');
  }

  function enterTeacherRole(role){
    const landing = document.getElementById('teacherLanding');
    const detail  = document.getElementById('teacherDetailView');
    if (!landing || !detail) return;
    landing.style.display = 'none';
    detail.style.display  = '';
    renderRoleFilter();
    const chip = detail.querySelector(`.role-chip[data-role="${role}"]`);
    if (chip){
      detail.querySelectorAll('.role-chip').forEach(x => x.classList.remove('active'));
      chip.classList.add('active');
    }
    renderTeachers(role);
    const sec = document.getElementById('teachers');
    if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  function backToTeacherLanding(){
    const landing = document.getElementById('teacherLanding');
    const detail  = document.getElementById('teacherDetailView');
    if (!landing || !detail) return;
    detail.style.display  = 'none';
    landing.style.display = '';
    const sec = document.getElementById('teachers');
    if (sec) sec.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  window.enterTeacherRole = enterTeacherRole;
  window.backToTeacherLanding = backToTeacherLanding;

  function _teacherCardHtml(t){
    const origIdx = TEACHERS.indexOf(t);
    const extra = t.dob ? 'Sinh ngày '+t.dob : '';
    const btn = t.link
      ? `<a class="teacher-profile" href="${escapeHtml(t.link)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">📂 Hồ sơ cá nhân</a>`
      : `<span class="teacher-profile disabled">📂 Chưa có</span>`;
    return `<div class="teacher-card" onclick="openTeacherDetail(${origIdx})" tabindex="0" role="button" title="Xem chi tiết">
      <div class="teacher-avatar">${initials(t.name)}</div>
      <h4>${escapeHtml(t.name)}</h4>
      <span class="teacher-role">${escapeHtml(t.role)}</span>
      ${extra ? `<span class="teacher-tag">${escapeHtml(extra)}</span>` : ''}
      <div>${btn}</div>
    </div>`;
  }

  function _teacherSectionHtml(s, list){
    if (!list || !list.length) return '';
    return `<div class="t-section t-section-${s.key}">
      <div class="t-section-head">
        <div class="t-section-ico">${s.icon}</div>
        <div class="t-section-info"><h3>${s.name}</h3><span>${s.sub} · <b>${list.length}</b> thành viên</span></div>
      </div>
      <div class="t-section-cards" data-count="${list.length}">${list.map(_teacherCardHtml).join('')}</div>
    </div>`;
  }

  function renderTeachers(role){
    role = role || 'all';
    const grid = document.getElementById('teacherGrid');
    if (!grid) return;
    let html = '';
    if (role === 'all') {
      _T_SECTIONS.forEach(s => {
        const list = TEACHERS.filter(t => teacherType(t) === s.key);
        html += _teacherSectionHtml(s, list);
      });
    } else {
      const s = _T_SECTIONS.find(x => x.key === role) || { key: role, icon: '👥', name: role.toUpperCase(), sub: '' };
      const list = TEACHERS.filter(t => teacherType(t) === role);
      html = _teacherSectionHtml(s, list);
    }
    grid.innerHTML = html || '<div style="text-align:center;color:#8a9690;padding:40px;grid-column:1/-1">Chưa có dữ liệu CBGV-NV.</div>';
  }

  // ============ TEACHER DETAIL MODAL ============
  function openTeacherDetail(idx){
    const t = TEACHERS[idx];
    if(!t) return;
    const ov = document.getElementById('teacherOverlay');
    if(!ov) return;
    const _safe = v => (v == null ? '' : String(v).trim());
    const initial = initials(t.name);
    const typeLabel = {bgh:'Ban giám hiệu', gv:'Giáo viên', nv:'Nhân viên'}[teacherType(t)] || '';
    const typeBg = {bgh:'linear-gradient(135deg,#ffd28a,#ff9e6e)', gv:'linear-gradient(135deg,#7fc99d,#3fb28c)', nv:'linear-gradient(135deg,#9ed8d3,#5cb0aa)'}[teacherType(t)] || 'linear-gradient(135deg,var(--g1),var(--g2))';
    const body = document.getElementById('teacherDetailBody');
    const phone = _safe(t.phone);
    const email = _safe(t.email);
    const dob = _safe(t.dob);
    const degree = _safe(t.degree);
    const link = _safe(t.link);
    body.innerHTML = `
      <div class="td-hero" style="background:${typeBg}">
        <div class="td-badge">${escapeHtml(typeLabel)}</div>
        <div class="td-avatar">${initial}</div>
        <h3>${escapeHtml(t.name)}</h3>
        <p class="td-role">${escapeHtml(t.role || '')}</p>
      </div>
      <div class="td-info">
        ${dob ? `<div class="td-row"><span class="td-ic">🎂</span><div><span>Ngày sinh</span><b>${escapeHtml(dob)}</b></div></div>` : ''}
        ${degree ? `<div class="td-row"><span class="td-ic">🎓</span><div><span>Trình độ</span><b>${escapeHtml(degree)}</b></div></div>` : ''}
        ${phone ? `<div class="td-row"><span class="td-ic">📞</span><div><span>Điện thoại</span><b><a href="tel:${escapeHtml(phone.replace(/\s+/g,''))}">${escapeHtml(phone)}</a></b></div></div>` : ''}
        ${email ? `<div class="td-row"><span class="td-ic">✉️</span><div><span>Email</span><b><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></b></div></div>` : ''}
      </div>
      <div class="td-actions">
        ${link ? `<a class="teacher-profile" href="${escapeHtml(link)}" target="_blank" rel="noopener">📂 Mở hồ sơ cá nhân trên Drive</a>` : `<span class="teacher-profile disabled">📂 Chưa có hồ sơ Drive</span>`}
      </div>
    `;
    ov.style.display = 'flex';
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeTeacherDetail(){
    const ov = document.getElementById('teacherOverlay');
    if(!ov) return;
    ov.style.display = 'none';
    ov.classList.remove('open');
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      const ov = document.getElementById('teacherOverlay');
      if(ov && ov.classList.contains('open')) closeTeacherDetail();
    }
  });

  // ============ GUIDE TABS ============
  function guideTab(id){
    const map = {use:'guideUse', faq:'guideFaq'};
    document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide-panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(map[id]).classList.add('active');
  }

  // ============ FAQ — viết lại 2026-05-11: tập trung QLCL, vào điểm, học bạ, CSDL ngành ============
  const faqs = [
    // -- QLCL: VÀO ĐIỂM --
    {q:'⭐ Vào điểm (nhập kết quả) ở đâu, cuối kỳ phải nhập những gì?', a:'Mở QLCL từ menu <b>"QL Chất lượng 📊"</b> → đăng nhập GVCN → Sidebar trái <b>"✏️ Nhập kết quả"</b> → chọn Khối + Lớp. Mỗi HS cần nhập đủ: <b>(1) Mức môn học</b> (T/H/C - các môn theo lớp), <b>(2) Điểm KTĐK 1-10</b> (chỉ Toán, Tiếng Việt, Khoa học, LS-ĐL), <b>(3) Mức 5 Năng lực + 5 Phẩm chất</b> (T/Đ/C - chữ Đ thay H). Hệ tự tính cột XL (Xếp loại: HTXS/HTT/HT/CHT) ngay khi đủ dữ liệu.'},
    {q:'⭐ Tại sao môn học là T/H/C còn năng lực là T/Đ/C?', a:'Đây là quy định <b>Thông tư 27/2020/TT-BGDĐT</b>: <br>• <b>Môn học</b>: <b>T</b> = Hoàn thành Tốt · <b>H</b> = Hoàn thành · <b>C</b> = Chưa hoàn thành.<br>• <b>Năng lực & Phẩm chất</b>: <b>T</b> = Tốt · <b>Đ</b> = Đạt · <b>C</b> = Cần cố gắng (KHÔNG có chữ "H"). <br>QLCL kiểm tra khi nhập — nếu gõ "H" vào ô Năng lực sẽ báo lỗi.'},
    {q:'⭐ Kỳ "Cuối HK2" ở đâu, tôi không thấy?', a:'Trong tiểu học, theo TT 27/2020 chỉ có <b>1 đợt kiểm tra cho cả HK2 và cả năm học</b> — gọi là <b>"Cuối năm"</b>. Vì vậy QLCL chỉ có 4 kỳ: Giữa HK1 · Cuối HK1 · Giữa HK2 · <b>Cuối năm</b>. Đây không phải lỗi.'},
    {q:'GVCN chỉ thấy lớp mình, không sửa được lớp khác?', a:'Đúng. <b>GVCN chỉ phân quyền sửa lớp mình chủ nhiệm</b> (do Admin phân công ở Admin → Phân quyền CBGV). Khi vào Nhập kết quả, các lớp khác chỉ xem được, không nhập được điểm.'},

    // -- QLCL: HỌC BẠ --
    {q:'⭐ Học bạ số xuất ra Word có chuẩn TT 27 không, có cần dán vào học bạ giấy?', a:'Có. QLCL xuất file Word đúng <b>mẫu học bạ TT 27/2020</b> (riêng Lớp 1, 2, 3, 4, 5) — đã chèn sẵn ảnh chữ ký GVCN, Hiệu trưởng, dấu trường ở đúng vị trí. <b>In ra dán vào học bạ giấy</b> hoặc lưu hồ sơ điện tử. Vào QLCL → "📋 Quản lý học bạ" → chọn lớp → "Xuất Word" (1 HS) hoặc "Xuất cả lớp" (file ZIP).'},
    {q:'⭐ Form học bạ có 6 phần, mỗi phần phải nhập gì?', a:'Khi nhấn vào tên HS, modal học bạ mở ra với 6 section: <b>(1) Lý lịch HS</b> — sổ đăng bộ, ngày nhập học, nơi sinh-quê quán-nơi ở, họ tên cha-mẹ-giám hộ, <b>chiều cao, cân nặng, ngày nghỉ phép/không phép</b>; <b>(2) Nhận xét từng môn</b> theo lớp; <b>(3) Năng lực chung &amp; đặc thù</b>; <b>(4) 5 Phẩm chất</b>; <b>(5) Khen thưởng</b> (tự gợi ý theo XL); <b>(6) Hoàn thành chương trình</b>. Dữ liệu lý lịch lấy từ HSS → QL học sinh; nếu HSS trống, gõ trực tiếp tại form học bạ.'},
    {q:'⭐ AI Nhận xét hoạt động thế nào, có cần Internet không?', a:'Không cần Internet, không gửi data ra ngoài. Hệ dùng <b>ngân hàng nhận xét chuẩn TT 27</b> sẵn trong app: đọc Mức môn / Năng lực / Phẩm chất + Điểm KTĐK đã nhập → ghép thành nhận xét hoàn chỉnh cho từng môn + 3 NL + 1 đoạn PC. Có 2 cách: <b>"🤖 AI Nhận xét (1 HS)"</b> trong modal — hoặc <b>"🤖 AI Nhận xét"</b> trên toolbar lớp để sinh hàng loạt (chỉ điền cho HS chưa có NX, không ghi đè HS đã có). Sinh xong vẫn nên đọc lại + chỉnh 1-2 câu cho phù hợp HS.'},
    {q:'⭐ "☁️ Lưu Drive" khác gì với "📄 Xuất Word", dùng khi nào?', a:'<b>📄 Xuất Word</b>: tải file .docx về máy — dùng để <b>in ra dán vào học bạ giấy</b>. <b>☁️ Lưu Drive (Word+PDF)</b>: render Word + server convert sang PDF + lưu cả 2 vào thư mục Drive <code>HocBaSo/2025-2026/Lop&lt;X&gt;/</code> + ghi log HSS_Status — dùng để <b>lưu hồ sơ điện tử cuối năm</b>, gửi link PDF cho phụ huynh, hoặc lưu trữ lâu dài trên Drive trường. Cả lớp: "☁️ Lưu Drive lớp" tự chạy tuần tự ~5s/HS rồi tạo file .ZIP cả lớp.'},
    {q:'Lưu Drive cả lớp bị treo / báo lỗi, làm gì?', a:'Kiểm tra: (1) Đã đóng/refresh tab khi đang chạy chưa? Không được — phải để chạy đến khi xong (~2.5 phút cho lớp 30 HS). (2) Drive còn dung lượng không? (3) Mạng Internet có ổn? Nếu một vài HS lỗi, alert sẽ liệt kê <b>cụ thể tên HS</b> — chạy lại cho riêng các em đó bằng nút <b>"☁️ Lưu Drive (Word+PDF)"</b> trong modal là được. Toàn bộ file đã render thành công trước đó vẫn lưu trên Drive, không bị xoá.'},
    {q:'Ai cấu hình ảnh chữ ký, dấu trường?', a:'Admin (HT/PHT) vào QLCL → Sidebar <b>"✍️ Ảnh chữ ký &amp; dấu"</b> — trang chia 2 phần: <b>(1) Toàn trường</b> upload chữ ký HT + dấu trường (PNG nền trong suốt, blur mặc định để bảo mật, bấm 👁 để xem); <b>(2) GVCN từng lớp</b> — 15 GVCN tự sinh theo cột "Lớp PT" trong Phân quyền CBGV, mỗi lớp upload 1 ảnh riêng. Sau khi đủ ảnh, xuất học bạ sẽ tự ghép đúng chỗ mẫu TT 27. Hệ cache localStorage để mở lần sau hiển thị tức thì.'},

    // -- QLCL: CSDL NGÀNH --
    {q:'⭐ Xuất báo cáo lên CSDL ngành MOET có 2 cách, nên chọn cách nào?', a:'<b>Cách 1 (Thủ công)</b>: QLCL → "📤 Xuất báo cáo" → "🏛️ Xuất mẫu CSDL ngành" → tải Excel 5 file (5 khối) → tự đăng nhập CSDL ngành + upload từng file. Tốn ~30 phút. <br><b>Cách 2 (Tự động ⚡)</b>: Cài <b>Chrome Extension "HSS Sync"</b> (1 lần) → đăng nhập CSDL ngành sẵn → vào QLCL bấm "🚀 Đồng bộ CSDL ngành" → chọn Khối + Kỳ → extension tự tạo Excel và tải lên CSDL ngành. Chỉ 1-2 phút/khối. <br><b>Khuyến nghị Cách 2</b> — xem hướng dẫn cài trong file <code>Data/HUONG_DAN_CAI.md</code>.'},
    {q:'⭐ File Excel CSDL ngành có cấu trúc gì?', a:'File chuẩn Sở GD&amp;ĐT: <b>35 cột, 3 hàng tiêu đề</b>. Gồm: STT, Mã lớp, Mã HS, Họ tên, Ngày sinh, 13 cột môn học (Mức + Điểm), 8 cột Năng lực, 5 cột Phẩm chất, HT chương trình, Lên lớp, Xếp loại. QLCL tự sinh đúng cấu trúc — không cần copy/paste tay từ Excel khác.'},
    {q:'Đồng bộ CSDL ngành thất bại, làm gì?', a:'Kiểm tra: (1) Đã đăng nhập <b>CSDL ngành</b> trên Chrome chưa (nếu chưa, đăng nhập + nhập CAPTCHA tay 1 lần)? (2) Extension "HSS Sync" đã bật chưa (xem ở chrome://extensions/)? (3) Đã chọn đúng Khối + Kỳ trong QLCL? (4) Đã đủ điểm cho HS chưa (HS thiếu điểm sẽ bỏ qua)? Sau khi sửa, bấm "Đồng bộ" lại.'},
    {q:'Chỉ Hiệu trưởng/PHT mới xuất CSDL ngành được?', a:'Đúng. Các nút <b>"🏛️ Xuất CSDL ngành"</b> và <b>"🚀 Đồng bộ CSDL ngành"</b> đều có badge "Admin" — chỉ tài khoản role Admin (HT/PHT) mới thấy &amp; bấm được. GVCN chỉ nhập điểm, không xuất báo cáo cấp trên.'},

    // -- HSS: TRANG CHỦ --
    {q:'Hệ thống Hồ sơ số gồm những gì?', a:'Gồm 109 hồ sơ chia 11 nhóm: HT, PHT, Tổ CM, Hành chính, Kế toán, Đảng, Đội, Ban ĐDCMHS, Hồ sơ CBGV-NV, KĐCL, ĐBCL. Nhấn "📋 Tổng quan Danh mục HSS" để xem toàn bộ.'},
    {q:'Tìm nhanh một hồ sơ bằng cách nào?', a:'Dùng ô tìm kiếm ở đầu mục "Hồ sơ số". Gõ từ khóa theo tên hoặc mã (VD: "thi đua", "1.2.1", "PCGD") — danh sách tự lọc.'},
    {q:'Vì sao có hồ sơ hiện chấm xám?', a:'Chấm xám (●) = chưa có link Drive. Vào Admin → Hồ sơ số → tìm hồ sơ → dán link Drive → "Lưu thay đổi". Chấm chuyển xanh và nút "Mở" xuất hiện.'},
    {q:'Hồ sơ CBGV-NV hiển thị 3 thẻ lớn, đó là gì?', a:'Đó là phân nhóm: <b>BGH</b> (Ban giám hiệu), <b>GV</b> (Giáo viên), <b>NV</b> (Nhân viên). Nhấn thẻ → mở danh sách chi tiết từng người. Trên điện thoại 3 thẻ xếp dọc 1 cột; máy tính 3 cột ngang.'},

    // -- KĐCL --
    {q:'KĐCL khác QLCL ở chỗ nào?', a:'<b>QLCL</b> (Quản lý Chất lượng) = công cụ <b>hằng năm</b>: nhập điểm cuối kỳ, học bạ, báo cáo CSDL ngành (TT 27/2020). <br><b>KĐCL</b> (Kiểm định Chất lượng) = công cụ <b>5 năm/lần</b>: tự đánh giá nhà trường theo 5 tiêu chuẩn 17 tiêu chí, quản lý minh chứng, đón đoàn Đánh giá ngoài (TT 17/2018 + CV 5932/BGDĐT-QLCL).'},
    {q:'Mã hóa KĐCL nghĩa là gì?', a:'Cột "Mã hóa" cho biết hồ sơ phục vụ minh chứng tiêu chí nào. 1 hồ sơ thường là minh chứng cho NHIỀU tiêu chí, ngăn cách dấu phẩy. VD: "1.1, 1.10" = tiêu chí 1.1 và 1.10. Mã đặc biệt: "TĐG", "ĐGN", "ĐBCL". Khi đoàn ĐGN đến, lọc theo mã hóa là có ngay bộ minh chứng.'},
    {q:'Mở KĐCL có làm đóng Hồ sơ số không?', a:'<b>Không</b>. KĐCL mở ở <b>tab mới</b> (target="_blank"). Hồ sơ số vẫn ở tab gốc. Dùng chuột hoặc Ctrl+Tab để qua lại.'},

    // -- ADMIN / KHÁC --
    {q:'Đổi tên trường, địa chỉ ở đâu?', a:'Admin → Thông tin → Sửa Tên, Địa chỉ, SĐT, Email → "Lưu thay đổi". Dữ liệu ghi trực tiếp lên Google Sheet tab "CauHinh".'},
    {q:'Thêm ảnh hoạt động vào slideshow?', a:'Mở Sheet tab "Hinh Anh" → Thêm dòng: STT, Tiêu đề, Mô tả, Link ảnh (Drive đã share Anyone), Loại (truong/hoatdong/banru/lehoi) → Làm mới dữ liệu trên web.'},
    {q:'Trường khác muốn dùng hệ thống này?', a:'(1) Tạo Google Sheet mới → dán code GAS → chạy setup() → Deploy Web App. (2) Copy file HTML → dán URL API vào Admin → Thông tin → đổi tên trường. (3) Upload HTML lên GitHub Pages. Liên hệ Zalo 0913 031 073 để được hỗ trợ.'},
    {q:'Mã trường mặc định là gì? Quên mã Admin thì sao?', a:'Hệ thống dùng 2 mã: mã GV và mã Admin. Mã mặc định khi cài template được HT phổ biến qua Zalo nhóm trường. Vào Admin → Mã trường để đổi. Quên mã: Apps Script → Project Settings → Script Properties → xoá 2 key AUTH_TOKEN_GV và AUTH_TOKEN_ADMIN để quay về mã mặc định.'},
    {q:'Xem trên điện thoại có được không?', a:'Có — tất cả tính năng đều chạy được trên ĐT. Vào điểm trên ĐT vẫn OK (cẩn thận khi gõ). Tuy nhiên <b>nên dùng máy tính</b> khi: đồng bộ CSDL ngành (cần Chrome Extension), xuất Word cả lớp, hoặc nhập nhiều lớp cùng lúc.'},
  ];
  document.getElementById('faqList').innerHTML = faqs.map(f => `<div class="faq-item">
    <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">
      <span class="faq-q-text">${f.q}</span>
      <span class="faq-toggle">+</span>
    </div>
    <div class="faq-a"><div class="faq-a-inner">${f.a}</div></div>
  </div>`).join('');

  // ============ TỔNG QUAN DANH MỤC HSS ============
  const CAT_OV_COLORS = ['#2d8a6e','#3a7cc0','#e8833a','#1e6b54','#d4a843','#d06050','#8a5cb0','#3fb28c','#3a7cc0','#a08838','#6b4c8a'];
  const CAT_OV_ICONS = ['🏫','📋','📐','📂','💰','⭐','🚩','🤝','👩‍🏫','🎗️','📊'];

  // ============ HƯỚNG DẪN OVERLAY ============
  function openGuideOverview(){
    const ov = document.getElementById('guideOverlay');
    if(!ov) return;
    ov.style.display = 'flex';
    ov.classList.add('open');
    document.body.style.overflow = 'hidden';
    // reset scroll về đầu mỗi lần mở
    const sc = document.getElementById('guideScroll');
    if(sc) sc.scrollTop = 0;
  }
  function closeGuideOverview(){
    const ov = document.getElementById('guideOverlay');
    if(!ov) return;
    ov.style.display = 'none';
    ov.classList.remove('open');
    document.body.style.overflow = '';
  }
  // ESC để đóng modal Hướng dẫn
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      const ov = document.getElementById('guideOverlay');
      if(ov && ov.classList.contains('open')) closeGuideOverview();
    }
  });

  function openCatalogOverview(){
    document.getElementById('catalogOverlay').style.display = 'flex';
    document.getElementById('catalogOverlay').classList.add('open');
    document.getElementById('catOvSearch').value = '';
    renderCatalogOverview();
  }
  function closeCatalogOverview(){
    document.getElementById('catalogOverlay').style.display = 'none';
    document.getElementById('catalogOverlay').classList.remove('open');
  }

  function renderCatalogOverview(filter){
    const q = (filter || '').toLowerCase();
    let html = '';
    let totalLeaf = 0, totalFilled = 0;
    HSS.forEach((cat, ci) => {
      // ⭐ Refactor 2026-05-12 · Bước 4: chỉ liệt kê 9 nhóm hành chính (stt 1-9)
      const stt = (cat && cat.stt != null) ? Number(cat.stt) : (ci + 1);
      if (stt >= 10) return;
      const icon = CAT_OV_ICONS[ci] || '📁';
      const color = CAT_OV_COLORS[ci] || '#2d8a6e';
      let groupHtml = '';
      let groupLeaf = 0, groupFilled = 0;

      function walkItems(nodes, depth) {
        nodes.forEach(n => {
          if(n.leaf) {
            const match = !q || n.code.toLowerCase().includes(q) || n.name.toLowerCase().includes(q);
            if(!match) return;
            groupLeaf++; totalLeaf++;
            if(n.has){ groupFilled++; totalFilled++; }
            const dot = n.has ? '<span style="color:#3fb28c;margin-right:6px">●</span>' : '<span style="color:#cbd3cf;margin-right:6px">●</span>';
            // ⭐ FIX: dùng đúng n.kdcl (Mã hóa KĐCL — cột 5) thay vì n.assign (Phân công — cột 4).
            const kdcl = n.kdcl ? '<span style="background:#eaf5ef;color:#2d8a6e;padding:2px 8px;border-radius:99px;font-size:.72rem;font-weight:600">'+escapeHtml(n.kdcl)+'</span>' : '';
            groupHtml += '<div style="display:flex;align-items:center;gap:8px;padding:7px 14px 7px '+(16+depth*18)+'px;border-bottom:1px solid #f3f6f4;font-size:.88rem">'
              + dot
              + '<span style="color:#8a9690;font-size:.78rem;min-width:52px;font-family:Fraunces,serif;font-weight:600">'+escapeHtml(n.code)+'</span>'
              + '<span style="flex:1;color:#3a4a42">'+escapeHtml(n.name)+'</span>'
              + kdcl
              + '</div>';
          } else if(n.children) {
            if(!q) {
              groupHtml += '<div style="padding:8px 14px 6px '+(12+depth*18)+'px;font-weight:600;color:'+color+';font-size:.85rem;background:#f7fbf8">'+escapeHtml(n.code)+'. '+escapeHtml(n.name)+'</div>';
            }
            walkItems(n.children, depth+1);
          }
        });
      }
      walkItems(cat.children || [], 0);

      if(q && groupLeaf === 0) return;

      html += '<div style="margin-bottom:16px;border:1px solid #eef2ef;border-radius:14px;overflow:hidden">'
        + '<div style="background:'+color+';color:white;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="this.parentElement.classList.toggle(\'open\')">'
        + '<span style="font-family:Fraunces,serif;font-weight:600;font-size:.95rem">'+icon+' '+(ci+1)+'. '+escapeHtml(cat.name)+'</span>'
        + '<span style="font-size:.78rem;opacity:.85">'+groupLeaf+' hồ sơ · '+groupFilled+' đã có link</span>'
        + '</div>'
        + '<div class="cat-ov-body" style="'+(q || ci===0 ? '' : 'display:none')+'">'+groupHtml+'</div>'
        + '</div>';
    });

    document.getElementById('catOvCount').textContent = totalLeaf + ' hồ sơ · ' + HSS.length + ' nhóm · ' + totalFilled + ' đã có link';
    document.getElementById('catalogBody').innerHTML = html || '<p style="text-align:center;color:#8a9690;padding:40px">Không tìm thấy hồ sơ phù hợp.</p>';

    // Toggle logic
    document.querySelectorAll('#catalogBody > div').forEach(el => {
      const header = el.querySelector('div[onclick]');
      if(header) {
        header.onclick = function(){ 
          const body = el.querySelector('.cat-ov-body');
          if(body) body.style.display = body.style.display === 'none' ? '' : 'none';
        };
      }
    });
  }

  function filterCatalogOverview(){
    renderCatalogOverview(document.getElementById('catOvSearch').value.trim());
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 2026-05-09: In/PDF + Tải Word cho bảng Tổng quan Danh mục Hồ sơ số.
  // - In/PDF: open new window với HTML print-friendly + window.print() → user lưu PDF.
  // - Tải Word: HTML → Blob mime application/msword → download .doc.
  // KHÔNG cần lib mới; KHÔNG nhắc "Phòng GD&ĐT" (đã bỏ cấp huyện).
  // ════════════════════════════════════════════════════════════════════════════
  function _buildCatalogPrintHTML(forWord){
    var schoolEl = document.getElementById('navSchoolName');
    var schoolName = (schoolEl && schoolEl.textContent.trim()) || 'Trường Tiểu học …';
    var now = new Date();
    var dateStr = 'ngày ' + now.getDate() + ' tháng ' + (now.getMonth()+1) + ' năm ' + now.getFullYear();
    var totalLeaf = 0, totalFilled = 0;
    var bodyHtml = '';

    HSS.forEach(function(cat, ci){
      var icon = CAT_OV_ICONS[ci] || '📁';
      var color = CAT_OV_COLORS[ci] || '#2d8a6e';
      var groupLeaf = 0, groupFilled = 0;
      var rowsHtml = '';

      function walk(nodes, depth){
        nodes.forEach(function(n){
          if (n.leaf) {
            groupLeaf++; totalLeaf++;
            if (n.has) { groupFilled++; totalFilled++; }
            var kdcl = n.kdcl ? escapeHtml(n.kdcl) : '';
            rowsHtml += '<tr style="page-break-inside:avoid">'
              + '<td style="padding:5px 8px;font-weight:600;color:#444;width:60px;border-bottom:1px solid #f3f6f4">' + escapeHtml(n.code) + '</td>'
              + '<td style="padding:5px 8px;border-bottom:1px solid #f3f6f4">' + escapeHtml(n.name) + '</td>'
              + '<td style="padding:5px 8px;text-align:right;color:#666;font-size:9.5pt;width:100px;border-bottom:1px solid #f3f6f4">' + kdcl + '</td>'
              + '</tr>';
          } else if (n.children) {
            rowsHtml += '<tr><td colspan="3" style="padding:10px 8px 4px;font-weight:700;color:' + color + ';font-size:10.5pt;font-style:italic">'
              + escapeHtml(n.code) + '. ' + escapeHtml(n.name) + '</td></tr>';
            walk(n.children, depth + 1);
          }
        });
      }
      walk(cat.children || [], 0);

      bodyHtml += '<div style="page-break-inside:auto;margin-top:18px">'
        + '<h2 style="background:' + color + ';color:white;padding:10px 14px;font-size:13pt;margin:0;page-break-after:avoid;border-radius:4px">' + icon + ' ' + (ci+1) + '. ' + escapeHtml(cat.name).toUpperCase() + '</h2>'
        + '<div style="font-size:9.5pt;color:#666;padding:4px 14px 8px;font-style:italic">' + groupLeaf + ' hồ sơ · ' + groupFilled + ' đã có link Drive</div>'
        + '<table style="width:100%;border-collapse:collapse;font-family:\'Times New Roman\',serif;font-size:11pt">' + rowsHtml + '</table>'
        + '</div>';
    });

    var toolbar = forWord ? '' : '<div class="toolbar"><button onclick="window.print()">🖨 In ngay</button> <button onclick="window.close()" style="background:#888">✕ Đóng</button></div>';
    var styles = ''
      + '@page{size:A4;margin:2cm}'
      + 'body{font-family:"Times New Roman",serif;font-size:11pt;color:#222;margin:0;line-height:1.5}'
      + '.cover{text-align:center;padding-top:6cm;page-break-after:always;min-height:100vh;position:relative}'
      + '.cover h1{font-size:26pt;margin:18pt 0;letter-spacing:1.5px;font-weight:700}'
      + '.cover .school{font-size:18pt;font-weight:700;margin:8pt 0;color:#1e6b54;text-transform:uppercase}'
      + '.cover .year{font-size:14pt;margin:6pt 0;font-style:italic}'
      + '.cover .stats{font-size:12pt;margin-top:48pt;color:#444}'
      + '.cover-footer{position:absolute;bottom:60pt;left:0;right:0;font-size:9.5pt;color:#666;font-style:italic}'
      + 'h2{page-break-after:avoid}'
      + '.sign-section{margin-top:36pt;display:table;width:100%;page-break-inside:avoid}'
      + '.sign-block{display:table-cell;width:50%;text-align:center;vertical-align:top}'
      + '.sign-block.right{padding-left:50%}'
      + '.sign-role{font-weight:700;font-size:12pt;text-transform:uppercase;margin-bottom:4pt}'
      + '.sign-note{font-style:italic;font-size:10pt;color:#666;margin-bottom:72pt}'
      + '.sign-name{font-weight:700;font-size:12pt}'
      + '.toolbar{position:fixed;top:8px;right:8px;background:rgba(255,255,255,.95);padding:8px;border-radius:8px;font-family:sans-serif;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:9999}'
      + '.toolbar button{padding:8px 14px;border-radius:6px;border:0;background:#1e6b54;color:white;font-weight:600;cursor:pointer;margin:0 2px;font-family:inherit}'
      + '@media print{.toolbar{display:none!important}}';

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Danh mục Hồ sơ số — ' + escapeHtml(schoolName) + '</title>'
      + '<style>' + styles + '</style></head><body>'
      + toolbar
      + '<div class="cover">'
      + '<div class="school">' + escapeHtml(schoolName) + '</div>'
      + '<h1>DANH MỤC<br>HỒ SƠ SỐ</h1>'
      + '<div class="year">Năm học 2025 - 2026</div>'
      + '<div class="stats"><b>' + totalLeaf + '</b> hồ sơ · <b>' + HSS.length + '</b> nhóm chức năng · <b>' + totalFilled + '</b> đã có link Drive</div>'
      + '<div class="cover-footer">Theo TT 17/2018 (sửa đổi bởi TT 22/2024) · TT 15/2026<br>Thiết kế: Chung Trần</div>'
      + '</div>'
      + bodyHtml
      + '<div class="sign-section">'
      + '<div class="sign-block right">'
      + '<div style="font-style:italic;margin-bottom:8pt">Quảng Châu, ' + dateStr + '</div>'
      + '<div class="sign-role">HIỆU TRƯỞNG</div>'
      + '<div class="sign-note">(Ký, ghi rõ họ tên, đóng dấu)</div>'
      + '<div class="sign-name">&nbsp;</div>'
      + '</div></div>'
      + '</body></html>';
  }

  window.printCatalogOverview = function(){
    if (!HSS || !HSS.length) { alert('Chưa có dữ liệu Hồ sơ số để in.'); return; }
    var html = _buildCatalogPrintHTML(false);
    var w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { alert('Trình duyệt đã chặn popup.\nVui lòng cho phép popup cho trang này rồi thử lại.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Đợi render xong rồi mở print dialog
    setTimeout(function(){ try { w.focus(); w.print(); } catch(e){} }, 700);
  };

  window.exportCatalogWord = function(){
    if (!HSS || !HSS.length) { alert('Chưa có dữ liệu Hồ sơ số để xuất.'); return; }
    var html = _buildCatalogPrintHTML(true);
    // BOM ﻿ giúp Word nhận charset UTF-8 chuẩn
    var blob = new Blob(['﻿', html], { type: 'application/msword' });
    var schoolEl = document.getElementById('navSchoolName');
    var schoolSlug = ((schoolEl && schoolEl.textContent.trim()) || 'TH').replace(/[^\p{L}\d]+/gu, '_').replace(/^_+|_+$/g, '');
    var d = new Date();
    var dateSlug = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    var fname = 'DanhMuc-HSS-' + schoolSlug + '-' + dateSlug + '.doc';
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  };

  // ============ BẢNG MÃ HÓA MINH CHỨNG KĐCL (TT17/2018 + TT22/2024) ============
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


  // ============ GIỚI THIỆU ============
  function renderAbout(){
    // Ảnh: lấy ảnh loại 'truong' đầu tiên, hoặc ảnh đầu tiên bất kỳ
    if(IMAGES && IMAGES.length){
      var img = IMAGES.find(function(i){return i.type==='truong';}) || IMAGES[0];
      if(img && img.url){
        document.getElementById('aboutImg').src = img.url;
        document.getElementById('aboutImg').alt = img.title || (STATS.config && STATS.config.name) || 'Trường Tiểu học';
      }
    }
    // Cập nhật mô tả với thông tin thật
    var cfg = STATS.config || {};
    var name = cfg.name || 'Trường Tiểu học Diễn Liên';
    var addr = cfg.address || 'Xã Quảng Châu, Tỉnh Nghệ An';
    var tcCount = STATS.totalTeachers || 0;
    document.getElementById('aboutDesc1').textContent = name + ' tọa lạc tại ' + addr + '. Trường luôn nỗ lực xây dựng môi trường giáo dục an toàn, thân thiện, hiệu quả.';
    if(tcCount) document.getElementById('aboutDesc2').textContent = 'Với đội ngũ ' + tcCount + ' CB,GV,NV tận tâm, nhà trường cam kết mang đến chương trình giáo dục chất lượng cao theo CTGDPT 2018.';
  }

  // ============ HERO CAROUSEL (ảnh từ Sheet "Hinh Anh") ============
  function renderCarousel(){
    if(!IMAGES.length) return;
    const carousel = document.getElementById('carousel');
    // Lấy tối đa 5 ảnh đầu tiên cho băng chuyền — chỉ hiển thị ảnh full-bleed, không caption
    const slidesData = IMAGES.slice(0, 5);
    const slidesHTML = slidesData.map((img, i) => {
      const alt = img.title || ('Ảnh ' + (i+1));
      return `<div class="slide${i===0?' active':''}" role="img" aria-label="${escapeHtml(alt)}" style="background-image:url('${escapeHtml(img.url)}')"></div>`;
    }).join('');
    // Dots indicator (chỉ hiển thị nếu có >= 2 ảnh)
    const dotsHTML = slidesData.length >= 2 ? `<div class="hero-dots" id="heroDots">${
      slidesData.map((_, i) => `<button class="dot-i${i===0?' active':''}" data-idx="${i}" aria-label="Ảnh ${i+1}"></button>`).join('')
    }</div>` : '';
    carousel.innerHTML = slidesHTML + dotsHTML;

    const slides = carousel.querySelectorAll('.slide');
    const dots = carousel.querySelectorAll('.dot-i');
    let current = 0;
    const total = slides.length;
    if (total <= 1) return;

    function render(){
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }
    let timer = setInterval(() => { current = (current+1)%total; render(); }, 5000);
    // Click dot để chuyển ảnh, reset timer
    dots.forEach((d) => {
      d.addEventListener('click', () => {
        current = parseInt(d.dataset.idx, 10) || 0;
        render();
        clearInterval(timer);
        timer = setInterval(() => { current = (current+1)%total; render(); }, 5000);
      });
    });
    // Pause khi hover (UX nhỏ)
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => {
      timer = setInterval(() => { current = (current+1)%total; render(); }, 5000);
    });
  }

  // ============ FETCH DATA FROM GAS API ============
  // ⭐ CACHE_KEY + CACHE_TTL đã chuyển sang core-shared.js Phần 3 (Refactor 2026-05-12 · Bước 1d).

  // 2026-05-10: Lọc Nhóm 9 (Hồ sơ CBGV-NV). Module hồ sơ nhân sự đã có riêng ở
  // mục #teachers (Hồ sơ CBGVNV). Trong Danh mục Hồ sơ số chỉ giữ lại hồ sơ
  // chuyên môn lớp/giáo viên: "Sổ chủ nhiệm" (mã 9.2.x).
  function _trimGroupCBGV(hss){
    if (!Array.isArray(hss)) return hss;
    const KEEP = /sổ\s*chủ\s*nhiệm/i;
    function filterTree(nodes){
      const out = [];
      (nodes || []).forEach(function(n){
        if (n.leaf){
          if (KEEP.test(n.name)) out.push(n);
        } else if (n.children){
          // Group con: nếu name khớp thì giữ nguyên cả nhánh (để hiện đầy đủ
          // các "Sổ chủ nhiệm lớp 1A/1B/..."), ngược lại đệ quy lọc bên trong.
          if (KEEP.test(n.name)){
            out.push(n);
          } else {
            const sub = filterTree(n.children);
            if (sub.length) out.push(Object.assign({}, n, { children: sub }));
          }
        }
      });
      return out;
    }
    return hss.map(function(cat, idx){
      // Nhóm 9 — index 8. Nhận diện thêm theo tên phòng khi backend đổi thứ tự.
      const isCBGV = idx === 8 || /CBGV|cán\s*bộ.*giáo\s*viên|nhân\s*sự/i.test(cat.name || '');
      if (!isCBGV) return cat;
      const kept = filterTree(cat.children || []);
      return Object.assign({}, cat, { children: kept });
    });
  }

  function boot(data, isCache){
    HSS = data.hss || [];
    // 2026-05-10: Nhóm 9 (Hồ sơ CBGV-NV) đã có module riêng ở mục #teachers
    // → ẩn các hồ sơ nhân sự, chỉ giữ "Sổ chủ nhiệm" hiển thị trong Danh mục Hồ sơ số.
    HSS = _trimGroupCBGV(HSS);
    // ⭐ PHẦN 1.1: Prefetch HSS_Status ngay khi có HSS tree → khi user click cat thì cache đã sẵn
    // (giảm độ trễ từ 1-3s blocking xuống ~instant). Không await — chạy nền.
    if (typeof loadHssStatusForPublic === 'function') {
      try { loadHssStatusForPublic(); } catch(e){}
    }
    TEACHERS = data.teachers || [];
    // ⭐ FE-fallback: tự suy gradeKey từ tên lớp nếu backend chưa gán đúng (vd "1A" → khoi1, "Lớp 4B" → khoi4)
    // 2026-05-08: Backend hiện trả "other" cho mọi lớp → coi "other"/"" như chưa gán, tự suy lại từ tên
    CLASSES = (data.classes || []).map(function(c){
      if (!c.gradeKey || c.gradeKey === 'other') {
        var m = String(c.name||'').match(/(\d)/);
        var k = m ? parseInt(m[1], 10) : 0;
        c.gradeKey = (k >= 1 && k <= 5) ? ('khoi' + k) : '';
      }
      if (!c.gradeLabel && c.gradeKey) {
        c.gradeLabel = ({khoi1:'Khối 1',khoi2:'Khối 2',khoi3:'Khối 3',khoi4:'Khối 4',khoi5:'Khối 5'})[c.gradeKey] || '';
      }
      if (!c.gradeGroup && c.gradeLabel) c.gradeGroup = c.gradeLabel;
      return c;
    });
    IMAGES = data.images || [];
    // 2026-05-09: nếu sheet MinhChung <90 dòng (chưa đủ chuẩn 95 MC TT17+22)
    // → fallback về DEFAULT_MC_FULL built-in. Tránh modal hiện thiếu/sai khi
    // sheet có data test cũ (vd 28 dòng rác).
    MINHCHUNG = (data.minhchung && data.minhchung.length >= 90) ? data.minhchung : DEFAULT_MC.slice();
    STATS = data.stats || {};
    // Expose globals cho IIFE Phần 2 (KĐCL bridge — dùng STATS/TEACHERS/CLASSES để build payload)
    window.HSS = HSS; window.TEACHERS = TEACHERS; window.CLASSES = CLASSES;
    window.IMAGES = IMAGES; window.MINHCHUNG = MINHCHUNG; window.STATS = STATS;
    renderCarousel();
    renderAbout();
    renderStats();
    admApplyConfig();
    renderCategories();
    showGradeOverview();
    renderTeacherLanding();
    const ls = document.getElementById('loadScreen');
    if(ls){ ls.classList.add('done'); setTimeout(() => ls.remove(), 500); }
    if(isCache){
      // Đã dùng cache → refresh ngầm từ GAS
      fetchGAS(function(freshData){
        try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: freshData})); } catch(e){}
        boot(freshData, false);
      }, function(){}); // im lặng nếu lỗi refresh ngầm
    }
  }

  // ⭐ loadError, fetchGAS, loadData — đã chuyển sang core-shared.js Phần 3.
  //   loadData() cũ → gọi `loadDataShared(boot)` ở cuối file. Hàm `boot(data, isCache)`
  //   ngay phía trên giữ nguyên trong app.js (vì render UI riêng của HSS).
  //   (Refactor 2026-05-12 · Bước 1d)

  // ============ ADMIN PANEL ============
  const ADM_KEY = 'thAdmin';
  const ADM_DEFAULT_PWD = 'admin123';

  function _admGet(){
    try{ return JSON.parse(localStorage.getItem(ADM_KEY)) || {}; } catch(e){ return {}; }
  }
  function _admSet(obj){
    const cur = _admGet();
    Object.assign(cur, obj);
    try{ localStorage.setItem(ADM_KEY, JSON.stringify(cur)); } catch(e){}
  }
  function _admPwd(){ return _admGet().pwd || ADM_DEFAULT_PWD; }

  function openAdmin(){
    // ⭐ Chỉ 1 cổng khoá: mã Admin (Hiệu trưởng/PHT). Đã pass → vào thẳng panel.
    requireAuth('admin', function(){
      window._admLoggedIn = true;
      document.getElementById('adminOverlay').classList.add('open');
      document.getElementById('admLogin').style.display = 'none';
      document.getElementById('admMain').style.display = 'flex';
      admLoadInfo();
    });
  }
  function closeAdmin(){
    document.getElementById('adminOverlay').classList.remove('open');
  }

  function admDoLogin(){
    const input = document.getElementById('admPwdInput').value;
    if(input === _admPwd()){
      window._admLoggedIn = true;
      document.getElementById('admLogin').style.display = 'none';
      document.getElementById('admMain').style.display = 'flex';
      admLoadInfo();
    } else {
      const msg = document.getElementById('admLoginMsg');
      msg.textContent = '❌ Sai mật khẩu. Mật khẩu mặc định: admin123';
      msg.className = 'adm-alert err';
    }
  }

  function admTab(tab){
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    // 2026-05-07: thêm 'hsmgr' (Quản lý HS đơn lẻ — Phase 2)
    const map = {info:'Info', hss:'Hss', hssStatus:'HssStatus', mc:'Mc', hsmgr:'Hsmgr', import:'Import', pwd:'Pwd'};
    document.getElementById('admSec' + (map[tab]||tab)).classList.add('active');
    if(tab === 'hss') admLoadHSS();
    if(tab === 'hssStatus') admHssStatusReload();
    if(tab === 'mc') admLoadMC();
    if(tab === 'hsmgr') hsMgrLoad();
    if(tab === 'import') { try { _admUpdateApiUrlHint(); } catch(e){} }
  }

  // --- Tab 1: Thông tin trường ---
  function admLoadInfo(){
    const adm = _admGet();
    const cfg = STATS.config || {};
    document.getElementById('admName').value = adm.schoolName || cfg.name || '';
    document.getElementById('admAddr').value = adm.schoolAddr || cfg.address || '';
    document.getElementById('admPhone').value = adm.schoolPhone || cfg.phone || '';
    document.getElementById('admEmail').value = adm.schoolEmail || cfg.email || '';
    document.getElementById('admYear').value = adm.schoolYear || cfg.schoolYear || '';
    // ⭐ NEW: Hiệu trưởng + Phó Hiệu trưởng
    var elPri = document.getElementById('admPrincipal');
    var elVice = document.getElementById('admVicePrincipal');
    if (elPri)  elPri.value  = adm.principal     || cfg.principal     || '';
    if (elVice) elVice.value = adm.vicePrincipal || cfg.vicePrincipal || '';
    // URL API hardcoded trong index.html, không cho sửa trong Admin UI nữa
    // 2026-05-07: theme đã unified về NAVY duy nhất — bỏ theme picker khỏi UI.
  }

  function admSaveInfo(){
    const name = document.getElementById('admName').value.trim();
    const addr = document.getElementById('admAddr').value.trim();
    const phone = document.getElementById('admPhone').value.trim();
    const email = document.getElementById('admEmail').value.trim();
    const year = document.getElementById('admYear').value.trim();
    // ⭐ NEW: Hiệu trưởng + Phó HT
    const elPri = document.getElementById('admPrincipal');
    const elVice = document.getElementById('admVicePrincipal');
    const principal     = elPri  ? elPri.value.trim()  : '';
    const vicePrincipal = elVice ? elVice.value.trim() : '';

    _admSet({ schoolName: name, schoolAddr: addr, schoolPhone: phone, schoolEmail: email, schoolYear: year, principal: principal, vicePrincipal: vicePrincipal });
    admApplyConfig();

    // Ghi lên Google Sheet (CauHinh)
    const msg = document.getElementById('admInfoMsg');
    msg.textContent = '⏳ Đang lưu lên Google Sheet...';
    msg.className = 'adm-alert warn';
    admPostToGAS({
      action: 'updateConfig',
      config: { name: name, address: addr, phone: phone, email: email, schoolYear: year, principal: principal, vicePrincipal: vicePrincipal }
    }, function(ok, resp){
      if(ok){
        msg.textContent = '✅ Đã lưu thành công lên Google Sheet!';
        msg.className = 'adm-alert ok';
        // Xóa cache để lần tải sau lấy dữ liệu mới
        try{ localStorage.removeItem(CACHE_KEY); } catch(e){}
      } else {
        msg.textContent = '⚠️ Đã lưu trên trình duyệt. Lỗi ghi Sheet: ' + (resp || 'Không kết nối được');
        msg.className = 'adm-alert warn';
      }
      setTimeout(() => msg.className = 'adm-alert', 5000);
    });
  }

  function admApplyConfig(){
    const adm = _admGet();
    // 2026-05-07: theme đã unified về NAVY duy nhất — không còn switch theme.
    // Xoá data-theme attribute nếu còn sót từ phiên bản cũ.
    document.documentElement.removeAttribute('data-theme');
    // Ưu tiên dữ liệu từ Google Sheet (STATS.config) hơn localStorage cũ,
    // tránh trường hợp localStorage còn sót tên trường cũ.
    const liveName = (window.STATS && STATS.config && STATS.config.name) || adm.schoolName;
    if(liveName){
      document.querySelectorAll('.logo span').forEach(el => {
        if(!el.classList.contains('dot')) el.textContent = liveName.replace(/^Trường\s*/i,'');
      });
      document.title = 'Hồ sơ số - ' + liveName;
    }
    if(adm.schoolAddr) document.getElementById('cfgAddress').textContent = adm.schoolAddr;
    if(adm.schoolPhone) document.getElementById('cfgPhone').textContent = adm.schoolPhone;
    if(adm.schoolEmail) document.getElementById('cfgEmail').textContent = adm.schoolEmail;
    if(adm.schoolYear) document.getElementById('schoolYear').textContent = adm.schoolYear;
    if(adm.schoolName && adm.schoolAddr){
      const heroP = document.querySelector('.hero-content p');
      if(heroP) heroP.textContent = '📍 ' + adm.schoolName + ' – ' + adm.schoolAddr;
    }
    // Bản đồ — lấy link Google Maps từ CauHinh.B10 (key "Google Map")
    applyMapEmbed();
  }

  // ----- Chuyển đổi link Google Maps bất kỳ → iframe embed URL -----
  function _toMapEmbed(raw, addr){
    const url = String(raw || '').trim();
    if(!url) return null;
    // 1) Đã là embed URL → dùng trực tiếp
    if(url.indexOf('/maps/embed') >= 0) return url;
    // 2) Người dùng dán cả thẻ <iframe ... src="..."> → lôi ra src
    const srcMatch = url.match(/<iframe[^>]*src=["']([^"']+)["']/i);
    if(srcMatch) return srcMatch[1];
    // 3) Tọa độ trong URL dạng @lat,lng,zoom → dùng embed theo tọa độ
    const coord = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)z)?/);
    if(coord){
      const lat = coord[1], lng = coord[2], z = coord[3] || '16';
      return 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&z=' + z + '&output=embed';
    }
    // 4) URL q=lat,lng
    const qc = url.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if(qc){
      return 'https://maps.google.com/maps?q=' + qc[1] + ',' + qc[2] + '&z=16&output=embed';
    }
    // 5) Fallback: tìm theo địa chỉ text
    const q = encodeURIComponent(addr || url);
    return 'https://maps.google.com/maps?q=' + q + '&z=15&output=embed';
  }

  function applyMapEmbed(){
    const cfg = (window.STATS && STATS.config) || {};
    const raw = cfg.mapUrl || cfg.googleMap || cfg['Google Map'] || '';
    const addr = cfg.address || '';
    const ifr = document.getElementById('mapIframe');
    if(!ifr) return;
    const embed = _toMapEmbed(raw, addr);
    if(embed) ifr.src = embed;
  }

  // --- Tab 2: Chỉnh sửa Hồ sơ số ---
  let _hssRawRows = []; // lưu dữ liệu gốc từ Sheet

  function admLoadHSS(){
    // Lấy dữ liệu từ cache hoặc API đã fetch
    const wrap = document.getElementById('admHssTable');
    if(!HSS.length){
      wrap.innerHTML = '<p style="padding:30px;text-align:center;color:#8a9690">Chưa có dữ liệu. Nhấn Làm mới.</p>';
      return;
    }
    // Flatten HSS tree thành danh sách phẳng
    _hssRawRows = [];
    function walk(nodes, depth){
      nodes.forEach(n => {
        _hssRawRows.push({
          code: n.code || '',
          name: n.name || '',
          link: n.link || '',
          assign: n.assign || '',
          kdcl: n.kdcl || '',     // ⭐ FIX: pass-through Mã hóa KĐCL (cột 5)
          leaf: !!n.leaf,
          has: !!n.has,
          depth: depth
        });
        if(n.children) walk(n.children, depth + 1);
      });
    }
    walk(HSS, 0);
    admRenderHSSTable(_hssRawRows);
  }

  function admRenderHSSTable(rows){
    const wrap = document.getElementById('admHssTable');
    if(!rows.length){
      wrap.innerHTML = '<p style="padding:20px;text-align:center;color:#8a9690">Không tìm thấy hồ sơ.</p>';
      return;
    }
    let html = '<table class="adm-edit-table"><thead><tr><th style="width:28px"></th><th>Tên hồ sơ</th><th style="width:38%">Link Google Drive</th><th style="width:60px"></th></tr></thead><tbody>';
    rows.forEach((r, i) => {
      const indent = r.depth > 0 ? 'padding-left:' + (r.depth * 16) + 'px' : '';
      const isBold = !r.leaf;
      const dot = r.leaf ? (r.has ? '<span style="color:#3fb28c">●</span>' : '<span style="color:#cbd3cf">●</span>') : '📂';
      html += `<tr data-idx="${i}">
        <td class="row-status">${dot}</td>
        <td style="${indent}">
          <span id="hssN${i}" style="${isBold?'font-weight:600;color:var(--g-deep)':''}" ondblclick="admHssEdit(${i})"><span style="color:#8a9690;font-size:.72rem;margin-right:4px">${escapeHtml(r.code)}.</span>${escapeHtml(r.name)}</span>
          <input type="text" id="hssI${i}" value="${escapeHtml(r.name)}" style="display:none" onblur="admHssCommit(${i})" onkeydown="if(event.key==='Enter')this.blur()">
        </td>
        <td>${r.leaf ? `<input type="text" value="${escapeHtml(r.link)}" placeholder="Dán link Drive..." onchange="admHssLink(${i},this.value)">` : ''}</td>
        <td style="white-space:nowrap">
          <button onclick="admHssEdit(${i})" style="background:none;border:none;cursor:pointer;font-size:.85rem;padding:2px 4px;border-radius:4px;opacity:.45" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.45" title="Sửa tên">✏️</button>
          <button onclick="admHssDelete(${i})" style="background:none;border:none;cursor:pointer;font-size:.85rem;padding:2px 4px;border-radius:4px;opacity:.35" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.35" title="Xóa dòng này">🗑️</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function admHssEdit(i){
    const span = document.getElementById('hssN'+i);
    const inp = document.getElementById('hssI'+i);
    if(!span||!inp) return;
    span.style.display='none'; inp.style.display=''; inp.focus(); inp.select();
  }
  function admHssCommit(i){
    const span = document.getElementById('hssN'+i);
    const inp = document.getElementById('hssI'+i);
    if(!span||!inp) return;
    const v = inp.value.trim();
    if(v && _hssRawRows[i]){
      _hssRawRows[i].name = v;
      const code = '<span style="color:#8a9690;font-size:.72rem;margin-right:4px">'+escapeHtml(_hssRawRows[i].code)+'.</span>';
      span.innerHTML = code + escapeHtml(v);
    }
    span.style.display=''; inp.style.display='none';
  }
  function admHssLink(i, val){
    if(_hssRawRows[i]) _hssRawRows[i].link = val.trim();
  }

  function admHssDelete(i){
    if(!_hssRawRows[i]) return;
    const r = _hssRawRows[i];
    const label = r.code + '. ' + r.name;
    if(!confirm('Xóa "' + label + '"?\n\nNhấn "Lưu thay đổi" sau khi xóa để cập nhật lên Sheet.')) return;
    _hssRawRows.splice(i, 1);
    admRenderHSSTable(_hssRawRows);
    const msg = document.getElementById('admHssMsg');
    msg.textContent = '🗑️ Đã xóa "' + label + '". Nhấn "Lưu thay đổi" để cập nhật lên Sheet.';
    msg.className = 'adm-alert warn';
    setTimeout(() => msg.className = 'adm-alert', 5000);
  }

  function admAddHSS(){
    const code = document.getElementById('admNewCode').value.trim();
    const name = document.getElementById('admNewName').value.trim();
    const link = document.getElementById('admNewLink').value.trim();
    const msg = document.getElementById('admHssMsg');
    if(!code || !name){
      msg.textContent = '❌ Vui lòng nhập mã và tên danh mục hồ sơ.';
      msg.className = 'adm-alert err';
      setTimeout(() => msg.className = 'adm-alert', 3000);
      return;
    }
    // Xác định depth từ mã (1 = depth 0, 1.1 = depth 1, 1.1.1 = depth 2, ...)
    const depth = (code.match(/\./g) || []).length;
    const isLeaf = !!link; // có link = hồ sơ lá
    const newRow = { code, name, link, assign:'', kdcl:'', leaf: isLeaf, has: !!link, depth };

    // Chèn vào vị trí đúng theo mã
    let insertAt = _hssRawRows.length;
    for(let i = 0; i < _hssRawRows.length; i++){
      if(_hssRawRows[i].code.localeCompare(code, 'vi', {numeric:true}) > 0){
        insertAt = i; break;
      }
    }
    _hssRawRows.splice(insertAt, 0, newRow);
    admRenderHSSTable(_hssRawRows);

    // Xóa form
    document.getElementById('admNewCode').value = '';
    document.getElementById('admNewName').value = '';
    document.getElementById('admNewLink').value = '';
    msg.textContent = '✅ Đã thêm "' + code + '. ' + name + '". Nhấn "Lưu thay đổi" để ghi lên Sheet.';
    msg.className = 'adm-alert ok';
    setTimeout(() => msg.className = 'adm-alert', 4000);

    // Cuộn đến dòng vừa thêm
    const wrap = document.getElementById('admHssTable');
    const row = wrap.querySelector('tr[data-idx="' + insertAt + '"]');
    if(row){ row.style.background = '#eaf5ef'; row.scrollIntoView({behavior:'smooth', block:'center'}); setTimeout(() => row.style.background = '', 2000); }
  }

  function admFilterHSS(){
    const q = document.getElementById('admHssSearch').value.trim().toLowerCase();
    if(!q){ admRenderHSSTable(_hssRawRows); return; }
    admRenderHSSTable(_hssRawRows.filter(r =>
      r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    ));
  }

  function admSaveHSS(){
    const msg = document.getElementById('admHssMsg');
    if(!_hssRawRows.length){
      msg.textContent = '❌ Chưa có dữ liệu hồ sơ.';
      msg.className = 'adm-alert err'; return;
    }
    // Rebuild rows for Sheet format: [TT, "Tên", "Link", "Phân công", "Mã hóa"]
    // ⭐ FIX BUG: trước đây cột 5 (Mã hóa) bị set rỗng → mỗi lần Save đều corrupt data.
    // Giờ giữ nguyên r.kdcl để cột Mã hóa không bị xoá.
    const sheetRows = _hssRawRows.map((r, i) => {
      const tt = r.leaf ? (i + 1) : '';
      const fullName = r.code + '. ' + r.name;
      return [tt, fullName, r.link || '', r.assign || '', r.kdcl || ''];
    });
    msg.textContent = '⏳ Đang lưu...';
    msg.className = 'adm-alert warn';
    admPostToGAS({action: 'updateHSS', rows: sheetRows}, function(ok, resp){
      if(ok){
        msg.textContent = '✅ Đã lưu ' + sheetRows.length + ' dòng hồ sơ lên Google Sheet!';
        msg.className = 'adm-alert ok';
      } else {
        msg.textContent = '❌ Lỗi: ' + (resp || 'Không kết nối được API');
        msg.className = 'adm-alert err';
      }
      setTimeout(() => msg.className = 'adm-alert', 5000);
    });
  }

  // ============================================================================
  // ⭐ TRẠNG THÁI HỒ SƠ SỐ — Đã có / Chưa có (giống MN Diễn Xuân)
  // Logic: gọi API getHssStatus → render bảng nhóm theo nhóm hồ sơ.
  // Click vào pill trạng thái → đổi giữa "co" ↔ "chua" → save.
  // Sửa người phụ trách → blur tự lưu.
  // ============================================================================
  var _hssStatusData = null;
  var _hssStatusFilter = 'all';

  function admHssStatusReload(){
    var msg = document.getElementById('admHssStatusMsg');
    var wrap = document.getElementById('admHssStatusWrap');
    wrap.innerHTML = '<p style="padding:30px;text-align:center;color:#8a9690">⏳ Đang tải...</p>';
    msg.className = 'adm-alert';
    if (typeof admPostToGAS !== 'function' || !API_URL) {
      wrap.innerHTML = '<p style="padding:30px;text-align:center;color:#dc2626">❌ Chưa cấu hình URL backend</p>';
      return;
    }
    admPostToGAS({action: 'getHssStatus'}, function(ok, resp){
      if (!ok) {
        wrap.innerHTML = '<p style="padding:30px;text-align:center;color:#dc2626">❌ ' + (resp || 'Lỗi tải dữ liệu') + '</p>';
        return;
      }
      _hssStatusData = resp;
      admHssStatusRender();
    });
  }

  function admHssStatusRender(){
    if (!_hssStatusData || !_hssStatusData.rows) return;
    var rows = _hssStatusData.rows;
    var stats = _hssStatusData.stats || {};
    document.getElementById('admHssStatusStats').innerHTML =
      '<span style="color:#15803d">' + (stats.daCo || 0) + ' đã có</span>' +
      ' &nbsp;/&nbsp; <span style="color:#b91c1c">' + (stats.chuaCo || 0) + ' chưa có</span>' +
      ' &nbsp;/&nbsp; ' + (stats.total || 0) + ' tổng' +
      ' <span style="color:#6b7280;font-weight:500">(' + (stats.percent || 0) + '%)</span>';

    var keyword = (document.getElementById('admHssStatusSearch').value || '').toLowerCase().trim();
    var filtered = rows.filter(function(r){
      if (_hssStatusFilter === 'co' && r.trangThai !== 'co') return false;
      if (_hssStatusFilter === 'chua' && r.trangThai !== 'chua') return false;
      if (keyword) {
        var hay = (r.maHS + ' ' + r.tenHS + ' ' + (r.nguoiPhuTrach || '') + ' ' + (r.parent || '')).toLowerCase();
        if (hay.indexOf(keyword) < 0) return false;
      }
      return true;
    });

    if (!filtered.length) {
      document.getElementById('admHssStatusWrap').innerHTML =
        '<div class="hss-st-empty">' + (rows.length ? 'Không có hồ sơ nào khớp bộ lọc.' : 'Chưa có hồ sơ nào trong sheet "Danh muc HSS". Vào tab "Hồ sơ số" để thêm.') + '</div>';
      return;
    }

    // Group theo parent (nhóm cha gần nhất, vd: "1.1. Kế hoạch nhà trường")
    var groups = {}, groupOrder = [];
    filtered.forEach(function(r){
      var key = r.parent || '(Không phân loại)';
      if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
      groups[key].push(r);
    });

    var html = '';
    groupOrder.forEach(function(grpName){
      var items = groups[grpName];
      var grpDaCo = items.filter(function(x){ return x.trangThai === 'co'; }).length;
      html += '<div class="hss-st-group">📁 ' + escapeHtml(grpName) + '<span class="hss-st-group-count">' + grpDaCo + '/' + items.length + ' đã có</span></div>';
      html += '<table class="hss-st-table"><thead><tr>' +
        '<th style="width:80px">Mã HS</th>' +
        '<th>Danh mục hồ sơ</th>' +
        '<th style="width:170px">Người phụ trách</th>' +
        '<th style="width:120px;text-align:center">Trạng thái</th>' +
        '<th style="width:50px;text-align:center">Link</th>' +
        '</tr></thead><tbody>';
      items.forEach(function(r){
        var pillClass = r.trangThai === 'co' ? 'co' : 'chua';
        var pillLabel = r.trangThai === 'co' ? '✅ Đã có' : '⚠️ Chưa có';
        var overrideClass = r.override ? 'override' : '';
        var folder = r.hasLink
          ? '<a class="hss-st-folder" href="' + escapeHtml(r.link) + '" target="_blank" rel="noopener" title="Mở Drive">📂</a>'
          : '<span class="hss-st-folder disabled" title="Chưa có link Drive">📂</span>';
        html += '<tr>' +
          '<td><span class="hss-st-code">' + escapeHtml(r.maHS) + '</span></td>' +
          '<td><span class="hss-st-name">' + escapeHtml(r.tenHS) + '</span></td>' +
          '<td><input type="text" class="hss-st-pt" value="' + escapeHtml(r.nguoiPhuTrach || '') + '" data-mahs="' + escapeHtml(r.maHS) + '" placeholder="(không có)" onblur="admHssStatusSavePT(this)"></td>' +
          '<td style="text-align:center"><button class="hss-st-pill ' + pillClass + ' ' + overrideClass + '" onclick="admHssStatusToggle(\'' + escapeHtml(r.maHS).replace(/'/g, "\\'") + '\')" title="' + (r.override ? 'Đã đánh dấu thủ công (* = không tự động)' : 'Tự động theo link Drive') + '">' + pillLabel + '</button></td>' +
          '<td style="text-align:center">' + folder + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    });

    document.getElementById('admHssStatusWrap').innerHTML = html;
  }

  function admHssStatusFilter(f){
    if (f) _hssStatusFilter = f;
    document.querySelectorAll('.hss-filter-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.f === _hssStatusFilter);
    });
    admHssStatusRender();
  }

  function admHssStatusToggle(maHS){
    if (!_hssStatusData) return;
    var item = _hssStatusData.rows.find(function(r){ return r.maHS === maHS; });
    if (!item) return;
    var newStatus = item.trangThai === 'co' ? 'chua' : 'co';
    var msg = document.getElementById('admHssStatusMsg');
    msg.textContent = '⏳ Đang lưu trạng thái ' + maHS + '...';
    msg.className = 'adm-alert warn';
    admPostToGAS({
      action: 'saveHssStatus',
      row: { maHS: maHS, trangThai: newStatus, nguoiPhuTrach: item.nguoiPhuTrach || '', ghiChu: item.ghiChu || '' }
    }, function(ok, resp){
      if (!ok) {
        msg.textContent = '❌ Lỗi: ' + (resp || 'Không lưu được');
        msg.className = 'adm-alert err';
        return;
      }
      msg.textContent = '✅ Đã cập nhật ' + maHS + ' → ' + (newStatus === 'co' ? 'Đã có' : 'Chưa có');
      msg.className = 'adm-alert ok';
      setTimeout(function(){ msg.className = 'adm-alert'; }, 2500);
      try { localStorage.removeItem(CACHE_KEY); } catch(e){}
      // ⭐ Reset cache để public landing fetch lại lần sau
      try { if (typeof window.invalidateHssStatusCache === 'function') window.invalidateHssStatusCache(); } catch(e){}
      admHssStatusReload();
    });
  }

  function admHssStatusSavePT(input){
    var maHS = input.dataset.mahs;
    var newPT = input.value.trim();
    if (!_hssStatusData) return;
    var item = _hssStatusData.rows.find(function(r){ return r.maHS === maHS; });
    if (!item) return;
    if ((item.nguoiPhuTrach || '') === newPT) return;
    var msg = document.getElementById('admHssStatusMsg');
    msg.textContent = '⏳ Đang lưu người phụ trách của ' + maHS + '...';
    msg.className = 'adm-alert warn';
    var trangThaiSave = item.override ? item.trangThai : 'auto';
    admPostToGAS({
      action: 'saveHssStatus',
      row: { maHS: maHS, trangThai: trangThaiSave, nguoiPhuTrach: newPT, ghiChu: item.ghiChu || '' }
    }, function(ok, resp){
      if (!ok) {
        msg.textContent = '❌ Lỗi lưu PT: ' + (resp || '');
        msg.className = 'adm-alert err';
        return;
      }
      msg.textContent = '✅ Đã cập nhật người phụ trách ' + maHS;
      msg.className = 'adm-alert ok';
      setTimeout(function(){ msg.className = 'adm-alert'; }, 2500);
      item.nguoiPhuTrach = newPT;
      // ⭐ Reset cache để public landing fetch lại lần sau
      try { if (typeof window.invalidateHssStatusCache === 'function') window.invalidateHssStatusCache(); } catch(e){}
    });
  }

  // Expose to global cho onclick
  window.admHssStatusReload = admHssStatusReload;
  window.admHssStatusFilter = admHssStatusFilter;
  window.admHssStatusToggle = admHssStatusToggle;
  window.admHssStatusSavePT = admHssStatusSavePT;

  // ⭐ Quét toàn bộ link Drive thật, đếm file PDF/Word/Excel/ảnh trong từng folder.
  // Gọi backend rescanHssDrive (admin only). Có thể mất 30s–2 phút.
  function admHssRescanDrive(){
    var btn = document.getElementById('admHssRescanBtn');
    var prog = document.getElementById('admHssRescanProgress');
    var msg = document.getElementById('admHssStatusMsg');
    if (!confirm('Quét toàn bộ link Drive trong Hồ sơ số? Quá trình có thể mất 30 giây đến 2 phút tuỳ số lượng hồ sơ. Tiếp tục?')) return;

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang quét...'; btn.style.opacity = .7; }
    if (prog) { prog.style.display = 'block'; prog.textContent = 'Đang truy cập Google Drive — vui lòng không đóng tab...'; }
    if (msg) { msg.textContent = ''; msg.className = 'adm-alert'; }

    admPostToGAS({ action: 'rescanHssDrive' }, function(ok, resp){
      if (btn) { btn.disabled = false; btn.textContent = '🔄 Quét lại Drive'; btn.style.opacity = 1; }
      if (prog) { prog.style.display = 'none'; prog.textContent = ''; }
      if (!ok) {
        var errStr = String(resp || 'Unknown error');
        // ⭐ Detect "Unknown action: rescanHssDrive" → backend chưa redeploy version mới
        if (/Unknown action.*rescanHssDrive/i.test(errStr)) {
          if (msg) {
            msg.innerHTML =
              '<b style="color:#b91c1c">⚠️ Backend chưa được Triển khai phiên bản mới</b>' +
              '<div style="margin-top:8px;font-size:.85rem;line-height:1.65;color:#7c2d12">' +
              'Anh đã paste Code.gs mới nhưng <b>chỉ Save (Ctrl+S) chưa đủ</b> — Apps Script vẫn chạy bản cũ đang deploy. Cần triển khai lại:' +
              '<ol style="margin:8px 0 0 18px;padding:0">' +
                '<li>Mở Apps Script project (cùng file Code.gs).</li>' +
                '<li>Click <b>Triển khai</b> (Deploy) — góc phải trên — chọn <b>Quản lý triển khai</b> (Manage deployments).</li>' +
                '<li>Tìm deployment hiện tại → click biểu tượng <b>✏️ Chỉnh sửa</b>.</li>' +
                '<li>Ở dropdown <b>Phiên bản</b> (Version) chọn <b>Phiên bản: Mới</b> (New version).</li>' +
                '<li>Bấm <b>Triển khai</b> (Deploy). URL <b>không đổi</b>, chỉ phiên bản mới được kích hoạt.</li>' +
                '<li>Quay lại tab này → bấm <b>Quét lại Drive</b> lần nữa.</li>' +
              '</ol>' +
              '</div>';
            msg.className = 'adm-alert err';
          }
          return;
        }
        // Lỗi khác (mạng, quyền Drive, timeout...)
        if (msg) {
          msg.textContent = '❌ Quét thất bại: ' + errStr;
          msg.className = 'adm-alert err';
        }
        return;
      }
      var d = (resp && resp.data) || resp || {};
      if (msg) {
        msg.innerHTML = '✅ Đã quét xong <b>' + (d.totalLeaf || 0) + '</b> hồ sơ trong ' + (d.elapsed || '?') + 's: ' +
          '<b style="color:#15803d">' + (d.withFiles || 0) + ' có file thật</b>, ' +
          '<b style="color:#b91c1c">' + ((d.withLink || 0) - (d.withFiles || 0)) + ' folder rỗng</b>, ' +
          (d.totalLeaf - (d.withLink || 0)) + ' chưa có link' +
          ((d.errors || 0) > 0 ? ', <b style="color:#b45309">' + d.errors + ' folder không truy cập được</b>' : '');
        msg.className = 'adm-alert ok';
      }
      // Reset cache phía public landing để fetch lại lần sau
      try { if (typeof window.invalidateHssStatusCache === 'function') window.invalidateHssStatusCache(); } catch(e){}
      // Reload bảng trạng thái
      admHssStatusReload();
    });
  }
  window.admHssRescanDrive = admHssRescanDrive;

  // --- Tab 3: Nhập dữ liệu Excel ---
  let _pendingGV = null, _pendingHS = null;

  // ===== STYLE CONSTANTS (khớp pixel-perfect mẫu Excel gốc) =====
  // ===== MẪU EXCEL NHÚNG SẴN (base64) =====
  const _TPL_GV = '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';
  const _TPL_HS = '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';
  const _TPL_HSS = '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';
  const _TPL_MC = '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';

  function _b64toBlob(b64){
    var raw=atob(b64),arr=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);
    return new Blob([arr],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }

  // 2026-05-07: Helper — chọn element thông báo theo loại (hs → admHsmgrMsg, khác → admImportMsg)
  function _admMsgEl(type){
    if (type === 'hs') {
      return document.getElementById('admHsmgrMsg') || document.getElementById('admImportMsg');
    }
    return document.getElementById('admImportMsg');
  }

  function admDownloadTemplate(type){
    if(typeof XLSX==='undefined'){alert('Thư viện XLSX chưa tải xong.');return;}

    // Template HSS + MC — dùng blob base64 pre-built (đồng nhất style với GV/HS)
    if(type==='hss' || type==='mc'){
      var fileName = (type==='hss') ? 'Mau_DanhMucHSS.xlsx' : 'Mau_MinhChung.xlsx';
      var blob=_b64toBlob(type==='hss'?_TPL_HSS:_TPL_MC);
      var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName;a.click();URL.revokeObjectURL(a.href);
      var msg=document.getElementById('admImportMsg');
      msg.textContent='✅ Đã tải mẫu '+fileName;
      msg.className='adm-alert ok';
      setTimeout(function(){msg.className='adm-alert';}, 4000);
      return;
    }

    // ⭐ Export DSHocSinh kèm SĐT/cha/mẹ → cần load data nhạy cảm trước (chỉ HT mới đủ quyền xem cả trường).
    // GV không có yêu cầu này nên gọi thẳng.
    if (type === 'hs' && typeof loadStudentsAuthed === 'function') {
      var msgEl = _admMsgEl(type);
      if (msgEl) { msgEl.textContent = '⏳ Đang tải dữ liệu HS đầy đủ...'; msgEl.className = 'adm-alert'; }
      loadStudentsAuthed().then(function(){
        _admExportTemplateImpl(type);
      }).catch(function(err){
        if (msgEl) { msgEl.textContent = '⚠ ' + (err.message || 'Lỗi tải DS HS'); msgEl.className = 'adm-alert err'; }
      });
      return;
    }
    _admExportTemplateImpl(type);
  }

  // ═══════════════════════════════════════════════════════════════
  // STYLED EXPORT — palette navy đồng bộ với theme app (2026-05-07)
  // ═══════════════════════════════════════════════════════════════
  // Helper: encode (row, col) → "A1" notation
  function _xlAddr(r, c){ return XLSX.utils.encode_cell({r:r, c:c}); }
  // Border xám mờ — phân biệt hàng cột mà không gây nặng mắt
  var _BDR_THIN = { style:'thin',   color:{rgb:'CBD5E1'} };  // slate-300
  var _BDR_MED  = { style:'medium', color:{rgb:'1E4A8F'} };  // navy
  var _BDR_ALL_THIN = { top:_BDR_THIN, bottom:_BDR_THIN, left:_BDR_THIN, right:_BDR_THIN };
  // Đặt giá trị + style cho 1 cell
  function _xlSet(ws, r, c, val, style){
    var addr = _xlAddr(r, c);
    var t = (typeof val === 'number') ? 'n' : 's';
    ws[addr] = { v: (val == null ? '' : val), t: t };
    if (style) ws[addr].s = style;
  }
  // Style helpers
  var STY = {
    title: {
      font: { name:'Be Vietnam Pro', sz:14, bold:true, color:{rgb:'1E4A8F'} },
      alignment: { horizontal:'center', vertical:'center' }
    },
    subtitle: {
      font: { name:'Be Vietnam Pro', sz:10, italic:true, color:{rgb:'475569'} },
      alignment: { horizontal:'center', vertical:'center' }
    },
    section: {
      font: { name:'Be Vietnam Pro', sz:13, bold:true, color:{rgb:'0F172A'} },
      alignment: { horizontal:'center', vertical:'center' }
    },
    headerNavy: {
      font: { name:'Be Vietnam Pro', sz:11, bold:true, color:{rgb:'FFFFFF'} },
      fill: { fgColor:{rgb:'1E4A8F'} },
      alignment: { horizontal:'center', vertical:'center', wrapText:true },
      border: { top:_BDR_MED, bottom:_BDR_MED, left:_BDR_THIN, right:_BDR_THIN }
    },
    cellC: {  // center
      font: { name:'Be Vietnam Pro', sz:10, color:{rgb:'0F172A'} },
      alignment: { horizontal:'center', vertical:'center', wrapText:true },
      border: _BDR_ALL_THIN
    },
    cellL: {  // left
      font: { name:'Be Vietnam Pro', sz:10, color:{rgb:'0F172A'} },
      alignment: { horizontal:'left', vertical:'center', wrapText:true, indent:1 },
      border: _BDR_ALL_THIN
    },
    cellCAlt: {  // zebra row, center
      font: { name:'Be Vietnam Pro', sz:10, color:{rgb:'0F172A'} },
      fill: { fgColor:{rgb:'F8FAFC'} },
      alignment: { horizontal:'center', vertical:'center', wrapText:true },
      border: _BDR_ALL_THIN
    },
    cellLAlt: {  // zebra row, left
      font: { name:'Be Vietnam Pro', sz:10, color:{rgb:'0F172A'} },
      fill: { fgColor:{rgb:'F8FAFC'} },
      alignment: { horizontal:'left', vertical:'center', wrapText:true, indent:1 },
      border: _BDR_ALL_THIN
    },
    statusActive: {
      font: { name:'Be Vietnam Pro', sz:10, bold:true, color:{rgb:'166534'} },
      fill: { fgColor:{rgb:'DCFCE7'} },
      alignment: { horizontal:'center', vertical:'center' },
      border: _BDR_ALL_THIN
    },
    statusTransfer: {
      font: { name:'Be Vietnam Pro', sz:10, bold:true, color:{rgb:'92400E'} },
      fill: { fgColor:{rgb:'FEF3C7'} },
      alignment: { horizontal:'center', vertical:'center' },
      border: _BDR_ALL_THIN
    },
    note: {
      font: { name:'Be Vietnam Pro', sz:9, italic:true, color:{rgb:'64748B'} },
      alignment: { horizontal:'left', vertical:'center', wrapText:true }
    }
  };

  // Build mẫu DS Học Sinh đẹp
  function _buildStyledHSSheet(){
    var cfg = (window.STATS && STATS.config) || {};
    var schoolName = cfg.name || 'TRƯỜNG TIỂU HỌC DIỄN LIÊN';
    var schoolAddr = cfg.address || 'Xã Quảng Châu, Tỉnh Nghệ An';
    var schoolYear = cfg.schoolYear || '2025-2026';
    var headers = ['STT','Mã lớp','Mã HS','Họ và tên','Ngày sinh','Giới tính',
                   'Dân tộc','Tôn giáo','Tỉnh/TP','','Xã/Phường','Tổ/Thôn/Xóm',
                   'Nơi sinh','SĐT phụ huynh','Họ tên cha','Năm sinh cha',
                   'Họ tên mẹ','Năm sinh mẹ','Trạng thái'];
    var COL_COUNT = headers.length;  // 19
    // Cột nào căn trái (text dài)
    var leftCols = {3:1, 11:1, 12:1, 14:1, 16:1};  // tên, tổ/thôn, nơi sinh, cha, mẹ

    var ws = {};
    var R = 0;  // row pointer (0-based)

    // Hàng 1: Tên trường (merged toàn bộ chiều ngang)
    _xlSet(ws, R, 0, schoolName.toUpperCase(), STY.title);
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} });
    R++;
    // Hàng 2: Địa chỉ · Năm học
    _xlSet(ws, R, 0, schoolAddr + '   ·   Năm học ' + schoolYear, STY.subtitle);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} });
    R++;
    // Hàng 3: trống (spacer)
    R++;
    // Hàng 4: Tiêu đề DSHS
    _xlSet(ws, R, 0, 'DANH SÁCH HỌC SINH', STY.section);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} });
    R++;
    // Hàng 5: trống nhỏ
    R++;

    // Hàng 6: Header navy
    var headerRow = R;
    headers.forEach(function(h, i){
      _xlSet(ws, R, i, h, STY.headerNavy);
    });
    R++;

    // Data rows
    var stt = 0;
    var hasData = CLASSES && CLASSES.length > 0 && CLASSES.some(function(c){return c.students.length>0;});
    if (hasData) {
      CLASSES.forEach(function(cls){
        cls.students.forEach(function(s){
          stt++;
          var isAlt = (stt % 2 === 0);
          var trangThai = s.isDeleted ? 'Chuyển đi' : 'Đang học';
          var rowVals = [stt, s.classCode||'', s.studentCode||'', s.name||'',
                         s.dob||'', s.gender||'', s.ethnic||'', s.religion||'',
                         s.province||'', '', s.ward||'', s.hamlet||'',
                         s.birthplace||'', s.phone||'', s.father||'',
                         s.fatherYear||'', s.mother||'', s.motherYear||'', trangThai];
          rowVals.forEach(function(v, c){
            var sty;
            if (c === COL_COUNT - 1) {
              sty = s.isDeleted ? STY.statusTransfer : STY.statusActive;
            } else if (leftCols[c]) {
              sty = isAlt ? STY.cellLAlt : STY.cellL;
            } else {
              sty = isAlt ? STY.cellCAlt : STY.cellC;
            }
            _xlSet(ws, R, c, v, sty);
          });
          R++;
        });
      });
    } else {
      // Mẫu trống — tạo 3 hàng demo để admin biết format
      var demos = [
        [1, '1A', 'HS001', 'Nguyễn Văn A',  '15/03/2018', 'Nam', 'Kinh', '', 'Nghệ An', '', 'Quảng Châu', 'Xóm 5', 'Quảng Châu, Nghệ An', '0901234567', 'Nguyễn Văn B', '1985', 'Trần Thị C', '1987', 'Đang học'],
        [2, '1A', 'HS002', 'Trần Thị B',    '22/07/2018', 'Nữ',  'Kinh', '', 'Nghệ An', '', 'Quảng Châu', 'Xóm 3', 'Quảng Châu, Nghệ An', '0912345678', 'Trần Văn D', '1983', 'Lê Thị E',  '1986', 'Đang học'],
        [3, '1B', 'HS003', 'Lê Hoàng C',    '10/11/2018', 'Nam', 'Kinh', '', 'Nghệ An', '', 'Quảng Châu', 'Xóm 7', 'Quảng Châu, Nghệ An', '',           'Lê Văn F',   '1984', 'Phạm Thị G','1988', 'Đang học']
      ];
      demos.forEach(function(rowVals, idx){
        var isAlt = (idx % 2 === 1);
        rowVals.forEach(function(v, c){
          var sty;
          if (c === COL_COUNT - 1) {
            sty = STY.statusActive;
          } else if (leftCols[c]) {
            sty = isAlt ? STY.cellLAlt : STY.cellL;
          } else {
            sty = isAlt ? STY.cellCAlt : STY.cellC;
          }
          _xlSet(ws, R, c, v, sty);
        });
        R++;
      });
    }

    // Hàng cuối: ghi chú
    R++;
    _xlSet(ws, R, 0, '💡 Lưu ý: cột "Trạng thái" — "Đang học" cho HS hiện đang theo học, "Chuyển đi" cho HS đã chuyển trường. Để trống cũng được — hệ thống mặc định "Đang học".', STY.note);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} });

    // Column widths — căn cứ độ dài thực tế từng cột
    ws['!cols'] = [
      {wch:5},   // STT
      {wch:9},   // Mã lớp
      {wch:11},  // Mã HS
      {wch:30},  // Họ tên
      {wch:12},  // Ngày sinh
      {wch:9},   // Giới tính
      {wch:10},  // Dân tộc
      {wch:10},  // Tôn giáo
      {wch:14},  // Tỉnh/TP
      {wch:3},   // (cột dự phòng)
      {wch:16},  // Xã/Phường
      {wch:18},  // Tổ/Thôn
      {wch:24},  // Nơi sinh
      {wch:14},  // SĐT
      {wch:22},  // Họ tên cha
      {wch:11},  // Năm sinh cha
      {wch:22},  // Họ tên mẹ
      {wch:11},  // Năm sinh mẹ
      {wch:11}   // Trạng thái
    ];

    // Row heights
    var rh = [];
    rh[0] = {hpt:26}; rh[1] = {hpt:18}; rh[2] = {hpt:6};
    rh[3] = {hpt:22}; rh[4] = {hpt:6};  rh[headerRow] = {hpt:32};
    ws['!rows'] = rh;

    // Freeze pane: cố định cột STT + tất cả header rows (gồm title + section + col header)
    ws['!views'] = [{ state:'frozen', xSplit:1, ySplit:headerRow+1, topLeftCell:'B'+(headerRow+2) }];

    // Print: landscape, fit 1 page wide
    ws['!margins'] = { left:0.4, right:0.4, top:0.5, bottom:0.5, header:0.3, footer:0.3 };
    ws['!pageSetup'] = { orientation:'landscape', fitToWidth:1, paperSize:9 };  // A4

    // !ref bao trùm toàn bộ
    ws['!ref'] = 'A1:' + _xlAddr(R, COL_COUNT-1);
    return ws;
  }

  // Build mẫu DSGV — cùng template style
  function _buildStyledGVSheet(){
    var cfg = (window.STATS && STATS.config) || {};
    var schoolName = cfg.name || 'TRƯỜNG TIỂU HỌC DIỄN LIÊN';
    var schoolAddr = cfg.address || 'Xã Quảng Châu, Tỉnh Nghệ An';
    var schoolYear = cfg.schoolYear || '2025-2026';
    var headers = ['TT','Họ và tên','Ngày sinh','Chức vụ','Trình độ','SĐT','Gmail','Link hồ sơ'];
    var COL_COUNT = headers.length;  // 8
    var leftCols = {1:1, 3:1, 6:1, 7:1};  // tên, chức vụ, gmail, link

    var ws = {};
    var R = 0;
    if (!ws['!merges']) ws['!merges'] = [];

    _xlSet(ws, R, 0, schoolName.toUpperCase(), STY.title);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} }); R++;
    _xlSet(ws, R, 0, schoolAddr + '   ·   Năm học ' + schoolYear, STY.subtitle);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} }); R++;
    R++;
    _xlSet(ws, R, 0, 'DANH SÁCH GIÁO VIÊN', STY.section);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} }); R++;
    R++;

    var headerRow = R;
    headers.forEach(function(h, i){ _xlSet(ws, R, i, h, STY.headerNavy); });
    R++;

    var hasData = TEACHERS && TEACHERS.length > 0;
    if (hasData) {
      TEACHERS.forEach(function(t, i){
        var isAlt = (i % 2 === 1);
        var rowVals = [i+1, t.name||'', t.dob||'', t.role||'', t.degree||'', t.phone||'', t.email||'', t.link||''];
        rowVals.forEach(function(v, c){
          var sty = leftCols[c] ? (isAlt?STY.cellLAlt:STY.cellL) : (isAlt?STY.cellCAlt:STY.cellC);
          _xlSet(ws, R, c, v, sty);
        });
        R++;
      });
    } else {
      var demos = [
        [1, 'Nguyễn Văn A', '15/03/1980', 'Hiệu trưởng',     'Đại học Sư phạm', '0901234567', 'a.nguyen@th.edu.vn', ''],
        [2, 'Trần Thị B',   '22/07/1985', 'Phó Hiệu trưởng', 'Đại học Sư phạm', '0912345678', 'b.tran@th.edu.vn',   ''],
        [3, 'Lê Hoàng C',   '10/11/1988', 'GVCN lớp 1A',     'Cao đẳng SP',     '0987654321', 'c.le@th.edu.vn',     '']
      ];
      demos.forEach(function(rowVals, idx){
        var isAlt = (idx % 2 === 1);
        rowVals.forEach(function(v, c){
          var sty = leftCols[c] ? (isAlt?STY.cellLAlt:STY.cellL) : (isAlt?STY.cellCAlt:STY.cellC);
          _xlSet(ws, R, c, v, sty);
        });
        R++;
      });
    }

    R++;
    _xlSet(ws, R, 0, '💡 Lưu ý: cột "Link hồ sơ" có thể để trống — sẽ được điền sau khi tạo thư mục Drive.', STY.note);
    ws['!merges'].push({ s:{r:R, c:0}, e:{r:R, c:COL_COUNT-1} });

    ws['!cols'] = [
      {wch:5}, {wch:28}, {wch:13}, {wch:22}, {wch:18}, {wch:14}, {wch:28}, {wch:34}
    ];
    var rh = [];
    rh[0] = {hpt:26}; rh[1] = {hpt:18}; rh[2] = {hpt:6};
    rh[3] = {hpt:22}; rh[4] = {hpt:6};  rh[headerRow] = {hpt:30};
    ws['!rows'] = rh;
    ws['!views'] = [{ state:'frozen', xSplit:1, ySplit:headerRow+1, topLeftCell:'B'+(headerRow+2) }];
    ws['!margins'] = { left:0.4, right:0.4, top:0.5, bottom:0.5, header:0.3, footer:0.3 };
    ws['!pageSetup'] = { orientation:'landscape', fitToWidth:1, paperSize:9 };
    ws['!ref'] = 'A1:' + _xlAddr(R, COL_COUNT-1);
    return ws;
  }

  function _admExportTemplateImpl(type){
    var fileName, dataCount = 0;
    if(type==='gv'){
      dataCount = (TEACHERS && TEACHERS.length) || 0;
      fileName = 'Mau_DSGV.xlsx';
    } else {
      dataCount = (CLASSES) ? CLASSES.reduce(function(s,c){return s+(c.students?c.students.length:0);},0) : 0;
      fileName = 'Mau_DSHocSinh.xlsx';
    }
    // Build styled workbook (cả khi có data và khi mẫu trống — cùng 1 template)
    var wb = XLSX.utils.book_new();
    if(type==='gv'){
      XLSX.utils.book_append_sheet(wb, _buildStyledGVSheet(), 'DSGV');
    } else {
      XLSX.utils.book_append_sheet(wb, _buildStyledHSSheet(), 'DSHocSinh');
    }
    XLSX.writeFile(wb, fileName);
    // 2026-05-07: hs => admHsmgrMsg (tab QL HS), gv => admImportMsg
    var msg = _admMsgEl(type);
    if (msg) {
      msg.textContent = '✅ Đã tải ' + fileName + (dataCount ? ' (kèm ' + dataCount + ' dòng dữ liệu)' : ' (mẫu trống)');
      msg.className = 'adm-alert ok';
      setTimeout(function(){ msg.className = 'adm-alert'; }, 4000);
    }
  }

  // ===== ĐỌC FILE EXCEL HOẶC CSV =====
  // ===== Helper: gán dữ liệu pending theo type (gv/hs/hss/mc) + preview =====
  var _pendingHSS = null, _pendingMC = null;
  function _admAssignPending(type, rows){
    if(type === 'gv'){ _pendingGV = rows; admPreviewUpload('previewGV', rows, type); }
    else if(type === 'hs'){ _pendingHS = rows; admPreviewUpload('previewHS', rows, type); }
    else if(type === 'hss'){ _pendingHSS = rows; admPreviewUpload('previewHss', rows, type); }
    else if(type === 'mc'){ _pendingMC = rows; admPreviewUpload('previewMc', rows, type); }
  }

    function admHandleFile(file, type){
    if(!file) return;
    var ext=file.name.split('.').pop().toLowerCase();
    if(ext==='xlsx'||ext==='xls'){
      if(typeof XLSX==='undefined'){alert('Thư viện XLSX chưa tải xong.');return;}
      var reader=new FileReader();
      reader.onload=function(ev){
        var data=new Uint8Array(ev.target.result);
        var workbook=XLSX.read(data,{type:'array',cellDates:false,raw:false});
        var sheet=workbook.Sheets[workbook.SheetNames[0]];
        var rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});
        var strRows=rows.map(function(r){return r.map(function(c){return String(c==null?'':c).trim();});});
        _admAssignPending(type, strRows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      var reader=new FileReader();
      reader.onload=function(ev){
        var rows=_parseCSV(ev.target.result);
        _admAssignPending(type, rows);
      };
      reader.readAsText(file,'UTF-8');
    }
  }

  function _parseCSV(text){
    var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
    return lines.map(function(line){
      var cols=[],cur='',inQ=false;
      for(var i=0;i<line.length;i++){var c=line[i];if(c==='"')inQ=!inQ;else if(c===','&&!inQ){cols.push(cur.trim());cur='';}else cur+=c;}
      cols.push(cur.trim());return cols;
    });
  }

  function admPreviewUpload(containerId, rows, type){
    var el=document.getElementById(containerId), data=rows;
    // Filter rows robust — không chỉ strip từ đầu mà lọc mọi hàng header trộn trong file.
    // Loại bỏ:
    //  • Hàng rỗng (toàn cell trống)
    //  • Hàng tiêu đề merged (chứa "DANH SÁCH", "📋", "🎒", "👩", "🗂", "🎗")
    //  • Hàng phụ đề (chứa "Xã ...", "Tỉnh ...", "Năm học", "CỘNG HÒA")
    //  • Hàng tên cột (col A = "STT/TT", hoặc col B = "Mã lớp", hoặc col D = "Họ tên/Họ và tên", hoặc col A=TT & col C chứa "Mã")
    //  • Hàng ghi chú (bắt đầu 💡 / 📌)
    data = data.filter(function(r){
      if (!r || !r.length) return false;
      var c0 = String(r[0] || '').trim();
      var c1 = String(r[1] || '').trim();
      var c2 = String(r[2] || '').trim();
      var c3 = String(r[3] || '').trim();
      // rỗng
      if (!c0 && !c1 && !c2 && !c3 && !r.some(function(x){return String(x||'').trim();})) return false;
      // merged header (emoji mở đầu hoặc chữ "DANH SÁCH"/"CỘNG HÒA")
      var joined = (c0 + ' ' + c1).trim();
      if (/^(📋|🎒|👩|🗂|🎗|💡|📌)/.test(joined)) return false;
      if (/^DANH\s+SÁCH|^BẢNG|^DANH\s+MỤC|^CỘNG\s+HÒA|^ĐỘC\s+LẬP/i.test(joined)) return false;
      // 2026-05-07: Title trường (mẫu mới có dòng "TRƯỜNG TIỂU HỌC ...")
      //   Chỉ match khi c1, c2, c3 đều rỗng (đảm bảo là dòng merged title, không phải data)
      if (/^TRƯỜNG\s+(TIỂU|TRUNG|MẦM|MN|TH|THCS|THPT|PHỔ|HỌC)/i.test(c0) && !c1 && !c2 && !c3) return false;
      if (/^TRUONG\s+(TIEU|TRUNG|MAM|MN|TH|THCS|THPT|PHO|HOC)/i.test(c0) && !c1 && !c2 && !c3) return false;
      // phụ đề "Xã ..., Tỉnh ... · Năm học ...": có trong col A (merged) hoặc col A trống + col B merged
      // Khi col A có text dài chứa "Năm học" hoặc chứa "Tỉnh" và không phải tên riêng
      if (/Năm\s*học\s*20\d\d|·\s*Năm\s*học/i.test(c0)) return false;
      if (!c0 && !c1 && /Năm\s*học|^Xã\s|^Tỉnh\s/i.test(joined + ' ' + c2 + ' ' + c3)) return false;
      // tên cột (header row) — phát hiện nhiều trường hợp:
      var lc0 = c0.toLowerCase(), lc1 = c1.toLowerCase(), lc3 = c3.toLowerCase();
      if (/^(stt|tt|số\s*tt|thứ\s*tự)$/i.test(lc0)) return false;
      if (/^(mã\s*lớp|ma\s*lop|lớp)$/i.test(lc1)) return false;
      if (/^(họ\s*và\s*tên|họ\s*tên|ho\s*va\s*ten|ho\s*ten|tên\s*học\s*sinh)$/i.test(lc3)) return false;
      // hàng có nhiều cột toàn text và col A không phải số
      if (c0 && !/^\d+$/.test(c0) && c1 && !c1.match(/^\d/) && c3 && c3.length > 3) {
        // Heuristic cuối: nếu col A là chữ và không phải số + col B có "Mã" → header
        if (/^(mã|ma)\s/i.test(c1) || /^họ|^ho/i.test(lc3)) return false;
      }
      return true;
    });
    if(!data.length){el.innerHTML='<div class="adm-alert err" style="display:block">❌ File rỗng hoặc không có dữ liệu.</div>';return;}
    var maxShow=Math.min(data.length,5);
    var html='<div class="adm-preview"><table><thead><tr>';
    var HEADERS_MAP = {
      'gv':  ['TT','Họ tên','Ngày sinh','Chức vụ','Trình độ','SĐT','Gmail','Link'],
      'hs':  ['STT','Mã lớp','Mã HS','Họ tên','Ngày sinh','GT','Dân tộc','Tôn giáo'],
      'hss': ['TT','Tên hồ sơ','Link Drive','Mã KĐCL'],
      'mc':  ['TT','Mã TC','Tiêu chí','Mã MC','Tên MC','Số/ngày BH','Nơi BH','Mã HSS']
    };
    var headers = HEADERS_MAP[type] || HEADERS_MAP['gv'];
    headers.forEach(function(h){html+='<th>'+h+'</th>';});
    html+='</tr></thead><tbody>';
    for(var i=0;i<maxShow;i++){html+='<tr>'+data[i].slice(0,headers.length).map(function(c){return'<td>'+escapeHtml(c)+'</td>';}).join('')+'</tr>';}
    if(data.length>maxShow)html+='<tr><td colspan="'+headers.length+'" style="text-align:center;color:#8a9690">... và '+(data.length-maxShow)+' dòng nữa</td></tr>';
    html+='</tbody></table></div>';
    html+='<p style="font-size:.85rem;color:var(--g-deep);margin:8px 0"><b>'+data.length+'</b> dòng dữ liệu sẵn sàng.</p>';
    html+='<button class="adm-btn adm-btn-primary" onclick="admDoImport(\''+type+'\')">📤 Tải lên Google Sheet</button>';
    el.innerHTML=html;
    if(type==='gv')_pendingGV=data;
    else if(type==='hs')_pendingHS=data;
    else if(type==='hss')_pendingHSS=data;
    else if(type==='mc')_pendingMC=data;
  }


  function admDoImport(type){
    // 2026-05-07: hs → hiển thị trên tab Quản lý HS (admHsmgrMsg)
    const msg = _admMsgEl(type);
    let rows, action, label;
    if(type === 'gv'){
      rows = _pendingGV; action = 'importTeachers'; label = 'giáo viên';
      rows = rows.map(r => { while(r.length < 8) r.push(''); return r.slice(0,8); });
    } else if(type === 'hs'){
      rows = _pendingHS; action = 'importStudents'; label = 'học sinh';
      // 2026-05-07: detect số cột thực tế trong file (18 / 19 / 24) — backend tự xử lý
      //   • 18 cột: file cũ — giữ tracking ở DB
      //   • 19 cột: 18 gốc + "Trạng thái" — map IsDeleted, giữ 5 cột tracking khác
      //   • 24 cột: full export — ghi đè đầy đủ
      var maxCols = 18;
      rows.forEach(r => {
        if (r.length >= 24) maxCols = 24;
        else if (r.length >= 19 && maxCols < 19) maxCols = 19;
      });
      rows = rows.map(r => { while(r.length < maxCols) r.push(''); return r.slice(0, maxCols); });
    } else if(type === 'hss'){
      rows = _pendingHSS; action = 'updateHSS'; label = 'dòng hồ sơ số';
      // HSS 4 cột raw → Sheet cần 5 cột: [STT, Tên, Link, Link2, Mã KĐCL]
      // (Link2 là cột dự phòng để phân biệt link chính vs phụ — để trống nếu chỉ có 1 link)
      rows = rows.map(r => {
        var stt = r[0] || '', ten = r[1] || '', link = r[2] || '', ma = r[3] || '';
        return [stt, ten, link, '', ma];
      });
    } else if(type === 'mc'){
      rows = _pendingMC; action = 'updateMinhChung'; label = 'dòng minh chứng';
      // MC 8 cột raw → Sheet cần 10 cột (thêm "Ghi chú" + cột trống cuối)
      rows = rows.map(r => {
        while(r.length < 10) r.push('');
        return r.slice(0, 10);
      });
    } else {
      msg.textContent = '❌ Loại dữ liệu không hợp lệ.'; msg.className = 'adm-alert err'; return;
    }
    if(!rows || !rows.length){
      msg.textContent = '❌ Chưa chọn file.';
      msg.className = 'adm-alert err'; return;
    }
    if(!confirm('Xác nhận tải lên ' + rows.length + ' ' + label + '? Dữ liệu cũ sẽ bị thay thế.')) return;
    msg.textContent = '⏳ Đang tải lên ' + rows.length + ' ' + label + '...';
    msg.className = 'adm-alert warn';
    admPostToGAS({action: action, rows: rows}, function(ok, resp){
      if(ok){
        msg.innerHTML = '✅ Đã tải lên ' + rows.length + ' ' + label + '. <button onclick="location.reload()" style="background:#16a34a;color:white;border:0;padding:5px 14px;border-radius:5px;font-weight:600;cursor:pointer;margin-left:8px">🔄 Tải lại trang để xem ngay</button>';
        msg.className = 'adm-alert ok';
        // ⭐ Auto clear cache ngay khi import success — đảm bảo lần render tiếp theo lấy data mới
        try{ localStorage.removeItem(CACHE_KEY); } catch(e){}
        // 2026-05-08: nếu import HS → mark dirty cho QLCL → lần sau vào QLCL tự refresh DSHS
        if (action === 'importStudents') {
          try{ localStorage.setItem('_dshs_dirty', String(Date.now())); } catch(e){}
        }
        if(type === 'gv'){ _pendingGV = null; document.getElementById('previewGV').innerHTML = ''; }
        else if(type === 'hs'){ _pendingHS = null; document.getElementById('previewHS').innerHTML = ''; }
        else if(type === 'hss'){ _pendingHSS = null; document.getElementById('previewHss').innerHTML = ''; }
        else if(type === 'mc'){ _pendingMC = null; document.getElementById('previewMc').innerHTML = ''; }
      } else {
        msg.textContent = '❌ Lỗi: ' + (resp || 'Không kết nối được API');
        msg.className = 'adm-alert err';
      }
      setTimeout(() => msg.className = 'adm-alert', 5000);
    });
  }

  // Kiểm tra URL backend hợp lệ: chấp nhận Apps Script /exec hoặc Cloudflare Worker proxy.
  //   • Apps Script trực tiếp: https://script.google.com/macros/s/<deployId>/exec (tuỳ chọn /)
  //   • Cloudflare Worker proxy: https://<sub>.workers.dev[/path] (né AdBlocker / firewall)
  function _isValidBackendUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?$/.test(url)) return true;
    if (/^https:\/\/[\w.-]+\.workers\.dev(\/.*)?$/.test(url)) return true;
    return false;
  }

  // --- POST dữ liệu tới GAS ---
  // Validate URL trước, log errors, verify bằng GET sau khi POST
  function admPostToGAS(body, callback){
    const url = window._admApiOverride || API_URL;
    if(!url){ callback(false, 'Chưa cấu hình API URL'); return; }
    if(url.indexOf('__REPLACE_ME') >= 0){
      callback(false, '⚠ URL backend chưa được cấu hình. Mở index.html → tìm "__REPLACE_ME_BACKEND_URL__" → thay bằng URL Apps Script /exec.');
      return;
    }
    // Chấp nhận: (a) URL Apps Script trực tiếp /exec hoặc (b) Cloudflare Worker proxy *.workers.dev.
    // Worker proxy ra đời để né AdBlocker/firewall trường học chặn script.googleusercontent.com.
    if(!_isValidBackendUrl(url)){
      callback(false, '⚠ Backend cấu hình không hợp lệ. Liên hệ kỹ thuật để được hỗ trợ.');
      return;
    }
    console.log('[admPostToGAS] action=', body.action, 'rows=', (body.rows||[]).length);
    // ⭐ Auth gate: action Admin cần mã Admin (vào Admin panel đã có sẵn, đây là layer bảo vệ thêm).
    var authPromise = (typeof window._authForAction === 'function')
      ? window._authForAction(body.action)
      : Promise.resolve();
    authPromise.then(function(){
    // ⭐ Đính kèm auth: sessionToken (SSO mới) + token (legacy)
    var _cu = (typeof getCU === 'function') ? (getCU() || {}) : {};
    if (!body.sessionToken && _cu.sessionToken) body.sessionToken = _cu.sessionToken;
    if (typeof getAuthToken === 'function' && !body.token) body.token = getAuthToken();
    fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify(body),
      redirect: 'follow'
    })
    .then(r => {
      console.log('[admPostToGAS] Response status:', r.status, 'type:', r.type);
      return r.text();
    })
    .then(text => {
      console.log('[admPostToGAS] Response body:', text.substring(0, 500));
      try {
        const j = JSON.parse(text);
        callback(j.ok, j.error || j.data);
      } catch(e) {
        // Không parse được — có thể GAS trả HTML lỗi (chưa redeploy?) hoặc CORS chặn
        // Verify thực tế bằng cách fetch GET stats sau 1s
        console.warn('[admPostToGAS] Response not JSON — verifying via GET...');
        setTimeout(() => _admVerifyAfterPost(body, callback), 1500);
      }
    })
    .catch(err => {
      console.error('[admPostToGAS] FETCH ERROR:', err);
      callback(false, '❌ Lỗi mạng: ' + err.message + '\\nKiểm tra: (1) URL Apps Script đúng /exec; (2) Web app deploy "Anyone" access; (3) Console F12 xem chi tiết.');
    });
    }).catch(function(err){
      // User bấm Hủy ở modal đăng nhập, hoặc auth fail
      callback(false, (err && err.message) || 'Đã hủy đăng nhập');
    });
  }

  // Verify bằng GET stats sau khi POST không đọc được response
  function _admVerifyAfterPost(body, callback){
    const url = window._admApiOverride || API_URL;
    const cb = '_admVerifyCb_' + Date.now();
    window[cb] = function(resp){
      delete window[cb];
      if(resp && resp.ok){
        callback(true, 'Đã gửi dữ liệu (verify GET thành công). Nhấn Làm mới để xem.');
      } else {
        callback(false, '❌ POST không xác nhận được. Có thể lỗi quyền hoặc deploy. F12 Console xem chi tiết.');
      }
    };
    const s = document.createElement('script');
    s.src = url + '?action=stats&callback=' + cb + '&_=' + Date.now();
    s.onerror = () => { delete window[cb]; callback(false, '❌ Không kết nối được backend'); };
    document.body.appendChild(s);
    setTimeout(() => { if(window[cb]){ window[cb]({ok:false}); } }, 8000);
  }

  // --- Test kết nối backend (KHÔNG hiển thị URL ra UI) ---
  function admTestConnection(){
    var url = window._admApiOverride || API_URL;
    var msg = document.getElementById('admImportMsg');
    _admUpdateApiUrlHint();
    if (!url || url.indexOf('__REPLACE_ME') >= 0) {
      msg.textContent = '⚠ Backend chưa được cấu hình. Liên hệ kỹ thuật để cấu hình lại.';
      msg.className = 'adm-alert err'; return;
    }
    if (!_isValidBackendUrl(url)) {
      msg.textContent = '⚠ Backend cấu hình không hợp lệ. Liên hệ kỹ thuật.';
      msg.className = 'adm-alert err'; return;
    }
    msg.textContent = '⏳ Đang test kết nối…';
    msg.className = 'adm-alert warn';
    var cb = '_admTest_' + Date.now();
    window[cb] = function(resp){
      delete window[cb];
      if (resp && resp.ok && resp.data) {
        var stats = resp.data;
        msg.innerHTML = '✅ <b>Kết nối OK</b> · Sheet có: ' + (stats.totalRecords || 0) + ' HSS · ' + (stats.totalTeachers || 0) + ' GV · ' + (stats.totalClasses || 0) + ' lớp · ' + (stats.totalChildren || 0) + ' HS. Backend đã sẵn sàng nhận upload.';
        msg.className = 'adm-alert ok';
      } else {
        msg.textContent = '❌ Backend trả về lỗi: ' + (resp && resp.error || 'không có dữ liệu');
        msg.className = 'adm-alert err';
      }
    };
    var s = document.createElement('script');
    s.src = url + '?action=stats&callback=' + cb + '&_=' + Date.now();
    s.onerror = function(){
      delete window[cb];
      msg.innerHTML = '❌ Không kết nối được. Kiểm tra:<br>1) URL có đúng dạng <code>/macros/s/AKfyc.../exec</code>?<br>2) Deploy "Anyone access"?<br>3) F12 Console xem lỗi chi tiết.';
      msg.className = 'adm-alert err';
    };
    document.body.appendChild(s);
    setTimeout(function(){
      if (window[cb]) {
        delete window[cb];
        msg.textContent = '❌ Timeout — backend không phản hồi trong 10s. Kiểm tra deploy.';
        msg.className = 'adm-alert err';
      }
    }, 10000);
  }

  // Hiển thị TRẠNG THÁI (không lộ URL backend ra UI để tránh BGH copy nghịch).
  function _admUpdateApiUrlHint(){
    var hint = document.getElementById('admApiUrlHint');
    if (!hint) return;
    var url = window._admApiOverride || API_URL;
    if (!url || url.indexOf('__REPLACE_ME') >= 0) {
      hint.innerHTML = '<span style="color:#dc2626">⚠ Chưa cấu hình backend</span>'; return;
    }
    hint.innerHTML = '<span style="color:#16a34a">✅ Backend đã cấu hình</span> · Bấm "Test kết nối" để kiểm tra.';
  }

  function admRefresh(){
    try{ localStorage.removeItem(CACHE_KEY); } catch(e){}
    const url = window._admApiOverride || API_URL;
    if(url) {
      const s = document.createElement('script');
      s.src = url + '?action=all&nocache=1&callback=_admNoop';
      window._admNoop = function(){ delete window._admNoop; };
      document.body.appendChild(s);
    }
    setTimeout(() => location.reload(), 500);
  }

  function admClearCache(){
    if(!confirm('Xóa toàn bộ bộ nhớ đệm? Trang sẽ tải lại dữ liệu mới từ Google Sheet.')) return;
    try{ localStorage.removeItem(CACHE_KEY); } catch(e){}
    location.reload();
  }

  // --- Tab 4: Đổi mã trường (GV + Admin) ---
  // Lưu vào Script Properties qua backend. Sau khi đổi, mã cũ trong code chỉ còn
  // là fallback (Properties đè lên). Nhân bản template cho trường khác: HT trường
  // mới đăng nhập bằng mã mặc định rồi vào đây đổi mã riêng cho trường mình.
  function admChangeAuthTokens(){
    const oldAdmin  = document.getElementById('admOldPwd').value.trim();
    const newGV     = document.getElementById('admNewGvToken').value.trim();
    const newGV2    = document.getElementById('admNewGvToken2').value.trim();
    const newAdmin  = document.getElementById('admNewAdminToken').value.trim();
    const newAdmin2 = document.getElementById('admNewAdminToken2').value.trim();
    const msg = document.getElementById('admPwdMsg');

    function err(t){ msg.textContent = t; msg.className = 'adm-alert err'; }
    function ok(t){ msg.textContent = t; msg.className = 'adm-alert ok'; }

    // Validate client-side
    if(!oldAdmin) return err('❌ Vui lòng nhập mã Admin hiện tại để xác nhận.');
    if(oldAdmin !== getAuthToken()) return err('❌ Mã Admin hiện tại không khớp với mã đang dùng.');
    if(!newGV || !newAdmin) return err('❌ Vui lòng nhập đủ cả mã GV mới và mã Admin mới.');
    if(newGV.length < 4 || newGV.length > 30) return err('❌ Mã GV phải dài 4–30 ký tự.');
    if(newAdmin.length < 4 || newAdmin.length > 30) return err('❌ Mã Admin phải dài 4–30 ký tự.');
    if(/\s/.test(newGV) || /\s/.test(newAdmin)) return err('❌ Mã không được chứa khoảng trắng.');
    if(newGV !== newGV2) return err('❌ Mã GV và xác nhận không khớp.');
    if(newAdmin !== newAdmin2) return err('❌ Mã Admin và xác nhận không khớp.');
    if(newGV === newAdmin) return err('❌ Mã GV và mã Admin phải KHÁC NHAU.');

    if(!confirm('Xác nhận đổi mã trường?\n\nMã cũ sẽ KHÔNG dùng được nữa. Sau khi đổi, hãy thông báo mã GV mới cho thầy/cô qua Zalo nhóm trường.\n\nMã GV mới: ' + newGV + '\nMã Admin mới: ' + newAdmin)) return;

    msg.textContent = '⏳ Đang lưu mã mới lên backend…';
    msg.className = 'adm-alert warn';

    admPostToGAS({
      action: 'updateAuthTokens',
      newGvToken: newGV,
      newAdminToken: newAdmin
    }, function(success, resp){
      if(!success){
        err('❌ Không lưu được: ' + (resp || 'lỗi không xác định'));
        return;
      }
      // ⭐ Tự động lưu mã Admin mới vào localStorage để không cần logout-login
      _saveAuthToken(newAdmin);
      _saveAuthLevel('admin');
      ok('✅ Đã đổi mã thành công! Mã Admin mới của thầy đã được lưu trên máy này. Hãy thông báo mã GV mới cho thầy/cô qua Zalo nhóm trường.');
      // Xoá form
      ['admOldPwd','admNewGvToken','admNewGvToken2','admNewAdminToken','admNewAdminToken2'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.value = '';
      });
    });
  }

  // Áp dụng config từ localStorage khi boot
  function admInitConfig(){
    const adm = _admGet();
    // URL API luôn dùng hardcoded API_URL (không cho override từ localStorage)
    admApplyConfig();
  }
  admInitConfig();

  // ============ TOAST THÔNG BÁO ============
  function showUpgradeToast(msg){
    const text = msg || 'Hệ thống sẽ được nâng cấp sau. Xin mời quý thầy cô quay lại sau!';
    let host = document.getElementById('globalToast');
    if(!host){
      host = document.createElement('div');
      host.id = 'globalToast';
      host.className = 'global-toast';
      document.body.appendChild(host);
    }
    host.innerHTML = '<span class="toast-ic">🛠</span><span>'+text+'</span>';
    host.classList.remove('show');
    // Force reflow để restart animation nếu click nhiều lần
    void host.offsetWidth;
    host.classList.add('show');
    clearTimeout(host._t);
    host._t = setTimeout(() => host.classList.remove('show'), 3500);
  }

  // ⭐ Refactor 2026-05-12 · Bước 1d: gọi loadDataShared (core-shared.js) thay loadData()
  //   cũ. Truyền `boot` (định nghĩa ở trên) làm callback render UI cho HSS.
  loadDataShared(boot);


/* ===== Phần 5: Scroll-to-top floating button ===== */
(function(){
  var btn = document.getElementById('scrollTopBtn');
  if (!btn) return;

  // Đọc scroll position từ nhiều nguồn (browser khác nhau dùng html/body/window khác nhau)
  function getScroll(){
    return window.scrollY
        || window.pageYOffset
        || document.documentElement.scrollTop
        || document.body.scrollTop
        || 0;
  }

  // Cuộn lên đầu — thử cả window, html, body để chắc work mọi browser/view
  btn.addEventListener('click', function(){
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e) { window.scrollTo(0, 0); }
    try { document.documentElement.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e){}
    try { document.body.scrollTo({ top: 0, behavior: 'smooth' }); } catch(e){}
  });

  var ticking = false;
  function update(){
    var y = getScroll();
    if (y > 200) btn.classList.add('visible');
    else btn.classList.remove('visible');
    ticking = false;
  }
  window.addEventListener('scroll', function(){
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  // Một số layout scroll trong document chứ không phải window — bắt cả 2
  document.addEventListener('scroll', function(){
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true, capture: true });

  // Khởi tạo lần đầu + check định kỳ phòng trường hợp scroll xảy ra trong container con
  update();
  setInterval(update, 800);
})();

// ============================================================================
// 2026-05-07: PHASE 2 — QUẢN LÝ HỌC SINH ĐƠN LẺ (Admin Panel)
// ============================================================================
// Hỗ trợ:
//   • Tiếp nhận HS chuyển đến (➕)
//   • Sửa thông tin HS (✏️)
//   • Chuyển đi - soft delete (🚌)
//   • Khôi phục HS đã chuyển đi (↩️)
//   • Filter theo khối/lớp/trạng thái + search + pagination
// ============================================================================

window._hsMgrData = { active: [], transferred: [], all: [] };
window._hsMgrCurrent = [];
window._hsMgrPage = 1;
window._hsMgrPzs = 30;
window._hsMgrEditMa = null;
window._hsMgrTransferMa = null;

function hsMgrLoad(){
  var f = document.getElementById('hsMgrFilterStatus').value || 'active';
  var msg = document.getElementById('admHsmgrMsg');
  if (msg) { msg.className = 'adm-alert'; msg.textContent = '⏳ Đang tải DSHS...'; }

  // 2026-05-07 (v3): RENDER NGAY từ window.CLASSES (đã có 864 HS từ landing page)
  // → KHÔNG đợi backend, KHÔNG bị treo "Đang tải" mãi.
  // Sau đó chạy callGAS('listStudentsAdmin') ở background để bổ sung data tracking
  // (chỉ cập nhật nếu backend đã deploy phiên bản mới).
  _hsMgrRenderFromClasses(f, msg);

  // Async: thử gọi backend mới để có data tracking đầy đủ
  if (typeof callGAS === 'function') {
    callGAS('listStudentsAdmin', { filter: f }).then(function(res){
      if (res && res.ok && res.data) {
        // Backend mới đã deploy → upgrade data với tracking đầy đủ
        window._hsMgrData[f] = res.data;
        // Cũng load 'active' và 'transferred' để stats đúng
        ['active','transferred'].forEach(function(other){
          if (other !== f) {
            callGAS('listStudentsAdmin', { filter: other }).then(function(r2){
              if (r2 && r2.ok) window._hsMgrData[other] = r2.data || [];
              hsMgrUpdateStats();
            }).catch(function(){});
          }
        });
        hsMgrUpdateStats();
        hsMgrFilter();
        if (msg) {
          msg.className = 'adm-alert ok';
          msg.textContent = '✅ Đã đồng bộ với backend (' + res.count + ' HS - ' + (f === 'active' ? 'Đang học' : f === 'transferred' ? 'Đã chuyển đi' : 'Tất cả') + ')';
          setTimeout(function(){ msg.textContent = ''; msg.className = 'adm-alert'; }, 2500);
        }
      } else if (res && res.error && /Unknown.*action|listStudentsAdmin/i.test(res.error)) {
        // Backend chưa deploy → giữ data từ CLASSES (đã render ở _hsMgrRenderFromClasses)
        if (msg) {
          msg.className = 'adm-alert';
          msg.style.background = '#fffbeb'; msg.style.border = '1px solid #fde68a'; msg.style.color = '#92400e';
          msg.innerHTML = '⚠ <b>Đang dùng data từ HSS</b> (chưa deploy backend mới). '
                        + 'Để dùng đầy đủ ➕✏️🚌🗑 — paste <code>Code.gs</code> mới và Triển khai phiên bản mới.';
        }
      }
    }).catch(function(){
      // Lỗi mạng — giữ data từ CLASSES
    });
  }
}

// Render bảng QL HS từ window.CLASSES (sẵn có từ landing page) — INSTANT, không đợi backend
function _hsMgrRenderFromClasses(f, msg){
  var classesRef = window.CLASSES || [];
  if (!classesRef.length) {
    if (msg) {
      msg.className = 'adm-alert err';
      msg.innerHTML = '❌ Chưa có DSHS. Vui lòng đợi trang load xong rồi reload tab này, hoặc kiểm tra kết nối.';
    }
    return;
  }
  var allData = [];
  classesRef.forEach(function(cls){
    (cls.students || []).forEach(function(s){
      allData.push({
        stt: String(s.stt || ''),
        // 2026-05-08 fix: chuẩn hoá "Lớp 1A" → "1A" để khớp value dropdown filter
        lop: String(s.classCode || '').replace(/^Lớp\s+/i, ''),
        ma: String(s.studentCode || ''),
        ten: String(s.name || ''),
        ns: String(s.dob || ''),
        gt: String(s.gender || ''),
        dan_toc: String(s.ethnic || ''),
        ton_giao: String(s.religion || ''),
        tinh: String(s.province || ''),
        xa: String(s.ward || ''),
        to: String(s.hamlet || ''),
        noi_sinh: String(s.birthplace || ''),
        sdt: String(s.phone || ''),
        cha: String(s.father || ''),
        namsinh_cha: String(s.fatherYear || ''),
        me: String(s.mother || ''),
        namsinh_me: String(s.motherYear || ''),
        is_deleted: !!s.isDeleted,
        received_date: String(s.receivedDate || ''),
        received_from: String(s.receivedFrom || ''),
        transfer_date: String(s.transferDate || ''),
        transfer_to: String(s.transferTo || ''),
        transfer_reason: String(s.transferReason || '')
      });
    });
  });
  // Set tất cả 3 filter cùng lúc — đỡ phải gọi nhiều
  window._hsMgrData.all = allData;
  window._hsMgrData.active = allData.filter(function(s){return !s.is_deleted;});
  window._hsMgrData.transferred = allData.filter(function(s){return s.is_deleted;});
  hsMgrUpdateStats();
  hsMgrFilter();
}

function hsMgrUpdateStats(){
  var a = (_hsMgrData.active || []).length;
  var t = (_hsMgrData.transferred || []).length;
  var el = document.getElementById('hsMgrStats');
  if (el) el.innerHTML = '<b>' + a + '</b> đang học · <b>' + t + '</b> đã chuyển đi · Tổng <b>' + (a + t) + '</b>';
}

function hsMgrFilter(){
  var f = document.getElementById('hsMgrFilterStatus').value || 'active';
  var data = _hsMgrData[f] || [];
  var q = (document.getElementById('hsMgrSearch').value || '').toLowerCase().trim();
  var k = document.getElementById('hsMgrFilterKhoi').value;
  var lop = document.getElementById('hsMgrFilterLop').value;
  // Build dropdown lớp khi đổi khối
  var lopSel = document.getElementById('hsMgrFilterLop');
  if (lopSel.dataset.lastK !== k) {
    var ks = k ? [parseInt(k)] : [1, 2, 3, 4, 5];
    var html = '<option value="">Tất cả lớp</option>';
    ks.forEach(function(kk){
      ['A','B','C','D','E'].forEach(function(c){ html += '<option value="' + kk + c + '">' + kk + c + '</option>'; });
    });
    lopSel.innerHTML = html;
    lopSel.dataset.lastK = k || '';
    lop = '';
  }
  _hsMgrCurrent = data.filter(function(s){
    if (k && (s.lop || '').indexOf(k) !== 0) return false;
    if (lop && s.lop !== lop) return false;
    if (q && (s.ten + ' ' + s.ma).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });
  _hsMgrPage = 1;
  hsMgrRender();
}

function hsMgrRender(){
  var tot = _hsMgrCurrent.length;
  var pz = _hsMgrPzs;
  var tp = Math.max(1, Math.ceil(tot / pz));
  var cur = Math.min(_hsMgrPage, tp);
  var rows = _hsMgrCurrent.slice((cur - 1) * pz, cur * pz);

  var html = rows.length === 0
    ? '<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8">📭 Không có HS phù hợp</td></tr>'
    : rows.map(function(s, i){
        var stt = (cur - 1) * pz + i + 1;
        var safeName = String(s.ten || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        var status = s.is_deleted
          ? '<span style="color:#dc2626;font-size:.78rem"><b>🚌 Đã chuyển:</b> ' + (s.transfer_to || '?') + (s.transfer_date ? '<br><small style="color:#6b7280">' + s.transfer_date + '</small>' : '') + '</span>'
          : '<span style="color:#059669;font-size:.78rem">✅ Đang học</span>' + (s.received_date ? '<br><small style="color:#6b7280">📥 Tiếp nhận: ' + s.received_date + '</small>' : '');
        // 2026-05-07: 3 nút thao tác rõ ràng (Sửa - Chuyển đi - Xoá nhập nhầm)
        //   • ✏️ xanh: Sửa thông tin (thường xuyên)
        //   • 🚌 vàng: Chuyển đi (HS chuyển trường THẬT - soft delete, có thể khôi phục)
        //   • 🗑 đỏ:  Xoá vĩnh viễn (chỉ khi NHẬP NHẦM - 2 lớp confirm)
        var actions = s.is_deleted
          ? '<button class="adm-btn adm-btn-outline" style="padding:3px 8px;font-size:.75rem;background:#dcfce7;color:#166534;border-color:#86efac" onclick="hsMgrRestore(\'' + s.ma + '\',\'' + safeName + '\')" title="Khôi phục — đưa về trạng thái Đang học">↩️ Khôi phục</button>'
          : '<button class="adm-btn adm-btn-outline" style="padding:3px 7px;font-size:.75rem;background:#eff6ff;color:#1e40af;border-color:#93c5fd" onclick="hsMgrOpenEdit(\'' + s.ma + '\')" title="Sửa thông tin HS (sai mã, đổi lớp, sai tên...)">✏️</button>'
            + ' <button class="adm-btn" style="padding:3px 7px;font-size:.75rem;background:#fef3c7;color:#92400e;border:1px solid #fbbf24" onclick="hsMgrOpenTransfer(\'' + s.ma + '\',\'' + safeName + '\',\'' + s.lop + '\')" title="Chuyển trường — HS chuyển đi thật, vẫn lưu hồ sơ để báo cáo">🚌</button>'
            + ' <button class="adm-btn" style="padding:3px 7px;font-size:.75rem;background:#fee2e2;color:#991b1b;border:1px solid #fca5a5" onclick="hsMgrDelete(\'' + s.ma + '\',\'' + safeName + '\',\'' + s.lop + '\')" title="Xoá vĩnh viễn — CHỈ khi nhập nhầm/sai sót">🗑</button>';
        return '<tr style="border-bottom:1px solid #f1f5f9">'
          + '<td style="text-align:center;color:#94a3b8">' + stt + '</td>'
          + '<td style="text-align:center"><b>Lớp ' + s.lop + '</b></td>'
          + '<td style="text-align:center;font-family:monospace;font-size:.78rem">' + s.ma + '</td>'
          + '<td style="padding:6px 8px"><b>' + s.ten + '</b></td>'
          + '<td style="text-align:center;font-size:.78rem">' + s.ns + '</td>'
          + '<td style="text-align:center">' + s.gt + '</td>'
          + '<td style="padding:6px">' + status + '</td>'
          + '<td style="text-align:center;white-space:nowrap">' + actions + '</td>'
          + '</tr>';
      }).join('');
  document.getElementById('hsMgrTbody').innerHTML = html;
  document.getElementById('hsMgrPagiInfo').textContent = tot
    ? ((cur - 1) * pz + 1) + '–' + Math.min(cur * pz, tot) + ' / ' + tot + ' HS'
    : '0 HS';
  // Pagination
  var btns = '';
  if (tp > 1) {
    btns += '<button class="adm-btn adm-btn-outline" style="padding:3px 8px" ' + (cur <= 1 ? 'disabled' : '') + ' onclick="hsMgrGoPage(' + (cur - 1) + ')">‹</button>';
    var s2 = Math.max(1, cur - 2), e2 = Math.min(tp, cur + 2);
    if (s2 > 1) btns += '<button class="adm-btn adm-btn-outline" style="padding:3px 8px" onclick="hsMgrGoPage(1)">1</button>' + (s2 > 2 ? '<span style="padding:3px">…</span>' : '');
    for (var i = s2; i <= e2; i++) btns += '<button class="adm-btn ' + (i === cur ? 'adm-btn-primary' : 'adm-btn-outline') + '" style="padding:3px 8px;min-width:30px" onclick="hsMgrGoPage(' + i + ')">' + i + '</button>';
    if (e2 < tp) btns += (e2 < tp - 1 ? '<span style="padding:3px">…</span>' : '') + '<button class="adm-btn adm-btn-outline" style="padding:3px 8px" onclick="hsMgrGoPage(' + tp + ')">' + tp + '</button>';
    btns += '<button class="adm-btn adm-btn-outline" style="padding:3px 8px" ' + (cur >= tp ? 'disabled' : '') + ' onclick="hsMgrGoPage(' + (cur + 1) + ')">›</button>';
  }
  document.getElementById('hsMgrPagiBtns').innerHTML = btns;
}

function hsMgrGoPage(p){ window._hsMgrPage = p; hsMgrRender(); }

// 2026-05-07: Toggle section Excel bulk (collapsed by default — đỡ chiếm space)
function hsMgrToggleBulk(){
  var sec = document.getElementById('hsBulkSection');
  var lnk = document.getElementById('hsBulkToggle');
  if (!sec) return;
  var isOpen = sec.style.display !== 'none';
  if (isOpen) {
    sec.style.display = 'none';
    if (lnk) lnk.innerHTML = '📊 Excel bulk (đầu năm) ▾';
  } else {
    sec.style.display = '';
    if (lnk) lnk.innerHTML = '📊 Excel bulk (đầu năm) ▴';
    setTimeout(function(){ sec.scrollIntoView({behavior:'smooth', block:'nearest'}); }, 50);
  }
}

// ─── MODAL TIẾP NHẬN / SỬA ───
function hsMgrOpenAdd(){
  window._hsMgrEditMa = null;
  document.getElementById('hsMgrFormTitle').textContent = '➕ Tiếp nhận học sinh';
  document.getElementById('hsMgrFormSub').textContent = 'Học sinh chuyển đến / thêm mới';
  document.getElementById('hsMgrFormSubmit').textContent = '💾 Tiếp nhận';
  document.getElementById('hsMgrReceiveSection').style.display = '';
  ['ten','ma','ns','gt','dantoc','tongiao','tinh','xa','to','noisinh','cha','namsinh-cha','me','namsinh-me','sdt','received-date','received-from'].forEach(function(k){
    var el = document.getElementById('hsf-' + k); if (el) el.value = '';
  });
  document.getElementById('hsf-ma').disabled = false;
  // Build lớp dropdown
  var sel = document.getElementById('hsf-lop');
  var html = '<option value="">Chọn lớp</option>';
  [1,2,3,4,5].forEach(function(k){ ['A','B','C','D','E'].forEach(function(c){ html += '<option value="' + k + c + '">Lớp ' + k + c + '</option>'; }); });
  sel.innerHTML = html;
  document.getElementById('hsMgrFormErr').textContent = '';
  document.getElementById('hsMgrFormBg').style.display = 'flex';
}

function hsMgrOpenEdit(ma){
  var s = (_hsMgrData.active || []).find(function(x){ return x.ma === ma; })
       || (_hsMgrData.transferred || []).find(function(x){ return x.ma === ma; });
  if (!s) { alert('Không tìm thấy HS'); return; }
  window._hsMgrEditMa = ma;
  document.getElementById('hsMgrFormTitle').textContent = '✏️ Sửa thông tin học sinh';
  document.getElementById('hsMgrFormSub').textContent = s.ten + ' · Lớp ' + s.lop + ' · Mã ' + s.ma;
  document.getElementById('hsMgrFormSubmit').textContent = '💾 Lưu thay đổi';
  document.getElementById('hsMgrReceiveSection').style.display = 'none';
  document.getElementById('hsf-ten').value = s.ten || '';
  document.getElementById('hsf-ma').value = s.ma || '';
  document.getElementById('hsf-ma').disabled = true;  // không cho đổi mã định danh
  document.getElementById('hsf-ns').value = s.ns || '';
  document.getElementById('hsf-gt').value = s.gt || '';
  document.getElementById('hsf-dantoc').value = s.dan_toc || '';
  document.getElementById('hsf-tongiao').value = s.ton_giao || '';
  document.getElementById('hsf-tinh').value = s.tinh || '';
  document.getElementById('hsf-xa').value = s.xa || '';
  document.getElementById('hsf-to').value = s.to || '';
  document.getElementById('hsf-noisinh').value = s.noi_sinh || '';
  document.getElementById('hsf-sdt').value = s.sdt || '';
  document.getElementById('hsf-cha').value = s.cha || '';
  document.getElementById('hsf-namsinh-cha').value = s.namsinh_cha || '';
  document.getElementById('hsf-me').value = s.me || '';
  document.getElementById('hsf-namsinh-me').value = s.namsinh_me || '';
  // Build lớp dropdown với option đang chọn
  var sel = document.getElementById('hsf-lop');
  var html = '<option value="">Chọn lớp</option>';
  [1,2,3,4,5].forEach(function(k){ ['A','B','C','D','E'].forEach(function(c){
    html += '<option value="' + k + c + '"' + (s.lop === (k + c) ? ' selected' : '') + '>Lớp ' + k + c + '</option>';
  }); });
  sel.innerHTML = html;
  document.getElementById('hsMgrFormErr').textContent = '';
  document.getElementById('hsMgrFormBg').style.display = 'flex';
}

function hsMgrCloseForm(){ document.getElementById('hsMgrFormBg').style.display = 'none'; }

function hsMgrSubmitForm(){
  var err = document.getElementById('hsMgrFormErr');
  err.textContent = '';
  var data = {
    ten: document.getElementById('hsf-ten').value.trim(),
    ma: document.getElementById('hsf-ma').value.trim(),
    ns: document.getElementById('hsf-ns').value.trim(),
    lop: document.getElementById('hsf-lop').value,
    gt: document.getElementById('hsf-gt').value,
    dan_toc: document.getElementById('hsf-dantoc').value.trim(),
    ton_giao: document.getElementById('hsf-tongiao').value.trim(),
    tinh: document.getElementById('hsf-tinh').value.trim(),
    xa: document.getElementById('hsf-xa').value.trim(),
    to: document.getElementById('hsf-to').value.trim(),
    noi_sinh: document.getElementById('hsf-noisinh').value.trim(),
    sdt: document.getElementById('hsf-sdt').value.trim(),
    cha: document.getElementById('hsf-cha').value.trim(),
    namsinh_cha: document.getElementById('hsf-namsinh-cha').value.trim(),
    me: document.getElementById('hsf-me').value.trim(),
    namsinh_me: document.getElementById('hsf-namsinh-me').value.trim()
  };
  if (!data.ten || !data.ma || !data.lop || !data.ns || !data.gt) {
    err.textContent = '⚠️ Vui lòng điền đầy đủ: Họ tên, Mã HS, Ngày sinh, Lớp, Giới tính';
    return;
  }
  if (_hsMgrEditMa) {
    callGAS('updateStudent', { ma: _hsMgrEditMa, student: data })
      .then(function(res){
        if (!res.ok) { err.textContent = '❌ ' + res.error; return; }
        hsMgrCloseForm();
        // Reset cache để load lại
        window._hsMgrData = { active: [], transferred: [], all: [] };
        hsMgrLoad();
      }).catch(function(e){ err.textContent = '❌ ' + e.message; });
  } else {
    data.received_date = document.getElementById('hsf-received-date').value.trim();
    data.received_from = document.getElementById('hsf-received-from').value.trim();
    callGAS('addStudent', { student: data })
      .then(function(res){
        if (!res.ok) { err.textContent = '❌ ' + res.error; return; }
        hsMgrCloseForm();
        window._hsMgrData = { active: [], transferred: [], all: [] };
        hsMgrLoad();
      }).catch(function(e){ err.textContent = '❌ ' + e.message; });
  }
}

// ─── MODAL CHUYỂN ĐI ───
function hsMgrOpenTransfer(ma, ten, lop){
  window._hsMgrTransferMa = ma;
  document.getElementById('hsMgrTransferSub').textContent = ten + ' · Lớp ' + lop + ' · Mã ' + ma;
  document.getElementById('hsf-transfer-date').value = '';
  document.getElementById('hsf-transfer-to').value = '';
  document.getElementById('hsf-transfer-reason').value = '';
  document.getElementById('hsMgrTransferErr').textContent = '';
  document.getElementById('hsMgrTransferBg').style.display = 'flex';
}

function hsMgrCloseTransfer(){ document.getElementById('hsMgrTransferBg').style.display = 'none'; }

function hsMgrSubmitTransfer(){
  var err = document.getElementById('hsMgrTransferErr');
  err.textContent = '';
  var transferTo = document.getElementById('hsf-transfer-to').value.trim();
  if (!transferTo) { err.textContent = '⚠️ Vui lòng nhập trường chuyển đến'; return; }
  callGAS('transferStudent', {
    ma: _hsMgrTransferMa,
    transfer: {
      transfer_date: document.getElementById('hsf-transfer-date').value.trim(),
      transfer_to: transferTo,
      transfer_reason: document.getElementById('hsf-transfer-reason').value.trim()
    }
  }).then(function(res){
    if (!res.ok) { err.textContent = '❌ ' + res.error; return; }
    hsMgrCloseTransfer();
    window._hsMgrData = { active: [], transferred: [], all: [] };
    hsMgrLoad();
  }).catch(function(e){ err.textContent = '❌ ' + e.message; });
}

// ─── KHÔI PHỤC ───
function hsMgrRestore(ma, ten){
  if (!confirm('Khôi phục HS "' + ten + '" về trạng thái Đang học?\n\nTab "Đang học" sẽ có lại HS này.')) return;
  callGAS('restoreStudent', { ma: ma })
    .then(function(res){
      if (!res.ok) { alert('❌ ' + res.error); return; }
      window._hsMgrData = { active: [], transferred: [], all: [] };
      hsMgrLoad();
    }).catch(function(e){ alert('❌ ' + e.message); });
}

// ─── XOÁ VĨNH VIỄN (chỉ cho NHẬP NHẦM) ───
// 2 lớp confirm để chống click nhầm:
//   1. Confirm chuẩn JS với nội dung cảnh báo
//   2. Prompt yêu cầu gõ chữ "XOA" — chống "Yes-by-default"
function hsMgrDelete(ma, ten, lop){
  // Lớp 1: Confirm với nội dung phân biệt "Xoá" vs "Chuyển đi"
  var msg1 = '⚠ XOÁ VĨNH VIỄN học sinh khỏi DSHS\n\n'
           + '   ' + ten + '  ·  Lớp ' + lop + '  ·  Mã ' + ma + '\n\n'
           + '❗ Chỉ dùng khi NHẬP NHẦM (sai mã, sai tên, trùng...).\n'
           + '❗ Nếu HS chuyển trường THẬT — hãy dùng nút 🚌 (Chuyển đi) thay vì xoá.\n\n'
           + 'Hành động này KHÔNG THỂ HOÀN TÁC. Tiếp tục?';
  if (!confirm(msg1)) return;

  // Lớp 2: Prompt yêu cầu gõ "XOA" để xác nhận lần cuối
  var typed = prompt('Để chắc chắn, hãy gõ chính xác chữ "XOA" (in hoa, không dấu) rồi bấm OK:\n\n— ' + ten + ' (mã ' + ma + ')');
  if (typed === null) return;  // user bấm Cancel
  if (typed.trim().toUpperCase() !== 'XOA') {
    alert('❌ Bạn không gõ đúng "XOA" — đã huỷ thao tác xoá. (Đây là cơ chế bảo vệ chống click nhầm.)');
    return;
  }

  // OK — gọi backend
  callGAS('deleteStudentPermanent', { ma: ma })
    .then(function(res){
      if (!res.ok) { alert('❌ ' + res.error); return; }
      // Reset cache để load lại danh sách
      window._hsMgrData = { active: [], transferred: [], all: [] };
      hsMgrLoad();
      var hsMgrMsg = document.getElementById('admHsmgrMsg');
      if (hsMgrMsg) {
        hsMgrMsg.textContent = '🗑 ' + res.message;
        hsMgrMsg.className = 'adm-alert ok';
        setTimeout(function(){ hsMgrMsg.className = 'adm-alert'; }, 4000);
      }
    }).catch(function(e){ alert('❌ ' + e.message); });
}

// ─── LISTENERS cho filter UI ───
document.addEventListener('DOMContentLoaded', function(){
  ['hsMgrSearch','hsMgrFilterKhoi','hsMgrFilterLop','hsMgrFilterStatus'].forEach(function(id){
    var el = document.getElementById(id);
    if (!el) return;
    var ev = (id === 'hsMgrSearch') ? 'input' : 'change';
    el.addEventListener(ev, function(){
      if (id === 'hsMgrFilterStatus') hsMgrLoad();
      else hsMgrFilter();
    });
  });
});