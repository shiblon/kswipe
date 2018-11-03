function waitForReady(seconds, checker) {
  const _READY_CHECK_MS = 50

  triesLeft = Math.ceil(seconds * 1000 / _READY_CHECK_MS);
  return new Promise((resolve, reject) => {
    setTimeout(function check() {
      triesLeft--;
      if (triesLeft < 0) {
        reject('waitForReady timed out');
        return;
      }
      if (!checker()) {
        setTimeout(check, _READY_CHECK_MS);
        return;
      }
      resolve();
    }, _READY_CHECK_MS);
  });
}

const _PREV_ID = 'kindleReader_pageTurnAreaLeft';
const _NEXT_ID = 'kindleReader_pageTurnAreaRight';
const _READY_SECS = 30

waitForReady(_READY_SECS, () => document.getElementById(_PREV_ID) != null)
.then(() => {
  const prev = document.getElementById(_PREV_ID);
  const next = document.getElementById(_NEXT_ID);

  window.addEventListener('message', evMsg => {
    switch (evMsg.data) {
      case 'next':
        next.dispatchEvent(new Event('click'));
        break;
      case 'prev':
        prev.dispatchEvent(new Event('click'));
        break;
      default:
        console.error('unknown frame message:', evMsg.data);
        break;
    }
  });
})
.catch(err => {
  console.log('document never ready:', err)
});
