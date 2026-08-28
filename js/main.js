// Nav shrink on scroll
  const nav = document.getElementById('siteNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, {passive:true});

  // Mobile nav toggle -> dropdown (class-based, so it never gets stuck
  // when the window is resized or the device is rotated)
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  function closeMenu(){
    links.classList.remove('open');
    toggle.textContent = '\u2630'; // ☰
    toggle.setAttribute('aria-expanded', 'false');
  }
  function openMenu(){
    links.classList.add('open');
    toggle.textContent = '\u2715'; // ✕
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    links.classList.contains('open') ? closeMenu() : openMenu();
  });

  document.querySelectorAll('.nav-links a').forEach(a=>{
    a.addEventListener('click', closeMenu);
  });

  // Close the mobile menu (and clear any stale state) if the viewport
  // grows back into desktop size, or on outside click
  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) closeMenu();
  });
  document.addEventListener('click', (e) => {
    if (links.classList.contains('open') &&
        !links.contains(e.target) &&
        !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  // Scroll reveal
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReduced) {
    revealEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries)=>{
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(()=> entry.target.classList.add('in'), i * 40);
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(el => io.observe(el));
  }

  // Parallax blobs on scroll (subtle, desktop-only feel — skipped
  // entirely on touch/small screens to save battery + avoid jank)
  if (!prefersReduced && window.innerWidth > 768) {
    const blobs = document.querySelectorAll('.blob');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      blobs.forEach((b, i) => {
        b.style.transform = `translateY(${y * (0.03 + i*0.015)}px)`;
      });
    }, {passive:true});
  }

