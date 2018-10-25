"strict";

function registerSwipeHandler(el, handler) {
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

  function dirMatchesOriginatingSide(dir, x) {
    const w = document.body.clientWidth;
    // A positive direction needs to start on the left third
    // of the screen. A negative direction needs to start on the
    // right third of the screen.
    return (x < w/3 && dir > 0) || (x > 2*w/3 && dir < 0);
  }

  el.addEventListener('touchmove', ev => {
    const MIN_TRIGGER_PX = document.body.clientWidth / 4;
    const MIN_DIR_PX = 50;
    const REST_DURATION_MS = 2 * 1000;
    const REST_CHECK_INTERVAL_MS = 50;

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
        // If we've moved a minimum number of pixels, check
        // that the motion originated from the appropriate
        // part of the screen. Otherwise ignore and go back
        // to idle.
        if (Math.abs(swipe.totalX) >= MIN_DIR_PX) {
          swipe.direction = Math.sign(swipe.totalX);
          swipe.state = dirMatchesOriginatingSide(swipe.direction, touch.clientX) ? 'dragging' : 'idle';
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
        // If we get move events while resting, we start the resting
        // time over. Resting can only end when we get no touch move
        // events for a specified period of time.
        // This gives the user time to haltingly move fingers and
        // hands off of the screen.
        swipe.restStartTime = +new Date();
        return;
      default:
        console.error('unknown swipe state', swipe.state);
        return;
    }
  });
}

function goNext() {
  const reader = document.getElementById('KindleReaderIFrame');
  reader.contentWindow.postMessage('next', '*');
}

function goPrev() {
  const reader = document.getElementById('KindleReaderIFrame');
  reader.contentWindow.postMessage('prev', '*');
}

function showOverlay() {
  if (document.querySelector('#swipeOverlay')) {
    console.error('swipe overlay already on');
    return;
  }
  const overlay = document.createElement('div');
  overlay.id = 'swipeOverlay';
  const exitButton = document.createElement('button');
  exitButton.id = 'exitBtn';
  exitButton.appendChild(document.createTextNode('Exit KSwipe'));
  exitButton.addEventListener('click', () => {
    setEnabled(false);
  });
  const prevButton = document.createElement('button');
  prevButton.classList.add('navBtn');
  prevButton.appendChild(document.createTextNode('Prev'));
  prevButton.addEventListener('click', goPrev);
  const nextButton = document.createElement('button');
  nextButton.classList.add('navBtn');
  nextButton.appendChild(document.createTextNode('Next'));
  nextButton.addEventListener('click', goNext);
  overlay.appendChild(exitButton);
  overlay.appendChild(prevButton);
  overlay.appendChild(nextButton);
  registerSwipeHandler(overlay, ({direction}) => {
    if (direction < 0) {
      goNext();
    } else {
      goPrev();
    }
  });
  document.body.appendChild(overlay);
}

function hideOverlay() {
  const overlay = document.querySelector('#swipeOverlay');
  if (!overlay) {
    return;
  }
  document.body.removeChild(overlay);
  return;
}

chrome.storage.sync.get('enable', data => {
  setEnabled(data.enable);
});

function isEnabled() {
  return !!document.getElementById('swipeOverlay');
}

function setEnabled(on) {
  chrome.storage.sync.set({enable: on});
  if (on === isEnabled()) {
    return;
  }
  if (on) {
    if (document.webkitFullscreenEnabled) {
      document.body.webkitRequestFullscreen();
    }
    showOverlay();
  } else {
    if (document.webkitFullscreenEnabled) {
      document.webkitExitFullscreen();
    }
    hideOverlay();
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
