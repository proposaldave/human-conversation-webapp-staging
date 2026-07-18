const CACHE_PREFIX = "human-conversation-public-staging-";
const CACHE_NAME = CACHE_PREFIX + "e9337776ebd0f6ff";
const LEGACY_CACHE_NAMES = ["human-conversation-public-indexhtmlmanifestwebmanifest"];
const APP_SHELL = [
  "./.nojekyll",
  "./README.md",
  "./assets/baby-block-demo-moment-CD82chgW.wav",
  "./assets/main-BJ_1iVkg.css",
  "./assets/main-DDD4DX4Y.js",
  "./assets/operator-BhCkEVus.css",
  "./assets/operator-DPkiy7uw.js",
  "./assets/sparkles-B8esmGDD.js",
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
    const fallbackPath = url.pathname.endsWith("/operator.html") ? "./operator.html" : "./index.html";
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
