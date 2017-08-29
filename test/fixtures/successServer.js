const {join} = require('path')
const {readFileSync} = require('fs')
const createServer = require('./createServer')

const handler = (req, res) => {
  res.write(readFileSync(join(__dirname, 'example-doc.html')))
  res.end()
}

module.exports = () => createServer(handler, 'http')
