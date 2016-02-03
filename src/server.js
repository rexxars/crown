import Hapi from 'hapi'
import getResolveHandler, {config as resolveConfig} from './handlers/resolveHandler'
import checkpoint from './plugins/checkpoint'

const initServer = config => {
  const server = new Hapi.Server({
    connections: {
      routes: {
        cors: {
          origin: config.corsOrigins.split(',').map(str => str.trim()).filter(Boolean),
          maxAge: config.corsMaxAge
        }
      }
    }
  })

  server.connection({
    host: config.host,
    port: config.port
  })

  if (config.useCheckpoint) {
    server.register({register: checkpoint})
  }

  server.route({
    method: 'GET',
    path: config.rootPath,
    handler: getResolveHandler(config),
    config: resolveConfig
  })

  if (config.rootPath !== '/') {
    server.route({
      method: 'GET',
      path: '/',
      handler: (request, reply) => {
        reply({
          statusCode: 404,
          error: `Not Found (did you mean ${config.rootPath}?)`
        }).code(404)
      }
    })
  }

  return server
}

export default initServer
