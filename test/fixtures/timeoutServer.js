const {join} = require('path')
const {readFileSync} = require('fs')
const createServer = require('./createServer')

const handler = (req, res) => {
  res.write('   ')
  setTimeout(() => {
    res.write(readFileSync(join(__dirname, 'example-doc.html')))
    res.end()
  }, 3000)
}

module.exports = cb => createServer(handler, 'http', cb)
