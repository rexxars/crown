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

  if (res.statusCode === 301) {
    return {
      code: 'MAX_REDIRECTS_REACHED',
      message: 'Reached maximum number of redirects without resolving',
      retryable: false
    }
  }

  if (res.statusCode === 404) {
    return {
      code: 'REMOTE_URL_NOT_FOUND',
      message: 'Remote server responded with an HTTP 404 (Not Found)',
      retryable: false
    }
  }

  return {
    code: 'REMOTE_HTTP_ERROR',
    message: `Remote server responded with an HTTP ${res.statusCode}`,
    retryable: true
  }
}

const handleNodeError = err => {
  // First attempt to use the code (node http/parse errors)
  switch (err.code) {
    case 'ENOTFOUND':
      return {
        code: 'REMOTE_HOST_NOT_FOUND',
        message: 'Hostname could not be resolved',
        retryable: false
      }
    case 'ECONNRESET':
      return {
        code: 'CONNECTION_RESET',
        message: 'Connection to remote host was reset',
        retryable: true
      }
    case 'ESOCKETTIMEDOUT':
      return {
        code: 'SOCKET_TIMEOUT',
        message: 'Connection to remote host timed out',
        retryable: true
      }
    case 'ECONNREFUSED':
      return {
        code: 'REMOTE_HOST_REFUSED_CONNECTION',
        message: 'Remote host refused the connection attempt',
        retryable: false
      }
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
    return {
      code: 'CONNECTION_TIMEOUT',
      message: 'Connection to remote host timed out',
      retryable: true
    }
  }

  return undefined
}

const handleUncaughtError = err => {
  // Some node errors don't have a code, or the code is so cryptic that it is
  // likely to change in the future, for these, we'll try to match on message
  if (err.message.includes('Parse Error')) {
    return {
      code: 'PARSE_ERROR',
      message: 'Unable to parse response from remote server',
      retryable: true
    }
  }

  if (err.message.includes('redirects exceeded')) {
    return {
      code: 'MAX_REDIRECTS_REACHED',
      message: 'Reached maximum number of redirects without resolving',
      retryable: false
    }
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
