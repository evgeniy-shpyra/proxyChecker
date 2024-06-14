import app from './src/index.js'

const shutdown = await app()

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
