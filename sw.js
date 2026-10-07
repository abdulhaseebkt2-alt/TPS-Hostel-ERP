// TPS Hostel IRP Service Worker
const CACHE_NAME = 'tps-hostel-irp-v3.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg',
  './logo.png',
  './variables.css',
  './base.css',
  './components.css',
  './attendance.css',
  './print.css',
  './responsive.css',
  './config.js',
  './supabase-client.js',
  './auth.js',
  './student-service.js',
  './staff-service.js',
  './attendance-service.js',
  './leave-service.js',
  './discipline-service.js',
  './timetable-service.js',
  './hostel-service.js',
  './report-service.js',
  './dashboard-view.js',
  './students-view.js',
  './staff-view.js',
  './attendance-view.js',
  './leave-view.js',
  './discipline-view.js',
  './hostel-view.js',
  './timetable-view.js',
  './reports-view.js',
  './notices-view.js',
  './users-view.js',
  './settings-view.js',
  './app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let Supabase API requests pass through network directly
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for html pages
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
