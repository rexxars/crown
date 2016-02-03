import createServer from './createServer'
import {readFileSync} from 'fs'
import {join} from 'path'

export default cb =>
  createServer((req, res) => {
    res.write(readFileSync(join(__dirname, 'example-doc.html')))
  }, 'http', cb)
