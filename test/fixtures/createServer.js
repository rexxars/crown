const net = require('net')
const http = require('http')
const methods = {net, http}

module.exports = (fn, type, cb) => {
  const server = methods[type]
    .createServer(fn)
    .listen(0)
    .on('listening', () => {
      cb(null, `http://localhost:${server.address().port}`)
    })

  return server
}
