/* Archery Journal v2 settings screen component. */
const SETTINGS_BUILD = '2.0-dev.6';
const SETTINGS_ENVIRONMENT = 'DEV';

let settingsRenderTimer = null;
let settingsObserver = null;

function settingsShowUpdateOverlay() {
  if (document.getElementById('appUpdateOverlay')) return;

  const overlay = document.createElement('div');
  overlay.className = 'app-update-overlay';
  overlay.id = 'appUpdateOverlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = '<div class="app-update-card"><div class="app-update-spinner"></div><div class="app-update-title">Обновляем приложение</div><div class="app-update-subtitle">Загружаем новую версию и очищаем кэш…</div></div>';
  document.body.appendChild(overlay);
}

async function settingsUpdateApp(event) {
  if (event) event.preventDefault();
  if (typeof archerySaveNow === 'function') archerySaveNow();
  sessionStorage.setItem('archery-journal:return-settings', '1');

  const button = document.getElementById('updateAppButton');
  if (button) {
    button.disabled = true;
    button.textContent = 'Обновление…';
  }

  settingsShowUpdateOverlay();

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.indexOf('archery-journal') === 0).map(key => caches.delete(key)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.update()));
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

function settingsRenderUpdateButton() {
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
  button.disabled = false;
  button.onclick = settingsUpdateApp;
}

function settingsRenderFooter() {
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

  footer.dataset.component = 'settings-footer';
  footer.dataset.appVersion = SETTINGS_BUILD;
  footer.innerHTML = `<div class="settings-version-value">Версия ${SETTINGS_BUILD}</div><div class="settings-version-copy">${SETTINGS_ENVIRONMENT} · © 2026 Boris Evdeev</div>`;
}

function settingsRender() {
  settingsRenderUpdateButton();
  settingsRenderFooter();
}

function settingsRenderSoon() {
  clearTimeout(settingsRenderTimer);
  settingsRenderTimer = setTimeout(settingsRender, 0);
}

function settingsObserveRoot() {
  const rootSettings = document.getElementById('rootSettingsScreen');
  if (!rootSettings || settingsObserver) return;

  settingsObserver = new MutationObserver(settingsRenderSoon);
  settingsObserver.observe(rootSettings, { childList: true, subtree: true });
}

function settingsBoot() {
  settingsRender();
  settingsObserveRoot();

  ['click', 'input', 'change', 'focusout'].forEach(eventName => {
    document.addEventListener(eventName, settingsRenderSoon, true);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settingsBoot);
else settingsBoot();
