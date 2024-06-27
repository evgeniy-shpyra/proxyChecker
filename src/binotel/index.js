import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'

const url = `https://api.binotel.com/api/4.0/stats/incoming-calls-for-period.json`
const headers = {
  'Content-Type': 'application/json',
}

const key = process.env.BINOTEL_KEY
const secret = process.env.BINOTEL_SECRRET

const body = {
  key,
  secret,
  startTime: 1370034000,
  stopTime: 1370120399,
}

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
      const response = await request(url, {
        method: 'POST',
        dispatcher: proxyAgent,
        headers,
        body: JSON.stringify(body),
      })

      const responseBody = await response.body.json()
      if (responseBody.status && responseBody.status === 'success') {
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error('binotel error', e, proxy)
      result.data.push({ proxy, message: e.message })
      result.error++
    } finally {
      console.log('Binotel checked')
      await proxyAgent.close()
    }
    await sleep(sleepTime)
  }

  return result
}

export default check
