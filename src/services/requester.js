const getIt = require('get-it')
const Boom = require('boom')
const {sample} = require('lodash')
const {debug, promise} = require('get-it/middleware')
const urlIsPrivate = require('./urlIsPrivate')

const request = getIt([debug({verbose: true}), promise()])

const getDefaultOptions = (config) => ({
  headers: {
    Accept:
      'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.8,nb;q=0.6,da;q=0.4',
    'User-Agent': sample(config.userAgents),
  },
})

const getRequester = (config) => async (opts) => {
  // See if we have to resolve the hostname before we can do the request
  const hostnameDisallowed = config.allowPrivateHostnames
    ? Promise.resolve(false)
    : urlIsPrivate(opts.url)

  if (await hostnameDisallowed) {
    throw Boom.forbidden('Hostname not allowed')
  }

  const options = getDefaultOptions(config)
  return request({
    url: opts.url,
    method: opts.method,
    headers: options.headers,
    timeout: {
      connect: config.connectTimeout,
      socket: config.socketTimeout,
    },
  })
}

module.exports = getRequester
