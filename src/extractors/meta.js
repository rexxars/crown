const {camelCase} = require('lodash')

const whitelist = ['title', 'description']

const extractMeta = (response, getParsedDoc) => {
  const doc = getParsedDoc()

  const metaProps = {}
  doc
    .root()
    .find('meta')
    .each((i, item) => {
      const el = doc(item)
      const key = el.attr('name') || el.attr('property')

      if (whitelist.includes(key)) {
        metaProps[camelCase(key)] = el.attr('content')
      }
    })

  metaProps.title = metaProps.title || doc.root().find('title').text()

  return metaProps
}

module.exports = extractMeta
