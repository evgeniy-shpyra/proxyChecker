import initTelegram from './transport/telegram.js'
import iniProxyChecker from './checkProxy.js'
import initScheduler from './scheduler.js'
import initStore from './store.js'

const app = async () => {
  const store = await initStore()
  await store.write("[232323232]")
  const checker = iniProxyChecker()
  const telegram = initTelegram({ checker, store })
  const scheduler = initScheduler()

  const handler = async () => {
    try {
      console.log('handler')
      const message = await checker()
      if (!message) return
      telegram.sendMessageToAll(message)
    } catch (e) {
      console.error('Handler error', e)
    }
  }

  scheduler.schedule(handler, '30 8 * * *')
  scheduler.schedule(handler, '0 13 * * *')
  scheduler.schedule(handler, '0 19 * * *')

  let isStopped = false
  const handleStop = () => {
    if (isStopped) return
    isStopped = true
    setTimeout(() => {
      process.exit(1)
    }, 5000).unref()

    scheduler.stop()
    telegram.stop()
  }

  return handleStop
}

export default app
