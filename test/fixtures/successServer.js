const {join} = require('path')
const {readFileSync} = require('fs')
const createServer = require('./createServer')

module.exports = cb =>
  createServer(
    (req, res) => {
      res.write(readFileSync(join(__dirname, 'example-doc.html')))
    },
    'http',
    cb
  )
