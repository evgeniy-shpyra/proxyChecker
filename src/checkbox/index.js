import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'

const url = `https://api.checkbox.in.ua/api/v1/cashier/signin`
const body = {
  login: process.env.CB_CASHIER_LOGIN,
  password: process.env.CB_CASHIER_PASSWORD,
}
const headers = {
  'Content-Type': 'application/json',
  'X-Client-Version': 'v0.0.1',
  'X-Client-Name': 'lp-crm.biz',
  'accept': 'application/json',
}

const check = async (proxies, sleepTime) => {
  const result = {
    success: 0,
    error: 0,
    badProxies: [],
  }

  for (const proxy of proxies) {
    const { username, password } = proxy
    const proxyToken = Buffer.from(`${username}:${password}`).toString('base64')
    const proxyAgent = new ProxyAgent({
      uri: `http://${proxy.ip}`,
      token: `Basic ${proxyToken}`,
    })

    try {
      throw new Error('Bad response')
      const response = await request(url, {
        method: 'POST',
        dispatcher: proxyAgent,
        headers,
        body: JSON.stringify(body),
      })
      const responseBody = await response.body.json()
      if (
        responseBody.access_token ||
        (responseBody.message &&
          responseBody.message === 'Невірний логін або пароль')
      ) {
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error("checkbox error", e.message, proxy)
      result.badProxies.push(proxy)
      result.error++
    } finally {
      await proxyAgent.close()
    }
    await sleep(sleepTime)
  }

  return result
}

export default check
