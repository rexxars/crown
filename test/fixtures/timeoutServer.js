import createServer from './createServer'
import {readFileSync} from 'fs'
import {join} from 'path'

export default cb =>
  createServer((req, res) => {
    res.write('   ')
    setTimeout(() => {
      res.write(readFileSync(join(__dirname, 'example-doc.html')))
      res.end()
    }, 3000)
  }, 'http', cb)
