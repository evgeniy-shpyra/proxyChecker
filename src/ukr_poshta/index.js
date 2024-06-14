import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'

const url = `https://www.ukrposhta.ua/status-tracking/0.0.1/statuses/with-not-found`

const body = ['0504713177726']

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
        method: 'POST',
        dispatcher: proxyAgent,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.UP_API_KEY}`,
        },
      })

      const responseBody = await response.body.json()

      if (responseBody.code) {
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error('up error', e.message, proxy)
      result.badProxies.push(proxy)
      result.error++
    } finally {
      console.log('Up checked')
      await proxyAgent.close()
    }

    await sleep(sleepTime)
  }

  return result
}

export default check
