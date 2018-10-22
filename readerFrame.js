function waitForReady(checker) {
  triesLeft = 1000;
  return new Promise((resolve, reject) => {
    setTimeout(function check() {
      triesLeft--;
      if (triesLeft < 0) {
        reject('waitForReady timed out');
        return;
      }
      if (!checker()) {
        setTimeout(check, 50);
        return;
      }
      resolve();
    }, 50);
  });
}

const PREV_ID = 'kindleReader_pageTurnAreaLeft';
const NEXT_ID = 'kindleReader_pageTurnAreaRight';

waitForReady(() => document.getElementById(PREV_ID) != null)
.then(() => {
  const prev = document.getElementById(PREV_ID);
  const next = document.getElementById(NEXT_ID);

  window.addEventListener('message', evMsg => {
    switch (evMsg.data) {
      case 'next':
        console.log('next page');
        next.dispatchEvent(new Event('click'));
        break;
      case 'prev':
        prev.dispatchEvent(new Event('click'));
        console.log('prev page');
        break;
      default:
        console.error('unknown message data received:', evMsg.data);
        break;
    }
  });
})
.catch(err => {
  console.log('document never ready:', err)
});
