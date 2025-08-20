import BaseExchange from './BaseExchange.js'

/**
 * Универсальный класс биржи. Принимает готовый объект конфига из ExchangeConfigList
 * и опциональные хендлеры: кастомный parser, onConnect/onError, а также ping-реализации.
 */
export default class GenericExchange extends BaseExchange {
    /**
     * @param {Object} config См. ExchangeConfigList: { exchangeName, route, subscriptions, parseMessage, getPingMessage?, getPingInterval? }
     * @param {Object} [handlers]
     * @param {(data:any)=>Array<{price:number, volume:number, side:'buy'|'sell', timestamp:number}>} [handlers.parser]
     * @param {()=>void} [handlers.onConnect]
     * @param {(err:Error)=>void} [handlers.onError]
     * @param {()=>any} [handlers.getPingMessage]
     * @param {()=>number} [handlers.getPingInterval]
     */
    constructor(config, handlers = {}) {
        super(config.exchangeName)
        this.config = config
        this.handlers = handlers
    }

    getConfig() {
        return {
            exchangeName: this.exchangeName,
            route: this.config.route,
            headers: this.config.headers || { 'User-Agent': 'TradeBot/1.0' },
            subscriptions: this.config.subscriptions || [],
            onMessage: [(data) => this.onMessage(data)],
            onConnect: () => {
                super.onConnect()
                if (typeof this.handlers.onConnect === 'function')
                    this.handlers.onConnect()
            },
            onError: (error) => {
                super.onError(error)
                if (typeof this.handlers.onError === 'function')
                    this.handlers.onError(error)
            },
            onClose: () => this.onClose(),
            getPingMessage:
                this.handlers.getPingMessage || this.config.getPingMessage,
            getPingInterval:
                this.handlers.getPingInterval || this.config.getPingInterval,
        }
    }

    onMessage(data) {
        try {
            const parser = this.handlers.parser || this.config.parseMessage
            if (typeof parser !== 'function') return
            const trades = parser(data) || []
            if (!Array.isArray(trades)) return
            trades.forEach((t) => this.addTrade(t))
        } catch (error) {
            console.error(
                `Ошибка обработки сообщения ${this.exchangeName}:`,
                error,
            )
        }
    }

    needsPing() {
        return (
            typeof (
                this.handlers.getPingMessage || this.config.getPingMessage
            ) === 'function'
        )
    }

    getPingMessage() {
        const fn = this.handlers.getPingMessage || this.config.getPingMessage
        return typeof fn === 'function' ? fn() : { op: 'ping' }
    }

    getPingInterval() {
        const fn = this.handlers.getPingInterval || this.config.getPingInterval
        return typeof fn === 'function' ? fn() : 30000
    }
}
