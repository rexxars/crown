const parseUrl = require('url').parse
const {isPrivate} = require('hostname-is-private')

module.exports = uri =>
  new Promise((resolve, reject) => {
    const url = parseUrl(uri, false, true)
    isPrivate(url.hostname, (err, urlIsPrivate) => {
      if (err) {
        reject(err)
        return
      }

      resolve(urlIsPrivate)
    })
  })
