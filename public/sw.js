self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Sentient';
  const options = {
    body: data.body || 'You have a new update request.',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'on_track', title: 'On Track' },
      { action: 'complete', title: 'Complete' }
    ],
    data: {
      url: data.url || '/',
      taskId: data.taskId,
      opIndex: data.opIndex,
      shutdownId: data.shutdownId
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const { url, taskId, opIndex, shutdownId } = event.notification.data || {};

  if (event.action === 'on_track' || event.action === 'complete') {
    event.waitUntil(
      fetch(self.location.origin + '/api/quick-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, opIndex, shutdownId, action: event.action })
      })
    );
    return;
  }

  const targetUrl = url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
