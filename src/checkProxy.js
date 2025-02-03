import checkNp from './nova_poshta/ingex.js'
import checkBinotel from './binotel/index.js'
import checkProm from './prom/index.js'
import checkRozetka from './rozetka/index.js'
import checkTurbosms from './turbosms/index.js'
import { getProxies } from './proxyHelper.js'
import { telegramErrorMessageWrapper } from './helpers.js'

const iniProxyChecker = () => {
  const proxies = getProxies()
  const sleepTime = Number(process.env.SLEEP_TIME)

  const check = async () => {
    const modules = [
      {
        handler: () => checkNp(proxies, sleepTime),
        title: 'Нова пошта',
      },
      {
        handler: () => checkBinotel(proxies, sleepTime),
        title: 'Binotel',
      },
      {
        handler: () => checkRozetka(proxies, sleepTime),
        title: 'Rozetka',
      },
      {
        handler: () => checkProm(proxies, sleepTime),
        title: 'Prom',
      },
      {
        handler: () => checkTurbosms(proxies, sleepTime),
        title: 'TurboSMS',
      },
    ]

    const promises = []

    for (const module of modules) {
      const { title, handler } = module
      const check = async () => {
        const result = await handler()
        return { ...result, title }
      }
      promises.push(check())
    }

    const response = []
    const results = await Promise.all(promises)

   
    for (const result of results) {
    
      if (result.error > 0) {

        const { title, data } = result

        response.push({
          title,
          data
        })
      }
    }


    if (!response.length) return null
    const message = telegramErrorMessageWrapper(response)

    return message
  }

  return check
}

export default iniProxyChecker
