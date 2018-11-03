const elEnable = document.getElementById('on');
elEnable.addEventListener('click', evt => {
  const on = !evt.target.classList.contains('on');
  setOn(on);
  chrome.storage.sync.set({on: on});
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'on', value: on});
  });
  window.close(); // dismiss the popup
});

function setOn(on) {
  const elEnable = document.getElementById('on');
  if (on) {
    elEnable.classList.add('on');
    elEnable.innerText = 'KSwipe On';
  } else {
    elEnable.classList.remove('on');
    elEnable.innerText = 'KSwipe Off';
  }
}

chrome.storage.onChanged.addListener((keyvals, storageType) => {
  if (keyvals.on) {
    setOn(keyvals.on.newValue);
  }
});

chrome.storage.sync.get('on', data => {
  setOn(data.on);
});
