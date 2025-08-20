import VolumeAnalyzer from '../analysis/VolumeAnalyzer.js'

/**
 * Класс для подключения к трём биржам по WebSocket
 */
export default class MultiExchangeAggregator {
    constructor() {
        this.volumeAnalyzer = new VolumeAnalyzer()
        this.exchanges = {
            binance: {
                ws: null,
                url: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
                data: { price: 0, volume: 0, timestamp: 0 },
            },
            bybit: {
                ws: null,
                url: 'wss://stream.bybit.com/v5/public/spot',
                data: { price: 0, volume: 0, timestamp: 0 },
            },
            coinbase: {
                ws: null,
                url: 'wss://ws-feed.pro.coinbase.com',
                data: { price: 0, volume: 0, timestamp: 0 },
            },
        }

        this.candleData = {
            open: null,
            high: 0,
            low: Infinity,
            close: 0,
            volume: 0,
            timestamp: null,
            interval: 60000, // 1 минута
        }

        this.trades = []
        this.connectionStatus = {
            binance: false,
            bybit: false,
            coinbase: false,
        }
        this.allConnectionsReady = false
    }

    /**
     * Получение конфигурации для Binance WebSocket
     *
     * @typedef {Object} BinanceTradeData
     * @property {string} e - Тип события ('trade')
     * @property {number} E - Время события (timestamp в миллисекундах)
     * @property {string} s - Торговая пара ('BTCUSDT')
     * @property {number} t - ID сделки
     * @property {string} p - Цена сделки
     * @property {string} q - Количество (объем)
     * @property {number} T - Время сделки (timestamp)
     * @property {boolean} m - Maker side (false = покупка, true = продажа)
     * @property {boolean} M - Ignore (можно игнорировать)
     *
     * Пример данных:
     * {
     *   e: 'trade',
     *   E: 1755613765692,
     *   s: 'BTCUSDT',
     *   t: 5170731426,
     *   p: '114130.01000000',
     *   q: '0.00438000',
     *   T: 1755613765692,
     *   m: false,
     *   M: true
     * }
     */
    getBinanceConfig() {
        return {
            exchangeName: 'Binance',
            route: 'wss://stream.binance.com:9443/ws/btcusdt@trade',
            headers: {
                'User-Agent': 'TradeBot/1.0',
            },
            subscriptions: [],
            onMessage: [
                (data) => {
                    // Обрабатываем сделки сразу по приходу, не дожидаясь всех подключений
                    this.volumeAnalyzer.processBinanceTrade(data)
                    // console.log('[Binance]', data) // Временно отключено
                },
            ],
            onConnect: () => {
                console.log('✅ Binance WebSocket подключен')
                this.connectionStatus.binance = true
                this.checkAllConnections()
            },
            onError: (error) => {
                console.log(
                    '❌ Binance WebSocket ошибка подключения:',
                    error.message,
                )
                this.connectionStatus.binance = 'error'
                this.checkAllConnections()
            },
        }
    }

    /**
     * Получение конфигурации для Bybit WebSocket
     *
     * @typedef {Object} BybitTradeData
     * @property {string} topic - Канал подписки ('publicTrade.BTCUSDT')
     * @property {number} ts - Timestamp сообщения в миллисекундах
     * @property {string} type - Тип данных ('snapshot' или 'delta')
     * @property {Array<BybitTrade>} data - Массив сделок
     *
     * @typedef {Object} BybitTrade
     * @property {string} i - ID сделки
     * @property {number} T - Timestamp сделки в миллисекундах
     * @property {string} p - Цена сделки
     * @property {string} v - Объем сделки
     * @property {string} S - Сторона сделки ('Sell' или 'Buy')
     * @property {number} seq - Sequence number
     * @property {string} s - Символ торговой пары
     * @property {boolean} BT - Block trade flag
     * @property {boolean} RPI - Reduce position indicator
     *
     * Пример данных:
     * {
     *   topic: 'publicTrade.BTCUSDT',
     *   ts: 1755613765932,
     *   type: 'snapshot',
     *   data: [{
     *     i: '2290000000879452587',
     *     T: 1755613765931,
     *     p: '114123.9',
     *     v: '0.000215',
     *     S: 'Sell',
     *     seq: 82836106168,
     *     s: 'BTCUSDT',
     *     BT: false,
     *     RPI: false
     *   }]
     * }
     */
    getBybitConfig() {
        return {
            exchangeName: 'Bybit',
            route: 'wss://stream.bybit.com/v5/public/spot',
            headers: {
                'User-Agent': 'TradeBot/1.0',
            },
            subscriptions: [
                {
                    op: 'subscribe',
                    args: ['publicTrade.BTCUSDT'],
                },
            ],
            onMessage: [
                (data) => {
                    if (data.data) {
                        data.data.forEach((trade) => {
                            this.volumeAnalyzer.processBybitTrade(trade)
                        })
                        // console.log('[Bybit]', data) // Временно отключено
                    }
                },
            ],
            onConnect: () => {
                console.log('✅ Bybit WebSocket подключен')
                this.connectionStatus.bybit = true
                this.checkAllConnections()
            },
            onError: (error) => {
                console.log(
                    '❌ Bybit WebSocket ошибка подключения:',
                    error.message,
                )
                this.connectionStatus.bybit = 'error'
                this.checkAllConnections()
            },
        }
    }

    /**
     * Получение конфигурации для Coinbase WebSocket
     *
     * @typedef {Object} CoinbaseData
     * @property {*} [data] - Структура данных пока неизвестна (не удается подключиться)
     *
     * TODO: Обновить документацию после успешного подключения к Coinbase
     * Ожидаемый формат: ticker данные для BTC-USD пары
     */
    getCoinbaseConfig() {
        return {
            exchangeName: 'Coinbase',
            route: 'wss://ws-feed.pro.coinbase.com',
            headers: {
                'User-Agent': 'TradeBot/1.0',
            },
            subscriptions: [
                {
                    type: 'subscribe',
                    product_ids: ['BTC-USD'],
                    channels: ['ticker'],
                },
            ],
            onMessage: [
                (data) => {
                    // console.log('[Coinbase]', data) // Временно отключено
                },
            ],
            onConnect: () => {
                console.log('✅ Coinbase WebSocket подключен')
                this.connectionStatus.coinbase = true
                this.checkAllConnections()
            },
            onError: (error) => {
                console.log(
                    '❌ Coinbase WebSocket ошибка подключения:',
                    error.message,
                )
                this.connectionStatus.coinbase = 'error'
                this.checkAllConnections()
            },
        }
    }

    /**
     * Проверка готовности всех подключений
     */
    checkAllConnections() {
        const allResolved = Object.values(this.connectionStatus).every(
            (status) => status === true || status === 'error',
        )

        if (allResolved && !this.allConnectionsReady) {
            this.allConnectionsReady = true

            // Выводим статус каждой биржи
            console.log('📊 Статус подключений к биржам:')
            Object.entries(this.connectionStatus).forEach(
                ([exchange, status]) => {
                    if (status === true) {
                        console.log(`✅ ${exchange.toUpperCase()}: подключено`)
                    } else if (status === 'error') {
                        console.log(
                            `❌ ${exchange.toUpperCase()}: ошибка подключения`,
                        )
                    }
                },
            )

            console.log('🎯 Все подключения завершены, начинаем вывод данных')
        }
    }

    /**
     * Получение всех конфигураций WebSocket
     */
    getAllConfigs() {
        return [
            this.getBinanceConfig(),
            this.getBybitConfig(),
            this.getCoinbaseConfig(),
        ]
    }
}
