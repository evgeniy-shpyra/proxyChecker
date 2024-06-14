import { request, ProxyAgent } from 'undici'
import { setTimeout as sleep } from 'node:timers/promises'

const loginUrl = `https://api-seller.rozetka.com.ua/sites`
const logoutUrl = `https://api-seller.rozetka.com.ua/sites/logout`

const loginBody = {
  username: process.env.ROZETKA_USERNAME,
  password: btoa(process.env.ROZETKA_PASSWORD),
}
const loginHeaders = {
  'Content-Type': 'application/json',
}
const getLogoutHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
})

const handleLogin = async ({ headers, body, proxyAgent, url }) => {
  const response = await request(url, {
    method: 'POST',
    dispatcher: proxyAgent,
    headers,
    body: JSON.stringify(body),
  })
  return await response.body.json()
}
const handleLogout = async ({ headers, proxyAgent, url }) => {
  const response = await request(url, {
    method: 'POST',
    dispatcher: proxyAgent,
    headers,
  })
  return await response.body.json()
}

const check = async (proxies, sleepTime) => {
  const result = {
    success: 0,
    error: 0,
    badProxies: [],
  }

  let token = null

  for (const proxy of proxies) {
    const { username, password } = proxy
    const proxyToken = Buffer.from(`${username}:${password}`).toString('base64')
    const proxyAgent = new ProxyAgent({
      uri: `http://${proxy.ip}`,
      token: `Basic ${proxyToken}`,
    })

    try {
      let response = null
      if (!token) {
        response = await handleLogin({
          headers: loginHeaders,
          body: loginBody,
          url: loginUrl,
        })
      } else {
        response = await handleLogout({
          headers: getLogoutHeaders(token),
          url: logoutUrl,
        })
        token = null
      }

      if (response.success !== undefined) {
        if (response.success && response?.content?.access_token && !token) {
          token = response.content.access_token
        }
        result.success++
      } else {
        throw new Error('Bad response')
      }
    } catch (e) {
      console.error("rozetka error", e.message, proxy)
      result.badProxies.push(proxy)
      result.error++
      token = null
    } finally {
      console.log('Rozetka checked')
      await proxyAgent.close()
    }
    await sleep(sleepTime)
  }

  

  return result
}

export default check
