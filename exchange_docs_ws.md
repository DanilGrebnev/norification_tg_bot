## Документация по WebSocket роутам для расчета объема покупок и продаж

Ниже перечислены используемые публичные WS-роуты, полезные для формирования нижних объемных баров. Для каждого указано:

-   что отправлять для подписки;
-   какие поля приходят и как извлекать цену/объем/сторону;
-   нужен ли ping/pong (и периодичность).

Важно: для расчета объемов используется цена и размер сделки. Базовая формула объема в USD: `volumeUSD = price * size` (если биржа присылает не USD, см. примечания).

---

### 1) Binance Spot — `wss://data-stream.binance.vision:9443/ws`

1.1 Подписка

```json
{ "method": "SUBSCRIBE", "params": ["btcusdt@aggTrade"], "id": 1 }
```

1.2 Входящие данные (aggTrade)

```json
{
    "e": "aggTrade",
    "E": 1755681800218,
    "s": "BTCUSDT",
    "a": 3655186969,
    "p": "113821.62000000",
    "q": "0.00029000",
    "f": 5172994529,
    "l": 5172994529,
    "T": 1755681800218,
    "m": true
}
```

-   price = `p`
-   size = `q`
-   side = `m ? 'sell' : 'buy'`
-   volumeUSD = `p * q`

    1.3 Ping/Pong: не требуется.

---

### 2) BitMEX — `wss://www.bitmex.com/realtime`

1.1 Подписка

```json
{ "op": "subscribe", "args": ["trade:XBTUSD"] }
```

1.2 Входящие данные (table=trade)

```json
{
    "table": "trade",
    "action": "insert",
    "data": [
        {
            "timestamp": "2025-08-20T09:24:02.611Z",
            "symbol": "XBTUSD",
            "side": "Buy",
            "size": 7900,
            "price": 113726.9,
            "foreignNotional": 7900,
            "homeNotional": 0.0694647
        }
    ]
}
```

-   side = `side.toLowerCase()`
-   Рекомендуемый объем в USD: `foreignNotional` (для XBTUSD — уже в USD)

    1.3 Ping/Pong: не требуется.

---

### 3) Bitfinex — `wss://api-pub.bitfinex.com/ws/2/`

1.1 Подписка

```json
{ "event": "subscribe", "channel": "trades", "symbol": "tBTCUSD" }
```

1.2 Входящие данные (пример trade executed — событие "te")

```json
[0, "te", [419853, 1574694478000, 0.005, 7341.9]]
```

-   amount = третий элемент массива (`>0` = buy, `<0` = sell)
-   price = четвертый элемент массива
-   side = `amount > 0 ? 'buy' : 'sell'`
-   size = `Math.abs(amount)`
-   volumeUSD = `price * Math.abs(amount)`

    1.3 Ping/Pong: не требуется.

---

### 4) Coinbase Advanced Trade — `wss://advanced-trade-ws.coinbase.com/`

1.1 Подписка

```json
{ "type": "subscribe", "channel": "market_trades", "product_ids": ["BTC-USD"] }
```

1.2 Входящие данные (channel=market_trades, events[].trades[])

```json
{
    "channel": "market_trades",
    "events": [
        {
            "type": "snapshot",
            "trades": [
                {
                    "product_id": "BTC-USD",
                    "trade_id": "863957335",
                    "price": "113805.29",
                    "size": "0.00006969",
                    "side": "SELL",
                    "time": "2025-08-20T09:22:04.883169Z"
                }
            ]
        }
    ]
}
```

-   price = `price`
-   size = `size`
-   side = `side.toLowerCase()`
-   volumeUSD = `price * size`

    1.3 Ping/Pong: не требуется.

---

### 5) Deribit — `wss://www.deribit.com/ws/api/v2`

1.1 Подписка (JSON-RPC)

```json
{
    "method": "public/subscribe",
    "params": { "channels": ["trades.BTC-PERPETUAL.100ms"] }
}
```

1.2 Входящие данные (method=subscription, params.data[])

```json
{
    "jsonrpc": "2.0",
    "method": "subscription",
    "params": {
        "channel": "trades.BTC-PERPETUAL.100ms",
        "data": [
            {
                "timestamp": 1755681724690,
                "price": 113800.5,
                "amount": 10,
                "direction": "sell"
            }
        ]
    }
}
```

-   price = `price`
-   amount: у Deribit для перпетуалов — контрактный размер; многие интеграции используют его как USD-эквивалент (уточняйте при необходимости). Минимально: volume = `amount`; volumeUSD ≈ `amount` или `amount * price` — в зависимости от ваших требований.
-   side = `direction`

    1.3 Ping/Pong: требуется. Отправлять каждые ~60 секунд.

