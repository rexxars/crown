/* eslint-disable no-process-env */
export default {
  host: process.env.HOST || '0.0.0.0',
  port: process.env.PORT || 8000,
  rootPath: process.env.ROOT_PATH || '/api/crown/v1'
}
