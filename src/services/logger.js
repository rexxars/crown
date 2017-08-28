const pino = require('pino')

module.exports = config => {
  if (!config) {
    throw new Error('Logger needs to be initialized with a config before usage')
  }

  return pino({
    level: config.logLevel
  })
}
