export const randomString = (i) => {
  var rnd = ''
  while (rnd.length < i) rnd += Math.random().toString(36).substring(2)
  return rnd.substring(0, i)
}

export const telegramErrorMessageWrapper = (errors) => {
  let message = 'Не вдалося отримати відповідь:\n\n'

  for (const error of errors) {
    const proxies = error.proxies.reduce(
      (acc, err) => acc + `${err.ip}:${err.username}:${err.password}\n`,
      ''
    )
    message += `${error.title}:\n${proxies}`
  }
  return message
}
