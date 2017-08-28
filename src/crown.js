/* eslint-disable no-console, no-process-exit */
const server = require('./app')
const config = require('../config/config')

const app = server(config)

app.use((req, res, next) => {
  res.setHeader('Connection', 'close')
  next()
})

const httpServer = app.listen(config.port, config.host, () => {
  console.log(`Crown ♛ running on http://${config.host}:${config.port}`)
})

process.on('SIGTERM', () => {
  console.log('\nCaught SIGTERM, exiting')
  httpServer.close(() => process.exit(143))
})
