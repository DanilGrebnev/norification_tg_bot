import mongoose from 'mongoose'

/**
 * Подключение к базе данных
 */
export async function connectToDb(options = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            const { uri, dbName } = options

            if (!uri) {
                throw new Error('Database URI не указан')
            }

            console.log('[Database] Подключение к базе данных...')

            await mongoose.connect(uri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            })

            console.log(`[Database] Подключено к базе: ${dbName || 'default'}`)

            // Настраиваем обработчики событий
            setupEventHandlers()

            resolve(mongoose.connection)
        } catch (error) {
            console.error('[Database] Ошибка подключения:', error.message)
            reject(error)
        }
    })
}

/**
 * Настройка обработчиков событий базы данных
 */
function setupEventHandlers() {
    mongoose.connection.on('connected', () => {
        console.log('[Database] ✅ Соединение установлено')
    })

    mongoose.connection.on('error', (error) => {
        console.error('[Database] ❌ Ошибка соединения:', error)
    })

    mongoose.connection.on('disconnected', () => {
        console.log('[Database] ⚠️ Соединение разорвано')
    })

    mongoose.connection.on('reconnected', () => {
        console.log('[Database] 🔄 Переподключение выполнено')
    })
}
