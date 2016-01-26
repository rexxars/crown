import request from 'request'
import userAgents from '../config/userAgents'
import config from '../config/config'
import {isPrivate} from 'hostname-is-private'
import {parse as parseUrl} from 'url'
import {DisallowedHostError} from './errors'

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)]

const defaultOptions = {
  headers: {
    'Accept-Language': 'en-US,en;q=0.8,nb;q=0.6,da;q=0.4',
    Accept: 'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  }
}

const makeRequest = (opts, callback) => {
  const options = Object.assign({}, defaultOptions, opts)
  options.headers['User-Agent'] = getRandomUserAgent()

  const httpRequest = request(opts, (err, res, body) => {
    callback(err, res, body, httpRequest)
  })
}

const validateRequest = (opts, callback) => {
  // See if we have to resolve the hostname before we can do the request
  if (config.allowPrivateHostnames) {
    return makeRequest(opts, callback)
  }

  const url = parseUrl(opts.url, false, true)
  isPrivate(url.hostname, (err, urlIsPrivate) => {
    if (err || urlIsPrivate) {
      return callback(err || new DisallowedHostError('Host not allowed'))
    }

    makeRequest(opts, callback)
  })
}

export default validateRequest
