export const randomString = (i) => {
  var rnd = ''
  while (rnd.length < i) rnd += Math.random().toString(36).substring(2)
  return rnd.substring(0, i)
}

export const telegramErrorMessageWrapper = (modules) => {
  const errorMessage = '*Не вдалося отримати відповідь:*'

  const messages = []

  for (const module of modules) {
    const { title, data } = module
    const badProxies = []

    for (const { message, proxy } of data) {
      const { ip, username, password } = proxy
      badProxies.push(`${ip} - message: ${message}`)
    }

    messages.push(`${title}:\n${badProxies.join('\n')}`)
  }

  return `${errorMessage}\n${messages.join('\n')}`
}
