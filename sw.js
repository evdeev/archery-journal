const CACHE_VERSION = 'archery-journal-v16-restore-1-12-runtime-dev-bypass';
const APP_VERSION = '1.16';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-16.png',
  './icons/icon-32.png',
  './icons/icon-64.png',
  './icons/icon-128.png',
  './icons/apple-touch-icon.png',
  './icons/icon-256.png',
  './icons/icon-512.png',
  './icons/icon-1024.png',
  './icons/icon.svg'
];

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) return;

  // IMPORTANT:
  // Never intercept DEV preview from production service worker.
  // Otherwise /dev gets replaced by cached production HTML.
  if (requestUrl.pathname.includes('/archery-journal/dev/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  const acceptsHtml = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) =>
        cached || caches.match('./index.html')
      ))
  );
});