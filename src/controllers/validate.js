import Joi from 'joi'
import Boom from 'boom'
import request from '../request'
import appConfig from '../../config/config'
import {DisallowedHostError} from '../errors'

const isNotHttpOk = res => res && res.statusCode >= 300

const handleHttpError = res => {
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

const handleSuccess = (res, body) => {
  return {foo: 'bar'}
}

const handleError = (err, res, req) => {
  if (isNotHttpOk(res)) {
    return handleHttpError(res)
  }

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

  // Crown-initiated error?
  if (err instanceof DisallowedHostError) {
    return Boom.forbidden('Hostname of URL is forbidden (blacklisted)')
  }

  // Some node errors don't have a code, or the code is so cryptic that it is
  // likely to change in the future, for these, we'll try to match on message
  if (err.message === 'Parse Error') {
    return Boom.badGateway('Unable to parse response from remote server')
  }

  if (err.message.includes('maxRedirects')) {
    return Boom.badRequest(
      'Reached maximum number of redirects without resolving',
      {lastLocation: req.uri.href}
    )
  }

  console.error('Unhandled error type', err) // eslint-disable-line
  return Boom.badImplementation('Unhandled error type')
}

const validateHandler = (req, reply) => {
  request({
    url: req.query.url,
    maxRedirects: req.query.maxRedirects || 3,
    followRedirect: req.query.maxRedirects > 0,
    timeout: appConfig.timeout,
    gzip: true
  }, (err, res, body, httpRequest) => {
    reply(
      err || isNotHttpOk(res)
      ? handleError(err, res, httpRequest)
      : handleSuccess(res, body, httpRequest)
    )
  })
}

export const config = {
  validate: {
    query: {
      url: Joi.string().required().uri({scheme: ['http', 'https']}),
      maxRedirects: Joi.number().integer().min(0).max(10)
    }
  }
}

export default validateHandler
