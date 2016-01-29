import url from 'url'
import {toJson as microdata} from 'microdata-node'

const extractMicroData = (body, req, getParsedDoc, resolvedUrl) =>
  microdata(body, {
    base: url.resolve(resolvedUrl, '/').replace(/\/$/, '')
  })

export default extractMicroData
