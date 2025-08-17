import dotenv from 'dotenv'
import App from './app.js'
import { connectToDb } from './db/connectToDb.js'
import { connectToTgBot } from './tgBot/connectToTgBot.js'
import { jsonMiddleware } from './middlewares/jsonMiddleware.js'
import { corsMiddleware } from './middlewares/corsMiddleware.js'

// Загружаем переменные окружения
dotenv.config()

console.log('🚀 Запуск TradeBot...')

// 1. Запускаем сервер
const app = new App({
    PORT: process.env.PORT || 3000,
    middlewares: [...jsonMiddleware(), corsMiddleware()],
})

app.start()
    .then(() => {
        console.log('✅ Сервер запущен')

        // 2. Подключаемся к базе данных
        return connectToDb({
            uri: process.env.MONGODB_URI,
            dbName: 'tradebot',
        })
    })
    .then(() => {
        console.log('✅ База данных подключена')

        // 3. Запускаем Telegram бота
        return connectToTgBot({
            token: process.env.BOT_TOKEN,
        })
    })
    .then(() => {
        console.log('✅ Telegram бот запущен')
        console.log('🎉 TradeBot полностью запущен!')
    })
    .catch((error) => {
        console.error('💥 Ошибка запуска:', error.message)
        process.exit(1)
    })
