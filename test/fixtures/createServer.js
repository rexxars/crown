const net = require('net')
const http = require('http')
const methods = {net, http}

module.exports = (fn, type) => {
  return new Promise((resolve, reject) => {
    const server = methods[type].createServer(fn).listen(0).on('listening', () => resolve(server))
  })
}
