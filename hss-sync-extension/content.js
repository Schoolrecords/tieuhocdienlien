// ════════════════════════════════════════════════════════════════════
// content.js — HSS Sync v2 Content Script (CSDL ngành MOET)
// Inject vào https://truong.csdl.moet.gov.vn/*
// ════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── PANEL FLOATING ──────────────────────────────────────────────
  let panel = null;
  let statusEl = null;
  let logEl = null;

  function ensurePanel() {
    if (panel) return;

    panel = document.createElement('div');
    panel.id = 'hss-sync-panel';
    panel.innerHTML = `
      <div class="hss-header">
        <span class="hss-title">🏛️ HSS Sync v2</span>
        <button class="hss-toggle" title="Thu/mở">−</button>
      </div>
      <div class="hss-body">
        <div class="hss-status" id="hss-status">Sẵn sàng</div>
        <div class="hss-log" id="hss-log"></div>
      </div>
    `;
    document.body.appendChild(panel);

    statusEl = panel.querySelector('#hss-status');
    logEl = panel.querySelector('#hss-log');

    const toggle = panel.querySelector('.hss-toggle');
    toggle.addEventListener('click', () => {
      panel.classList.toggle('hss-collapsed');
      toggle.textContent = panel.classList.contains('hss-collapsed') ? '+' : '−';
    });
  }

  function log(msg, type) {
    ensurePanel();
    const line = document.createElement('div');
    line.className = 'hss-log-line hss-' + (type || 'info');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setStatus(text, type) {
    ensurePanel();
    statusEl.textContent = text;
    statusEl.className = 'hss-status hss-' + (type || 'info');
  }

  // ─── LISTENER: Nhận lệnh upload từ background ───────────────────
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action !== 'injectAndUpload') return;

    handleInjectAndUpload(msg, sendResponse);
    return true; // async
  });

  async function handleInjectAndUpload(msg, sendResponse) {
    try {
      ensurePanel();
      log(`📨 Nhận lệnh: Khối ${msg.khoi}, kỳ ${msg.ky}, ${msg.studentCount} HS`, 'info');
      setStatus('Đang upload...', 'loading');

      // ─── BƯỚC 1: Điều hướng nếu chưa ở trang import ──────────────
      const IMPORT_PATH = 'KetQuaHocTapImportExcel.aspx';
      if (!window.location.pathname.includes(IMPORT_PATH)) {
        log('⏳ Điều hướng đến trang import...', 'info');
        window.location.href =
          'https://truong.csdl.moet.gov.vn/C1/KetQuaHocTapImportExcel.aspx';
        sendResponse({ ok: false, retry: true, message: 'Đang chuyển trang...' });
        return;
      }

      // ─── BƯỚC 2: Set dropdown Khối ───────────────────────────────
      log(`⚙️ Set Khối ${msg.khoi}...`, 'info');
      const khoiSel = findSelect(['Khoi', 'khoi', 'Grade', 'grade']);
      if (khoiSel) {
        setSelectByText(khoiSel, 'Khối ' + msg.khoi);
        khoiSel.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(2000);
      }

      // ─── BƯỚC 3: Set dropdown Kỳ ─────────────────────────────────
      log(`⚙️ Set kỳ "${kyToText(msg.ky)}"...`, 'info');
      const kySel = findSelect(['Thoidiem', 'ThoiDiem', 'Period', 'thoidi']);
      if (kySel) {
        setSelectByText(kySel, kyToText(msg.ky));
        kySel.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(500);
      }

      // ─── BƯỚC 4: Tạo File từ base64 ──────────────────────────────
      log('📄 Tạo file Excel...', 'info');
      const binary = atob(msg.fileBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const file = new File([blob], msg.fileName, { type: blob.type });

      // ─── BƯỚC 5: Inject file vào input (DataTransfer) ────────────
      log('💉 Inject file vào form...', 'info');
      const fileInput = document.querySelector('input[type="file"]');
      if (!fileInput) {
        sendResponse({ ok: false, message: 'Không tìm thấy input[type=file] trên trang' });
        return;
      }

      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(800);

      // ─── BƯỚC 6: Click nút "Tải lên" ─────────────────────────────
      log('🚀 Click Tải lên...', 'info');
      const uploadBtn =
        document.querySelector('input[type="submit"]') ||
        document.querySelector('button[id*="Tai"]') ||
        document.querySelector('input[value*="Tải"]') ||
        document.querySelector('input[value*="len"]') ||
        document.querySelector('.btn-primary');

      if (!uploadBtn) {
        sendResponse({ ok: false, message: 'Không tìm thấy nút Tải lên' });
        return;
      }

      uploadBtn.click();
      log('⏳ Chờ kết quả...', 'info');
      await sleep(4000);

      // ─── BƯỚC 7: Đọc kết quả ─────────────────────────────────────
      const successEl = document.querySelector(
        '.alert-success, [class*="success"], [id*="success"], [class*="Success"]'
      );
      const errorEl = document.querySelector(
        '.alert-danger, [class*="error"], [id*="error"], [class*="Error"]'
      );

      const isOk = !!successEl && !errorEl;
      const message = isOk
        ? (successEl?.textContent?.trim() || `Upload ${msg.studentCount} HS thành công`)
        : (errorEl?.textContent?.trim() || 'Upload xong, kiểm tra kết quả trên trang');

      log(isOk ? `✅ ${message}` : `⚠️ ${message}`, isOk ? 'success' : 'warn');
      setStatus(isOk ? `✅ Xong khối ${msg.khoi}` : '⚠️ Kiểm tra kết quả', isOk ? 'success' : 'warn');

      sendResponse({ ok: isOk, message: message, khoi: msg.khoi });
    } catch (err) {
      log(`❌ Lỗi: ${err.message}`, 'error');
      setStatus('Lỗi upload', 'error');
      sendResponse({ ok: false, message: err.message });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════════════════
  function findSelect(patterns) {
    for (const p of patterns) {
      const el = document.querySelector(`select[id*="${p}"], select[name*="${p}"]`);
      if (el) return el;
    }
    return null;
  }

  function setSelectByText(sel, text) {
    const opts = Array.from(sel.options);
    const target = text.toLowerCase();
    const match = opts.find(o => {
      const t = o.text.trim().toLowerCase();
      return t.includes(target) || target.includes(t);
    });
    if (match) {
      sel.value = match.value;
      return true;
    }
    return false;
  }

  function kyToText(ky) {
    return {
      gk1: 'Giữa học kỳ 1',
      ck1: 'Cuối học kỳ 1',
      gk2: 'Giữa học kỳ 2',
      cn:  'Cuối năm học'
    }[ky] || ky;
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // ─── Khởi tạo panel khi trang load xong ─────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensurePanel);
  } else {
    ensurePanel();
  }
})();
