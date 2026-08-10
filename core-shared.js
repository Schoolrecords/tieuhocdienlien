/*
============================================================================
 core-shared.js — Module dùng chung cho 3 trang Quản trị số
============================================================================
 Tách từ app.js (Refactor 2026-05-12 · Bước 1b của kế hoạch tách 4 file).

 File này được LOAD TRƯỚC `hss-app.js / kdcl-app.js / dbcl-app.js`
 trong cả 3 trang HTML (index.html, kdcl.html, dbcl.html).

 Chứa:
   • AUTH 2 cấp (SSO + legacy AUTH_TOKEN) — toàn bộ block từ app.js dòng 27-282
   • Utils nhỏ: toggleMenu, escapeHtml, initials, countLeaves, _safeCell
   • [TODO Bước 1c] Data layer: fetchGAS, loadData + cache 5-10 phút
   • [TODO Bước 1c] Cross-page nav: goToHss / goToKdcl / goToDbcl

 KHÔNG chứa:
   • IIFE Early Fetch (chạy ngay trong <head> của mỗi trang HTML)
   • const API_URL — mỗi trang giữ inline (hoặc đưa vào file riêng `config.js`)
   • Render UI (mỗi trang có file riêng)

 Phụ thuộc:
   • Markup #authGate phải có sẵn trong DOM của mỗi trang HTML
     (sẽ được inject động ở Bước 1c để 3 trang khỏi copy markup)

 Khi sửa file này:
   1. Sửa file này
   2. Bump query string trong cả 3 file HTML (?v=YYYYMMDD)
   3. Test ít nhất 3 luồng: login GV, login Admin, đăng xuất
============================================================================
*/

