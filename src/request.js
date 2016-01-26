import request from 'request'
import userAgents from '../config/userAgents'

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

  request(opts, callback)
}

export default makeRequest
