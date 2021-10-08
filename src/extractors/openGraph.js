const {camelCase} = require('lodash')

const extractOpenGraph = (response, getParsedDoc) => {
  const doc = getParsedDoc()

  const ogProps = {}
  doc
    .root()
    .find('meta[property^=og], meta[name^=og]')
    .each((i, item) => {
      const el = doc(item)
      const key = (el.attr('property') || el.attr('name')).replace(/^og:/, '')

      ogProps[camelCase(key)] = el.attr('content')
    })

  return ogProps
}

module.exports = extractOpenGraph
