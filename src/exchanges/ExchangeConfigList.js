import GenericExchange from './GenericExchange.js'
// Список конфигураций бирж (как объекты) и производные экземпляры GenericExchange
import {
	EXCHANGE_URLS,
	EXCHANGE_NAMES,
	TRADING_PAIRS,
} from '../constants/exchangeUrls.js'

// Именованные конфиги (нумерация соответствует документации)
// 1) Binance Spot
export const Binance = {
	exchangeName: EXCHANGE_NAMES.BINANCE_SPOT,
	route: EXCHANGE_URLS.BINANCE_SPOT,
	subscriptions: [
		{
			method: 'SUBSCRIBE',
			params: [`${TRADING_PAIRS.BINANCE_SPOT.toLowerCase()}@aggTrade`],
			id: 1,
		},
	],
	parseMessage: (data) =>
		data.e === 'aggTrade'
			? [
				  {
					  price: parseFloat(data.p),
					  volume: parseFloat(data.p) * parseFloat(data.q),
					  side: data.m ? 'sell' : 'buy',
					  timestamp: data.T,
				  },
			  ]
			: [],
}

// 2) BitMEX
export const BitMEX = {
	exchangeName: EXCHANGE_NAMES.BITMEX,
	route: EXCHANGE_URLS.BITMEX,
	subscriptions: [
		{ op: 'subscribe', args: [`trade:${TRADING_PAIRS.BITMEX}`] },
	],
	parseMessage: (data) =>
		data.table === 'trade' && data.action === 'insert' && data.data
			? data.data.map((t) => ({
				  price: t.price,
				  volume: t.foreignNotional,
				  side: t.side.toLowerCase(),
				  timestamp: new Date(t.timestamp).getTime(),
			  }))
			: [],
}

// 3) Bitfinex
export const Bitfinex = {
	exchangeName: EXCHANGE_NAMES.BITFINEX,
	route: EXCHANGE_URLS.BITFINEX,
	subscriptions: [
		{
			event: 'subscribe',
			channel: 'trades',
			symbol: TRADING_PAIRS.BITFINEX,
		},
	],
	parseMessage: (data) => {
		if (Array.isArray(data) && data[1] === 'te' && Array.isArray(data[2])) {
			const d = data[2]
			const amount = d[2]
			const price = d[3]
			const size = Math.abs(amount)
			return [
				{
					price,
					volume: price * size,
					side: amount > 0 ? 'buy' : 'sell',
					timestamp: d[1],
				},
			]
		}
		return []
	},
}

// 4) Coinbase Advanced Trade
export const Coinbase = {
	exchangeName: EXCHANGE_NAMES.COINBASE,
	route: EXCHANGE_URLS.COINBASE,
	subscriptions: [
		{
			type: 'subscribe',
			channel: 'market_trades',
			product_ids: [TRADING_PAIRS.COINBASE],
		},
	],
	parseMessage: (data) => {
		if (data.channel === 'market_trades' && data.events) {
			const out = []
			data.events.forEach((ev) => {
				;(ev.trades || []).forEach((t) => {
					const price = parseFloat(t.price)
					const size = parseFloat(t.size)
					out.push({
						price,
						volume: price * size,
						side: t.side.toLowerCase(),
						timestamp: new Date(t.time).getTime(),
					})
				})
			})
			return out
		}
		return []
	},
}

// 5) Deribit
export const Deribit = {
	exchangeName: EXCHANGE_NAMES.DERIBIT,
	route: EXCHANGE_URLS.DERIBIT,
	subscriptions: [
		{
			method: 'public/subscribe',
			params: { channels: [`trades.${TRADING_PAIRS.DERIBIT}.100ms`] },
		},
	],
	parseMessage: (data) =>
		data.method === 'subscription' && data.params && data.params.data
			? data.params.data.map((t) => ({
				  price: t.price,
				  volume: t.amount,
				  side: t.direction,
				  timestamp: t.timestamp,
			  }))
			: [],
	getPingMessage: () => ({ method: 'public/ping' }),
	getPingInterval: () => 60000,
}

// 6) OKX (корректный instId на USDT)
export const OKX = {
	exchangeName: EXCHANGE_NAMES.OKX,
	route: EXCHANGE_URLS.OKX,
	subscriptions: [
		{
			op: 'subscribe',
			args: [{ channel: 'trades', instId: 'BTC-USDT-SWAP' }],
		},
	],
	parseMessage: (data) =>
		data.arg && data.arg.channel === 'trades' && data.data
			? data.data.map((t) => {
				  const price = parseFloat(t.px)
				  const size = parseFloat(t.sz)
				  return {
					  price,
					  volume: price * size,
					  side: t.side,
					  timestamp: parseInt(t.ts),
				  }
			  })
			: [],
}

