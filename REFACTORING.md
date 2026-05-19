# Refactoring plan

## Цель v2.0

Стабилизировать кодовую базу без изменения пользовательского поведения.

## Что сделано в первом шаге

- CSS вынесен из `index.html` в `css/app.css`.
- Основной JavaScript вынесен из `index.html` в `js/app.js`.
- `index.html` оставлен как shell PWA с секциями экранов.
- `sw.js` пока не переписывается и остается совместимым со стабильной версией `1.16`.

## Следующие шаги

1. Разделить `css/app.css` на небольшие CSS-модули.
2. Разделить `js/app.js` на модули: storage, session, history, stats, equipment, settings.
3. Убрать runtime injection из service worker.
4. Вернуть удаление сессии уже в нормальной архитектуре, не через `sw.js`.
