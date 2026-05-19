/* Archery Journal v2 storage/import/export helpers. */
function storageDownloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function storageReadJsonFile(file, onLoad) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      onLoad(JSON.parse(event.target.result));
    } catch (error) {
      alert('Не удалось импортировать файл');
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function storageImportSessionsFromJson(data) {
  if (!Array.isArray(data.sessions)) throw new Error('Некорректный формат файла');

  const importedSessions = data.sessions.map((item) => ({
    id: item.id || ('s' + Date.now() + Math.random().toString(36).slice(2, 6)),
    date: item.date,
    place: item.place || '',
    distance: Number(item.distance || 18),
    shots: Number(item.shots || 60),
    competition: !!item.competition,
    bowId: item.bowId || '',
    arrowSetId: item.arrowSetId || '',
    note: item.note || '',
    comments: item.comments || {},
    seed: item.seed || []
  }));

  sessions = [...importedSessions, ...sessions];
  if (!currentSessionId && sessions[0]) currentSessionId = sessions[0].id;
  if (!session && sessions[0]) {
    session = sessions[0];
    seed = session.seed;
  }

  renderHistory();
  renderStats();
  if (typeof archerySaveNow === 'function') archerySaveNow();

  alert('Импортировано сессий: ' + importedSessions.length);
}

function storageImportEquipmentFromJson(data) {
  equipment.bowManualSets = Array.isArray(data.bowManualSets) ? data.bowManualSets : [];
  equipment.arrowManualSets = Array.isArray(data.arrowManualSets) ? data.arrowManualSets : [];

  renderEquipment();
  if (typeof archerySaveNow === 'function') archerySaveNow();

  alert('Экипировка импортирована');
}

function storageExportHistory() {
  storageDownloadJson('archery-history-export.json', { sessions });
}

function storageExportEquipment() {
  storageDownloadJson('archery-equipment-export.json', {
    bowManualSets: equipment.bowManualSets || [],
    arrowManualSets: equipment.arrowManualSets || []
  });
}

function storageResetAllData() {
  const confirmed = confirm('Все данные приложения будут удалены без возможности восстановления.\n\nНажмите «ОК», чтобы удалить данные, или «Отмена», чтобы отменить действие.');
  if (!confirmed) return;

  sessions = [];
  equipment.arrowManualSets = [];
  equipment.bowManualSets = [];

  currentSessionId = null;
  session = null;
  seed = [];
  active = null;
  keyboardVisible = false;

  if (typeof closeEquipmentDetail === 'function') closeEquipmentDetail();

  document.getElementById('equipmentDetailScreen')?.classList.remove('open');
  document.getElementById('createScreen')?.classList.remove('open');
  document.getElementById('settingsScreen')?.classList.remove('open');

  showRoot('history');
  renderHistory();
  renderStats();
  renderEquipment();
  if (typeof archerySaveNow === 'function') archerySaveNow();
}

function storageStop(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function storageWireEvents() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('#importHistoryButton')) {
      storageStop(event);
      document.getElementById('importHistoryInput')?.click();
      return;
    }
    if (event.target.closest('#importEquipmentButton')) {
      storageStop(event);
      document.getElementById('importEquipmentInput')?.click();
      return;
    }
    if (event.target.closest('#exportHistoryButton')) {
      storageStop(event);
      storageExportHistory();
      return;
    }
    if (event.target.closest('#exportEquipmentButton')) {
      storageStop(event);
      storageExportEquipment();
      return;
    }
    if (event.target.closest('#resetAppButton')) {
      storageStop(event);
      storageResetAllData();
    }
  }, true);

  document.addEventListener('change', (event) => {
    if (event.target.matches('#importHistoryInput')) {
      storageStop(event);
      storageReadJsonFile(event.target.files?.[0], storageImportSessionsFromJson);
      event.target.value = '';
      return;
    }
    if (event.target.matches('#importEquipmentInput')) {
      storageStop(event);
      storageReadJsonFile(event.target.files?.[0], storageImportEquipmentFromJson);
      event.target.value = '';
    }
  }, true);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', storageWireEvents);
else storageWireEvents();
