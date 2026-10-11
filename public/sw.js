self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  event.waitUntil(self.registration.showNotification('A message from your village', {
    body: 'Your senior host shared a message or photo. Open your private booking conversation.',
    tag: typeof data.tag === 'string' ? data.tag : 'grandvillage-message',
    data: { url: typeof data.url === 'string' && data.url.startsWith('/parent/messages?') ? data.url : '/parent/notifications' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/parent/notifications', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) { await existing.navigate(url); return existing.focus(); }
    return self.clients.openWindow(url);
  })());
});
