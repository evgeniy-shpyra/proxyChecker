import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'
import { randomString } from '../helpers.js'

const url = `https://cstat.nextel.com.ua:8443/tracking/api/autodial/action`
const body = {
  action: 'GET_WITH_DATA',
}
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'accept': 'application/json',
  'Authorization': process.env.NEXTEL_KEY,
})

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
        headers: getHeaders(),
        body: JSON.stringify(body),
      })

      const responseBody = await response.body.json()

      if (responseBody.audios || responseBody.message === 'Authorization invalid') {
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error('nextel error', e.message, proxy)
      result.badProxies.push(proxy)
      result.error++
    } finally {
      console.log('Nextel checked')
      await proxyAgent.close()
    }
    await sleep(sleepTime)
  }

  return result
}

export default check
