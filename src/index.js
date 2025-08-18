import dotenv from 'dotenv'
import App from './app.js'
import { connectToDb } from './db/connectToDb.js'
import { connectToTgBot } from './tgBot/connectToTgBot.js'
import WS from './websocket/WS.js'
import CryptoOrders from './websocket/CryptoOrders.js'
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
        const cryptoOrders = new CryptoOrders()
        const wsConnections = new WS([
            {
                route: 'wss://ws.okx.com:8443/ws/v5/public',
                headers: {
                    'User-Agent': 'TradeBot/1.0',
                    Origin: 'https://www.okx.com',
                },
                subscriptions: [
                    {
                        op: 'subscribe',
                        args: [
                            {
                                channel: 'trades',
                                instId: 'BTC-USDT',
                            },
                        ],
                    },
                ],
                onMessage: [
                    (data) => cryptoOrders.CalculateValueOnInterval(data),
                ],
            },
        ])

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
