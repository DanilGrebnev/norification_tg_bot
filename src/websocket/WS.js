import WebSocket from 'ws'

/** Класс-обёртка над нативным WebSocket */
export default class WS {
    constructor(connections) {
        this.connections = connections
        this.sockets = []
        this.connectionPromise = null

        // Автоматически подключаемся при создании экземпляра
        this.connectionPromise = this.init()
    }

    /** Инициализация и подключение ко всем WebSocket серверам */
    async init() {
        const connectPromises = this.connections.map((config, index) =>
            this.connectSingle(config, index).catch((error) => {
                const exchangeName = config.exchangeName || `WebSocket ${index}`
                console.error(
                    `[${exchangeName}] Пропускаем из-за ошибки:`,
                    error.message,
                )
                return null // Возвращаем null вместо ошибки
            }),
        )

        try {
            const results = await Promise.all(connectPromises)
            const successfulConnections = results.filter(
                (result) => result !== null,
            ).length
            const totalConnections = this.connections.length

            console.log(
                `✅ WebSocket подключения: ${successfulConnections}/${totalConnections} успешно`,
            )
            return true
        } catch (error) {
            console.error('❌ Критическая ошибка WebSocket:', error)
            throw error
        }
    }

    /** Подключение к одному WebSocket серверу */
    connectSingle(config, index) {
        return new Promise((resolve, reject) => {
            try {
                const exchangeName = config.exchangeName || `WebSocket ${index}`
                console.log(`[${exchangeName}] Подключение к:`, config.route)

                const socket = new WebSocket(config.route, {
                    headers: config.headers || {},
                })

                // Обработчик успешного подключения
                socket.on('open', () => {
                    // console.log(`[${exchangeName}] ✅ Подключение установлено`)

                    // Вызываем колбэк onConnect если он есть
                    if (
                        config.onConnect &&
                        typeof config.onConnect === 'function'
                    ) {
                        config.onConnect()
                    }

                    // Автоматически отправляем подписки если они есть
                    if (
                        config.subscriptions &&
                        Array.isArray(config.subscriptions)
                    ) {
                        setTimeout(() => {
                            config.subscriptions.forEach((subscription) => {
                                socket.send(JSON.stringify(subscription))
                            })
                        }, 1000)
                    }

                    resolve()
                })

                // Обработчик ошибок
                socket.on('error', (error) => {
                    console.error(`[${exchangeName}] ❌ Ошибка:`, error)

                    // Вызываем колбэк onError если он есть
                    if (
                        config.onError &&
                        typeof config.onError === 'function'
                    ) {
                        config.onError(error)
                    }

                    reject(error)
                })

                // Обработчик отключения
                socket.on('close', (code, reason) => {
                    console.log(
                        `[${exchangeName}] ⚠️ Соединение закрыто:`,
                        code,
                        reason.toString(),
                    )
                })

                // Обработчик входящих сообщений
                socket.on('message', (data) => {
                    try {
                        const parsedData = JSON.parse(data.toString())

                        // Вызываем все обработчики для этого подключения
                        if (
                            config.onMessage &&
                            Array.isArray(config.onMessage)
                        ) {
                            config.onMessage.forEach((handler) => {
                                if (typeof handler === 'function') {
                                    handler(parsedData)
                                }
                            })
                        }
                    } catch (error) {
                        console.error(
                            `[${exchangeName}] Ошибка парсинга:`,
                            error,
                        )
                    }
                })

                // Сохраняем сокет
                this.sockets[index] = socket
            } catch (error) {
                const exchangeName = config.exchangeName || `WebSocket ${index}`
                console.error(`[${exchangeName}] Ошибка создания:`, error)
                reject(error)
            }
        })
    }

    /**
     * Ожидание завершения подключения.
     * Возвращает промис, который resolve при успехе или reject при ошибке.
     */
    waitForConnection() {
        return this.connectionPromise
    }
}
