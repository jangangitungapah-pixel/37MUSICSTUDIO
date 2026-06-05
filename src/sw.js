import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Take control immediately
self.skipWaiting();
clientsClaim();

// Precache all Vite-built assets
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// ===== Push Notification Click Handler =====
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already an open window, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// ===== Background Sync for Offline Actions (Future) =====
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '37 Music Studio';
    const options = {
      body: data.body || data.message || '',
      icon: '/icon-512.png',
      badge: '/icon-192.png',
      tag: data.tag || 'default',
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch {
    // If data is not JSON, show as text
    const title = '37 Music Studio';
    event.waitUntil(
      self.registration.showNotification(title, {
        body: event.data.text(),
        icon: '/icon-512.png',
        badge: '/icon-192.png',
      })
    );
  }
});
