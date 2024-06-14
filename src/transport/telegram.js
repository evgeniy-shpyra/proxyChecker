import TelegramBot from 'node-telegram-bot-api'
import { getProxyList } from '../proxyHelper.js'

const initTelegram = ({ checker, store }) => {
  const token = process.env.TELEGRAM_TOKEN

  const bot = new TelegramBot(token, { polling: true })

  const getChatIds = async () => {
    const data = await store.read()
    if (data) return JSON.parse(data)
    else return []
  }

  const addChatId = async (id) => {
    const existedIds = await getChatIds()
    if (existedIds.includes(id)) return
    existedIds.push(id)
    await store.write(JSON.stringify(existedIds))
  }

  const sendMenu = async (chatId) => {
    const message = 'Меню:'

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Протестувати', callback_data: 'test' },
            { text: 'Показати список проксі', callback_data: 'show_list' },
          ],
        ],
      },
    }

    bot.sendMessage(chatId, message, options)
  }

  const handleCheck = async (chatId) => {
    try {
      const waitingMsg = await bot.sendMessage(chatId, `Тестування...`)
      console.log("handleCheck", new Date().toLocaleString())
      const errorMessage = await checker()
      let message = null

      if (errorMessage) {
        message = errorMessage
      } else {
        message = 'Всі проксі працюють справно'
      }

      await bot.sendMessage(chatId, message).catch((error) => {
        console.error(`Failed to send message to ${id}:`, error)
      })

      await bot.deleteMessage(chatId, waitingMsg.message_id)

      await sendMenu(chatId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShowProxies = async (chatId) => {
    const message = getProxyList()

    await bot.sendMessage(chatId, message).catch((error) => {
      console.error(`Failed to send message to ${id}:`, error)
    })

    await sendMenu(chatId)
  }

  const sendMessageToAll = async (message) => {
    const chatIds = await getChatIds()
    for (const id of chatIds) {
      await bot.sendMessage(id, message).catch((error) => {
        console.error(`Failed to send message to ${id}:`, error)
      })
    }
  }

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id
    await addChatId(chatId)
    await sendMenu(chatId)
  })

  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id
    const messageId = query.message.message_id

    switch (query.data) {
      case 'show_list':
        handleShowProxies(chatId)
        break
      case 'test':
        handleCheck(chatId)
        break
    }

    bot.deleteMessage(chatId, messageId)
    await addChatId(chatId)
  })

  bot.on('message', (msg) => {
    const chatId = msg.chat.id
    addChatId(chatId)
  })

  const stop = () => {
    console.log('Stop telegram')
    bot.stopPolling()
  }

  return { sendMessageToAll, stop }
}

export default initTelegram
