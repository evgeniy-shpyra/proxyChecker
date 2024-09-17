import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'

const url = `https://my.prom.ua/api/v1/orders/list?limit=1`
const headers = {
  Authorization: `Bearer ${process.env.PROM_API_KEY}`
}

const check = async (proxies, sleepTime) => {
  const result = {
    success: 0,
    error: 0,
    data: []
  }

  for (const proxy of proxies) {
    const { username, password } = proxy
    const proxyToken = Buffer.from(`${username}:${password}`).toString('base64')
    const proxyAgent = new ProxyAgent({
      uri: `http://${proxy.ip}`,
      token: `Basic ${proxyToken}`
    })

    let responseHeaders
    try {
      const response = await request(url, {
        method: 'GET',
        dispatcher: proxyAgent,
        headers
      })

      responseHeaders = response.headers
      if (!responseHeaders['content-type'].startsWith('application/json')) {
        const responseBody = await response.body.text()
        console.log('prom error', responseBody)
        throw new Error('Bad response')
      }
      const responseBody = await response.body.json()
      if (responseBody.orders) {
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error('prom error', e, proxy)
      result.data.push({ proxy, message: e.message })
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
