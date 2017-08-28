const url = require('url')
const microdata = require('microdata-node')

const extractMicroData = (response, getParsedDoc) =>
  microdata.toJson(response.body, {
    base: url.resolve(response.url, '/').replace(/\/$/, '')
  })

extractMicroData.requiresDocumentBody = true

module.exports = extractMicroData
