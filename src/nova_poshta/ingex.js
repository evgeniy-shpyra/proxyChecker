import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'


const body = {
  apiKey: process.env.NP_API_KEY,
  modelName: 'InternetDocumentGeneral',
  calledMethod: 'getDocumentList',
  methodProperties: {
    DateTimeFrom: '10.01.2024',
    DateTimeTo: '20.01.2024',
    GetFullList: '1',
  },
}
const url = 'https://api.novaposhta.ua/v2.0/json/'

const check = async (proxies, sleepTime = 1000) => {

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
      const response = await fetch(url, {
        method: 'POST',
        dispatcher: proxyAgent,
        body: JSON.stringify(body),
      })

      const responseBody = await response.json()
      
      if (
        responseBody.success ||
        (responseBody.errorCodes &&
          responseBody.errorCodes.includes('20000401501'))
      ) {
        result.success++
      
      } else {
        throw new Error('Bad response')
      } 
    } catch (e) {
      console.error("np error", e.message, proxy)
      result.badProxies.push(proxy)
      result.error++
    } finally {
      await proxyAgent.close()
    }
    console.log('Np checked')
    await sleep(sleepTime)
  }

  return result
}

export default check
