/**
 * Класс для анализа объемов торгов по биржам каждые 30 секунд
 */
export default class VolumeAnalyzer {
    constructor() {
        this.currentBar = {
            timestamp: null,
            vbuy: 0, // Объем покупок в USD
            vsell: 0, // Объем продаж в USD
            cbuy: 0, // Количество сделок покупок
            csell: 0, // Количество сделок продаж
            lastPrice: 0, // Цена последней сделки в USD
            interval: 30000, // 30 секунд
        }
        this.history = [] // История последних 5 баров
        this.nextBoundary = this.getNextTimeBoundary()
        this.startAnalysis()
    }

    // Обрабатывает торговые данные от Binance и добавляет в агрегацию
    processBinanceTrade(data) {
        if (data.e === 'trade') {
            const trade = {
                exchange: 'binance',
                price: parseFloat(data.p),
                volume: parseFloat(data.q),
                volumeUSD: parseFloat(data.p) * parseFloat(data.q),
                side: data.m ? 'sell' : 'buy',
                timestamp: data.T,
            }
            this.processTrade(trade)
        }
    }

    // Обрабатывает торговые данные от Bybit и добавляет в агрегацию
    processBybitTrade(tradeData) {
        const trade = {
            exchange: 'bybit',
            price: parseFloat(tradeData.p),
            volume: parseFloat(tradeData.v),
            volumeUSD: parseFloat(tradeData.p) * parseFloat(tradeData.v),
            side: tradeData.S.toLowerCase(),
            timestamp: tradeData.T,
        }
        this.processTrade(trade)
    }

    // Получает следующую границу времени кратную 30 секундам
    getNextTimeBoundary() {
        const now = Date.now()
        const seconds = Math.floor(now / 1000)
        const nextBoundarySeconds = Math.ceil(seconds / 30) * 30
        return nextBoundarySeconds * 1000
    }

    // Агрегирует торговые данные по временным интервалам и сторонам
    processTrade(trade) {
        if (this.currentBar.timestamp === null) {
            this.startNewBar(this.nextBoundary)
        }

        // Сохраняем цену последней сделки
        this.currentBar.lastPrice = trade.price

        if (trade.side === 'buy') {
            this.currentBar.vbuy += trade.volumeUSD
            this.currentBar.cbuy += 1
        } else {
            this.currentBar.vsell += trade.volumeUSD
            this.currentBar.csell += 1
        }
    }

    // Добавляет завершенный бар в историю и поддерживает максимум 5 записей
    addToHistory(bar) {
        this.history.push(bar)
        if (this.history.length > 5) {
            this.history.shift() // Удаляем самый старый элемент
        }
    }

    // Начинает новый временной интервал для агрегации данных
    startNewBar(timestamp) {
        this.currentBar = {
            timestamp: timestamp,
            vbuy: 0,
            vsell: 0,
            cbuy: 0,
            csell: 0,
            lastPrice: 0,
            interval: 30000,
        }
    }

    // Определяет цвет бара на основе преобладающего объема торгов
    determineVolumeBarColor(vbuy, vsell) {
        return vbuy > vsell ? '🟢' : '🔴'
    }

    // Форматирует timestamp в строку времени UTC (чч:мм:сс)
    formatTimeUTC(timestamp) {
        if (!timestamp || timestamp === 0) {
            return '-'
        }
        const date = new Date(timestamp)
        return `${date.getUTCHours().toString().padStart(2, '0')}:${date
            .getUTCMinutes()
            .toString()
            .padStart(2, '0')}:${date
            .getUTCSeconds()
            .toString()
            .padStart(2, '0')}`
    }

