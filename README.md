# Warframe Price Tracker

[🇷🇺 Русский](#русский) | [🇬🇧 English](#english)

---

## Русский

**Warframe Price Tracker** — небольшой локальный трекер цен для **Warframe Market**. Проект предназначен для удобного отслеживания цен нужных предметов без лишних функций полноценного торгового или портфельного приложения.

### Возможности

- Отображение цены **минимального** и **максимального ранга** в основном списке.
- Раскрытие предмета с отображением цены каждого ранга.
- Кнопки **«Обновить»** и **«Обновить всё»** для контроля количества запросов к Warframe Market.
- Отдельное обновление категории вместе со всеми её подкатегориями.
- Неограниченная вложенность категорий.
- Свободное перемещение категорий и подкатегорий: категорию можно сделать верхнеуровневой, перенести в другую категорию или изменить её положение среди соседних категорий.
- Один предмет можно добавить сразу в несколько категорий без дублирования его данных.
- Избранные предметы отмечаются ★ и всегда находятся в начале своей категории независимо от выбранной сортировки.
- Сортировка предметов по названию, редкости, цене минимального ранга и цене максимального ранга.
- Редкость предмета с локализованным названием и соответствующим цветом.
- Поиск по отслеживаемым предметам.
- **Crossplay** и выбор статуса игроков: **Все / На сайте / В игре**.
- Русский и английский интерфейс с сохранением выбранного языка.
- Автоматическое название предмета из Warframe Market, если поле названия оставить пустым:
  - в русском интерфейсе — `Русское название (English Name)`;
  - в английском интерфейсе — `English Name`.
- Сохранение состояния раскрытых и свернутых категорий.
- Импорт и экспорт всех данных трекера в JSON.
- Отдельный сброс сохранённых цен без удаления предметов и категорий.
- Закреплённая верхняя панель с поиском и основными кнопками.
- Закреплённая нижняя панель со ссылками на Discord и GitHub.

### Запуск

Для работы программы требуется **Python 3**. Дополнительные Python-пакеты устанавливать не нужно.

Если Python ещё не установлен, скачайте его с официального сайта:

**https://www.python.org/downloads/**

После установки:

1. Откройте папку проекта.
2. Запустите **`Запустить.bat`**.
3. Откроется браузер с программой.

Не запускайте `index.html` напрямую. Программа использует локальный `server.py` как прокси для запросов к API Warframe Market, что позволяет обойти ограничения CORS браузера.

### Данные и резервная копия

Данные трекера хранятся локально в `localStorage` браузера. Программа не требует авторизации в Warframe Market и не хранит данные аккаунта.

Для переноса данных на другой компьютер или создания резервной копии используйте **«Настройки → Экспорт настроек»**. Полученный JSON-файл можно затем загрузить через **«Импорт настроек»**.

Кнопка **«Сбросить цены»** удаляет только сохранённые цены, имена продавцов и время обновления. Категории, предметы и их данные при этом сохраняются.

**«Сбросить все данные»** полностью очищает данные трекера.

### Структура проекта

Основные файлы программы находятся в системной папке `libs`, чтобы в корне проекта не было лишних файлов, которые могут запутать пользователя.

```text
WarframePriceTracker/
├── Запустить.bat
├── README.md
└── libs/
    ├── index.html
    ├── style.css
    ├── server.py
    └── js/
        ├── api.js
        ├── data.js
        ├── i18n.js
        ├── main.js
        ├── prices.js
        ├── state.js
        ├── store.js
        └── ui.js
```

### Версия

**V1.0**

---

## English

**Warframe Price Tracker** is a small local price tracker for **Warframe Market**. It is designed to make tracking selected items convenient without turning the project into a full trading or portfolio application.

### Features

- Shows **minimum-rank** and **maximum-rank** prices in the main list.
- Expandable ranked items with prices for every rank.
- Separate **Refresh** and **Refresh all** actions to control requests to Warframe Market.
- Refresh a category together with all of its nested subcategories.
- Unlimited category nesting.
- Freely move categories and subcategories: make a category top-level, move it into another category, or change its position among sibling categories.
- One item can belong to multiple categories without duplicating its data.
- Favorite items are marked with ★ and always stay at the top of their category regardless of the selected sorting method.
- Sort items by name, rarity, minimum-rank price, or maximum-rank price.
- Localized rarity names with matching colors.
- Search through tracked items.
- **Crossplay** and player-status selection: **All / Online / In-game**.
- Russian and English interface with persistent language selection.
- Automatic item names from Warframe Market when the name field is left empty:
  - Russian interface — `Russian name (English Name)`;
  - English interface — `English Name`.
- Persistent expanded/collapsed category state.
- Import and export of all tracker data as JSON.
- Separate saved-price reset without deleting items or categories.
- Sticky top panel with search and main controls.
- Sticky bottom panel with Discord and GitHub links.

### Running

The application requires **Python 3**. No additional Python packages are required.

If Python is not installed, download it from the official website:

**https://www.python.org/downloads/**

Then:

1. Open the project folder.
2. Run **`Запустить.bat`**.
3. The application will open in your browser.

Do not open `index.html` directly. The application uses the local `server.py` proxy to send requests to the Warframe Market API and avoid browser CORS restrictions.

### Data and backup

Tracker data is stored locally in the browser's `localStorage`. The application does not require Warframe Market authentication and does not store account data.

To move the tracker to another computer or create a backup, use **Settings → Export settings**. The resulting JSON file can later be loaded with **Settings → Import settings**.

**Reset prices** removes only saved prices, seller data and update timestamps. Categories, items and their metadata remain intact.

**Reset all data** completely clears the tracker data.

### Project structure

The application files are stored inside the `libs` system folder so that the project root contains only the launcher and documentation instead of a large number of technical files.

```text
WarframePriceTracker/
├── Запустить.bat
├── README.md
└── libs/
    ├── index.html
    ├── style.css
    ├── server.py
    └── js/
        ├── api.js
        ├── data.js
        ├── i18n.js
        ├── main.js
        ├── prices.js
        ├── state.js
        ├── store.js
        └── ui.js
```

### Version

**V1.0**
