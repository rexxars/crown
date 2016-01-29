import Joi from 'joi'
import cheerio from 'cheerio'
import promiseProps from 'promise-props-recursive'
import {requestHandler, config as requestConfig} from './requestHandler'
import {memoize} from 'lodash'
import openGraph from '../extractors/openGraph'
import microData from '../extractors/microData'
import appLinks from '../extractors/appLinks'
import meta from '../extractors/meta'

const extractors = {meta, openGraph, appLinks, microData}
const extractorNames = Object.keys(extractors)

const handleSuccess = (req, res, body, resolvedUrl) => {
  // Memoize to allow lazy-parsing, yet efficient when multiple extractors need it
  const getParsedDocument = memoize(() => cheerio.load(body))

  // If the string value `*` is in the extract array, treat it as "extract everything"
  const extractAll = req.query.extract.includes('*')

  // Loop over all the available extractors, creating promises. Return a promise
  // that resolves once all extractors have resolved their values (or one fails)
  return promiseProps(extractorNames.reduce((reply, extractor) => {
    // If the user has not enabled the extractor, don't call the extractor
    if (!extractAll && !req.query.extract.includes(extractor)) {
      return reply
    }

    // Assign a key in the response with the same name as the extractor, populating
    // the value with a promise which will be resolved once completed
    reply[extractor] = extractors[extractor](body, req, getParsedDocument, resolvedUrl)
    return reply
  }, {
    statusCode: res.statusCode,
    resolvedUrl: resolvedUrl
  }))
}

const resolveHandler = requestHandler('GET', handleSuccess)

const renameOptions = {override: true, ignoreUndefined: true, alias: true}
const allowedQueryParams = Object.assign({
  extract: Joi.array()
    .single()
    .items(Joi.string().allow(extractorNames).allow('*'))
    .default(['meta', 'openGraph'])
}, requestConfig.validate.query)

export const config = {
  validate: {
    query: Joi.object()
      .keys(allowedQueryParams)
      .nand('extract[]', 'extract')
      .rename('extract[]', 'extract', renameOptions)
  }
}

export default resolveHandler