    // Выводит завершенный бар в консоль в виде таблицы с историческими данными
    emitCompletedBar() {
        // Используем только историю, без текущего бара (он еще собирается)
        const allData = [...this.history]
        // Сортируем по времени в убывающем порядке (самый новый первый)
        allData.sort((a, b) => b.timestamp - a.timestamp)

        const tableData = {
            Цвет: {
                '-5':
                    allData[5] && allData[5].timestamp
                        ? this.determineVolumeBarColor(
                              allData[5].vbuy,
                              allData[5].vsell,
                          )
                        : '-',
                '-4':
                    allData[4] && allData[4].timestamp
                        ? this.determineVolumeBarColor(
                              allData[4].vbuy,
                              allData[4].vsell,
                          )
                        : '-',
                '-3':
                    allData[3] && allData[3].timestamp
                        ? this.determineVolumeBarColor(
                              allData[3].vbuy,
                              allData[3].vsell,
                          )
                        : '-',
                '-2':
                    allData[2] && allData[2].timestamp
                        ? this.determineVolumeBarColor(
                              allData[2].vbuy,
                              allData[2].vsell,
                          )
                        : '-',
                '-1':
                    allData[1] && allData[1].timestamp
                        ? this.determineVolumeBarColor(
                              allData[1].vbuy,
                              allData[1].vsell,
                          )
                        : '-',
                Текущий:
                    allData[0] && allData[0].timestamp
                        ? this.determineVolumeBarColor(
                              allData[0].vbuy,
                              allData[0].vsell,
                          )
                        : '-',
            },
            'Время UTC': {
                '-5': allData[5]
                    ? this.formatTimeUTC(allData[5].timestamp)
                    : '-',
                '-4': allData[4]
                    ? this.formatTimeUTC(allData[4].timestamp)
                    : '-',
                '-3': allData[3]
                    ? this.formatTimeUTC(allData[3].timestamp)
                    : '-',
                '-2': allData[2]
                    ? this.formatTimeUTC(allData[2].timestamp)
                    : '-',
                '-1': allData[1]
                    ? this.formatTimeUTC(allData[1].timestamp)
                    : '-',
                Текущий: allData[0]
                    ? this.formatTimeUTC(allData[0].timestamp)
                    : '-',
            },
            'Покупки ($)': {
                '-5':
                    allData[5] && allData[5].timestamp
                        ? allData[5].vbuy.toFixed(2)
                        : '-',
                '-4':
                    allData[4] && allData[4].timestamp
                        ? allData[4].vbuy.toFixed(2)
                        : '-',
                '-3':
                    allData[3] && allData[3].timestamp
                        ? allData[3].vbuy.toFixed(2)
                        : '-',
                '-2':
                    allData[2] && allData[2].timestamp
                        ? allData[2].vbuy.toFixed(2)
                        : '-',
                '-1':
                    allData[1] && allData[1].timestamp
                        ? allData[1].vbuy.toFixed(2)
                        : '-',
                Текущий:
                    allData[0] && allData[0].timestamp
                        ? allData[0].vbuy.toFixed(2)
                        : '-',
            },
            'Продажи ($)': {
                '-5':
                    allData[5] && allData[5].timestamp
                        ? allData[5].vsell.toFixed(2)
                        : '-',
                '-4':
                    allData[4] && allData[4].timestamp
                        ? allData[4].vsell.toFixed(2)
                        : '-',
                '-3':
                    allData[3] && allData[3].timestamp
                        ? allData[3].vsell.toFixed(2)
                        : '-',
                '-2':
                    allData[2] && allData[2].timestamp
                        ? allData[2].vsell.toFixed(2)
                        : '-',
                '-1':
                    allData[1] && allData[1].timestamp
                        ? allData[1].vsell.toFixed(2)
                        : '-',
                Текущий:
                    allData[0] && allData[0].timestamp
                        ? allData[0].vsell.toFixed(2)
                        : '-',
            },
            'Общий ($)': {
                '-5':
                    allData[5] && allData[5].timestamp
                        ? (allData[5].vbuy + allData[5].vsell).toFixed(2)
                        : '-',
                '-4':
                    allData[4] && allData[4].timestamp
                        ? (allData[4].vbuy + allData[4].vsell).toFixed(2)
                        : '-',
                '-3':
                    allData[3] && allData[3].timestamp
                        ? (allData[3].vbuy + allData[3].vsell).toFixed(2)
                        : '-',
                '-2':
                    allData[2] && allData[2].timestamp
                        ? (allData[2].vbuy + allData[2].vsell).toFixed(2)
                        : '-',
                '-1':
                    allData[1] && allData[1].timestamp
                        ? (allData[1].vbuy + allData[1].vsell).toFixed(2)
                        : '-',
                Текущий:
                    allData[0] && allData[0].timestamp
                        ? (allData[0].vbuy + allData[0].vsell).toFixed(2)
                        : '-',
            },
            'Последняя цена ($)': {
                '-5':
                    allData[5] && allData[5].timestamp && allData[5].lastPrice
                        ? allData[5].lastPrice.toFixed(2)
                        : '-',
                '-4':
                    allData[4] && allData[4].timestamp && allData[4].lastPrice
                        ? allData[4].lastPrice.toFixed(2)
                        : '-',
                '-3':
                    allData[3] && allData[3].timestamp && allData[3].lastPrice
                        ? allData[3].lastPrice.toFixed(2)
                        : '-',
                '-2':
                    allData[2] && allData[2].timestamp && allData[2].lastPrice
                        ? allData[2].lastPrice.toFixed(2)
                        : '-',
                '-1':
                    allData[1] && allData[1].timestamp && allData[1].lastPrice
                        ? allData[1].lastPrice.toFixed(2)
                        : '-',
                Текущий:
                    allData[0] && allData[0].timestamp && allData[0].lastPrice
                        ? allData[0].lastPrice.toFixed(2)
                        : '-',
            },
        }

        console.log('\n📊 ОБЪЕМЫ ТОРГОВ (30с)')
        console.table(tableData)
    }

    // Запускает периодический вывод данных на границах времени
    startAnalysis() {
        const now = Date.now()
        const timeToNextBoundary = this.nextBoundary - now

        console.log(
            `[VolumeAnalyzer] Следующий вывод через ${Math.round(
                timeToNextBoundary / 1000,
            )}с`,
        )

        // Ждем до первой границы времени
        setTimeout(() => {
            // Добавляем в историю только если бар имеет валидный timestamp
            if (this.currentBar.timestamp !== null) {
                this.addToHistory({ ...this.currentBar })
            }
            this.emitCompletedBar()

            // Вычисляем следующую границу ПЕРЕД созданием нового бара
            const currentBoundary = this.nextBoundary
            this.nextBoundary = currentBoundary + 30000 // Добавляем ровно 30 секунд
            this.startNewBar(this.nextBoundary)

            // Затем каждые 30 секунд точно на границе
            setInterval(() => {
                // Добавляем в историю только если бар имеет валидный timestamp
                if (this.currentBar.timestamp !== null) {
                    this.addToHistory({ ...this.currentBar })
                }
                this.emitCompletedBar()

                // Вычисляем следующую границу ПЕРЕД созданием нового бара
                const currentBoundary = this.nextBoundary
                this.nextBoundary = currentBoundary + 30000 // Добавляем ровно 30 секунд
                this.startNewBar(this.nextBoundary)
            }, 30000)
        }, timeToNextBoundary)
    }
}
