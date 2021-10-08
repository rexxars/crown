const createServer = require('./createServer')
const {readFileSync} = require('fs')
const {join} = require('path')

module.exports = (cb) =>
  createServer(
    (req, res) => {
      let chunks = 0
      const preamble = Buffer.alloc(128000, ' ')

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
    },
    'http',
    cb
  )
