
const CACHE_NAME = 'golden-academy-v1';
const ICON_URL = 'https://cdn-icons-png.flaticon.com/512/2990/2990638.png';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Handle Push Notifications (Received when app is CLOSED or Background)
self.addEventListener('push', (event) => {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Planet of Science', body: event.data.text() };
    }
  }

  const title = data.title || 'Planet of Science';
  const options = {
    body: data.body || data.message || 'New update available',
    icon: ICON_URL,
    badge: ICON_URL,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'open', title: 'Open App' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Handle Messages from React App (Triggered when app is OPEN/MINIMIZED)
// This ensures notifications are handled by the Worker, making them system-level persistent
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data.payload;
    
    if (self.Notification && self.Notification.permission === 'granted') {
        const options = {
            body: body,
            icon: ICON_URL,
            badge: ICON_URL,
            vibrate: [100, 50, 100],
            data: { url: '/' },
            tag: 'golden-notification'
        };
        
        self.registration.showNotification(title, options);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Open the app window if clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});