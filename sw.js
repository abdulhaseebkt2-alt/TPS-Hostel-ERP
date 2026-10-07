// TPS Hostel IRP Service Worker
const CACHE_NAME = 'tps-hostel-irp-v3.2';
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

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Ignore non-http protocols (e.g. chrome-extension://, data:, blob:)
  if (!url.startsWith('http')) {
    return;
  }

  // 3. Bypass external APIs, Supabase, Google Analytics, and 3rd party trackers
  if (
    url.includes('supabase.co') ||
    url.includes('google-analytics.com') ||
    url.includes('googletagmanager.com') ||
    url.includes('doubleclick.net')
  ) {
    return;
  }

  // 4. Cache-first strategy for local assets with safe fallbacks
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // If not a valid response, return it directly
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache valid local GET responses
          if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }

          return networkResponse;
        })
        .catch(async () => {
          // Fallback for HTML navigation requests
          const acceptHeader = event.request.headers.get('accept') || '';
          if (acceptHeader.includes('text/html')) {
            const indexCached = await caches.match('./index.html');
            if (indexCached) return indexCached;
          }

          // Return a safe offline Response to avoid "Failed to convert value to 'Response'"
          return new Response('Network unavailable or offline.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
    })
  );
});
