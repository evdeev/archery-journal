const CACHE_VERSION = 'archery-journal-v16-restore-1-12-runtime';
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

const PATCH_CSS = `
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
    .app-update-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(242,242,247,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);padding:24px;}
    [data-theme="dark"] .app-update-overlay{background:rgba(0,0,0,.62);}
    .app-update-card{width:min(272px,100%);background:var(--card);border-radius:22px;box-shadow:0 18px 55px rgba(0,0,0,.18);padding:24px 20px 20px;text-align:center;color:var(--text);}
    .app-update-spinner{width:34px;height:34px;margin:0 auto 16px;border-radius:50%;border:3px solid rgba(142,142,147,.22);border-top-color:var(--blue);animation:appUpdateSpin .8s linear infinite;}
    .app-update-title{font-size:17px;font-weight:700;line-height:22px;margin-bottom:5px;}
    .app-update-subtitle{font-size:14px;line-height:19px;color:var(--muted);}
    #updateAppButton[disabled]{opacity:.55;}
    @keyframes appUpdateSpin{to{transform:rotate(360deg)}}
`;

const PERSISTENCE_BOOT_SCRIPT = `
<script id="archeryJournalPersistenceBoot">
(function(){
  var STORAGE_KEY = 'archery-journal:data:v3';
  var OLD_KEYS = ['archery-journal:data:v2','archery-journal:data:v1'];
  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    for (var i = 0; i < OLD_KEYS.length; i++) {
      raw = localStorage.getItem(OLD_KEYS[i]);
      if (raw) break;
    }
  }
  if (!raw) return;

  try {
    var data = JSON.parse(raw);
    if (!data || !Array.isArray(data.sessions)) return;
    window.__ARCHERY_JOURNAL_SAVED_DATA__ = data;
  } catch (error) {
    console.warn('Unable to preload Archery Journal data', error);
  }
})();
</script>`;

