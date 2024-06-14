import proxies from '../proxy.json' assert { type: 'json' }

export const getProxies = () => {
  return proxies
}

export const getProxyList = () => {
  const message = proxies.reduce(
    (acc, err) => acc + `${err.ip}:${err.username}:${err.password}\n`,
    ''
  )
  return message
}
