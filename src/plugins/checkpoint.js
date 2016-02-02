import Boom from 'boom'
import get from 'lodash/get'
import memoize from 'lodash/memoize'
import pebblesClient from '@bengler/pebbles-client'
import clientClasses from '@bengler/pebbles-client/clients'
import config from '../../config/config'

const getCheckpoint = memoize(baseUrl => {
  const connector = new pebblesClient.Connector({baseUrl, clientClasses})
  connector.use({checkpoint: 1})
  return connector.checkpoint
})

const validateSession = (req, reply) => {
  if (!get(req, 'route.settings.plugins.checkpoint.requireSession', false)) {
    return reply.continue()
  }

  const sessionId = req.state.session || req.query.session
  if (!sessionId) {
    return reply(Boom.unauthorized('Checkpoint session required to access this endpoint'))
  }

  const host = config.pebblesHost || `${req.connection.info.protocol}://${req.headers.host}`
  getCheckpoint(host).get('/identities/me', {session: sessionId}).then(result => {
    if (result.body.identity) {
      return reply.continue()
    }

    return reply(Boom.unauthorized('Checkpoint session is invalid'))
  }).catch(error => {
    return reply(Boom.unauthorized('Failed to verify checkpoint session'))
  })
}

const register = (server, options, next) => {
  server.ext('onPreHandler', validateSession)
  next()
}

register.attributes = {
  name: 'checkpoint',
  version: '1.0.0'
}

export default {register}
