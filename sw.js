const CACHE_VERSION = 'archery-journal-v9-version-footer';
const APP_VERSION = '1.08';
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
    .settings-version-footer{padding:36px 24px calc(28px + env(safe-area-inset-bottom,0px));text-align:center;color:#8e8e93;}
    .settings-version-value{font-size:17px;line-height:22px;margin-bottom:10px;}
    .settings-version-copy{font-size:13px;line-height:18px;}
`;

const APP_VERSION_SCRIPT = `
<script>
(function(){
  function addVersionFooter(){
    var settingsScreen = document.querySelector('.settings-screen');
    if (!settingsScreen) return;
    if (document.getElementById('settingsVersionFooter')) return;

    var footer = document.createElement('div');
    footer.className = 'settings-version-footer';
    footer.id = 'settingsVersionFooter';
    footer.innerHTML = '<div class="settings-version-value">Версия ${APP_VERSION}</div><div class="settings-version-copy">© 2026 Boris Evdeev</div>';

    settingsScreen.appendChild(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addVersionFooter);
  } else {
    addVersionFooter();
  }

  document.addEventListener('click', function(){
    setTimeout(addVersionFooter, 0);
  }, true);
})();
</script>`;

function patchHtml(html) {
  let patched = html;

  patched = patched.replace(
    /<meta name="viewport" content="[^"]*"\s*\/?>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
  );

  if (!patched.includes('settings-version-footer')) {
    patched = patched.replace('</style>', `\n${SAFE_AREA_CSS}\n</style>`);
  }

  if (!patched.includes('Версия ${APP_VERSION}')) {
    patched = patched.replace('</body>', `${APP_VERSION_SCRIPT}\n</body>`);
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
    fetch(event.request, { cache: 'no-store' })
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