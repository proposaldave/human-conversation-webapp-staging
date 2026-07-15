const CACHE_PREFIX = "human-conversation-public-staging-";
const CACHE_NAME = CACHE_PREFIX + "34332635e8af1fb5";
const LEGACY_CACHE_NAMES = ["human-conversation-public-indexhtmlmanifestwebmanifest"];
const APP_SHELL = [
  "./README.md",
  "./assets/index-DqahY_Sn.css",
  "./assets/index.staging-CZhuh-oJ.js",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./manifest.webmanifest"
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
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", response.clone()));
      return response;
    }).catch(() => caches.open(CACHE_NAME).then((cache) => cache.match("./index.html"))));
    return;
  }

  event.respondWith(caches.open(CACHE_NAME).then((cache) => (
    cache.match(event.request).then((cached) => cached || fetch(event.request))
  )));
});
