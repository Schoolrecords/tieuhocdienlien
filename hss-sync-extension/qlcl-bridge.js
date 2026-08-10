// ════════════════════════════════════════════════════════════════════
// qlcl-bridge.js — chạy trên trang QLCL (schoolrecords.github.io)
// Tự động gửi Extension ID + version cho QLCL qua window.postMessage
// QLCL sẽ lưu vào localStorage, không cần user copy/paste.
// ════════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const EXT_ID = chrome.runtime.id;
  const EXT_VERSION = chrome.runtime.getManifest().version;

  function announce() {
    window.postMessage({
      source: 'hss-sync-extension',
      type: 'HSS_EXT_ANNOUNCE',
      id: EXT_ID,
      version: EXT_VERSION
    }, '*');
  }

  // Phát ngay lúc trang vừa load (chạy ở document_start)
  announce();

  // Phát lại sau khi DOM ready (phòng trường hợp QLCL chưa kịp gắn listener)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', announce);
  } else {
    setTimeout(announce, 200);
  }

  // QLCL có thể chủ động hỏi: nhận message HSS_EXT_REQUEST → trả lời
  window.addEventListener('message', (e) => {
    if (e.source !== window) return;
    if (e.data && e.data.source === 'hss-sync-qlcl' && e.data.type === 'HSS_EXT_REQUEST') {
      announce();
    }
  });
})();
