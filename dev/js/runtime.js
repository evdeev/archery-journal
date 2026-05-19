/* Archery Journal v2 runtime helpers. */
const APP_VERSION = '2.0-dev.2';
const STORAGE_KEY = 'archery-journal:data:v3';

let archerySaveTimer = null;
let archeryDataApplied = false;
let archeryLastTouchEnd = 0;

function archeryGetSessions() {
  try { return Array.isArray(sessions) ? sessions : []; } catch (_) { return []; }
}

function archeryGetCurrentSessionId() {
  try { return typeof currentSessionId !== 'undefined' ? currentSessionId : null; } catch (_) { return null; }
}

function archeryGetEquipment() {
  try { return typeof equipment !== 'undefined' ? equipment : null; } catch (_) { return null; }
}

function archerySaveNow() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 3,
      savedAt: new Date().toISOString(),
      sessions: archeryGetSessions(),
      currentSessionId: archeryGetCurrentSessionId(),
      equipment: archeryGetEquipment()
    }));
  } catch (error) {
    console.warn('Unable to save Archery Journal data', error);
  }
}

function archerySaveSoon() {
  clearTimeout(archerySaveTimer);
  archerySaveTimer = setTimeout(archerySaveNow, 200);
}

function archeryApplyStoredData() {
  if (archeryDataApplied) return;
  archeryDataApplied = true;

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem('archery-journal:data:v2')
      || localStorage.getItem('archery-journal:data:v1');
    if (!raw) return;

    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.sessions)) return;

    if (typeof sessions !== 'undefined') sessions = data.sessions;
    if (typeof currentSessionId !== 'undefined') currentSessionId = data.currentSessionId || (sessions[0] && sessions[0].id) || null;
    if (typeof session !== 'undefined') session = sessions.find(item => item.id === currentSessionId) || sessions[0] || null;
    if (typeof seed !== 'undefined') seed = session ? session.seed : [];
    if (data.equipment && typeof equipment !== 'undefined' && equipment) Object.assign(equipment, data.equipment);

    if (typeof renderHistory === 'function') renderHistory();
    if (typeof renderStats === 'function') renderStats();
    if (typeof renderEquipment === 'function') renderEquipment();
    if (typeof render === 'function' && typeof session !== 'undefined' && session) render();
  } catch (error) {
    console.warn('Unable to restore Archery Journal data', error);
  }
}

function archeryInjectRuntimeCss() {
  if (document.getElementById('archeryRuntimeStyles')) return;

  const style = document.createElement('style');
  style.id = 'archeryRuntimeStyles';
  style.textContent = `
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
  document.head.appendChild(style);
}

function archeryAddVersionFooter() {
  const rootSettings = document.getElementById('rootSettingsScreen');
  const settingsRoot = rootSettings ? rootSettings.querySelector('.root-app') : null;
  if (!settingsRoot) return;

  let footer = document.getElementById('settingsVersionFooter');
  if (!footer) {
    footer = document.createElement('div');
    footer.className = 'settings-version-footer';
    footer.id = 'settingsVersionFooter';
    settingsRoot.appendChild(footer);
  }

  footer.innerHTML = `<div class="settings-version-value">Версия ${APP_VERSION}</div><div class="settings-version-copy">DEV · © 2026 Boris Evdeev</div>`;
}

function archeryShowUpdateOverlay() {
  if (document.getElementById('appUpdateOverlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'app-update-overlay';
  overlay.id = 'appUpdateOverlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = '<div class="app-update-card"><div class="app-update-spinner"></div><div class="app-update-title">Обновляем приложение</div><div class="app-update-subtitle">Загружаем новую версию и очищаем кэш…</div></div>';
  document.body.appendChild(overlay);
}

async function archeryUpdateApp(event) {
  if (event) event.preventDefault();
  archerySaveNow();
  sessionStorage.setItem('archery-journal:return-settings', '1');

  const button = document.getElementById('updateAppButton');
  if (button) {
    button.disabled = true;
    button.textContent = 'Обновление…';
  }

  archeryShowUpdateOverlay();

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.indexOf('archery-journal') === 0).map(key => caches.delete(key)));
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
    }
  } catch (error) {
    console.warn('App update cleanup failed', error);
  }

  setTimeout(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('appUpdate', Date.now().toString());
    url.searchParams.set('tab', 'settings');
    window.location.replace(url.toString());
  }, 350);
}

function archeryAddUpdateButton() {
  const resetButton = document.getElementById('resetAppButton');
  if (!resetButton || !resetButton.parentElement) return;

  let button = document.getElementById('updateAppButton');
  if (!button) {
    button = document.createElement('button');
    button.className = 'equipment-delete-row';
    button.id = 'updateAppButton';
    button.type = 'button';
    button.style.color = 'var(--blue)';
    resetButton.parentElement.insertBefore(button, resetButton);
  }

  button.textContent = 'Обновить приложение';
  button.onclick = archeryUpdateApp;
}

function archeryRestoreTargetTab() {
  const url = new URL(window.location.href);
  const shouldOpenSettings = sessionStorage.getItem('archery-journal:return-settings') === '1' || url.searchParams.get('tab') === 'settings';
  if (!shouldOpenSettings) return;

  sessionStorage.removeItem('archery-journal:return-settings');
  setTimeout(() => document.querySelector('.tab[data-tab="settings"]')?.click(), 0);
  setTimeout(() => document.querySelector('.tab[data-tab="settings"]')?.click(), 150);
}

function archeryRuntimeBoot() {
  archeryInjectRuntimeCss();
  archeryApplyStoredData();
  archeryAddUpdateButton();
  archeryAddVersionFooter();
  archeryRestoreTargetTab();
  archerySaveSoon();
}

document.addEventListener('touchend', event => {
  const now = Date.now();
  if (now - archeryLastTouchEnd <= 350) event.preventDefault();
  archeryLastTouchEnd = now;
}, { passive: false });
document.addEventListener('gesturestart', event => event.preventDefault(), { passive: false });
document.addEventListener('dblclick', event => event.preventDefault(), { passive: false });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', archeryRuntimeBoot);
else archeryRuntimeBoot();

['click', 'input', 'change', 'focusout'].forEach(eventName => {
  document.addEventListener(eventName, () => setTimeout(() => {
    archeryAddUpdateButton();
    archeryAddVersionFooter();
    archerySaveSoon();
  }, 0), true);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') archerySaveNow();
});
window.addEventListener('pagehide', archerySaveNow);
setInterval(archerySaveNow, 5000);
