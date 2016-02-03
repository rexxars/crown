import {parse as parseUrl} from 'url'
import wreck from 'wreck'
import once from 'lodash/once'
import {isPrivate} from 'hostname-is-private'
import userAgents from '../config/userAgents'
import {
  DisallowedHostError,
  RequestTimeoutError,
  MaxAllowedBytesExceededError
} from './errors'

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)]

const defaultOptions = {
  headers: {
    'Accept-Language': 'en-US,en;q=0.8,nb;q=0.6,da;q=0.4',
    'Accept': 'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  }
}

const closeStream = stream => {
  if (typeof stream.destroy === 'function') {
    stream.destroy()
  }
}

const makeRequest = (method, url, opts, callback) => {
  const options = Object.assign({}, defaultOptions, opts)
  options.headers['User-Agent'] = getRandomUserAgent()

  wreck.request(method, url, opts, (err, res) => {
    if (err) {
      return callback(err)
    }

    // Some extractors fetch data from the <body> of the document, if any of these are enabled,
    // let wreck do the work, buffering the response and handling max size/timeout
    if (opts.requiresBody) {
      return wreck.read(res, {
        timeout: opts.timeout,
        maxBytes: opts.maxBytes
      }, (readErr, body) => callback(readErr, res, body))
    }

    // If we just need the <head>, stream the response until we have the closing head tag
    const cb = once(callback)
    let data = ''
    let lastIndex = 0
    let timedOut = false

    // Stop reading data if we reach the user-defined timeout
    const timeout = setTimeout(() => {
      timedOut = true
      process.nextTick(() => closeStream(res))
      cb(new RequestTimeoutError('Read timeout while fetching URL'))
    }, opts.timeout)

    // Start reading data, buffering until we hit a max limit or have found the target
    res.on('data', chunk => {
      // Data events might still be emitted after a timeout,
      // since the closing of the socket is not immediate
      if (timedOut) {
        return null
      }

      data += chunk.toString()

      // Look for the closing head tag in the buffer, but only from the last point
      // we looked. We pull away 7 characters (length of `</head>`) from the index
      // because the last chunk might have been in the middle of the target string
      const headClosePosition = data.indexOf('</head>', Math.max(0, lastIndex - 7))
      if (headClosePosition !== -1) {
        closeStream(res)
        clearTimeout(timeout)
        return cb(null, res, data.substr(0, headClosePosition + 7))
      }

      // Buffer the last index we searched to within our buffer, then check if we're
      // above the limit for max bytes
      lastIndex = data.length
      if (lastIndex >= opts.maxBytes) {
        clearTimeout(timeout)
        return cb(new MaxAllowedBytesExceededError(
          'Maximum number of bytes exceeded while retrieving content from URL'
        ))
      }
    })

    // If we didn't find any closing head tag, call back with the data buffer anyway
    res.on('end', () => {
      clearTimeout(timeout)
      cb(null, res, data)
    })
  })
}

const validateRequest = (opts, callback) => {
  // See if we have to resolve the hostname before we can do the request
  if (opts.allowPrivateHostnames) {
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
