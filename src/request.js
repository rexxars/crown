import wreck from 'wreck'
import userAgents from '../config/userAgents'
import config from '../config/config'
import {isPrivate} from 'hostname-is-private'
import {parse as parseUrl} from 'url'
import {DisallowedHostError} from './errors'

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)]

const defaultOptions = {
  headers: {
    'Accept-Language': 'en-US,en;q=0.8,nb;q=0.6,da;q=0.4',
    'Accept': 'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  }
}

const makeRequest = (method, url, opts, callback) => {
  const options = Object.assign({}, defaultOptions, opts)
  options.headers['User-Agent'] = getRandomUserAgent()

  wreck.request(method, url, opts, (err, res) => {
    if (err) {
      return callback(err)
    }

    const readOpts = {
      timeout: opts.timeout,
      maxBytes: opts.maxBytes
    }

    wreck.read(res, readOpts, (readErr, body) => callback(readErr, res, body))
  })
}

const validateRequest = (opts, callback) => {
  // See if we have to resolve the hostname before we can do the request
  if (config.allowPrivateHostnames) {
    return makeRequest(opts.method, opts.url, opts, callback)
  }

  const url = parseUrl(opts.url, false, true)
  isPrivate(url.hostname, (err, urlIsPrivate) => {
    if (err || urlIsPrivate) {
      return callback(err || new DisallowedHostError('Host not allowed'))
    }

    makeRequest(opts.method, opts.url, opts, callback)
  })
}

export default validateRequest
