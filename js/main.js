/* ============================================================
   NGU SITE BEHAVIOUR
   1. Mobile menu
   2. Draggable photo stickers (hero + 404 page)
   3. Offline support (sw-root.js)
   ============================================================ */

/* ---------- 1. Mobile menu ---------- */
(function(){
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  const behind = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.skip-link')];

  function setMenu(open){
    const was = links.classList.contains('open');
    if (open === was) return;
    links.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Цэс хаах' : 'Цэс нээх');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.body.style.overflow = open ? 'hidden' : '';
    // Keep keyboard and screen-reader focus inside the open menu
    behind.forEach(n => { if (n) { if (open) n.setAttribute('inert', ''); else n.removeAttribute('inert'); } });
    if (open) { const first = links.querySelector('a'); if (first) first.focus(); }
    else toggle.focus();
  }
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 1060) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
})();

/* ---------- 1b. Highlight the section you are reading (homepage) ----------
   Marks the matching menu link with aria-current="location". */
(function(){
  if (!('IntersectionObserver' in window)) return;
  const norm = p => p.replace(/index\.html$/, '');
  const map = new Map();
  document.querySelectorAll('.nav-links a[href*="#"]').forEach(a => {
    let u; try { u = new URL(a.href, location.href); } catch (e) { return; }
    if (norm(u.pathname) !== norm(location.pathname) || !u.hash) return;
    const target = document.querySelector(u.hash);
    if (target) map.set(target, a);
  });
  if (!map.size) return;
  function mark(a){
    map.forEach(l => { if (l === a) l.setAttribute('aria-current', 'location'); else l.removeAttribute('aria-current'); });
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) mark(map.get(en.target)); });
  }, { rootMargin: '-35% 0px -60% 0px' });
  map.forEach((a, t) => io.observe(t));
  // Back at the hero or in a section without a menu link: clear the highlight
  const hero = document.getElementById('top');
  if (hero) new IntersectionObserver(es => { if (es[0].isIntersecting) mark(null); }, { rootMargin: '-35% 0px -60% 0px' }).observe(hero);
})();

/* ---------- 2. Draggable stickers ----------
   Every .sticker inside a [data-board] can be dragged with a
   mouse or finger, or nudged with the arrow keys. Stickers stay
   inside the nearest [data-bounds] area and the last one you
   touch comes to the front. Position is only kept until reload.
   On a touch screen a quick swipe scrolls the page as usual; hold a
   photo for a moment (it gives a tiny buzz) and then drag it. */
(function(){
  const boards = document.querySelectorAll('[data-board]');
  if (!boards.length) return;
  let top = 10;

  boards.forEach(board => {
    const bounds = board.closest('[data-bounds]') || board;
    board.querySelectorAll('.sticker').forEach(el => {
      let ox = 0, oy = 0;           // current offset in px
      let startX, startY, baseX, baseY, rect0, area, dragging = false, moved = false;
      let holdTimer = null, pendingTouch = false;

      const img = el.querySelector('img');
      el.tabIndex = 0;
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', (img && img.alt ? img.alt + '. ' : '') + 'Суман товчоор зөөж болно');

      function apply(){
        el.style.setProperty('--x', ox + 'px');
        el.style.setProperty('--y', oy + 'px');
      }
      function clampDelta(dx, dy){
        const pad = 24;
        const minDx = area.left + pad - rect0.left, maxDx = area.right - pad - rect0.right;
        const minDy = area.top + pad - rect0.top,  maxDy = area.bottom - pad - rect0.bottom;
        return [
          Math.min(Math.max(dx, Math.min(minDx, 0)), Math.max(maxDx, 0)),
          Math.min(Math.max(dy, Math.min(minDy, 0)), Math.max(maxDy, 0))
        ];
      }

      function begin(e){
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY; baseX = ox; baseY = oy;
        rect0 = el.getBoundingClientRect();
        area  = bounds.getBoundingClientRect();
        el.style.zIndex = ++top;
        el.classList.add('dragging');
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      }
      el.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.pointerType === 'touch') {
          // wait for a deliberate hold; a swipe cancels this and scrolls the page
          pendingTouch = true; startX = e.clientX; startY = e.clientY;
          const pe = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
          clearTimeout(holdTimer);
          holdTimer = setTimeout(() => {
            if (!pendingTouch) return;
            pendingTouch = false;
            begin(pe);
            if (navigator.vibrate) navigator.vibrate(8);
          }, 260);
          return;
        }
        begin(e);
        e.preventDefault();
      });
      el.addEventListener('contextmenu', e => e.preventDefault());
      // Once a held drag is under way, stop the page from scrolling under the finger
      el.addEventListener('touchmove', e => { if (dragging) e.preventDefault(); }, { passive: false });
      el.addEventListener('pointermove', e => {
        if (pendingTouch && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 8) {
          pendingTouch = false; clearTimeout(holdTimer);   // it is a scroll, not a drag
          return;
        }
        if (!dragging) return;
        const [dx, dy] = clampDelta(e.clientX - startX, e.clientY - startY);
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        ox = baseX + dx; oy = baseY + dy;
        apply();
      });
      function end(e){
        pendingTouch = false; clearTimeout(holdTimer);
        if (!dragging) return;
        dragging = false;
        el.classList.remove('dragging');
        if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);

      el.addEventListener('keydown', e => {
        const step = e.shiftKey ? 40 : 16;
        const map = { ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step] };
        if (!map[e.key]) return;
        e.preventDefault();
        rect0 = el.getBoundingClientRect();
        area  = bounds.getBoundingClientRect();
        const [dx, dy] = clampDelta(map[e.key][0], map[e.key][1]);
        ox += dx; oy += dy;
        el.style.zIndex = ++top;
        apply();
      });
    });
  });
})();

/* ---------- 3. Offline support ----------
   Registers sw-root.js (in the site root): our own offline page instead of the
   browser's, and the app addresses without a trailing slash opening offline.
   Needs https (or localhost); on file:// or an older browser it does nothing. */
(function(){
  if (!('serviceWorker' in navigator)) return;
  try {
    const script = document.currentScript;   // this file: …/js/main.js
    if (!script || !script.src) return;
    navigator.serviceWorker.register(new URL('../sw-root.js', script.src).href, { scope: '/', updateViaCache: 'none' })
      .catch(() => { /* not https, or hosted somewhere without this file: ignore */ });
  } catch (e) { /* ignore */ }
})();
