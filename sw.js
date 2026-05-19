const CACHE_VERSION = 'archery-journal-v7-persist-data';
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
    .app-update-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(242,242,247,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:24px;}
    [data-theme="dark"] .app-update-overlay{background:rgba(0,0,0,.62);}
    .app-update-card{width:min(272px,100%);background:var(--card);border-radius:22px;box-shadow:0 18px 55px rgba(0,0,0,.18);padding:24px 20px 20px;text-align:center;color:var(--text);}
    .app-update-spinner{width:34px;height:34px;margin:0 auto 16px;border-radius:50%;border:3px solid rgba(142,142,147,.22);border-top-color:var(--blue);animation:appUpdateSpin .8s linear infinite;}
    .app-update-title{font-size:17px;font-weight:700;line-height:22px;margin-bottom:5px;}
    .app-update-subtitle{font-size:14px;line-height:19px;color:var(--muted);}
    #updateAppButton[disabled]{opacity:.55;}
    @keyframes appUpdateSpin{to{transform:rotate(360deg)}}
`;

const APP_UPDATE_SCRIPT = `
<script>
(function(){
  var lastTouchEnd = 0;
  var updateInProgress = false;
  var STORAGE_KEY = 'archery-journal:data:v1';
  var SAVE_DEBOUNCE_MS = 250;
  var saveTimer = null;
  var restoredOnce = false;

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

  function currentData(){
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      sessions: Array.isArray(window.sessions) ? window.sessions : [],
      currentSessionId: window.currentSessionId || null,
      equipment: window.equipment || null
    };
  }

  function saveAppDataNow(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData()));
    } catch (error) {
      console.warn('Unable to save Archery Journal data', error);
    }
  }

  function saveAppDataSoon(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveAppDataNow, SAVE_DEBOUNCE_MS);
  }

  function restoreAppData(){
    if (restoredOnce) return;
    restoredOnce = true;

    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.sessions)) return;

      window.sessions = data.sessions;
      window.currentSessionId = data.currentSessionId || (window.sessions[0] && window.sessions[0].id) || null;
      window.session = window.sessions.find(function(item){ return item.id === window.currentSessionId; }) || window.sessions[0] || null;
      window.seed = window.session ? window.session.seed : [];

      if (data.equipment && window.equipment) {
        Object.assign(window.equipment, data.equipment);
      }

      if (typeof window.renderHistory === 'function') window.renderHistory();
      if (typeof window.renderStats === 'function') window.renderStats();
      if (typeof window.renderEquipment === 'function') window.renderEquipment();
      if (typeof window.render === 'function' && window.session) window.render();
    } catch (error) {
      console.warn('Unable to restore Archery Journal data', error);
    }
  }

  function installPersistence(){
    restoreAppData();
    saveAppDataSoon();

    ['click','input','change','focusout'].forEach(function(eventName){
      document.addEventListener(eventName, saveAppDataSoon, true);
    });

    document.addEventListener('visibilitychange', function(){
      if (document.visibilityState === 'hidden') saveAppDataNow();
    });

    window.addEventListener('pagehide', saveAppDataNow);
    setInterval(saveAppDataNow, 5000);
  }

  function showUpdateOverlay(){
    if (document.getElementById('appUpdateOverlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'app-update-overlay';
    overlay.id = 'appUpdateOverlay';
    overlay.setAttribute('role','status');
    overlay.setAttribute('aria-live','polite');
    overlay.innerHTML = '<div class="app-update-card"><div class="app-update-spinner"></div><div class="app-update-title">Обновляем приложение</div><div class="app-update-subtitle">Загружаем новую версию и очищаем кэш…</div></div>';
    document.body.appendChild(overlay);
  }

  async function hardRefreshApp(event){
    if (event) event.preventDefault();
    if (updateInProgress) return;
    updateInProgress = true;

    saveAppDataNow();

    var button = document.getElementById('updateAppButton');
    if (button) {
      button.disabled = true;
      button.textContent = 'Обновление…';
    }

    showUpdateOverlay();

    try {
      if ('caches' in window) {
        var keys = await caches.keys();
        await Promise.all(keys
          .filter(function(key){ return key.indexOf('archery-journal-') === 0; })
          .map(function(key){ return caches.delete(key); })
        );
      }

      if ('serviceWorker' in navigator) {
        var registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) registration.waiting.postMessage({type:'SKIP_WAITING'});
        }
      }
    } catch (error) {
      console.warn('App update cleanup failed', error);
    }

    setTimeout(function(){
      var url = new URL(window.location.href);
      url.searchParams.set('appUpdate', Date.now().toString());
      window.location.replace(url.toString());
    }, 350);
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

  function boot(){
    installPersistence();
    addUpdateButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('click', function(){
    setTimeout(function(){
      addUpdateButton();
      saveAppDataSoon();
    }, 0);
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

  if (!patched.includes('archery-journal:data:v1')) {
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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
