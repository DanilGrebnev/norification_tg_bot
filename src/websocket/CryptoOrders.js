/**
 * Класс для анализа криптовалютных ордеров
 */
export default class CryptoOrders {
    constructor() {
        this.intervalSeconds = 30
        this.trades = []
        this.nextBoundary = this.getNextTimeBoundary()

        const boundaryTime = new Date(this.nextBoundary)
        const timeString = `${boundaryTime
            .getUTCHours()
            .toString()
            .padStart(2, '0')}:${boundaryTime
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}:${boundaryTime
            .getUTCSeconds()
            .toString()
            .padStart(2, '0')}`

        console.log('[CryptoOrders] Следующая граница времени:', timeString)
    }

    /**
     * Расчет значений на интервале
     */
    CalculateValueOnInterval(data) {
        try {
            // Проверяем структуру данных
            if (!data || !data.data || !Array.isArray(data.data)) {
                return
            }

            // Добавляем торговые данные
            data.data.forEach((trade) => {
                this.trades.push({
                    price: trade.px,
                    side: trade.side,
                })
            })

            // Проверяем, достигли ли границы времени
            this.checkTimeBoundary()
        } catch (error) {
            console.error('[CryptoOrders] Ошибка обработки данных:', error)
        }
    }

    /**
     * Получение следующей границы времени (кратной 30 секундам)
     */
    getNextTimeBoundary() {
        const now = Date.now()
        const seconds = Math.floor(now / 1000)
        const nextBoundarySeconds =
            Math.ceil(seconds / this.intervalSeconds) * this.intervalSeconds
        return nextBoundarySeconds * 1000
    }

    /**
     * Проверка достижения границы времени
     */
    checkTimeBoundary() {
        const now = Date.now()

        if (now >= this.nextBoundary) {
            this.calculateAndReport()
            this.nextBoundary = this.getNextTimeBoundary()
        }
    }

    /**
     * Расчет и вывод результатов
     */
    calculateAndReport() {
        if (this.trades.length === 0) {
            console.log('[CryptoOrders] Нет торговых данных за интервал')
            return
        }

        let buyVolume = 0
        let sellVolume = 0

        this.trades.forEach((trade) => {
            const volume = +trade.price // Используем только px (цену) как есть

            if (trade.side === 'buy') {
                buyVolume += volume
            } else {
                sellVolume += volume
            }
        })

        const totalVolume = buyVolume + sellVolume
        const buyPercentage =
            totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 0

        const coinName = 'BTC-USDT'
        const now = new Date()
        const timeUTC = `${now.getUTCHours().toString().padStart(2, '0')}:${now
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}:${now
            .getUTCSeconds()
            .toString()
            .padStart(2, '0')}`
        const buyVol = buyVolume.toFixed(1)
        const sellVol = sellVolume.toFixed(1)

        console.log('Монета | Время UTC | Объём покупок | Объём продаж')
        console.log(`${coinName} | ${timeUTC} | ${buyVol} | ${sellVol}`)

        // Очищаем данные для следующего интервала
        this.trades = []
    }
}
