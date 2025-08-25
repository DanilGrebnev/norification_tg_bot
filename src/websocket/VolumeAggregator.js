import HTTP from '../http/HTTP.js'

/**
 * Класс для агрегации объемов торгов по всем биржам.
 * Рассчитывает объемы покупок и продаж за 30-секундные интервалы.
 */
export default class VolumeAggregator {
    constructor(exchanges = []) {
        this.exchanges = exchanges
        this.intervalDuration = 30000 // 30 секунд в миллисекундах
        this.intervalTimer = null
        this.isRunning = false
        this.currentIntervalStart = null

        // HTTP клиент для получения исторических данных
        this.httpClient = new HTTP()
        this.historicalAverages = { avgVbuy: 0, avgVsell: 0 }
        this.historicalDataLoaded = false

        // Статистика по интервалам
        this.intervalHistory = []
        this.maxHistoryLength = 10 // Храним последние 10 интервалов

        // История по каждой бирже для отображения последних 6 интервалов
        // Map<exchangeName, Array<{ time:number, buy:number, sell:number }>>
        this.historyByExchange = new Map()

        // Инициализируем буферы истории для всех бирж
        this.exchanges.forEach((exchange) => {
            this.historyByExchange.set(exchange.exchangeName, [])
        })

        // Глобальная история (агрегированная по всем биржам) для 6 интервалов
        // Array<{ time:number, buy:number, sell:number }>
        this.globalHistory = []
    }

