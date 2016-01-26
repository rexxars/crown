/* eslint-disable no-process-env */
export default {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 8000,
  rootPath: process.env.ROOT_PATH || '/api/crown/v1',
  timeout: process.env.TIMEOUT || 3000,
  allowPrivateHostnames: boolify(process.env.ALLOW_PRIVATE_HOSTNAMES, false)
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
