import Hapi from 'hapi'
import config from '../config/config'
import resolveHandler, {config as resolveConfig} from './handlers/resolveHandler'
import validationHandler, {config as validateConfig} from './handlers/validationHandler'

const server = new Hapi.Server()
server.connection({
  host: config.host,
  port: config.port
})

server.route({
  method: 'GET',
  path: config.rootPath,
  handler: resolveHandler,
  config: resolveConfig
})

server.route({
  method: 'GET',
  path: `${config.rootPath}/validate`,
  handler: validationHandler,
  config: validateConfig
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
