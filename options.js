function constructOptions() {
  // TODO: this option is meaningless.
  let chEl = document.getElementById('canReverse');
  chEl.addEventListener('change', () => {
    chrome.storage.sync.set({canReverse: chEl.checked});
  });
  chrome.storage.sync.get('canReverse', data => {
    chEl.checked = !!data.canReverse;
  });
}

constructOptions();

