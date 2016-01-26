import Hapi from 'hapi'
import config from '../config/config'
import resolve, {config as resolveConfig} from './controllers/resolve'
import validate, {config as validateConfig} from './controllers/validate'

const server = new Hapi.Server()
server.connection({
  host: config.host,
  port: config.port
})

server.route({
  method: 'GET',
  path: config.rootPath,
  handler: resolve,
  config: resolveConfig
})

server.route({
  method: 'GET',
  path: `${config.rootPath}/validate`,
  handler: validate,
  config: validateConfig
})

server.start(err => {
  if (err) {
    throw err
  }
})

export default server
