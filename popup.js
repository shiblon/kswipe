const elEnable = document.getElementById("enable");
elEnable.addEventListener('click', evt => {
  const on = !evt.target.classList.contains('on');
  setEnabled(on);
  chrome.storage.local.set({enable: on});
  /*
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: "enabled", value: on});
  });
  */
  window.close(); // dismiss the popup
});

function setEnabled(on) {
  const elEnable = document.getElementById('enable');
  if (on) {
    elEnable.classList.add('on');
    elEnable.innerText = 'KSwipe On';
  } else {
    elEnable.classList.remove('on');
    elEnable.innerText = 'KSwipe Off';
  }
}

chrome.storage.onChanged.addListener((keyvals, storageType) => {
  if (keyvals.enable) {
    setEnabled(keyvals.enable.newValue);
  }
});

chrome.storage.local.get('enable', data => {
  setEnabled(data.enable);
});
