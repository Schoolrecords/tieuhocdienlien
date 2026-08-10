document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('apiUrl');
  const btn = document.getElementById('save');
  const saved = document.getElementById('saved');
  const extId = document.getElementById('extId');

  extId.textContent = chrome.runtime.id;

  chrome.storage.local.get(['apiUrl'], (data) => {
    if (data.apiUrl) inp.value = data.apiUrl;
  });

  btn.addEventListener('click', () => {
    const url = inp.value.trim();
    chrome.storage.local.set({ apiUrl: url }, () => {
      saved.style.display = 'block';
      setTimeout(() => { saved.style.display = 'none'; }, 1500);
    });
  });
});
