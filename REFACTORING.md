# Refactoring plan

## Цель v2.0

Стабилизировать кодовую базу без изменения пользовательского поведения.

## Сделано

- CSS вынесен из `index.html` в `css/app.css`.
- Основной JavaScript вынесен из `index.html` в `js/app.js`.
- `index.html` оставлен как shell PWA с секциями экранов.
- `css/app.css` стал точкой входа и подключает CSS-модули через `@import`.
- CSS разделен на модули:
  - `css/base.css`
  - `css/session.css`
  - `css/history.css`
  - `css/stats.css`
  - `css/equipment.css`

## Следующие шаги

1. Разделить `js/app.js` на модули: storage, session, history, stats, equipment, settings.
2. Убрать runtime injection из service worker.
3. Перенести PWA update/persistence из `sw.js` в нормальный JS-модуль.
4. Вернуть удаление сессии уже в нормальной архитектуре, не через `sw.js`.
