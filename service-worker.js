const cacheName = "xo-music-cache-v1";
const filesToCache = [
  "https://dusfire.github.io/xo-music/",
  "index.html",
  "style.css",
  "script.js",
  "favicon/favicon.ico",
  "favicon/site.webmanifest",
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
  console.log("🎉 Service Worker Installed");
});

// Activate Event
self.addEventListener("activate", (event) => {
  console.log("🔥 Service Worker Activated");
});

// Fetch Event (for offline support)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
