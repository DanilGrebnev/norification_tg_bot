import VolumeAggregator from './VolumeAggregator.js'
import { EXCHANGES } from '../exchanges/ExchangeConfigList.js'

/** Главный класс для управления подключениями ко всем биржам и агрегации данных по объемам торгов */
export default class MultiExchangeAggregator {
    constructor() {
        // Создаем экземпляры бирж (готовые из ExchangeConfigList)
        this.exchanges = EXCHANGES

        // Создаем агрегатор объемов
        this.volumeAggregator = new VolumeAggregator(this.exchanges)

        // Статус подключений
        this.connectionStatus = {}
        this.allConnectionsChecked = false
        this.connectionCheckTimeout = null

        // Инициализируем статусы
        this.exchanges.forEach((exchange) => {
            this.connectionStatus[exchange.exchangeName] = 'connecting'
            console.log(`🔄 [${exchange.exchangeName}] -> подключение...`)
        })

        // Устанавливаем таймаут для проверки подключений (30 секунд)
        this.connectionCheckTimeout = setTimeout(() => {
            this.checkAllConnections(true)
        }, 30000)
    }

    /** Получение конфигураций WebSocket для всех бирж */
    getAllConfigs() {
        return this.exchanges.map((exchange) => {
            const config = exchange.getConfig()

            // Переопределяем обработчики для отслеживания статуса
            const originalOnConnect = config.onConnect
            const originalOnError = config.onError
            const originalOnClose = config.onClose

            config.onConnect = () => {
                this.connectionStatus[exchange.exchangeName] = 'connected'
                originalOnConnect()
                this.checkAllConnections()
            }

            config.onError = (error) => {
                this.connectionStatus[exchange.exchangeName] = 'error'
                originalOnError(error)
                this.checkAllConnections()
            }

            config.onClose = () => {
                this.connectionStatus[exchange.exchangeName] = 'disconnected'
                originalOnClose()
            }

            return config
        })
    }

    /** Проверка статуса всех подключений */
    checkAllConnections(forceCheck = false) {
        // Проверяем, все ли подключения завершены (успешно или с ошибкой)
        const allResolved = Object.values(this.connectionStatus).every(
            (status) => status === 'connected' || status === 'error',
        )

        if ((allResolved || forceCheck) && !this.allConnectionsChecked) {
            this.allConnectionsChecked = true

            // Очищаем таймаут
            if (this.connectionCheckTimeout) {
                clearTimeout(this.connectionCheckTimeout)
                this.connectionCheckTimeout = null
            }

            this.displayConnectionSummary()
            this.startVolumeAggregation()
        }
    }

    /** Отображение итогового статуса подключений */
    displayConnectionSummary() {
        console.log('\n' + '='.repeat(60))
        console.log('📊 СТАТУС ПОДКЛЮЧЕНИЙ К БИРЖАМ')
        console.log('='.repeat(60))

        let connectedCount = 0
        let errorCount = 0

        Object.entries(this.connectionStatus).forEach(
            ([exchangeName, status]) => {
                if (status === 'connected') {
                    console.log(`✅ [${exchangeName}] -> подключено`)
                    connectedCount++
                } else if (status === 'error') {
                    console.log(`❌ [${exchangeName}] -> не подключено`)
                    errorCount++
                } else {
                    console.log(`🔄 [${exchangeName}] -> подключение...`)
                }
            },
        )

        console.log('='.repeat(60))
        console.log(
            `📈 Подключено: ${connectedCount} из ${this.exchanges.length} бирж`,
        )

        if (errorCount > 0) {
            console.log(`⚠️ Ошибок подключения: ${errorCount}`)
            console.log(
                '💡 Приложение продолжит работу с подключенными биржами',
            )
        }

        console.log('='.repeat(60) + '\n')
    }

    /** Запуск системы агрегации объемов */
    startVolumeAggregation() {
        const connectedExchanges = this.exchanges.filter(
            (exchange) =>
                this.connectionStatus[exchange.exchangeName] === 'connected',
        )

        if (connectedExchanges.length === 0) {
            console.log('❌ Нет подключенных бирж для агрегации объемов')
            return
        }

        console.log(
            `🚀 Запуск системы агрегации объемов с ${connectedExchanges.length} биржами`,
        )
        this.volumeAggregator.start()
    }

    /** Остановка системы */
    stop() {
        if (this.connectionCheckTimeout) {
            clearTimeout(this.connectionCheckTimeout)
            this.connectionCheckTimeout = null
        }

        this.volumeAggregator.stop()
        console.log('🛑 MultiExchangeAggregator остановлен')
    }

    /** Получение статуса системы */
    getStatus() {
        return {
            exchanges: this.exchanges.length,
            connectionStatus: this.connectionStatus,
            allConnectionsChecked: this.allConnectionsChecked,
            volumeAggregator: this.volumeAggregator.getStatus(),
        }
    }

    /** Получение истории объемов */
    getVolumeHistory() {
        return this.volumeAggregator.getHistory()
    }

    /** Получение конкретной биржи по имени */
    getExchange(exchangeName) {
        return this.exchanges.find(
            (exchange) => exchange.exchangeName === exchangeName,
        )
    }

    /** Получение всех подключенных бирж */
    getConnectedExchanges() {
        return this.exchanges.filter(
            (exchange) =>
                this.connectionStatus[exchange.exchangeName] === 'connected',
        )
    }
}