const PATCH_SCRIPT = `
<script id="archeryJournalRuntimePatch">
(function(){
  var lastTouchEnd = 0;
  var updateInProgress = false;
  var dataAppliedOnce = false;
  var STORAGE_KEY = 'archery-journal:data:v3';
  var SAVE_DEBOUNCE_MS = 200;
  var saveTimer = null;

  document.addEventListener('touchend', function(event) {
    var now = Date.now();
    if (now - lastTouchEnd <= 350) event.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener('gesturestart', function(event) { event.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function(event) { event.preventDefault(); }, { passive: false });

  function getSessions(){
    try { return (typeof sessions !== 'undefined' && Array.isArray(sessions)) ? sessions : []; }
    catch(error) { return []; }
  }

  function getCurrentSessionId(){
    try { return (typeof currentSessionId !== 'undefined') ? currentSessionId : null; }
    catch(error) { return null; }
  }

  function getEquipment(){
    try { return (typeof equipment !== 'undefined' && equipment) ? equipment : null; }
    catch(error) { return null; }
  }

  function saveAppDataNow(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 3,
        savedAt: new Date().toISOString(),
        sessions: getSessions(),
        currentSessionId: getCurrentSessionId(),
        equipment: getEquipment()
      }));
    } catch (error) {
      console.warn('Unable to save Archery Journal data', error);
    }
  }

  function saveAppDataSoon(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveAppDataNow, SAVE_DEBOUNCE_MS);
  }

  function applyPreloadedData(){
    if (dataAppliedOnce) return;
    dataAppliedOnce = true;

    var data = window.__ARCHERY_JOURNAL_SAVED_DATA__;
    if (!data || !Array.isArray(data.sessions)) return;

    try {
      if (typeof sessions !== 'undefined') sessions = data.sessions;
      if (typeof currentSessionId !== 'undefined') currentSessionId = data.currentSessionId || (sessions[0] && sessions[0].id) || null;
      if (typeof session !== 'undefined') session = sessions.find(function(item){ return item.id === currentSessionId; }) || sessions[0] || null;
      if (typeof seed !== 'undefined') seed = session ? session.seed : [];
      if (data.equipment && typeof equipment !== 'undefined' && equipment) Object.assign(equipment, data.equipment);

      if (typeof renderHistory === 'function') renderHistory();
      if (typeof renderStats === 'function') renderStats();
      if (typeof renderEquipment === 'function') renderEquipment();
      if (typeof render === 'function' && typeof session !== 'undefined' && session) render();
    } catch (error) {
      console.warn('Unable to apply Archery Journal data', error);
    }
  }

  function addVersionFooter(){
    var rootSettings = document.getElementById('rootSettingsScreen');
    var settingsRoot = rootSettings ? rootSettings.querySelector('.root-app') : null;
    if (!settingsRoot) return;

    var footer = document.getElementById('settingsVersionFooter');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'settings-version-footer';
      footer.id = 'settingsVersionFooter';
      settingsRoot.appendChild(footer);
    }
    footer.innerHTML = '<div class="settings-version-value">Версия ${APP_VERSION}</div><div class="settings-version-copy">© 2026 Boris Evdeev</div>';
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

  function openSettingsTab(){
    var settingsTab = document.querySelector('.tab[data-tab="settings"]');
    if (settingsTab) settingsTab.click();
  }

  async function updateApp(event){
    if (event) event.preventDefault();
    if (updateInProgress) return;
    updateInProgress = true;

    saveAppDataNow();
    sessionStorage.setItem('archery-journal:return-settings', '1');

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
      url.searchParams.set('tab', 'settings');
      window.location.replace(url.toString());
    }, 350);
  }

  function addUpdateButton(){
    var resetButton = document.getElementById('resetAppButton');
    if (!resetButton || !resetButton.parentElement) return;

    var button = document.getElementById('updateAppButton');
    if (!button) {
      button = document.createElement('button');
      button.className = 'equipment-delete-row';
      button.id = 'updateAppButton';
      button.type = 'button';
      button.style.color = 'var(--blue)';
      resetButton.parentElement.insertBefore(button, resetButton);
    }
    button.textContent = updateInProgress ? 'Обновление…' : 'Обновить приложение';
    button.onclick = updateApp;
  }

  function restoreTargetTab(){
    var url = new URL(window.location.href);
    var shouldOpenSettings = sessionStorage.getItem('archery-journal:return-settings') === '1' || url.searchParams.get('tab') === 'settings';
    if (!shouldOpenSettings) return;
    sessionStorage.removeItem('archery-journal:return-settings');
    setTimeout(openSettingsTab, 0);
    setTimeout(openSettingsTab, 150);
  }

  function boot(){
    applyPreloadedData();
    addUpdateButton();
    addVersionFooter();
    restoreTargetTab();
    saveAppDataSoon();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  ['click','input','change','focusout'].forEach(function(eventName){
    document.addEventListener(eventName, function(){ setTimeout(function(){ addUpdateButton(); addVersionFooter(); saveAppDataSoon(); }, 0); }, true);
  });

  document.addEventListener('visibilitychange', function(){ if (document.visibilityState === 'hidden') saveAppDataNow(); });
  window.addEventListener('pagehide', saveAppDataNow);
  setInterval(saveAppDataNow, 5000);
})();
</script>`;

function patchHtml(html) {
  let patched = html;

  patched = patched.replace(
    /<meta name="viewport" content="[^"]*"\s*\/?>/,
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />'
  );

  if (!patched.includes('settings-version-footer')) {
    patched = patched.replace('</style>', `\n${PATCH_CSS}\n</style>`);
  }

  if (!patched.includes('id="archeryJournalPersistenceBoot"')) {
    patched = patched.replace('<script>\nlet sessions=', `${PERSISTENCE_BOOT_SCRIPT}\n<script>\nlet sessions=`);
  }

  if (!patched.includes('id="archeryJournalRuntimePatch"')) {
    patched = patched.replace('</body>', `${PATCH_SCRIPT}\n</body>`);
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
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)));
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
      .catch(() => caches.match(event.request).then((cached) =>
        cached || caches.match('./index.html').then(async (fallback) => fallback ? htmlResponse(fallback) : fallback)
      ))
  );
});