```json
{ "method": "public/ping" }
```

---

### 6) OKX — `wss://ws.okx.com:8443/ws/v5/public`

1.1 Подписка

```json
{
    "op": "subscribe",
    "args": [{ "channel": "trades", "instId": "BTC-USD-SWAP" }]
}
```

1.2 Входящие данные

```json
{
    "arg": { "channel": "trades", "instId": "BTC-USDT-SWAP" },
    "data": [
        {
            "instId": "BTC-USDT-SWAP",
            "tradeId": "1711647312",
            "px": "113772.3",
            "sz": "21.09",
            "side": "sell",
            "ts": "1755681725504"
        }
    ]
}
```

-   price = `px`
-   size = `sz`
-   side = `side`
-   volumeUSD = `px * sz`

    1.3 Ping/Pong: как правило, не требуется для public (сервер шлет пинги). При желании можно отвечать `{"op":"ping"}`/`{"op":"pong"}`.

---

### 7) Bybit Inverse — `wss://stream.bybit.com/v5/public/inverse`

1.1 Подписка

```json
{ "op": "subscribe", "args": ["publicTrade.BTCUSD"] }
```

1.2 Входящие данные

```json
{
    "topic": "publicTrade.BTCUSD",
    "type": "snapshot",
    "data": [
        {
            "T": 1755681738444,
            "s": "BTCUSD",
            "S": "Sell",
            "v": "3",
            "p": "113803.50"
        }
    ]
}
```

-   price = `p`
-   size = `v` (inverse: размер в контрактах). Для перевода в USD используйте спецификацию контракта.
-   side = `S.toLowerCase()`

    1.3 Ping/Pong: требуется. Отправлять каждые ~20 секунд.

```json
{ "op": "ping" }
```

---

### 8) Bitstamp — `wss://ws.bitstamp.net/`

1.1 Подписка

```json
{ "event": "bts:subscribe", "data": { "channel": "live_trades_btcusd" } }
```

1.2 Входящие данные

```json
{
    "event": "trade",
    "channel": "live_trades_btcusd",
    "data": {
        "id": 445602774,
        "timestamp": "1755681725",
        "amount": 0.010124,
        "price": 113801,
        "type": 1
    }
}
```

-   price = `price`
-   size = `amount`
-   side = `type === 0 ? 'buy' : 'sell'`
-   volumeUSD = `price * amount`

    1.3 Ping/Pong: не требуется.

---

### 9) Binance USDT-M Futures — `wss://fstream.binance.com/ws`

1.1 Подписка

```json
{ "method": "SUBSCRIBE", "params": ["btcusdt@aggTrade"], "id": 1 }
```

1.2 Входящие данные (aggTrade)

```json
{
    "e": "aggTrade",
    "E": 1755681725782,
    "s": "BTCUSDT",
    "a": 2827068817,
    "p": "113758.20",
    "q": "0.017",
    "f": 6568915371,
    "l": 6568915371,
    "T": 1755681725627,
    "m": true
}
```

-   price = `p`, size = `q`, side = `m ? 'sell' : 'buy'`, volumeUSD = `p * q`

    1.3 Ping/Pong: не требуется.

---

### 10) Binance COIN-M Futures — `wss://dstream.binance.com/ws`

1.1 Подписка

```json
{ "method": "SUBSCRIBE", "params": ["btcusd_perp@aggTrade"], "id": 1 }
```

1.2 Входящие данные (aggTrade)

```json
{
    "e": "aggTrade",
    "E": 1755681731770,
    "s": "BTCUSD_PERP",
    "a": 424310529,
    "p": "113775.2",
    "q": "1",
    "f": 999041922,
    "l": 999041922,
    "T": 1755681731618,
    "m": false
}
```

-   price = `p`
-   size (контракты) = `q`; для `volumeUSD` умножьте на размер контракта в USD (для BTCUSD_PERP обычно 100 USD/контракт — сверяйте спецификацию)
-   side = `m ? 'sell' : 'buy'`

    1.3 Ping/Pong: не требуется.

---

### 11) Bybit Linear — `wss://stream.bybit.com/v5/public/linear`

1.1 Подписка

```json
{ "op": "subscribe", "args": ["publicTrade.BTCUSDT"] }
```

1.2 Входящие данные

