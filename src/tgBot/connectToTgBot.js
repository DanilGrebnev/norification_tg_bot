import { Bot } from 'grammy'

/** Подключение к Telegram боту */
export async function connectToTgBot(options = {}, successCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const { token } = options

            if (!token) {
                throw new Error('Telegram bot token не указан')
            }

            console.log('[TgBot] Подключение к Telegram боту...')

            // Создаем экземпляр бота
            const bot = new Bot(token)

            // Настраиваем обработчики
            setupBotHandlers(bot)

            // Получаем информацию о боте
            const botInfo = await bot.api.getMe()
            console.log(`[TgBot] Бот подключен: @${botInfo.username}`)

            // Запускаем бота в неблокирующем режиме
            bot.start()
            // Даем небольшую задержку для инициализации бота
            setTimeout(() => {
                resolve(bot)
            }, 500)
            successCallback?.()
        } catch (error) {
            console.error('[TgBot] Ошибка подключения к боту:', error.message)
            reject(error)
        }
    })
}

/** Настройка обработчиков команд и сообщений бота */
function setupBotHandlers(bot) {
    // Команда /start
    bot.command('start', async (ctx) => {
        const welcomeMessage = `
🎉 <b>Добро пожаловать в TradeBot!</b>

Я буду уведомлять вас об объемах покупок и продаж Bitcoin.

<b>⏰ Выберите интервал подписки:</b>
        `

        await ctx.reply(welcomeMessage, {
            parse_mode: 'HTML',
            reply_markup: getSubscriptionKeyboard(),
        })
    })

    // Команда /help
    bot.command('help', async (ctx) => {
        const helpMessage = `
📚 <b>Справка TradeBot</b>

<b>Команды:</b>
/start - Запуск и выбор интервала
/help - Эта справка

<b>Как работает:</b>
• Выберите интервал уведомлений
• Получайте данные об объемах Bitcoin
• Отслеживайте доминирование покупок/продаж
        `

        await ctx.reply(helpMessage, {
            parse_mode: 'HTML',
        })
    })

    // Обработка callback кнопок
    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery.data

        if (data.startsWith('sub_')) {
            await handleSubscription(ctx, data)
        }

        await ctx.answerCallbackQuery()
    })

    // Обработка текстовых сообщений
    bot.on('message:text', async (ctx) => {
        await ctx.reply('Используйте /start для настройки подписок')
    })

    // Обработка ошибок
    bot.catch((err) => {
        console.error('[TgBot] Ошибка:', err)
    })
}

/** Обработка подписок на интервалы */
async function handleSubscription(ctx, data) {
    try {
        // Извлекаем интервал из callback data (например, sub_30s -> 30)
        const intervalMatch = data.match(/sub_(\d+)([smh])/)
        if (!intervalMatch) {
            await ctx.answerCallbackQuery('❌ Неверный формат интервала')
            return
        }

        const value = parseInt(intervalMatch[1])
        const unit = intervalMatch[2]

        let seconds
        switch (unit) {
            case 's':
                seconds = value
                break
            case 'm':
                seconds = value * 60
                break
            case 'h':
                seconds = value * 3600
                break
            default:
                seconds = value
        }

        const intervalName = formatInterval(seconds)

        await ctx.editMessageText(
            `✅ <b>Подписка активирована!</b>\n\nВы будете получать уведомления об объемах Bitcoin каждые ${intervalName}.\n\n🟢 Зеленые уведомления = доминирование покупок\n🔴 Красные уведомления = доминирование продаж`,
            { parse_mode: 'HTML' },
        )

        console.log(
            `[TgBot] Пользователь ${ctx.from.id} подписался на ${intervalName}`,
        )
    } catch (error) {
        console.error('[TgBot] Ошибка обработки подписки:', error)
        await ctx.answerCallbackQuery('❌ Ошибка подписки')
    }
}

/** Клавиатура выбора интервалов */
function getSubscriptionKeyboard() {
    const { InlineKeyboard } = require('grammy')

    return new InlineKeyboard()
        .text('⏱️ 30 секунд', 'sub_30s')
        .text('📊 1 минута', 'sub_1m')
        .row()
        .text('📈 5 минут', 'sub_5m')
        .text('🕐 15 минут', 'sub_15m')
        .row()
        .text('🕕 30 минут', 'sub_30m')
        .text('🕐 1 час', 'sub_1h')
}

/** Форматирует интервал в читаемый вид */
function formatInterval(seconds) {
    if (seconds < 60) {
        return `${seconds} секунд`
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        return `${minutes} минут`
    } else {
        const hours = Math.floor(seconds / 3600)
        return `${hours} час`
    }
}
