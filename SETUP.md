# Инструкция по настройке и запуску Trade Bot

## Предварительные требования

1. **Node.js** (версия 18.0.0 или выше)
2. **MongoDB** (локально или удаленно)
3. **aggr-server** (должен быть запущен отдельно)
4. **Telegram Bot Token** (получить у @BotFather)

## Шаг 1: Запуск aggr-server

Trade Bot получает данные о торгах от aggr-server, поэтому его нужно запустить первым.

### Вариант A: Локальный запуск aggr-server

1. Перейдите в папку `aggr-server`:

    ```bash
    cd aggr-server
    ```

2. Установите зависимости:

    ```bash
    npm install
    ```

3. Скопируйте конфигурационный файл:

    ```bash
    cp config.json.example config.json
    ```

4. Запустите сервер:

    ```bash
    node index
    ```

    По умолчанию aggr-server будет доступен на `http://localhost:3000`

### Вариант B: Запуск aggr-server через Docker

1. Перейдите в папку `aggr-server`:

    ```bash
    cd aggr-server
    ```

2. Запустите через Docker Compose:
    ```bash
    docker-compose build
    docker-compose up -d
    ```

### Проверка работы aggr-server

Откройте в браузере `http://localhost:3000` - должна открыться страница aggr-server.

## Шаг 2: Настройка Trade Bot

1. Перейдите в папку `tradeBot`:

    ```bash
    cd tradeBot
    ```

2. Установите зависимости:

    ```bash
    yarn install
    ```

3. Создайте файл `.env` на основе примера:

    ```bash
    cp env.example .env
    ```

4. Отредактируйте файл `.env`:

    ```env
    # Обязательные параметры
    BOT_TOKEN=your_telegram_bot_token_here
    MONGODB_URI=mongodb://localhost:27017/tradebot

    # aggr-server (по умолчанию)
    AGGR_SERVER_URL=http://localhost:3000

    # Дополнительные параметры
    PORT=3001
    NODE_ENV=development
    NOTIFICATION_CHECK_INTERVAL=60000
    ```

## Шаг 3: Получение Telegram Bot Token

1. Найдите бота @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен в файл `.env`

## Шаг 4: Запуск MongoDB

### Локально:

```bash
mongod --dbpath /path/to/your/db
```

### Через Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

## Шаг 5: Запуск Trade Bot

```bash
cd tradeBot
yarn start
```

Или для разработки:

```bash
yarn dev
```

## Проверка работы

1. **aggr-server**: `http://localhost:3000` - должен отвечать
2. **Trade Bot API**: `http://localhost:3001` - должен показать информацию о приложении
3. **Telegram Bot**: Найдите вашего бота в Telegram и отправьте `/start`

## Структура портов

-   **aggr-server**: `3000` (источник данных о торгах)
-   **Trade Bot**: `3001` (API и Telegram bot)
-   **MongoDB**: `27017` (база данных)

## Переменные окружения

### Обязательные:

-   `BOT_TOKEN` - токен Telegram бота
-   `MONGODB_URI` - строка подключения к MongoDB

### Опциональные:

-   `AGGR_SERVER_URL` - адрес aggr-server (по умолчанию: http://localhost:3000)
-   `PORT` - порт Trade Bot API (по умолчанию: 3000)
-   `NOTIFICATION_CHECK_INTERVAL` - интервал проверки уведомлений в мс (по умолчанию: 60000)
-   `CORS_ORIGIN` - разрешенные origins для CORS (по умолчанию: \*)

## Возможные проблемы

### 1. "aggr-server недоступен"

-   Убедитесь, что aggr-server запущен на порту 3000
-   Проверьте `AGGR_SERVER_URL` в `.env`

### 2. "Ошибка подключения к MongoDB"

-   Убедитесь, что MongoDB запущен
-   Проверьте `MONGODB_URI` в `.env`

### 3. "Ошибка Telegram Bot"

-   Проверьте правильность `BOT_TOKEN`
-   Убедитесь, что токен активен

### 4. "Port already in use"

-   Измените `PORT` в `.env`
-   Или остановите процесс: `kill $(lsof -t -i:3000)`

## Команды бота

После успешного запуска бот поддерживает следующие команды:

-   `/start` - Регистрация и приветствие
-   `/subscribe` - Подписка на уведомления
-   `/unsubscribe` - Отписка от уведомлений
-   `/list` - Список активных подписок
-   `/settings` - Настройки (таймзона, язык)
-   `/help` - Справка

## Логи

Trade Bot выводит подробные логи в консоль:

-   ✅ - успешные операции
-   ⚠️ - предупреждения
-   ❌ - ошибки
-   📊 - данные о торгах
-   🔍 - проверки системы
