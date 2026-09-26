/* ============================================================
   Carl Gabriel Piramo — portfolio interactions (main.js)
   ------------------------------------------------------------
   00 setup            helpers, media queries, rAF scroll bus
   01 loaded state     body.loaded after fonts (max 800ms) + 1 frame
   02 word splitting   [data-split] → .w > .wi per word
   03 reveal observer  .reveal / [data-split] / [data-stagger] parents
   04 counters         .val[data-count] ease-out count-up (en-US grouping),
                       runCounters(root) restarts a tab panel's counters
   05 nav              page bar, hide/show, scrolled, mobile menu
                       (the current page is aria-current in the HTML)
   06 rotator          .rotator .rot-item cycling
   07 hero parallax    [data-depth] layers follow the pointer
   08 cards            spotlight vars, 3D tilt, magnetic buttons
   09 videos           .vframe and .bento-video: play while visible,
                       progress bar, tap/keyboard toggle
   10 segmented ctrls  .seg > .seg-ind slides under the active .seg-btn
   11 work tabs        filter .work-group by data-filter
   12 proof tabs       WAI-ARIA tabs for #proof panels, staggered cards + counters
   13 gallery          .gal-filter FLIP filtering, counts, status, deep links
   14 lightbox         dialog#lightbox for a[data-lb-group] groups ("gallery",
                       "stills"): FLIP zoom, prev/next, keys, swipe, swipe-down close
   15 timeline         --tl-p progress + .lit nodes
   16 faq              accordion toggles
   17 contact form     validate + mailto
   18 dock / to-top    floating UI + footer year
   19 anchors          same-page links (#id or this-page.html#id) scroll smoothly
   20 ticker           user-operable pause for the brand marquee
   21 jump-chips       sticky .jumpnav scrollspy (aria-current="location")
   22 touch            no-op touchstart so iOS applies the CSS :active states
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

  var EASE_OUT = 'cubic-bezier(.16,1,.3,1)'; // matches --ease-out
  var EASE_IN = 'cubic-bezier(.4,0,1,1)';

  /* Web Animations helpers: canAnimate() gates every WAAPI call (instant fallback),
     cancelAll() drops a list of running animations without leaving any fill behind */
  function canAnimate(el) { return !reduceMotion && !!el && typeof el.animate === 'function'; }
  function cancelAll(list) {
    for (var i = 0; i < list.length; i++) { try { list[i].cancel(); } catch (err) { /* already gone */ } }
    list.length = 0;
  }
  function modified(e) { return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey; }
  function focusQuiet(el) {
    if (!el || !el.focus) return;
    try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
  }

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
      $$('.hero [data-split], .page-hero [data-split]').forEach(function (el) { el.classList.add('in'); });
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
      return !el.closest('.hero, .page-hero') && !inTrack(el);
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
     .val[data-count] counts up with an ease-out. The number of decimals comes
     from the attribute ("8.71" → 2, "99843" → 0) and the grouping from en-US,
     so 99843 renders "99,843". Counters outside hidden tab panels start when
     they scroll into view; runCounters(root) restarts every counter in root
     from 0 (a tab panel that was just activated). Instant under reduced motion.
     ------------------------------------------------------------ */
  var counterIO = null;      // viewport observer (animated path only)
  var counterPending = [];   // observed counters that have not run yet

  function countDecimals(raw) {
    var m = String(raw).trim().match(/\.(\d+)$/);
    return m ? m[1].length : 0;
  }
  function formatCount(n, d) {
    try {
      return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    } catch (err) {
      return n.toFixed(d); // engines without Intl options support
    }
  }
  function countSpec(el) {
    var raw = el.getAttribute('data-count');
    var t = parseFloat(raw);
    return isNaN(t) ? null : { t: t, d: countDecimals(raw) };
  }
  function stopCounter(el) {
    if (el._cgCountRaf) { caf(el._cgCountRaf); el._cgCountRaf = null; }
    if (el._cgCountWait) { clearTimeout(el._cgCountWait); el._cgCountWait = null; }
  }
  function settleCounter(el) {
    var c = countSpec(el);
    stopCounter(el);
    if (c) el.textContent = formatCount(c.t, c.d);
  }
  function runCounter(el) {
    var c = countSpec(el);
    if (!c) return;
    stopCounter(el);
    if (reduceMotion) { el.textContent = formatCount(c.t, c.d); return; }

    var duration = 1400;
    var start = null;
    el.textContent = formatCount(0, c.d);
    function tick(now) {
      if (typeof now !== 'number') now = Date.now(); // setTimeout fallback passes no timestamp
      if (start === null) start = now;
      var p = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      if (p < 1) {
        el.textContent = formatCount(c.t * eased, c.d);
        el._cgCountRaf = raf(tick);
      } else {
        el._cgCountRaf = null;
        el.textContent = formatCount(c.t, c.d);
      }
    }
    el._cgCountRaf = raf(tick);
  }
  /* take a counter out of the viewport observer: it is now driven explicitly */
  function forgetCounter(el) {
    if (counterIO) counterIO.unobserve(el);
    if (counterPending.length) counterPending = counterPending.filter(function (v) { return v !== el; });
  }
  function runCounters(root) {
    $$('.val[data-count]', root).forEach(function (el) {
      forgetCounter(el);
      runCounter(el);
    });
  }

  function initCounters() {
    // counters inside a hidden tab panel are left to runCounters() when that panel is activated
    var vals = $$('.val[data-count]').filter(function (el) {
      return !(el.closest && el.closest('[hidden]'));
    });
    if (!vals.length) return;

    if (reduceMotion || !hasIO) { vals.forEach(runCounter); return; }

    // never show the final number before the count: zero it up front (only on the animated path)
    vals.forEach(function (el) {
      var c = countSpec(el);
      if (c) el.textContent = formatCount(0, c.d);
    });

    counterPending = vals.slice();
    counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        forgetCounter(el);
        // start once the host card's staggered fade has begun so the count is seen from 0
        var host = el.closest ? el.closest('[data-delay]') : null;
        var wait = 0;
        if (host && !host.classList.contains('in')) {
          wait = (parseInt(host.getAttribute('data-delay'), 10) || 0) + 120;
        }
        stopCounter(el);
        el._cgCountWait = setTimeout(function () { el._cgCountWait = null; runCounter(el); }, wait);
      });
    }, { threshold: 0.5 });
    vals.forEach(function (el) { counterIO.observe(el); });

    // Safety net: a counter scrolled past without ever intersecting shows its final value
    scrollBus.add(function () {
      if (!counterPending.length) return;
      counterPending = counterPending.filter(function (el) {
        if (el.getBoundingClientRect().bottom < 0 && !(el.closest && el.closest('[hidden]'))) {
          if (counterIO) counterIO.unobserve(el);
          settleCounter(el);
          return false;
        }
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
    var videos = $$('.vframe video, .bento-video video');
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
      var frame = v.closest ? v.closest('.vframe, .bento-video') : v.parentElement;
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
     10 SEGMENTED CONTROLS
     One helper for every .seg (work tabs, gallery filters, proof tablist):
     the absolutely positioned .seg-ind is moved under the active .seg-btn.
     offsetLeft/offsetWidth ignore transforms, so a .seg that is still mid
     .reveal slide measures correctly. The position is written as an inline
     transform + width/height (and mirrored to --seg-x/--seg-w/--ind-x/--ind-w
     for CSS that prefers custom properties); .seg--ready marks a measured seg.
     ------------------------------------------------------------ */
  var SEG_ACTIVE = '.seg-btn.is-active, .seg-btn[aria-pressed="true"], .seg-btn[aria-selected="true"]';

  function segUpdate(seg, instant) {
    if (!seg) return;
    var ind = $('.seg-ind', seg);
    var btn = $(SEG_ACTIVE, seg);
    if (!ind || !btn || !seg.offsetWidth) return; // missing parts, or not rendered (hidden)
    var x = btn.offsetLeft, y = btn.offsetTop, w = btn.offsetWidth, h = btn.offsetHeight;
    var s = ind.style;
    if (instant) s.transition = 'none';
    s.left = '0px';
    s.top = '0px';
    s.width = w + 'px';
    s.height = h + 'px';
    s.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    s.setProperty('--seg-x', x + 'px');
    s.setProperty('--seg-w', w + 'px');
    s.setProperty('--ind-x', x + 'px');
    s.setProperty('--ind-w', w + 'px');
    seg.classList.add('seg--ready');
    if (instant) {
      void ind.offsetWidth; // commit the jump before transitions come back
      raf(function () { s.transition = ''; });
    }
  }
  function segOf(el) { return el && el.closest ? el.closest('.seg') : null; }

  function initSeg() {
    var segs = $$('.seg');
    if (!segs.length) return;
    function all() { segs.forEach(function (seg) { segUpdate(seg, true); }); }
    all();
    var again = throttleRaf(all);
    window.addEventListener('resize', again, { passive: true });
    window.addEventListener('load', again);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(again).catch(function () {});
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(again); // wraps, font swaps, count badges changing width
      segs.forEach(function (seg) { ro.observe(seg); });
    }
  }

  /* ------------------------------------------------------------
     11 WORK TABS
     aria-pressed filter buttons (not role=tab) inside a .seg
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
        segUpdate(segOf(tab));
        groups.forEach(function (g) {
          var show = filter === 'all' || g.getAttribute('data-group') === filter;
          g.classList.toggle('is-hidden', !show);
        });
        scrollBus.request();
      });
    });
  }

  /* ------------------------------------------------------------
     12 PROOF TABS
     WAI-ARIA tabs: click or ←/→/Home/End (automatic activation), roving
     tabindex, aria-selected, hidden on inactive panels. The outgoing panel
     fades out (~160ms), the incoming one fades in with its cards staggering
     60ms apart and its counters restarting from 0. Panel cards carry no
     .reveal, so a panel hidden at load never depends on the reveal observer.
     ------------------------------------------------------------ */
  function initProofTabs() {
    var root = $('.proof-tabs');
    if (!root) return;
    var list = $('[role="tablist"]', root);
    var tabs = $$('.proof-tab', root);
    if (!list || !tabs.length) return;

    function panelOf(tab) {
      var id = tab.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    }
    var panels = tabs.map(panelOf);

    var current = 0;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('aria-selected') === 'true') { current = i; break; }
    }
    var shown = panels[current]; // the panel that is (or is about to be) on screen

    function setTabs() {
      tabs.forEach(function (t, k) {
        var on = k === current;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        t.classList.toggle('is-active', on);
      });
    }
    function snapPanels() {
      panels.forEach(function (p) { if (p) p.hidden = p !== shown; });
    }
    setTabs();
    snapPanels();

    var anims = [];
    var timer = null;
    function stopMotion() {
      if (timer) { clearTimeout(timer); timer = null; }
      cancelAll(anims);
    }

    function cardsOf(panel) {
      var cards = $$('.stat', panel);
      if (!cards.length) {
        var grid = $('.proof-grid', panel);
        cards = grid ? Array.prototype.slice.call(grid.children) : [];
      }
      return cards;
    }

    function showPanel(panel) {
      panel.hidden = false;
      if (canAnimate(panel)) {
        anims.push(panel.animate(
          [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
          { duration: 260, easing: EASE_OUT }
        ));
        cardsOf(panel).forEach(function (card, k) {
          anims.push(card.animate(
            [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }],
            { duration: 520, delay: k * 60, easing: EASE_OUT, fill: 'backwards' }
          ));
        });
      }
      runCounters(panel);
      scrollBus.request();
    }

    function select(idx, moveFocus) {
      idx = (idx + tabs.length) % tabs.length;
      if (moveFocus) tabs[idx].focus();
      if (idx === current) return;
      current = idx;
      setTabs();
      segUpdate(list);

      // an interrupted switch snaps to its target first, so at most one panel is ever visible
      stopMotion();
      snapPanels();
      var outgoing = shown;
      var incoming = panels[idx];
      shown = incoming;
      if (!incoming) { if (outgoing) outgoing.hidden = true; return; }
      if (!outgoing || outgoing === incoming || !canAnimate(outgoing)) {
        if (outgoing && outgoing !== incoming) outgoing.hidden = true;
        showPanel(incoming);
        return;
      }
      anims.push(outgoing.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }],
        { duration: 160, easing: EASE_IN, fill: 'forwards' }
      ));
      timer = setTimeout(function () {
        timer = null;
        outgoing.hidden = true;
        cancelAll(anims); // drop the out fill now that the panel is hidden
        showPanel(incoming);
      }, 160);
    }

    tabs.forEach(function (tab, k) {
      tab.addEventListener('click', function () { select(k, false); });
    });
    list.addEventListener('keydown', function (e) {
      var tab = e.target.closest ? e.target.closest('.proof-tab') : null;
      var k = tabs.indexOf(tab);
      if (k === -1) return;
      var to = null;
      switch (e.key) {
        case 'ArrowRight': case 'Right': to = k + 1; break;
        case 'ArrowLeft': case 'Left': to = k - 1; break;
        case 'Home': to = 0; break;
        case 'End': to = tabs.length - 1; break;
        default: return;
      }
      e.preventDefault();
      select(to, true);
    });
  }

  /* ------------------------------------------------------------
     13 GALLERY
     .gal-filter[data-filter] buttons filter .gal-item[data-cat]. Counts and
     the status line are computed from the items. FLIP via the Web Animations
     API: leaving items fade/scale out and then get [hidden], staying items
     glide from their old rect, entering items fade/scale in 40ms apart.
     Rapid clicks cancel everything in flight and snap to the last target
     first, so no item is ever left at opacity 0 or with a stray transform.
     [data-gal-filter] links scroll to #gallery and activate that filter.
     ------------------------------------------------------------ */
  var gallery = null; // { visible(): items shown by the current filter } for the lightbox

  function initGallery() {
    var grid = $('.gal-grid');
    if (!grid) return;
    var items = $$('.gal-item', grid);
    if (!items.length) return;
    var filters = $$('.gal-filter');
    var seg = filters.length ? segOf(filters[0]) : null;
    var status = $('.gal-status');
    var total = items.length;

    function matches(it, f) { return f === 'all' || it.getAttribute('data-cat') === f; }
    function countFor(f) { return items.filter(function (it) { return matches(it, f); }).length; }
    function setStatus(n) {
      if (status) status.textContent = 'Showing ' + n + ' of ' + total + ' screenshot' + (total === 1 ? '' : 's');
    }

    var current = 'all';
    filters.forEach(function (btn) {
      var f = btn.getAttribute('data-filter') || 'all';
      var c = $('.gal-count', btn);
      if (c) c.textContent = String(countFor(f));
      if (btn.getAttribute('aria-pressed') === 'true') current = f;
    });

    // un-hide an item; one that was hidden gets .in so its .reveal can never keep it at opacity 0
    function showItem(it) {
      if (!it.hidden) return;
      it.hidden = false;
      it.style.transitionDelay = '';
      it.classList.add('in');
    }
    function snap(f) {
      items.forEach(function (it) {
        if (matches(it, f)) showItem(it); else it.hidden = true;
      });
    }
    function setButtons(f) {
      filters.forEach(function (btn) {
        var on = (btn.getAttribute('data-filter') || 'all') === f;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (seg) segUpdate(seg);
    }

    snap(current);
    setButtons(current);
    setStatus(countFor(current));

    var anims = [];
    var timer = null;
    function stopMotion() {
      if (timer) { clearTimeout(timer); timer = null; }
      cancelAll(anims);
    }

    function apply(f, opts) {
      f = f || 'all';
      if (!filters.some(function (b) { return (b.getAttribute('data-filter') || 'all') === f; }) && f !== 'all') return;
      stopMotion();
      snap(current); // finish any interrupted run at its target state
      setButtons(f);
      setStatus(countFor(f));
      if (f === current) return;
      current = f;

      var before = items.filter(function (it) { return !it.hidden; });
      var leaving = before.filter(function (it) { return !matches(it, f); });
      var staying = before.filter(function (it) { return matches(it, f); });
      var entering = items.filter(function (it) { return it.hidden && matches(it, f); });

      if ((opts && opts.instant) || !canAnimate(grid)) {
        snap(f);
        scrollBus.request();
        return;
      }

      function settle() {
        timer = null;
        var first = staying.map(function (it) { return it.getBoundingClientRect(); });
        cancelAll(anims); // leaving fills end here, together with [hidden]
        leaving.forEach(function (it) { it.hidden = true; });
        entering.forEach(showItem);

        staying.forEach(function (it, k) {
          var last = it.getBoundingClientRect();
          var dx = first[k].left - last.left;
          var dy = first[k].top - last.top;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
          anims.push(it.animate(
            [{ transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)' }, { transform: 'none' }],
            { duration: 560, easing: EASE_OUT }
          ));
        });
        entering.forEach(function (it, k) {
          anims.push(it.animate(
            [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }],
            { duration: 460, delay: 60 + k * 40, easing: EASE_OUT, fill: 'backwards' }
          ));
        });
        scrollBus.request();
      }

      if (!leaving.length) { settle(); return; }
      leaving.forEach(function (it) {
        var from = window.getComputedStyle(it).opacity; // an unrevealed item stays at 0, no flash
        anims.push(it.animate(
          [{ opacity: from, transform: 'none' }, { opacity: 0, transform: 'scale(.92)' }],
          { duration: 180, easing: EASE_IN, fill: 'forwards' }
        ));
      });
      timer = setTimeout(settle, 180);
    }

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () { apply(btn.getAttribute('data-filter') || 'all'); });
    });

    gallery = {
      visible: function () { return items.filter(function (it) { return matches(it, current); }); }
    };

    // Deep links from #proof: listeners sit on the links themselves, so they run
    // (and preventDefault) before the document-level anchor handler (section 19)
    var section = $('#gallery') || grid;
    $$('[data-gal-filter]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (modified(e)) return;
        e.preventDefault();
        var r = grid.getBoundingClientRect();
        var onScreen = r.bottom > 0 && r.top < window.innerHeight;
        apply(link.getAttribute('data-gal-filter') || 'all', { instant: !onScreen });
        try {
          section.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
        } catch (err) {
          section.scrollIntoView(true);
        }
        if (section.id && window.history && history.pushState) {
          try { history.pushState(null, '', '#' + section.id); } catch (err) { /* file:// or sandboxed */ }
        }
        focusQuiet($('.gal-filter[aria-pressed="true"]') || section);
      });
    });
  }

  /* ------------------------------------------------------------
     14 LIGHTBOX
     Native <dialog>.showModal() (focus containment, Esc, ::backdrop). Any
     a[data-lb-group] opens it; prev/next stay inside the clicked link's
     group ("gallery" follows the active filter via gallery.visible(),
     "stills" is every static creative). ←/→, horizontal swipe, swipe-down
     on the image, backdrop click and Esc (cancel → animated close). FLIP
     "shared element" zoom from the thumbnail (scale-fade when off-screen),
     slide/cross-fade on navigation, body scroll locked via body.lb-open,
     focus returns to the opener. Without HTMLDialogElement the links simply
     open the full image.
     ------------------------------------------------------------ */
  function initLightbox() {
    var dlg = $('#lightbox');
    if (!dlg || !$('a[data-lb-group]')) return;
    if (typeof window.HTMLDialogElement !== 'function' || typeof dlg.showModal !== 'function') return;
    var img = $('.lb-img', dlg);
    if (!img) return;
    var fig = $('.lb-figure', dlg);
    var chip = $('.lb-chip', dlg);
    var title = $('.lb-title', dlg);
    var desc = $('.lb-desc', dlg);
    var count = $('.lb-count', dlg);
    var bar = $('.lb-bar', dlg);
    var btnPrev = $('.lb-prev', dlg);
    var btnNext = $('.lb-next', dlg);
    var btnClose = $('.lb-close', dlg);
    var chrome = [btnClose, $('.lb-cap', dlg), bar].filter(Boolean);
    var docEl = document.documentElement;
    var body = document.body;

    var list = [], index = 0, opener = null, closing = false;
    var imgAnims = [], uiAnims = [];
    var navTimer = null, closeTimer = null, navToken = 0;
    var saved = null;
    var preloaded = {};

    // horizontal swipes stay with the page script; while the visual viewport is pinch-zoomed,
    // hand touch back to the browser so one-finger panning still works (low-vision users rely on it)
    function zoomed() { return !!(window.visualViewport && window.visualViewport.scale > 1.01); }
    function syncTouch() {
      var z = zoomed();
      dlg.style.touchAction = z ? 'auto' : 'pan-y pinch-zoom';
      img.style.touchAction = z ? 'auto' : 'pinch-zoom';
    }
    syncTouch();
    if (window.visualViewport) window.visualViewport.addEventListener('resize', syncTouch);

    function thumbImg(it) { return $('.gal-thumb img', it) || $('img', it); }
    function thumbFrame(it) { return $('.gal-thumb', it) || thumbImg(it); }
    function groupOf(it) { return (it && it.getAttribute('data-lb-group')) || ''; }
    function visibleItems(it) {
      var g = groupOf(it);
      if (g === 'gallery' && gallery) return gallery.visible();
      return $$('a[data-lb-group]').filter(function (x) {
        return groupOf(x) === g && !(x.closest && x.closest('[hidden], .is-hidden'));
      });
    }
    function onScreen(r) {
      return !!r && r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 &&
        r.top < window.innerHeight && r.left < window.innerWidth;
    }
    function stopMotion() {
      cancelAll(imgAnims);
      cancelAll(uiAnims);
      if (navTimer) { clearTimeout(navTimer); navTimer = null; }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    }

    function preload(it) {
      var href = it && it.getAttribute('href');
      if (!href || preloaded[href]) return;
      var im = new Image();
      im.decoding = 'async';
      im.src = href;
      preloaded[href] = im;
    }

    function fill() {
      var it = list[index];
      var t = thumbImg(it);
      var w = t && t.getAttribute('width');
      var h = t && t.getAttribute('height');
      if (w) img.setAttribute('width', w); else img.removeAttribute('width');
      if (h) img.setAttribute('height', h); else img.removeAttribute('height');
      img.setAttribute('src', it.getAttribute('href') || (t && t.getAttribute('src')) || '');
      img.alt = t ? (t.getAttribute('alt') || '') : '';

      if (chip) {
        var mods = [];
        var gc = $('.gal-chip', it);
        if (gc) {
          Array.prototype.slice.call(gc.classList).forEach(function (c) {
            if (/^chip--/.test(c)) mods.push(c);
          });
        }
        chip.className = 'chip lb-chip' + (mods.length ? ' ' + mods.join(' ') : '');
        chip.textContent = it.getAttribute('data-platform') || '';
        chip.hidden = !chip.textContent;
      }
      if (title) title.textContent = it.getAttribute('data-title') || (t && t.getAttribute('alt')) || 'Screenshot';
      if (desc) desc.textContent = it.getAttribute('data-desc') || '';
      if (count) count.textContent = (index + 1) + ' / ' + list.length;
      var multi = list.length > 1;
      if (btnPrev) btnPrev.hidden = !multi;
      if (btnNext) btnNext.hidden = !multi;
      if (count) count.hidden = !multi;
      if (multi) {
        preload(list[(index + 1) % list.length]);
        preload(list[(index - 1 + list.length) % list.length]);
      }
    }

    /* FLIP keyframes between a thumbnail rect and the lightbox image box.
       The thumbnail shows the image object-fit:cover from the top-left; the
       lightbox shows it object-fit:contain, centred. The image is scaled from
       its top-left corner and clipped to the part the thumbnail showed. */
    function zoomFrames(from, box, radius) {
      var nw = parseFloat(img.getAttribute('width')) || img.naturalWidth || box.width;
      var nh = parseFloat(img.getAttribute('height')) || img.naturalHeight || box.height;
      var ar = nw / nh;
      var cw, ch;
      if (box.width / box.height > ar) { ch = box.height; cw = ch * ar; } else { cw = box.width; ch = cw / ar; }
      var ox = (box.width - cw) / 2, oy = (box.height - ch) / 2;
      var s = Math.max(from.width / cw, from.height / ch);
      var vw = from.width / s, vh = from.height / s;
      var tx = from.left - box.left - ox * s;
      var ty = from.top - box.top - oy * s;
      var px = function (n) { return n.toFixed(2) + 'px'; };
      var clipFrom = 'inset(' + px(oy) + ' ' + px(box.width - ox - vw) + ' ' + px(box.height - oy - vh) + ' ' + px(ox) + ' round ' + px(radius / s) + ')';
      var clipTo = 'inset(' + px(oy) + ' ' + px(box.width - ox - cw) + ' ' + px(box.height - oy - ch) + ' ' + px(ox) + ' round 0px)';
      return [
        { transformOrigin: '0 0', transform: 'translate(' + px(tx) + ',' + px(ty) + ') scale(' + s.toFixed(4) + ')', clipPath: clipFrom },
        { transformOrigin: '0 0', transform: 'none', clipPath: clipTo }
      ];
    }
    function radiusOf(it) {
      var r = parseFloat(window.getComputedStyle(it).borderTopLeftRadius);
      return isNaN(r) ? 0 : r;
    }
    function fadeUi(show, duration, delay) {
      chrome.forEach(function (el) {
        uiAnims.push(el.animate(show ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
          { duration: duration, delay: delay || 0, easing: show ? 'ease-out' : EASE_IN, fill: show ? 'backwards' : 'forwards' }));
      });
      try {
        uiAnims.push(dlg.animate(show ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
          { duration: duration, easing: show ? 'ease-out' : EASE_IN, fill: show ? 'none' : 'forwards', pseudoElement: '::backdrop' }));
      } catch (err) { /* no pseudo-element animations: the backdrop simply appears */ }
    }

    function lockScroll() {
      var gap = window.innerWidth - docEl.clientWidth;
      saved = { overflow: docEl.style.overflow, pad: body.style.paddingRight };
      body.classList.add('lb-open');
      docEl.style.overflow = 'hidden';
      if (gap > 0) body.style.paddingRight = gap + 'px'; // no layout jump where the scrollbar was
    }
    function unlockScroll() {
      body.classList.remove('lb-open');
      if (saved) {
        docEl.style.overflow = saved.overflow;
        body.style.paddingRight = saved.pad;
        saved = null;
      }
    }

    function open(it) {
      if (dlg.open) return;
      list = visibleItems(it);
      index = list.indexOf(it);
      if (index === -1) { list = [it]; index = 0; }
      opener = it;
      closing = false;
      stopMotion();
      img.loading = 'eager'; // lazy in the markup so the closed dialog fetches nothing
      fill();
      lockScroll();
      try { dlg.showModal(); } catch (err) { unlockScroll(); window.location.href = it.href; return; }

      if (!canAnimate(img)) return;
      fadeUi(true, 280, 140);
      var token = ++navToken;
      // hold the image invisible until it is decoded so the zoom never starts on an empty frame
      if (!(img.complete && img.naturalWidth)) {
        imgAnims.push(img.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' }));
      }
      whenDecoded(function () {
        if (token !== navToken || !dlg.open || closing) return;
        cancelAll(imgAnims);
        var frame = thumbFrame(it);
        var from = frame ? frame.getBoundingClientRect() : null;
        var box = img.getBoundingClientRect();
        if (onScreen(from) && box.width && box.height) {
          imgAnims.push(img.animate(zoomFrames(from, box, radiusOf(it)), { duration: 460, easing: EASE_OUT }));
        } else {
          imgAnims.push(img.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }],
            { duration: 300, easing: EASE_OUT }));
        }
      });
    }

    function requestClose() {
      if (!dlg.open || closing) return;
      closing = true;
      if (!canAnimate(img)) { dlg.close(); return; }
      stopMotion();
      var it = list[index];
      var frame = it && !it.hidden ? thumbFrame(it) : null;
      var to = frame ? frame.getBoundingClientRect() : null;
      var box = img.getBoundingClientRect();
      var duration;
      if (onScreen(to) && box.width && box.height) {
        duration = 380;
        var k = zoomFrames(to, box, radiusOf(it));
        imgAnims.push(img.animate([k[1], k[0]], { duration: duration, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' }));
      } else {
        duration = 220;
        imgAnims.push(img.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }],
          { duration: duration, easing: EASE_IN, fill: 'forwards' }));
      }
      fadeUi(false, Math.min(duration, 240), 0);
      closeTimer = setTimeout(function () { closeTimer = null; if (dlg.open) dlg.close(); }, duration);
    }

    // every way of closing (animated, Esc pressed twice, form method=dialog) ends here
    dlg.addEventListener('close', function () {
      stopMotion();
      closing = false;
      navToken++;
      unlockScroll();
      var o = opener;
      opener = null;
      if (o && document.documentElement.contains(o)) focusQuiet(o);
    });
    dlg.addEventListener('cancel', function (e) {
      e.preventDefault(); // Esc: play the close animation instead of vanishing
      requestClose();
    });

    function whenDecoded(cb) {
      var done = false;
      function go() { if (!done) { done = true; cb(); } }
      if (img.complete && img.naturalWidth) { go(); return; }
      if (typeof img.decode === 'function') img.decode().then(go, go);
      else img.addEventListener('load', go, { once: true });
      setTimeout(go, 400); // never wait on a slow image to show the next one
    }

    function nav(dir) {
      if (!dlg.open || closing || list.length < 2) return;
      index = (index + dir + list.length) % list.length;
      var token = ++navToken;
      if (!canAnimate(img)) { fill(); return; }
      cancelAll(imgAnims);
      if (navTimer) clearTimeout(navTimer);
      imgAnims.push(img.animate(
        [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 48) + 'px)' }],
        { duration: 140, easing: EASE_IN, fill: 'forwards' }
      ));
      navTimer = setTimeout(function () {
        navTimer = null;
        if (token !== navToken) return;
        fill();
        whenDecoded(function () {
          if (token !== navToken || !dlg.open) return;
          cancelAll(imgAnims);
          imgAnims.push(img.animate(
            [{ opacity: 0, transform: 'translateX(' + (dir * 48) + 'px)' }, { opacity: 1, transform: 'none' }],
            { duration: 300, easing: EASE_OUT }
          ));
        });
      }, 140);
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || modified(e)) return;
      var it = e.target.closest ? e.target.closest('a[data-lb-group]') : null;
      if (!it) return;
      e.preventDefault();
      open(it);
    });

    if (btnPrev) btnPrev.addEventListener('click', function () { nav(-1); });
    if (btnNext) btnNext.addEventListener('click', function () { nav(1); });
    if (btnClose) btnClose.addEventListener('click', requestClose);

    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'Right') { e.preventDefault(); nav(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'Left') { e.preventDefault(); nav(-1); }
    });

    // Swipe (touch / pen): |dx| > 50px horizontal → prev/next; dy > 80px down → close
    var sx = null, sy = 0, sid = null, swipedAt = 0;
    dlg.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' || zoomed()) return;
      sx = e.clientX; sy = e.clientY; sid = e.pointerId;
    });
    dlg.addEventListener('pointerup', function (e) {
      if (sx === null || e.pointerId !== sid) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        swipedAt = Date.now();
        nav(dx < 0 ? 1 : -1);
      } else if (dy > 80 && dy > Math.abs(dx) * 1.2) {
        swipedAt = Date.now();
        requestClose();
      }
    });
    dlg.addEventListener('pointercancel', function () { sx = null; });

    // Backdrop / empty-area click closes (the ::backdrop and the dialog's own box report the dialog as target)
    dlg.addEventListener('click', function (e) {
      if (Date.now() - swipedAt < 400) return; // the click that ends a swipe
      var t = e.target;
      if (t === dlg || t === fig || t === bar) requestClose();
    });
  }

  /* ------------------------------------------------------------
     15 TIMELINE
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
     16 FAQ
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
     17 CONTACT FORM
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
     18 DOCK, TO-TOP, FOOTER YEAR
     ------------------------------------------------------------ */
  function initFloatingUi() {
    // hidden while a hero / page banner is on screen, and while a CTA that does
    // the same job (#contact, .cta-band) is visible; contact.html has no dock at all
    var dock = $('.cta-dock');
    var hiders = $$('.hero, .page-hero, #contact, .cta-band');
    if (dock) {
      if (!hiders.length) {
        dock.classList.add('show');
      } else if (hasIO) {
        var onScreen = hiders.map(function () { return false; });
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var k = hiders.indexOf(entry.target);
            if (k !== -1) onScreen[k] = entry.isIntersecting;
          });
          dock.classList.toggle('show', onScreen.indexOf(true) === -1);
        }, { threshold: 0 });
        hiders.forEach(function (h) { io.observe(h); });
      } else {
        scrollBus.add(function () {
          var any = hiders.some(function (h) {
            var r = h.getBoundingClientRect();
            return r.bottom > 0 && r.top < window.innerHeight;
          });
          dock.classList.toggle('show', !any);
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
     19 IN-PAGE ANCHORS
     Smooth-scroll same-page links (#id, or this-page.html#id from the footer) from JS so the motion
     prefers-reduced-motion even if the stylesheet's scroll-behavior
     is left at its default; focus moves to the target for keyboard users.
     ------------------------------------------------------------ */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
      if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;
      var url;
      try { url = new URL(a.href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      var id = decodeURIComponent(url.hash.slice(1));
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
     20 TICKER PAUSE
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
     21 JUMP-CHIPS
     .jumpnav a[href^="#"] → sections. The chip for the section under the
     sticky bars gets aria-current="location"; none while the banner is in
     view. At the very bottom the last visible section wins (short final
     blocks never reach the line). On narrow screens the active chip is
     scrolled into view inside its row, never the page.
     ------------------------------------------------------------ */
  function initJumpnav() {
    var bar = $('.jumpnav');
    if (!bar) return;
    var row = $('.jumpnav-list', bar) || bar;
    var items = $$('a[href^="#"]', bar).map(function (a) {
      return { a: a, sec: document.getElementById(decodeURIComponent((a.getAttribute('href') || '').slice(1))) };
    }).filter(function (it) { return it.sec; });
    if (!items.length) return;

    var current = null;
    function setActive(it) {
      if (it === current) return;
      current = it;
      items.forEach(function (x) {
        if (x === it) x.a.setAttribute('aria-current', 'location');
        else x.a.removeAttribute('aria-current');
      });
      if (!it || row.scrollWidth <= row.clientWidth + 1) return;
      var rr = row.getBoundingClientRect();
      var ar = it.a.getBoundingClientRect();
      if (ar.left >= rr.left + 8 && ar.right <= rr.right - 8) return;
      var left = row.scrollLeft + (ar.left - rr.left) - (rr.width - ar.width) / 2;
      try { row.scrollTo({ left: left, behavior: reduceMotion ? 'instant' : 'smooth' }); } catch (err) { row.scrollLeft = left; }
    }

    scrollBus.add(function (y) {
      // the sticky slot, not the box: .nav--hidden slides the chips up (styles.css 23)
      // but scroll-margin-top still parks targets under nav + chips
      var line = (parseFloat(window.getComputedStyle(bar).top) || 0) + bar.offsetHeight + 24;
      var active = null;
      for (var i = 0; i < items.length; i++) {
        if (items[i].sec.getBoundingClientRect().top <= line) active = items[i];
      }
      if (y + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        var last = items[items.length - 1];
        if (last.sec.getBoundingClientRect().top < window.innerHeight) active = last;
      }
      setActive(active);
    });
  }

  /* ------------------------------------------------------------
     22 TOUCH :ACTIVE
     iOS Safari applies :active (styles.css 27 press states) only when a
     touchstart listener exists; a passive no-op is enough.
     ------------------------------------------------------------ */
  function initTouch() {
    document.addEventListener('touchstart', function () {}, { passive: true });
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
    feature('jumpnav', initJumpnav);
    feature('rotator', initRotator);
    feature('parallax', initParallax);
    feature('cards', initCards);
    feature('videos', initVideos);
    feature('seg', initSeg);           // after reveal: measures .seg-btn offsets
    feature('workTabs', initWorkTabs);
    feature('proofTabs', initProofTabs);
    feature('gallery', initGallery);
    feature('lightbox', initLightbox);
    feature('timeline', initTimeline);
    feature('faq', initFaq);
    feature('contactForm', initContactForm);
    feature('floatingUi', initFloatingUi);
    feature('anchors', initAnchors);
    feature('ticker', initTicker);
    feature('touch', initTouch);
    scrollBus.request();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
