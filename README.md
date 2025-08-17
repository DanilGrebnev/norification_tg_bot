# Trade Bot

Bitcoin Volume Alert Bot - Telegram бот для мониторинга объемов торгов Bitcoin с уведомлениями.

## 📊 Описание

Этот бот отслеживает объемы торгов Bitcoin и отправляет уведомления о значительных изменениях в режиме реального времени. Основан на данных от aggr-server и реализует логику расчета объемов аналогично оригинальному проекту.

## 🚀 Быстрый старт

**⚠️ ВАЖНО: Перед запуском Trade Bot необходимо запустить aggr-server!**

### 1. Запустите aggr-server

```bash
cd aggr-server
npm install
node index
```

aggr-server будет доступен на `http://localhost:3000`

### 2. Настройте Trade Bot

```bash
cd tradeBot
yarn install
cp env.example .env
# Отредактируйте .env файл (см. ниже)
```

### 3. Запустите Trade Bot

```bash
yarn start
```

## ⚙️ Конфигурация

Создайте файл `.env` и заполните обязательные параметры:

```env
# Обязательные
BOT_TOKEN=your_telegram_bot_token_here
MONGODB_URI=mongodb://localhost:27017/tradebot

# aggr-server (по умолчанию)
AGGR_SERVER_URL=http://localhost:3000

# Trade Bot API (чтобы не конфликтовать с aggr-server)
PORT=3001
```

**Где взять BOT_TOKEN:** Напишите @BotFather в Telegram и создайте нового бота.

## 📋 Команды бота

-   `/start` - Регистрация и приветствие
-   `/subscribe` - Подписка на уведомления
-   `/unsubscribe` - Отписка от уведомлений
-   `/list` - Список активных подписок
-   `/settings` - Настройки (таймзона, язык)
-   `/help` - Справка

## 🔧 Технологии

-   **Node.js** + **Express.js** - серверная часть
-   **Grammy.js** - Telegram Bot API
-   **MongoDB** + **Mongoose** - база данных
-   **aggr-server** - источник данных о торгах

## 📚 Подробная документация

**👉 Полные инструкции по установке и настройке см. в [SETUP.md](SETUP.md)**

## 🏗️ Архитектура

```
Trade Bot
├── 📊 aggr-server (порт 3000) - источник данных торгов
├── 🤖 Trade Bot API (порт 3001) - основное приложение
├── 🗄️ MongoDB (порт 27017) - база данных
└── 📱 Telegram Bot - интерфейс пользователя
```

## ⚡ Быстрая диагностика

Если что-то не работает:

1. **aggr-server недоступен** → Проверьте `http://localhost:3000`
2. **MongoDB не подключается** → Убедитесь что MongoDB запущен
3. **Бот не отвечает** → Проверьте BOT_TOKEN
4. **Порт занят** → Измените PORT в .env

## 📊 API Endpoints

-   `GET /` - Информация о приложении
-   `GET /health` - Проверка состояния
-   `GET /api/users` - Пользователи
-   `GET /api/stats` - Статистика

## 🐳 Docker

```bash
docker-compose up --build
```

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте [SETUP.md](SETUP.md)
2. Убедитесь что aggr-server запущен
3. Проверьте логи приложения
