const createServer = require('./createServer')

let i = 0

exports.infiniteRedirectServer = (cb) =>
  createServer(
    (req, res) => {
      res.writeHead(301, {Location: `/${++i}`})
      res.end()
    },
    'http',
    cb
  )

exports.redirectServer = (cb) =>
  createServer(
    (req, res) => {
      if (req.url === '/') {
        res.writeHead(301, {Location: '/home'})
      } else {
        res.writeHead(200, {})
        res.write('<head><title>Foo</title></head>')
      }
      res.end()
    },
    'http',
    cb
  )
