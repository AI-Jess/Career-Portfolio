// Site-wide behaviour: theme toggle, navigation state, scroll reveals, tilt cards, count-up numbers.
// Everything here is progressive enhancement: pages read fine without it.

const root = document.documentElement;
(window as any).__siteReady = true;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Theme toggle (light is the default; choice is remembered) ---------- */
const themeBtn = document.querySelector<HTMLButtonElement>('.theme-toggle');
const syncTheme = () => {
  const label = root.getAttribute('data-theme') === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  themeBtn?.setAttribute('aria-label', label);
  themeBtn?.setAttribute('title', label);
};
syncTheme();
themeBtn?.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: still works for this page view */ }
  syncTheme();
  window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
});

/* ---------- Mobile menu ---------- */
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-toggle');
const setMenu = (open: boolean) => {
  if (open) root.setAttribute('data-menu', 'open'); else root.removeAttribute('data-menu');
  menuBtn?.setAttribute('aria-expanded', String(open));
  menuBtn?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
menuBtn?.addEventListener('click', () => setMenu(root.getAttribute('data-menu') !== 'open'));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.matchMedia('(min-width: 761px)').addEventListener('change', () => setMenu(false));

/* ---------- Scroll-linked state ----------
   - nav switches to its "over dark" look while a stage section is under it
   - [data-scrub] elements get --p (0..1): how far a pinned section has been scrolled through
   - [data-progress] elements get --p (0..1): how far the element has travelled up the viewport */
const stage = document.querySelector<HTMLElement>('[data-stage]');
const scrubs = Array.from(document.querySelectorAll<HTMLElement>('[data-scrub]'));
const progs = Array.from(document.querySelectorAll<HTMLElement>('[data-progress]'));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let ticking = false;
function onScroll() {
  ticking = false;
  const vh = window.innerHeight;
  if (stage) {
    const navH = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 56;
    root.setAttribute('data-nav', stage.getBoundingClientRect().bottom > navH * 0.6 ? 'on-dark' : 'default');
  }
  for (const el of scrubs) {
    const r = el.getBoundingClientRect();
    const span = Math.max(1, r.height - vh);
    const p = clamp(-r.top / span);
    el.style.setProperty('--p', p.toFixed(4));
    (el as any).__p = p;
  }
  for (const el of progs) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--p', clamp((vh * 0.85 - r.top) / Math.max(1, r.height)).toFixed(4));
  }
}
const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
window.addEventListener('scroll', requestScroll, { passive: true });
window.addEventListener('resize', requestScroll);
onScroll();

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reduced || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-in'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  reveals.forEach((el) => io.observe(el));
}

/* ---------- Tilt cards (mouse only) ---------- */
if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('.tilt').forEach((el) => {
    const max = parseFloat(el.dataset.tilt || '5');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add('is-tilting');
      el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- Count-up numbers ----------
   Animates every number inside the text ("9,900+", "~19", "800–1,650") from 0 to its value. */
const counters = document.querySelectorAll<HTMLElement>('[data-count]');
if (!reduced && 'IntersectionObserver' in window) {
  const fmt = (n: number, useComma: boolean) => (useComma ? Math.round(n).toLocaleString('en-US') : String(Math.round(n)));
  const run = (el: HTMLElement) => {
    const final = el.textContent ?? '';
    const parts = final.split(/(\d[\d,]*)/);
    const targets = parts.map((s) => (/^\d/.test(s) ? { v: parseInt(s.replace(/,/g, ''), 10), comma: s.includes(',') } : null));
    if (!targets.some((t) => t && t.v > 0)) return;
    el.style.minWidth = `${el.getBoundingClientRect().width}px`;
    const t0 = performance.now(), dur = 1400;
    const step = (now: number) => {
      const k = clamp((now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = parts.map((s, i) => (targets[i] ? fmt(targets[i]!.v * e, targets[i]!.comma) : s)).join('');
      if (k < 1) requestAnimationFrame(step); else { el.textContent = final; el.style.minWidth = ''; }
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { run(e.target as HTMLElement); io.unobserve(e.target); }
  }, { threshold: 0.6 });
  counters.forEach((el) => io.observe(el));
}
