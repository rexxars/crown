const cheerio = require('cheerio')
const {Joi, celebrate, Segments} = require('celebrate')
const {memoize} = require('lodash')
const express = require('express')
const openGraph = require('../extractors/openGraph')
const microData = require('../extractors/microData')
const appLinks = require('../extractors/appLinks')
const meta = require('../extractors/meta')
const normalizeError = require('../util/normalizeError')

const extractors = {meta, openGraph, appLinks, microData}
const extractorNames = Object.keys(extractors)

const router = express.Router()

router.get(
  '/',
  celebrate({
    [Segments.QUERY]: Joi.object().keys({
      url: Joi.string()
        .required()
        .uri({scheme: ['http', 'https']}),
      maxRedirects: Joi.number().integer().min(0).max(10),
      extract: Joi.array()
        .single()
        .items(
          Joi.string()
            .valid(...extractorNames)
            .allow('*')
        )
        .default(['meta', 'openGraph']),
      tag: Joi.string(),
    }),
  }),
  resolve
)

async function resolve(req, res, next) {
  // If the string value `*` is in the extract array, treat it as "extract everything"
  const extractAll = req.query.extract.includes('*')
  const usedExtractors = extractAll ? extractorNames : req.query.extract
  const requiresBody = usedExtractors.some(
    (extractor) => extractors[extractor].requiresDocumentBody
  )

  // Try to perform request
  let response
  let error
  try {
    response = await req.app.services.requester({
      method: 'GET',
      url: req.query.url,
      requiresBody: requiresBody,
    })
  } catch (err) {
    error = err
  }

  // Handle request errors or upstream errors
  if (error || response.statusCode >= 300) {
    error = normalizeError(error, response)
    if (error instanceof Error || error.isBoom) {
      next(error)
      return
    }

    if (error.code) {
      res.json({error, statusCode: response && response.statusCode})
      return
    }
  }

  // Memoize to allow lazy-parsing, yet be efficient when multiple extractors need it
  const getParsedDocument = memoize(() => cheerio.load(response.body))

  // Reduce extractor values into one object for the response
  const result = extractorNames.reduce(
    (reply, extractor) => {
      // If the user has not enabled the extractor, don't call the extractor
      if (!extractAll && !req.query.extract.includes(extractor)) {
        return reply
      }

      // Assign a key in the response with the same name as the extractor, populating
      // the value with a promise which will be resolved once completed
      reply[extractor] = extractors[extractor](response, getParsedDocument)
      return reply
    },
    {
      statusCode: response.statusCode,
      resolvedUrl: response.url,
    }
  )

  // @todo Cache the result
  // cache.set(`crown-${req.url.href}`, result, cache.ttl(res), () => {})
  res.json(result)
}

module.exports = router
