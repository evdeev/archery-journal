const CACHE_VERSION = 'archery-journal-v4-app-update-button';
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

const SAFE_AREA_CSS = `
    :root{--safe-top: env(safe-area-inset-top, 0px);}
    html,body{touch-action:manipulation;overscroll-behavior:none;-webkit-text-size-adjust:100%;}
    button,input,textarea,select{touch-action:manipulation;font-size:16px;}
    .app,.root-app{padding-top:calc(10px + var(--safe-top)) !important;}
    .settings-screen,.create-screen,.note-screen,.equipment-screen{padding-top:calc(10px + var(--safe-top)) !important;}
    .settings-nav{position:relative;}
    .note-textarea{min-height:calc(100vh - 92px - var(--safe-top) - var(--safe-bottom)) !important;}
`;

const APP_UPDATE_SCRIPT = `
<script>
(function(){
  var lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    var now = Date.now();
    if (now - lastTouchEnd <= 350) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener('gesturestart', function(event) {
    event.preventDefault();
  }, { passive: false });

  document.addEventListener('dblclick', function(event) {
    event.preventDefault();
  }, { passive: false });

  async function hardRefreshApp(){
    try {
      if ('caches' in window) {
        var keys = await caches.keys();
        await Promise.all(keys.map(function(key){ return caches.delete(key); }));
      }

      if ('serviceWorker' in navigator) {
        var registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(function(registration){ return registration.unregister(); }));
      }
    } catch (error) {
      console.warn('App update cleanup failed', error);
    }

    var url = new URL(window.location.href);
    url.searchParams.set('appUpdate', Date.now().toString());
    window.location.replace(url.toString());
  }

  function addUpdateButton(){
    if (document.getElementById('updateAppButton')) return;

    var resetButton = document.getElementById('resetAppButton');
    if (!resetButton || !resetButton.parentElement) return;

    var button = document.createElement('button');
    button.className = 'equipment-delete-row';
    button.id = 'updateAppButton';
    button.type = 'button';
    button.style.color = 'var(--blue)';
    button.textContent = 'Обновить приложение';
    button.addEventListener('click', hardRefreshApp);

    resetButton.parentElement.insertBefore(button, resetButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addUpdateButton);
  } else {
    addUpdateButton();
  }

  document.addEventListener('click', function(){
    setTimeout(addUpdateButton, 0);
  }, true);
})();
</script>`;

function patchHtml(html) {
  let patched = html;

  patched = patched.replace(
    /<meta name="viewport" content="[^"]*"\s*\/?>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
  );

  if (!patched.includes('/* iOS safe area hotfix */')) {
    patched = patched.replace('</style>', `\n    /* iOS safe area hotfix */\n${SAFE_AREA_CSS}\n</style>`);
  }

  if (!patched.includes('updateAppButton')) {
    patched = patched.replace('</body>', `${APP_UPDATE_SCRIPT}\n</body>`);
  }

  return patched;
}

async function htmlResponse(response) {
  const html = await response.text();
  return new Response(patchHtml(html), {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache'
    }
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const acceptsHtml = event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html');

  event.respondWith(
    fetch(event.request)
      .then(async (response) => {
        if (acceptsHtml) {
          const patched = await htmlResponse(response.clone());
          const copy = patched.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return patched;
        }

        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) =>
          cached || caches.match('./index.html').then(async (fallback) => fallback ? htmlResponse(fallback) : fallback)
        )
      )
  );
});