// 7) Bybit Inverse
export const BybitInverse = {
	exchangeName: EXCHANGE_NAMES.BYBIT_INVERSE,
	route: EXCHANGE_URLS.BYBIT_INVERSE,
	subscriptions: [
		{
			op: 'subscribe',
			args: [`publicTrade.${TRADING_PAIRS.BYBIT_INVERSE}`],
		},
	],
	parseMessage: (data) =>
		data.topic && data.topic.startsWith('publicTrade.') && data.data
			? data.data.map((t) => ({
				  price: parseFloat(t.p),
				  volume: parseFloat(t.v),
				  side: t.S === 'Sell' ? 'sell' : 'buy',
				  timestamp: t.T,
			  }))
			: [],
	getPingMessage: () => ({ op: 'ping' }),
	getPingInterval: () => 20000,
}

// 8) Bitstamp
export const Bitstamp = {
	exchangeName: EXCHANGE_NAMES.BITSTAMP,
	route: EXCHANGE_URLS.BITSTAMP,
	subscriptions: [
		{
			event: 'bts:subscribe',
			data: { channel: `live_trades_${TRADING_PAIRS.BITSTAMP}` },
		},
	],
	parseMessage: (data) => {
		if (data.event === 'trade' && data.data) {
			const price = data.data.price
			const size = data.data.amount
			return [
				{
					price,
					volume: price * size,
					side: data.data.type === 0 ? 'buy' : 'sell',
					timestamp: parseInt(data.data.timestamp) * 1000,
				},
			]
		}
		return []
	},
}

// 9) Binance USDT-M Futures
export const BinanceFuturesUSDT = {
	exchangeName: EXCHANGE_NAMES.BINANCE_FUTURES_USDT,
	route: EXCHANGE_URLS.BINANCE_FUTURES_USDT,
	subscriptions: [
		{
			method: 'SUBSCRIBE',
			params: [
				`${TRADING_PAIRS.BINANCE_FUTURES_USDT.toLowerCase()}@aggTrade`,
			],
			id: 1,
		},
	],
	parseMessage: (data) =>
		data.e === 'aggTrade'
			? [
				  {
					  price: parseFloat(data.p),
					  volume: parseFloat(data.p) * parseFloat(data.q),
					  side: data.m ? 'sell' : 'buy',
					  timestamp: data.T,
				  },
			  ]
			: [],
}

// 10) Binance COIN-M Futures
export const BinanceFuturesCOIN = {
	exchangeName: EXCHANGE_NAMES.BINANCE_FUTURES_COIN,
	route: EXCHANGE_URLS.BINANCE_FUTURES_COIN,
	subscriptions: [
		{
			method: 'SUBSCRIBE',
			params: [
				`${TRADING_PAIRS.BINANCE_FUTURES_COIN.toLowerCase()}@aggTrade`,
			],
			id: 1,
		},
	],
	parseMessage: (data) =>
		data.e === 'aggTrade'
			? [
				  {
					  price: parseFloat(data.p),
					  volume: parseFloat(data.q) * 100,
					  side: data.m ? 'sell' : 'buy',
					  timestamp: data.T,
				  },
			  ]
			: [],
}

// 11) Bybit Linear
export const BybitLinear = {
	exchangeName: EXCHANGE_NAMES.BYBIT_LINEAR,
	route: EXCHANGE_URLS.BYBIT_LINEAR,
	subscriptions: [
		{
			op: 'subscribe',
			args: [`publicTrade.${TRADING_PAIRS.BYBIT_LINEAR}`],
		},
	],
	parseMessage: (data) =>
		data.topic && data.topic.startsWith('publicTrade.') && data.data
			? data.data.map((t) => {
				  const price = parseFloat(t.p)
				  const size = parseFloat(t.v)
				  return {
					  price,
					  volume: price * size,
					  side: t.S === 'Sell' ? 'sell' : 'buy',
					  timestamp: t.T,
				  }
			  })
			: [],
	getPingMessage: () => ({ op: 'ping' }),
	getPingInterval: () => 20000,
}

// Список для удобного импорта в агрегатор
// Экземпляры классов GenericExchange для каждой биржи
export const EXCHANGES = [
	Binance,
	BitMEX,
	Bitfinex,
	Coinbase,
	Deribit,
	OKX,
	BybitInverse,
	Bitstamp,
	BinanceFuturesUSDT,
	BinanceFuturesCOIN,
	BybitLinear,
].map((ex) => new GenericExchange(ex))
