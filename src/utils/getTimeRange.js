// Константы доступных диапазонов в миллисекундах
export const TIME_RANGES = {
    '5m': 5 * 60 * 1000,
    '1m': 1 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '20m': 20 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
}

// Возвращает строку диапазона времени UTC в формате: "start/end"
// Пример: "1756103190000/1756103820000"
export function getTimeRange(rangeKey = '1h') {
    const durationMs = TIME_RANGES[rangeKey] ?? TIME_RANGES['1h']
    const end = Date.now()
    const start = end - durationMs
    return { start, end }
}

export default getTimeRange
