// Service Worker — TeluguFontStyle.co.in
// No push notifications or third-party scripts
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => clients.claim());
