import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'

const url = `https://my.prom.ua/api/v1/orders/list?limit=1`
const headers = {
  Authorization: `Bearer ${process.env.PROM_API_KEY}`,
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
      const response = await request(url, {
        method: 'GET',
        dispatcher: proxyAgent,
        headers,
      })
      const responseBody = await response.body.json()
      if (responseBody.orders) {
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error("prom error", e.message, proxy)
      result.badProxies.push(proxy)
      result.error++
    } finally {
      console.log('Prom checked')
      await proxyAgent.close()
    }
    await sleep(sleepTime)
  }

  

  return result
}

export default check
