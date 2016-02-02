import Joi from 'joi'
import cheerio from 'cheerio'
import {memoize} from 'lodash'
import cache from '../cache'
import request from '../request'
import appConfig from '../../config/config'
import {handleError, isNotHttpOk} from './errorHandler'
import openGraph from '../extractors/openGraph'
import microData from '../extractors/microData'
import appLinks from '../extractors/appLinks'
import meta from '../extractors/meta'

const extractors = {meta, openGraph, appLinks, microData}
const extractorNames = Object.keys(extractors)

const handleSuccess = (req, res, body, resolvedUrl) => {
  // Memoize to allow lazy-parsing, yet be efficient when multiple extractors need it
  const getParsedDocument = memoize(() => cheerio.load(body))

  // If the string value `*` is in the extract array, treat it as "extract everything"
  const extractAll = req.query.extract.includes('*')

  // Reduce extractor values into one object for the response
  const result = extractorNames.reduce((reply, extractor) => {
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
  })

  // Store the results in cache
  cache.set(`crown-${req.url.href}`, result, cache.ttl(res), () => {})
  return result
}

const resolveHandler = (req, reply) => {
  // If the string value `*` is in the extract array, treat it as "extract everything"
  const usedExtractors = req.query.extract.includes('*') ? extractorNames : req.query.extract
  const requiresBody = usedExtractors.some(extractor => extractors[extractor].requiresDocumentBody)

  let resolvedUrl = req.query.url
  request({
    method: 'GET',
    url: req.query.url,
    redirects: req.query.maxRedirects || 3,
    timeout: appConfig.timeout,
    requiresBody: requiresBody,
    redirected: (status, location) => resolvedUrl = location
  }, (err, res, body) => {
    reply(
      err || isNotHttpOk(res)
      ? handleError(err, res, resolvedUrl)
      : handleSuccess(req, res, body, resolvedUrl)
    )
  })
}

const cachedResolveHandler = (req, reply) => {
  cache.get(`crown-${req.url.href}`, (ignore, data) => {
    if (data) {
      return reply(data)
    }

    resolveHandler(req, reply)
  })
}

export default cachedResolveHandler

export const config = {
  validate: {
    query: Joi.object()
      .keys({
        url: Joi.string().required().uri({scheme: ['http', 'https']}),
        maxRedirects: Joi.number().integer().min(0).max(10),
        session: Joi.string(),
        extract: Joi.array()
          .single()
          .items(Joi.string().allow(extractorNames).allow('*'))
          .default(['meta', 'openGraph'])
      })
      .nand('extract[]', 'extract')
      .rename('extract[]', 'extract', {override: true, ignoreUndefined: true, alias: true})
  },
  plugins: {
    checkpoint: {
      requireSession: true // only used if checkpoint is enabled in configuration
    }
  }
}