```json
{
    "topic": "publicTrade.BTCUSDT",
    "type": "snapshot",
    "data": [
        {
            "T": 1755681728177,
            "s": "BTCUSDT",
            "S": "Sell",
            "v": "0.001",
            "p": "113785.10"
        }
    ]
}
```

-   price = `p`
-   size = `v`
-   side = `S.toLowerCase()`
-   volumeUSD = `p * v`

    1.3 Ping/Pong: требуется. Отправлять каждые ~20 секунд.

```json
{ "op": "ping" }
```

---

## Примечание по агрегированию

-   Покупки: суммируйте `volumeUSD` по сделкам со стороной `buy` → `vbuy`
-   Продажи: суммируйте `volumeUSD` по сделкам со стороной `sell` → `vsell`
-   Общий объем бара: `vbuy + vsell`
-   Цвет бара: `vbuy > vsell ? green : red`

---

## Расчёт объёмов по каждой бирже

### 1) Binance Spot — `wss://data-stream.binance.vision:9443/ws`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const trades = [
    { e: 'aggTrade', p: '113821.62', q: '0.00029', m: false }, // покупка
    { e: 'aggTrade', p: '113825.50', q: '0.00150', m: true }, // продажа
    { e: 'aggTrade', p: '113820.00', q: '0.00080', m: false }, // покупка
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

trades.forEach((trade) => {
    const price = parseFloat(trade.p)
    const size = parseFloat(trade.q)
    const volumeUSD = price * size
    const side = trade.m ? 'sell' : 'buy'

    if (side === 'buy') {
        vbuy += volumeUSD
    } else {
        vsell += volumeUSD
    }
})

// Результат:
// vbuy = (113821.62 * 0.00029) + (113820.00 * 0.00080) = 33.01 + 91.06 = 124.07 USD
// vsell = (113825.50 * 0.00150) = 170.74 USD
// Общий объем = 124.07 + 170.74 = 294.81 USD
// Цвет бара = vsell > vbuy = RED
```

---

### 2) BitMEX — `wss://www.bitmex.com/realtime`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const trades = [
    { table: 'trade', data: [{ side: 'Buy', size: 7900, price: 113726.9 }] },
    { table: 'trade', data: [{ side: 'Sell', size: 12000, price: 113720.5 }] },
    { table: 'trade', data: [{ side: 'Buy', size: 5500, price: 113730.0 }] },
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

trades.forEach((msg) => {
    msg.data.forEach((trade) => {
        const volumeUSD = trade.size // Уже в USD для XBTUSD
        const side = trade.side.toLowerCase()

        if (side === 'buy') {
            vbuy += volumeUSD
        } else {
            vsell += volumeUSD
        }
    })
})

// Результат:
// vbuy = 7900 + 5500 = 13400 USD
// vsell = 12000 USD
// Общий объем = 13400 + 12000 = 25400 USD
// Цвет бара = vbuy > vsell = GREEN
```

---

### 3) Bitfinex — `wss://api-pub.bitfinex.com/ws/2/`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const trades = [
    [0, 'te', [419853, 1574694478000, 0.005, 113800.0]], // покупка (+amount)
    [0, 'te', [419854, 1574694479000, -0.012, 113795.5]], // продажа (-amount)
    [0, 'te', [419855, 1574694480000, 0.008, 113805.2]], // покупка (+amount)
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

trades.forEach((msg) => {
    if (msg[1] === 'te') {
        const amount = msg[2][2]
        const price = msg[2][3]
        const size = Math.abs(amount)
        const volumeUSD = price * size
        const side = amount > 0 ? 'buy' : 'sell'

        if (side === 'buy') {
            vbuy += volumeUSD
        } else {
            vsell += volumeUSD
        }
    }
})

// Результат:
// vbuy = (113800.0 * 0.005) + (113805.2 * 0.008) = 569.00 + 910.44 = 1479.44 USD
// vsell = (113795.5 * 0.012) = 1365.55 USD
// Общий объем = 1479.44 + 1365.55 = 2844.99 USD
// Цвет бара = vbuy > vsell = GREEN
```

---

### 4) Coinbase Advanced Trade — `wss://advanced-trade-ws.coinbase.com/`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const messages = [
    {
        channel: 'market_trades',
        events: [
            {
                trades: [
                    { price: '113805.29', size: '0.00006969', side: 'SELL' },
                    { price: '113810.50', size: '0.00125000', side: 'BUY' },
                    { price: '113800.00', size: '0.00089000', side: 'SELL' },
                ],
            },
        ],
    },
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

