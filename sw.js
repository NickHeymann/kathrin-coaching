// Service Worker für Kathrin Coaching Editor
const CACHE_NAME = 'editor-v1';

// Dateien die offline verfügbar sein sollen
const STATIC_ASSETS = [
  '/cms-editor.html',
  '/manifest.json'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Aktivierung - alte Caches löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network First Strategie - immer versuchen, frische Daten zu holen
self.addEventListener('fetch', event => {
  // Für GitHub API und raw.githubusercontent immer frisch holen
  if (event.request.url.includes('github') ||
      event.request.url.includes('raw.githubusercontent')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Für statische Assets: Network first, dann Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antwort im Cache speichern
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: aus Cache liefern
        return caches.match(event.request);
      })
  );
});

// Message Handler für manuelles Cache-Leeren
self.addEventListener('message', event => {
  if (event.data === 'clearCache') {
    caches.delete(CACHE_NAME).then(() => {
      event.source.postMessage('cacheCleared');
    });
  }
});
