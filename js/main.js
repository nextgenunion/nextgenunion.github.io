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
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function openMenu(){
    links.classList.add('open');
    toggle.classList.add('open');
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
          setTimeout(()=> entry.target.classList.add('in'), i * 65);
          io.unobserve(entry.target);
        }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(el => io.observe(el));
  }

