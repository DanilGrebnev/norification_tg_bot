import { TIME_INTERVALS } from '../constants/timeIntervals.js'
import { getTimeRange } from '../utils/getTimeRange.js'

class HTTP {
    constructor() {
        this.BASE_URL = 'https://api.aggr.trade/historical'
    }

    // intervals берется из constants/timeIntervals.js
    async getHistoricalData(range, interval) {
        if (!(interval in TIME_INTERVALS)) {
            throw new Error(
                `Invalid interval. Must be one of ${Object.keys(
                    TIME_INTERVALS,
                ).join(', ')}`,
            )
        }

        const { start, end } = range
        if (!start || !end) {
            throw new Error("range must contain 'start' and 'end'")
        }

        const step = TIME_INTERVALS[interval]

        const route = this.createRoute({ start, end, step })

        const res = await fetch(route)
        if (!res.ok) {
            throw new Error(`Request failed with status ${res.status}`)
        }

        const data = await res.json()

        // превращаем results в массив объектов
        const columnMap = Object.entries(data.columns).reduce(
            (acc, [key, idx]) => {
                acc[idx] = key
                return acc
            },
            {},
        )

        const results = Array.isArray(data.results)
            ? data.results.map((row) => {
                  if (Array.isArray(row)) {
                      const obj = {}
                      row.forEach((val, idx) => {
                          obj[columnMap[idx]] = val
                      })
                      return obj
                  }
                  // Если сервер вернул уже объект – используем как есть
                  if (row && typeof row === 'object') {
                      return row
                  }
                  return {}
              })
            : []

        return results
    }

    createRoute({ start, end, step }) {
        return (
            `${this.BASE_URL}/${start}/${end}/${step}/` +
            'BINANCE_FUTURES:btcusd_perp+BITFINEX:BTCUSD+BITMEX:XBTUSD+' +
            'BYBIT:BTCUSD+COINBASE:BTC-USD+DERIBIT:BTC-PERPETUAL+' +
            'BINANCE:btcusdt+BINANCE_FUTURES:btcusdt+BITFINEX:BTCUST+' +
            'BITFINEX:BTCF0:USTF0+BITMEX:XBTUSDT+BYBIT:BTCUSDT+' +
            'COINBASE:BTC-USDT+BITSTAMP:btcusd+' +
            'OKEX:BTC-USD-SWAP+OKEX:BTC-USDT-SWAP'
        )
    }

    // Получить исторические данные для анализа (без суммирования)
    async getHistoricalDataForAnalysis(rangeKey = '1h') {
        // Диапазон времени в мс от UNIX epoch
        const range = getTimeRange(rangeKey)

        try {
            const historicalData = await this.getHistoricalData(range, '30s')

            // Возвращаем сырые данные без суммирования для анализа
            return {
                data: historicalData,
                intervalsCount: historicalData.length,
                timeRange: range,
            }
        } catch (error) {
            console.error(
                '❌ Ошибка получения исторических данных:',
                error.message,
            )
            return { data: [], intervalsCount: 0, timeRange: range }
        }
    }

    // Получить средние объемы за период для сравнения
    async getAverageVolumes(rangeKey = '1h') {
        const result = await this.getHistoricalDataForAnalysis(rangeKey)

        if (result.data.length === 0) {
            return { avgVbuy: 0, avgVsell: 0, intervalsCount: 0 }
        }

        let totalVbuy = 0
        let totalVsell = 0

        result.data.forEach((item) => {
            if (item.vbuy && typeof item.vbuy === 'number')
                totalVbuy += item.vbuy
            if (item.vsell && typeof item.vsell === 'number')
                totalVsell += item.vsell
        })

        return {
            avgVbuy: totalVbuy / result.data.length,
            avgVsell: totalVsell / result.data.length,
            intervalsCount: result.data.length,
        }
    }
}

export default HTTP
