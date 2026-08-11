// Minimal service worker — only needed so the page is installable as a PWA
// (which is what lets it appear in Android's share menu). No offline caching.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* pass-through */ });
