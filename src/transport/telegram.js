import TelegramBot from 'node-telegram-bot-api'
import { getProxyList } from '../proxyHelper.js'

const initTelegram = ({ checker, store }) => {
  const menuMessageId = {}
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
    const message = '*Меню*'

    const options = {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [
            { text: 'Протестувати', callback_data: 'test' },
            { text: 'Показати список проксі', callback_data: 'show_list' },
          ],
        ],
      },
    }

    const response = await bot.sendMessage(chatId, message, options)
    if (menuMessageId[response.chat.id]) {
      await bot.deleteMessage(response.chat.id, menuMessageId[response.chat.id])
    }
    menuMessageId[response.chat.id] = response.message_id
  }

  const handleCheck = async (chatId) => {
    try {
      const waitingMsg = await bot.sendMessage(chatId, `Тестування...`)
      console.log('handleCheck', new Date().toLocaleString())
      const errorMessage = await checker()
      let message = null

      if (errorMessage) {
        message = errorMessage
      } else {
        message = '*Всі проксі працюють справно*'
      }

      await bot
        .sendMessage(chatId, message, { parse_mode: 'Markdown' })
        .catch((error) => {
          console.error(`Failed to send message to ${id}:`, error)
        })

      await bot.deleteMessage(chatId, waitingMsg.message_id)

      await sendMenu(chatId)
    } catch (e) {
      console.error(e)
    }
  }

  const handleShowProxies = async (chatId) => {
    const message = `*Всі проксі:*\n${getProxyList()}`

    await bot
      .sendMessage(chatId, message, { parse_mode: 'Markdown' })
      .catch((error) => {
        console.error(`Failed to send message to ${id}:`, error)
      })

    await sendMenu(chatId)
  }

  const sendMessageToAll = async (message) => {
    const chatIds = await getChatIds()
    for (const id of chatIds) {
      await bot
        .sendMessage(id, message, { parse_mode: 'Markdown' })
        .catch((error) => {
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

  bot.on('message', async (msg) => {
    try {
      const chatId = msg.chat.id
      const messageId = msg.message_id
      await addChatId(chatId)

      const message = msg.text.toString()

      switch (message) {
        case 'Показати список проксі':
          handleShowProxies(chatId)
          break
        case 'Протестувати':
          handleCheck(chatId)
          break
      }

      if (menuMessageId[chatId]) {
        await bot.deleteMessage(chatId, menuMessageId[chatId])
        menuMessageId[chatId] = null
      }
      await bot.deleteMessage(chatId, messageId)
    } catch (e) {
      console.log(e)
    }
  })

  const stop = () => {
    console.log('Stop telegram')
    bot.stopPolling()
  }

  return { sendMessageToAll, stop }
}

export default initTelegram
