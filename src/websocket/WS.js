import WebSocket from 'ws'

/**
 * Класс-обёртка над нативным WebSocket
 */
export default class WS {
    constructor(connections) {
        this.connections = connections
        this.sockets = []
        this.connectionPromise = null

        // Автоматически подключаемся при создании экземпляра
        this.connectionPromise = this.init()
    }

    /**
     * Инициализация и подключение ко всем WebSocket серверам
     */
    async init() {
        const connectPromises = this.connections.map((config, index) =>
            this.connectSingle(config, index),
        )

        try {
            await Promise.all(connectPromises)
            console.log('✅ Все WebSocket подключения установлены')
            return true
        } catch (error) {
            console.error('❌ Ошибка подключения WebSocket:', error)
            throw error // Пробрасываем ошибку дальше
        }
    }

    /**
     * Подключение к одному WebSocket серверу
     */
    connectSingle(config, index) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`[WebSocket ${index}] Подключение к:`, config.route)

                const socket = new WebSocket(config.route, {
                    headers: config.headers || {},
                })

                // Обработчик успешного подключения
                socket.on('open', () => {
                    console.log(
                        `[WebSocket ${index}] ✅ Подключение установлено`,
                    )

                    // Автоматически отправляем подписки если они есть
                    if (
                        config.subscriptions &&
                        Array.isArray(config.subscriptions)
                    ) {
                        setTimeout(() => {
                            config.subscriptions.forEach((subscription) => {
                                socket.send(JSON.stringify(subscription))
                                console.log(
                                    `[WebSocket ${index}] 📡 Отправлена подписка:`,
                                    subscription,
                                )
                            })
                        }, 1000)
                    }

                    resolve()
                })

                // Обработчик ошибок
                socket.on('error', (error) => {
                    console.error(`[WebSocket ${index}] ❌ Ошибка:`, error)
                    reject(error)
                })

                // Обработчик отключения
                socket.on('close', (code, reason) => {
                    console.log(
                        `[WebSocket ${index}] ⚠️ Соединение закрыто:`,
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
                            `[WebSocket ${index}] Ошибка парсинга:`,
                            error,
                        )
                    }
                })

                // Сохраняем сокет
                this.sockets[index] = socket
            } catch (error) {
                console.error(`[WebSocket ${index}] Ошибка создания:`, error)
                reject(error)
            }
        })
    }

    /**
     * Отправка сообщения в конкретное подключение
     */
    send(connectionIndex, data) {
        const socket = this.sockets[connectionIndex]
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data))
        } else {
            console.warn(
                `[WebSocket ${connectionIndex}] Подключение не активно`,
            )
        }
    }

    /**
     * Закрытие всех подключений
     */
    closeAll() {
        this.sockets.forEach((socket, index) => {
            if (socket) {
                console.log(`[WebSocket ${index}] Закрытие подключения`)
                socket.close()
            }
        })
        this.sockets = []
    }

    /**
     * Получение статуса всех подключений
     */
    getStatus() {
        return this.sockets.map((socket, index) => ({
            index,
            route: this.connections[index]?.route,
            connected: socket?.readyState === WebSocket.OPEN,
        }))
    }

    /**
     * Ожидание завершения подключения
     * Возвращает промис, который resolve при успехе или reject при ошибке
     */
    waitForConnection() {
        return this.connectionPromise
    }
}
