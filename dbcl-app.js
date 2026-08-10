/*
============================================================================
 dbcl-app.js — Module Đảm bảo Chất lượng (dbcl.html)
============================================================================
 Refactor 2026-05-12 · Bước 5 của Hệ thống Quản trị số.
 Trang dbcl.html load: core-shared.js → dbcl-app.js

 KIẾN TRÚC PHASE 1 — 5 Tab x 12 chức năng (theo spec thầy 2026-05-12):
   1. 🏛 Tổ ĐBCL              — chức năng (1) Thành lập + (2) Phân công nhiệm vụ
   2. 📋 Kế hoạch & Vận hành  — (3) KH năm + (4) Công khai chuẩn đầu ra +
                                (5) Vận hành + (6) Theo dõi + (7) PDCA
   3. 🤝 Cam kết Chất lượng   — (8) 4 loại cam kết: GV-HT · GVCN-CMHS ·
                                HT-Cấp trên · Trường-BĐD CMHS
   4. 📊 Chỉ tiêu & Báo cáo   — (9) BC HK1/cuối năm/sơ kết +
                                (10) Hồ sơ minh chứng + (11) Chỉ tiêu lớp 5
   5. 🔗 Kết nối Hệ thống     — (12) KĐCL · Trường chuẩn QG · HSS · CCHC

 Trạng thái:
   • Tab 2 (Plan) — ĐÃ CÓ DATA: 10 văn bản trường năm 2025-2026 (từ folder thầy cấp)
   • Tab 1, 3, 4 — Phase 2 (CRUD form) sau khi thầy duyệt template
   • Tab 5 — Phase 1 đã làm (link cards)
============================================================================
*/

  let HSS = [], STATS = {}, MINHCHUNG = [];

  /* ───── DATA ĐBCL THỰC TẾ — TH Diễn Liên 2025-2026
     Bóc từ folder "10.2. Phụ lục ĐBCL" (17 phụ lục) thầy cấp 2026-05-12 ───── */

  // 11 thành viên Tổ ĐBCL (theo QĐ 96/QĐ-THDL ngày 20/9/2025)
  const TO_DBCL = [
    {stt:1,  name:'Nguyễn Thị Hòa',          chucVu:'Hiệu trưởng',         vaiTro:'Tổ trưởng'},
    {stt:2,  name:'Trần Thanh Chung',        chucVu:'Phó Hiệu trưởng',     vaiTro:'Tổ phó'},
    {stt:3,  name:'Tăng Thị Tú',             chucVu:'Thư ký Hội đồng',     vaiTro:'Thư ký'},
    {stt:4,  name:'Tăng Thị Hương Giang',    chucVu:'Tổ trưởng CM 1,2,3',  vaiTro:'Thành viên'},
    {stt:5,  name:'Cao Thị Hòe',             chucVu:'Tổ phó CM 1,2,3',     vaiTro:'Thành viên'},
    {stt:6,  name:'Nguyễn Thị Hòa',          chucVu:'Tổ trưởng CM 4,5',    vaiTro:'Thành viên'},
    {stt:7,  name:'Cao Thị Thanh Hương',     chucVu:'Tổ phó CM 4,5',       vaiTro:'Thành viên'},
    {stt:8,  name:'Nguyễn Thị Kim Oanh',     chucVu:'GV TPT Đội',          vaiTro:'Thành viên'},
    {stt:9,  name:'Nguyễn Thị Luyến',        chucVu:'GV Tiếng Anh',        vaiTro:'Thành viên'},
    {stt:10, name:'Nguyễn Thị Hà',           chucVu:'NV TVTB',             vaiTro:'Thành viên'},
    {stt:11, name:'Phan Thị Hạnh',           chucVu:'NV Kế toán',          vaiTro:'Thành viên'}
  ];

  // 9 nhóm phân công nhiệm vụ (Phụ lục 11)
  const PHAN_CONG = [
    {stt:1, noiDung:'Phân tích yếu tố bên trong, bên ngoài nhà trường', nguoi:'đ/c Trần Thanh Chung; Nguyễn Thị Hòa HT', phuLuc:'10, 11, 12, 13'},
    {stt:2, noiDung:'Tầm nhìn, sứ mệnh, giá trị cốt lõi, mục tiêu chương trình GD', nguoi:'đ/c Trần Thanh Chung; Nguyễn Thị Hòa HT', phuLuc:'10, 11, 12, 13'},
    {stt:3, noiDung:'Xác định chuẩn đầu ra', nguoi:'đ/c Nguyễn Thị Hòa TT; Tăng Thị Hương Giang; Cao Thị Hòe; Cao Thị Thanh Hương', phuLuc:'1, 2'},
    {stt:4, noiDung:'Chương trình giáo dục', nguoi:'đ/c Nguyễn Thị Hòa HT; đ/c Trần Thanh Chung', phuLuc:'5, 15, 16'},
    {stt:5, noiDung:'Xây dựng văn hoá nhà trường', nguoi:'đ/c Tăng Thị Tú; Nguyễn Thị Luyến; Nguyễn Thị Kim Oanh; Nguyễn Thị Thu Hà', phuLuc:'8, 9'},
    {stt:6, noiDung:'Phát triển CBQL, GV, NV', nguoi:'đ/c Nguyễn Thị Hòa HT; đ/c Trần Thanh Chung', phuLuc:'3'},
    {stt:7, noiDung:'Cơ sở vật chất, trang thiết bị dạy học', nguoi:'đ/c Nguyễn Thị Hà; Nguyễn Thị Kim Oanh', phuLuc:'4'},
    {stt:8, noiDung:'Khảo sát GV, PH, HS, các bên liên quan', nguoi:'đ/c Cao Thị Thanh Hương; Tăng Thị Hương Giang; Nguyễn Thị Hòa TTCM4,5; Cao Thị Hòe', phuLuc:'6, 7'},
    {stt:9, noiDung:'Kinh phí thực hiện', nguoi:'đ/c Nguyễn Thị Hòa HT; đ/c Phan Thị Hạnh', phuLuc:'14'}
  ];

  // 17 Phụ lục ĐBCL (theo folder 10.2)
  const PHU_LUC_LIST = [
    {num:1,  name:'Thực trạng nhà trường 2025-2026', type:'data'},
    {num:2,  name:'Chuẩn đầu ra chất lượng học tập 2025-2026', type:'standard'},
    {num:3,  name:'Nâng cao chất lượng CBQL, GV, NV (37 người)', type:'data'},
    {num:4,  name:'Nâng cao cơ sở vật chất, trang thiết bị (83,5 triệu)', type:'plan'},
    {num:5,  name:'Kết quả học tập, rèn luyện 2024-2025', type:'data'},
    {num:6,  name:'Phiếu khảo sát Phụ huynh đối với GV', type:'survey'},
    {num:7,  name:'Phiếu khảo sát GV về chất lượng HS', type:'survey'},
    {num:8,  name:'Bộ tiêu chí đánh giá Chương trình GD (5 mục)', type:'survey'},
    {num:9,  name:'Phiếu đánh giá CBQL trường PT — HK1', type:'survey'},
    {num:10, name:'⭐ QĐ thành lập Tổ ĐBCL (96/QĐ-THDL · 20/9/2025)', type:'decision'},
    {num:11, name:'Phân công nhiệm vụ Tổ ĐBCL (9 nhóm)', type:'plan'},
    {num:12, name:'Bìa + Danh sách & Chữ ký Tổ ĐBCL', type:'cover'},
    {num:13, name:'Kế hoạch Đảm bảo Chất lượng 2025-2026', type:'plan'},
    {num:14, name:'Dự toán kinh phí ĐBCL (9,7 triệu)', type:'budget'},
    {num:15, name:'Bản cam kết GV chủ nhiệm + GV chuyên (2 mẫu)', type:'commit'},
    {num:16, name:'Bản cam kết HT với UBND xã Quảng Châu', type:'commit'}
  ];

  // 4 loại cam kết chất lượng (theo Phụ lục 15a, 15b, 16 + thực tế trường)
  const CAM_KET = [
    {icon:'📝', from:'Giáo viên',          to:'Hiệu trưởng',                   desc:'GV cam kết chỉ tiêu chất lượng môn dạy / lớp chủ nhiệm với HT đầu năm học. Có 2 mẫu: GVCN (Phụ lục 15a) và GV chuyên (Phụ lục 15b).', color:'#0c5da5', plPath:'15a + 15b'},
    {icon:'🤝', from:'Giáo viên Chủ nhiệm', to:'Đại diện CMHS lớp',             desc:'GVCN cam kết chỉ tiêu chất lượng lớp với Ban đại diện CMHS lớp tại buổi họp PH đầu năm.', color:'#16a34a', plPath:'(chưa có mẫu — sẽ bổ sung)'},
    {icon:'📋', from:'Hiệu trưởng',         to:'UBND xã Quảng Châu (cấp QL)',   desc:'HT cam kết chỉ tiêu chất lượng nhà trường với UBND xã đầu năm học (Phụ lục 16). Bao gồm chỉ số học tập, GV, CSVC, khen thưởng.', color:'#c79a2a', plPath:'16'},
    {icon:'🏫', from:'Nhà trường',         to:'Ban đại diện CMHS trường',      desc:'Trường ký cam kết tổng hợp với Ban đại diện CMHS toàn trường tại Hội nghị đầu năm.', color:'#7c3aed', plPath:'(BB Hội nghị)'}
  ];

  // Chuẩn đầu ra Lớp 5 — Toán/TV/T.Anh (từ Phụ lục 2, 16)
  const CHUAN_DAU_RA_L5 = [
    {ic:'🔢', name:'Toán',       targetTBC:7.5, color:'#dc2626'},
    {ic:'📖', name:'Tiếng Việt', targetTBC:7.0, color:'#0c5da5'},
    {ic:'🔤', name:'Tiếng Anh',  targetTBC:6.5, color:'#7c3aed'}
  ];

  /* ───── BOOT ───── */
  function boot(data, isCache){
    window.HSS = data.hss || [];
    window.MINHCHUNG = data.minhchung || [];
    window.STATS = data.stats || {};
    HSS = window.HSS;
    MINHCHUNG = window.MINHCHUNG;
    STATS = window.STATS;

    // ⭐ ĐBCL Phase 2 (2026-05-12): ưu tiên data từ backend (Sheet "DBCL_To" + "DBCL_PhuLuc")
    // Fallback hardcoded TO_DBCL/PHU_LUC_LIST nếu sheet trống/chưa tạo.
    var be = (data && data.dbcl) || { to: [], phuluc: [] };
    window.DBCL_TO_RUNTIME     = (be.to && be.to.length) ? be.to : TO_DBCL;
    window.DBCL_PHULUC_RUNTIME = (be.phuluc && be.phuluc.length) ? be.phuluc : PHU_LUC_LIST;
    window.DBCL_FROM_BACKEND   = !!(be.to && be.to.length);  // flag hiển thị trong UI

    var nm = document.getElementById('navSchoolName');
    if (nm && STATS.config && STATS.config.name) nm.textContent = STATS.config.name;
    var hd = document.getElementById('dbclSchoolName');
    if (hd && STATS.config && STATS.config.name) hd.textContent = STATS.config.name;

    // Render 5 tab content (chỉ render 1 lần khi boot)
    renderTabOrg();
    renderTabPlan();
    renderTabCommit();
    renderTabReport();
    renderTabLink();

    var ls = document.getElementById('loadScreen');
    if (ls) { ls.classList.add('done'); setTimeout(function(){ ls.remove(); }, 500); }

    if (isCache) {
      fetchGAS(function(freshData){
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: freshData})); } catch(e){}
        boot(freshData, false);
      }, function(){});
    }
  }

  /* ───── TAB SWITCHING ───── */
  window.switchDbclTab = function(id){
    document.querySelectorAll('.dbcl-tab').forEach(function(b){
      b.classList.toggle('active', b.dataset.tab === id);
    });
    document.querySelectorAll('.dbcl-tab-content').forEach(function(c){
      c.classList.toggle('active', c.id === 'tab-' + id);
    });
    window.scrollTo({ top: document.querySelector('.dbcl-tabs').offsetTop - 80, behavior: 'smooth' });
  };

  /* ───── HELPER ───── */
  function _soonBlock(title, items, hint){
    var li = items.map(function(s){ return '<li>' + escapeHtml(s) + '</li>'; }).join('');
    return '<div class="dbcl-soon">'
      + '<div class="dbcl-soon-icon">🚧</div>'
      + '<h3>' + escapeHtml(title) + ' — đang phát triển (Phase 2)</h3>'
      + '<p>Các chức năng sẽ có:</p>'
      + '<ul>' + li + '</ul>'
      + (hint ? '<p style="font-size:.86rem;color:#94a3b8;margin-top:14px">' + hint + '</p>' : '')
      + '</div>';
  }

  function _pillarCard(num, title, color, items){
    var li = items.map(function(name){
      return '<li style="padding:6px 0;border-bottom:1px dashed #e5e7eb;color:#475569">📄 ' + escapeHtml(name) + '</li>';
    }).join('');
    return '<div style="border:1px solid #e5e7eb;border-radius:14px;padding:18px;background:white">'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid ' + color + '">'
      + '<span style="font-size:1.6rem">' + num + '</span>'
      + '<h4 style="font-family:Fraunces,serif;color:' + color + ';font-size:1.05rem;margin:0">' + escapeHtml(title) + '</h4>'
      + '</div>'
      + '<ul style="list-style:none;padding:0;margin:0;font-size:.88rem">' + li + '</ul>'
      + '</div>';
  }

  function _linkCard(icon, title, sub, color, onclick){
    return '<a href="javascript:void(0)" class="dbcl-link-card" onclick="' + onclick + '">'
      + '<span class="dbcl-link-ic" style="background:' + color + '">' + icon + '</span>'
      + '<span class="dbcl-link-body"><b>' + escapeHtml(title) + '</b><span>' + escapeHtml(sub) + '</span></span>'
      + '<span style="color:#94a3b8;font-size:1.2rem">→</span>'
      + '</a>';
  }

  /* ============================================================
     TAB 1 — TỔ ĐBCL  (chức năng 1, 2)
     Data thực: 11 thành viên + 9 phân công (Phụ lục 10, 11, 12)
  ============================================================ */
  function renderTabOrg(){
    var el = document.getElementById('tab-org');
    if (!el) return;
    var html = '<div style="max-width:1080px;margin:0 auto">';

    // ── 1. Header card (đồng tone xanh dương với hero ĐBCL)
    html += '<div style="background:linear-gradient(135deg,#1E4A8F,#2d6e9a);color:white;border-radius:20px;padding:24px 32px;margin-bottom:20px;box-shadow:0 8px 24px rgba(30,74,143,.2)">';
    html += '<div style="display:flex;align-items:center;gap:14px">'
      + '<span style="font-size:2.4rem">⚖️</span>'
      + '<div>'
      + '<h3 style="font-family:Fraunces,serif;margin:0;font-size:1.3rem">Tổ Đảm bảo Chất lượng</h3>'
      + '<div style="opacity:.9;font-size:.92rem;margin-top:4px">Năm học 2025-2026</div>'
      + '</div></div>';
    html += '</div>';

    // ── 2. Bảng 11 thành viên
    html += '<div style="background:white;border-radius:20px;padding:24px 28px;margin-bottom:20px;box-shadow:0 6px 24px rgba(0,0,0,.06)">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:14px">👥 Danh sách 11 thành viên Tổ ĐBCL</h3>';
    html += '<div class="dbcl-table-wrap"><table class="dbcl-table"><thead><tr>'
      + '<th style="width:40px">TT</th><th>Họ và tên</th><th>Chức danh, chức vụ</th><th style="width:140px">Vai trò trong Tổ</th>'
      + '</tr></thead><tbody>';
    (window.DBCL_TO_RUNTIME || TO_DBCL).forEach(function(m){
      var roleColor = m.vaiTro === 'Tổ trưởng' ? '#dc2626' : (m.vaiTro === 'Tổ phó' ? '#c79a2a' : (m.vaiTro === 'Thư ký' ? '#7c3aed' : '#64748b'));
      html += '<tr>'
        + '<td>' + m.stt + '</td>'
        + '<td><b>' + escapeHtml(m.name) + '</b></td>'
        + '<td>' + escapeHtml(m.chucVu) + '</td>'
        + '<td><span style="background:' + roleColor + '15;color:' + roleColor + ';padding:3px 10px;border-radius:12px;font-size:.82rem;font-weight:600">' + escapeHtml(m.vaiTro) + '</span></td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</div>';

    // ── 3. Bảng 9 phân công nhiệm vụ
    html += '<div style="background:white;border-radius:20px;padding:24px 28px;margin-bottom:20px;box-shadow:0 6px 24px rgba(0,0,0,.06)">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:14px">📌 Phân công 9 nhóm công việc (Phụ lục 11)</h3>';
    html += '<div class="dbcl-table-wrap"><table class="dbcl-table"><thead><tr>'
      + '<th style="width:40px">TT</th><th style="width:35%">Nội dung công việc</th><th>Người phụ trách</th><th style="width:110px">Phụ lục</th>'
      + '</tr></thead><tbody>';
    PHAN_CONG.forEach(function(p){
      html += '<tr>'
        + '<td>' + p.stt + '</td>'
        + '<td><b>' + escapeHtml(p.noiDung) + '</b></td>'
        + '<td style="font-size:.86rem">' + escapeHtml(p.nguoi) + '</td>'
        + '<td style="text-align:center"><span style="background:#dcfce7;color:#16a34a;padding:3px 8px;border-radius:8px;font-size:.78rem;font-weight:600">PL ' + escapeHtml(p.phuLuc) + '</span></td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</div>';

    // ── 4. Phụ lục liên quan (10, 11, 12)
    html += _phuLucBox('📄 Phụ lục Tổ ĐBCL', [10, 11, 12]);

    html += '</div>';
    el.innerHTML = html;
  }

  // Helper: render box list các phụ lục với button "Mở"
  function _phuLucBox(title, plNums){
    var src = window.DBCL_PHULUC_RUNTIME || PHU_LUC_LIST;
    var items = src.filter(function(p){ return plNums.indexOf(p.num) >= 0; });
    var typeIc = {data:'📊', standard:'🎯', plan:'📋', survey:'📝', decision:'⚖️', cover:'📑', budget:'💰', commit:'🤝'};
    var html = '<div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:14px;padding:20px 24px;margin-bottom:20px">';
    html += '<h4 style="font-family:Fraunces,serif;color:#14532d;margin-bottom:12px">' + title + '</h4>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px">';
    items.forEach(function(p){
      var ic = typeIc[p.type] || '📄';
      html += '<button onclick="openPhuLuc(' + p.num + ')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:white;border:1px solid #bbf7d0;border-radius:10px;cursor:pointer;text-align:left;font-family:inherit;transition:all .2s" onmouseover="this.style.borderColor=\'#16a34a\';this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.borderColor=\'#bbf7d0\';this.style.transform=\'translateY(0)\'">'
        + '<span style="font-size:1.4rem">' + ic + '</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-weight:600;color:#0f172a;font-size:.84rem">PHỤ LỤC ' + p.num + '</div>'
        + '<div style="color:#64748b;font-size:.78rem;line-height:1.4">' + escapeHtml(p.name) + '</div>'
        + '</div>'
        + '<span style="color:#16a34a;font-weight:700">→</span>'
        + '</button>';
    });
    html += '</div>';
    html += '<p style="color:#14532d;font-size:.78rem;margin:12px 0 0;text-align:center;opacity:.75">💡 Phase 2: Admin nhập link Drive cho từng phụ lục → click mở trực tiếp</p>';
    html += '</div>';
    return html;
  }

  // ⭐ Phase 2: ưu tiên mở Drive URL từ Sheet "DBCL_PhuLuc". Fallback alert nếu chưa có link.
  window.openPhuLuc = function(num){
    var src = window.DBCL_PHULUC_RUNTIME || PHU_LUC_LIST;
    var p = src.find(function(x){ return x.num === num; });
    if (!p) return;
    if (p.link) {
      window.open(p.link, '_blank', 'noopener');
      return;
    }
    alert('📄 PHỤ LỤC ' + num + '\n\n' + p.name + '\n\n⏳ Chưa có link Drive cho phụ lục này.\n\n📁 Vị trí gốc: D:\\ChungTrT_Drive\\HSS2026\\TH_DIENLIEN_ADMIN\\10. Đảm bảo chất lượng\\Năm học 2025-2026\\10.2. Phụ lục ĐBCL\\\n\n💡 Cách bổ sung: Mở Google Sheet "DBCL_PhuLuc" → cột "Link Drive" → dán URL. Sau đó refresh trang.');
  };

  /* ============================================================
     TAB 2 — KẾ HOẠCH & VẬN HÀNH  (chức năng 3, 4, 5, 6, 7)
     ⭐ Tab DEFAULT — đã có dữ liệu thực: 10 văn bản trường 2025-2026
  ============================================================ */
  function renderTabPlan(){
    var el = document.getElementById('tab-plan');
    if (!el) return;

    // Khung 4 trụ cột với 10 văn bản từ folder thầy cấp
    var html = '<div style="max-width:1080px;margin:0 auto">';
    html += '<div style="background:white;border-radius:20px;padding:28px 32px;box-shadow:0 6px 24px rgba(0,0,0,.06);margin-bottom:20px">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:20px">📋 Kế hoạch &amp; Vận hành ĐBCL — Năm học 2025-2026</h3>';
    // 2x2 trên desktop (auto-fit minmax 380 → tối đa 2 cột vì max-width container = 1080px)
    // 1 cột trên mobile (< 760px)
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:16px">';
    html += _pillarCard('1️⃣', 'Cam kết ĐBCL (cấp trường)', '#16a34a', [
      '2025. Bảng công khai tổng hợp cam kết ĐBCL'
    ]);
    html += _pillarCard('2️⃣', 'Chuẩn đầu ra', '#0c5da5', [
      '2025.105. QĐ ban hành chuẩn đầu ra',
      '2025.10. Bảng công khai chuẩn đầu ra',
      'Hồ sơ Chuẩn đầu ra ĐBCL 2025-2026',
      'BB giao chuẩn đầu ra lớp 5 với HT'
    ]);
    html += _pillarCard('3️⃣', 'Kiểm tra giám sát', '#c79a2a', [
      '2025.121. KH kiểm tra giám sát ĐBCL',
      'Kế hoạch kiểm tra giám sát ĐBCL'
    ]);
    html += _pillarCard('4️⃣', 'Báo cáo TĐG ĐBCL', '#7c3aed', [
      '2026.06. Báo cáo TĐG về công tác ĐBCL',
      'BB Hội nghị',
      'BB họp Hiệu trưởng với PH các lớp'
    ]);
    html += '</div>';
    html += '</div>';

    // Render hồ sơ nhóm 11 từ Sheet (nếu có)
    var cat11 = (HSS || []).find(function(c){ return c.stt === 11 || c.stt === '11'; });
    if (cat11 && cat11.children && cat11.children.length) {
      html += '<div style="background:white;border-radius:20px;padding:24px 28px;box-shadow:0 6px 24px rgba(0,0,0,.06);margin-bottom:20px">';
      html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:14px">📁 Hồ sơ ĐBCL trên Drive (đã đồng bộ)</h3>';
      cat11.children.forEach(function(g){ html += _renderSubgroupBlock(g); });
      html += '</div>';
    }

    // PDCA cycle visualization
    html += '<div style="background:white;border-radius:20px;padding:28px 32px;box-shadow:0 6px 24px rgba(0,0,0,.06)">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:14px">🔄 Chu trình PDCA — Cải tiến liên tục</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">';
    [
      {n:'P', name:'PLAN — Lập KH', color:'#0c5da5', desc:'KH ĐBCL năm + Chuẩn đầu ra'},
      {n:'D', name:'DO — Vận hành', color:'#16a34a', desc:'Triển khai trong năm học'},
      {n:'C', name:'CHECK — Kiểm tra', color:'#c79a2a', desc:'Theo dõi, giám sát, đánh giá'},
      {n:'A', name:'ACT — Cải tiến', color:'#7c3aed', desc:'Điều chỉnh, rút kinh nghiệm'}
    ].forEach(function(s){
      html += '<div style="text-align:center;padding:18px 14px;background:#f8fafc;border-radius:14px;border-top:4px solid ' + s.color + '">'
        + '<div style="font-size:2rem;font-weight:700;color:' + s.color + '">' + s.n + '</div>'
        + '<div style="font-weight:600;color:#0f172a;margin:6px 0;font-size:.92rem">' + s.name + '</div>'
        + '<div style="font-size:.82rem;color:#64748b;line-height:1.5">' + s.desc + '</div>'
        + '</div>';
    });
    html += '</div></div>';
    html += '</div>';
    el.innerHTML = html;
  }

  function _renderSubgroupBlock(g){
    var items = (g.children || []).filter(function(x){ return x.leaf; });
    if (!items.length) return '';
    var rows = items.map(function(leaf){
      var link = leaf.link
        ? '<a href="' + escapeHtml(leaf.link) + '" target="_blank" rel="noopener" class="leaf-link" title="Mở trên Drive">📂</a>'
        : '<span style="color:#cbd5e1">—</span>';
      return '<tr><td><b>' + escapeHtml(leaf.code || '') + '</b></td><td>' + escapeHtml(leaf.name || '') + '</td><td style="text-align:center">' + link + '</td></tr>';
    }).join('');
    return '<div style="margin-bottom:20px">'
      + '<h4 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:10px;font-size:1rem">' + escapeHtml(g.code || '') + ' · ' + escapeHtml(g.name || '') + '</h4>'
      + '<div class="dbcl-table-wrap"><table class="dbcl-table"><thead><tr><th style="width:120px">Mã</th><th>Tên hồ sơ</th><th style="width:80px;text-align:center">Drive</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '</div>';
  }

  /* ============================================================
     TAB 3 — CAM KẾT CHẤT LƯỢNG  (chức năng 8 — 4 loại)
     Data thực: Phụ lục 15a (GVCN), 15b (GV chuyên), 16 (HT-UBND)
  ============================================================ */
  function renderTabCommit(){
    var el = document.getElementById('tab-commit');
    if (!el) return;
    var html = '<div style="max-width:1080px;margin:0 auto">';
    html += '<div style="background:white;border-radius:20px;padding:28px 32px;box-shadow:0 6px 24px rgba(0,0,0,.06);margin-bottom:20px">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:20px">🤝 Cam kết Chất lượng - Năm học 2025-2026</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px">';
    CAM_KET.forEach(function(c, i){
      html += '<div style="border:1px solid #e5e7eb;border-left:5px solid ' + c.color + ';border-radius:14px;padding:18px 22px;background:white;display:flex;flex-direction:column">'
        + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
        + '<span style="font-size:1.8rem">' + c.icon + '</span>'
        + '<span style="background:' + c.color + ';color:white;padding:3px 10px;border-radius:12px;font-size:.78rem;font-weight:600">Loại ' + (i+1) + '</span>'
        + '<span style="background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:12px;font-size:.74rem;font-weight:600;margin-left:auto">PL ' + escapeHtml(c.plPath) + '</span>'
        + '</div>'
        + '<div style="font-family:Fraunces,serif;color:#0f172a;font-size:1rem;margin-bottom:8px"><b>' + escapeHtml(c.from) + '</b> ⟶ <b>' + escapeHtml(c.to) + '</b></div>'
        + '<p style="color:#64748b;font-size:.88rem;line-height:1.6;margin:0 0 14px;flex:1">' + escapeHtml(c.desc) + '</p>';
      // Button "Mở mẫu"
      if (c.plPath.indexOf('15') >= 0) {
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap">'
          + '<button onclick="openPhuLuc(15)" style="flex:1;padding:9px 14px;background:' + c.color + ';color:white;border:none;border-radius:8px;font-family:inherit;font-size:.84rem;font-weight:600;cursor:pointer">📄 Mẫu PL 15</button>'
          + '</div>';
      } else if (c.plPath === '16') {
        html += '<button onclick="openPhuLuc(16)" style="padding:9px 14px;background:' + c.color + ';color:white;border:none;border-radius:8px;font-family:inherit;font-size:.84rem;font-weight:600;cursor:pointer">📄 Mở mẫu Phụ lục 16</button>';
      } else {
        html += '<button disabled style="padding:9px 14px;background:#f1f5f9;color:#94a3b8;border:none;border-radius:8px;font-family:inherit;font-size:.84rem;cursor:not-allowed">⏳ Chưa có mẫu</button>';
      }
      html += '</div>';
    });
    html += '</div></div>';

    // Roadmap CRUD form
    html += '<div style="background:#fef9c3;border-left:4px solid #ca8a04;border-radius:14px;padding:20px 24px;color:#713f12">';
    html += '<h4 style="font-family:Fraunces,serif;margin-bottom:8px">🚧 Phase 2 — Quản lý Cam kết</h4>';
    html += '<ul style="line-height:1.9;margin:8px 0 0;padding-left:20px">';
    html += '<li>📝 Form ký mới online — chọn loại + người ký + chỉ tiêu cụ thể (kế thừa cấu trúc Phụ lục 15, 16)</li>';
    html += '<li>📂 Lưu cam kết đã ký theo năm học (link Drive · cũng đẩy vào Sheet "CamKet")</li>';
    html += '<li>📊 Cuối HK1 / cuối năm: tự động so sánh chỉ tiêu cam kết vs kết quả thực tế từ QLCL</li>';
    html += '<li>⚠ Cảnh báo cam kết sắp đến hạn đánh giá (HK1 — cuối tháng 1, cuối năm — cuối tháng 5)</li>';
    html += '</ul></div>';

    html += '</div>';
    el.innerHTML = html;
  }

  /* ============================================================
     TAB 4 — CHỈ TIÊU & BÁO CÁO  (chức năng 9, 10, 11)
     Data thực: chuẩn đầu ra Lớp 5 từ Phụ lục 2, 16 (Toán 7.5, TV 7.0, TA 6.5)
  ============================================================ */
  function renderTabReport(){
    var el = document.getElementById('tab-report');
    if (!el) return;
    var html = '<div style="max-width:1080px;margin:0 auto">';

    // ── Highlight: Chỉ tiêu Lớp 5 (Toán/TV/T.Anh)
    html += '<div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:20px;padding:28px 32px;margin-bottom:20px;border:2px solid #f59e0b">';
    html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">'
      + '<span style="font-size:2.4rem">🎯</span>'
      + '<div>'
      + '<h3 style="font-family:Fraunces,serif;color:#92400e;margin:0">TRỌNG TÂM: Chỉ tiêu Chất lượng đầu ra Lớp 5</h3>'
      + '<p style="color:#78350f;margin:4px 0 0;font-size:.92rem">3 môn cốt lõi · TBC khảo sát chất lượng theo Phụ lục 2 + 16</p>'
      + '</div></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">';
    CHUAN_DAU_RA_L5.forEach(function(m){
      html += '<div style="background:white;border-radius:14px;padding:18px;text-align:center;border-top:4px solid ' + m.color + '">'
        + '<div style="font-size:2rem">' + m.ic + '</div>'
        + '<div style="font-weight:700;color:' + m.color + ';margin:8px 0;font-size:1.1rem">' + m.name + '</div>'
        + '<div style="color:#64748b;font-size:.78rem;margin-bottom:4px">Điểm TBC chỉ tiêu:</div>'
        + '<div style="color:' + m.color + ';font-weight:700;font-size:1.8rem;line-height:1">' + m.targetTBC.toFixed(1) + '</div>'
        + '<div style="color:#64748b;font-size:.74rem;margin-top:2px">/ 10 điểm</div>'
        + '</div>';
    });
    html += '</div>';
    html += '<p style="color:#92400e;font-size:.84rem;margin-top:14px;text-align:center">📈 Phase 3 sẽ kết nối với điểm số từ <a href="qlcl.html" style="color:#92400e;font-weight:600">QLCL</a> để tự tổng hợp TBC lớp 5 vs chỉ tiêu cam kết.</p>';
    html += '</div>';

    // ── Bộ Phụ lục đầy đủ 16 file (Tab 4 = trung tâm tài liệu)
    html += '<div style="background:white;border-radius:20px;padding:24px 28px;margin-bottom:20px;box-shadow:0 6px 24px rgba(0,0,0,.06)">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:6px">📚 Bộ Phụ lục Đảm bảo Chất lượng (16 file)</h3>';
    html += '<p style="color:#5a6b64;font-size:.88rem;margin-bottom:16px">Folder gốc: <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:.82rem">10. Đảm bảo chất lượng / Năm học 2025-2026 / 10.2. Phụ lục ĐBCL</code></p>';
    html += '<div class="dbcl-table-wrap"><table class="dbcl-table"><thead><tr>'
      + '<th style="width:80px;text-align:center">PL</th><th>Tên Phụ lục</th><th style="width:120px;text-align:center">Loại</th><th style="width:80px;text-align:center">Mở</th>'
      + '</tr></thead><tbody>';
    var typeMap = {data:{l:'Số liệu',c:'#0c5da5'}, standard:{l:'Chuẩn',c:'#dc2626'}, plan:{l:'Kế hoạch',c:'#16a34a'}, survey:{l:'Khảo sát',c:'#7c3aed'}, decision:{l:'Quyết định',c:'#c79a2a'}, cover:{l:'Bìa',c:'#64748b'}, budget:{l:'Kinh phí',c:'#0d9488'}, commit:{l:'Cam kết',c:'#be123c'}};
    (window.DBCL_PHULUC_RUNTIME || PHU_LUC_LIST).forEach(function(p){
      var t = typeMap[p.type] || {l:'Khác',c:'#64748b'};
      html += '<tr>'
        + '<td style="text-align:center"><span style="background:#f0fdf4;color:#16a34a;padding:4px 10px;border-radius:8px;font-weight:700;font-size:.86rem">PL ' + p.num + '</span></td>'
        + '<td>' + escapeHtml(p.name) + '</td>'
        + '<td style="text-align:center"><span style="background:' + t.c + '15;color:' + t.c + ';padding:3px 10px;border-radius:10px;font-size:.76rem;font-weight:600">' + t.l + '</span></td>'
        + '<td style="text-align:center"><button onclick="openPhuLuc(' + p.num + ')" class="leaf-link" style="border:none;cursor:pointer">📂</button></td>'
        + '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</div>';

    // ── Báo cáo định kỳ
    html += '<div style="background:white;border-radius:20px;padding:24px 28px;margin-bottom:20px;box-shadow:0 6px 24px rgba(0,0,0,.06)">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:14px">📅 Báo cáo định kỳ — 4 mốc/năm học</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">';
    [
      {ic:'1️⃣', label:'Báo cáo Học kỳ I',     when:'Cuối tháng 1', color:'#0c5da5'},
      {ic:'2️⃣', label:'Sơ kết HK1 — Triển khai HK2', when:'Đầu tháng 2', color:'#16a34a'},
      {ic:'3️⃣', label:'Báo cáo cuối năm học', when:'Cuối tháng 5', color:'#c79a2a'},
      {ic:'4️⃣', label:'Tổng kết + TĐG ĐBCL',  when:'Tháng 6',     color:'#7c3aed'}
    ].forEach(function(r){
      html += '<button disabled style="padding:18px 14px;background:white;border:2px dashed ' + r.color + ';border-radius:12px;cursor:not-allowed;text-align:center;opacity:.85">'
        + '<div style="font-size:1.6rem;margin-bottom:6px">' + r.ic + '</div>'
        + '<div style="font-weight:700;color:' + r.color + ';font-size:.92rem;line-height:1.3">' + r.label + '</div>'
        + '<div style="color:#64748b;font-size:.78rem;margin-top:4px">' + r.when + '</div>'
        + '<div style="color:#94a3b8;font-size:.72rem;margin-top:8px;font-style:italic">⏳ Phase 3</div>'
        + '</button>';
    });
    html += '</div>';
    html += '<p style="color:#94a3b8;font-size:.82rem;margin:14px 0 0;text-align:center">💡 Phase 3 sẽ build template báo cáo tự động lấy data từ QLCL + ĐBCL Sheet.</p>';
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;
  }

  /* ============================================================
     TAB 5 — KẾT NỐI HỆ THỐNG  (chức năng 12)
  ============================================================ */
  function renderTabLink(){
    var el = document.getElementById('tab-link');
    if (!el) return;
    var html = '<div style="max-width:1080px;margin:0 auto">';
    html += '<div style="background:white;border-radius:20px;padding:28px 32px;box-shadow:0 6px 24px rgba(0,0,0,.06);margin-bottom:20px">';
    html += '<h3 style="font-family:Fraunces,serif;color:#16a34a;margin-bottom:8px">🔗 Kết nối tư duy với các hệ thống khác</h3>';
    html += '<p style="color:#5a6b64;line-height:1.6;margin-bottom:20px">ĐBCL là cầu nối giữa quản lý hằng ngày (HSS/QLCL) và đánh giá định kỳ (KĐCL/Trường chuẩn QG).</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px">';
    html += _linkCard('🏅', 'Kiểm định Chất lượng', 'TĐG 7 bước · 95 minh chứng · TT 17/2018', 'linear-gradient(135deg,#a9d7f0,#2d6e9a)', 'goToKdcl()');
    html += _linkCard('📋', 'Hồ sơ số (HSS)', '108 hồ sơ · 11 nhóm · Đồng bộ Sheet/Drive', 'linear-gradient(135deg,#b8e6cc,#4a9e6e)', 'goToHss()');
    html += _linkCard('📈', 'Quản lý Chất lượng (QLCL)', 'Điểm số · Học bạ TT27 · 4 kỳ đánh giá', 'linear-gradient(135deg,#a3c5ec,#1e40af)', 'showQlcl()');
    html += _linkCard('🏆', 'Trường chuẩn Quốc gia', 'Mức 1/2 · Duy trì + Nâng chuẩn (TT 17/2018)', 'linear-gradient(135deg,#fde68a,#c79a2a)', "alert('Module Trường chuẩn QG sẽ tích hợp với KĐCL ở Phase 3')");
    html += _linkCard('🏛', 'Cải cách Hành chính', 'Văn bản · Quy trình · Số hoá thủ tục', 'linear-gradient(135deg,#fda4af,#be123c)', 'openHeThongVanBan(event)');
    html += '</div></div>';

    // Mind-map gợi ý
    html += '<div style="background:#f0fdf4;border-left:4px solid #16a34a;border-radius:14px;padding:20px 24px;color:#14532d">';
    html += '<h4 style="font-family:Fraunces,serif;margin-bottom:10px">💡 Mạch tư duy ĐBCL trong hệ thống</h4>';
    html += '<p style="line-height:1.8;margin:0;font-size:.92rem">';
    html += '<b>HSS</b> (kho dữ liệu) ⟶ <b>QLCL</b> (vận hành hằng ngày) ⟶ <b>ĐBCL</b> (kiểm soát chất lượng) ⟶ <b>KĐCL</b> (đánh giá định kỳ 5 năm) ⟶ <b>Trường chuẩn QG</b> (công nhận).<br>';
    html += 'Cải cách hành chính xuyên suốt mọi mảng — số hoá toàn bộ văn bản + quy trình.';
    html += '</p></div>';
    html += '</div>';
    el.innerHTML = html;
  }

/* ───── KHỞI ĐỘNG ───── */
loadDataShared(boot);
