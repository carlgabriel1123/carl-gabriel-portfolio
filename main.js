// Carl Gabriel — interactions
// One orchestrated moment (hero load snap), quiet everywhere else.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero load sequence
window.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('loaded'));
});

// Scroll reveals
const revealIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      const delay = reduceMotion ? 0 : (e.target.dataset.delay || 0);
      e.target.style.transitionDelay = `${delay}ms`;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    }
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => revealIO.observe(el));

// Stagger reel tiles by index within their track
document.querySelectorAll('.reel-track').forEach(track => {
  [...track.children].forEach((tile, i) => { tile.dataset.delay = i * 70; });
});

// Videos: play only while on screen; progress bar mirrors playback.
const videoIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = e.target;
    if (e.isIntersecting && !reduceMotion) {
      v.muted = true; // required for inline autoplay on iOS/Android
      v.play().catch(() => {}); // if blocked (Low Power Mode etc.), the poster stays visible
    } else {
      v.pause();
    }
  }
}, { threshold: 0.35 });

document.querySelectorAll('.vframe video').forEach(v => {
  videoIO.observe(v);
  const bar = v.parentElement.querySelector('.vframe-bar i');
  if (bar) {
    v.addEventListener('timeupdate', () => {
      if (v.duration) bar.style.width = `${(v.currentTime / v.duration) * 100}%`;
    });
  }
  // Tap to toggle on touch devices
  v.addEventListener('click', () => { v.paused ? v.play() : v.pause(); });
});

// Page progress bar — the page itself plays like a clip
const pagebar = document.querySelector('.pagebar i');
let barTick = false;
function paintBar() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  pagebar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
  barTick = false;
}
window.addEventListener('scroll', () => {
  if (!barTick) { barTick = true; requestAnimationFrame(paintBar); }
}, { passive: true });
paintBar();

// Scrollspy — light up the section you're in
const navLinks = [...document.querySelectorAll('.nav-links a')];
const spyIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('active', a.hash === `#${e.target.id}`));
    }
  }
}, { rootMargin: '-40% 0px -55% 0px' });
navLinks.forEach(a => {
  const sec = document.querySelector(a.hash);
  if (sec) spyIO.observe(sec);
});

// Hero tilt — frame leans toward the cursor (fine pointers only)
const heroFrame = document.querySelector('.hero-frame');
const heroGrid = document.querySelector('.hero-grid');
if (heroFrame && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  heroGrid.addEventListener('mousemove', (e) => {
    heroFrame.classList.remove('snap-in'); // hand transform control to the tilt
    const r = heroFrame.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
    const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
    heroFrame.style.transform = `perspective(900px) rotateY(${dx * 7}deg) rotateX(${dy * -7}deg)`;
  });
  heroGrid.addEventListener('mouseleave', () => { heroFrame.style.transform = ''; });
}

// Proof stats — count up once when they scroll into view
const countIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    const target = parseFloat(el.dataset.count) || 0;
    countIO.unobserve(el);
    if (reduceMotion) { el.textContent = target; continue; }
    const dur = 1100, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
    };
    requestAnimationFrame(tick);
  }
}, { threshold: 0.6 });
document.querySelectorAll('.val[data-count]').forEach(el => countIO.observe(el));

// Sticky mobile booking dock — appears once the hero scrolls away
const ctaDock = document.querySelector('.cta-dock');
const heroSection = document.getElementById('top');
if (ctaDock && heroSection) {
  new IntersectionObserver((entries) => {
    for (const e of entries) ctaDock.classList.toggle('show', !e.isIntersecting);
  }, { threshold: 0 }).observe(heroSection);
}

// Work filter tabs — show all / video / static
const workTabs = [...document.querySelectorAll('.work-tab')];
const workGroups = [...document.querySelectorAll('.work-group')];
if (workTabs.length) {
  workTabs.forEach(tab => tab.addEventListener('click', () => {
    const f = tab.dataset.filter;
    workTabs.forEach(t => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-pressed', String(on));
    });
    workGroups.forEach(g => g.classList.toggle('is-hidden', !(f === 'all' || g.dataset.group === f)));
  }));
}

// Contact form — opens the visitor's email app with a prefilled message
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = n => (contactForm.elements[n] ? contactForm.elements[n].value.trim() : '');
    const name = val('name'), email = val('email'), store = val('store'), message = val('message');
    const note = contactForm.querySelector('.cf-note');
    if (!name || !email || !message) {
      if (note) { note.style.color = 'var(--rose)'; note.textContent = 'Please add your name, email, and a short message.'; }
      return;
    }
    const subject = `Strategy call — ${store || name}`;
    const body = `Name: ${name}\nEmail: ${email}\nStore / website: ${store || '—'}\n\n${message}`;
    if (note) { note.style.color = 'var(--win)'; note.textContent = 'Opening your email app…'; }
    window.location.href = `mailto:piramocarlgabriel@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
