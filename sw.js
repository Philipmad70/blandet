// Service worker for Søg videre.
// 1) Gør siden installerbar (så den står i Android's Del-menu).
// 2) Tager imod det, du deler (links, tekst OG billeder/filer):
//    Android sender det som en POST til Searchindex.html. Det kan GitHub Pages
//    ikke selv tage imod, så service workeren fanger det, lægger filerne i en
//    lille "indbakke" (Cache Storage) og sender dig videre til siden.

const INBOX = 'share-inbox';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/Searchindex.html')) {
    e.respondWith(receiveShare(e.request));
  }
  // Alt andet går direkte til nettet (ingen offline-cache).
});

async function receiveShare(request) {
  const target = new URL('Searchindex.html', self.registration.scope);
  try {
    const form = await request.formData();
    const files = form.getAll('files').filter((f) => f && typeof f !== 'string' && f.size > 0);

    // Tøm indbakken, og læg de nye filer i den
    const cache = await caches.open(INBOX);
    for (const key of await cache.keys()) await cache.delete(key);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      await cache.put(new URL('inbox/' + i, self.registration.scope).href, new Response(f, {
        headers: {
          'Content-Type': f.type || 'application/octet-stream',
          'X-Name': encodeURIComponent(f.name || ('fil-' + (i + 1))),
        },
      }));
    }

    for (const k of ['title', 'text', 'url']) {
      const v = form.get(k);
      if (v) target.searchParams.set(k, v);
    }
    if (files.length) target.searchParams.set('files', String(files.length));
  } catch (_) {
    target.searchParams.set('fejl', '1');
  }
  return Response.redirect(target.href, 303);
}
