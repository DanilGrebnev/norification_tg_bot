import express from 'express'

/** Класс приложения Express сервера */
export default class App {
    constructor(options = {}) {
        this.PORT = options.PORT || 3000
        this.middlewares = options.middlewares || []
        this.app = express()
        this.server = null

        // Настраиваем middleware
        this.setupMiddlewares()
        this.setupRoutes()
    }

    /** Настройка middleware */
    setupMiddlewares() {
        // Применяем переданные middleware
        this.middlewares.forEach((middleware) => {
            if (typeof middleware === 'function') {
                this.app.use(middleware)
            }
        })

        // Логирование запросов
        this.app.use((req, _, next) => {
            console.log(`[Server] ${req.method} ${req.path}`)
            next()
        })
    }

    /** Настройка маршрутов */
    setupRoutes() {
        // Главная страница
        this.app.get('/', (req, res) => {
            res.json({
                name: 'TradeBot API',
                version: '1.0.0',
                status: 'running',
                timestamp: new Date().toISOString(),
            })
        })

        // 404 обработчик
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
            })
        })

        // Обработчик ошибок
        this.app.use((error, req, res, next) => {
            console.error('[Server] Ошибка:', error)
            res.status(500).json({
                error: 'Internal server error',
                message: error.message,
            })
        })
    }

    /** Запуск сервера */
    start(successCallback) {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.PORT, () => {
                    console.log(`[Server] Сервер запущен на порту ${this.PORT}`)
                    successCallback?.()
                    resolve(this)
                })

                this.server.on('error', (error) => {
                    console.error('[Server] Ошибка сервера:', error)
                    reject(error)
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /** Получить Express приложение */
    getApp() {
        return this.app
    }
}
