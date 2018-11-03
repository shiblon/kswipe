const elEnable = document.getElementById('enableBtn');
// Sets whether the extension works at all.
elEnable.addEventListener('click', evt => {
  const on = !evt.target.classList.contains('on');
  setEnabled(on);
  window.close(); // dismiss the popup
});

function setEnabled(on) {
  const elEnable = document.getElementById('enableBtn');
  chrome.storage.sync.set({enabled: on});
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'enabled', value: on});
  });
  if (on) {
    elEnable.classList.add('on');
    elEnable.innerText = 'KSwipe Enabled';
  } else {
    elEnable.classList.remove('on');
    elEnable.innerText = 'KSwipe Disabled';
  }
}

chrome.storage.onChanged.addListener((keyvals, storageType) => {
  if (keyvals.enabled) {
    setEnabled(keyvals.enabled.newValue);
  }
});

chrome.storage.sync.get('enabled', data => {
  setEnabled(data.enabled);
});
