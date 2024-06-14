import fs from 'node:fs'
import path from 'node:path'

const initStore = async () => {
  const dirPath = path.resolve('./store')
  const fileName = 'store.json'
  const fullPath = `${dirPath}/${fileName}`

  try {
    await fs.promises.access(dirPath)
  } catch (e) {
    await fs.promises.mkdir(dirPath, { recursive: true })
  }

  if (!fs.existsSync(fullPath)) {
    await fs.promises.writeFile(fullPath, '')
  }

  const write = async (data) => {
    await fs.promises.writeFile(fullPath, data)
  }

  const read = async () => {
    const data = await fs.promises.readFile(fullPath, {
      encoding: 'utf8',
    })
    return data
  }

  return { write, read }
}

export default initStore