/* ───────────────────────────────────────────────────────────────────────
   PHẦN 1 · AUTH 2 CẤP — Mã GV (sửa điểm) + Mã Admin (Admin panel + KĐCL)
   ───────────────────────────────────────────────────────────────────────
   Trang KHÔNG hỏi mã ngay từ đầu. Khách/phụ huynh/đoàn KT xem tự do.
   Modal chỉ hiện khi cán bộ click vào "phòng khoá" (sửa điểm/Admin/KĐCL).
   Mã được lưu trên localStorage máy/điện thoại — lần sau khỏi nhập lại.

   Phân loại action theo cấp:
     • _GV_WRITE_ACTIONS    — sửa điểm/nhận xét/NLPC/xếp loại/vi phạm/hoạt động
     • _ADMIN_WRITE_ACTIONS — phân công, import HS/GV, cấu hình, KĐCL/TĐG
     (action không thuộc 2 list trên = read-only, không cần mã)
   ─────────────────────────────────────────────────────────────────────── */

  var _GV_WRITE_ACTIONS = [
    'qlclSaveDiem','qlclSaveNhanXet','qlclSaveNLPC','qlclSaveXepLoai','qlclSaveDiemDanh',
    'qlclSaveViPham','qlclDeleteViPham','qlclSaveHoatDong','qlclDeleteHoatDong',
    // ⭐ studentsAuthed là action ĐỌC nhưng cần xác thực (đọc field nhạy cảm SĐT/cha/mẹ).
    // Đưa vào đây để FE auth-gate hỏi mã GV trước khi gọi (Nghị định 13/2023).
    'studentsAuthed'
  ];
  var _ADMIN_WRITE_ACTIONS = [
    'updateHSS','updateMinhChung','resetMinhChungSeed',
    'importTeachers','importStudents','updateConfig',
    'qlclSavePhanCong','saveHssStatus',
    'saveReport','deleteReport'
  ];
  function _authLevelForAction(action){
    if (_ADMIN_WRITE_ACTIONS.indexOf(action) >= 0) return 'admin';
    if (_GV_WRITE_ACTIONS.indexOf(action) >= 0)    return 'gv';
    return null; // read-only / không cần auth
  }

  // ─────────────────────────────────────────────────────────────────────
  // ⭐ AUTH 2026-05-07: SSO 1 lần qua tab Users (cùng key `_cu` với QLCL)
  //   • CU = {sessionToken, username, hoten, role, lop, phan_cong}
  //   • Backwards-compat: AUTH_TOKEN cũ vẫn dùng được trong 1 tuần
  //   • _hasLevel ưu tiên CU; chỉ fallback AUTH_TOKEN nếu chưa login SSO
  // ─────────────────────────────────────────────────────────────────────
  function getCU(){
    try { var s = localStorage.getItem('_cu'); return s ? JSON.parse(s) : null; }
    catch(e){ return null; }
  }
  function setCU(obj){
    try {
      if (obj) localStorage.setItem('_cu', JSON.stringify(obj));
      else localStorage.removeItem('_cu');
    } catch(e){ console.error('Lỗi lưu CU:', e); }
  }
  // Map role tự do (admin/Hiệu trưởng/GVCN/teacher/GV …) → 'admin' | 'gv' | ''
  function _cuLevel(cu){
    if (!cu || !cu.sessionToken) return '';
    var raw = String(cu.role || '');
    var lower = raw.toLowerCase();
    if (lower === 'admin' || raw === 'Hiệu trưởng' || lower === 'hieu truong') return 'admin';
    if (lower === 'gvcn' || lower === 'teacher' || lower === 'gv' || lower.indexOf('gv ') === 0) return 'gv';
    return '';
  }

  // Legacy AUTH_TOKEN — giữ tạm 1 tuần để backwards-compat
  function getAuthToken(){
    try { return localStorage.getItem('AUTH_TOKEN') || ''; } catch(e){ return ''; }
  }
  function getAuthLevel(){
    try { return (localStorage.getItem('AUTH_LEVEL')||'').toLowerCase(); } catch(e){ return ''; }
  }
  function _saveAuthToken(tok){
    try {
      if (tok) localStorage.setItem('AUTH_TOKEN', String(tok));
      else localStorage.removeItem('AUTH_TOKEN');
    } catch(e){ console.error('Lỗi lưu mã:', e); }
  }
  function _saveAuthLevel(lvl){
    try {
      if (lvl) localStorage.setItem('AUTH_LEVEL', String(lvl));
      else localStorage.removeItem('AUTH_LEVEL');
    } catch(e){}
  }

  // Mức hiện có có đủ cho yêu cầu (admin > gv) không?
  function _hasLevel(needLevel){
    // Ưu tiên SSO mới
    var cuLvl = _cuLevel(getCU());
    if (cuLvl) {
      return (needLevel === 'gv') ? (cuLvl === 'gv' || cuLvl === 'admin') : (cuLvl === 'admin');
    }
    // Fallback AUTH_TOKEN cũ
    var lvl = getAuthLevel();
    if (!lvl || !getAuthToken()) return false;
    return (needLevel === 'gv') ? (lvl === 'gv' || lvl === 'admin') : (lvl === 'admin');
  }
  // Tiện ích cho dev (gõ trên Console nếu cần)
  window.setAuthToken = function(tok, lvl){
    _saveAuthToken(tok); _saveAuthLevel(lvl||'gv');
    console.log('[AUTH] Đã lưu (legacy). Level=' + (lvl||'gv') + '. Reload để áp dụng.');
  };
  // Đăng xuất: xoá cả CU (SSO mới) và AUTH_TOKEN (legacy) rồi reload
  window.logoutSchool = function(){
    if (confirm('Đăng xuất khỏi khu vực cán bộ?')) {
      setCU(null);
      _saveAuthToken(''); _saveAuthLevel('');
      location.reload();
    }
  };

  // ====================================================================
  // 🚪 MODAL ĐĂNG NHẬP 2 CẤP
  //   requireAuth(needLevel, callback) — đảm bảo có mã đủ quyền rồi gọi callback
  //   _authForAction(action) → Promise — dùng trong wrapper fetch (callGAS,...)
  // ====================================================================
  var _authNeedLevel = 'gv';        // cấp đang yêu cầu cho lần show modal hiện tại
  var _authOnSuccess = null;        // callback chạy sau khi auth thành công
  var _authOnCancel  = null;        // callback chạy khi user nhấn Hủy

  function _setAuthGateUI(needLevel){
    var emoji  = document.getElementById('authEmoji');
    var title  = document.getElementById('authTitle');
    var sub    = document.getElementById('authSub');
    var labelU = document.getElementById('authLabel');
    var inpU   = document.getElementById('authInput');
    var labelP = document.getElementById('authLabelPwd');
    var inpP   = document.getElementById('authPassword');
    var hint   = document.getElementById('authHint');
    if (needLevel === 'admin') {
      if (emoji) emoji.textContent = '🛡️';
      if (title) title.textContent = 'Đăng nhập Admin';
      if (sub)   sub.innerHTML = 'Dành cho Hiệu trưởng / Phó hiệu trưởng.';
    } else {
      if (emoji) emoji.textContent = '🔑';
      if (title) title.textContent = 'Đăng nhập giáo viên';
      if (sub)   sub.innerHTML = 'Để sửa điểm / nhận xét / xếp loại.';
    }
    // ⭐ SSO mới: 2 ô tên đăng nhập + mật khẩu (cùng giao diện cho cả GV & Admin)
    if (labelU) { labelU.textContent = 'Tên đăng nhập'; labelU.style.display = ''; }
    if (inpU)   { inpU.placeholder = 'Nhập tên đăng nhập'; inpU.type = 'text'; inpU.setAttribute('autocomplete','off'); inpU.setAttribute('autocapitalize','off'); inpU.setAttribute('autocorrect','off'); inpU.setAttribute('spellcheck','false'); }
    if (labelP) { labelP.textContent = 'Mật khẩu'; labelP.style.display = ''; }
    if (inpP)   { inpP.style.display = ''; inpP.value = ''; }
    if (hint)   {
      hint.innerHTML = '💡 Tài khoản do <b>Admin</b> cấp. Mỗi máy chỉ cần đăng nhập <b>một lần</b>. Quên mật khẩu liên hệ Hiệu trưởng/PHT qua Zalo.';
      hint.style.display = '';
    }
  }
  function _showAuthGate(needLevel, onSuccess, onCancel){
    _authNeedLevel = needLevel || 'gv';
    _authOnSuccess = onSuccess || null;
    _authOnCancel  = onCancel  || null;
    _setAuthGateUI(_authNeedLevel);
    var g = document.getElementById('authGate');
    if (g) {
      g.classList.remove('is-hidden');
      setTimeout(function(){
        var i = document.getElementById('authInput');
        if (i) { i.value=''; i.focus(); }
      }, 50);
    }
    var msg = document.getElementById('authMsg');
    if (msg) { msg.className = 'auth-msg'; msg.textContent = ''; }
  }
  function _hideAuthGate(){
    var g = document.getElementById('authGate');
    if (g) g.classList.add('is-hidden');
  }
  // Cho khách bấm "Hủy" → trở về trang public, không vào phòng khoá nữa
  window.cancelAuthGate = function(){
    var cb = _authOnCancel;
    _authOnSuccess = null; _authOnCancel = null;
    _hideAuthGate();
    if (cb) try { cb(); } catch(e){ console.error(e); }
  };
  // requireAuth(needLevel, callback[, onCancel]) — mở khoá rồi chạy callback
  window.requireAuth = function(needLevel, callback, onCancel){
    needLevel = needLevel || 'gv';
    if (_hasLevel(needLevel)) { callback && callback(); return; }
    _showAuthGate(needLevel, callback, onCancel);
  };
  // Promise dùng trong wrapper fetch — resolve khi đã có mã đủ quyền cho action
  window._authForAction = function(action){
    return new Promise(function(resolve, reject){
      var lvl = _authLevelForAction(action);
      if (!lvl) { resolve(); return; }            // read-only
      if (_hasLevel(lvl)) { resolve(); return; }  // đã có sẵn
      _showAuthGate(lvl, function(){ resolve(); }, function(){ reject(new Error('AUTH_CANCELED')); });
    });
  };

  // ⭐ SSO 2026-05-07: đăng nhập username/password qua tab Users.
  //    Backend trả {ok, sessionToken, user:{username,hoten,role,lop,phan_cong}}
  //    FE lưu vào localStorage._cu (cùng key với QLCL → 1 lần login dùng cả 2 module).
  function submitAuthForm(ev){
    if (ev && ev.preventDefault) ev.preventDefault();
    var inpU = document.getElementById('authInput');
    var inpP = document.getElementById('authPassword');
    var btn  = document.getElementById('authBtn');
    var msg  = document.getElementById('authMsg');
    var u = (inpU.value || '').trim();
    var p = (inpP && inpP.value) ? inpP.value : '';
    if (!u || !p) {
      msg.className = 'auth-msg err';
      msg.textContent = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
      return false;
    }
    if (typeof API_URL !== 'string' || !API_URL) {
      msg.className = 'auth-msg err';
      msg.textContent = 'Chưa cấu hình backend. Liên hệ Hiệu trưởng.';
      return false;
    }
    btn.disabled = true; btn.textContent = '⏳ Đang kiểm tra…';
    msg.className = 'auth-msg'; msg.textContent = '';
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', username: u, password: p }),
      redirect: 'follow'
    }).then(function(r){ return r.text(); }).then(function(t){
      var res = null; try { res = JSON.parse(t); } catch(e){}
      btn.disabled = false; btn.textContent = 'Vào';
      if (res && res.ok && res.sessionToken && res.user) {
        var cu = {
          sessionToken: res.sessionToken,
          username: res.user.username,
          hoten: res.user.hoten || res.user.username,
          role: res.user.role || 'gv',
          lop: res.user.lop || '',
          phan_cong: res.user.phan_cong || ''
        };
        var lvl = _cuLevel(cu);
        // Tài khoản đúng nhưng KHÔNG đủ quyền cho khu vực đang vào
        if (_authNeedLevel === 'admin' && lvl !== 'admin') {
          msg.className = 'auth-msg err';
          msg.textContent = '⛔ Tài khoản này không có quyền Admin. Cần Hiệu trưởng/Phó HT.';
          try { inpP.value = ''; inpP.focus(); } catch(e){}
          return;
        }
        if (!lvl) {
          msg.className = 'auth-msg err';
          msg.textContent = '⛔ Tài khoản không có quyền sử dụng chức năng này.';
          return;
        }
        // Lưu CU + clear AUTH_TOKEN cũ (đã chuyển sang SSO)
        setCU(cu);
        _saveAuthToken(''); _saveAuthLevel('');
        msg.className = 'auth-msg ok';
        msg.textContent = '✅ Xin chào ' + cu.hoten + '. Đang vào…';
        var cb = _authOnSuccess;
        _authOnSuccess = null; _authOnCancel = null;
        setTimeout(function(){
          _hideAuthGate();
          if (cb) try { cb(); } catch(e){ console.error(e); }
        }, 500);
      } else {
        msg.className = 'auth-msg err';
        msg.textContent = (res && res.error) ? res.error : '❌ Đăng nhập thất bại. Vui lòng thử lại.';
        try { inpP.value = ''; inpP.focus(); } catch(e){}
      }
    }).catch(function(err){
      btn.disabled = false; btn.textContent = 'Vào';
      msg.className = 'auth-msg err';
      msg.textContent = '❌ Mất kết nối backend. Kiểm tra mạng hoặc liên hệ Hiệu trưởng.';
    });
    return false;
  }
  // ⛔ KHÔNG còn auto-show modal khi vào trang. Trang public mở thẳng cho khách xem.

