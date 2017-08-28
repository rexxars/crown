const {camelCase} = require('lodash')

const extractAppLinks = (response, getParsedDoc) => {
  const doc = getParsedDoc()

  const alProps = {}
  doc.root().find('meta[property^=al], meta[name^=al]').each((i, item) => {
    const el = doc(item)
    const key = (el.attr('property') || el.attr('name')).replace(/^al:/, '')

    alProps[camelCase(key)] = el.attr('content')
  })

  return alProps
}

module.exports = extractAppLinks
