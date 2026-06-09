const VERSION = '2.3';
const CACHE_NAME = 'rezepte-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo_Rezept.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Zwingt den neuen SW, sofort aktiv zu werden
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Klick auf Benachrichtigung verarbeiten
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const absoluteTarget = new URL(targetUrl, self.location.origin).href;
      
      // Prüfen, ob die App bereits in einem Tab offen ist
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === absoluteTarget && 'focus' in client) {
          return client.focus();
        }
      }
      // Falls nicht offen, neuen Tab/Fenster öffnen
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim(); // Übernimmt sofort die Kontrolle
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate Strategie für schnellere Ladezeiten
  event.respondWith(
    caches.match(event.request).then((response) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});