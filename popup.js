const elEnable = document.getElementById("enable");

function setEnabled(on) {
  if (on) {
    elEnable.classList.add('on');
    elEnable.innerText = 'KSwipe On';
  } else {
    elEnable.classList.remove('on');
    elEnable.innerText = 'KSwipe Off';
  }
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: "enabled", value: on});
  });
}

elEnable.addEventListener('click', () => {
  const on = elEnable.classList.contains('on');
  chrome.storage.sync.set({enable: !on});
  setEnabled(!on);
});
chrome.storage.sync.get('enable', data => {
  setEnabled(data.enable);
});
