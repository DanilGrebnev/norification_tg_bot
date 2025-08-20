/** Константы WebSocket URL для всех поддерживаемых бирж. Основано на документации exchange_docs_ws.md */

export const EXCHANGE_URLS = {
    // 1. Binance Spot
    BINANCE_SPOT: 'wss://data-stream.binance.vision:9443/ws',

    // 2. BitMEX
    BITMEX: 'wss://www.bitmex.com/realtime',

    // 3. Bitfinex
    BITFINEX: 'wss://api-pub.bitfinex.com/ws/2/',

    // 4. Coinbase Advanced Trade
    COINBASE: 'wss://advanced-trade-ws.coinbase.com/',

    // 5. Deribit
    DERIBIT: 'wss://www.deribit.com/ws/api/v2',

    // 6. OKX
    OKX: 'wss://ws.okx.com:8443/ws/v5/public',

    // 7. Bybit Inverse
    BYBIT_INVERSE: 'wss://stream.bybit.com/v5/public/inverse',

    // 8. Bitstamp
    BITSTAMP: 'wss://ws.bitstamp.net/',

    // 9. Binance USDT-M Futures
    BINANCE_FUTURES_USDT: 'wss://fstream.binance.com/ws',

    // 10. Binance COIN-M Futures
    BINANCE_FUTURES_COIN: 'wss://dstream.binance.com/ws',

    // 11. Bybit Linear
    BYBIT_LINEAR: 'wss://stream.bybit.com/v5/public/linear',
}

/** Названия бирж для отображения */
export const EXCHANGE_NAMES = {
    BINANCE_SPOT: 'Binance Spot',
    BITMEX: 'BitMEX',
    BITFINEX: 'Bitfinex',
    COINBASE: 'Coinbase',
    DERIBIT: 'Deribit',
    OKX: 'OKX',
    BYBIT_INVERSE: 'Bybit Inverse',
    BITSTAMP: 'Bitstamp',
    BINANCE_FUTURES_USDT: 'Binance USDT-M',
    BINANCE_FUTURES_COIN: 'Binance COIN-M',
    BYBIT_LINEAR: 'Bybit Linear',
}

/** Торговые пары для каждой биржи (BTC в USD эквиваленте) */
export const TRADING_PAIRS = {
    BINANCE_SPOT: 'BTCUSDT',
    BITMEX: 'XBTUSD',
    BITFINEX: 'tBTCUSD',
    COINBASE: 'BTC-USD',
    DERIBIT: 'BTC-PERPETUAL',
    OKX: 'BTC-USD-SWAP',
    BYBIT_INVERSE: 'BTCUSD',
    BITSTAMP: 'btcusd',
    BINANCE_FUTURES_USDT: 'BTCUSDT',
    BINANCE_FUTURES_COIN: 'BTCUSD_PERP',
    BYBIT_LINEAR: 'BTCUSDT',
}
