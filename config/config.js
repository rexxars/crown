/* eslint-disable no-process-env */
const defaultConfig = {
  // Core server configuraton
  host: process.env.HTTP_HOST || '0.0.0.0',
  port: process.env.HTTP_PORT || 8000,

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Security and durability
  socketTimeout: process.env.SOCKET_TIMEOUT || 10000,
  connectTimeout: process.env.CONNECT_TIMEOUT || 3000,
  maxBytes: process.env.MAX_BYTES || 1048576, // 1 MB
  allowPrivateHostnames: boolify(process.env.ALLOW_PRIVATE_HOSTNAMES, false),

  // Request info
  userAgents: require('./userAgents'),

  // CORS (Cross-Origin Resource Sharing)
  cors: {
    enabled: boolify(process.env.ENABLE_CORS, false),
    origin: process.env.CORS_ORIGINS === '*' ? true : process.env.CORS_ORIGINS,
    maxAge: process.env.CORS_MAX_AGE || 86400
  },

  // Caching
  memcached: process.env.MEMCACHED_HOSTS || '',
  defaultCacheTtl: process.env.DEFAULT_CACHE_TTL || 120
}

const testConfig = {
  socketTimeout: 250,
  connectTimeout: 250,
  maxBytes: 262144,
  allowPrivateHostnames: true,
  logLevel: 'fatal'
}

const isTest = typeof __TEST__ !== 'undefined'
const config = Object.assign({}, defaultConfig, isTest ? testConfig : {})

function boolify(envVar, defValue) {
  if (typeof envVar === 'undefined') {
    return defValue
  }

  if (envVar === '1' || envVar === '0') {
    return envVar === '1'
  }

  if (envVar === 'true' || envVar === 'false') {
    return envVar === 'true'
  }

  return defValue
}

module.exports = config
