import dotenv from 'dotenv'
import App from './app.js'
import { connectToDb } from './db/connectToDb.js'
import { connectToTgBot } from './tgBot/connectToTgBot.js'
import WS from './websocket/WS.js'

import MultiExchangeAggregator from './websocket/MultiExchangeAggregator.js'
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

app.start(() => {
    console.log('✅ Сервер запущен')
})
    .then(() => {
        return connectToDb(
            {
                uri: process.env.MONGODB_URI,
                dbName: 'tradebot',
            },
            () => console.log('✅ База данных подключена'),
        )
    })
    .then(() => {
        return connectToTgBot(
            {
                token: process.env.BOT_TOKEN,
            },
            () => console.log('✅ Telegram бот запущен'),
        )
    })
    .then(() => {
        const multiExchange = new MultiExchangeAggregator()
        const wsConnections = new WS(multiExchange.getAllConfigs())

        // Ждем завершения подключения или получаем ошибку
        return wsConnections.waitForConnection()
    })
    .then(() => {
        console.log('✅ WebSocket подключен')
        console.log('🎉 TradeBot полностью запущен!')
    })
    .catch((error) => {
        console.error('💥 Ошибка запуска:', error.message)
        process.exit(1)
    })
