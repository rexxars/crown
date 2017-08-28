const Boom = require('boom')
const {
  DisallowedHostError,
  MaxAllowedBytesExceededError,
  RequestTimeoutError
} = require('../errors')

const isNotHttpOk = res => res && res.statusCode >= 300

const handleHttpError = res => {
  if (!res || !isNotHttpOk(res)) {
    return undefined
  }

  switch (res.statusCode) {
    case 301:
      return Boom.create(508, 'Reached maximum number of redirects without resolving')
    case 404:
      return Boom.notFound('Remote server responded with a 404')
    default:
      return new Error('Unknown HTTP error')
  }
}

const handleNodeError = err => {
  // First attempt to use the code (node http/parse errors)
  switch (err.code) {
    case 'ENOTFOUND':
      return Boom.notFound('Hostname could not be resolved')
    case 'ECONNRESET':
      return Boom.serverTimeout(err.message)
    case 'ESOCKETTIMEDOUT':
      return Boom.gatewayTimeout()
    case 'ECONNREFUSED':
      return Boom.badGateway('Remote host refused the connection attempt')
    default:
      return undefined
  }
}

const handleCrownError = err => {
  // Crown-initiated error?
  if (err instanceof DisallowedHostError) {
    return Boom.forbidden('Hostname of URL is forbidden (blacklisted)')
  }

  if (err instanceof MaxAllowedBytesExceededError) {
    return Boom.notAcceptable('Response exceeded max allowed number of bytes')
  }

  if (err instanceof RequestTimeoutError) {
    return Boom.serverTimeout(err.message)
  }

  return undefined
}

const handleUncaughtError = err => {
  // Some node errors don't have a code, or the code is so cryptic that it is
  // likely to change in the future, for these, we'll try to match on message
  if (err.message === 'Parse Error') {
    return Boom.badGateway('Unable to parse response from remote server')
  }

  if (err.message.includes('redirects exceeded')) {
    return Boom.create(508, 'Reached maximum number of redirects without resolving')
  }

  console.error('Unhandled error type', err) // eslint-disable-line
  return Boom.badImplementation('Unhandled error type')
}

const handleBoomError = err => {
  if (err.isBoom) {
    return err
  }

  return undefined
}

const normalizeError = (err, res) =>
  handleHttpError(res) ||
  handleBoomError(err) ||
  handleNodeError(err) ||
  handleCrownError(err) ||
  handleUncaughtError(err)

module.exports = normalizeError
