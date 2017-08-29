const cors = require('cors')
const express = require('express')
const celebrate = require('celebrate')
const defaultsDeep = require('lodash/defaultsDeep')
const defaultConfig = require('../config/config')
const logger = require('./services/logger')
const requester = require('./services/requester')
const errorHandler = require('./middleware/errorHandler')

module.exports = conf => {
  // Init services with passed config
  const config = defaultsDeep({}, conf, defaultConfig)
  const app = express()
  app.services = {
    logger: config.logger || logger(config),
    requester: requester(config)
  }

  if (config.cors.enabled) {
    app.use(cors(config.cors))
  }

  app.disable('x-powered-by')
  app.use('/ping', require('./controllers/ping'))
  app.use('/resolve', require('./controllers/resolve'))

  // Error handling middlewares
  app.use(celebrate.errors())
  app.use(errorHandler)

  return app
}
