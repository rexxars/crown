/* eslint-disable no-process-env */
export default {
  // Core server configuraton
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 8000,
  rootPath: process.env.ROOT_PATH || '/api/crown/v1',

  // Security and durability
  timeout: process.env.TIMEOUT || 3000,
  maxBytes: process.env.MAX_BYTES || 1048576, // 1 MB
  allowPrivateHostnames: boolify(process.env.ALLOW_PRIVATE_HOSTNAMES, false),

  // CORS (Cross-Origin Resource Sharing)
  corsOrigins: process.env.CORS_ORIGINS || '*',
  corsMaxAge: process.env.CORS_MAX_AGE || 86400,

  // Caching
  memcached: process.env.MEMCACHED_HOSTS || '',
  defaultCacheTtl: process.env.DEFAULT_CACHE_TTL || 120,

  // Checkpoint plugin if running inside of pebbles stack
  useCheckpoint: boolify(process.env.CHECKPOINT, false),
  pebblesHost: process.env.PEBBLE_HOST // Only used if `useCheckpoint` is true
}

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