messages.forEach((msg) => {
    msg.events.forEach((event) => {
        event.trades.forEach((trade) => {
            const price = parseFloat(trade.price)
            const size = parseFloat(trade.size)
            const volumeUSD = price * size
            const side = trade.side.toLowerCase()

            if (side === 'buy') {
                vbuy += volumeUSD
            } else {
                vsell += volumeUSD
            }
        })
    })
})

// Результат:
// vbuy = (113810.50 * 0.00125) = 142.26 USD
// vsell = (113805.29 * 0.00006969) + (113800.00 * 0.00089) = 7.93 + 101.28 = 109.21 USD
// Общий объем = 142.26 + 109.21 = 251.47 USD
// Цвет бара = vbuy > vsell = GREEN
```

---

### 5) Deribit — `wss://www.deribit.com/ws/api/v2`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const messages = [
    {
        method: 'subscription',
        params: {
            data: [
                { price: 113800.5, amount: 10, direction: 'sell' },
                { price: 113805.0, amount: 25, direction: 'buy' },
                { price: 113795.2, amount: 15, direction: 'sell' },
            ],
        },
    },
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

messages.forEach((msg) => {
    if (msg.params && msg.params.data) {
        msg.params.data.forEach((trade) => {
            const volumeUSD = trade.amount // Для Deribit amount уже в USD-эквиваленте
            const side = trade.direction

            if (side === 'buy') {
                vbuy += volumeUSD
            } else {
                vsell += volumeUSD
            }
        })
    }
})

// Результат:
// vbuy = 25 USD
// vsell = 10 + 15 = 25 USD
// Общий объем = 25 + 25 = 50 USD
// Цвет бара = vbuy == vsell = RED (по умолчанию при равенстве)
```

---

### 6) OKX — `wss://ws.okx.com:8443/ws/v5/public`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const messages = [
    {
        data: [
            { px: '113772.3', sz: '21.09', side: 'sell' },
            { px: '113775.8', sz: '15.50', side: 'buy' },
            { px: '113770.0', sz: '8.25', side: 'sell' },
        ],
    },
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

messages.forEach((msg) => {
    msg.data.forEach((trade) => {
        const price = parseFloat(trade.px)
        const size = parseFloat(trade.sz)
        const volumeUSD = price * size
        const side = trade.side

        if (side === 'buy') {
            vbuy += volumeUSD
        } else {
            vsell += volumeUSD
        }
    })
})

// Результат:
// vbuy = (113775.8 * 15.50) = 1763524.90 USD
// vsell = (113772.3 * 21.09) + (113770.0 * 8.25) = 2399634.11 + 938602.50 = 3338236.61 USD
// Общий объем = 1763524.90 + 3338236.61 = 5101761.51 USD
// Цвет бара = vsell > vbuy = RED
```

---

### 7) Bybit Inverse — `wss://stream.bybit.com/v5/public/inverse`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const messages = [
    {
        data: [
            { p: '113803.50', v: '3', S: 'Sell' },
            { p: '113810.00', v: '7', S: 'Buy' },
            { p: '113800.25', v: '5', S: 'Sell' },
        ],
    },
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

messages.forEach((msg) => {
    msg.data.forEach((trade) => {
        // Для inverse контрактов v - это количество контрактов
        // Каждый контракт BTCUSD = 1 USD, поэтому volumeUSD = v
        const volumeUSD = parseFloat(trade.v)
        const side = trade.S === 'Sell' ? 'sell' : 'buy'

        if (side === 'buy') {
            vbuy += volumeUSD
        } else {
            vsell += volumeUSD
        }
    })
})

// Результат:
// vbuy = 7 USD
// vsell = 3 + 5 = 8 USD
// Общий объем = 7 + 8 = 15 USD
// Цвет бара = vsell > vbuy = RED
```

---

### 8) Bitstamp — `wss://ws.bitstamp.net/`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const trades = [
    { event: 'trade', data: { amount: 0.010124, price: 113801, type: 1 } }, // продажа
    { event: 'trade', data: { amount: 0.025, price: 113805, type: 0 } }, // покупка
    { event: 'trade', data: { amount: 0.0085, price: 113798, type: 1 } }, // продажа
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

trades.forEach((msg) => {
    if (msg.event === 'trade') {
        const price = msg.data.price
        const size = msg.data.amount
        const volumeUSD = price * size
        const side = msg.data.type === 0 ? 'buy' : 'sell'

        if (side === 'buy') {
            vbuy += volumeUSD
        } else {
            vsell += volumeUSD
        }
    }
})

