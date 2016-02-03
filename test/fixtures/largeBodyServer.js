import createServer from './createServer'
import {readFileSync} from 'fs'
import {join} from 'path'

export default cb =>
  createServer((req, res) => {
    let chunks = 0
    const preamble = new Buffer(128000)
    preamble.fill(' ')

    const sendChunk = () => {
      res.write(preamble)

      if (++chunks === 5) {
        res.write(readFileSync(join(__dirname, 'example-doc.html')))
        res.end()
      } else {
        setTimeout(sendChunk, 25)
      }
    }

    sendChunk()
  }, 'http', cb)
