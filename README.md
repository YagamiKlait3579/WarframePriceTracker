# Warframe Price Tracker

[🇷🇺 Русский](#русский) | [🇬🇧 English](#english)

---

## Русский

**Warframe Price Tracker** — небольшой локальный трекер цен для **Warframe Market**. Проект предназначен для удобного отслеживания цен нужных предметов без лишних функций полноценного торгового или портфельного приложения.

### Запуск

Для работы программы требуется **Python 3**. Дополнительные Python-пакеты устанавливать не нужно.

Если Python ещё не установлен, скачайте его с официального сайта:

**https://www.python.org/downloads/**

После установки:

1. Откройте папку проекта.
2. Запустите **`Запустить.bat`**.
3. Откроется браузер с программой.

### Данные и резервная копия

Данные трекера хранятся локально в `localStorage` браузера. Программа не требует авторизации в Warframe Market и не хранит данные аккаунта.

Для переноса данных на другой компьютер или создания резервной копии используйте **«Настройки → Экспорт настроек»**. Полученный JSON-файл можно затем загрузить через **«Импорт настроек»**.

Кнопка **«Сбросить цены»** удаляет только сохранённые цены, имена продавцов и время обновления. Категории, предметы и их данные при этом сохраняются.

**«Сбросить все данные»** полностью очищает данные трекера.

---

## English

**Warframe Price Tracker** is a small local price tracker for **Warframe Market**. It is designed to make tracking selected items convenient without turning the project into a full trading or portfolio application.

### Running

The application requires **Python 3**. No additional Python packages are required.

If Python is not installed, download it from the official website:

**https://www.python.org/downloads/**

Then:

1. Open the project folder.
2. Run **`Запустить.bat`**.
3. The application will open in your browser.

### Data and backup

Tracker data is stored locally in the browser's `localStorage`. The application does not require Warframe Market authentication and does not store account data.

To move the tracker to another computer or create a backup, use **Settings → Export settings**. The resulting JSON file can later be loaded with **Settings → Import settings**.

**Reset prices** removes only saved prices, seller data and update timestamps. Categories, items and their metadata remain intact.

**Reset all data** completely clears the tracker data.