/* ───────────────────────────────────────────────────────────────────────
   PHẦN 2 · UTILS NHỎ — escapeHtml, initials, toggleMenu, countLeaves, _safeCell
   ─────────────────────────────────────────────────────────────────────── */

  function toggleMenu(){
    document.getElementById('mobileMenu').classList.toggle('open');
    document.getElementById('backdrop').classList.toggle('open');
  }

  function initials(name){
    const p = String(name||'').trim().split(/\s+/);
    const first = (p[0] && p[0][0]) || '';
    const last = (p[p.length-1] && p[p.length-1][0]) || '';
    return (first + last).toUpperCase();
  }
  function escapeHtml(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }
  function countLeaves(nodes){
    let t=0,f=0;
    nodes.forEach(n => {
      if(n.leaf){ t++; if(n.has) f++; }
      else if(n.children){ const x = countLeaves(n.children); t+=x.t; f+=x.f; }
    });
    return {t:t, f:f};
  }
  // 2026-05-09: ⭐ _safeCell — bao bọc các giá trị string nhận từ backend
  //      (đặc biệt cột "Đơn vị ban hành" có thể là Date object → cần ép về string)
  //      và convert về "dd/MM/yyyy". Đồng thời bắt chuỗi ISO "2026-05-01T..."
  function _safeCell(v){
    if (v === null || v === undefined) return '';
    const s = String(v).trim();
    if (!s) return '';
    const m1 = /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4}/.test(s);
    const m2 = /^\d{4}-\d{2}-\d{2}T/.test(s);
    if (m1 || m2){
      const d = new Date(s);
      if (!isNaN(d)){
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        return dd+'/'+mm+'/'+d.getFullYear();
      }
    }
    return s;
  }

