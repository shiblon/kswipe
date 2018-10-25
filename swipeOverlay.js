"strict";

function registerSwipeHandler(el, handler, config) {
  const nop = () => null;
  config = config || {};
  const onDrag = config.onDrag || nop;
  const onRest = config.onRest || nop;
  const onIdle = config.onIdle || nop;

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
          swipe.totalX = 0;
          swipe.startX = touch.clientX;
          swipe.state = dirMatchesOriginatingSide(swipe.direction, touch.clientX) ? 'dragging' : 'idle';
        }
        return;
      case 'dragging':
        dx = touch.clientX - swipe.startX;
        if (Math.sign(dx) !== swipe.direction) {
          return; // Ignore slight backward movements.
        }
        swipe.totalX += dx;

        onDrag({
          target: el,
          dx: dx,
          dir: swipe.direction,
          start: swipe.startX,
          total: swipe.totalX,
          pos: touch.clientX,
          progress: Math.min(1.0, Math.abs(swipe.totalX) / MIN_TRIGGER_PX),
        });

        if (Math.abs(swipe.totalX) >= MIN_TRIGGER_PX) {
          swipe.state = 'resting';
          swipe.restStartTime = +new Date();

          handler({
            target: el,
            dir: swipe.direction,
            x: touch.clientX,
            y: touch.clientY,
          });

          setTimeout(function checkRest() {
            if (swipe.state !== 'resting') {
              return;
            }
            const dt = +new Date() - swipe.restStartTime;
            onRest({
              target: el,
              dir: swipe.direction,
              progress: Math.min(1.0, dt / REST_DURATION_MS),
            });
            if (dt < REST_DURATION_MS) {
              // Not done waiting - try again.
              setTimeout(checkRest, REST_CHECK_INTERVAL_MS);
              return;
            }
            swipe.state = 'idle';
            onIdle({dir: swipe.direction});
          }, REST_CHECK_INTERVAL_MS);
        }
        return;
      case 'resting':
        // If we get move events while resting, we start the resting
        // time over. Resting can only end when we get no touch move
        // events for a specified period of time. This gives the user
        // time to haltingly move fingers and hands off of the
        // screen.
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

