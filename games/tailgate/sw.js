/**
 * WHY THIS FILE EXISTS
 * --------------------
 * Tailgate has ZERO runtime network calls (all art is code-drawn, all audio synthesized), so once it
 * loads it already runs offline. This service worker adds the missing piece — INSTALLABILITY: it
 * caches the app shell (the HTML + the hashed JS bundle + the icon) so the game launches with NO
 * network. "Add to Home Screen" then opens it offline and chromeless/fullscreen on iOS. Strategy:
 * cache-first with runtime population — the first online visit caches what it fetches; every later
 * visit serves from the cache and works fully offline. No tracking, no accounts, no server.
 *
 * It deliberately does NOT skipWaiting()/claim(), so it never takes over the page that's already
 * open — it controls the NEXT load (e.g. the home-screen launch), which keeps it inert to the
 * current session (and the headless smoke). Relative scope ('./') so it works under the deploy base
 * (/games/tailgate/) and at '/' in dev.
 */
/* global self, caches, fetch, Response */
const CACHE = 'tailgate-v1';
const SHELL = ['./', './index.html', './favicon.png', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  // Best-effort pre-cache: a missing shell file must not abort the install (the bundle is cached
  // on first fetch regardless), so use allSettled rather than addAll.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))));
});

self.addEventListener('activate', (e) => {
  // Drop caches from older versions when CACHE is bumped.
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          // Offline + uncached: serve the shell for a navigation, else a clean network error.
          .catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
    ),
  );
});
