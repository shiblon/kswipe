function registerSwipeHandler(el, handler) {
  const REST_DURATION_MS = 2 * 1000;
  const REST_CHECK_INTERVAL_MS = 100;
  const MIN_DIR_PX = 15;
  const MIN_TRIGGER_PX = document.body.clientWidth / 3;

  // States:
  // - idle: nothing is happening, not debounced, not dragging.
  // - determining: touch started, don't know direction yet
  // - dragging: touch started, not triggered yet.
  // - resting: recently triggered, waiting for debounce interval to end.
  //
  // Direction: > 0 indicates to the right, < 0 indicates to the left.
  const swipe = {
    state: 'idle',
    dragStartTime: 0,
    startX: 0,
    totalX: 0,
    direction: 0,
    restStartTime: 0,
  };

  function dirDetermined(totX) {
    return Math.abs(totX) >= MIN_DIR_PX;
  }

  el.addEventListener('touchmove', ev => {
    const touch = ev.touches[0];
    let dx = 0;
    switch (swipe.state) {
      case 'idle':
        swipe.direction = 0;
        swipe.startX = touch.clientX;
        swipe.totalX = 0;
        swipe.state = 'determining';
        swipe.dragStartTime = +new Date();
        return;
      case 'determining':
        dx = touch.clientX - swipe.startX;
        swipe.totalX += dx;
        if (Math.abs(swipe.totalX) >= MIN_DIR_PX) {
          swipe.direction = Math.sign(swipe.totalX);
          swipe.state = 'dragging';
        }
        return;
      case 'dragging':
        dx = touch.clientX - swipe.startX;
        if (Math.sign(dx) !== swipe.direction) {
          return; // Ignore slight backward movements.
        }
        swipe.totalX += dx;

        if (Math.abs(swipe.totalX) >= MIN_TRIGGER_PX) {
          swipe.state = 'resting';
          setTimeout(function checkRest() {
            if (swipe.state !== 'resting') {
              return;
            }
            const now = +new Date();
            if (now - swipe.restStartTime < REST_DURATION_MS) {
              // Not done waiting - try again.
              setTimeout(checkRest, REST_CHECK_INTERVAL_MS);
              return;
            }
            swipe.state = 'idle';
          }, REST_CHECK_INTERVAL_MS);
          swipe.restStartTime = +new Date();
          handler({
            target: el,
            direction: swipe.direction,
          });
        }

        if (swipe.direction === 0) {
          // No direction determined, yet. Definitely can't trigger.
          if (Math.abs(swipe.totalX) < MIN_DIR_PX) {
            return;
          }
          // Just figured out what direction we want to go. Set it.
          swipe.direction = Math.sign(swipe.totalX);
        }
        return;
      case 'resting':
        // If we get move events, then we start resting time over.
        swipe.restStartTime = +new Date();
        return;
      default:
        console.error('unknown swipe state', swipe.state);
        return;
    }
  });
}

const dialog = document.createElement('dialog');
dialog.id = 'swipeOverlay';
dialog.appendChild(document.createTextNode('hi there!'));
document.body.appendChild(dialog);

registerSwipeHandler(dialog, ({direction}) => {
  const reader = document.getElementById('KindleReaderIFrame');
  if (direction < 0) {
    reader.contentWindow.postMessage('next', '*');
  } else {
    reader.contentWindow.postMessage('prev', '*');
  }
});

function setEnabled(on) {
  if (on == !!dialog.open) {
    return;
  }
  if (on) {
    dialog.showModal();
    dialog.style.display = 'block';
  } else {
    dialog.close();
    dialog.style.display = 'none';
  }
}

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (sender.tab) {
    console.log("ignoring content script message:", request);
    return;
  }
  switch (request.type) {
    case "enabled":
      setEnabled(request.value);
      return;
    default:
      console.log('ignoring unknown request type:', request.type);
      return;
  }
});

chrome.storage.sync.get('enable', data => {
  setEnabled(data.enable);
});
