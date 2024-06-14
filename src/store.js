import fs from 'node:fs/promises'
import path from 'node:path'

const initStore = async () => {
  const fullPath = path.resolve('./store/store.json')

  try {
    await fs.access(fullPath)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  const write = async (data) => {
    await fs.writeFile(fullPath, data)
  }

  const read = async () => {
    const data = await fs.readFile(fullPath, {
      encoding: 'utf8',
    })
    return data
  }

  return { write, read }
}

export default initStore
