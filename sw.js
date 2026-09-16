// Backend Learning Tracker — service worker
// Caches the app shell so it opens instantly and works offline.
// Bump CACHE_NAME whenever the cached files change, so old caches get replaced.
const CACHE_NAME = "backend-tracker-v1";
const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Cache-first for app shell files, falling back to network.
// Anything else (if ever added) just goes straight to the network.
self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;
      return fetch(event.request).then(function(response){
        // Only cache successful, same-origin responses
        if(response && response.status === 200 && response.type === "basic"){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function(){
        // Offline and not cached — fall back to the main page for navigations
        if(event.request.mode === "navigate"){
          return caches.match("./index.html");
        }
      });
    })
  );
});
