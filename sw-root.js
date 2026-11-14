// Root worker for the main website (nextgenunion.github.io), scope "/".
// Lives in the ROOT of this site, next to index.html. It is registered by
// js/main.js (every page) and by the NGWorship app. It does two small jobs
// and nothing else:
//
// 1. Address without a trailing slash. "nextgenunion.github.io/ngworship" is
//    outside the app's own worker scope ("/ngworship/"), so with no
//    connection Chrome shows its own offline page there, even though the app
//    is fully saved on the device. With a connection, GitHub Pages quietly
//    redirects to ".../ngworship/", which is why it only fails offline. This
//    worker does that redirect itself, so it also works offline, and from
//    there the app's own worker takes over.
// 2. A page of our own (offline.html) instead of Chrome's when a page of this
//    website cannot be loaded because the device is offline.
//
// It never touches requests under the app folders (their own workers handle
// them) and only touches page navigations, plus the four files offline.html
// itself needs. The redirect in job 1 works even if offline.html was never
// saved.
//
// If you change offline.html or the fonts, change CACHE below too (v1 -> v2),
// otherwise visitors keep the old saved copy.

// App folders on this site, without trailing slash. Add any new app here.
const APP_PATHS = ['/ngworship', '/ngwalpha'];
const CACHE = 'ngu-site-v1';   // never starts with "songbook-": the apps never delete it, nor we theirs
const OFFLINE_URL = '/offline.html';
const SAVED = [
  OFFLINE_URL,
  '/fonts/rubik-latin-wght-normal.woff2',
  '/fonts/rubik-cyrillic-wght-normal.woff2',
  '/fonts/rubik-cyrillic-ext-wght-normal.woff2',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    // Best effort, file by file: the redirect in job 1 must work regardless.
    try {
      const cache = await caches.open(CACHE);
      for (const path of SAVED) {
        try { await cache.add(new Request(path, { cache: 'reload' })); } catch (_) { /* skip this file */ }
      }
    } catch (_) { /* Cache Storage unusable: Chrome's own page is the fallback */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('ngu-site-') && k !== CACHE).map(k => caches.delete(k)));
    } catch (_) { /* nothing to clean */ }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // The fonts offline.html uses, from the saved copy (the network if missing).
  if (request.mode !== 'navigate') {
    if (SAVED.includes(url.pathname) && url.pathname !== OFFLINE_URL) {
      event.respondWith((async () => {
        try {
          const saved = await caches.match(request, { cacheName: CACHE });
          if (saved) return saved;
        } catch (_) { /* use the network */ }
        return fetch(request);
      })());
    }
    return;
  }

  // Job 1: "/ngworship" -> "/ngworship/".
  if (APP_PATHS.includes(url.pathname)) {
    event.respondWith(Response.redirect(url.origin + url.pathname + '/' + url.search, 302));
    return;
  }
  // Pages inside an app folder belong to that app's own worker.
  if (APP_PATHS.some(p => url.pathname.startsWith(p + '/'))) return;

  // Job 2: a page of this website that cannot be reached.
  event.respondWith(fetch(request).catch(async () => {
    try {
      const saved = await caches.match(OFFLINE_URL, { cacheName: CACHE });
      if (saved) return saved;
    } catch (_) { /* fall through */ }
    return Response.error();
  }));
});
