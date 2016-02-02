import Hapi from 'hapi'
import config from '../config/config'
import resolveHandler, {config as resolveConfig} from './handlers/resolveHandler'
import checkpoint from './plugins/checkpoint'

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
  handler: resolveHandler,
  config: resolveConfig
})

if (config.rootPath !== '/') {
  server.route({
    method: 'GET',
    path: '/{p*}',
    handler: (request, reply) => {
      // Provide the user with a helpful hint if request did not use root path
      const help = request.url.path.indexOf(config.rootPath) === 0
        ? '' : ` - (did you mean ${config.rootPath}${request.url.path}?)`

      reply({
        statusCode: 404,
        error: `Not Found${help}`
      }).code(404)
    }
  })
}

// Set error data to be "safe" to return to users
server.ext('onPreResponse', (request, reply) => {
  const response = request.response
  if (!response.isBoom || !response.data) {
    return reply.continue()
  }

  response.output.payload = Object.assign({}, response.output.payload, response.data)
  return reply(response)
})

server.start(err => {
  if (err) {
    throw err
  }
})

export default server
