import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'
import soap from 'soap'

const url = 'http://turbosms.in.ua/api/wsdl.html'

const args = {
  login: process.env.TURBO_SMS_LOGIN,
  password: process.env.TURBO_SMS_PASSWORD,
}

const createConnection = async (options, args) =>
  new Promise((res, rej) => {
    soap.createClient(url, options, function (err, client) {
      if (err) {
        rej(err)
        return
      }
      client.Auth(args, function (err, result) {
        if (err) {
          rej(err)
          return
        }
        res(result)
      })
    })
  })

const check = async (proxies, sleepTime) => {
  const result = {
    success: 0,
    error: 0,
    data: [],
  }

  for (const proxy of proxies) {
    const { username, password } = proxy
    const proxyToken = Buffer.from(`${username}:${password}`).toString('base64')
    const proxyAgent = new ProxyAgent({
      uri: `http://${proxy.ip}`,
      token: `Basic ${proxyToken}`,
    })

    try {
      const options = {
        wsdl_options: {
          agent: proxyAgent,
        },
      }
      const resultConnection = await createConnection(options, args)
      if (
        resultConnection &&
        resultConnection.AuthResult === 'Вы успешно авторизировались'
      ) {
        result.success++
      } else {
        throw new Error(result)
      }
    } catch (e) {
      console.error("turbosms error", e, proxy)
      result.data.push({ proxy, message: e.message })
      result.error++
    } finally {
      console.log('Turbosms checked')
      await proxyAgent.close()
    }
    await sleep(sleepTime)
  }

  return result
}

export default check