/* ───────────────────────────────────────────────────────────────────────
   PHẦN 3 · DATA LAYER — fetchGAS + loadData + cache (3 trang dùng chung)
   ───────────────────────────────────────────────────────────────────────
   Bóc từ app.js (lines 2474-2579) — Refactor 2026-05-12 · Bước 1c.
   Logic giữ nguyên 1:1 để không phá tương thích. Khác biệt duy nhất:
     • `loadData(bootCallback)` nhận callback boot từ trang cụ thể
       (vì hàm `boot()` chứa render UI riêng của mỗi trang HSS/KĐCL/ĐBCL)
     • `CACHE_KEY = 'thMau_data'` giữ nguyên → 3 trang cùng đọc/ghi 1 cache
       → không gọi API GAS trùng giữa các trang
   Yêu cầu DOM:
     • #loadScreen — trong markup HTML để hiển thị màn loading/lỗi
   Yêu cầu globals (mỗi trang HTML phải khai báo trước khi load file này):
     • const API_URL = 'https://script.google.com/macros/s/.../exec';
     • Đoạn IIFE Early Fetch trong <head> ghi `window.__earlyData`
   ─────────────────────────────────────────────────────────────────────── */

  // ⭐ CACHE giữ nguyên key cũ 'thMau_data' — backwards-compat với localStorage
  // mà người dùng đã có sẵn từ phiên bản cũ (không phải xoá dữ liệu).
  const CACHE_KEY = 'thMau_data';
  const CACHE_TTL = 10 * 60 * 1000; // 10 phút (giữ để tương lai có thể bật check TTL)

  function loadError(msg){
    const ls = document.getElementById('loadScreen');
    if(!ls) return;
    // TEMPLATE MODE: khi chưa cấu hình API → cho phép bỏ qua để vào Admin cấu hình
    const isTemplate = String(msg||'').includes('Chưa cấu hình');
    const extraBtn = isTemplate
      ? `<button class="btn btn-ghost" style="margin-left:10px;background:rgba(255,255,255,.18);color:white;border:1px solid rgba(255,255,255,.35)" onclick="(function(){ const ls=document.getElementById('loadScreen'); if(ls){ls.classList.add('done');setTimeout(()=>ls.remove(),500);} if(typeof boot==='function'){ boot({hss:[],teachers:[],students:[],classes:[],images:[],minhchung:[],stats:{totalRecords:0,totalTeachers:0,totalClasses:0,totalChildren:0,config:{}}}, false); } setTimeout(function(){ if(typeof openAdmin==='function') openAdmin(); var t=document.querySelector('.admin-tab[data-tab=\\'info\\']'); if(t) t.click(); }, 400); })()">⚙ Vào Admin cấu hình</button>`
      : '';
    ls.innerHTML = `
      <div style="text-align:center;padding:40px;max-width:560px">
        <div style="font-size:3rem;margin-bottom:20px">${isTemplate ? '🧩' : '⚠️'}</div>
        <h3 style="font-family:Fraunces,serif;margin-bottom:12px">${isTemplate ? 'Template chưa cấu hình' : 'Không tải được dữ liệu'}</h3>
        <p style="opacity:.9;margin-bottom:8px;font-size:.95rem">${escapeHtml(msg)}</p>
        <p style="opacity:.7;font-size:.82rem;margin-bottom:20px">${isTemplate ? 'Bấm "Vào Admin cấu hình" để nhập URL Apps Script + thông tin trường, hoặc xem <b>backend/HUONG_DAN_CAI_DAT.md</b> để cài đặt backend.' : 'Kiểm tra lại URL API và quyền truy cập "Anyone" của Web App.'}</p>
        <button class="btn btn-primary" onclick="location.reload()">Thử lại</button>
        ${extraBtn}
      </div>`;
  }

  // JSONP fetch với retry tự động
  function fetchGAS(onOk, onFail, retries){
    retries = retries == null ? 2 : retries;
    const url = window._admApiOverride || API_URL;
    if(!url || url.indexOf('AKfyc') === -1){
      onFail('Chưa cấu hình API_URL.'); return;
    }
    const cbName = 'jsonpCb_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      cleanup();
      if(retries > 0){ fetchGAS(onOk, onFail, retries - 1); }
      else { onFail('Quá hạn chờ phản hồi từ máy chủ (đã thử ' + (3 - retries) + ' lần).'); }
    }, 20000);

    function cleanup(){ clearTimeout(timer); delete window[cbName]; try{ script.remove(); } catch(e){} }

    window[cbName] = function(resp){
      cleanup();
      if(resp && resp.ok){ onOk(resp.data); }
      else if(retries > 0){ fetchGAS(onOk, onFail, retries - 1); }
      else { onFail(resp && resp.error ? resp.error : 'Phản hồi không hợp lệ.'); }
    };
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cbName + '&action=all';
    script.onerror = function(){
      cleanup();
      if(retries > 0){ fetchGAS(onOk, onFail, retries - 1); }
      else { onFail('Không gọi được API. Kiểm tra URL hoặc quyền triển khai.'); }
    };
    document.body.appendChild(script);
  }

  // Khởi động: ưu tiên cache → hiển thị ngay → refresh ngầm.
  // Mỗi trang truyền vào hàm boot riêng (vì boot có render UI khác nhau).
  // Hàm boot phải có chữ ký: boot(data, isCache) — giữ chữ ký gốc của app.js.
  function loadDataShared(bootCallback){
    const boot = bootCallback;
    if (typeof boot !== 'function') {
      console.error('[core-shared] loadDataShared cần bootCallback!');
      return;
    }
    // 1) Ưu tiên dữ liệu từ early-fetch <head> (đã về xong trước khi main script chạy)
    if(window.__earlyData && window.__earlyData.ok){
      const data = window.__earlyData.data;
      try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: data})); } catch(e){}
      boot(data, false);
      window.__earlyData = null;
      return;
    }

    // 2) Dùng cache localStorage nếu có (hiển thị ngay + refresh ngầm)
    try{
      const raw = localStorage.getItem(CACHE_KEY);
      if(raw){
        const cache = JSON.parse(raw);
        if(cache && cache.d){
          boot(cache.d, true);
          // Khi early-fetch xong sau khi boot, nuốt kết quả vào cache
          const poll = setInterval(() => {
            if(window.__earlyData && window.__earlyData.ok){
              clearInterval(poll);
              try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: window.__earlyData.data})); } catch(e){}
              window.__earlyData = null;
            } else if(window.__earlyFailed){ clearInterval(poll); }
          }, 500);
          setTimeout(() => clearInterval(poll), 30000);
          return;
        }
      }
    } catch(e){ try{ localStorage.removeItem(CACHE_KEY); } catch(x){} }

    // 3) Không có cache, early-fetch chưa về → chờ early-fetch (check 200ms một lần) rồi fallback
    let waited = 0;
    const waitEarly = setInterval(() => {
      waited += 200;
      if(window.__earlyData && window.__earlyData.ok){
        clearInterval(waitEarly);
        const data = window.__earlyData.data;
        try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: data})); } catch(e){}
        boot(data, false);
        window.__earlyData = null;
      } else if(window.__earlyFailed || waited >= 8000){
        clearInterval(waitEarly);
        // Fallback về fetchGAS truyền thống
        fetchGAS(
          function(data){
            try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ts: Date.now(), d: data})); } catch(e){}
            boot(data, false);
          },
          function(msg){ loadError(msg); }
        );
      }
    }, 200);
  }

  // Helper xoá cache (dùng khi Admin import dữ liệu mới, đổi config…)
  function invalidateDataCache(){
    try { localStorage.removeItem(CACHE_KEY); } catch(e){}
  }

