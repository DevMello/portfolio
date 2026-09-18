/* Pranav Yerramaneni, devmello.xyz
   Two jobs: mark the section in view in the nav, and run the reaction-wheel
   pendulum in the hero. No dependencies. Everything degrades to static HTML. */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var TAU = Math.PI * 2;
  var rad = function (deg) { return deg * Math.PI / 180; };

  /* ---------- Nav: mark the section in view ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (sections.length) {
    var currentId = null;
    var ticking = false;

    var setCurrent = function (id) {
      if (id === currentId) return;
      currentId = id;
      navLinks.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };

    var updateCurrent = function () {
      ticking = false;
      var line = window.innerHeight * 0.35;
      var id = '';
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= line) id = sections[i].id;
      }
      setCurrent(id);
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateCurrent);
    }, { passive: true });
    window.addEventListener('resize', updateCurrent);
    updateCurrent();
  }

  /* ---------- Human / LLM view ---------- */

  var mode = document.querySelector('.mode');
  var human = document.getElementById('human');
  var llmView = document.getElementById('llm');
  var llmText = document.getElementById('llm-text');

  if (mode && human && llmView && llmText) {
    var modeOpts = Array.prototype.slice.call(mode.querySelectorAll('[data-mode]'));
    var llmLoad = null;

    var escapeHtml = function (s) {
      return s.replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    };

    // Plain text in, escaped text with clickable URLs out.
    var linkify = function (s) {
      return escapeHtml(s).replace(/https?:\/\/[^\s<>"]+/g, function (u) {
        var trail = '';
        var m = u.match(/[.,;:)]+$/);
        if (m) { trail = m[0]; u = u.slice(0, -trail.length); }
        return '<a href="' + u + '">' + u + '</a>' + trail;
      });
    };

    var loadLlm = function () {
      if (llmLoad) return llmLoad;
      llmLoad = fetch('llms-full.txt', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
        .then(function (t) {
          llmText.innerHTML = linkify(t);
        })
        .catch(function () {
          llmLoad = null;
          llmText.textContent = 'llms-full.txt could not be loaded. Open /ai instead.';
        });
      return llmLoad;
    };

    var setMode = function (m, fromClick) {
      var isLlm = m === 'llm';
      mode.classList.toggle('mode--llm', isLlm);
      root.classList.toggle('llm-mode', isLlm);
      modeOpts.forEach(function (o) {
        if (o.getAttribute('data-mode') === m) o.setAttribute('aria-current', 'true');
        else o.removeAttribute('aria-current');
      });
      human.hidden = isLlm;
      llmView.hidden = !isLlm;
      if (isLlm) loadLlm();
      if (fromClick) {
        try { history.replaceState(null, '', isLlm ? '?view=llm' : location.pathname); } catch (e) { /* file: URLs */ }
        window.scrollTo(0, 0);
        if (isLlm) {
          llmText.focus({ preventScroll: true });
        } else {
          var name = document.getElementById('name');
          if (name) {
            name.setAttribute('tabindex', '-1');
            name.focus({ preventScroll: true });
          }
        }
      }
    };

    modeOpts.forEach(function (o) {
      o.addEventListener('click', function (ev) {
        ev.preventDefault();
        setMode(o.getAttribute('data-mode'), true);
      });
    });

    if (/[?&]view=llm(&|$)/.test(location.search)) setMode('llm', false);
  }

  /* ---------- YouTube: swap the poster for the player only when asked ---------- */

  Array.prototype.forEach.call(document.querySelectorAll('a.yt[data-yt]'), function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(a.getAttribute('data-yt')) + '?autoplay=1&rel=0';
      frame.title = a.getAttribute('aria-label') || 'YouTube video';
      frame.width = 1280;
      frame.height = 720;
      frame.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      a.parentNode.replaceChild(frame, a);
      frame.focus();
    });
  });

  /* ---------- Reaction-wheel inverted pendulum ---------- */

  var canvas = document.getElementById('rwip');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var stage = canvas.parentNode;
  var outAngle = document.getElementById('ro-angle');
  var outWheel = document.getElementById('ro-wheel');
  var outTorque = document.getElementById('ro-torque');
  var nudgeBtn = document.getElementById('sim-nudge');
  var note = document.getElementById('sim-note');
  var live = document.getElementById('sim-live');
  var defaultNote = note ? note.textContent : '';

  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');

  /* Plant and controller. Units are normalized so the pendulum's inertia about
     the pivot is 1. Full-state feedback on angle, angular rate and wheel speed;
     the wheel-speed term is what keeps the wheel from winding up. */
  /* Recoverable from roughly 50 degrees at rest; past about 65 the motor's
     torque cannot beat gravity and it falls, then stands itself back up. */
  var P = {
    g: 30,          // m*g*l / I, 1/s^2: falls with a ~0.18 s time constant
    Iw: 0.04,       // wheel inertia relative to the pendulum
    kp: 50,
    kd: 8,
    kw: 0.02,
    tauMax: 28,     // motor torque limit
    wMax: 900,      // wheel speed limit, rad/s (about 8600 rpm)
    dt: 1 / 240,    // control and integration step
    damp: 0.15,     // pivot bearing damping
    wFriction: 0.02 // wheel bearing damping
  };

  var S = { th: 0, thd: 0, w: 0, phi: 0, tau: 0, mode: 'run', timer: 0, from: null };

  var colors = {};
  var W = 0, H = 0, dpr = 1, pivotY = 0;
  var running = false, raf = 0, last = 0, acc = 0, inView = true;
  var dragging = false, dragStartT = 0, dragSamples = [];
  var lastReadout = 0, settled = true, eventT = 0, nudgeDir = 1;
  var nextKick = 0;

  function readColors() {
    var cs = window.getComputedStyle(root);
    var get = function (name) { return cs.getPropertyValue(name).trim(); };
    colors = {
      ink: get('--ink'),
      ink3: get('--ink-3'),
      rule: get('--rule'),
      accent: get('--accent'),
      bg2: get('--bg-2')
    };
  }

  function announce(text) {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(function () { live.textContent = text; }, 40);
  }

  /* ----- physics ----- */

  function step(dt) {
    var s = S;
    s.timer += dt;

    if (s.mode === 'rearm') {
      var k = clamp(s.timer / 0.9, 0, 1);
      var e = 1 - Math.pow(1 - k, 3);
      s.th = s.from.th * (1 - e);
      s.w = s.from.w * (1 - e);
      s.thd = 0;
      s.tau = 0;
      s.phi += s.w * dt;
      if (k >= 1) {
        s.mode = 'run';
        s.timer = 0;
        s.th = 0;
        s.w = 0;
        settled = false;
        eventT = performance.now();
      }
      return;
    }

    var tau = 0;
    if (s.mode === 'run' && !dragging) {
      tau = P.kp * s.th + P.kd * s.thd + P.kw * s.w;
      tau = clamp(tau, -P.tauMax, P.tauMax);
      // The motor cannot push the wheel past its speed limit.
      if ((s.w >= P.wMax && tau > 0) || (s.w <= -P.wMax && tau < 0)) tau = 0;
    }
    s.tau = tau;

    if (dragging) {
      // The visitor holds the body; the wheel just coasts.
      s.w -= P.wFriction * s.w * dt;
      s.phi += s.w * dt;
      return;
    }

    // A little sensor and load noise, so the balance is alive rather than frozen.
    var noise = s.mode === 'run' ? (Math.random() - 0.5) * 0.6 : 0;

    var thdd = P.g * Math.sin(s.th) - tau - P.damp * s.thd + noise;
    var wd = tau / P.Iw - P.wFriction * s.w;

    s.thd += thdd * dt;
    s.th += s.thd * dt;
    s.w = clamp(s.w + wd * dt, -P.wMax, P.wMax);
    s.phi += s.w * dt;

    if (s.mode === 'run' && Math.abs(s.th) > 1.05) {
      s.mode = 'fallen';
      s.timer = 0;
      announce('It fell over. Standing it back up.');
    }

    if (s.mode === 'fallen') {
      s.thd -= 2.5 * s.thd * dt;
      if (Math.abs(s.th) >= Math.PI / 2) {
        s.th = (s.th < 0 ? -1 : 1) * Math.PI / 2;
        s.thd = 0;
      }
      if (s.timer > 1.3) {
        s.mode = 'rearm';
        s.timer = 0;
        s.from = { th: s.th, w: s.w };
      }
    }
  }

  function kick(v) {
    S.thd += v;
    settled = false;
    eventT = performance.now();
  }

  /* ----- drawing ----- */

  function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function draw() {
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var px = W / 2, py = pivotY;
    var L = H * 0.40, Rw = H * 0.11, Rd = L + Rw + H * 0.06;
    var s = S;

    // Dial: an arc of +-40 degrees with ticks every 10.
    ctx.lineCap = 'butt';
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.rule;
    ctx.beginPath();
    ctx.arc(px, py, Rd, -Math.PI / 2 - rad(40), -Math.PI / 2 + rad(40));
    ctx.stroke();

    ctx.strokeStyle = colors.ink3;
    ctx.fillStyle = colors.ink3;
    ctx.font = '500 10px ' + '"Atkinson Hyperlegible Mono", ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var d = -40; d <= 40; d += 10) {
      var a = -Math.PI / 2 + rad(d);
      var len = d % 20 === 0 ? 8 : 4;
      var cx = Math.cos(a), cy = Math.sin(a);
      line(px + cx * (Rd - len), py + cy * (Rd - len), px + cx * Rd, py + cy * Rd);
      if (d % 20 === 0) {
        var label = d === 0 ? '0' : (d > 0 ? '+' : '−') + Math.abs(d) + '°';
        ctx.fillText(label, px + cx * (Rd + 13), py + cy * (Rd + 13));
      }
    }

    // Current angle on the dial.
    var at = -Math.PI / 2 + s.th;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    line(px + Math.cos(at) * (Rd - 11), py + Math.sin(at) * (Rd - 11),
         px + Math.cos(at) * (Rd + 3), py + Math.sin(at) * (Rd + 3));

    // Base.
    ctx.strokeStyle = colors.ink3;
    ctx.lineWidth = 1;
    line(px - L * 0.32, py + 9, px + L * 0.32, py + 9);

    // Rod.
    var hx = px + Math.sin(s.th) * L;
    var hy = py - Math.cos(s.th) * L;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    line(px, py, hx, hy);

    // Wheel: rim, a speed haze, spokes that fade as it spins up.
    var speed = Math.abs(s.w);
    if (speed > 20) {
      ctx.globalAlpha = clamp((speed - 20) / 900, 0, 0.14);
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(hx, hy, Rw - 1, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(hx, hy, Rw, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = clamp(1 - speed / 160, 0.12, 1);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1.25;
    for (var i = 0; i < 6; i++) {
      var sa = s.phi + i * Math.PI / 3;
      line(hx + Math.cos(sa) * 4, hy + Math.sin(sa) * 4,
           hx + Math.cos(sa) * (Rw - 2.5), hy + Math.sin(sa) * (Rw - 2.5));
    }
    ctx.globalAlpha = 1;

    // Motor torque, as an arc from the top of the wheel in the direction it pushes.
    var tq = s.tau / P.tauMax;
    if (Math.abs(tq) > 0.02) {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.arc(hx, hy, Rw + 6, -Math.PI / 2, -Math.PI / 2 + tq * rad(120), tq < 0);
      ctx.stroke();
    }

    // Hub and pivot.
    ctx.fillStyle = colors.bg2;
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.5, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, TAU);
    ctx.fill();
  }

  function readouts(now) {
    if (now - lastReadout < 125) return;
    lastReadout = now;
    var deg = S.th * 180 / Math.PI;
    var rpm = Math.round(S.w * 60 / TAU);
    var pct = Math.round(S.tau / P.tauMax * 100);
    var sign = function (v) { return v < 0 ? '−' : '+'; };
    if (outAngle) outAngle.textContent = sign(deg) + Math.abs(deg).toFixed(1) + '°';
    if (outWheel) outWheel.textContent = sign(rpm) + String(Math.abs(rpm)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' rpm';
    if (outTorque) outTorque.textContent = sign(pct) + Math.abs(pct) + ' %';
  }

  function checkSettled(now) {
    if (settled || S.mode !== 'run' || dragging) return;
    if (now - eventT < 900) return;
    if (Math.abs(S.th) < 0.01 && Math.abs(S.thd) < 0.1) {
      settled = true;
      announce('Balanced.');
    }
  }

  /* ----- loop ----- */

  function frame(now) {
    raf = 0;
    if (!running) return;
    var elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += elapsed;
    var steps = 0;
    while (acc >= P.dt && steps < 40) {
      step(P.dt);
      acc -= P.dt;
      steps++;
    }
    if (steps === 40) acc = 0;

    // An occasional small disturbance while idle, so a visitor who never
    // touches it still sees the loop do its job.
    if (now > nextKick) {
      nextKick = now + 9000 + Math.random() * 7000;
      if (S.mode === 'run' && !dragging && now - eventT > 4000) kick((Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4));
    }

    checkSettled(now);
    draw();
    readouts(now);
    raf = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMq.matches || !inView || document.hidden) return;
    running = true;
    last = performance.now();
    acc = 0;
    if (!nextKick) nextKick = last + 8000;
    raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ----- interaction ----- */

  function pointerAngle(ev) {
    var r = canvas.getBoundingClientRect();
    var x = ev.clientX - r.left - W / 2;
    var y = ev.clientY - r.top - pivotY;
    return clamp(Math.atan2(x, -y), -1.3, 1.3);
  }

  function endDrag(ev) {
    if (!dragging) return;
    dragging = false;
    try {
      if (ev && ev.pointerId !== undefined && canvas.hasPointerCapture && canvas.hasPointerCapture(ev.pointerId)) {
        canvas.releasePointerCapture(ev.pointerId);
      }
    } catch (e) { /* nothing to release */ }
    var now = performance.now();
    var vel = 0;
    var latest = dragSamples[dragSamples.length - 1];
    // Release velocity is measured over the last ~80 ms of the drag, so a
    // flick carries through and a slow placement lets go at rest. A drag
    // shorter than 120 ms, or a pause before letting go, releases at rest.
    if (latest && now - dragStartT >= 120 && now - latest.t <= 120) {
      var ref = latest;
      for (var i = dragSamples.length - 1; i >= 0; i--) {
        ref = dragSamples[i];
        if (latest.t - ref.t >= 80) break;
      }
      if (latest.t > ref.t) vel = (latest.a - ref.a) / ((latest.t - ref.t) / 1000);
    }
    S.thd = clamp(vel, -3, 3) * 0.6;
    dragSamples = [];
    settled = false;
    eventT = now;
  }

  canvas.addEventListener('pointerdown', function (ev) {
    if (reduceMq.matches || S.mode !== 'run') return;
    if (ev.button !== undefined && ev.button !== 0) return;
    dragging = true;
    try { if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId); } catch (e) { /* capture is a nicety, not a requirement */ }
    dragStartT = performance.now();
    S.th = pointerAngle(ev);
    S.thd = 0;
    dragSamples = [{ t: dragStartT, a: S.th }];
    ev.preventDefault();
  });

  canvas.addEventListener('pointermove', function (ev) {
    if (!dragging) return;
    var a = pointerAngle(ev);
    dragSamples.push({ t: performance.now(), a: a });
    if (dragSamples.length > 24) dragSamples.shift();
    S.th = a;
    S.thd = 0;
  });

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('lostpointercapture', endDrag);

  if (nudgeBtn) {
    nudgeBtn.addEventListener('click', function () {
      if (S.mode !== 'run' || dragging) return;
      nudgeDir = -nudgeDir;
      kick(nudgeDir * 1.6);
      announce('Nudged. Recovering.');
    });
  }

  /* ----- environment ----- */

  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    pivotY = H * 0.82;
    draw();
  }

  function applyMotionPref() {
    if (reduceMq.matches) {
      stop();
      S.th = 0; S.thd = 0; S.w = 0; S.tau = 0; S.mode = 'run';
      canvas.classList.add('is-static');
      if (nudgeBtn) nudgeBtn.hidden = true;
      if (note) note.textContent = 'The simulation is paused because your system asks for reduced motion. It is a reaction-wheel pendulum held upright by a state-feedback controller.';
      draw();
      readouts(Infinity);
    } else {
      canvas.classList.remove('is-static');
      if (nudgeBtn) nudgeBtn.hidden = false;
      if (note) note.textContent = defaultNote;
      start();
    }
  }

  var onMq = function (mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  };

  onMq(reduceMq, applyMotionPref);
  onMq(darkMq, function () { readColors(); draw(); });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0.05 }).observe(stage);
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(); });

  readColors();
  resize();
  // Start with a small push so the first thing a visitor sees is a recovery.
  S.thd = 0.9;
  settled = false;
  eventT = performance.now();
  applyMotionPref();
})();