function drawSwipeArrow(ctx, direction, progress) {
  const intProgress = Math.floor(progress / .33);
  const awidth = 4 * ctx.canvas.width / 6;
  const aheight = 3 * ctx.canvas.height / 5;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  if (direction > 0) {
    ctx.translate(ctx.canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.translate(intProgress * ctx.canvas.width / 6, ctx.canvas.height / 5);
  ctx.fillStyle = '#3b3';
  ctx.fillRect(0, aheight / 3, awidth / 2, aheight / 3);
  ctx.beginPath();
  ctx.moveTo(awidth, aheight / 2);
  ctx.lineTo(awidth / 2, 0);
  ctx.lineTo(awidth / 2, aheight);
  ctx.fill();
  ctx.restore();
}

function drawTrafficLight(ctx, progress) {
  const lw = ctx.canvas.width / 3;
  const lh = 18 * ctx.canvas.height / 20;
  const cradius = ctx.canvas.width / 10;
  const lradius = (6 * lh / 8) / 2;
  const ypad = (lh - 6 * cradius) / 4;

  const intProg = progress > .98 ? 2 : (progress > .5 ? 1 : 0);
  const rcolor = intProg < 2 ? '#e33' : '#300';
  const ycolor = intProg == 1 ? '#ee3' : '#330';
  const gcolor = intProg == 2 ? '#3e3' : '#030';

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  ctx.translate((ctx.canvas.width - lw) / 2, (ctx.canvas.height -lh) / 2);
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(cradius, 0);
  ctx.lineTo(lw - cradius, 0);
  ctx.quadraticCurveTo(lw, 0, lw, cradius);
  ctx.lineTo(lw, lh - cradius);
  ctx.quadraticCurveTo(lw, lh, lw - cradius, lh);
  ctx.lineTo(cradius, lh);
  ctx.quadraticCurveTo(0, lh, 0, lh - cradius);
  ctx.lineTo(0, cradius);
  ctx.quadraticCurveTo(0, 0, cradius, 0);
  ctx.fill();

  ctx.save();
  ctx.translate(lw / 2, ypad + cradius);
  ctx.fillStyle = rcolor;
  ctx.beginPath();
  ctx.arc(0, 0, cradius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(lw / 2, 2 * ypad + 3 * cradius);
  ctx.fillStyle = ycolor;
  ctx.beginPath();
  ctx.arc(0, 0, cradius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(lw / 2, 3 * ypad + 5 * cradius);
  ctx.fillStyle = gcolor;
  ctx.beginPath();
  ctx.arc(0, 0, cradius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();

  ctx.restore();
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
  exitButton.classList.add('ctlBtn');
  const exitImg = document.createElement('img');
  exitImg.src = chrome.runtime.getURL('images/exit.png');
  exitButton.appendChild(exitImg);
  exitButton.addEventListener('click', () => {
    setEnabled(false);
  });
  const fsButton = document.createElement('button');
  fsButton.id = 'fsButton';
  fsButton.classList.add('ctlBtn');
  const fsImg = document.createElement('img');
  fsImg.id = 'fsImg';
  fsImg.src = chrome.runtime.getURL('images/expand.png');
  fsButton.appendChild(fsImg);
  fsButton.addEventListener('click', toggleFull);
  document.onwebkitfullscreenchange = () => {
    if (document.webkitIsFullScreen) {
      fsImg.src = chrome.runtime.getURL('images/contract.png');
    } else {
      fsImg.src = chrome.runtime.getURL('images/expand.png');
    }
  };
  const prevButton = document.createElement('button');
  prevButton.classList.add('navBtn');
  prevButton.appendChild(document.createTextNode('◀'));
  prevButton.addEventListener('click', goPrev);
  const nextButton = document.createElement('button');
  nextButton.classList.add('navBtn');
  nextButton.appendChild(document.createTextNode('▶'));
  nextButton.addEventListener('click', goNext);
  overlay.appendChild(exitButton);
  overlay.appendChild(fsButton);
  overlay.appendChild(document.createElement('br'));
  overlay.appendChild(prevButton);
  overlay.appendChild(nextButton);

  const indicator = document.createElement('canvas');
  indicator.id = 'swipeIndicator';
  indicator.width = 200;
  indicator.height = 200;
  drawTrafficLight(indicator.getContext('2d'), 1.0);
  overlay.appendChild(indicator);

  registerSwipeHandler(overlay, ({dir}) => (dir < 0) ? goNext() : goPrev(), {
    onDrag: ({dir, progress}) => {
      drawSwipeArrow(indicator.getContext('2d'), dir, progress);
    },
    onRest: ({progress}) => {
      drawTrafficLight(indicator.getContext('2d'), progress);
    },
    onIdle: () => {
      drawTrafficLight(indicator.getContext('2d'), 1.0);
    },
  });
  document.body.appendChild(overlay);
}

function toggleFull() {
  if (!document.webkitFullscreenEnabled) {
    return;
  }
  if (document.webkitIsFullScreen) {
    exitFull();
  } else {
    goFull();
  }
}

function goFull() {
  if (document.webkitFullscreenEnabled) {
    document.body.webkitRequestFullscreen();
  }
}

function exitFull() {
  if (document.webkitFullscreenEnabled) {
    document.webkitExitFullscreen();
  }
}

function hideOverlay() {
  const overlay = document.querySelector('#swipeOverlay');
  if (!overlay) {
    return;
  }
  document.body.removeChild(overlay);
  return;
}

chrome.storage.local.get('enable', data => {
  setEnabled(data.enable);
});

function isEnabled() {
  return !!document.getElementById('swipeOverlay');
}

function setEnabled(on) {
  if (on === isEnabled()) {
    return;
  }
  chrome.storage.local.set({enable: on});
  if (on) {
    goFull();
    showOverlay();
  } else {
    exitFull();
    hideOverlay();
  }
}

chrome.runtime.onMessage.addListener((request, sender, response) => {
  if (sender.tab) {
    console.log("ignoring content script message:", request);
    return;
  }
  switch (request.type) {
    case "enable":
      setEnabled(request.value);
      return;
    default:
      console.log('ignoring unknown request type:', request.type);
      return;
  }
});

chrome.storage.local.get('enable', data => {
  setEnabled(data.enable);
});
