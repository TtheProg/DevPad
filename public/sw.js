// DevPad service worker — makes the app work fully offline after the first
// visit (the literal "turn off your Wi-Fi and it still works, even after a
// reload" claim). No analytics, no external calls — it only caches DevPad's own
// static assets on the user's device.

const CACHE = "devpad-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Warm the cache with the app shell.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/"])),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  // Navigations: network-first (to pick up updates), fall back to cache offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Other assets: cache-first, then network (and cache the result).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }),
    ),
  );
});
