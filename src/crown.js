import config from '../config/config'
import initServer from './server'

initServer(config).start(err => {
  if (err) {
    throw err
  }
})
