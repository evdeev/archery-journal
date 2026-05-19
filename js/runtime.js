/* Archery Journal v2 runtime helpers. */
const APP_VERSION = '2.0-dev.5';
const STORAGE_KEY = 'archery-journal:data:v3';

let archerySaveTimer = null;
let archeryDataApplied = false;
let archeryLastTouchEnd = 0;

function archeryLoadScriptOnce(id, src) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.defer = true;
  document.body.appendChild(script);
}

function archeryLoadRuntimeModules() {
  const version = encodeURIComponent(APP_VERSION);
  archeryLoadScriptOnce('archeryStorageModule', './js/storage.js?v=' + version);
  archeryLoadScriptOnce('archerySettingsModule', './js/settings.js?v=' + version);
}

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

function archeryRestoreTargetTab() {
  const url = new URL(window.location.href);
  const shouldOpenSettings = sessionStorage.getItem('archery-journal:return-settings') === '1' || url.searchParams.get('tab') === 'settings';
  if (!shouldOpenSettings) return;

  sessionStorage.removeItem('archery-journal:return-settings');
  setTimeout(() => document.querySelector('.tab[data-tab="settings"]')?.click(), 0);
  setTimeout(() => document.querySelector('.tab[data-tab="settings"]')?.click(), 150);
}

function archeryRuntimeBoot() {
  archeryLoadRuntimeModules();
  archeryApplyStoredData();
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
  document.addEventListener(eventName, () => setTimeout(archerySaveSoon, 0), true);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') archerySaveNow();
});

window.addEventListener('pagehide', archerySaveNow);
setInterval(archerySaveNow, 5000);
