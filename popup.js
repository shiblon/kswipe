function setEnabled(on) {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: "enabled", value: on});
  });
}

const elEnable = document.getElementById("enable");
elEnable.addEventListener('change', () => {
  chrome.storage.sync.set({enable: elEnable.checked});
  setEnabled(elEnable.checked);
});
chrome.storage.sync.get('enable', data => {
  elEnable.checked = data.enable;
  setEnabled(data.enable);
});
