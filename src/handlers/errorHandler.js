import Boom from 'boom'
import {
  DisallowedHostError,
  MaxAllowedBytesExceededError,
  RequestTimeoutError
} from '../errors'

export const isNotHttpOk = res => res && res.statusCode >= 300

const handleHttpError = res => {
  if (!isNotHttpOk(res)) {
    return null
  }

  switch (res.statusCode) {
    case 301:
      return Boom.badRequest(
        'Reached maximum number of redirects without resolving',
        {lastLocation: res.headers.Location}
      )
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
      // Intentional fall-through
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
}

const handleUncaughtError = err => {
  // Some node errors don't have a code, or the code is so cryptic that it is
  // likely to change in the future, for these, we'll try to match on message
  if (err.message === 'Parse Error') {
    return Boom.badGateway('Unable to parse response from remote server')
  }

  if (err.message.includes('Maximum redirections')) {
    return Boom.badRequest(
      'Reached maximum number of redirects without resolving',
      {lastLocation: err.data[err.data.length - 1]}
    )
  }

  console.error('Unhandled error type', err) // eslint-disable-line
  return Boom.badImplementation('Unhandled error type')
}

export const handleError = (err, res, req) => (
  handleHttpError(res)
  || handleNodeError(err)
  || handleCrownError(err)
  || handleUncaughtError(err)
)
