/* ============================================================
   NGU SITE BEHAVIOUR
   1. Mobile menu
   2. Draggable photo stickers (hero + 404 page)
   ============================================================ */

/* ---------- 1. Mobile menu ---------- */
(function(){
  const toggle = document.querySelector('.nav-toggle');
  const links  = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  function setMenu(open){
    links.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 1060) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
})();

/* ---------- 2. Draggable stickers ----------
   Every .sticker inside a [data-board] can be dragged with a
   mouse or finger, or nudged with the arrow keys. Stickers stay
   inside the nearest [data-bounds] area and the last one you
   touch comes to the front. Position is only kept until reload. */
(function(){
  const boards = document.querySelectorAll('[data-board]');
  if (!boards.length) return;
  let top = 10;

  boards.forEach(board => {
    const bounds = board.closest('[data-bounds]') || board;
    board.querySelectorAll('.sticker').forEach(el => {
      let ox = 0, oy = 0;           // current offset in px
      let startX, startY, baseX, baseY, rect0, area, dragging = false, moved = false;

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

      el.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY; baseX = ox; baseY = oy;
        rect0 = el.getBoundingClientRect();
        area  = bounds.getBoundingClientRect();
        el.style.zIndex = ++top;
        el.classList.add('dragging');
        el.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      el.addEventListener('pointermove', e => {
        if (!dragging) return;
        const [dx, dy] = clampDelta(e.clientX - startX, e.clientY - startY);
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        ox = baseX + dx; oy = baseY + dy;
        apply();
      });
      function end(e){
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
