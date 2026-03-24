# BugReportery

**Мастерская баг-репортов** — веб-приложение для создания, сохранения и экспорта баг-репортов. Учебный проект для портфолио, развёрнутый на GitHub Pages с использованием Supabase (аутентификация, база данных).

## Сайт

Проект доступен по адресу: [https://bugreportery.qatest.tech](https://bugreportery.qatest.tech)

## Важное ограничение

- Проект является учебным и демонстрационным.
- Регистрация в приложении доступна только для email домена **`@qatest.tech`** (например, `name@qatest.tech`).

## Возможности

- Регистрация и вход пользователей (аутентификация через Supabase)
- Создание репорта с обязательными полями:
  - ID бага, название, описание, шаги воспроизведения, ожидаемый/фактический результат
- Сохранение репортов в облачной базе данных PostgreSQL (Supabase)
- Просмотр, загрузка в форму и удаление своих репортов
- Экспорт репорта в PDF (с возможностью вложения скриншотов, используется html2canvas и jsPDF)

## Как это работает

- **Фронтенд**: чистый HTML, CSS, JavaScript (ES6), размещён на GitHub Pages.
- **Бэкенд**: Supabase (PostgreSQL, Auth, Row Level Security). Пользователи видят только свои репорты.
- **Домен**: собственный домен `bugreportery.qatest.tech`, настроен через GitHub Pages с поддержкой HTTPS.

## Технологии

- HTML5, CSS3, JavaScript (ES6)
- [Supabase](https://supabase.com/) — аутентификация, база данных, API
- [html2canvas](https://html2canvas.hertzen.com/) — рендеринг страницы в изображение для PDF
- [jsPDF](https://github.com/parallax/jsPDF) — генерация PDF-документов

## Как запустить локально

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/webersrs123/BugReportery.git
   cd BugReportery
2. Для работы с Supabase вам понадобится создать проект в Supabase и получить:

- SUPABASE_URL

- SUPABASE_ANON_KEY

- Затем в файле index.html замените значения в блоке:

javascript
const SUPABASE_URL = 'https://ваш-проект.supabase.co';
const SUPABASE_ANON_KEY = 'ваш-ключ';
Откройте index.html в браузере (лучше использовать локальный сервер, например, с расширением Live Server VS Code).

**Примечание:** при локальном запуске убедитесь, что в Supabase настроены разрешённые домены для авторизации (в разделе Authentication → URL Configuration). Для локальной разработки добавьте http://localhost:5500 или адрес вашего локального сервера.


**Планы по развитию**
- Редактирование существующих репортов (сейчас можно загрузить в форму и сохранить как новый)

- Экспорт репорта в Markdown

- Пагинация и фильтрация списка репортов

- Загрузка вложений в Supabase Storage

- Улучшение интерфейса (отображение имени пользователя, спиннеры)

**Лицензии:** MIT © 2026 webersrs123

**Используемые библиотеки:** html2canvas — лицензия MIT, © Niklas von Hertzen

jsPDF — лицензия MIT, © James Hall, Parallax

Подробнее об использованных библиотеках см. [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)