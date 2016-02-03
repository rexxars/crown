import Wreck from 'wreck'
import Memcached from 'memcached'
import appConfig from '../config/config'

const hosts = appConfig.memcached.split(',').map(host => host.trim()).filter(Boolean)
const hasCache = hosts.length > 0
const cache = hasCache && new Memcached(hosts)

// Do nothing, but call the last encountered function (callback)
const noop = (...args) => {
  for (let i = args.length - 1; i > 0; i--) {
    if (typeof args[i] === 'function') {
      return args[i]()
    }
  }
}

const ttl = res => {
  const cc = Wreck.parseCacheControl(res.headers['cache-control'] || '') || {}
  return cc['s-max-age'] || cc['max-age'] || appConfig.defaultCacheTtl
}

export default {
  set: hasCache ? cache.set.bind(cache) : noop,
  get: hasCache ? cache.get.bind(cache) : noop,
  ttl: ttl
}