    /** Запуск системы агрегации объемов */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ VolumeAggregator уже запущен')
            return
        }

        // Сначала загружаем исторические данные
        await this.loadHistoricalData()

        this.isRunning = true
        this.startNewInterval()

        console.log('📊 Система расчета объемов запущена')
        console.log(
            `⏱️ Интервал расчета: ${this.intervalDuration / 1000} секунд`,
        )
    }

    /** Загрузка исторических данных для сравнения */
    async loadHistoricalData() {
        try {
            console.log('🔄 Загрузка исторических данных для анализа...')
            this.historicalAverages = await this.httpClient.getAverageVolumes(
                '1h',
            )
            this.historicalDataLoaded = true
            console.log('✅ Исторические средние значения загружены:', {
                avgBuy: this.formatMoney(this.historicalAverages.avgVbuy),
                avgSell: this.formatMoney(this.historicalAverages.avgVsell),
                intervals: this.historicalAverages.intervalsCount,
            })
        } catch (error) {
            console.error(
                '❌ Ошибка загрузки исторических данных:',
                error.message,
            )
            this.historicalAverages = { avgVbuy: 0, avgVsell: 0 }
            this.historicalDataLoaded = false
        }
    }

    /** Остановка системы агрегации объемов */
    stop() {
        if (this.intervalTimer) {
            clearTimeout(this.intervalTimer)
            this.intervalTimer = null
        }
        this.isRunning = false
        console.log('🛑 Система расчета объемов остановлена')
    }

    /** Начало нового интервала расчета */
    startNewInterval() {
        const now = Date.now()

        // Вычисляем ближайшую границу 30s вперёд
        const secondsInCurrentMinute = Math.floor((now / 1000) % 60)
        const secondsToNext30 =
            secondsInCurrentMinute < 30
                ? 30 - secondsInCurrentMinute
                : 60 - secondsInCurrentMinute
        const nextBoundary = now + secondsToNext30 * 1000

        // Текущий бар: [intervalStart, nextBoundary), метка = intervalStart
        const intervalStart = nextBoundary - this.intervalDuration
        this.currentIntervalStart = intervalStart

        // Таймер завершения бара на границе nextBoundary
        const timeToWait = nextBoundary - now
        this.intervalTimer = setTimeout(() => {
            this.completeInterval()
        }, timeToWait)

        const boundaryTime = new Date(nextBoundary).toLocaleTimeString('ru-RU')
        console.log(`🔄 Новый интервал завершится в ${boundaryTime}`)
    }

    /** Завершение текущего интервала и вывод результатов */
    completeInterval() {
        // Завершаем бар: интервал = [currentIntervalStart, currentIntervalStart + duration)
        const intervalStart = this.currentIntervalStart
        const intervalEnd = intervalStart + this.intervalDuration
        const intervalData = this.collectIntervalData(intervalEnd)

        // Обновляем историю для каждой биржи (буфер из 6 элементов)
        this.exchanges.forEach((exchange) => {
            const vd = exchange.getVolumeData()
            const snapshot = {
                time: intervalStart,
                buy: vd.buyVolume,
                sell: vd.sellVolume,
            }
            const list = this.historyByExchange.get(exchange.exchangeName) || []
            list.push(snapshot)
            while (list.length > 6) list.shift()
            this.historyByExchange.set(exchange.exchangeName, list)
        })

        // Обновляем глобальную историю (суммарные покупки/продажи по всем биржам)
        // Используем только текущие объемы без добавления исторических
        const globalSnap = {
            time: intervalStart,
            buy: intervalData.totals.buyVolume,
            sell: intervalData.totals.sellVolume,
        }
        this.globalHistory.push(globalSnap)
        while (this.globalHistory.length > 6) this.globalHistory.shift()

        // Сохраняем данные интервала в историю
        this.intervalHistory.push(intervalData)
        if (this.intervalHistory.length > this.maxHistoryLength) {
            this.intervalHistory.shift()
        }

        // Выводим единую агрегированную таблицу
        this.displayGlobalTable()

        // Выводим сравнение с историческими средними
        if (this.historicalDataLoaded) {
            this.displayHistoricalComparison(intervalData.totals)
        }

        // На границе интервала сбрасываем счетчики для следующего бара
        this.exchanges.forEach((exchange) => {
            exchange.startNewInterval()
        })

        // Запускаем следующий интервал
        if (this.isRunning) {
            this.startNewInterval()
        }
    }

    /** Сбор данных по всем биржам за завершенный интервал */
    collectIntervalData(intervalEnd) {
        const intervalData = {
            startTime: this.currentIntervalStart,
            endTime: intervalEnd,
            duration: intervalEnd - this.currentIntervalStart,
            exchanges: [],
            totals: {
                buyVolume: 0,
                sellVolume: 0,
                totalVolume: 0,
                lastPrice: 0,
                connectedExchanges: 0,
            },
        }

        this.exchanges.forEach((exchange) => {
            const volumeData = exchange.getVolumeData()
            intervalData.exchanges.push(volumeData)

            // Суммируем общие объемы только от подключенных бирж
            if (volumeData.connectionStatus === 'connected') {
                intervalData.totals.buyVolume += volumeData.buyVolume
                intervalData.totals.sellVolume += volumeData.sellVolume
                intervalData.totals.totalVolume += volumeData.totalVolume
                intervalData.totals.connectedExchanges++

                // Берем последнюю цену от любой подключенной биржи
                if (volumeData.lastPrice > 0) {
                    intervalData.totals.lastPrice = volumeData.lastPrice
                }
            }
        })

        return intervalData
    }

    /** Отображение таблиц по каждой бирже в требуемом формате */
    displayGlobalTable() {
        const indexes = ['-5', '-4', '-3', '-2', '-1', 'Текущий']

        // Берем последние 6 интервалов глобальной истории
        const lastSix = Array(6).fill(null)
        const recent = this.globalHistory.slice(-6)
        for (let i = 0; i < recent.length; i++) {
            lastSix[6 - recent.length + i] = recent[i]
        }

        // Формируем строки
        const colors = lastSix.map((s) =>
            s ? this.getVolumeColor(s.buy, s.sell) : '',
        )
        const times = lastSix.map((s) =>
            s ? new Date(s.time).toISOString().substring(11, 19) : '',
        )
        const buys = lastSix.map((s) => (s ? this.formatMoney(s.buy) : ''))
        const sells = lastSix.map((s) => (s ? this.formatMoney(s.sell) : ''))

        // Вывод через console.table
        const makeRow = (label, arr) => {
            const row = { '(index)': label }
            indexes.forEach((key, i) => {
                row[key] = arr[i] ?? ''
            })
            return row
        }

        const tableData = [
            makeRow('Цвет', colors),
            makeRow('Время UTC', times),
            makeRow('Покупки ($)', buys),
            makeRow('Продажи ($)', sells),
        ]

        console.log('\n' + '='.repeat(100))
        console.log('📊 ОБЩИЙ ОБЪЕМ ТОРГОВ (30с) — агрегировано по всем биржам')
        console.table(tableData)
        console.log('='.repeat(100) + '\n')
    }

    /**
     * Форматирование денежных значений: тысячи через точку, 2 знака после запятой.
     * Пример: 1234567.8 -> 1.234.567,80
     */
    formatMoney(value) {
        try {
            return new Intl.NumberFormat('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(value)
        } catch (e) {
            return String(value)
        }
    }

    /** Определение цвета объемного бара */
    getVolumeColor(buyVolume, sellVolume) {
        const total = buyVolume + sellVolume
        if (this.historicalDataLoaded) {
            const avgBuy = this.historicalAverages.avgVbuy || 0
            const avgSell = this.historicalAverages.avgVsell || 0
            const avgTotal = avgBuy + avgSell

            if (avgTotal > 0 && total > 0) {
                const baselineBuyRatio = avgBuy / avgTotal
                const currentBuyRatio = buyVolume / total

                return currentBuyRatio >= baselineBuyRatio ? '🟢' : '🔴'
            }
        }

        if (buyVolume > sellVolume) {
            return '🟢' // Зеленый - покупок больше
        } else if (sellVolume > buyVolume) {
            return '🔴' // Красный - продаж больше
        } else {
            return '🔴' // Красный по умолчанию при равенстве
        }
    }

    /** Отображение сравнения с историческими средними */
    displayHistoricalComparison(currentTotals) {
        const buyDiff =
            currentTotals.buyVolume - this.historicalAverages.avgVbuy
        const sellDiff =
            currentTotals.sellVolume - this.historicalAverages.avgVsell

        const buyPercentChange =
            this.historicalAverages.avgVbuy > 0
                ? ((buyDiff / this.historicalAverages.avgVbuy) * 100).toFixed(1)
                : '0.0'
        const sellPercentChange =
            this.historicalAverages.avgVsell > 0
                ? ((sellDiff / this.historicalAverages.avgVsell) * 100).toFixed(
                      1,
                  )
                : '0.0'

        console.log('\n' + '='.repeat(80))
        console.log('📈 СРАВНЕНИЕ С ИСТОРИЧЕСКИМИ СРЕДНИМИ (за 1 час)')
        console.log('='.repeat(80))
        console.log(`Покупки:`)
        console.log(
            `  Текущий интервал: ${this.formatMoney(currentTotals.buyVolume)}`,
        )
        console.log(
            `  Историческое среднее: ${this.formatMoney(
                this.historicalAverages.avgVbuy,
            )}`,
        )
        console.log(
            `  Разница: ${buyDiff >= 0 ? '+' : ''}${this.formatMoney(
                buyDiff,
            )} (${buyPercentChange >= 0 ? '+' : ''}${buyPercentChange}%)`,
        )

        console.log(`Продажи:`)
        console.log(
            `  Текущий интервал: ${this.formatMoney(currentTotals.sellVolume)}`,
        )
        console.log(
            `  Историческое среднее: ${this.formatMoney(
                this.historicalAverages.avgVsell,
            )}`,
        )
        console.log(
            `  Разница: ${sellDiff >= 0 ? '+' : ''}${this.formatMoney(
                sellDiff,
            )} (${sellPercentChange >= 0 ? '+' : ''}${sellPercentChange}%)`,
        )
        console.log('='.repeat(80) + '\n')
    }
}
