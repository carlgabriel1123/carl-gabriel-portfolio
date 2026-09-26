/* ============================================================
   Carl Gabriel Piramo — portfolio interactions (main.js)
   ------------------------------------------------------------
   00 setup            helpers, media queries, rAF scroll bus
   01 loaded state     body.loaded after fonts (max 800ms) + 1 frame
   02 word splitting   [data-split] → .w > .wi per word
   03 reveal observer  .reveal / [data-split] / [data-stagger] parents
   04 counters         .val[data-count] ease-out count-up
   05 nav              page bar, hide/show, scrolled, scrollspy, mobile menu
   06 rotator          .rotator .rot-item cycling
   07 hero parallax    [data-depth] layers follow the pointer
   08 cards            spotlight vars, 3D tilt, magnetic buttons
   09 videos           play while visible, progress bar, tap/keyboard toggle
   10 work tabs        filter .work-group by data-filter
   11 timeline         --tl-p progress + .lit nodes
   12 faq              accordion toggles
   13 contact form     validate + mailto
   14 dock / to-top    floating UI + footer year
   15 anchors          same-page links scroll smoothly (reduced-motion aware)
   16 ticker           user-operable pause for the brand marquee
   All features are guarded: a missing element never throws.
   ============================================================ */
(function () {
  'use strict';

  /* ------------------------------------------------------------
     00 SETUP
     ------------------------------------------------------------ */
  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var mqFine = window.matchMedia ? window.matchMedia('(pointer: fine)') : null;
  var reduceMotion = !!(mqReduce && mqReduce.matches);
  var finePointer = !!(mqFine && mqFine.matches);
  var hasIO = 'IntersectionObserver' in window;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var raf = window.requestAnimationFrame
    ? function (fn) { return window.requestAnimationFrame(fn); }
    : function (fn) { return setTimeout(fn, 16); };
  var caf = window.requestAnimationFrame
    ? function (id) { window.cancelAnimationFrame(id); }
    : function (id) { clearTimeout(id); };

  /* rAF-throttle any handler: the latest arguments win, one call per frame.
     wrapped.cancel() drops a queued frame so a synchronous reset (pointerleave)
     is never overwritten by a stale pointermove that landed in the same frame. */
  function throttleRaf(fn) {
    var pending = false, id = null, lastArgs = null, lastThis = null;
    function wrapped() {
      lastArgs = arguments; lastThis = this;
      if (pending) return;
      pending = true;
      id = raf(function () { id = null; pending = false; fn.apply(lastThis, lastArgs); });
    }
    wrapped.cancel = function () {
      if (id !== null) { caf(id); id = null; }
      pending = false;
    };
    return wrapped;
  }

  /* One passive scroll/resize listener, one rAF per frame, many subscribers */
  var scrollBus = (function () {
    var fns = [], ticking = false;
    function run() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      for (var i = 0; i < fns.length; i++) {
        try { fns[i](y); } catch (err) { /* one subscriber must not break the others */ }
      }
    }
    function request() {
      if (ticking) return;
      ticking = true;
      raf(run);
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    return {
      add: function (fn) { fns.push(fn); request(); },
      request: request
    };
  })();

  /* Run a feature in isolation so one failure never blocks the rest */
  function feature(name, fn) {
    try { fn(); } catch (err) {
      if (window.console && console.warn) console.warn('[main.js] ' + name + ' skipped:', err);
    }
  }

  /* ------------------------------------------------------------
     01 LOADED STATE
     ------------------------------------------------------------ */
  function initLoaded() {
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 800); });
    function go() {
      document.body.classList.add('loaded');
      $$('.hero [data-split]').forEach(function (el) { el.classList.add('in'); });
    }
    Promise.race([fontsReady, timeout]).then(function () { raf(go); }).catch(go);
  }

  /* ------------------------------------------------------------
     02 WORD SPLITTING
     ------------------------------------------------------------ */
  function splitWords(el) {
    if (el.classList.contains('is-split')) return;
    var index = 0;

    function wrapTextNode(node) {
      var text = node.nodeValue;
      if (!text || !text.trim()) return; // whitespace-only nodes stay as they are
      var frag = document.createDocumentFragment();
      var parts = text.split(/(\s+)/);
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
        var w = document.createElement('span');
        w.className = 'w';
        var wi = document.createElement('span');
        wi.className = 'wi';
        wi.textContent = part;
        wi.style.transitionDelay = reduceMotion ? '0ms' : (index * 60) + 'ms';
        index++;
        w.appendChild(wi);
        frag.appendChild(w);
      }
      node.parentNode.replaceChild(frag, node);
    }

    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.nodeType === 3) wrapTextNode(child);
        else if (child.nodeType === 1) walk(child); // keep <em>, <span class="ac"> etc.
      }
    }

    walk(el);
    el.classList.add('is-split');
  }

  function initSplit() {
    $$('[data-split]').forEach(splitWords);
  }

  /* ------------------------------------------------------------
     03 REVEAL OBSERVER
     ------------------------------------------------------------ */
  function initReveal() {
    // Horizontal scrollers: children off-screen to the right never intersect on their own,
    // so the whole row is revealed (with its stagger) once the track itself scrolls into view.
    var TRACK_SEL = '.reel-track, .stills-track';
    var tracks = [];

    // [data-stagger="N"] parents: each direct child becomes a .reveal with data-delay = index × N
    $$('[data-stagger]').forEach(function (parent) {
      var step = parseFloat(parent.getAttribute('data-stagger')) || 0;
      var extra = parent.getAttribute('data-stagger-class');
      var i = 0;
      Array.prototype.slice.call(parent.children).forEach(function (child) {
        if (child.getAttribute('aria-hidden') === 'true') return; // e.g. .steps-line: decorative, not a stagger item
        child.classList.add('reveal');
        if (extra) child.classList.add(extra);
        child.setAttribute('data-delay', String(Math.round(i * step)));
        i++;
      });
      var isTrack = (parent.matches && parent.matches(TRACK_SEL)) || parent.scrollWidth > parent.clientWidth + 1;
      if (isTrack) tracks.push(parent);
    });

    var inTrack = function (el) {
      for (var i = 0; i < tracks.length; i++) { if (tracks[i].contains(el)) return true; }
      return false;
    };
    var targets = $$('.reveal, [data-split]').filter(function (el) {
      return !el.closest('.hero') && !inTrack(el);
    });
    if (!targets.length && !tracks.length) return;

    function show(el, instant) {
      if (el.classList.contains('in')) return;
      var delay = (reduceMotion || instant) ? 0 : (parseInt(el.getAttribute('data-delay'), 10) || 0);
      if (el.hasAttribute('data-delay')) {
        el.style.transitionDelay = delay + 'ms';
        // clear the inline delay once the reveal has played so hover transitions stay snappy
        setTimeout(function () { el.style.transitionDelay = ''; }, delay + 1000);
      }
      el.classList.add('in');
    }

    function showTrack(track, instant) {
      $$('.reveal', track).forEach(function (el) { show(el, instant); });
    }

    function reveal(el, instant) {
      if (tracks.indexOf(el) !== -1) showTrack(el, instant); else show(el, instant);
    }

    if (reduceMotion || !hasIO) {
      targets.forEach(show);
      tracks.forEach(showTrack);
      return;
    }

    var pending = targets.concat(tracks);
    var done = [];

    function finish(el) {
      done.push(el);
      io.unobserve(el);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        reveal(entry.target, false);
        finish(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    pending.forEach(function (el) { io.observe(el); });

    // Safety net: anything jumped past (anchor links, fast/smooth scrolls that skip a frame)
    // sits above the viewport without ever having intersected — reveal it without stagger.
    scrollBus.add(function () {
      if (!pending.length) return;
      var keep = [];
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        if (done.indexOf(el) !== -1) continue;
        if (el.getBoundingClientRect().bottom < 0) {
          reveal(el, true);
          finish(el);
        } else {
          keep.push(el);
        }
      }
      pending = keep;
    });
  }

  /* ------------------------------------------------------------
     04 COUNTERS
     ------------------------------------------------------------ */
  function initCounters() {
    var vals = $$('.val[data-count]');
    if (!vals.length) return;

    function decimalsOf(raw) {
      var m = String(raw).trim().match(/\.(\d+)$/);
      return m ? m[1].length : 0;
    }

    function run(el) {
      var raw = el.getAttribute('data-count');
      var target = parseFloat(raw);
      if (isNaN(target)) return;
      var decimals = decimalsOf(raw);
      if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }

      var duration = 1400;
      var start = null;
      el.textContent = (0).toFixed(decimals);
      function tick(now) {
        if (start === null) start = now;
        var p = clamp((now - start) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) raf(tick); else el.textContent = target.toFixed(decimals);
      }
      raf(tick);
    }

    if (reduceMotion || !hasIO) { vals.forEach(run); return; }

    // never show the final number before the count: zero it up front (only on the animated path)
    vals.forEach(function (el) {
      var raw = el.getAttribute('data-count');
      if (!isNaN(parseFloat(raw))) el.textContent = (0).toFixed(decimalsOf(raw));
    });
    function settle(el) {
      var raw = el.getAttribute('data-count');
      var t = parseFloat(raw);
      if (!isNaN(t)) el.textContent = t.toFixed(decimalsOf(raw));
    }

    var pending = vals.slice();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        pending = pending.filter(function (v) { return v !== entry.target; });
        // start once the host card's staggered fade has begun so the count is seen from 0
        var host = entry.target.closest ? entry.target.closest('[data-delay]') : null;
        var wait = 0;
        if (host && !host.classList.contains('in')) {
          wait = (parseInt(host.getAttribute('data-delay'), 10) || 0) + 120;
        }
        setTimeout(function () { run(entry.target); }, wait);
      });
    }, { threshold: 0.5 });
    vals.forEach(function (el) { io.observe(el); });

    // Safety net: a counter scrolled past without ever intersecting shows its final value
    scrollBus.add(function () {
      if (!pending.length) return;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().bottom < 0) { io.unobserve(el); settle(el); return false; }
        return true;
      });
    });
  }

  /* ------------------------------------------------------------
     05 NAV
     ------------------------------------------------------------ */
  function initNav() {
    var nav = $('.nav');
    if (!nav) return;
    var body = document.body;

    // Page progress bar (transform, never width)
    var bar = $('.pagebar i', nav);
    if (bar) {
      bar.style.transformOrigin = 'left center';
      scrollBus.add(function (y) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? clamp(y / max, 0, 1) : 0;
        bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      });
    }

    // Hide on scroll down / show on scroll up, .nav--scrolled past 20px
    var lastY = window.pageYOffset || 0;
    scrollBus.add(function (y) {
      nav.classList.toggle('nav--scrolled', y > 20);
      if (body.classList.contains('nav-open')) {
        nav.classList.remove('nav--hidden');
      } else {
        var dy = y - lastY;
        if (dy > 4 && y > 140) nav.classList.add('nav--hidden');
        else if (dy < -4 || y <= 140) nav.classList.remove('nav--hidden');
      }
      lastY = y;
    });

    // Scrollspy
    var links = $$('.nav-links a', nav);
    if (links.length && hasIO) {
      var byId = {};
      var sections = [];
      links.forEach(function (a) {
        var id = (a.getAttribute('href') || '').replace(/^#/, '');
        if (!id) return;
        var sec = document.getElementById(id);
        if (!sec) return;
        byId[id] = a;
        sections.push(sec);
      });
      if (sections.length) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.id;
            links.forEach(function (a) { a.classList.toggle('active', byId[id] === a); });
          });
        }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
        sections.forEach(function (sec) { spy.observe(sec); });
      }
    }

    // Mobile menu
    var toggle = $('.nav-toggle', nav);
    var menu = $('.nav-menu', nav) || $('#navMenu');
    if (toggle) {
      var setOpen = function (open) {
        body.classList.toggle('nav-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        if (open) nav.classList.remove('nav--hidden');
      };
      var isOpen = function () { return body.classList.contains('nav-open'); };

      toggle.addEventListener('click', function () { setOpen(!isOpen()); });

      if (menu) {
        menu.addEventListener('click', function (e) {
          var a = e.target.closest ? e.target.closest('a') : null;
          if (a && isOpen()) setOpen(false);
        });
      }

      document.addEventListener('keydown', function (e) {
        if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) {
          setOpen(false);
          toggle.focus();
        }
      });

      // Close if the viewport grows back to desktop while open
      window.addEventListener('resize', throttleRaf(function () {
        if (isOpen() && window.innerWidth > 860) setOpen(false);
      }), { passive: true });
    }
  }

  /* ------------------------------------------------------------
     06 ROTATOR
     ------------------------------------------------------------ */
  function initRotator() {
    var rotator = $('.rotator');
    if (!rotator) return;
    var items = $$('.rot-item', rotator);
    if (items.length < 2) return;

    var current = 0;
    for (var i = 0; i < items.length; i++) { if (items[i].classList.contains('is-on')) { current = i; break; } }
    if (!items[current].classList.contains('is-on')) items[current].classList.add('is-on');

    var timer = null;
    var outTimer = null;

    function step() {
      var prev = items[current];
      current = (current + 1) % items.length;
      var next = items[current];
      prev.classList.remove('is-on');
      prev.classList.add('is-out');
      clearTimeout(outTimer);
      outTimer = setTimeout(function () { prev.classList.remove('is-out'); }, 600);
      next.classList.add('is-on');
    }

    function start() {
      if (timer || reduceMotion || (mqReduce && mqReduce.matches)) return;
      timer = setInterval(step, 2800);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    start();

    // Keep the loop quiet when the tab is hidden; never run under reduced motion
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    if (mqReduce && mqReduce.addEventListener) {
      mqReduce.addEventListener('change', function (e) {
        if (e.matches) { stop(); items.forEach(function (it) { it.classList.remove('is-out'); }); }
        else start();
      });
    }
  }

  /* ------------------------------------------------------------
     07 HERO PARALLAX
     ------------------------------------------------------------ */
  function initParallax() {
    if (reduceMotion || !finePointer) return;
    var hero = $('.hero');
    if (!hero) return;
    var layers = $$('[data-depth]', hero).map(function (el) {
      return { el: el, depth: parseFloat(el.getAttribute('data-depth')) || 0 };
    }).filter(function (l) { return l.depth !== 0; });
    if (!layers.length) return;

    var move = throttleRaf(function (e) {
      var r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
      var ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1, 1);
      layers.forEach(function (l) {
        var x = (nx * l.depth * 40).toFixed(2);
        var y = (ny * l.depth * 40).toFixed(2);
        l.el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      });
    });

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      move(e);
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      move.cancel();
      layers.forEach(function (l) { l.el.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------
     08 CARDS — spotlight, tilt, magnet
     ------------------------------------------------------------ */
  function initCards() {
    if (!finePointer) return;

    // Cursor spotlight: --mx / --my in px relative to the card
    $$('.card').forEach(function (card) {
      var isTilt = !reduceMotion && card.classList.contains('tilt');
      var onMove = throttleRaf(function (e) {
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = e.clientX - r.left;
        var py = e.clientY - r.top;
        card.style.setProperty('--mx', px.toFixed(1) + 'px');
        card.style.setProperty('--my', py.toFixed(1) + 'px');
        if (isTilt) {
          var rx = ((0.5 - py / r.height) * 12).toFixed(2); // ±6deg
          var ry = ((px / r.width - 0.5) * 12).toFixed(2);  // ±6deg
          card.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
        }
      });
      card.addEventListener('pointermove', onMove, { passive: true });
      card.addEventListener('pointerleave', function () {
        onMove.cancel();
        if (isTilt) card.style.transform = '';
      });
    });

    // Magnetic buttons
    if (reduceMotion) return;
    $$('.magnet').forEach(function (btn) {
      var onMove = throttleRaf(function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.18).toFixed(2) + 'px,' + (dy * 0.18).toFixed(2) + 'px)';
      });
      btn.addEventListener('pointermove', onMove, { passive: true });
      btn.addEventListener('pointerleave', function () { onMove.cancel(); btn.style.transform = ''; });
    });
  }

  /* ------------------------------------------------------------
     09 VIDEOS
     ------------------------------------------------------------ */
  function initVideos() {
    var videos = $$('.vframe video');
    if (!videos.length) return;

    function play(v) {
      v.muted = true;
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () { /* poster stays visible */ });
    }

    var io = null;
    if (hasIO && !reduceMotion) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          if (entry.isIntersecting) { if (!v.userPaused) play(v); } else v.pause();
        });
      }, { threshold: 0.35 });
    }

    videos.forEach(function (v) {
      var frame = v.closest ? v.closest('.vframe') : v.parentElement;
      var bar = frame ? $('.vframe-bar i', frame) : null;
      if (bar) {
        v.addEventListener('timeupdate', function () {
          if (v.duration) bar.style.transform = 'scaleX(' + (v.currentTime / v.duration).toFixed(4) + ')';
        });
      }
      // .vframe-toggle is a real <button> over the frame (Enter/Space work natively); aria-pressed mirrors playback
      var toggle = frame ? $('.vframe-toggle', frame) : null;
      function sync() { if (toggle) toggle.setAttribute('aria-pressed', v.paused ? 'false' : 'true'); }
      v.addEventListener('play', sync);
      v.addEventListener('pause', sync);
      function userToggle() {
        if (v.paused) { v.userPaused = false; play(v); }
        else { v.userPaused = true; v.pause(); }
      }
      if (toggle) toggle.addEventListener('click', userToggle); else v.addEventListener('click', userToggle);
      if (io) io.observe(v);
    });
  }

  /* ------------------------------------------------------------
     10 WORK TABS
     ------------------------------------------------------------ */
  function initWorkTabs() {
    var tabs = $$('.work-tab');
    var groups = $$('.work-group');
    if (!tabs.length || !groups.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = tab.getAttribute('data-filter') || 'all';
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        groups.forEach(function (g) {
          var show = filter === 'all' || g.getAttribute('data-group') === filter;
          g.classList.toggle('is-hidden', !show);
        });
        scrollBus.request();
      });
    });
  }

  /* ------------------------------------------------------------
     11 TIMELINE
     ------------------------------------------------------------ */
  function initTimeline() {
    var timeline = $('.timeline');
    if (!timeline) return;
    var nodes = $$('.tl-node', timeline);

    if (reduceMotion) {
      timeline.style.setProperty('--tl-p', '1');
      nodes.forEach(function (n) { n.classList.add('lit'); });
      return;
    }

    scrollBus.add(function () {
      var r = timeline.getBoundingClientRect();
      if (!r.height) return;
      var p = clamp((window.innerHeight * 0.8 - r.top) / r.height, 0, 1);
      timeline.style.setProperty('--tl-p', p.toFixed(4));
      var lineY = r.top + r.height * p;
      nodes.forEach(function (n) {
        var nr = n.getBoundingClientRect();
        var center = nr.top + nr.height / 2;
        n.classList.toggle('lit', center <= lineY + 1);
      });
    });
  }

  /* ------------------------------------------------------------
     12 FAQ
     ------------------------------------------------------------ */
  function initFaq() {
    var buttons = $$('.faq-q');
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        var item = btn.closest ? btn.closest('.faq-item') : btn.parentElement;
        if (item) item.classList.toggle('is-open', !open);
        var panelId = btn.getAttribute('aria-controls');
        var panel = panelId ? document.getElementById(panelId) : null;
        if (panel) panel.classList.toggle('is-open', !open);
      });
    });
  }

  /* ------------------------------------------------------------
     13 CONTACT FORM
     ------------------------------------------------------------ */
  function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;
    var note = $('.cf-note', form);
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var FIELDS = ['name', 'email', 'message'];

    function field(name) { return form.elements[name] || null; }
    function value(name) { var f = field(name); return f ? String(f.value || '').trim() : ''; }
    function say(msg, ok) {
      if (!note) return;
      note.textContent = msg;
      note.classList.toggle('is-ok', !!ok);   // .is-ok / .is-error carry the colours
      note.classList.toggle('is-error', !ok);
    }
    function clearInvalid(f) {
      f.removeAttribute('aria-invalid');
      f.removeAttribute('aria-describedby');
    }
    function clearAllInvalid() {
      FIELDS.forEach(function (n) { var f = field(n); if (f) clearInvalid(f); });
    }
    FIELDS.forEach(function (n) {
      var f = field(n);
      if (f) f.addEventListener('input', function () { clearInvalid(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = value('name');
      var email = value('email');
      var store = value('store');
      var message = value('message');

      var problem = null;
      if (!name) problem = { f: field('name'), msg: 'Please add your name.' };
      else if (!email || !EMAIL_RE.test(email)) problem = { f: field('email'), msg: 'Please add a valid email address.' };
      else if (!message) problem = { f: field('message'), msg: 'Tell me a little about what you need.' };

      clearAllInvalid();
      if (problem) {
        if (problem.f) {
          problem.f.setAttribute('aria-invalid', 'true');
          if (note && note.id) problem.f.setAttribute('aria-describedby', note.id);
        }
        say(problem.msg, false);
        if (problem.f && problem.f.focus) problem.f.focus();
        return;
      }

      var subject = 'Strategy call — ' + (store || name);
      var body = 'Hi Carl,\n\n' +
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Brand / website: ' + (store || '—') + '\n\n' +
        message + '\n';
      say('Opening your email app…', true);
      window.location.href = 'mailto:piramocarlgabriel@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  }

  /* ------------------------------------------------------------
     14 DOCK, TO-TOP, FOOTER YEAR
     ------------------------------------------------------------ */
  function initFloatingUi() {
    var dock = $('.cta-dock');
    var hero = $('#top');
    var contact = $('#contact');
    if (dock && hero) {
      // hidden while the hero is on screen, and while the user is already inside #contact (its own target)
      var heroOn = true, contactOn = false;
      var sync = function () { dock.classList.toggle('show', !heroOn && !contactOn); };
      if (hasIO) {
        new IntersectionObserver(function (entries) {
          heroOn = entries[entries.length - 1].isIntersecting; sync();
        }, { threshold: 0 }).observe(hero);
        if (contact) {
          new IntersectionObserver(function (entries) {
            contactOn = entries[entries.length - 1].isIntersecting; sync();
          }, { threshold: 0.15 }).observe(contact);
        }
      } else {
        scrollBus.add(function () {
          heroOn = hero.getBoundingClientRect().bottom > 0;
          if (contact) {
            var r = contact.getBoundingClientRect();
            contactOn = r.top < window.innerHeight * 0.85 && r.bottom > window.innerHeight * 0.15;
          }
          sync();
        });
      }
    }

    var toTop = $('.to-top');
    if (toTop) {
      scrollBus.add(function (y) { toTop.classList.toggle('show', y > 700); });
      toTop.addEventListener('click', function () {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
        } catch (err) {
          window.scrollTo(0, 0);
        }
      });
    }

    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------
     15 IN-PAGE ANCHORS
     Smooth-scroll same-page links from JS so the motion respects
     prefers-reduced-motion even if the stylesheet's scroll-behavior
     is left at its default; focus moves to the target for keyboard users.
     ------------------------------------------------------------ */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = (a.getAttribute('href') || '').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      try {
        target.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
      } catch (err) {
        target.scrollIntoView(true);
      }
      if (window.history && history.pushState) {
        try { history.pushState(null, '', '#' + id); } catch (err) { /* file:// or sandboxed */ }
      }
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      try { target.focus({ preventScroll: true }); } catch (err) { /* older engines */ }
    });
  }

  /* ------------------------------------------------------------
     16 TICKER PAUSE
     ------------------------------------------------------------ */
  function initTicker() {
    var ticker = $('.ticker');
    var btn = ticker ? $('.ticker-pause', ticker) : null;
    if (!ticker || !btn) return;
    btn.addEventListener('click', function () {
      var paused = ticker.classList.toggle('ticker--paused');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    });
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  function init() {
    feature('split', initSplit);       // must run before the hero gets .in
    feature('loaded', initLoaded);
    feature('reveal', initReveal);
    feature('counters', initCounters);
    feature('nav', initNav);
    feature('rotator', initRotator);
    feature('parallax', initParallax);
    feature('cards', initCards);
    feature('videos', initVideos);
    feature('workTabs', initWorkTabs);
    feature('timeline', initTimeline);
    feature('faq', initFaq);
    feature('contactForm', initContactForm);
    feature('floatingUi', initFloatingUi);
    feature('anchors', initAnchors);
    feature('ticker', initTicker);
    scrollBus.request();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
