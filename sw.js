const CACHE_PREFIX = "human-conversation-public-staging-";
const CACHE_NAME = CACHE_PREFIX + "57e5cbb788920522";
const LEGACY_CACHE_NAMES = ["human-conversation-public-indexhtmlmanifestwebmanifest"];
const APP_SHELL = [
  "./.nojekyll",
  "./README.md",
  "./assets/baby-block-demo-moment-CD82chgW.wav",
  "./assets/baby-block-demo-moment-DM348rXU.js",
  "./assets/coach-DGZ-FQGr.css",
  "./assets/coach-DcFMaybE.js",
  "./assets/main-BJ_1iVkg.css",
  "./assets/main-Cr7fdx_0.js",
  "./assets/operator-BhCkEVus.css",
  "./assets/operator-zHL4hrMg.js",
  "./assets/rotate-ccw-CWTBuy5h.js",
  "./assets/sparkles-Cie4_JKj.js",
  "./assets/users-round-DkgJWjmY.js",
  "./coach.html",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./manifest.webmanifest",
  "./operator.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => (
        (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) || LEGACY_CACHE_NAMES.includes(key)
      )).map((key) => caches.delete(key)),
    )),
    self.clients.claim(),
  ]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    const fallbackPath = url.pathname.endsWith("/operator.html")
      ? "./operator.html"
      : url.pathname.endsWith("/coach.html")
        ? "./coach.html"
        : "./index.html";
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(fallbackPath, response.clone()));
      return response;
    }).catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(fallbackPath))));
    return;
  }

  event.respondWith(caches.open(CACHE_NAME).then((cache) => (
    cache.match(event.request).then((cached) => cached || fetch(event.request))
  )));
});
