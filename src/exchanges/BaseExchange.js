/** Базовый класс для всех бирж. Определяет общий интерфейс и базовую функциональность */
export default class BaseExchange {
    constructor(exchangeName) {
        this.exchangeName = exchangeName
        this.isConnected = false
        this.connectionStatus = 'disconnected' // 'connecting', 'connected', 'disconnected', 'error'
        this.volumeData = {
            buyVolume: 0,
            sellVolume: 0,
            totalVolume: 0,
            lastPrice: 0,
            timestamp: null,
        }
        this.trades = []
        this.intervalStartTime = null
    }

    /**
     * Получение конфигурации WebSocket для биржи. Должен быть переопределен в дочерних классах.
     * @returns {Object} Конфигурация WebSocket
     */
    getConfig() {
        throw new Error(
            `getConfig() должен быть реализован в ${this.exchangeName}`,
        )
    }

    /**
     * Обработка входящих сообщений WebSocket. Должен быть переопределен в дочерних классах.
     * @param {Object} data - Данные от WebSocket
     */
    onMessage(data) {
        throw new Error(
            `onMessage() должен быть реализован в ${this.exchangeName}`,
        )
    }

    /** Обработка успешного подключения */
    onConnect() {
        this.isConnected = true
        this.connectionStatus = 'connected'
        console.log(`✅ [${this.exchangeName}] -> подключено`)
    }

    /** Обработка ошибки подключения @param {Error} error - Ошибка подключения */
    onError(error) {
        this.isConnected = false
        this.connectionStatus = 'error'
        console.log(`❌ [${this.exchangeName}] -> не подключено`)
        console.error(`Ошибка ${this.exchangeName}:`, error.message)
    }

    /** Обработка закрытия соединения */
    onClose() {
        this.isConnected = false
        this.connectionStatus = 'disconnected'
        console.log(`🔌 ${this.exchangeName} -> соединение закрыто`)
    }

    /** Начало нового интервала расчета объемов */
    startNewInterval() {
        this.intervalStartTime = Date.now()
        this.volumeData = {
            buyVolume: 0,
            sellVolume: 0,
            totalVolume: 0,
            lastPrice: this.volumeData.lastPrice,
            timestamp: this.intervalStartTime,
        }
        this.trades = []
    }

    /**
     * Добавление сделки для расчета объемов.
     * @param {Object} trade - Данные сделки
     * @param {number} trade.price - Цена сделки
     * @param {number} trade.volume - Объем в USD
     * @param {string} trade.side - Сторона сделки ('buy' или 'sell')
     * @param {number} trade.timestamp - Время сделки
     */
    addTrade(trade) {
        this.trades.push(trade)
        this.volumeData.lastPrice = trade.price

        if (trade.side === 'buy') {
            this.volumeData.buyVolume += trade.volume
        } else if (trade.side === 'sell') {
            this.volumeData.sellVolume += trade.volume
        }

        this.volumeData.totalVolume =
            this.volumeData.buyVolume + this.volumeData.sellVolume
    }

    /** Получение текущих данных по объемам @returns {Object} Данные по объемам */
    getVolumeData() {
        return {
            ...this.volumeData,
            exchangeName: this.exchangeName,
            connectionStatus: this.connectionStatus,
            tradesCount: this.trades.length,
        }
    }

    /** Проверка, нужен ли ping для поддержания соединения @returns {boolean} true если нужен ping */
    needsPing() {
        return false // По умолчанию ping не нужен
    }

    /** Получение сообщения ping @returns {Object} Сообщение ping */
    getPingMessage() {
        return { op: 'ping' }
    }

    /** Получение интервала ping в миллисекундах @returns {number} Интервал ping */
    getPingInterval() {
        return 30000 // 30 секунд по умолчанию
    }
}