/* ───────────────────────────────────────────────────────────────────────
   PHẦN 4 · CROSS-PAGE NAVIGATION — Điều hướng giữa 4 trang
   ───────────────────────────────────────────────────────────────────────
   Dùng trong nav header chung của 4 trang HTML:
     <a onclick="goToHss()">Hồ sơ số</a>
     <a onclick="goToKdcl()">Kiểm định CL</a>
     <a onclick="goToDbcl()">Đảm bảo CL</a>
     <a onclick="goToQlcl()">Quản lý CL</a>
   ─────────────────────────────────────────────────────────────────────── */

  window.goToHss  = function(ev){ if(ev && ev.preventDefault) ev.preventDefault(); window.location.href = 'index.html'; return false; };
  window.goToKdcl = function(ev){ if(ev && ev.preventDefault) ev.preventDefault(); window.location.href = 'kdcl.html';  return false; };
  window.goToDbcl = function(ev){ if(ev && ev.preventDefault) ev.preventDefault(); window.location.href = 'dbcl.html';  return false; };

  // QLCL có thêm bước sync auth state để qlcl-app.js không phải đăng nhập lại.
  // Bóc nguyên từ app.js:4221 (showQlcl). Giữ tên cũ `showQlcl` cho backwards-compat
  // với các onclick="showQlcl(event)" hiện có trong index.html / qlcl.html.
  window.showQlcl = function(ev){
    if(ev && ev.preventDefault) ev.preventDefault();
    // STATE của HSS không expose lên window → field user/role mặc định ''/'GV'.
    // qlcl-app.js sẽ tự đọc lại từ tab Users qua sessionToken.
    try {
      var auth = {
        user:  (typeof STATE !== 'undefined' && STATE.user) ? STATE.user : '',
        role:  (typeof STATE !== 'undefined' && STATE.role) ? STATE.role : 'GV',
        lop:   (typeof STATE !== 'undefined' && STATE.classRoleLop) ? STATE.classRoleLop : '',
        token: (typeof getAuthToken === 'function') ? (getAuthToken() || '') : '',
        hoten: (typeof STATE !== 'undefined' && STATE.user) ? STATE.user : '',
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('th_auth_v1', JSON.stringify(auth));
    } catch(e) { console.warn('[QLCL] Không sync được auth state:', e); }
    window.location.href = 'qlcl.html';
    return false;
  };
  window.goToQlcl = window.showQlcl; // alias mới, cùng hành vi

  // ✅ core-shared.js loaded (debug)
  if (typeof window !== 'undefined') {
    window.__CORE_SHARED_LOADED__ = '2026-05-12';
  }