// Результат:
// vbuy = (113805 * 0.025) = 2845.13 USD
// vsell = (113801 * 0.010124) + (113798 * 0.008500) = 1152.31 + 967.28 = 2119.59 USD
// Общий объем = 2845.13 + 2119.59 = 4964.72 USD
// Цвет бара = vbuy > vsell = GREEN
```

---

### 9) Binance USDT-M Futures — `wss://fstream.binance.com/ws`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const trades = [
    { e: 'aggTrade', p: '113758.20', q: '0.017', m: true }, // продажа
    { e: 'aggTrade', p: '113760.50', q: '0.045', m: false }, // покупка
    { e: 'aggTrade', p: '113755.80', q: '0.028', m: true }, // продажа
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

trades.forEach((trade) => {
    const price = parseFloat(trade.p)
    const size = parseFloat(trade.q)
    const volumeUSD = price * size
    const side = trade.m ? 'sell' : 'buy'

    if (side === 'buy') {
        vbuy += volumeUSD
    } else {
        vsell += volumeUSD
    }
})

// Результат:
// vbuy = (113760.50 * 0.045) = 5119.22 USD
// vsell = (113758.20 * 0.017) + (113755.80 * 0.028) = 1933.89 + 3185.16 = 5119.05 USD
// Общий объем = 5119.22 + 5119.05 = 10238.27 USD
// Цвет бара = vbuy > vsell = GREEN (на 0.17 USD)
```

---

### 10) Binance COIN-M Futures — `wss://dstream.binance.com/ws`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const trades = [
    { e: 'aggTrade', p: '113775.2', q: '1', m: false }, // покупка, 1 контракт
    { e: 'aggTrade', p: '113770.5', q: '3', m: true }, // продажа, 3 контракта
    { e: 'aggTrade', p: '113780.0', q: '2', m: false }, // покупка, 2 контракта
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

trades.forEach((trade) => {
    // Для COIN-M фьючерсов: 1 контракт = 100 USD
    const contracts = parseFloat(trade.q)
    const volumeUSD = contracts * 100 // Каждый контракт = 100 USD
    const side = trade.m ? 'sell' : 'buy'

    if (side === 'buy') {
        vbuy += volumeUSD
    } else {
        vsell += volumeUSD
    }
})

// Результат:
// vbuy = (1 * 100) + (2 * 100) = 100 + 200 = 300 USD
// vsell = (3 * 100) = 300 USD
// Общий объем = 300 + 300 = 600 USD
// Цвет бара = vbuy == vsell = RED (по умолчанию при равенстве)
```

---

### 11) Bybit Linear — `wss://stream.bybit.com/v5/public/linear`

**Пример агрегации данных:**

```javascript
// Входящие сделки за 30 секунд:
const messages = [
    {
        data: [
            { p: '113785.10', v: '0.001', S: 'Sell' },
            { p: '113790.50', v: '0.025', S: 'Buy' },
            { p: '113782.75', v: '0.015', S: 'Sell' },
        ],
    },
]

// Расчет объемов:
let vbuy = 0,
    vsell = 0

messages.forEach((msg) => {
    msg.data.forEach((trade) => {
        const price = parseFloat(trade.p)
        const size = parseFloat(trade.v)
        const volumeUSD = price * size
        const side = trade.S === 'Sell' ? 'sell' : 'buy'

        if (side === 'buy') {
            vbuy += volumeUSD
        } else {
            vsell += volumeUSD
        }
    })
})

// Результат:
// vbuy = (113790.50 * 0.025) = 2844.76 USD
// vsell = (113785.10 * 0.001) + (113782.75 * 0.015) = 113.79 + 1706.74 = 1820.53 USD
// Общий объем = 2844.76 + 1820.53 = 4665.29 USD
// Цвет бара = vbuy > vsell = GREEN
```

---

### Итоговая агрегация всех бирж:

```javascript
// Суммируем объемы со всех 11 бирж за 30 секунд:
const totalVbuy =
    124.07 +
    13400 +
    1479.44 +
    142.26 +
    25 +
    1763524.9 +
    7 +
    2845.13 +
    5119.22 +
    300 +
    2844.76
const totalVsell =
    170.74 +
    12000 +
    1365.55 +
    109.21 +
    25 +
    3338236.61 +
    8 +
    2119.59 +
    5119.05 +
    300 +
    1820.53

// Результат:
// totalVbuy ≈ 1,787,811.78 USD
// totalVsell ≈ 3,361,274.28 USD
// Общий объем ≈ 5,149,086.06 USD
// Цвет объемного бара = RED (продаж больше)
```
